/**
 * @file FunctionalityFacade.ts
 * @description First-class functionality boundary with lifecycle and custom events.
 */

import { EventBus, createEventChannels } from '../events/EventBus.js';
import type {
  EventDefinition,
  FunctionalityLifecyclePayload,
} from '../events/EventTypes.js';
import type {
  FunctionalityDefinition,
  FunctionalityEventNamespace,
  FunctionalityEvents,
  FunctionalityExecutionContext,
} from './FunctionalityContract.js';

export class FunctionalityFacade<
  TInput = unknown,
  TOutput = unknown,
  TState = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly bubbleEvents: boolean;
  public readonly definition: FunctionalityDefinition<TInput, TOutput, TState, TEvents>;
  private readonly eventBus: EventBus<FunctionalityEvents<TEvents>>;
  public readonly events: FunctionalityEventNamespace<TEvents>;

  constructor(
    id: string,
    definition: FunctionalityDefinition<TInput, TOutput, TState, TEvents>,
    options: { bubbleEvents?: boolean } = {}
  ) {
    if (!id || typeof id !== 'string') {
      throw new Error('[FunctionalityFacade] Functionality id must be a non-empty string.');
    }
    if (!definition || typeof definition.execute !== 'function') {
      throw new Error(`[FunctionalityFacade:${id}] Functionality must define execute().`);
    }

    this.id = id;
    this.name = definition.name || id;
    this.description = definition.description || '';
    this.bubbleEvents = options.bubbleEvents ?? definition.bubbleEvents ?? true;
    this.definition = definition;
    this.eventBus = new EventBus<FunctionalityEvents<TEvents>>();

    const eventNames = [
      'triggered',
      'completed',
      'failed',
      ...Object.keys(definition.events ?? {}),
    ] as (keyof FunctionalityEvents<TEvents> & string)[];

    this.events = createEventChannels(this.eventBus, eventNames) as FunctionalityEventNamespace<TEvents>;
  }

  getEventDefinitions(): Record<string, EventDefinition<any>> {
    return {
      triggered: { name: 'triggered', description: 'Functionality execution started.' },
      completed: { name: 'completed', description: 'Functionality execution completed successfully.' },
      failed: { name: 'failed', description: 'Functionality execution failed.' },
      ...(this.definition.events ?? {}),
    };
  }

  subscribe<K extends keyof FunctionalityEvents<TEvents> & string>(
    event: K,
    handler: (payload: FunctionalityEvents<TEvents>[K]) => void
  ): () => void {
    return this.eventBus.on(event, handler);
  }

  emit<K extends keyof FunctionalityEvents<TEvents> & string>(
    event: K,
    payload: FunctionalityEvents<TEvents>[K]
  ): void {
    this.eventBus.emit(event, payload);
  }

  async execute(
    input: TInput,
    context: Omit<FunctionalityExecutionContext<TState, TEvents>, 'emit'>
  ): Promise<TOutput> {
    return await this.definition.execute(input, {
      ...context,
      emit: (event, payload) => this.emit(event, payload),
    });
  }

  clearEventSubscriptions(): void {
    this.eventBus.clear();
  }
}
