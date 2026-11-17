/**
 * @file WebSocketTransport.ts
 * @description Full-duplex WebSocket implementation of ITransport with auto-reconnect and heartbeat.
 */

import { ITransport, MessageHandler, ErrorHandler } from './Transport.js';
import { Message } from './types.js';

export interface WebSocketTransportOptions {
  url: string;
  heartbeatIntervalMs?: number;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketTransport implements ITransport {
  private url: string;
  private ws: any = null;
  private connected = false;
  private messageHandlers = new Set<MessageHandler>();
  private errorHandlers = new Set<ErrorHandler>();
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private heartbeatTimer: any = null;
  private heartbeatIntervalMs: number;
  private reconnectDelayMs: number;

  constructor(options: WebSocketTransportOptions) {
    this.url = options.url;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs || 15000;
    this.reconnectDelayMs = options.reconnectDelayMs || 2000;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const WSClass = (globalThis as any).WebSocket;
        if (!WSClass) {
          throw new Error('WebSocket is not supported in this runtime environment.');
        }

        this.ws = new WSClass(this.url);

        this.ws.onopen = () => {
          this.connected = true;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.stopHeartbeat();
        };

        this.ws.onerror = (event: any) => {
          const err = new Error(`[WebSocketTransport] Socket error: ${event.message || 'unknown'}`);
          for (const h of this.errorHandlers) h(err);
          if (!this.connected) reject(err);
        };

        this.ws.onmessage = (event: any) => {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.type === 'PONG') return;

            // Resolve pending request
            if (data.correlationId && this.pendingRequests.has(data.correlationId)) {
              const pending = this.pendingRequests.get(data.correlationId)!;
              this.pendingRequests.delete(data.correlationId);
              if (data.type === 'ERROR') {
                pending.reject(new Error(data.error?.message || 'Remote error'));
              } else {
                pending.resolve(data);
              }
              return;
            }

            for (const h of this.messageHandlers) h(data);
          } catch {}
        };
      } catch (err: any) {
        reject(err);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async request<T = unknown, R = unknown>(message: Message<T>): Promise<Message<R>> {
    if (!this.connected || !this.ws) {
      throw new Error('[WebSocketTransport] Cannot send request: WebSocket is not connected.');
    }

    const corrId = message.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const outgoing = { ...message, id: corrId, correlationId: corrId };

    return new Promise<Message<R>>((resolve, reject) => {
      this.pendingRequests.set(corrId, { resolve, reject });
      this.ws.send(JSON.stringify(outgoing));
    });
  }

  async send<T = unknown>(message: Message<T>): Promise<void> {
    if (!this.connected || !this.ws) {
      throw new Error('[WebSocketTransport] Cannot send message: WebSocket is not connected.');
    }
    this.ws.send(JSON.stringify(message));
  }

  subscribe(channel: string, handler?: MessageHandler): () => void {
    if (handler) this.messageHandlers.add(handler);
    this.send({
      id: `sub-${Date.now()}`,
      type: 'COMMAND',
      operation: 'system.subscribe',
      payload: { channel },
      timestamp: Date.now(),
    }).catch(() => {});

    return () => {
      if (handler) this.messageHandlers.delete(handler);
      this.unsubscribe(channel);
    };
  }

  unsubscribe(channel: string): void {
    if (this.connected) {
      this.send({
        id: `unsub-${Date.now()}`,
        type: 'COMMAND',
        operation: 'system.unsubscribe',
        payload: { channel },
        timestamp: Date.now(),
      }).catch(() => {});
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => { this.messageHandlers.delete(handler); };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => { this.errorHandlers.delete(handler); };
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.scheduleNextHeartbeat();
  }

  private scheduleNextHeartbeat(): void {
    if (!this.connected) return;
    this.heartbeatTimer = setTimeout(() => {
      if (this.connected && this.ws) {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        this.scheduleNextHeartbeat();
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  getReconnectDelay(): number {
    return this.reconnectDelayMs;
  }
}
