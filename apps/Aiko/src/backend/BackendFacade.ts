/**
 * @file BackendFacade.ts
 * @description Canonical application-level BackendFacade for Aiko.
 * Aggregates all ServiceFacades into a single unified capability surface.
 * Conforms to L7 (App Architecture Spec), L8, and L9 (Lines <= 200).
 */

import type { IServiceFacade, ServiceNamespace } from '@ultrst-armada/krnl';
import type {
  IBackendFacade,
  CapabilityCategory,
  CapabilityOwnerInfo,
  CrossServiceExecutionOptions,
} from './BackendFacadeTypes.js';

export class BackendFacade implements IBackendFacade {
  private readonly services = new Map<string, IServiceFacade>();
  private readonly capabilityOwners = new Map<string, CapabilityOwnerInfo[]>();

  public readonly namespaces: Record<string, ServiceNamespace> = {};
  public readonly libraries: Record<string, any>;
  public readonly functionalities: Record<string, any>;
  public readonly orchestrations: Record<string, any>;

  constructor() {
    this.libraries = this.createCapabilityProxy('libraries');
    this.functionalities = this.createCapabilityProxy('functionalities');
    this.orchestrations = this.createCapabilityProxy('orchestrations');
  }

  public registerService(facade: IServiceFacade, alias?: string): this {
    if (!facade || typeof facade !== 'object' || !facade.id) {
      throw new Error('[BackendFacade] Invalid service facade provided for registration.');
    }
    const af = facade as any;
    const ns: ServiceNamespace = typeof af.getNamespace === 'function' ? af.getNamespace() : (af.namespace ?? {
      serviceId: facade.id,
      serviceName: facade.name || facade.id,
      version: facade.version || '1.0.0',
      libraries: facade.libraries || {},
      functionalities: facade.functionalities || {},
      functionalityOrchestrations: af.orchestrations || {},
      capabilities: facade.capabilities || [],
      dependencies: facade.dependencies || [],
    });

    this.services.set(ns.serviceId, facade);
    this.services.set(ns.serviceName, facade);
    this.namespaces[ns.serviceName] = ns;
    this.namespaces[ns.serviceId] = ns;
    if (alias) {
      this.services.set(alias, facade);
      this.namespaces[alias] = ns;
    }

    this.indexCapabilities(ns.serviceId, ns.serviceName, 'libraries', ns.libraries);
    this.indexCapabilities(ns.serviceId, ns.serviceName, 'functionalities', ns.functionalities);
    this.indexCapabilities(ns.serviceId, ns.serviceName, 'orchestrations', ns.functionalityOrchestrations || af.orchestrations || {});
    return this;
  }

  private indexCapabilities(svcId: string, svcName: string, cat: CapabilityCategory, dict: Record<string, unknown>): void {
    if (!dict) return;
    for (const capName of Object.keys(dict)) {
      const key = `${cat}:${capName}`;
      const existing = this.capabilityOwners.get(key) || [];
      existing.push({ capabilityName: capName, serviceId: svcId, serviceName: svcName, category: cat });
      this.capabilityOwners.set(key, existing);
    }
  }

  private resolveCapabilityItem<T>(cat: CapabilityCategory, name: string, serviceNs?: string): T {
    if (serviceNs) {
      const ns = this.namespaces[serviceNs];
      if (!ns) throw new Error(`[BackendFacade] Service namespace '${serviceNs}' not found.`);
      const container = cat === 'orchestrations' ? (ns.functionalityOrchestrations || (ns as any).orchestrations) : ns[cat];
      const item = container?.[name];
      if (item === undefined) throw new Error(`[BackendFacade] Capability '${name}' not found in namespace '${serviceNs}'.`);
      return item as T;
    }
    const owners = this.capabilityOwners.get(`${cat}:${name}`) || [];
    if (owners.length === 0) throw new Error(`[BackendFacade] Capability '${name}' (${cat}) not found across services.`);
    if (owners.length > 1) {
      const servicesList = owners.map((o) => o.serviceName).join(', ');
      throw new Error(`[BackendFacade] Collision detected: capability '${name}' is registered by multiple services (${servicesList}).`);
    }
    const ns = this.namespaces[owners[0].serviceId];
    const container = cat === 'orchestrations' ? (ns.functionalityOrchestrations || (ns as any).orchestrations) : ns[cat];
    return container[name] as T;
  }

  public getLibrary<TLib = unknown>(name: string, serviceNamespace?: string): TLib {
    return this.resolveCapabilityItem<TLib>('libraries', name, serviceNamespace);
  }

  public getFunctionality<TFunc = unknown>(name: string, serviceNamespace?: string): TFunc {
    return this.resolveCapabilityItem<TFunc>('functionalities', name, serviceNamespace);
  }

  public getOrchestration<TOrch = unknown>(name: string, serviceNamespace?: string): TOrch {
    return this.resolveCapabilityItem<TOrch>('orchestrations', name, serviceNamespace);
  }

  public async executeCapability<TIn = unknown, TOut = unknown>(
    capabilityName: string,
    operation?: string,
    input?: TIn,
    options?: CrossServiceExecutionOptions
  ): Promise<TOut> {
    const targetOp = operation || capabilityName;
    let targetService: IServiceFacade | undefined;

    if (this.services.has(capabilityName)) {
      targetService = this.services.get(capabilityName);
    } else {
      const owners = [
        ...(this.capabilityOwners.get(`functionalities:${capabilityName}`) || []),
        ...(this.capabilityOwners.get(`orchestrations:${capabilityName}`) || []),
      ];
      if (owners.length === 1) targetService = this.services.get(owners[0].serviceId);
      else if (owners.length > 1) throw new Error(`[BackendFacade] Collision: capability '${capabilityName}' owned by multiple services.`);
    }

    if (!targetService) throw new Error(`[BackendFacade] Cannot resolve capability '${capabilityName}' to any registered service.`);

    const af = targetService as any;
    if (typeof af.orchestrate === 'function' && af.orchestrations?.[targetOp]) {
      const res = await af.orchestrate(targetOp, input, options);
      return res.output ?? res.data ?? res;
    }
    if (typeof targetService.call === 'function') return (await targetService.call<TIn, TOut>(targetOp, input, options)) as TOut;
    if (typeof af.execute === 'function') return (await af.execute(targetOp, input, options)) as TOut;
    throw new Error(`[BackendFacade] Service '${targetService.id}' provides neither call() nor execute().`);
  }

  public getService(nameOrId: string): IServiceFacade {
    const svc = this.services.get(nameOrId);
    if (!svc) throw new Error(`[BackendFacade] Service '${nameOrId}' not found.`);
    return svc;
  }

  public hasCapability(name: string, category?: CapabilityCategory): boolean {
    if (category) return this.capabilityOwners.has(`${category}:${name}`);
    return (
      this.capabilityOwners.has(`libraries:${name}`) ||
      this.capabilityOwners.has(`functionalities:${name}`) ||
      this.capabilityOwners.has(`orchestrations:${name}`)
    );
  }

  public listServices(): string[] {
    return Array.from(new Set(Array.from(this.services.keys())));
  }

  private createCapabilityProxy(cat: CapabilityCategory): Record<string, any> {
    return new Proxy({}, {
      get: (_target, prop: string | symbol) => (typeof prop === 'string' && prop !== 'then' ? this.resolveCapabilityItem(cat, prop) : undefined),
      has: (_target, prop: string | symbol) => typeof prop === 'string' && this.capabilityOwners.has(`${cat}:${prop}`),
      ownKeys: () => {
        const prefix = `${cat}:`;
        const keys: string[] = [];
        for (const k of this.capabilityOwners.keys()) if (k.startsWith(prefix)) keys.push(k.slice(prefix.length));
        return keys;
      },
      getOwnPropertyDescriptor: (_target, prop: string | symbol) => (typeof prop === 'string' && this.capabilityOwners.has(`${cat}:${prop}`)
        ? { configurable: true, enumerable: true, writable: false } : undefined),
    });
  }
}

export const backendFacade = new BackendFacade();
