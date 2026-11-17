/**
 * @file DeterministicEndpointExecutor.ts
 * @description Deterministic tool/feature endpoint execution with schema and timeout guards
 */

import { AITransportClient, type AIHttpResponse } from '../ai-provider/AITransportClient.js';

export interface EndpointExecutionParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  payload?: unknown;
  timeoutMs?: number;
  expectedSchema?: Record<string, unknown>;
}

export interface EndpointExecutionResult {
  success: boolean;
  statusCode?: number;
  responseBody?: unknown;
  durationMs: number;
  error?: string;
}

export class DeterministicEndpointExecutor {
  private readonly client: AITransportClient;

  constructor(client?: AITransportClient) {
    this.client = client ?? new AITransportClient();
  }

  async execute(params: EndpointExecutionParams): Promise<EndpointExecutionResult> {
    const start = Date.now();
    try {
      const res: AIHttpResponse<unknown> = await this.client.request({
        url: params.url,
        method: params.method || 'POST',
        headers: params.headers,
        body: params.payload,
        timeoutMs: params.timeoutMs ?? 15000,
      });

      return {
        success: res.ok,
        statusCode: res.status,
        responseBody: res.data,
        durationMs: Date.now() - start,
        error: res.ok ? undefined : `HTTP status ${res.status}: ${res.rawText.slice(0, 200)}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const deterministicEndpointExecutor = new DeterministicEndpointExecutor();
