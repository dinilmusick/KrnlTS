/**
 * @file EventBus.ts
 * @description Real-time anti-polling EventBus with channel subscriptions, sequence tagging, and buffer replay.
 */

import { Message } from './types.js';

export type EventHandler = (event: Message) => void;

export class EventBus {
  private listeners = new Map<string, Set<{ id: string; handler: EventHandler }>>();
  private buffer: Message[] = [];
  private maxBufferSize = 500;
  private sequenceCounter = 0;

  emit(eventOrType: Message | string, payload?: unknown): Message {
    let event: Message;

    if (typeof eventOrType === 'string') {
      this.sequenceCounter++;
      event = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'EVENT',
        operation: eventOrType,
        payload,
        sequence: this.sequenceCounter,
        timestamp: Date.now(),
      };
    } else {
      this.sequenceCounter = Math.max(this.sequenceCounter + 1, eventOrType.sequence || this.sequenceCounter + 1);
      event = {
        ...eventOrType,
        sequence: eventOrType.sequence ?? this.sequenceCounter,
        timestamp: eventOrType.timestamp || Date.now(),
      };
    }

    this.buffer.push(event);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Direct channel subscribers
    const directSubs = this.listeners.get(event.operation);
    if (directSubs) {
      for (const sub of directSubs) {
        try {
          sub.handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber ${sub.id} for ${event.operation}:`, err);
        }
      }
    }

    // Wildcard '*' subscribers
    const wildcardSubs = this.listeners.get('*');
    if (wildcardSubs) {
      for (const sub of wildcardSubs) {
        try {
          sub.handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard subscriber ${sub.id}:`, err);
        }
      }
    }

    return event;
  }

  subscribe(channel: string, handler: EventHandler): () => void {
    const subId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }

    const set = this.listeners.get(channel)!;
    set.add({ id: subId, handler });

    return () => {
      this.unsubscribe(channel, subId);
    };
  }

  unsubscribe(channel: string, subscriptionId: string): void {
    const set = this.listeners.get(channel);
    if (set) {
      for (const item of set) {
        if (item.id === subscriptionId) {
          set.delete(item);
          break;
        }
      }
      if (set.size === 0) {
        this.listeners.delete(channel);
      }
    }
  }

  getBuffer(sinceSequence = 0, channel?: string): Message[] {
    return this.buffer.filter((e) => {
      if ((e.sequence || 0) <= sinceSequence) return false;
      if (channel && channel !== '*' && e.operation !== channel) return false;
      return true;
    });
  }

  getCurrentSequence(): number {
    return this.sequenceCounter;
  }

  clear(): void {
    this.listeners.clear();
    this.buffer = [];
    this.sequenceCounter = 0;
  }
}
