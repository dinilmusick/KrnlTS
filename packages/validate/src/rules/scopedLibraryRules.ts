import * as path from 'path';
import { SourceFile, SyntaxKind, FunctionDeclaration, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, TypeAliasDeclaration, EnumDeclaration, Node } from 'ts-morph';
import { ValidationError, PromotableAsset } from '../types.js';

const PRIMITIVE_AND_BUILTIN_TYPES = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'void', 'undefined', 'null', 'never', 'unknown', 'any', 'object',
  'Record', 'Array', 'ReadonlyArray', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Date', 'RegExp', 'Error',
  'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'ArrayBuffer', 'Buffer', 'Iterable', 'AsyncIterable', 'Iterator', 'AsyncIterator', 'Partial', 'Required', 'Readonly',
  'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ConstructorParameters', 'ReturnType', 'InstanceType'
]);

export interface ScopedLibraryRuleResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  promotableAssets: PromotableAsset[];
}

export function detectServiceContext(filePath: string): { serviceName: string; libraryName: string } | null {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/(?:^|\/)services\/([^/]+)\/libraries\/([^/]+)/);
  if (match) {
    return { serviceName: match[1], libraryName: match[2] };
  }
  return null;
}

function containsIdentifier(name: string, target: string): boolean {
  return name.toLowerCase().includes(target.toLowerCase());
}

function isCustomContextualType(typeName: string, serviceName: string, localTypes: Set<string>): boolean {
  if (PRIMITIVE_AND_BUILTIN_TYPES.has(typeName)) return false;
  if (localTypes.has(typeName)) return true;
  if (containsIdentifier(typeName, serviceName)) return true;
  // If not a recognized primitive/standard utility and not a single letter generic parameter (T, U, K, V)
  if (/^[A-Z][a-zA-Z0-9]+$/.test(typeName)) return true;
  return false;
}

function hasContextualTypeReference(node: Node, serviceName: string, localTypes: Set<string>): boolean {
  const typeRefs = node.getDescendantsOfKind(SyntaxKind.TypeReference);
  for (const ref of typeRefs) {
    const text = ref.getTypeName().getText().trim();
    if (isCustomContextualType(text, serviceName, localTypes)) {
      return true;
    }
  }
  return false;
}

export function checkScopedLibraryRules(sf: SourceFile): ScopedLibraryRuleResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const promotableAssets: PromotableAsset[] = [];
  const filePath = sf.getFilePath().replace(/\\/g, '/');

  const context = detectServiceContext(filePath);
  if (!context) {
    return { errors, warnings, promotableAssets };
  }

  const { serviceName, libraryName } = context;

  // Gather locally defined custom type/interface/class names
  const localTypes = new Set<string>();
  sf.getInterfaces().forEach((i) => localTypes.add(i.getName()));
  sf.getTypeAliases().forEach((t) => localTypes.add(t.getName()));
  sf.getClasses().forEach((c) => {
    const n = c.getName();
    if (n) localTypes.add(n);
  });
  sf.getEnums().forEach((e) => localTypes.add(e.getName()));

  // 1. Validate Functions
  const functions = sf.getFunctions();
  for (const fn of functions) {
    const fnName = fn.getName();
    if (!fnName) continue;

    const isContextual = hasContextualTypeReference(fn, serviceName, localTypes);
    const hasServiceName = containsIdentifier(fnName, serviceName);

    if (isContextual) {
      if (!hasServiceName) {
        errors.push({
          ruleId: 'krnl/service-library-asset-naming',
          filePath,
          line: fn.getStartLineNumber(),
          message: `Service library asset '${fnName}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name containing '${serviceName}' (e.g. '${serviceName.toLowerCase()}${fnName[0].toUpperCase()}${fnName.slice(1)}'), or eliminate contextual custom type dependencies to make it a generic promotable utility.`,
          severity: 'error',
        });
      }
    } else {
      promotableAssets.push({
        name: fnName,
        kind: 'function',
        filePath,
        scope: 'service',
        scopeName: serviceName,
        target: 'GutTS',
      });
    }
  }

  // 2. Validate Arrow Functions / Function Variables
  for (const stmt of sf.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const varName = decl.getName();
      const init = decl.getInitializer();
      const isFunction = init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression);

      if (isFunction) {
        const isContextual = hasContextualTypeReference(decl, serviceName, localTypes);
        const hasServiceName = containsIdentifier(varName, serviceName);

        if (isContextual) {
          if (!hasServiceName) {
            errors.push({
              ruleId: 'krnl/service-library-asset-naming',
              filePath,
              line: decl.getStartLineNumber(),
              message: `Service library asset '${varName}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name containing '${serviceName}', or eliminate contextual custom type dependencies to make it a generic promotable utility.`,
              severity: 'error',
            });
          }
        } else {
          promotableAssets.push({
            name: varName,
            kind: 'function',
            filePath,
            scope: 'service',
            scopeName: serviceName,
            target: 'GutTS',
          });
        }
      } else {
        // Variable / Constant data structure
        const isContextual = hasContextualTypeReference(decl, serviceName, localTypes);
        const hasServiceName = containsIdentifier(varName, serviceName);
        if (isContextual && !hasServiceName) {
          errors.push({
            ruleId: 'krnl/service-library-asset-naming',
            filePath,
            line: decl.getStartLineNumber(),
            message: `Service library asset '${varName}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}').`,
            severity: 'error',
          });
        }
      }
    }
  }

  // 3. Validate Interfaces & Type Aliases
  for (const iface of sf.getInterfaces()) {
    const name = iface.getName();
    const hasServiceName = containsIdentifier(name, serviceName);
    const hasProps = iface.getProperties().length > 0;
    if (hasProps && !hasServiceName) {
      errors.push({
        ruleId: 'krnl/service-library-asset-naming',
        filePath,
        line: iface.getStartLineNumber(),
        message: `Service library interface '${name}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name like '${serviceName}${name}'.`,
        severity: 'error',
      });
    }
  }

  for (const t of sf.getTypeAliases()) {
    const name = t.getName();
    const hasServiceName = containsIdentifier(name, serviceName);
    const isContextual = hasContextualTypeReference(t, serviceName, localTypes);
    if (isContextual && !hasServiceName) {
      errors.push({
        ruleId: 'krnl/service-library-asset-naming',
        filePath,
        line: t.getStartLineNumber(),
        message: `Service library type alias '${name}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name like '${serviceName}${name}'.`,
        severity: 'error',
      });
    }
  }

  // 4. Validate Classes
  for (const cls of sf.getClasses()) {
    const name = cls.getName();
    if (!name) continue;
    const hasServiceName = containsIdentifier(name, serviceName);
    if (!hasServiceName) {
      errors.push({
        ruleId: 'krnl/service-library-asset-naming',
        filePath,
        line: cls.getStartLineNumber(),
        message: `Service library class '${name}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name like '${serviceName}${name}'.`,
        severity: 'error',
      });
    }
  }

  return { errors, warnings, promotableAssets };
}
