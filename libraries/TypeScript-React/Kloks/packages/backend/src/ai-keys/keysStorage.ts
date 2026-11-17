/**
 * @file keysStorage.ts
 * @description Storage layer for API keys with in-memory fallback and persistence
 */

import type { ApiKeyEntry } from './types.js';

export class KeysStorage {
  private inMemoryKeys: Map<string, ApiKeyEntry> = new Map();

  loadKeys(): ApiKeyEntry[] {
    return Array.from(this.inMemoryKeys.values());
  }

  saveKey(entry: ApiKeyEntry): void {
    this.inMemoryKeys.set(entry.id, entry);
  }

  saveKeys(entries: ApiKeyEntry[]): void {
    for (const e of entries) {
      this.inMemoryKeys.set(e.id, e);
    }
  }

  deleteKey(id: string): void {
    this.inMemoryKeys.delete(id);
  }

  clear(): void {
    this.inMemoryKeys.clear();
  }
}

export const keysStorage = new KeysStorage();
