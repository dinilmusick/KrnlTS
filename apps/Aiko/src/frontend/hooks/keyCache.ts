/**
 * ASCII Architecture Flowchart: keyCache
 *
 *   ┌──────────────────────────────────┐
 *   │        Local Key Cache           │
 *   └──────────────────────────────────┘
 */

import { ProviderId } from '../types/app.js';
import { apiClient } from '../../libraries/apiClient.js';

const CACHE_KEY = 'aiko_gateway_user_keys';

// ════ CACHE HELPERS ═══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function getCachedUserKeys(): Array<{ providerId: ProviderId; label: string; key: string; weight?: number }> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCachedUserKey(payload: { providerId: ProviderId; label: string; key: string; weight?: number }): void {
  try {
    const existing = getCachedUserKeys();
    const updated = [...existing.filter(k => k.label !== payload.label), payload];
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save key cache to localStorage', e);
  }
}

export function removeCachedUserKeyByLabel(label: string): void {
  try {
    const existing = getCachedUserKeys();
    const updated = existing.filter(k => k.label !== label);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update localStorage cache on delete', e);
  }
}

export async function restoreKeysIfEmpty(backendKeys: Array<{ id: string }>): Promise<boolean> {
  const isCustomKey = (k: { id: string }) => !k.id.endsWith('-env') && k.id !== 'key-local-llama';
  const custom = backendKeys.filter(isCustomKey);
  if (custom.length > 0) return false;

  const cached = getCachedUserKeys();
  if (cached.length === 0) return false;

  await Promise.all(cached.map(k => apiClient.addKey(k)));
  return true;
}