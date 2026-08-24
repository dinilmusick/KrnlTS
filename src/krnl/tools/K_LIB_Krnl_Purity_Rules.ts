/**
 * @file K_LIB_Krnl_Purity_Rules.ts
 * @role component
 * @description Static AST and rule validators for 4-layer function purity, delegation limits, and context traps.
 */

import * as path from 'path';

export interface PurityValidationResult {
  errors: string[];
  warnings: string[];
}

export class KrnlPurityRules {
  /**
   * Asserts file line limit is <= 200 lines.
   */
  static checkFileLineLimit(filePath: string, source: string): string | null {
    const lineCount = source.split('\n').length;
    if (lineCount > 200) {
      return `[ERR_FILE_LINE_LIMIT_EXCEEDED] '${path.basename(filePath)}' has ${lineCount} lines (strict maximum is 200 lines).`;
    }
    return null;
  }

  /**
   * Asserts all local relative imports end in .js suffix.
   */
  static checkImportSuffixes(filePath: string, source: string): string[] {
    const errors: string[] = [];
    const importMatches = source.matchAll(/import\s+.*?from\s+['"](\.[^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
        errors.push(
          `[ERR_MISSING_JS_IMPORT_SUFFIX] In '${path.basename(filePath)}': Import '${importPath}' must end with '.js' for NodeNext compatibility.`
        );
      }
    }
    return errors;
  }

  /**
   * Checks for the silent context destructuring trap ({ state, system } instead of { state, entity }).
   */
  static checkContextDestructuring(filePath: string, source: string): string | null {
    if (/main\s*=\s*async\s*\([^,]+,\s*\{[^}]*\bsystem\b[^}]*\}\s*\)/.test(source) ||
        /export\s+const\s+main\s*=\s*async\s*\([^,]+,\s*\{[^}]*\bsystem\b[^}]*\}\s*\)/.test(source)) {
      return `[ERR_CONTEXT_DESTRUCTURING_TRAP] In '${path.basename(filePath)}': Context parameter destructures 'system'. Functionality context passes { state, entity }. Always destructure 'entity' (or alias as 'entity: system').`;
    }
    return null;
  }

  /**
   * Asserts that helper functions do not import state or perform I/O, and obey the 30-line threshold.
   */
  static checkHelperPurity(filePath: string, source: string): string[] {
    const errors: string[] = [];
    const isHelper = filePath.includes('helper_functions') || filePath.includes('/helpers/') || filePath.includes('\\helpers\\');
    if (!isHelper) return errors;

    if (/import\s+.*state.*from/.test(source) || /import\s+.*(fs|http|ws).*from/.test(source)) {
      errors.push(
        `[ERR_HELPER_PURITY_VIOLATION] In '${path.basename(filePath)}': Helper functions (Layer 0A) must be pure and cannot import state or I/O modules.`
      );
    }

    const functions = source.split(/(?:export\s+)?function\s+/);
    for (let i = 1; i < functions.length; i++) {
      const fnBody = functions[i];
      const fnLines = fnBody.split('\n').length;
      if (fnLines > 30 && !fnBody.includes('Concepts.')) {
        errors.push(
          `[ERR_HELPER_LINE_LIMIT_EXCEEDED] In '${path.basename(filePath)}': Helper function exceeds 30 lines (${fnLines} lines). Must delegate to a universal libraries/{Domain}Concepts.ts function.`
        );
      }
    }

    return errors;
  }

  /**
   * Checks main_function logic for excessive consecutive code without delegation (max 20 lines).
   */
  static checkMainDelegation(filePath: string, source: string): string[] {
    const errors: string[] = [];
    const isMainLogic = filePath.endsWith('logic.ts') || filePath.endsWith('logic.js');
    if (!isMainLogic) return errors;

    const lines = source.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('/*'));
    if (lines.length > 20 && !source.includes('helpers') && !source.includes('helper') && !source.includes('Concepts') && !source.includes('state')) {
      errors.push(
        `[ERR_MAIN_DELEGATION_REQUIRED] In '${path.basename(filePath)}': Main logic function has ${lines.length} lines of inline code without delegating to helpers or state accessors.`
      );
    }
    return errors;
  }
}
