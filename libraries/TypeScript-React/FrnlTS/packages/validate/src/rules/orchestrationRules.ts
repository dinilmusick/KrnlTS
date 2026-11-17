import * as ts from 'typescript';
import type { FrnlValidationDiagnostic } from '../types.js';

export const FRNL_ORCHESTRATION_MAX_LINES = 200;

export function checkOrchestrationRules(
  filePath: string,
  source: string,
): FrnlValidationDiagnostic[] {
  const normalized = filePath.replace(/\\/g, '/');
  if (!/\/orchestrations\/[^/]+\.ts$/.test(normalized)) return [];

  const diagnostics: FrnlValidationDiagnostic[] = [];
  const lines = source.split(/\r?\n/).length;
  if (lines > FRNL_ORCHESTRATION_MAX_LINES) {
    diagnostics.push({
      ruleId: 'frnl/orchestration-line-limit',
      filePath,
      message: `Orchestration file has ${lines} lines; the hard limit is ${FRNL_ORCHESTRATION_MAX_LINES} lines.`,
      severity: 'error',
    });
  }

  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const importsFrnl = sf.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      (statement.moduleSpecifier as ts.StringLiteral).text.includes('frnlts'),
  );
  const usesDefinition = source.includes('defineFrnlOrchestration(');
  if (!importsFrnl || !usesDefinition) {
    diagnostics.push({
      ruleId: 'frnl/orchestration-definition-required',
      filePath,
      message: 'Page orchestration files must define a Frnl orchestration with defineFrnlOrchestration.',
      severity: 'error',
    });
  }

  return diagnostics;
}
