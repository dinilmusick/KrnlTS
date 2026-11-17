type Listener = (...args: any[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  addListener(event: string, listener: Listener) { return this.on(event, listener); }

  once(event: string, listener: Listener) {
    const wrapped: Listener = (...args) => {
      this.removeListener(event, wrapped);
      listener(...args);
    };
    return this.on(event, wrapped);
  }

  off(event: string, listener: Listener) { return this.removeListener(event, listener); }

  removeListener(event: string, listener: Listener) {
    const set = this.listeners.get(event);
    set?.delete(listener);
    if (set?.size === 0) this.listeners.delete(event);
    return this;
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(listener => listener(...args));
    return this.listeners.has(event);
  }

  removeAllListeners(event?: string) {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
    return this;
  }

  listenersFor(event: string) { return [...(this.listeners.get(event) ?? [])]; }
}

export default EventEmitter;
