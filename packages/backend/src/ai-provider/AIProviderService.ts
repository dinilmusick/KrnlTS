/**
 * @file AIProviderService.ts
 * @description Provider management and registry service
 */

import { listProviders, getProviderMeta, PROVIDERS_META, PROVIDER_COLORS } from './providers.js';
import type { ProviderId, ProviderMeta, AIProviderStatus } from './types.js';
import { AITransportClient } from './AITransportClient.js';

export class AIProviderService {
  private readonly client: AITransportClient;
  private readonly customProviders: Map<string, ProviderMeta> = new Map();

  constructor(client?: AITransportClient) {
    this.client = client ?? new AITransportClient();
  }

  listProviders(): ProviderMeta[] {
    const builtin = listProviders();
    const custom = Array.from(this.customProviders.values());
    return [...builtin, ...custom];
  }

  getProvider(id: ProviderId): ProviderMeta | undefined {
    return this.customProviders.get(id) ?? getProviderMeta(id);
  }

  registerCustomProvider(meta: ProviderMeta): void {
    this.customProviders.set(meta.id, meta);
  }

  async checkHealth(id: ProviderId, apiKey?: string): Promise<AIProviderStatus> {
    const meta = this.getProvider(id);
    const start = Date.now();
    if (!meta) {
      return {
        id,
        isOnline: false,
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        error: `Unknown provider ${id}`,
      };
    }

    try {
      const url = `${meta.baseUrl}${meta.modelsEndpoint}`;
      const headers: Record<string, string> = {};
      if (apiKey) {
        if (meta.defaultHeaderKey === 'Authorization') {
          headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        } else {
          headers[meta.defaultHeaderKey] = apiKey.trim();
        }
      }

      const res = await this.client.request({
        url,
        method: 'GET',
        headers,
        timeoutMs: 8000,
      });

      return {
        id,
        isOnline: res.status < 500,
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        id,
        isOnline: false,
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const aiProviderService = new AIProviderService();
