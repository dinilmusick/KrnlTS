import * as fs from 'fs';
import * as path from 'path';
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
    /^(server|app)\.(ts|js)$/i.test(baseName) &&
    !filePath.includes('/components/') &&
    !filePath.includes('/entities/') &&
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

export function checkWorkspaceLayout(
  projectRoot: string,
  errors: ValidationError[]
): void {
  const krnlDir = path.join(projectRoot, 'krnl');
  const srcDir = path.join(projectRoot, 'src');
  const targetDir = fs.existsSync(krnlDir) ? krnlDir : fs.existsSync(srcDir) ? srcDir : null;
  if (!targetDir) return;

  const backendDir = path.join(targetDir, 'backend');
  const frontendDir = path.join(targetDir, 'frontend');

  if (fs.existsSync(backendDir)) {
    const bLibs = path.join(backendDir, 'libraries');
    if (fs.existsSync(bLibs)) {
      for (const entry of fs.readdirSync(bLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path.join(bLibs, entry.name);
        if (!fs.existsSync(path.join(libPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/concept-manifest-required',
            filePath: libPath,
            message: `Backend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }

    const bFuncs = path.join(backendDir, 'functionalities');
    if (fs.existsSync(bFuncs)) {
      for (const entry of fs.readdirSync(bFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path.join(bFuncs, entry.name);
        if (!fs.existsSync(path.join(funcPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/functionality-manifest-required',
            filePath: funcPath,
            message: `Backend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }
  }

  if (fs.existsSync(frontendDir)) {
    const fLibs = path.join(frontendDir, 'libraries');
    if (fs.existsSync(fLibs)) {
      for (const entry of fs.readdirSync(fLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path.join(fLibs, entry.name);
        if (!fs.existsSync(path.join(libPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/frontend-concept-manifest-required',
            filePath: libPath,
            message: `Frontend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }

    const fFuncs = path.join(frontendDir, 'functionalities');
    if (fs.existsSync(fFuncs)) {
      for (const entry of fs.readdirSync(fFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path.join(fFuncs, entry.name);
        if (!fs.existsSync(path.join(funcPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/frontend-functionality-manifest-required',
            filePath: funcPath,
            message: `Frontend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }
  }
}
