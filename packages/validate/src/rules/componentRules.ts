import * as path from 'node:path';
import * as ts from 'typescript';
import type { FrnlValidationDiagnostic } from '../types.js';

function hasJsx(node: ts.Node): boolean {
  let found = false;
  const visit = (current: ts.Node) => {
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current) || ts.isJsxFragment(current)) found = true;
    if (!found) ts.forEachChild(current, visit);
  };
  ts.forEachChild(node, visit);
  return found;
}

function isComponentFunction(node: ts.FunctionDeclaration | ts.VariableDeclaration | ts.ClassDeclaration): boolean {
  const name = node.name && ts.isIdentifier(node.name) ? node.name.text : '';
  if (!/^[A-Z]/.test(name)) return false;
  return hasJsx(node);
}

function topLevelComponents(sf: ts.SourceFile): ts.Node[] {
  const components: ts.Node[] = [];
  for (const statement of sf.statements) {
    if (ts.isFunctionDeclaration(statement) && isComponentFunction(statement)) components.push(statement);
    if (ts.isClassDeclaration(statement) && isComponentFunction(statement)) components.push(statement);
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (isComponentFunction(declaration)) components.push(declaration);
      }
    }
  }
  return components;
}

function nestedComponents(sf: ts.SourceFile): ts.Node[] {
  const nested: ts.Node[] = [];
  const visit = (node: ts.Node) => {
    if (node !== sf && (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isVariableDeclaration(node)) && isComponentFunction(node as any)) {
      if (node.parent !== sf && !ts.isVariableStatement(node.parent)) nested.push(node);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sf, visit);
  return nested;
}

export function checkComponentRules(filePath: string, source: string): FrnlValidationDiagnostic[] {
  if (!/\.(tsx|jsx)$/.test(filePath)) return [];
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX);
  const diagnostics: FrnlValidationDiagnostic[] = [];
  const components = topLevelComponents(sf);
  if (components.length > 1) {
    diagnostics.push({
      ruleId: 'frnl/one-component-per-file',
      filePath,
      line: sf.getLineAndCharacterOfPosition(components[1].getStart(sf)).line + 1,
      message: `File '${path.basename(filePath)}' defines multiple React components. Define every component in its own file.`,
      severity: 'error',
    });
  }
  for (const node of nestedComponents(sf)) {
    diagnostics.push({
      ruleId: 'frnl/no-nested-component-declaration',
      filePath,
      line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
      message: 'React components may not be declared inside another component/file-local function. Move the nested component to its own file and give it its own Frnl scaffold.',
      severity: 'error',
    });
  }
  return diagnostics;
}
