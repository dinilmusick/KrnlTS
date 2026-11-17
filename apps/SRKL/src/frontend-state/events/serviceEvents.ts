/**
 * @file serviceEvents.ts
 * @description State transition and domain events for Srkl Hub.
 * Conforms to APP_ARCHITECTURE_SPEC Section 22.
 */

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type ServiceEvent =
  | DomainEvent<{ serviceId: string; status: string }>
  | DomainEvent<{ accountId: string; service: string }>
  | DomainEvent<{ metric: string; value: number }>;

export class DomainEventEmitter {
  private listeners: Map<string, Array<(event: DomainEvent) => void>> = new Map();

  public on(type: string, handler: (event: DomainEvent) => void): () => void {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
    return () => {
      const current = this.listeners.get(type) || [];
      this.listeners.set(type, current.filter(h => h !== handler));
    };
  }

  public emit(type: string, payload: unknown, metadata?: Record<string, unknown>): void {
    const event: DomainEvent = {
      type,
      payload,
      timestamp: Date.now(),
      metadata,
    };
    const list = this.listeners.get(type) || [];
    for (const handler of list) {
      handler(event);
    }
  }
}

export const domainEvents = new DomainEventEmitter();
