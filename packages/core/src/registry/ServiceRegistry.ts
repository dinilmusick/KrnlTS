/**
 * @file ServiceRegistry.ts
 * @description Central service catalog and capabilities registry.
 */

import type { ServiceDefinition, EndpointDescriptor, ServiceCapability } from '../services/ServiceContract.js';
import { validateServiceDefinition } from '../services/ServiceGenerators.js';
import type { ProtocolType } from '../services/ServiceContract.js';

const PROTOCOLS: readonly ProtocolType[] = ['http','https','ws','wss','udp','p2p','signaling','memory'];

function validateEndpoint(endpoint: EndpointDescriptor): void {
  if (!endpoint || typeof endpoint !== 'object') throw new Error('[ServiceRegistry] Invalid endpoint.');
  if (!PROTOCOLS.includes(endpoint.protocol)) throw new Error('[ServiceRegistry] Unsupported endpoint protocol.');
  if (typeof endpoint.address !== 'string' || endpoint.address.trim() === '') throw new Error('[ServiceRegistry] Endpoint address must be non-empty.');
  if (endpoint.port !== undefined && (!Number.isInteger(endpoint.port) || endpoint.port < 0 || endpoint.port > 65535)) throw new Error('[ServiceRegistry] Endpoint port is invalid.');
  if (!Array.isArray(endpoint.capabilities)) throw new Error('[ServiceRegistry] Endpoint capabilities must be an array.');
}

export interface RegisteredServiceRecord {
  definition: ServiceDefinition;
  endpoints: EndpointDescriptor[];
  registeredAt: number;
}

/**
 * Central service catalog and capabilities registry.
 *
 * Registration Semantics:
 * 1. register():
 *    Strict uniqueness enforced. If a service with the same ID is already registered
 *    (whether same version or different version), an Error is thrown.
 * 2. replace():
 *    Explicit replacement method. Overwrites existing service registration while
 *    preserving the original registration timestamp (`registeredAt`).
 */
export class ServiceRegistry {
  private readonly services: Map<string, RegisteredServiceRecord> = new Map();

  /**
   * Registers a service definition and its endpoints into the registry.
   *
   * @param definition Validated service definition.
   * @param endpoints Optional list of active endpoint descriptors.
   * @throws Error if definition or endpoints fail validation.
   * @throws Error if service is already registered under the same ID.
   */
  register(definition: ServiceDefinition, endpoints: EndpointDescriptor[] = []): void {
    validateServiceDefinition(definition);
    for (const endpoint of endpoints) validateEndpoint(endpoint);
    const existing = this.services.get(definition.id);
    if (existing) {
      throw new Error(
        "[ServiceRegistry] Service '" + definition.id + "' is already registered at version '" +
        existing.definition.version + "'. Use replace() to explicitly replace an existing service."
      );
    }

    this.services.set(definition.id, {
      definition,
      endpoints: endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: Date.now(),
    });
  }

  /**
   * Explicitly replaces or updates a service definition and its endpoints in the registry.
   * Preserves original registeredAt timestamp if the service was previously registered.
   *
   * @param definition Validated service definition.
   * @param endpoints Optional list of active endpoint descriptors.
   */
  replace(definition: ServiceDefinition, endpoints: EndpointDescriptor[] = []): void {
    validateServiceDefinition(definition);
    for (const endpoint of endpoints) validateEndpoint(endpoint);
    const existing = this.services.get(definition.id);

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
