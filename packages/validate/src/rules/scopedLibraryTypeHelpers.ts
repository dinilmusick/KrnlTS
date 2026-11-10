import { SyntaxKind, Node } from 'ts-morph';

const PRIMITIVE_AND_BUILTIN_TYPES = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'void', 'undefined', 'null', 'never', 'unknown', 'any', 'object',
  'Record', 'Array', 'ReadonlyArray', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Date', 'RegExp', 'Error',
  'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'ArrayBuffer', 'Buffer', 'Iterable', 'AsyncIterable', 'Iterator', 'AsyncIterator', 'Partial', 'Required', 'Readonly',
  'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ConstructorParameters', 'ReturnType', 'InstanceType'
]);


