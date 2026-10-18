/**
 * @file LifecycleManager.ts
 * @description Explicit, deterministic lifecycle state machine for services.
 */

export type ServiceStatus =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped';

const TRANSITIONS: Readonly<Record<ServiceStatus, readonly ServiceStatus[]>> = {
  uninitialized: ['initializing'],
  initializing: ['ready', 'uninitialized'],
  ready: ['starting'],
  starting: ['running', 'ready'],
  running: ['stopping'],
  stopping: ['stopped', 'running'],
  stopped: ['starting'],
};

export class LifecycleManager {
  private status: ServiceStatus = 'uninitialized';

  getStatus(): ServiceStatus {
    return this.status;
  }

  canTransitionTo(next: ServiceStatus): boolean {
    return TRANSITIONS[this.status].includes(next);
  }

  transitionTo(next: ServiceStatus): void {
    if (!this.canTransitionTo(next)) {
      throw new Error("[Lifecycle] Invalid transition '" + this.status + "' -> '" + next + "'.");
    }
    this.status = next;
  }

  setStatus(next: ServiceStatus): void {
    this.transitionTo(next);
  }

  assertRunning(serviceName: string): void {
    if (this.status !== 'running') {
      throw new Error(
        "[Service:" + serviceName + "] Cannot invoke operation while status is '" +
        this.status + "' (expected 'running')."
      );
    }
  }
}
