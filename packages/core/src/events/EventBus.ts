/**
 * @file EventBus.ts
 * @description Generic in-process event bus used by functionality and orchestration event surfaces.
 */

import type { EventChannel, EventHandler, EventSubscription } from './EventTypes.js';

export class EventBus<TEvents extends Record<string, unknown> = Record<string, unknown>> {
  private readonly handlers = new Map<string, Set<EventHandler<any>>>();

  subscribe<K extends keyof TEvents & string>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): EventSubscription {
    let listeners = this.handlers.get(event);
    if (!listeners) {
      listeners = new Set();
      this.handlers.set(event, listeners);
    }
    listeners.add(handler);

    return {
      unsubscribe: () => {
        listeners?.delete(handler);
        if (listeners && listeners.size === 0) this.handlers.delete(event);
      },
    };
  }

  on<K extends keyof TEvents & string>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void {
    return this.subscribe(event, handler).unsubscribe;
  }

  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void {
    const listeners = this.handlers.get(event);
    if (!listeners) return;

    for (const listener of Array.from(listeners)) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`[EventBus] Handler error for '${event}':`, error);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export function createEventChannels<TEvents extends Record<string, unknown>>(
  bus: EventBus<TEvents>,
  names: readonly (keyof TEvents & string)[]
): { [K in keyof TEvents]: EventChannel<TEvents[K]> } {
  const channels = {} as { [K in keyof TEvents]: EventChannel<TEvents[K]> };

  for (const name of names) {
    channels[name] = {
      name,
      subscribe: (handler) => bus.subscribe(name, handler),
      on: (handler) => bus.on(name, handler),
    } as EventChannel<TEvents[typeof name]>;
  }

  return channels;
}
