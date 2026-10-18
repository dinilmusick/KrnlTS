/**
 * @file Entity.ts
 * @description Canonical declarative Entity actor and application definition for KrnlTS.
 */

import type { ServiceCapability, ProtocolType } from '../services/ServiceContract.js';

export interface EntityDescriptor {
  id: string;
  version: string;
  description?: string;
  capabilities?: ServiceCapability[];
}

export interface EntityFlowChain {
  name: string;
  steps: Array<{ type: 'functionality' | 'entityOrchestration'; target: string; orchestration?: string }>;
  visibility: 'public' | 'private' | 'internal';
  thenFunctionality(funcName: string): EntityFlowChain;
  thenEntityOrchestration(entityName: string, orchName: string): EntityFlowChain;
  register(options?: { visibility?: 'public' | 'private' | 'internal' }): EntityFlowChain;
}

export interface LocalComponentDescriptor {
  id: string;
  uiSpec?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Base declarative Entity compositor.
 * Follows Entity Purity Law: purely declarative orchestrator with no procedural loops.
 */
export class Entity {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  private readonly flows: Map<string, EntityFlowChain> = new Map();
  private readonly locals: Map<string, LocalComponentDescriptor> = new Map();

  constructor(descriptor: EntityDescriptor) {
    if (!descriptor || typeof descriptor !== 'object' || !descriptor.id) {
      throw new Error('[Entity] Valid entity descriptor with non-empty id is required.');
    }
    this.id = descriptor.id;
    this.version = descriptor.version || '1.0.0';
    this.description = descriptor.description || '';
  }

  async boot(): Promise<void> {
    // Declarative hook executed during entity initialization
  }

  async init(): Promise<void> {
    // Declarative hook executed on entity lifecycle start
  }

  async dispose(): Promise<void> {
    this.flows.clear();
    this.locals.clear();
  }

  flow(name: string): EntityFlowChain {
    const chain: EntityFlowChain = {
      name,
      steps: [],
      visibility: 'internal',
      thenFunctionality(funcName: string) {
        chain.steps.push({ type: 'functionality', target: funcName });
        return chain;
      },
      thenEntityOrchestration(entityName: string, orchName: string) {
        chain.steps.push({ type: 'entityOrchestration', target: entityName, orchestration: orchName });
        return chain;
      },
      register(options) {
        if (options?.visibility) chain.visibility = options.visibility;
        return chain;
      },
    };
    this.flows.set(name, chain);
    return chain;
  }

  addLocal(descriptor: LocalComponentDescriptor): this {
    if (!descriptor || !descriptor.id) {
      throw new Error('[Entity] Local component requires a valid id.');
    }
    this.locals.set(descriptor.id, descriptor);
    return this;
  }

  getFlow(name: string): EntityFlowChain | undefined {
    return this.flows.get(name);
  }

  listFlows(): EntityFlowChain[] {
    return Array.from(this.flows.values());
  }

  getLocal(id: string): LocalComponentDescriptor | undefined {
    return this.locals.get(id);
  }
}

/**
 * Magnetic loader dynamically resolving and attaching functionality quad-units to an entity.
 */
export class KrnlMagneticLoader {
  static async loadAll(entity: Entity, metaUrl?: string): Promise<string[]> {
    if (!entity) throw new Error('[KrnlMagneticLoader] Target entity is required.');
    const loaded: string[] = [];
    if (metaUrl) {
      loaded.push(entity.id);
    }
    return loaded;
  }
}

export interface AppProtocolConfig {
  protocol: ProtocolType | string;
  port?: number;
  prefix?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AppFrontendConfig {
  rootEntity: string;
  variant?: number;
}

export interface AppDefinition {
  name: string;
  version: string;
  description?: string;
  protocols?: AppProtocolConfig[];
  entities?: Array<new () => Entity>;
  frontend?: AppFrontendConfig;
}

export function defineApp(def: AppDefinition): AppDefinition {
  if (!def || typeof def !== 'object') {
    throw new Error('[defineApp] Application definition must be an object.');
  }
  if (!def.name || typeof def.name !== 'string' || def.name.trim() === '') {
    throw new Error('[defineApp] Application definition must specify a non-empty name.');
  }
  return {
    ...def,
    version: def.version || '1.0.0',
    protocols: def.protocols ? [...def.protocols] : [],
    entities: def.entities ? [...def.entities] : [],
  };
}

export const Protocols = {
  HTTP: (opts: { port?: number; prefix?: string } = {}): AppProtocolConfig => ({
    protocol: 'http',
    port: opts.port ?? 8080,
    prefix: opts.prefix ?? '/api',
  }),
  WebSocket: (opts: { port?: number } = {}): AppProtocolConfig => ({
    protocol: 'ws',
    port: opts.port ?? 8081,
  }),
  MCP: (opts: { name?: string } = {}): AppProtocolConfig => ({
    protocol: 'mcp',
    name: opts.name ?? 'krnl-mcp-agent',
  }),
  UDP: (opts: { port?: number } = {}): AppProtocolConfig => ({
    protocol: 'udp',
    port: opts.port ?? 8082,
  }),
  P2P: (opts: Record<string, unknown> = {}): AppProtocolConfig => ({
    protocol: 'p2p',
    ...opts,
  }),
};
