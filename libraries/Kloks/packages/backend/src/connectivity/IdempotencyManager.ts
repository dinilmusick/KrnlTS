/**
 * @file IdempotencyManager.ts
 * @description In-flight mutation deduplication, concurrent attachment, and completed result caching.
 */

interface CachedOutcome<T = unknown> {
  status: 'completed' | 'failed';
  result?: T;
  error?: string;
  timestamp: number;
}

export class IdempotencyManager {
  private inFlight = new Map<string, Promise<unknown>>();
  private completedCache = new Map<string, CachedOutcome>();
  private ttlMs: number;

  constructor(ttlMs = 60000) {
    this.ttlMs = ttlMs;
  }

  async executeIdempotent<T>(
    idempotencyKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // 1. Check if already completed and cached
    const cached = this.completedCache.get(idempotencyKey);
    if (cached) {
      if (Date.now() - cached.timestamp < this.ttlMs) {
        if (cached.status === 'completed') {
          return cached.result as T;
        }
        throw new Error(cached.error || '[IdempotencyManager] Previous execution failed.');
      } else {
        this.completedCache.delete(idempotencyKey);
      }
    }

    // 2. Check if currently in-flight (join existing promise to eliminate race conditions)
    const existingFlight = this.inFlight.get(idempotencyKey);
    if (existingFlight) {
      return (await existingFlight) as T;
    }

    // 3. Initiate new execution
    const executionPromise = (async () => {
      try {
        const result = await operation();
        this.completedCache.set(idempotencyKey, {
          status: 'completed',
          result,
          timestamp: Date.now(),
        });
        return result;
      } catch (err: any) {
        this.completedCache.set(idempotencyKey, {
          status: 'failed',
          error: err?.message || String(err),
          timestamp: Date.now(),
        });
        throw err;
      } finally {
        this.inFlight.delete(idempotencyKey);
      }
    })();

    this.inFlight.set(idempotencyKey, executionPromise);
    return await executionPromise;
  }

  has(idempotencyKey: string): boolean {
    return this.inFlight.has(idempotencyKey) || this.completedCache.has(idempotencyKey);
  }

  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.completedCache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.completedCache.delete(key);
      }
    }
  }

  clear(): void {
    this.inFlight.clear();
    this.completedCache.clear();
  }
}
