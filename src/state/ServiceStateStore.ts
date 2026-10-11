/**
 * @file ServiceStateStore.ts
 * @description State management primitive for stateful services.
 */

export class ServiceStateStore<TState extends Record<string, unknown> = Record<string, unknown>> {
  private state: TState;
  private listeners: Set<(state: Readonly<TState>, delta: Partial<TState>) => void> = new Set();

  constructor(initialState: TState) {
    this.state = { ...initialState };
  }

  getState(): Readonly<TState> {
    return Object.freeze({ ...this.state });
  }

  setState(mutation: Partial<TState>): void {
    this.state = { ...this.state, ...mutation };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot, mutation);
    }
  }

  subscribe(listener: (state: Readonly<TState>, delta: Partial<TState>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(newState?: TState): void {
    this.state = { ...(newState || ({} as TState)) };
  }
}
