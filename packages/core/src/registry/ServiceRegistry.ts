/**
 * @file ServiceRegistry.ts
 * @description Central service catalog and capabilities registry.
 */

import type { ServiceDefinition, EndpointDescriptor, ServiceCapability } from '../services/ServiceContract.js';
import { validateServiceDefinition } from '../services/ServiceGenerators.js';

export interface RegisteredServiceRecord {
  definition: ServiceDefinition;
  endpoints: EndpointDescriptor[];
  registeredAt: number;
}

export class ServiceRegistry {
  private readonly services: Map<string, RegisteredServiceRecord> = new Map();

  register(definition: ServiceDefinition, endpoints: EndpointDescriptor[] = []): void {
    validateServiceDefinition(definition);
    const existing = this.services.get(definition.id);
    if (existing && existing.definition.version !== definition.version) {
      throw new Error(
        "[ServiceRegistry] Service '" + definition.id + "' is already registered at version '" +
        existing.definition.version + "'; refusing replacement with '" + definition.version + "'."
      );
    }

    this.services.set(definition.id, {
      definition,
      endpoints: endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: existing?.registeredAt ?? Date.now(),
    });
  }

  unregister(serviceId: string): boolean {
    return this.services.delete(serviceId);
  }

  get(serviceId: string): RegisteredServiceRecord | undefined {
    const record = this.services.get(serviceId);
    if (!record) return undefined;
    return {
      definition: record.definition,
      endpoints: record.endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: record.registeredAt,
    };
  }

  list(): RegisteredServiceRecord[] {
    return Array.from(this.services.values()).map((record) => ({
      definition: record.definition,
      endpoints: record.endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: record.registeredAt,
    }));
  }

  findByCapability(capabilityName: string): RegisteredServiceRecord[] {
    return this.list().filter((record) =>
      record.definition.capabilities?.some((cap: ServiceCapability) => cap.name === capabilityName)
    );
  }
}
