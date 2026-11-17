import * as ts from 'typescript';
import type { FrnlValidationDiagnostic } from '../types.js';

export const FRNL_COMPONENT_MAX_LINES = 199;
export const FRNL_EVENT_MAX_SUBSTANTIVE_LINES = 8;

function substantiveLines(source: string): number {
  return source.split(/\r?\n/).filter((line) => {
    const t = line.trim();
    return t && !t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*') && !t.startsWith('*/');
  }).length;
}

export function checkFileLimits(filePath: string, source: string): FrnlValidationDiagnostic[] {
  const diagnostics: FrnlValidationDiagnostic[] = [];
  const lineCount = source.split(/\r?\n/).length;
  if (/\.(tsx|jsx)$/.test(filePath) && lineCount > FRNL_COMPONENT_MAX_LINES) {
    diagnostics.push({
      ruleId: 'frnl/component-line-limit',
      filePath,
      message: `React component file has ${lineCount} lines; the hard limit is ${FRNL_COMPONENT_MAX_LINES} lines.`,
      severity: 'error',
    });
  }
  if (/[/\\]States[/\\][^/\\]+[/\\]Events[/\\][^/\\]+\.ts$/.test(filePath)) {
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const functions = sf.statements.filter(ts.isFunctionDeclaration);
    const substantive = substantiveLines(source);
    if (functions.length > 0 && substantive > FRNL_EVENT_MAX_SUBSTANTIVE_LINES) {
      diagnostics.push({
        ruleId: 'frnl/event-main-delegation',
        filePath,
        line: functions[0] ? sf.getLineAndCharacterOfPosition(functions[0].getStart(sf)).line + 1 : undefined,
        message: `State event implementation has ${substantive} substantive lines; event functions must stay small and delegate implementation to component Libraries (maximum ${FRNL_EVENT_MAX_SUBSTANTIVE_LINES} substantive lines).`,
        severity: 'error',
      });
    }
  }
  return diagnostics;
}

export function checkImportRules(filePath: string, source: string): FrnlValidationDiagnostic[] {
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return sf.statements.filter(ts.isImportDeclaration).flatMap((decl) => {
    const spec = (decl.moduleSpecifier as ts.StringLiteral).text;
    if (spec.startsWith('.') && !spec.endsWith('.js') && !spec.endsWith('.json') && !spec.endsWith('.css') && !spec.endsWith('.svg') && !spec.endsWith('.png')) {
      return [{
        ruleId: 'frnl/import-suffix',
        filePath,
        line: sf.getLineAndCharacterOfPosition(decl.getStart(sf)).line + 1,
        message: `Relative import '${spec}' must end with '.js' for NodeNext module resolution.`,
        severity: 'error' as const,
      }];
    }
    return [];
  });
}
