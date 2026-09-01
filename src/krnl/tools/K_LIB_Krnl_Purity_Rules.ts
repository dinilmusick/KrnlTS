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
   * Asserts Top-Level File Purity for App.tsx, main.ts, server.ts, etc.
   */
  static checkTopLevelPurity(filePath: string, source: string): string[] {
    const errors: string[] = [];
    const baseName = path.basename(filePath);
    const normalized = filePath.replace(/\\/g, '/');

    const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
    const isBackendTopLevel = /^(server|app)\.(ts|js)$/i.test(baseName) &&
      (!normalized.includes('/components/') && !normalized.includes('/entities/') && !normalized.includes('/libraries/'));

    if (isUiTopLevel) {
      // Check for raw HTML / lowercase JSX tags
      const rawTagMatches = source.matchAll(/<([a-z][a-zA-Z0-9-]*)[^>]*>/g);
      for (const m of rawTagMatches) {
        const tag = m[1];
        if (tag && !['fragment', 'react'].includes(tag.toLowerCase())) {
          errors.push(
            `[ERR_TOP_LEVEL_PURITY_VIOLATION] In '${baseName}': Raw JSX/HTML element '<${tag}>' is forbidden. Top-level files must ONLY import and compose React components.`
          );
          break; // One error per file is sufficient
        }
      }

      // Check for React hooks
      const hookMatch = source.match(/\b(useState|useEffect|useRef|useMemo|useCallback|useReducer|useContext|useLayoutEffect|use[A-Z]\w*)\s*\(/);
      if (hookMatch) {
        errors.push(
          `[ERR_TOP_LEVEL_PURITY_VIOLATION] In '${baseName}': React hook '${hookMatch[1]}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.`
        );
      }
    }

    if (isBackendTopLevel) {
      const routeMatch = source.match(/\b(app|router|server)\.(get|post|put|delete|patch|options|head)\s*\(/i);
      if (routeMatch) {
        errors.push(
          `[ERR_TOP_LEVEL_PURITY_VIOLATION] In '${baseName}': Inline route definition '${routeMatch[0]}' is forbidden in backend entry files. Delegate to dedicated route/controller modules.`
        );
      }
    }

    return errors;
  }

  /**
   * Asserts strictly one React component per file in .tsx/.jsx files.
   */
  static checkOneComponentPerFile(filePath: string, source: string): string | null {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return null;
    const baseName = path.basename(filePath);

    // Count component definitions (PascalCase functions or const ArrowFunctions with JSX return)
    const functionComponents = Array.from(source.matchAll(/(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w*)\s*\(/g)).map(m => m[1]);
    const constComponents = Array.from(
      source.matchAll(/(?:export\s+)?const\s+([A-Z]\w*)\s*(?::\s*(?:React\.)?(?:FC|FunctionComponent|ComponentType)[^=]*)?=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g)
    ).map(m => m[1]);

    const allComponents = Array.from(new Set([...functionComponents, ...constComponents]));
    if (allComponents.length > 1) {
      return `[ERR_ONE_COMPONENT_PER_FILE] In '${baseName}': File defines multiple React components (${allComponents.join(', ')}). Krnl strictly enforces ONE component per file. Decompose into separate sub-component files.`;
    }

    return null;
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

