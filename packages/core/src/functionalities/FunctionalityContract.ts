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

export type FunctionalityEvents<TEvents extends FunctionalityCustomEvents = FunctionalityCustomEvents> =
  TEvents & {
    triggered: FunctionalityLifecyclePayload;
    completed: FunctionalityLifecyclePayload;
    failed: FunctionalityLifecyclePayload;
  };

export interface FunctionalityExecutionContext<
  TState = Record<string, unknown>,
  TEvents extends FunctionalityCustomEvents = FunctionalityCustomEvents
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

export interface FunctionalityDefinition<
  TInput = unknown,
  TOutput = unknown,
  TState = Record<string, unknown>,
  TEvents extends FunctionalityCustomEvents = FunctionalityCustomEvents
> {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  readonly events?: Record<keyof TEvents & string, EventDefinition<any>>;
  readonly bubbleEvents?: boolean;
  readonly execute: (
    input: TInput,
    context: FunctionalityExecutionContext<TState, TEvents>
  ) => Promise<TOutput> | TOutput;
}

export type FunctionalityEventNamespace<
  TEvents extends FunctionalityCustomEvents = FunctionalityCustomEvents
> = {
  readonly [K in keyof FunctionalityEvents<TEvents>]: EventChannel<FunctionalityEvents<TEvents>[K]>;
};
