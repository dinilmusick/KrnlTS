/**
 * @file healthCheckService.ts
 * @description Periodic and on-demand route and provider health verification
 */

import type { ProviderId } from '../ai-provider/types.js';
import { aiProviderService } from '../ai-provider/AIProviderService.js';
import { modelHealthService } from '../ai-models/modelHealthService.js';
import { modelCatalog } from '../ai-models/modelCatalog.js';
import { keyStore } from '../ai-keys/keyStore.js';

export class HealthCheckService {
  async runRoutineCheck(): Promise<{
    timestamp: string;
    keysTotal: number;
    keysValid: number;
    modelsCatalogTotal: number;
    status: 'healthy';
  }> {
    const keys = keyStore.getKeys();
    const catalog = modelCatalog.getAllModels();
    return {
      timestamp: new Date().toISOString(),
      keysTotal: keys.length,
      keysValid: keys.filter((key) => key.status === 'active' || key.status === 'valid').length,
      modelsCatalogTotal: catalog.length,
      status: 'healthy',
    };
  }

  async checkProvider(providerId: ProviderId, apiKey?: string): Promise<boolean> {
    const status = await aiProviderService.checkHealth(providerId, apiKey);
    return status.isOnline;
  }

  isRouteAvailable(providerId: ProviderId, modelId: string): boolean {
    return modelHealthService.isModelAvailable(providerId, modelId);
  }

  recordRouteFailure(providerId: ProviderId, modelId: string, error: string): void {
    modelHealthService.recordFailure(providerId, modelId, error);
  }

  recordRouteSuccess(providerId: ProviderId, modelId: string, latencyMs: number): void {
    modelHealthService.recordSuccess(providerId, modelId, latencyMs);
  }
}

export const healthCheckService = new HealthCheckService();
