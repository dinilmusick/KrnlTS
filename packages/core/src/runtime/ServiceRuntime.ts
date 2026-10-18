/**
 * @file ServiceRuntime.ts
 * @description Isolated runtime managing service instances and execution boundaries.
 */

import type { IService, OperationContext } from '../services/ServiceContract.js';
import { ServiceRegistry } from '../registry/ServiceRegistry.js';

export class ServiceRuntime {
  private readonly instances: Map<string, IService> = new Map();
  public readonly registry: ServiceRegistry;

  constructor(registry?: ServiceRegistry) {
    this.registry = registry ?? new ServiceRegistry();
  }

  register(service: IService): this {
    const existing = this.instances.get(service.id);
    if (existing && existing !== service) {
      throw new Error("[ServiceRuntime] Service '" + service.id + "' is already registered.");
    }
    this.registry.register(service.getDefinition());
    this.instances.set(service.id, service);
    return this;
  }

  unregister(serviceId: string): boolean {
    const removed = this.instances.delete(serviceId);
    this.registry.unregister(serviceId);
    return removed;
  }

  get(serviceId: string): IService | undefined {
    return this.instances.get(serviceId);
  }

  list(): IService[] {
    return Array.from(this.instances.values());
  }

  async execute<TIn = unknown, TOut = unknown>(
    target: string,
    operation: string,
    input?: TIn,
    ctx?: OperationContext
  ): Promise<TOut> {
    const service = this.instances.get(target);
    if (!service) {
      throw new Error("[ServiceRuntime] Target service '" + target + "' not found.");
    }
    return service.call<TIn, TOut>(operation, input, ctx);
  }

  async startAll(): Promise<void> {
    const started: IService[] = [];
    try {
      for (const service of this.instances.values()) {
        await service.start();
        started.push(service);
      }
    } catch (error) {
      for (const service of started.reverse()) {
        try {
          await service.stop();
        } catch {
          // Preserve the original startup failure.
        }
      }
      throw error;
    }
  }

  async disposeAll(): Promise<void> {
    let firstError: unknown;
    const services = Array.from(this.instances.values()).reverse();
    for (const service of services) {
      try { await service.dispose(); } catch (error) { firstError ??= error; }
    }
    if (firstError) throw firstError;
  }

  async stopAll(): Promise<void> {
    let firstError: unknown;
    const services = Array.from(this.instances.values()).reverse();
    for (const service of services) {
      try {
        await service.stop();
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) throw firstError;
  }
}
