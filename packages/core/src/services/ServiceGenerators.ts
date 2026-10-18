/**
 * @file ServiceGenerators.ts
 * @description Validated factory generators for services and definitions.
 */

import type { ServiceDefinition, EndpointDescriptor, IService } from './ServiceContract.js';
import { ServiceInstance } from './ServiceInstance.js';
import { ServiceProxy } from './ServiceProxy.js';
import type { ProtocolAdapter } from '../protocols/ProtocolAdapter.js';

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be a non-empty string.");
  }
}

export function validateServiceDefinition<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(definition: ServiceDefinition<TState, TEvents>): ServiceDefinition<TState, TEvents> {
  if (!definition || typeof definition !== 'object') {
    throw new Error('[KrnlTS] Invalid service definition: expected an object.');
  }

  assertNonEmptyString(definition.id, 'id');
  assertNonEmptyString(definition.name, 'name');
  assertNonEmptyString(definition.version, 'version');

  if (!definition.operations || typeof definition.operations !== 'object') {
    throw new Error("[Service:" + definition.name + "] Invalid operations: expected an object.");
  }

  for (const [key, operation] of Object.entries(definition.operations)) {
    if (!operation || typeof operation !== 'object') {
      throw new Error("[Service:" + definition.name + "] Invalid operation '" + key + "'.");
    }
    assertNonEmptyString(operation.id, "operations." + key + ".id");
    assertNonEmptyString(operation.name, "operations." + key + ".name");
    if (typeof operation.handler !== 'function') {
      throw new Error("[Service:" + definition.name + "] Operation '" + key + "' must define a handler.");
    }
  }

  for (const [key, event] of Object.entries(definition.events ?? {})) {
    if (!event || typeof event !== 'object') {
      throw new Error("[Service:" + definition.name + "] Invalid event '" + key + "'.");
    }
    assertNonEmptyString(event.name, "events." + key + ".name");
  }

  for (const capability of definition.capabilities ?? []) {
    assertNonEmptyString(capability.id, 'capability.id');
    assertNonEmptyString(capability.name, 'capability.name');
    if (!Array.isArray(capability.protocols)) {
      throw new Error("[Service:" + definition.name + "] Capability '" + capability.name + "' protocols must be an array.");
    }
  }

  for (const dependency of definition.dependencies ?? []) {
    assertNonEmptyString(dependency.serviceId, 'dependency.serviceId');
  }

  return definition;
}

export function createServiceDefinition<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(definition: ServiceDefinition<TState, TEvents>): ServiceDefinition<TState, TEvents> {
  return validateServiceDefinition(definition);
}

export function createService<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(definition: ServiceDefinition<TState, TEvents>): ServiceInstance<TState, TEvents> {
  return new ServiceInstance<TState, TEvents>(validateServiceDefinition(definition));
}

export function createServiceProxy<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(
  definition: ServiceDefinition<TState, TEvents>,
  adapter: ProtocolAdapter,
  endpoint: EndpointDescriptor
): IService<TState, TEvents> {
  validateServiceDefinition(definition);
  if (!adapter || typeof adapter.send !== 'function') {
    throw new Error("[ServiceProxy:" + definition.name + "] Adapter must implement send().");
  }
  if (!endpoint || typeof endpoint.address !== 'string' || endpoint.address.length === 0) {
    throw new Error("[ServiceProxy:" + definition.name + "] Endpoint must have an address.");
  }
  return new ServiceProxy<TState, TEvents>(definition, adapter, endpoint);
}
