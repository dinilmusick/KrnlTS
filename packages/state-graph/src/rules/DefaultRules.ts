import { HandleTypeRegistry } from './HandleTypeRegistry.js';
import { WireTypeRegistry } from './WireTypeRegistry.js';
import { CompatibilityMatrix } from './CompatibilityMatrix.js';

export function initializeDefaultGraphRules(): void {
  // 1. Register Data Handle Types
  const types = ['STRING', 'NUMBER', 'BOOLEAN', 'OBJECT', 'ARRAY', 'ANY'];
  for (const t of types) {
    HandleTypeRegistry.register({ dataType: t, category: 'DATA' });
  }
  HandleTypeRegistry.register({ dataType: 'VIEW', category: 'VIEW' });

  // 2. Register Wire Types
  WireTypeRegistry.register({ wireType: 'DEFAULT', color: '#61afef', strokeWidth: 2.5, style: 'bezier' });
  WireTypeRegistry.register({ wireType: 'STRING', color: '#98c379', strokeWidth: 2.5, style: 'bezier' });
  WireTypeRegistry.register({ wireType: 'NUMBER', color: '#61afef', strokeWidth: 2.5, style: 'bezier' });
  WireTypeRegistry.register({ wireType: 'BOOLEAN', color: '#e5c07b', strokeWidth: 2.5, style: 'bezier' });
  WireTypeRegistry.register({ wireType: 'OBJECT', color: '#c678dd', strokeWidth: 2.5, style: 'bezier' });
  WireTypeRegistry.register({ wireType: 'ARRAY', color: '#e06c75', strokeWidth: 2.5, style: 'bezier' });
  WireTypeRegistry.register({ wireType: 'VIEW', color: '#c678dd', strokeWidth: 2.0, dashArray: '5,5', style: 'bezier' });

  // 3. Register Canonical Compatibility Rules
  for (const t of types) {
    CompatibilityMatrix.registerRule({
      sourceCategory: 'DATA',
      sourceDataType: t,
      targetCategory: 'DATA',
      targetDataType: t,
      allowed: true,
      wireType: t,
      priority: 10
    });
  }

  // ANY accepts anything and connects to anything
  CompatibilityMatrix.registerRule({
    sourceCategory: 'DATA',
    sourceDataType: 'ANY',
    targetCategory: 'DATA',
    targetDataType: '*',
    allowed: true,
    wireType: 'DEFAULT',
    priority: 1
  });

  CompatibilityMatrix.registerRule({
    sourceCategory: 'DATA',
    sourceDataType: '*',
    targetCategory: 'DATA',
    targetDataType: 'ANY',
    allowed: true,
    wireType: 'DEFAULT',
    priority: 1
  });
}
