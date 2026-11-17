import * as fs from 'node:fs';
import * as path from 'node:path';
import { checkComponentRules } from './rules/componentRules.js';
import { checkFileLimits, checkImportRules } from './rules/fileLimits.js';
import { checkComponentScaffolds, checkFrnlPageArchitecture, collectWorkspaceFiles } from './workspaceRules.js';
import { checkScopedLibraryRules } from './rules/scopedLibraryRules.js';
import { checkOrchestrationRules } from './rules/orchestrationRules.js';
import type { FrnlValidationDiagnostic, FrnlValidationResult, FrnlPromotableAsset } from './types.js';

export type { FrnlValidationDiagnostic, FrnlValidationResult, FrnlPromotableAsset } from './types.js';
export { FRNL_COMPONENT_MAX_LINES, FRNL_EVENT_MAX_SUBSTANTIVE_LINES } from './rules/fileLimits.js';
export { FRNL_ORCHESTRATION_MAX_LINES } from './rules/orchestrationRules.js';

export function validateFrnlWorkspace(root: string = process.cwd()): FrnlValidationResult {
  const errors: FrnlValidationDiagnostic[] = [];
  const warnings: FrnlValidationDiagnostic[] = [];
  const promotableAssets: FrnlPromotableAsset[] = [];

  for (const filePath of collectWorkspaceFiles(root)) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const diagnostic of [
      ...checkComponentRules(filePath, source),
      ...checkFileLimits(filePath, source),
      ...checkImportRules(filePath, source),
      ...checkOrchestrationRules(filePath, source),
    ]) {
      (diagnostic.severity === 'error' ? errors : warnings).push(diagnostic);
    }

    const scoped = checkScopedLibraryRules(filePath, source);
    for (const diagnostic of scoped.diagnostics) {
      (diagnostic.severity === 'error' ? errors : warnings).push(diagnostic);
    }
    promotableAssets.push(...scoped.promotableAssets);
  }
  for (const diagnostic of [...checkComponentScaffolds(root), ...checkFrnlPageArchitecture(root)]) {
    (diagnostic.severity === 'error' ? errors : warnings).push(diagnostic);
  }
  return { errors, warnings, filesChecked: collectWorkspaceFiles(root).length, passed: errors.length === 0, promotableAssets };
}

export function formatValidation(result: FrnlValidationResult): string {
  const lines = [...result.errors, ...result.warnings].map((d) => `${d.severity.toUpperCase()} ${d.ruleId} ${d.filePath}${d.line ? `:${d.line}` : ''} — ${d.message}`);
  if (result.promotableAssets && result.promotableAssets.length > 0) {
    lines.push(`PROMOTABLE: Found ${result.promotableAssets.length} generic library asset(s) eligible for GutTS promotion:`);
    for (const a of result.promotableAssets) {
      lines.push(`  ✦ [component:${a.scopeName}] ${a.name} (${a.kind}) -> ${a.target}`);
    }
  }
  lines.push(`Checked ${result.filesChecked} files. Errors: ${result.errors.length}. Warnings: ${result.warnings.length}.`);
  return lines.join('\n');
}
