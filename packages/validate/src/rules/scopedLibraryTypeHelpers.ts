import { SyntaxKind, Node } from 'ts-morph';

const PRIMITIVE_AND_BUILTIN_TYPES = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'void', 'undefined', 'null', 'never', 'unknown', 'any', 'object',
  'Record', 'Array', 'ReadonlyArray', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Date', 'RegExp', 'Error',
  'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'ArrayBuffer', 'Buffer', 'Iterable', 'AsyncIterable', 'Iterator', 'AsyncIterator', 'Partial', 'Required', 'Readonly',
  'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ConstructorParameters', 'ReturnType', 'InstanceType'
]);

export function containsIdentifier(name: string, target: string): boolean {
  return name.toLowerCase().includes(target.toLowerCase());
}

export function isCustomContextualType(typeName: string, serviceName: string, localTypes: Set<string>): boolean {
  if (PRIMITIVE_AND_BUILTIN_TYPES.has(typeName)) return false;
  if (localTypes.has(typeName)) return true;
  if (containsIdentifier(typeName, serviceName)) return true;
  // If not a recognized primitive/standard utility and not a single letter generic parameter (T, U, K, V)
  if (/^[A-Z][a-zA-Z0-9]+$/.test(typeName)) return true;
  return false;
}

export function hasContextualTypeReference(node: Node, serviceName: string, localTypes: Set<string>): boolean {
  const typeRefs = node.getDescendantsOfKind(SyntaxKind.TypeReference);
  for (const ref of typeRefs) {
    const text = ref.getTypeName().getText().trim();
    if (isCustomContextualType(text, serviceName, localTypes)) {
      return true;
    }
  }
  return false;
}
