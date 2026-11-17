/**
 * @file ConcurrencyManager.ts
 * @description Optimistic concurrency control and compare-and-swap (CAS) versioning primitive.
 */

import { ResourceVersion } from './types.js';

export class ConcurrencyConflictError extends Error {
  constructor(
    public readonly resourceId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(
      `[ConcurrencyConflictError] Version conflict on resource "${resourceId}": expected v${expectedVersion}, actual v${actualVersion}.`
    );
    this.name = 'ConcurrencyConflictError';
  }
}

export class ConcurrencyManager {
  private versions = new Map<string, ResourceVersion>();
  private stateStore = new Map<string, unknown>();

  getVersion(resourceId: string): number {
    return this.versions.get(resourceId)?.version ?? 0;
  }

  setVersion(resourceId: string, version: number): ResourceVersion {
    const rv: ResourceVersion = {
      version,
      updatedAt: Date.now(),
    };
    this.versions.set(resourceId, rv);
    return rv;
  }

  compareAndSwap<T = unknown>(
    resourceId: string,
    expectedVersion: number,
    newValue: T
  ): { success: boolean; newVersion: number; previousValue?: unknown } {
    const currentRv = this.versions.get(resourceId);
    const actualVersion = currentRv?.version ?? 0;

    if (actualVersion !== expectedVersion) {
      return {
        success: false,
        newVersion: actualVersion,
        previousValue: this.stateStore.get(resourceId),
      };
    }

    const nextVersion = actualVersion + 1;
    this.versions.set(resourceId, {
      version: nextVersion,
      updatedAt: Date.now(),
    });
    this.stateStore.set(resourceId, newValue);

    return {
      success: true,
      newVersion: nextVersion,
      previousValue: newValue,
    };
  }

  async optimisticUpdate<T = unknown>(
    resourceId: string,
    expectedVersion: number,
    mutation: () => Promise<T> | T
  ): Promise<{ result: T; newVersion: number }> {
    const currentRv = this.versions.get(resourceId);
    const actualVersion = currentRv?.version ?? 0;

    if (actualVersion !== expectedVersion) {
      throw new ConcurrencyConflictError(resourceId, expectedVersion, actualVersion);
    }

    const result = await mutation();
    const cas = this.compareAndSwap(resourceId, expectedVersion, result);

    if (!cas.success) {
      throw new ConcurrencyConflictError(resourceId, expectedVersion, cas.newVersion);
    }

    return {
      result,
      newVersion: cas.newVersion,
    };
  }

  getState<T = unknown>(resourceId: string): T | undefined {
    return this.stateStore.get(resourceId) as T | undefined;
  }

  clear(): void {
    this.versions.clear();
    this.stateStore.clear();
  }
}
