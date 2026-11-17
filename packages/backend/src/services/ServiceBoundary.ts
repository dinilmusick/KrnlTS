/**
 * @file ServiceBoundary.ts
 * @description Bridges KrnlTS canonical services with Skipo runtime.
 * Invariant: KrnlTS.Service = Skipo.Service = RemoteService.Contract
 */

import {
  createService,
  createServiceDefinition,
  createServiceProxy,
  type IService,
  type ServiceDefinition,
  type EndpointDescriptor,
  type ProtocolAdapter,
} from '@ultrst-armada/krnl';

export type LocalService = IService;
export type RemoteServiceProxy = IService;

export function createLocalService<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(definition: ServiceDefinition<TState, TEvents>): LocalService {
  return createService<TState, TEvents>(createServiceDefinition(definition));
}

export function createRemoteService<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(
  definition: ServiceDefinition<TState, TEvents>,
  adapter: ProtocolAdapter,
  endpoint: EndpointDescriptor
): RemoteServiceProxy {
  return createServiceProxy<TState, TEvents>(definition, adapter, endpoint);
}
