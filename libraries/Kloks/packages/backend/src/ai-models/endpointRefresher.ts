/**
 * @file endpointRefresher.ts
 * @description Dynamic provider model discovery and refresh logic
 */

import type { ProviderId } from '../ai-provider/types.js';
import type { ModelCatalogEntry } from './types.js';
import { AITransportClient } from '../ai-provider/AITransportClient.js';
import { getProviderMeta } from '../ai-provider/providers.js';

export class EndpointRefresher {
  private readonly client: AITransportClient;

  constructor(client?: AITransportClient) {
    this.client = client ?? new AITransportClient();
  }

  async fetchRemoteModels(providerId: ProviderId, apiKey: string): Promise<ModelCatalogEntry[]> {
    const meta = getProviderMeta(providerId);
    if (!meta) throw new Error(`Unknown provider ${providerId}`);

    const url = `${meta.baseUrl}${meta.modelsEndpoint}`;
    const headers: Record<string, string> = {};
    if (meta.defaultHeaderKey === 'Authorization') {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    } else {
      headers[meta.defaultHeaderKey] = apiKey.trim();
    }

    const res = await this.client.request<{ data?: any[]; models?: any[] }>({
      url,
      method: 'GET',
      headers,
      timeoutMs: 12000,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch models from ${providerId}: HTTP ${res.status}`);
    }

    const rawList = res.data.data || res.data.models || [];
    return rawList.map((item: any) => ({
      id: item.id || item.name || '',
      name: item.display_name || item.name || item.id || '',
      providerId,
      contextWindow: item.context_window || item.input_token_limit || 131072,
      supportsTools: true,
      supportsVision: Boolean(item.architecture?.modality?.includes('image')),
      supportsJson: true,
      status: 'active',
    }));
  }
}

export const endpointRefresher = new EndpointRefresher();
