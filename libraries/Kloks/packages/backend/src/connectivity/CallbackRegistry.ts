/**
 * @file CallbackRegistry.ts
 * @description Session-scoped callback registry converting JavaScript functions to opaque capability handles.
 */

import { CallbackHandle } from './types.js';

export type CallbackFn = (...args: any[]) => Promise<any> | any;

interface RegistryEntry {
  handle: CallbackHandle;
  fn: CallbackFn;
}

export class CallbackRegistry {
  private entries = new Map<string, RegistryEntry>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 300000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  register(
    fn: CallbackFn,
    sessionId = 'default-session',
    capability = 'delegation',
    ttlMs?: number
  ): CallbackHandle {
    const id = `cb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const expiration = Date.now() + (ttlMs || this.defaultTtlMs);

    const handle: CallbackHandle = {
      id,
      sessionId,
      capability,
      expiration,
    };

    this.entries.set(id, { handle, fn });
    return handle;
  }

  async invoke<TArgs extends any[] = any[], TReturn = any>(
    handle: CallbackHandle | string,
    args: TArgs,
    callerSessionId?: string
  ): Promise<TReturn> {
    const handleId = typeof handle === 'string' ? handle : handle.id;
    const entry = this.entries.get(handleId);

    if (!entry) {
      throw new Error(`[CallbackRegistry] Callback handle "${handleId}" not found or expired.`);
    }

    if (Date.now() > entry.handle.expiration) {
      this.entries.delete(handleId);
      throw new Error(`[CallbackRegistry] Callback handle "${handleId}" has expired.`);
    }

    if (callerSessionId && callerSessionId !== entry.handle.sessionId) {
      throw new Error(
        `[CallbackRegistry] Unauthorized callback invocation: session mismatch (${callerSessionId} vs ${entry.handle.sessionId}).`
      );
    }

    return await entry.fn(...args);
  }

  unregister(handleOrId: CallbackHandle | string): boolean {
    const id = typeof handleOrId === 'string' ? handleOrId : handleOrId.id;
    return this.entries.delete(id);
  }

  expire(handleOrId: CallbackHandle | string): void {
    const id = typeof handleOrId === 'string' ? handleOrId : handleOrId.id;
    const entry = this.entries.get(id);
    if (entry) {
      entry.handle.expiration = 0;
      this.entries.delete(id);
    }
  }

  pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [id, entry] of this.entries.entries()) {
      if (now > entry.handle.expiration) {
        this.entries.delete(id);
        pruned++;
      }
    }
    return pruned;
  }

  clear(): void {
    this.entries.clear();
  }
}
