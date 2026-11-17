import * as path from 'node:path';
import * as ts from 'typescript';
import type { FrnlValidationDiagnostic, FrnlPromotableAsset } from '../types.js';

const PRIMITIVE_AND_BUILTIN_TYPES = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'void', 'undefined', 'null', 'never', 'unknown', 'any', 'object',
  'Record', 'Array', 'ReadonlyArray', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Date', 'RegExp', 'Error',
  'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'ArrayBuffer', 'Buffer', 'Iterable', 'AsyncIterable', 'Iterator', 'AsyncIterator', 'Partial', 'Required', 'Readonly',
  'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ConstructorParameters', 'ReturnType', 'InstanceType',
  'React', 'ReactNode', 'ReactElement', 'CSSProperties'
]);

export function detectComponentContext(filePath: string): { componentName: string; librarySubpath: string } | null {
  const normalized = filePath.replace(/\\/g, '/');
  // Match .../components/<ComponentName>/Libraries/... or .../<ComponentName>/Libraries/...
  const match = normalized.match(/(?:^|\/)components\/([^/]+)\/Libraries\/(.+)$/i) ||
                normalized.match(/(?:^|\/)([A-Z][a-zA-Z0-9_-]+)\/Libraries\/(.+)$/);
  if (match) {
    return { componentName: match[1], librarySubpath: match[2] };
  }
  return null;
}

function containsIdentifier(name: string, target: string): boolean {
  return name.toLowerCase().includes(target.toLowerCase());
}

function isContextualType(typeName: string, componentName: string, localTypes: Set<string>): boolean {
  if (PRIMITIVE_AND_BUILTIN_TYPES.has(typeName)) return false;
  if (localTypes.has(typeName)) return true;
  if (containsIdentifier(typeName, componentName)) return true;
  if (/^[A-Z][a-zA-Z0-9]+$/.test(typeName)) return true;
  return false;
}

function checkNodeForContextualTypes(node: ts.Node, componentName: string, localTypes: Set<string>): boolean {
  let hasContext = false;
  const visit = (current: ts.Node) => {
    if (ts.isTypeReferenceNode(current)) {
      const typeText = current.typeName.getText();
      if (isContextualType(typeText, componentName, localTypes)) {
        hasContext = true;
      }
    }
    if (!hasContext) ts.forEachChild(current, visit);
  };
  ts.forEachChild(node, visit);
  return hasContext;
}

export function checkScopedLibraryRules(filePath: string, source: string): {
  diagnostics: FrnlValidationDiagnostic[];
  promotableAssets: FrnlPromotableAsset[];
} {
  const diagnostics: FrnlValidationDiagnostic[] = [];
  const promotableAssets: FrnlPromotableAsset[] = [];

  const context = detectComponentContext(filePath);
  if (!context) {
    return { diagnostics, promotableAssets };
  }

  const { componentName } = context;
  const sf = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  // Gather local types
  const localTypes = new Set<string>();
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name) localTypes.add(stmt.name.text);
    if (ts.isTypeAliasDeclaration(stmt) && stmt.name) localTypes.add(stmt.name.text);
    if (ts.isClassDeclaration(stmt) && stmt.name) localTypes.add(stmt.name.text);
    if (ts.isEnumDeclaration(stmt) && stmt.name) localTypes.add(stmt.name.text);
  }

  for (const stmt of sf.statements) {
    // 1. Functions
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      const fnName = stmt.name.text;
      const isContextual = checkNodeForContextualTypes(stmt, componentName, localTypes);
      const hasCompName = containsIdentifier(fnName, componentName);

      if (isContextual) {
        if (!hasCompName) {
          const line = sf.getLineAndCharacterOfPosition(stmt.getStart(sf)).line + 1;
          diagnostics.push({
            ruleId: 'frnl/component-library-asset-naming',
            filePath,
            line,
            message: `Component library asset '${fnName}' in component '${componentName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning component name ('${componentName}'). Expected name like '${componentName.toLowerCase()}${fnName[0].toUpperCase()}${fnName.slice(1)}', or eliminate contextual custom type dependencies to make it a generic promotable utility.`,
            severity: 'error',
          });
        }
      } else {
        promotableAssets.push({
          name: fnName,
          kind: 'function',
          filePath,
          scope: 'component',
          scopeName: componentName,
          target: 'GutTS',
        });
      }
    }

    // 2. Variables (Arrow functions & data constants)
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const varName = decl.name.text;
        const init = decl.initializer;
        const isFunction = init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init));

        if (isFunction) {
          const isContextual = checkNodeForContextualTypes(decl, componentName, localTypes);
          const hasCompName = containsIdentifier(varName, componentName);

          if (isContextual) {
            if (!hasCompName) {
              const line = sf.getLineAndCharacterOfPosition(decl.getStart(sf)).line + 1;
              diagnostics.push({
                ruleId: 'frnl/component-library-asset-naming',
                filePath,
                line,
                message: `Component library asset '${varName}' in component '${componentName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning component name ('${componentName}'). Expected name containing '${componentName}', or eliminate contextual custom type dependencies to make it a generic promotable utility.`,
                severity: 'error',
              });
            }
          } else {
            promotableAssets.push({
              name: varName,
              kind: 'function',
              filePath,
              scope: 'component',
              scopeName: componentName,
              target: 'GutTS',
            });
          }
        } else {
          const isContextual = checkNodeForContextualTypes(decl, componentName, localTypes);
          const hasCompName = containsIdentifier(varName, componentName);
          if (isContextual && !hasCompName) {
            const line = sf.getLineAndCharacterOfPosition(decl.getStart(sf)).line + 1;
            diagnostics.push({
              ruleId: 'frnl/component-library-asset-naming',
              filePath,
              line,
              message: `Component library constant '${varName}' in component '${componentName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning component name ('${componentName}').`,
              severity: 'error',
            });
          }
        }
      }
    }

    // 3. Interfaces & Type Aliases
    if (ts.isInterfaceDeclaration(stmt) && stmt.name) {
      const name = stmt.name.text;
      const hasCompName = containsIdentifier(name, componentName);
      if (stmt.members.length > 0 && !hasCompName) {
        const line = sf.getLineAndCharacterOfPosition(stmt.getStart(sf)).line + 1;
        diagnostics.push({
          ruleId: 'frnl/component-library-asset-naming',
          filePath,
          line,
          message: `Component library interface '${name}' in component '${componentName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning component name ('${componentName}'). Expected name like '${componentName}${name}'.`,
          severity: 'error',
        });
      }
    }

    if (ts.isTypeAliasDeclaration(stmt) && stmt.name) {
      const name = stmt.name.text;
      const hasCompName = containsIdentifier(name, componentName);
      const isContextual = checkNodeForContextualTypes(stmt.type, componentName, localTypes);
      if (isContextual && !hasCompName) {
        const line = sf.getLineAndCharacterOfPosition(stmt.getStart(sf)).line + 1;
        diagnostics.push({
          ruleId: 'frnl/component-library-asset-naming',
          filePath,
          line,
          message: `Component library type alias '${name}' in component '${componentName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning component name ('${componentName}'). Expected name like '${componentName}${name}'.`,
          severity: 'error',
        });
      }
    }

    // 4. Classes
    if (ts.isClassDeclaration(stmt) && stmt.name) {
      const name = stmt.name.text;
      const hasCompName = containsIdentifier(name, componentName);
      if (!hasCompName) {
        const line = sf.getLineAndCharacterOfPosition(stmt.getStart(sf)).line + 1;
        diagnostics.push({
          ruleId: 'frnl/component-library-asset-naming',
          filePath,
          line,
          message: `Component library class '${name}' in component '${componentName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning component name ('${componentName}'). Expected name like '${componentName}${name}'.`,
          severity: 'error',
        });
      }
    }
  }

  return { diagnostics, promotableAssets };
}
