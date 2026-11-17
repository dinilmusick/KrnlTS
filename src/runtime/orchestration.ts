import type { StoreApi } from 'zustand/vanilla';
import {
  getFrnlComponentHandle,
  getFrnlEvent,
  type FrnlComponentHandle,
  type FrnlEventTrigger,
} from './events.js';
import type { FrnlState } from './store.js';

export interface FrnlOrchestrationEvent {
  readonly componentId: string;
  readonly eventName: string;
  readonly payload: unknown;
  readonly result: unknown;
}

export type FrnlOrchestrationEventListener = (
  event: FrnlOrchestrationEvent,
) => void | Promise<void>;

export interface FrnlOrchestrationContext {
  readonly store: StoreApi<FrnlState>;
  component(componentId: string): FrnlComponentHandle;
  event(componentId: string, eventName: string): FrnlEventTrigger;
  library<T = unknown>(address: string): T;
  onEvent(
    componentId: string,
    eventName: string,
    listener: FrnlOrchestrationEventListener,
  ): () => void;
}

export interface FrnlOrchestrationDefinition {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly description?: string;
  readonly setup: (context: FrnlOrchestrationContext) => void | (() => void);
}

export function defineFrnlOrchestration(
  definition: FrnlOrchestrationDefinition,
): FrnlOrchestrationDefinition {
  if (!definition.id.trim()) throw new Error('Frnl orchestration id is required.');
  if (!definition.name.trim()) throw new Error('Frnl orchestration name is required.');
  if (typeof definition.setup !== 'function') {
    throw new Error('Frnl orchestration setup must be a function.');
  }
  return Object.freeze({ ...definition });
}

const listeners = new WeakMap<
  StoreApi<FrnlState>,
  Map<string, Set<FrnlOrchestrationEventListener>>
>();

function listenerKey(componentId: string, eventName: string): string {
  return componentId + '\u0000' + eventName;
}

export function subscribeFrnlEvent(
  store: StoreApi<FrnlState>,
  componentId: string,
  eventName: string,
  listener: FrnlOrchestrationEventListener,
): () => void {
  let storeListeners = listeners.get(store);
  if (!storeListeners) {
    storeListeners = new Map();
    listeners.set(store, storeListeners);
  }

  const key = listenerKey(componentId, eventName);
  const eventListeners =
    storeListeners.get(key) ?? new Set<FrnlOrchestrationEventListener>();
  eventListeners.add(listener);
  storeListeners.set(key, eventListeners);

  return () => {
    eventListeners.delete(listener);
    if (eventListeners.size === 0) storeListeners?.delete(key);
  };
}

export function notifyFrnlEventListeners(
  store: StoreApi<FrnlState>,
  invocation: FrnlOrchestrationEvent,
): void | Promise<void> {
  const eventListeners = listeners.get(store)?.get(
    listenerKey(invocation.componentId, invocation.eventName),
  );
  if (!eventListeners) return;

  const pending: Promise<void>[] = [];
  for (const listener of [...eventListeners]) {
    const result = listener(invocation);
    if (result && typeof (result as Promise<void>).then === 'function') {
      pending.push(result as Promise<void>);
    }
  }
  if (pending.length > 0) return Promise.all(pending).then(() => undefined);
}

export function createFrnlOrchestrationContext(
  store: StoreApi<FrnlState>,
): FrnlOrchestrationContext {
  return {
    store,
    component: (componentId) => getFrnlComponentHandle(store, componentId),
    event: (componentId, eventName) => getFrnlEvent(store, componentId, eventName),
    library: <T = unknown>(address: string) => store.getState().libraries[address] as T,
    onEvent: (componentId, eventName, listener) =>
      subscribeFrnlEvent(store, componentId, eventName, listener),
  };
}

export function mountFrnlOrchestration(
  store: StoreApi<FrnlState>,
  definition: FrnlOrchestrationDefinition,
): () => void {
  const cleanup = definition.setup(createFrnlOrchestrationContext(store));
  return typeof cleanup === 'function' ? cleanup : () => undefined;
}
