import { CodeNode, StringNode, NumberNode, BooleanNode, ObjectNode, FolderPathNode, AssetPoolScope } from "../../types/index.js";
import { DEFAULT_CODE_NODE_SCRIPT } from '../codeLinter';

export function createCodeNode(
  index: number = 1,
  position?: [number, number, number],
  name?: string
): CodeNode {
  return {
    id: `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'code',
    name: name || `Code Node ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#f59e0b',
    radius: 1.5,
    active: true,
    code: DEFAULT_CODE_NODE_SCRIPT,
    width: 380,
    height: 260,
    executionMode: 'on_pulse',
    totalPulsesProcessed: 0,
    lastErrorMessage: null,
  };
}

export function createStringNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue?: string,
  name?: string
): StringNode {
  return {
    id: `str-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_string',
    name: name || `String ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#06b6d4',
    radius: 1.2,
    active: true,
    value: initialValue,
    label: 'String Primitive',
  };
}

export function createNumberNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue?: number,
  name?: string
): NumberNode {
  return {
    id: `num-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_number',
    name: name || `Number ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#f97316',
    radius: 1.2,
    active: true,
    value: initialValue,
    min: 0,
    max: 128,
    step: 1,
    label: 'Number Primitive',
  };
}

export function createBooleanNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue: boolean = true,
  name?: string
): BooleanNode {
  return {
    id: `bool-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_boolean',
    name: name || `Boolean ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#a855f7',
    radius: 1.0,
    active: true,
    value: initialValue,
    label: 'Boolean Primitive',
  };
}

export function createObjectNode(
  index: number = 1,
  position?: [number, number, number],
  initialValue?: Record<string, any>,
  name?: string
): ObjectNode {
  return {
    id: `obj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'primitive_object',
    name: name || `Object ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#3b82f6',
    radius: 1.4,
    active: true,
    value: initialValue,
    rawJson: initialValue ? JSON.stringify(initialValue, null, 2) : undefined,
    label: 'Object / JSON',
  };
}

export function createFolderPathNode(
  index: number = 1,
  position?: [number, number, number],
  scope: AssetPoolScope = 'workspace',
  name?: string
): FolderPathNode {
  return {
    id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'folder_path',
    name: name || `Folder Path ${index}`,
    position: position || [
      (Math.random() - 0.5) * 8,
      0,
      (Math.random() - 0.5) * 8,
    ],
    color: '#ec4899',
    radius: 1.5,
    active: true,
    scope,
    selectedFolder: undefined,
    folders: [],
    label: 'Folder Path Access',
  };
}
