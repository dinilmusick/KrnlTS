import { SourceFile } from 'ts-morph';
import { ValidationError } from '../types.js';

export interface FileLimitOptions {
  maxFileLineLimit: number;
  maxHelperLineLimit: number;
  maxMainLogicLimit: number;
}

export function checkFileLimits(
  sf: SourceFile,
  options: FileLimitOptions
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getText();
  const lines = sourceText.split('\n');

  // 1. File Line Limit
  if (lines.length > options.maxFileLineLimit) {
    errors.push({
      ruleId: 'krnl/file-line-limit',
      filePath,
      message: `File exceeds maximum length of ${options.maxFileLineLimit} lines (currently ${lines.length} lines). Decompose into sub-components, custom hooks, quad-units, or concept libraries.`,
      severity: 'error',
    });
  }

  // 2. NodeNext Import Suffix Rule
  for (const decl of sf.getImportDeclarations()) {
    const moduleSpec = decl.getModuleSpecifierValue();
    if (
      moduleSpec.startsWith('.') &&
      !moduleSpec.endsWith('.js') &&
      !moduleSpec.endsWith('.json') &&
      !moduleSpec.endsWith('.css') &&
      !moduleSpec.endsWith('.svg') &&
      !moduleSpec.endsWith('.png')
    ) {
      errors.push({
        ruleId: 'krnl/import-suffix',
        filePath,
        line: decl.getStartLineNumber(),
        message: `Relative import '${moduleSpec}' must end with '.js' for NodeNext module resolution.`,
        severity: 'error',
      });
    }
  }

  // 3. Helper line length limit
  const isHelper =
    filePath.includes('helper_functions') ||
    filePath.includes('/helpers/') ||
    filePath.includes('\\helpers\\');
  if (isHelper) {
    for (const fn of sf.getFunctions()) {
      const fnLines = fn.getText().split('\n').length;
      if (fnLines > options.maxHelperLineLimit && !sourceText.includes('Concepts.')) {
        errors.push({
          ruleId: 'krnl/helper-line-limit',
          filePath,
          line: fn.getStartLineNumber(),
          message: `Helper function '${fn.getName() || 'anonymous'}' exceeds ${options.maxHelperLineLimit} lines (${fnLines} lines). Must delegate to a root libraries/{Domain}Concepts.ts library.`,
          severity: 'error',
        });
      }
    }
  }

  // 4. Main Logic substantive lines
  const isMainLogic = filePath.endsWith('logic.ts') || filePath.endsWith('logic.js');
  if (isMainLogic) {
    const substantiveLines = lines.filter((l) => {
      const trimmed = l.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('/*') &&
        !trimmed.startsWith('*')
      );
    });
    if (
      substantiveLines.length > options.maxMainLogicLimit &&
      !sourceText.includes('helpers') &&
      !sourceText.includes('Concepts') &&
      !sourceText.includes('state')
    ) {
      errors.push({
        ruleId: 'krnl/main-delegation',
        filePath,
        message: `Main logic function has ${substantiveLines.length} substantive lines without delegating to Layer 1 helper functions or Layer 0 libraries.`,
        severity: 'error',
      });
    }
  }

  return { errors, warnings };
}
