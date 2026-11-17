// ═══════════════════════════════════════════════════════════════════
// DATA PRIMITIVES & PARAMETER ARCHETYPES
// ═══════════════════════════════════════════════════════════════════
import { NodeArchetypeDefinition } from "./types";
import {
  createStringNode,
  createNumberNode,
  createBooleanNode,
  createObjectNode,
  createFolderPathNode,
} from "../../functions/nodeFactory";

export const PRIMITIVE_CORE_ARCHETYPES: NodeArchetypeDefinition[] = [
  {
    id: 'primitive_string',
    category: 'Data & Parameters',
    label: 'String Primitive Node',
    defaultDescription: 'Text string primitive parameter for dynamic file names, tags, labels, and script parameters',
    iconName: 'type',
    spawnType: { kind: 'primitive_string' },
    createPrototype: () => createStringNode(1),
  },
  {
    id: 'primitive_number',
    category: 'Data & Parameters',
    label: 'Number Primitive Node',
    defaultDescription: 'Numerical parameter with steppers, range constraints, and direct wiring',
    iconName: 'hash',
    spawnType: { kind: 'primitive_number' },
    createPrototype: () => createNumberNode(1),
  },
  {
    id: 'primitive_boolean',
    category: 'Data & Parameters',
    label: 'Boolean Primitive Node',
    defaultDescription: 'Boolean true/false toggle switch parameter for gating logic and mode triggers',
    iconName: 'toggle-left',
    spawnType: { kind: 'primitive_boolean' },
    createPrototype: () => createBooleanNode(1),
  },
  {
    id: 'primitive_object',
    category: 'Data & Parameters',
    label: 'Object / JSON Primitive Node',
    defaultDescription: 'Structured dictionary object and JSON payload emitter for complex configurations',
    iconName: 'braces',
    spawnType: { kind: 'primitive_object' },
    createPrototype: () => createObjectNode(1),
  },
  {
    id: 'folder_path',
    category: 'Data & Parameters',
    label: 'Folder Path Access Node',
    defaultDescription: 'Dedicated node for accessing folder paths: gets user defined folders as a list and outputs them as a structured object and path strings',
    iconName: 'folder',
    spawnType: { kind: 'folder_path' },
    createPrototype: () => createFolderPathNode(1),
  },
];
