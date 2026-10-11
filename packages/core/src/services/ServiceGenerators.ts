/**
 * @file ServiceGenerators.ts
 * @description Factory generators for services and definitions.
 */

import type {
  ServiceDefinition,
  EndpointDescriptor,
  IService,
} from './ServiceContract.js';
import { ServiceInstance } from './ServiceInstance.js';
import { ServiceProxy } from './ServiceProxy.js';
import type { ProtocolAdapter } from '../protocols/ProtocolAdapter.js';

export function createServiceDefinition<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(definition: ServiceDefinition<TState, TEvents>): ServiceDefinition<TState, TEvents> {
  return definition;
}

export function createService<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(definition: ServiceDefinition<TState, TEvents>): ServiceInstance<TState, TEvents> {
  return new ServiceInstance<TState, TEvents>(definition);
}

export function createServiceProxy<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(
  definition: ServiceDefinition<TState, TEvents>,
  adapter: ProtocolAdapter,
  endpoint: EndpointDescriptor
): IService<TState, TEvents> {
  return new ServiceProxy<TState, TEvents>(definition, adapter, endpoint);
}
