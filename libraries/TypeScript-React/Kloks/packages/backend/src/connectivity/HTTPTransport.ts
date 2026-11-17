/**
 * @file HTTPTransport.ts
 * @description Standard HTTP/SSE implementation of ITransport with correlation tracking and event streaming.
 */

import { ITransport, MessageHandler, ErrorHandler } from './Transport.js';
import { Message } from './types.js';

export interface HTTPTransportOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  eventsPath?: string;
}

export class HTTPTransport implements ITransport {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;
  private eventsPath: string;
  private connected = false;
  private messageHandlers = new Set<MessageHandler>();
  private errorHandlers = new Set<ErrorHandler>();
  private eventSourceAbort?: AbortController;

  constructor(options: HTTPTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = options.defaultHeaders || {};
    this.timeoutMs = options.timeoutMs || 30000;
    this.eventsPath = options.eventsPath || '/api/events';
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.startEventStream();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.eventSourceAbort) {
      this.eventSourceAbort.abort();
      this.eventSourceAbort = undefined;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async request<T = unknown, R = unknown>(message: Message<T>): Promise<Message<R>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-request-id': message.id,
      ...this.defaultHeaders,
    };
    if (message.sessionId) headers['x-session-id'] = message.sessionId;
    if (message.correlationId) headers['x-correlation-id'] = message.correlationId;

    try {
      const endpoint = `${this.baseUrl}/api/${message.operation.replace(/\./g, '/')}`;
      const res = await fetch(endpoint, {
        method: message.type === 'QUERY' ? 'POST' : 'POST',
        headers,
        body: JSON.stringify(message.payload ?? {}),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const json: any = await res.json();
          errMsg = json?.message || json?.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      return {
        id: `res-${Date.now()}`,
        type: 'RESULT',
        operation: message.operation,
        payload: data as R,
        sessionId: message.sessionId,
        correlationId: message.correlationId,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      clearTimeout(timer);
      const error = new Error(`[HTTPTransport] Request failed: ${err.message || String(err)}`);
      this.notifyError(error);
      throw error;
    }
  }

  async send<T = unknown>(message: Message<T>): Promise<void> {
    await this.request(message);
  }

  subscribe(_channel: string, handler?: MessageHandler): () => void {
    if (handler) this.messageHandlers.add(handler);
    return () => {
      if (handler) this.messageHandlers.delete(handler);
    };
  }

  unsubscribe(_channel: string): void {}

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  private notifyError(err: Error): void {
    for (const h of this.errorHandlers) {
      try { h(err); } catch {}
    }
  }

  private startEventStream(): void {
    if (typeof globalThis.fetch === 'undefined') return;
    this.eventSourceAbort = new AbortController();

    (async () => {
      try {
        const streamUrl = `${this.baseUrl}${this.eventsPath}?stream=true`;
        const res = await fetch(streamUrl, {
          headers: { Accept: 'text/event-stream', ...this.defaultHeaders },
          signal: this.eventSourceAbort?.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (this.connected) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
            if (dataLine) {
              try {
                const parsed = JSON.parse(dataLine.slice(6));
                for (const h of this.messageHandlers) h(parsed);
              } catch {}
            }
          }
        }
      } catch (err: any) {
        if (this.connected && err.name !== 'AbortError') {
          this.notifyError(err);
        }
      }
    })();
  }
}
