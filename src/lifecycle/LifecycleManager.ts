/**
 * @file LifecycleManager.ts
 * @description Standard lifecycle transitions for services.
 */

export type ServiceStatus = 'uninitialized' | 'initializing' | 'ready' | 'starting' | 'running' | 'stopping' | 'stopped';

export class LifecycleManager {
  private status: ServiceStatus = 'uninitialized';

  getStatus(): ServiceStatus {
    return this.status;
  }

  setStatus(next: ServiceStatus): void {
    this.status = next;
  }

  assertRunning(serviceName: string): void {
    if (this.status !== 'running') {
      throw new Error(`[Service:${serviceName}] Cannot invoke operation while status is '${this.status}' (expected 'running').`);
    }
  }
}
