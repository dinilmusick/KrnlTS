/**
 * @file BackblazeEventBus.ts
 * @description Event-driven reactive notification bus for Backblaze B2 service events.
 * Immediately closes SSE network connections when no listeners are active.
 * File size < 200 lines strictly.
 */

export type BackblazeEventType =
  | 'b2:object:created'
  | 'b2:object:deleted'
  | 'b2:folder:created'
  | 'b2:bucket:created'
  | 'b2:bucket:deleted'
  | 'b2:sync:requested';

export interface BackblazeEvent {
  type: BackblazeEventType;
  bucketId?: string;
  bucketName?: string;
  path?: string;
  fileId?: string;
  sizeBytes?: number;
  timestamp: string;
}

type EventListener = (event: BackblazeEvent) => void;

class BackblazeEventBusManager {
  private listeners: Set<EventListener> = new Set();
  private sseSource: EventSource | null = null;
  private sseInitialized = false;

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    this.ensureSSEConnection();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.closeSSEConnection();
      }
    };
  }

  public subscribeBucket(bucketId: string, listener: EventListener): () => void {
    const filterListener: EventListener = (event) => {
      if (!event.bucketId || event.bucketId === bucketId) {
        listener(event);
      }
    };
    return this.subscribe(filterListener);
  }

  public emit(event: Omit<BackblazeEvent, 'timestamp'> & { timestamp?: string }): void {
    const fullEvent: BackblazeEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch (err) {
        console.warn('[BackblazeEventBus] Listener error:', err);
      }
    }
  }

  private ensureSSEConnection(): void {
    if (this.sseInitialized || typeof window === 'undefined' || !window.EventSource) return;
    this.sseInitialized = true;
    try {
      this.sseSource = new EventSource('/api/backblaze/events');
      this.sseSource.onmessage = (messageEvent) => {
        try {
          const parsed = JSON.parse(messageEvent.data);
          if (parsed && parsed.type) {
            this.emit(parsed);
          }
        } catch {}
      };
      this.sseSource.onerror = () => {
        // SSE is an optional push channel, fallback gracefully
      };
    } catch {
      // Graceful fallback
    }
  }

  private closeSSEConnection(): void {
    if (this.sseSource) {
      try {
        this.sseSource.close();
      } catch {}
      this.sseSource = null;
    }
    this.sseInitialized = false;
  }
}

export const BackblazeEventBus = new BackblazeEventBusManager();
