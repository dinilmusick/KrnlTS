/**
 * @file BackendResolver.ts
 * @description Topology resolution engine selecting between local in-process and remote execution adapters.
 */

import { BackendExecutor, ResolutionStrategy } from './types.js';

export interface BackendResolverOptions {
  strategy?: ResolutionStrategy;
  inProcessExecutor?: BackendExecutor;
  remoteExecutor?: BackendExecutor;
  remoteHealthCheck?: () => Promise<boolean>;
}

export class BackendResolver {
  private strategy: ResolutionStrategy;
  private inProcessExecutor?: BackendExecutor;
  private remoteExecutor?: BackendExecutor;
  private remoteHealthCheck?: () => Promise<boolean>;
  private activeExecutor?: BackendExecutor;

  constructor(options: BackendResolverOptions) {
    this.strategy = options.strategy || 'LOCAL_FIRST';
    this.inProcessExecutor = options.inProcessExecutor;
    this.remoteExecutor = options.remoteExecutor;
    this.remoteHealthCheck = options.remoteHealthCheck;
    if (this.strategy === 'LOCAL' && this.inProcessExecutor) {
      this.activeExecutor = this.inProcessExecutor;
    }
  }

  setInProcessExecutor(executor: BackendExecutor): void {
    this.inProcessExecutor = executor;
  }

  setRemoteExecutor(executor: BackendExecutor): void {
    this.remoteExecutor = executor;
  }

  setStrategy(strategy: ResolutionStrategy): void {
    this.strategy = strategy;
    this.activeExecutor = undefined;
  }

  getStrategy(): ResolutionStrategy {
    return this.strategy;
  }

  getActiveExecutor(): BackendExecutor | undefined {
    return this.activeExecutor;
  }

  async resolve(): Promise<BackendExecutor> {
    if (this.activeExecutor) return this.activeExecutor;

    switch (this.strategy) {
      case 'LOCAL':
        if (!this.inProcessExecutor) {
          throw new Error('[BackendResolver] LOCAL strategy selected but no InProcessExecutor configured.');
        }
        this.activeExecutor = this.inProcessExecutor;
        return this.activeExecutor;

      case 'REMOTE':
        if (!this.remoteExecutor) {
          throw new Error('[BackendResolver] REMOTE strategy selected but no RemoteExecutor configured.');
        }
        this.activeExecutor = this.remoteExecutor;
        return this.activeExecutor;

      case 'REMOTE_FIRST': {
        const isRemoteHealthy = await this.checkRemoteHealth();
        if (isRemoteHealthy && this.remoteExecutor) {
          this.activeExecutor = this.remoteExecutor;
        } else if (this.inProcessExecutor) {
          console.warn('[BackendResolver] Remote unavailable, falling back to InProcessExecutor.');
          this.activeExecutor = this.inProcessExecutor;
        } else {
          throw new Error('[BackendResolver] REMOTE_FIRST failed: neither remote nor in-process executors are available.');
        }
        return this.activeExecutor;
      }

      case 'LOCAL_FIRST':
      default: {
        if (this.inProcessExecutor) {
          this.activeExecutor = this.inProcessExecutor;
        } else if (this.remoteExecutor) {
          const isRemoteHealthy = await this.checkRemoteHealth();
          if (isRemoteHealthy) {
            this.activeExecutor = this.remoteExecutor;
          } else {
            throw new Error('[BackendResolver] LOCAL_FIRST failed: local missing and remote unhealthy.');
          }
        } else {
          throw new Error('[BackendResolver] No executor configured.');
        }
        return this.activeExecutor;
      }
    }
  }

  private async checkRemoteHealth(): Promise<boolean> {
    if (!this.remoteExecutor) return false;
    if (!this.remoteHealthCheck) return true;
    try {
      return await this.remoteHealthCheck();
    } catch {
      return false;
    }
  }

  async failover(): Promise<BackendExecutor> {
    if (this.activeExecutor === this.remoteExecutor && this.inProcessExecutor) {
      console.warn('[BackendResolver] Failover: switching from Remote to InProcessExecutor.');
      this.activeExecutor = this.inProcessExecutor;
      return this.activeExecutor;
    }
    if (this.activeExecutor === this.inProcessExecutor && this.remoteExecutor) {
      console.warn('[BackendResolver] Failover: switching from InProcess to RemoteExecutor.');
      this.activeExecutor = this.remoteExecutor;
      return this.activeExecutor;
    }
    throw new Error('[BackendResolver] Cannot failover: no alternative executor available.');
  }

  async reconnect(): Promise<void> {
    this.activeExecutor = undefined;
    await this.resolve();
  }

  async health(): Promise<{ local: boolean; remote: boolean; active: ResolutionStrategy }> {
    const remoteOk = await this.checkRemoteHealth();
    return {
      local: !!this.inProcessExecutor,
      remote: remoteOk,
      active: this.strategy,
    };
  }
}
