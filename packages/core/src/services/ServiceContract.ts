/**
 * @file ServiceContract.ts
 * @description Canonical service contracts for the KrnlTS Service Kernel.
 * Services are execution and namespace boundaries; application events belong to
 * functionalities and orchestration lifecycle, never to the service itself.
 */

import type { ServiceStatus } from '../lifecycle/LifecycleManager.js';
import type { FunctionalityFacade } from '../functionalities/FunctionalityFacade.js';
export type { ServiceStatus };

export type ProtocolType = 'http' | 'https' | 'ws' | 'wss' | 'udp' | 'p2p' | 'signaling' | 'memory';

export interface OperationContext {
  caller?: string;
  callerPort?: number;
  accessKey?: string;
  metadata?: Record<string, unknown>;
  protocol?: ProtocolType;
  correlationId?: string;
  idempotencyKey?: string;
}

export interface OperationContract<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  capabilities?: string[];
  protocols?: ProtocolType[];
  handler: (input: TInput, context: OperationContext) => Promise<TOutput> | TOutput;
}

export interface StateContract<TState = Record<string, unknown>> {
  initial: TState;
  schema?: Record<string, unknown>;
}

export interface EventContract<TPayload = unknown> {
  name: string;
  description?: string;
  payloadSchema?: Record<string, unknown>;
  marker?: TPayload;
}

export interface LifecycleContract {
  onInit?: () => Promise<void> | void;
  onStart?: () => Promise<void> | void;
  onStop?: () => Promise<void> | void;
  onDispose?: () => Promise<void> | void;
}

export interface DependencyContract {
  serviceId: string;
  versionRange?: string;
  requiredCapabilities?: string[];
  preferredProtocols?: ProtocolType[];
  optional?: boolean;
}

export interface ServiceCapability {
  id: string;
  name: string;
  protocols: ProtocolType[];
  metadata?: Record<string, unknown>;
}

export interface ServiceNamespace<
  TLibraries extends Record<string, unknown> = Record<string, unknown>,
  TFunctionalities extends Record<string, FunctionalityFacade<any, any, any, any>> = Record<string, FunctionalityFacade<any, any, any, any>>,
  TOrchestrations extends Record<string, unknown> = Record<string, unknown>
> {
  readonly serviceId: string;
  readonly serviceName: string;
  readonly version: string;
  readonly description?: string;
  readonly libraries: TLibraries;
  readonly functionalities: TFunctionalities;
  readonly functionalityOrchestrations: TOrchestrations;
  readonly capabilities: readonly ServiceCapability[];
  readonly dependencies: readonly DependencyContract[];
}

export interface EndpointDescriptor {
  protocol: ProtocolType;
  address: string;
  port?: number;
  path?: string;
  channel?: string;
  capabilities: string[];
}

export interface ServiceDefinition<
  TState extends Record<string, unknown> = Record<string, unknown>,
  /** @deprecated Service-owned events are no longer part of the KrnlTS event model. */
  TLegacyEvents extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  name: string;
  version: string;
  inputs?: Record<string, Record<string, unknown>>;
  outputs?: Record<string, Record<string, unknown>>;
  operations: Record<string, OperationContract<any, any>>;
  state?: StateContract<TState>;
  lifecycle?: LifecycleContract;
  dependencies?: DependencyContract[];
  capabilities?: ServiceCapability[];
  protocols?: ProtocolType[];
}

export interface IService<
  TState extends Record<string, unknown> = Record<string, unknown>,
  /** @deprecated Service-owned events are no longer part of the KrnlTS event model. */
  TLegacyEvents extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
  getState(): Readonly<TState>;
  setState(mutation: Partial<TState>): void;
  getStatus(): ServiceStatus;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  getDefinition(): ServiceDefinition<TState, TLegacyEvents>;
}
