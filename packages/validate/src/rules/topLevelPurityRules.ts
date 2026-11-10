import * as path from 'path';
import { SourceFile, SyntaxKind } from 'ts-morph';
import { ValidationError } from '../types.js';

import { SourceFile, SyntaxKind } from 'ts-morph';
import { ValidationError } from '../types.js';

export function checkTopLevelPurity(
  sf: SourceFile
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const filePath = sf.getFilePath();
  const baseName = path.basename(filePath);

  const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
  const isBackendTopLevel =
    /^(server|app|index)\.(ts|js)$/i.test(baseName) &&
    !filePath.includes('/components/') &&
    !filePath.includes('/orchestrations/') &&
    !filePath.includes('/services/') &&
    !filePath.includes('/libraries/');

  if (isUiTopLevel) {
    const jsxElements = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
    const jsxSelfClosing = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
    const allJsxTags = [...jsxElements, ...jsxSelfClosing];

    for (const jsx of allJsxTags) {
      const tagName = jsx.getTagNameNode().getText();
      if (/^[a-z]/.test(tagName)) {
        errors.push({
          ruleId: 'krnl/top-level-purity',
          filePath,
          line: jsx.getStartLineNumber(),
          message: `Top-level file '${baseName}' violates Top-Level Purity Law. Raw JSX/HTML element '<${tagName}>' is strictly forbidden. Top-level files must ONLY import and compose React components.`,
          severity: 'error',
        });
      }
    }

    const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if (
        [
          'useState',
          'useEffect',
          'useRef',
          'useMemo',
          'useCallback',
          'useReducer',
          'useContext',
          'useLayoutEffect',
        ].includes(exprText) ||
        (/^use[A-Z]/.test(exprText) && exprText !== 'use')
      ) {
        errors.push({
          ruleId: 'krnl/top-level-purity',
          filePath,
          line: call.getStartLineNumber(),
          message: `Top-level file '${baseName}' violates Top-Level Purity Law. React hook '${exprText}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.`,
          severity: 'error',
        });
      }
    }
  }

  if (isBackendTopLevel) {
    const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if (/^(app|router|server)\.(get|post|put|delete|patch|options|head)$/.test(exprText)) {
        errors.push({
          ruleId: 'krnl/top-level-purity',
          filePath,
          line: call.getStartLineNumber(),
          message: `Backend entry file '${baseName}' violates Entry Purity Law. Inline route definition '${exprText}' is forbidden. Delegate to dedicated route/controller modules.`,
          severity: 'error',
        });
      }
    }
  }

  return { errors, warnings };
}

