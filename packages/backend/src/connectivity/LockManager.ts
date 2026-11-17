/**
 * @file LockManager.ts
 * @description Resource-scoped FIFO Mutex and Distributed Lock Coordinator with timeout bounds and release guarantees.
 */

import { DistributedLock } from './types.js';

interface Waiter {
  resolve: (release: () => void) => void;
  reject: (err: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

interface ResourceLockState {
  locked: boolean;
  ownerId?: string;
  lease?: DistributedLock;
  waiters: Waiter[];
}

export class LockManager {
  private locks = new Map<string, ResourceLockState>();
  private defaultTimeoutMs: number;

  constructor(defaultTimeoutMs = 10000) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  private getState(key: string): ResourceLockState {
    let state = this.locks.get(key);
    if (!state) {
      state = { locked: false, waiters: [] };
      this.locks.set(key, state);
    }
    return state;
  }

  async acquire(key: string, ownerId = 'local-worker', timeoutMs?: number): Promise<() => void> {
    const timeout = timeoutMs ?? this.defaultTimeoutMs;
    const state = this.getState(key);

    if (!state.locked) {
      state.locked = true;
      state.ownerId = ownerId;
      state.lease = {
        key,
        ownerId,
        leaseId: `lease-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        expiration: Date.now() + timeout,
      };
      return this.createRelease(key, state.lease.leaseId);
    }

    return new Promise<() => void>((resolve, reject) => {
      const waiter: Waiter = {
        resolve,
        reject,
      };

      waiter.timer = setTimeout(() => {
        const idx = state.waiters.indexOf(waiter);
        if (idx !== -1) state.waiters.splice(idx, 1);
        reject(new Error(`[LockManager] Lock acquisition timed out for key "${key}" after ${timeout}ms.`));
      }, timeout);

      state.waiters.push(waiter);
    });
  }

  private createRelease(key: string, leaseId: string): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release(key, leaseId);
    };
  }

  release(key: string, leaseId?: string): void {
    const state = this.locks.get(key);
    if (!state || !state.locked) return;

    if (leaseId && state.lease && state.lease.leaseId !== leaseId) {
      console.warn(`[LockManager] Stale lease release ignored for key "${key}".`);
      return;
    }

    const nextWaiter = state.waiters.shift();
    if (nextWaiter) {
      if (nextWaiter.timer) clearTimeout(nextWaiter.timer);
      const newLeaseId = `lease-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      state.lease = {
        key,
        ownerId: state.ownerId || 'next-worker',
        leaseId: newLeaseId,
        expiration: Date.now() + this.defaultTimeoutMs,
      };
      nextWaiter.resolve(this.createRelease(key, newLeaseId));
    } else {
      state.locked = false;
      state.ownerId = undefined;
      state.lease = undefined;
      this.locks.delete(key);
    }
  }

  async withLock<T>(key: string, operation: () => Promise<T> | T, timeoutMs?: number): Promise<T> {
    const release = await this.acquire(key, 'with-lock-worker', timeoutMs);
    try {
      return await operation();
    } finally {
      release();
    }
  }

  isLocked(key: string): boolean {
    const state = this.locks.get(key);
    if (!state || !state.locked) return false;
    if (state.lease && Date.now() > state.lease.expiration) {
      this.release(key);
      return false;
    }
    return true;
  }

  clear(): void {
    for (const state of this.locks.values()) {
      for (const w of state.waiters) {
        if (w.timer) clearTimeout(w.timer);
        w.reject(new Error('[LockManager] Lock manager cleared.'));
      }
    }
    this.locks.clear();
  }
}
