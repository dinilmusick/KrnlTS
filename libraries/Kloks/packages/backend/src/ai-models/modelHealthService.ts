/**
 * @file modelHealthService.ts
 * @description Tracks and provides real-time health and availability for AI models
 */

import type { ProviderId } from '../ai-provider/types.js';
import type { ModelHealthStatus } from './types.js';

export class ModelHealthService {
  private healthMap: Map<string, ModelHealthStatus> = new Map();

  recordSuccess(providerId: ProviderId, modelId: string, latencyMs: number): void {
    const key = `${providerId}:${modelId}`;
    this.healthMap.set(key, {
      modelId,
      providerId,
      isHealthy: true,
      latencyMs,
      consecutiveFailures: 0,
      lastCheckedAt: new Date().toISOString(),
    });
  }

  recordFailure(providerId: ProviderId, modelId: string, error: string): void {
    const key = `${providerId}:${modelId}`;
    const existing = this.healthMap.get(key);
    const consecutive = (existing?.consecutiveFailures ?? 0) + 1;

    this.healthMap.set(key, {
      modelId,
      providerId,
      isHealthy: consecutive < 3,
      latencyMs: existing?.latencyMs ?? 0,
      consecutiveFailures: consecutive,
      lastCheckedAt: new Date().toISOString(),
      lastError: error,
    });
  }

  isModelAvailable(providerId: ProviderId, modelId: string): boolean {
    const status = this.healthMap.get(`${providerId}:${modelId}`);
    return status ? status.isHealthy : true;
  }

  getHealth(providerId: ProviderId, modelId: string): ModelHealthStatus | undefined {
    return this.healthMap.get(`${providerId}:${modelId}`);
  }

  getAllHealth(): ModelHealthStatus[] {
    return Array.from(this.healthMap.values());
  }
}

export const modelHealthService = new ModelHealthService();
