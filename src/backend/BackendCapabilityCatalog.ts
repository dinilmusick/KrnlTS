import type { IServiceFacade, ServiceNamespace } from '@ultrst-armada/krnl';
import type { BackendCapabilityDescriptor } from './BackendCapabilityTypes.js';

function cloneFrozenSchema(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneFrozenSchema));
  if (!value || typeof value !== 'object') return value;
  const copy: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key !== '__proto__' && key !== 'prototype' && key !== 'constructor') {
      copy[key] = cloneFrozenSchema(nested);
    }
  }
  return Object.freeze(copy);
}

export function listBackendCapabilities(
  services: ReadonlyMap<string, IServiceFacade>,
  namespaces: Readonly<Record<string, ServiceNamespace>>
): readonly BackendCapabilityDescriptor[] {
  const unique = new Map<string, IServiceFacade>();
  for (const facade of services.values()) unique.set(facade.id, facade);
  const descriptors: BackendCapabilityDescriptor[] = [];
  for (const [serviceId] of unique) {
    const ns = namespaces[serviceId];
    if (!ns) continue;
    for (const category of ['functionalities', 'orchestrations'] as const) {
      const entries = category === 'functionalities'
        ? Object.entries(ns.functionalities || {})
        : Object.entries(ns.functionalityOrchestrations || {});
      for (const [name, item] of entries) {
        const value = item as any;
        const definition = value?.definition || value;
        descriptors.push(Object.freeze({
          id: `${serviceId}/${category}/${name}`,
          name, serviceId, serviceName: ns.serviceName, serviceVersion: ns.version,
          category, description: String(value?.description || definition?.description || ''),
          inputSchema: definition?.inputSchema && typeof definition.inputSchema === 'object'
            ? cloneFrozenSchema(definition.inputSchema) as Readonly<Record<string, unknown>> : undefined,
          outputSchema: definition?.outputSchema && typeof definition.outputSchema === 'object'
            ? cloneFrozenSchema(definition.outputSchema) as Readonly<Record<string, unknown>> : undefined,
          invocation: Object.freeze({
            kind: category === 'functionalities' ? 'functionality' as const : 'orchestration' as const,
            operation: name,
          }),
          capabilities: Object.freeze([
            ...(Array.isArray(value?.capabilities) ? value.capabilities : []),
            ...(Array.isArray(definition?.capabilities) ? definition.capabilities : []),
          ].filter((entry): entry is string => typeof entry === 'string')),
          protocols: Object.freeze((ns.capabilities || []).flatMap((capability: any) =>
            Array.isArray(capability.protocols) ? capability.protocols : [])),
        }));
      }
    }
  }
  return Object.freeze(descriptors);
}
