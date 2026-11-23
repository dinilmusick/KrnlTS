/**
 * @file FunctionalityContract.ts
 * @description Canonical functionality contracts and event surface.
 */

import type {
  EventChannel,
  EventDefinition,
  FunctionalityLifecyclePayload,
} from '../events/EventTypes.js';

export type FunctionalityCustomEvents = Record<string, unknown>;

export type FunctionalityEvents<TEvents extends FunctionalityCustomEvents = {}> =
  Omit<TEvents, 'triggered' | 'completed' | 'failed'> & {
    triggered: FunctionalityLifecyclePayload;
    completed: FunctionalityLifecyclePayload;
    failed: FunctionalityLifecyclePayload;
  };

export interface FunctionalityExecutionContext<
  TState = Record<string, unknown>,
  TEvents extends FunctionalityCustomEvents = {}
> {
  readonly serviceId: string;
  readonly functionalityId: string;
  readonly correlationId?: string;
  readonly state: Readonly<TState>;
  readonly metadata?: Record<string, unknown>;
  readonly emit: <K extends keyof FunctionalityEvents<TEvents> & string>(
    event: K,
    payload: FunctionalityEvents<TEvents>[K]
  ) => void;
}

/**
 * Canonical JSON Schema subset for typed, externally describable functionalities.
 * This is declaration metadata only; external transports must validate it and
 * explicitly authorize the operation before making it remotely available.
 */
export interface FunctionalityJsonSchema {
  readonly type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  readonly description?: string;
  readonly properties?: Readonly<Record<string, FunctionalityJsonSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly items?: FunctionalityJsonSchema;
  readonly enum?: readonly unknown[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
}

export interface FunctionalityDefinition<
  TInput = unknown,
  TOutput = unknown,
  TState = Record<string, unknown>,
  TEvents extends FunctionalityCustomEvents = {}
> {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  /** Required for external tool publication, optional for internal functionalities. */
  readonly inputSchema?: FunctionalityJsonSchema;
  readonly outputSchema?: FunctionalityJsonSchema;
  readonly events?: Record<keyof TEvents & string, EventDefinition<any>>;
  readonly bubbleEvents?: boolean;
  readonly execute: (
    input: TInput,
    context: FunctionalityExecutionContext<TState, TEvents>
  ) => Promise<TOutput> | TOutput;
}

export type FunctionalityEventNamespace<
  TEvents extends FunctionalityCustomEvents = {}
> = {
  readonly [K in keyof FunctionalityEvents<TEvents>]: EventChannel<FunctionalityEvents<TEvents>[K]>;
};
