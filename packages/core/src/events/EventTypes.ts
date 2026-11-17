/**
 * @file EventTypes.ts
 * @description Canonical event contracts for functionality and orchestration events.
 */

export type EventHandler<TPayload> = (payload: TPayload) => void;

export interface EventSubscription {
  readonly unsubscribe: () => void;
}

export interface EventChannel<TPayload> {
  readonly name: string;
  subscribe(handler: EventHandler<TPayload>): EventSubscription;
  on(handler: EventHandler<TPayload>): () => void;
}

export interface EventDefinition<TPayload = unknown> {
  readonly name: string;
  readonly description?: string;
  readonly payloadSchema?: Record<string, unknown>;
  readonly marker?: TPayload;
}

export interface FunctionalityLifecyclePayload {
  readonly serviceId: string;
  readonly functionalityId: string;
  readonly functionalityName: string;
  readonly correlationId?: string;
  readonly timestamp: number;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly error?: string;
}

export type FunctionalityLifecycleEvent =
  | 'triggered'
  | 'completed'
  | 'failed';

export interface OrchestrationLifecyclePayload {
  readonly serviceId: string;
  readonly orchestrationId: string;
  readonly orchestrationName: string;
  readonly correlationId: string;
  readonly executionId?: string;
  readonly timestamp: number;
  readonly status?: string;
  readonly output?: unknown;
  readonly error?: string;
}
