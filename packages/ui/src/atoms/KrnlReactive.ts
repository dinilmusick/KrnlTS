import van, { type State } from 'vanjs-core';

/**
 * Direct-DOM Reactivity Bridge for KrnlUI.
 * Connects VanJS reactive state directly to Entity state accessors and event streams.
 */
export class KrnlReactiveBridge {
  private static states = new Map<string, State<any>>();

  /**
   * Retrieves or creates a reactive VanJS state bound to an Entity state key.
   */
  static useEntityState<T>(key: string, initialValue: T): State<T> {
    if (!this.states.has(key)) {
      this.states.set(key, van.state(initialValue));
    }
    return this.states.get(key) as State<T>;
  }

  /**
   * Synchronizes an Entity event emission with a reactive state.
   */
  static syncEvent<T>(state: State<T>, eventPayload: T): void {
    state.val = eventPayload;
  }

  /**
   * Binds a DOM input element directly to a reactive state (two-way binding with zero VDOM).
   */
  static bindInput(state: State<string>) {
    return {
      value: () => state.val,
      oninput: (e: Event) => {
        state.val = (e.target as HTMLInputElement).value;
      }
    };
  }
}
