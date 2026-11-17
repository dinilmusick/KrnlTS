/**
 * @file SkipoState.ts
 * @description Canonical SKIPO_STATE singleton backed by Zustand and LifecycleGraph.
 * Satisfies Invariants I1-I6 and L9 (<=200L).
 */

import { createStore, StoreApi } from 'zustand/vanilla';
import {
  LifecycleDescriptor,
  SkipoStateApi,
  StateEntry,
  StateUpdater,
} from './types.js';
import { LifecycleGraph } from './LifecycleGraph.js';

interface InternalStateStore {
  entries: Record<string, StateEntry<unknown>>;
  setEntry: (id: string, entry: StateEntry<unknown>) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

export class SkipoStateEngine implements SkipoStateApi {
  private graph = new LifecycleGraph();
  private store: StoreApi<InternalStateStore>;

  constructor() {
    this.store = createStore<InternalStateStore>((set) => ({
      entries: {},
      setEntry: (id, entry) =>
        set((state) => ({ entries: { ...state.entries, [id]: entry } })),
      removeEntry: (id) =>
        set((state) => {
          const next = { ...state.entries };
          delete next[id];
          return { entries: next };
        }),
      clearAll: () => set({ entries: {} }),
    }));
  }

  create<T = unknown>(
    owner: string,
    lifecycle: LifecycleDescriptor,
    initialValue: T,
    explicitId?: string
  ): string {
    if (!lifecycle || !lifecycle.type) {
      throw new Error(`[SKIPO_STATE] Explicit lifecycle MUST be declared for owner "${owner}".`);
    }

    const id = explicitId || `state_${owner}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.graph.registerNode(id, lifecycle.type);

    if (lifecycle.targetId) {
      this.graph.addDependency(id, lifecycle.targetId);
    }

    const entry: StateEntry<T> = {
      id,
      owner,
      lifecycle: { ...lifecycle, createdAt: Date.now(), retainCount: 1 },
      value: initialValue,
      dependencies: lifecycle.targetId ? [lifecycle.targetId] : [],
    };

    this.store.getState().setEntry(id, entry as StateEntry<unknown>);
    return id;
  }

  get<T = unknown>(id: string): T | undefined {
    const entry = this.store.getState().entries[id];
    return entry ? (entry.value as T) : undefined;
  }

  set<T = unknown>(id: string, value: T): void {
    const current = this.store.getState().entries[id];
    if (!current) {
      throw new Error(`[SKIPO_STATE] State "${id}" not found. Must call create() first.`);
    }
    this.store.getState().setEntry(id, { ...current, value });
  }

  update<T = unknown>(id: string, updater: StateUpdater<T>): void {
    const current = this.store.getState().entries[id];
    if (!current) {
      throw new Error(`[SKIPO_STATE] State "${id}" not found. Must call create() first.`);
    }
    const nextValue = updater(current.value as T);
    this.store.getState().setEntry(id, { ...current, value: nextValue });
  }

  destroy(id: string): void {
    const toDestroy = this.graph.destroyCascade(id);
    for (const targetId of toDestroy) {
      this.store.getState().removeEntry(targetId);
    }
  }

  bind(stateId: string, lifecycleTarget: string): void {
    const current = this.store.getState().entries[stateId];
    if (!current) {
      throw new Error(`[SKIPO_STATE] State "${stateId}" not found for binding.`);
    }
    this.graph.addDependency(stateId, lifecycleTarget);
    if (!current.dependencies.includes(lifecycleTarget)) {
      this.store.getState().setEntry(stateId, {
        ...current,
        dependencies: [...current.dependencies, lifecycleTarget],
      });
    }
  }

  unbind(stateId: string, lifecycleTarget: string): void {
    const current = this.store.getState().entries[stateId];
    if (current) {
      this.graph.removeDependency(stateId, lifecycleTarget);
      this.store.getState().setEntry(stateId, {
        ...current,
        dependencies: current.dependencies.filter((d) => d !== lifecycleTarget),
      });
    }
  }

  lifecycle(stateId: string): LifecycleDescriptor | undefined {
    return this.store.getState().entries[stateId]?.lifecycle;
  }

  subscribe<T = unknown>(id: string, listener: (value: T | undefined) => void): () => void {
    let prev = this.get<T>(id);
    return this.store.subscribe((state) => {
      const next = state.entries[id]?.value as T | undefined;
      if (next !== prev) {
        prev = next;
        listener(next);
      }
    });
  }

  getAllEntries(): Record<string, StateEntry<unknown>> {
    return this.store.getState().entries;
  }

  getZustandStore(): StoreApi<InternalStateStore> {
    return this.store;
  }

  clear(): void {
    this.graph.clear();
    this.store.getState().clearAll();
  }
}

export const SKIPO_STATE = new SkipoStateEngine();
