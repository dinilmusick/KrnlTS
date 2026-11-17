/**
 * @file LoadBalancer.ts
 * @description Cluster load balancer with pluggable routing strategies and automatic instance failover.
 */

import { BackendInstance, RoutingStrategy } from './types.js';
import { HealthMonitor } from './HealthMonitor.js';

export class LoadBalancer {
  private healthMonitor: HealthMonitor;
  private defaultStrategy: RoutingStrategy;
  private roundRobinIndex = 0;

  constructor(healthMonitor?: HealthMonitor, defaultStrategy: RoutingStrategy = 'roundRobin') {
    this.healthMonitor = healthMonitor || new HealthMonitor();
    this.defaultStrategy = defaultStrategy;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  selectInstance(strategy?: RoutingStrategy): BackendInstance {
    const instances = this.healthMonitor.getHealthyInstances();
    if (instances.length === 0) {
      throw new Error('[LoadBalancer] No healthy backend instances available.');
    }

    const strat = strategy || this.defaultStrategy;

    switch (strat) {
      case 'leastConnections':
        return instances.reduce((prev, curr) =>
          curr.activeConnections < prev.activeConnections ? curr : prev
        );

      case 'latencyAware':
        return instances.reduce((prev, curr) =>
          curr.latencyMs < prev.latencyMs ? curr : prev
        );

      case 'capacityAware':
        return instances.reduce((prev, curr) =>
          curr.capacity - curr.activeJobs > prev.capacity - prev.activeJobs ? curr : prev
        );

      case 'weighted': {
        const totalWeight = instances.reduce((acc, i) => acc + (i.weight || 1), 0);
        let random = Math.random() * totalWeight;
        for (const inst of instances) {
          random -= inst.weight || 1;
          if (random <= 0) return inst;
        }
        return instances[0];
      }

      case 'roundRobin':
      default: {
        const selected = instances[this.roundRobinIndex % instances.length];
        this.roundRobinIndex = (this.roundRobinIndex + 1) % instances.length;
        return selected;
      }
    }
  }

  async executeWithFailover<T>(
    operation: (instance: BackendInstance) => Promise<T>,
    maxRetries = 2
  ): Promise<T> {
    const triedInstances = new Set<string>();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let instance: BackendInstance;
      try {
        instance = this.selectInstance();
        // Prefer instance not tried yet if possible
        if (triedInstances.has(instance.id)) {
          const healthy = this.healthMonitor.getHealthyInstances();
          const untried = healthy.find((i) => !triedInstances.has(i.id));
          if (untried) instance = untried;
        }
      } catch (err: any) {
        throw lastError || err;
      }

      triedInstances.add(instance.id);
      instance.activeConnections++;

      try {
        const result = await operation(instance);
        instance.activeConnections = Math.max(0, instance.activeConnections - 1);
        return result;
      } catch (err: any) {
        instance.activeConnections = Math.max(0, instance.activeConnections - 1);
        lastError = err;
        this.healthMonitor.markUnhealthy(instance.id, err?.message || String(err));
      }
    }

    throw lastError || new Error('[LoadBalancer] All failover attempts exhausted.');
  }
}
