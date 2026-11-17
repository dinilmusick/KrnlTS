import type { NodeDefinition } from '../BaseNode.js';

export const PRIMITIVE_NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: 'primitive-number',
    label: 'Number',
    description: 'Outputs a numerical constant or variable',
    inputs: [
      { id: 'in', label: 'Val', category: 'DATA', dataType: 'NUMBER', direction: 'INPUT', connectionMode: 'SINGLE' }
    ],
    outputs: [
      { id: 'out', label: 'Num', category: 'DATA', dataType: 'NUMBER', direction: 'OUTPUT', connectionMode: 'MULTI' }
    ],
    metadata: { isPrimitive: true, defaultValue: 0 }
  },
  {
    type: 'primitive-string',
    label: 'String',
    description: 'Outputs a text string constant',
    inputs: [
      { id: 'in', label: 'Val', category: 'DATA', dataType: 'STRING', direction: 'INPUT', connectionMode: 'SINGLE' }
    ],
    outputs: [
      { id: 'out', label: 'Str', category: 'DATA', dataType: 'STRING', direction: 'OUTPUT', connectionMode: 'MULTI' }
    ],
    metadata: { isPrimitive: true, defaultValue: '' }
  },
  {
    type: 'primitive-boolean',
    label: 'Boolean',
    description: 'Outputs a boolean true/false toggle state',
    inputs: [
      { id: 'in', label: 'Toggle', category: 'DATA', dataType: 'BOOLEAN', direction: 'INPUT', connectionMode: 'SINGLE' }
    ],
    outputs: [
      { id: 'out', label: 'Bool', category: 'DATA', dataType: 'BOOLEAN', direction: 'OUTPUT', connectionMode: 'MULTI' }
    ],
    metadata: { isPrimitive: true, defaultValue: false }
  },
  {
    type: 'primitive-vector2',
    label: 'Vector2',
    description: '2D coordinates (X, Y)',
    inputs: [
      { id: 'x', label: 'X', category: 'DATA', dataType: 'NUMBER', direction: 'INPUT', connectionMode: 'SINGLE' },
      { id: 'y', label: 'Y', category: 'DATA', dataType: 'NUMBER', direction: 'INPUT', connectionMode: 'SINGLE' }
    ],
    outputs: [
      { id: 'vec', label: 'Vec2', category: 'DATA', dataType: 'VECTOR2', direction: 'OUTPUT', connectionMode: 'MULTI' }
    ],
    metadata: { isPrimitive: true, defaultValue: { x: 0, y: 0 } }
  },
  {
    type: 'primitive-color',
    label: 'Color',
    description: 'Color swatch or hex code',
    outputs: [
      { id: 'color', label: 'Color', category: 'DATA', dataType: 'COLOR', direction: 'OUTPUT', connectionMode: 'MULTI' }
    ],
    metadata: { isPrimitive: true, defaultValue: '#61afef' }
  },
  {
    type: 'primitive-math',
    label: 'Math',
    description: 'Arithmetic operator on two numbers',
    inputs: [
      { id: 'a', label: 'A', category: 'DATA', dataType: 'NUMBER', direction: 'INPUT', connectionMode: 'SINGLE' },
      { id: 'b', label: 'B', category: 'DATA', dataType: 'NUMBER', direction: 'INPUT', connectionMode: 'SINGLE' }
    ],
    outputs: [
      { id: 'result', label: 'Out', category: 'DATA', dataType: 'NUMBER', direction: 'OUTPUT', connectionMode: 'MULTI' }
    ],
    metadata: { isPrimitive: true, operation: 'add' }
  },
  {
    type: 'primitive-display',
    label: 'Display',
    description: 'Displays input value in realtime',
    inputs: [
      { id: 'in', label: 'In', category: 'DATA', dataType: 'ANY', direction: 'INPUT', connectionMode: 'SINGLE' }
    ],
    metadata: { isPrimitive: true }
  }
];
