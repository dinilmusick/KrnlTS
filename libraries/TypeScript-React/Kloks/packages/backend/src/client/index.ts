/**
 * @file index.ts
 * @description Dedicated browser-safe client package export for frontend integration.
 */

export { BackendClient, createBackendClient } from '../connectivity/BackendClient.js';
export type { BackendClientOptions, DomainProxy } from '../connectivity/BackendClient.js';

export { BackendResolver } from '../connectivity/BackendResolver.js';
export type { BackendResolverOptions } from '../connectivity/BackendResolver.js';

export { FrontendSession } from '../connectivity/FrontendSession.js';
export type { FrontendSessionOptions } from '../connectivity/FrontendSession.js';

export { EventBus } from '../connectivity/EventBus.js';
export type { EventHandler } from '../connectivity/EventBus.js';

export { CallbackRegistry } from '../connectivity/CallbackRegistry.js';
export type { CallbackFn } from '../connectivity/CallbackRegistry.js';

export { SequenceTracker } from '../connectivity/SequenceTracker.js';
export type { SequenceCheckResult, GapHandler } from '../connectivity/SequenceTracker.js';

export { HTTPTransport } from '../connectivity/HTTPTransport.js';
export type { HTTPTransportOptions } from '../connectivity/HTTPTransport.js';

export { WebSocketTransport } from '../connectivity/WebSocketTransport.js';
export type { WebSocketTransportOptions } from '../connectivity/WebSocketTransport.js';

export { BackendProvider, useBackend, useBackendClient } from './useBackend.js';
export type { BackendProviderProps, BackendClientInstance } from './useBackend.js';

export type {
  Message,
  MessageType,
  Job,
  JobState,
  JobPriority,
  Delegation,
  CallbackHandle,
  ResolutionStrategy,
  BackendExecutor,
} from '../connectivity/types.js';
