/**
 * @file types.ts
 * @description Formal TypeScript types for SKIPO_STATE system.
 * Conforms strictly to SKIPO::STATE_EXECUTION_ARCHITECTURE and L9 (<=200L).
 */

export type LifecycleScopeType =
  | 'COMPONENT'
  | 'PAGE'
  | 'APP'
  | 'COMPONENT_DEPENDENCY'
  | 'STATE_DEPENDENCY';

export interface LifecycleDescriptor {
  type: LifecycleScopeType;
  targetId?: string;
  retainCount?: number;
  createdAt?: number;
}

export interface StateEntry<T = unknown> {
  id: string;
  owner: string;
  lifecycle: LifecycleDescriptor;
  value: T;
  dependencies: string[];
}

export interface StateDeclaration<T = unknown> {
  id: string;
  initialValue: T;
  lifecycle: LifecycleDescriptor;
}

export type StateUpdater<T> = (prev: T) => T;

export interface LifecycleGraphNode {
  id: string;
  type: LifecycleScopeType;
  dependencies: Set<string>;
  dependents: Set<string>;
}

export interface SkipoStateApi {
  create<T = unknown>(owner: string, lifecycle: LifecycleDescriptor, initialValue: T, id?: string): string;
  get<T = unknown>(id: string): T | undefined;
  set<T = unknown>(id: string, value: T): void;
  update<T = unknown>(id: string, updater: StateUpdater<T>): void;
  destroy(id: string): void;
  bind(stateId: string, lifecycleTarget: string): void;
  unbind(stateId: string, lifecycleTarget: string): void;
  lifecycle(stateId: string): LifecycleDescriptor | undefined;
  subscribe<T = unknown>(id: string, listener: (value: T | undefined) => void): () => void;
  getAllEntries(): Record<string, StateEntry<unknown>>;
  clear(): void;
}
