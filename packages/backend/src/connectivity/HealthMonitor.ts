/**
 * @file HealthMonitor.ts
 * @description Cluster health monitoring, heartbeat tracking, latency measurement, and automatic failure detection.
 */

import { BackendInstance } from './types.js';

export class HealthMonitor {
  private instances = new Map<string, BackendInstance>();
  private staleThresholdMs: number;

  constructor(staleThresholdMs = 30000) {
    this.staleThresholdMs = staleThresholdMs;
  }

  registerInstance(instance: Omit<BackendInstance, 'lastHeartbeat'>): BackendInstance {
    const full: BackendInstance = {
      ...instance,
      lastHeartbeat: Date.now(),
    };
    this.instances.set(full.id, full);
    return full;
  }

  recordHeartbeat(instanceId: string, metrics?: Partial<BackendInstance>): void {
    const inst = this.instances.get(instanceId);
    if (!inst) return;

    inst.lastHeartbeat = Date.now();
    inst.healthy = true;

    if (metrics) {
      if (metrics.capacity !== undefined) inst.capacity = metrics.capacity;
      if (metrics.activeJobs !== undefined) inst.activeJobs = metrics.activeJobs;
      if (metrics.activeConnections !== undefined) inst.activeConnections = metrics.activeConnections;
      if (metrics.latencyMs !== undefined) inst.latencyMs = metrics.latencyMs;
    }
  }

  markUnhealthy(instanceId: string, reason?: string): void {
    const inst = this.instances.get(instanceId);
    if (inst) {
      inst.healthy = false;
      if (reason) {
        console.warn(`[HealthMonitor] Instance "${instanceId}" marked unhealthy: ${reason}`);
      }
    }
  }

  markHealthy(instanceId: string): void {
    const inst = this.instances.get(instanceId);
    if (inst) {
      inst.healthy = true;
      inst.lastHeartbeat = Date.now();
    }
  }

  getHealthyInstances(): BackendInstance[] {
    const now = Date.now();
    return Array.from(this.instances.values()).filter((inst) => {
      if (!inst.healthy) return false;
      if (now - inst.lastHeartbeat > this.staleThresholdMs) {
        inst.healthy = false;
        return false;
      }
      return true;
    });
  }

  getInstance(id: string): BackendInstance | undefined {
    return this.instances.get(id);
  }

  removeInstance(id: string): boolean {
    return this.instances.delete(id);
  }

  clear(): void {
    this.instances.clear();
  }
}
