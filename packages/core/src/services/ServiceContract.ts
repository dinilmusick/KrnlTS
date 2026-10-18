/**
 * @file ServiceContract.ts
 * @description Canonical service contracts for the KrnlTS Service Kernel.
 * Invariant: local and remote services share the same IService contract.
 */

import type { ServiceStatus } from '../lifecycle/LifecycleManager.js';
export type { ServiceStatus };

export type ProtocolType = 'http' | 'https' | 'ws' | 'wss' | 'udp' | 'p2p' | 'signaling' | 'memory';

export interface OperationContext {
  caller?: string;
  callerPort?: number;
  accessKey?: string;
  metadata?: Record<string, unknown>;
  protocol?: ProtocolType;
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
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  name: string;
  version: string;
  inputs?: Record<string, Record<string, unknown>>;
  outputs?: Record<string, Record<string, unknown>>;
  operations: Record<string, OperationContract<any, any>>;
  state?: StateContract<TState>;
  events?: Record<keyof TEvents & string, EventContract<any>>;
  lifecycle?: LifecycleContract;
  dependencies?: DependencyContract[];
  capabilities?: ServiceCapability[];
  protocols?: ProtocolType[];
}

export interface IService<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
  getState(): Readonly<TState>;
  setState(mutation: Partial<TState>): void;
  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
  getStatus(): ServiceStatus;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  getDefinition(): ServiceDefinition<TState, TEvents>;
}
