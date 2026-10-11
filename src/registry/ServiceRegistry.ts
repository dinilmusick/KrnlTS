/**
 * @file ServiceRegistry.ts
 * @description Central service catalog and capabilities registry.
 */

import type {
  ServiceDefinition,
  EndpointDescriptor,
  ServiceCapability,
} from '../services/ServiceContract.js';

export interface RegisteredServiceRecord {
  definition: ServiceDefinition;
  endpoints: EndpointDescriptor[];
  registeredAt: number;
}

export class ServiceRegistry {
  private services: Map<string, RegisteredServiceRecord> = new Map();

  register(definition: ServiceDefinition, endpoints: EndpointDescriptor[] = []): void {
    this.services.set(definition.id, {
      definition,
      endpoints,
      registeredAt: Date.now(),
    });
  }

  unregister(serviceId: string): void {
    this.services.delete(serviceId);
  }

  get(serviceId: string): RegisteredServiceRecord | undefined {
    return this.services.get(serviceId);
  }

  list(): RegisteredServiceRecord[] {
    return Array.from(this.services.values());
  }

  findByCapability(capabilityName: string): RegisteredServiceRecord[] {
    return this.list().filter((record) =>
      record.definition.capabilities?.some((cap: ServiceCapability) => cap.name === capabilityName)
    );
  }
}
