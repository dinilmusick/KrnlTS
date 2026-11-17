/**
 * @file browserExecutionClient.ts
 * @description Browser-safe execution client for SKIPO applications.
 * Dispatches commands across the queue transport boundary to the backend queue gateway.
 * Conforms to Skipo Governance (< 200 lines).
 */

import {
  BackendCommand,
  NormalizedResult,
  QueueGatewayContract,
  QueueTransportOptions,
} from './queueContracts.js';

export class BrowserExecutionClient implements QueueGatewayContract {
  private gatewayUrl: string;
  private headers: Record<string, string>;
  private timeoutMs: number;

  constructor(options: QueueTransportOptions = {}) {
    this.gatewayUrl = options.gatewayUrl || '/api/queue';
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.timeoutMs = options.timeoutMs || 15000;
  }

  createCommand<T = unknown>(
    type: string,
    payload: T,
    options: { correlationId?: string; idempotencyKey?: string; metadata?: Record<string, unknown> } = {}
  ): BackendCommand<T> {
    const correlationId = options.correlationId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      payload,
      metadata: options.metadata,
      correlationId,
      idempotencyKey: options.idempotencyKey,
      createdAt: Date.now(),
    };
  }

  async enqueue<T = unknown>(command: BackendCommand<T>): Promise<{ jobId: string; correlationId: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.gatewayUrl}/enqueue`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(command),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`[BrowserExecutionClient] Enqueue failed: HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        jobId: data.jobId || command.id,
        correlationId: command.correlationId,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async checkStatus(jobId: string): Promise<NormalizedResult> {
    const res = await fetch(`${this.gatewayUrl}/status/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!res.ok) {
      throw new Error(`[BrowserExecutionClient] Check status failed: HTTP ${res.status}`);
    }

    return await res.json();
  }
}

export function createBrowserExecutionClient(options?: QueueTransportOptions): BrowserExecutionClient {
  return new BrowserExecutionClient(options);
}
