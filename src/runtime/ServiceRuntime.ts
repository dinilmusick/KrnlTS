/**
 * @file ServiceRuntime.ts
 * @description Isolated runtime managing service instances and execution boundaries.
 */

import type { IService, OperationContext } from '../services/ServiceContract.js';
import { ServiceRegistry } from '../registry/ServiceRegistry.js';

export class ServiceRuntime {
  private instances: Map<string, IService> = new Map();
  public readonly registry: ServiceRegistry;

  constructor(registry?: ServiceRegistry) {
    this.registry = registry || new ServiceRegistry();
  }

  register(service: IService): this {
    this.instances.set(service.id, service);
    this.registry.register(service.getDefinition());
    return this;
  }

  get(serviceId: string): IService | undefined {
    return this.instances.get(serviceId);
  }

  async execute<TIn = unknown, TOut = unknown>(
    target: string,
    operation: string,
    input?: TIn,
    ctx?: OperationContext
  ): Promise<TOut> {
    const service = this.instances.get(target);
    if (!service) {
      throw new Error(`[ServiceRuntime] Target service '${target}' not found.`);
    }
    return await service.call<TIn, TOut>(operation, input, ctx);
  }

  async startAll(): Promise<void> {
    for (const service of this.instances.values()) {
      await service.start();
    }
  }

  async stopAll(): Promise<void> {
    for (const service of this.instances.values()) {
      await service.stop();
    }
  }
}
