import * as path from 'path';
import { SourceFile, SyntaxKind } from 'ts-morph';
import { ValidationError } from '../types.js';

export function checkComponentRules(
  sf: SourceFile
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const filePath = sf.getFilePath();
  const baseName = path.basename(filePath);

  // 1. One Component Per File
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    const componentNames: string[] = [];

    for (const fn of sf.getFunctions()) {
      const name = fn.getName();
      if (name && /^[A-Z]/.test(name)) {
        const hasJsx =
          fn.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
          fn.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 ||
          fn.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
        if (hasJsx) componentNames.push(name);
      }
    }

    for (const stmt of sf.getVariableStatements()) {
      for (const decl of stmt.getDeclarations()) {
        const name = decl.getName();
        if (/^[A-Z]/.test(name)) {
          const typeText = decl.getTypeNode()?.getText() || '';
          const isFcType =
            typeText.includes('FC') ||
            typeText.includes('FunctionComponent') ||
            typeText.includes('ComponentType');
          const init = decl.getInitializer();
          if (init) {
            const hasJsx =
              init.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
              init.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 ||
              init.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
            if (isFcType || hasJsx) {
              if (!componentNames.includes(name)) componentNames.push(name);
            }
          }
        }
      }
    }

    for (const cls of sf.getClasses()) {
      const name = cls.getName();
      const ext = cls.getExtends()?.getText() || '';
      if (name && (ext.includes('Component') || ext.includes('PureComponent'))) {
        if (!componentNames.includes(name)) componentNames.push(name);
      }
    }

    if (componentNames.length > 1) {
      errors.push({
        ruleId: 'krnl/one-component-per-file',
        filePath,
        message: `File '${baseName}' defines multiple React components (${componentNames.join(
          ', '
        )}). Krnl strictly enforces ONE component per file. Decompose into sub-component files.`,
        severity: 'error',
      });
    }
  }

  // 2. Helper purity (I/O import prohibition)
  const isHelper =
    filePath.includes('helper_functions') ||
    filePath.includes('/helpers/') ||
    filePath.includes('\\helpers\\');
  if (isHelper) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (['fs', 'node:fs', 'http', 'node:http', 'ws'].includes(spec)) {
        errors.push({
          ruleId: 'krnl/helper-purity',
          filePath,
          line: decl.getStartLineNumber(),
          message: `Helper functions (Layer 1) cannot directly import I/O modules ('${spec}'). Delegate to Layer 0 libraries or Entity context.`,
          severity: 'error',
        });
      }
    }
  }

  return { errors, warnings };
}
