/**
 * @file keyValidator.ts
 * @description Validates API key authenticity against AI provider endpoints
 */

import type { ProviderId } from '../ai-provider/types.js';
import type { KeyValidationResult } from './types.js';
import { getProviderMeta } from '../ai-provider/providers.js';

export async function validateApiKey(providerId: ProviderId, apiKey: string): Promise<KeyValidationResult> {
  const meta = getProviderMeta(providerId);
  const start = Date.now();

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      status: 'invalid',
      error: 'Empty API key provided',
      latencyMs: 0,
    };
  }

  if (!meta) {
    return {
      valid: true,
      status: 'valid',
      latencyMs: 0,
    };
  }

  try {
    const url = `${meta.baseUrl}${meta.modelsEndpoint}`;
    const headers: Record<string, string> = {};
    if (meta.defaultHeaderKey === 'Authorization') {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    } else {
      headers[meta.defaultHeaderKey] = apiKey.trim();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const latencyMs = Date.now() - start;

    if (res.status === 401 || res.status === 403) {
      return {
        valid: false,
        status: 'invalid',
        error: `Authentication failed (HTTP ${res.status})`,
        latencyMs,
      };
    }

    if (res.status === 429) {
      return {
        valid: false,
        status: 'rate-limited',
        error: 'Rate limit or quota exceeded',
        latencyMs,
      };
    }

    return {
      valid: res.status < 500,
      status: 'valid',
      latencyMs,
    };
  } catch (err: unknown) {
    return {
      valid: false,
      status: 'invalid',
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    };
  }
}
