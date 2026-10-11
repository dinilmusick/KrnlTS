/**
 * @file ServiceEventBus.ts
 * @description In-memory strongly-typed event bus for services.
 */

export class ServiceEventBus<TEvents extends Record<string, unknown> = Record<string, unknown>> {
  private handlers: Map<string, Set<(payload: any) => void>> = new Map();

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[ServiceEventBus] Handler error for '${event}':`, err);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
