/**
 * @file ServiceFacade.ts
 * @description Canonical ServiceFacade for KrnlTS services.
 * Structurally analogous to Skipo's BackendFacade, representing a single service's
 * public semantic boundary, composing functionalities, orchestrations, operations,
 * state, events, dependencies, capabilities, and lifecycle.
 */

import type {
  IService,
  ServiceDefinition,
  OperationContext,
  DependencyContract,
  ServiceCapability,
  ServiceStatus,
} from './ServiceContract.js';
import { ServiceInstance } from './ServiceInstance.js';
import type { Orchestration } from '../orchestration/Orchestration.js';

export interface ServiceFacadeConfig<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  name?: string;
  version?: string;
  description?: string;
  functionalities?: Record<string, unknown>;
  orchestrations?: Record<string, Orchestration>;
  definition?: ServiceDefinition<TState, TEvents>;
  instance?: IService<TState, TEvents>;
  dependencies?: DependencyContract[];
  capabilities?: ServiceCapability[];
}

export class ServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;

  public readonly functionalities: Record<string, unknown>;
  public readonly orchestrations: Record<string, Orchestration>;
  public readonly dependencies: readonly DependencyContract[];
  public readonly capabilities: readonly ServiceCapability[];

  private readonly instance: IService<TState, TEvents>;

  constructor(config: ServiceFacadeConfig<TState, TEvents>) {
    if (!config || !config.id || typeof config.id !== 'string') {
      throw new Error('[ServiceFacade] ServiceFacade requires a valid id.');
    }
    this.id = config.id;
    this.name = config.name || config.id;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';

    this.functionalities = config.functionalities ? { ...config.functionalities } : {};
    this.orchestrations = config.orchestrations ? { ...config.orchestrations } : {};
    this.dependencies = Object.freeze(config.dependencies ? [...config.dependencies] : []);
    this.capabilities = Object.freeze(config.capabilities ? [...config.capabilities] : []);

    if (config.instance) {
      this.instance = config.instance;
    } else if (config.definition) {
      this.instance = new ServiceInstance(config.definition);
    } else {
      this.instance = new ServiceInstance<TState, TEvents>({
        id: this.id,
        name: this.name,
        version: this.version,
        operations: {},
      });
    }
  }

  getInstance(): IService<TState, TEvents> {
    return this.instance;
  }

  getStatus(): ServiceStatus {
    return this.instance.getStatus();
  }

  async start(): Promise<void> {
    await this.instance.start();
  }

  async stop(): Promise<void> {
    await this.instance.stop();
  }

  async dispose(): Promise<void> {
    await this.instance.dispose();
  }

  async call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut> {
    return this.instance.call<TIn, TOut>(op, input, ctx);
  }

  getState(): Readonly<TState> {
    return this.instance.getState();
  }

  setState(mutation: Partial<TState>): void {
    this.instance.setState(mutation);
  }

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void {
    return this.instance.on(event, handler);
  }

  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void {
    this.instance.emit(event, payload);
  }

  registerFunctionality(name: string, functionality: unknown): this {
    if (!name || typeof name !== 'string') {
      throw new Error('[ServiceFacade] Functionality name must be a non-empty string.');
    }
    this.functionalities[name] = functionality;
    return this;
  }

  registerOrchestration(name: string, orchestration: Orchestration): this {
    if (!name || typeof name !== 'string') {
      throw new Error('[ServiceFacade] Orchestration name must be a non-empty string.');
    }
    if (!orchestration) {
      throw new Error('[ServiceFacade] Orchestration instance is required.');
    }
    this.orchestrations[name] = orchestration;
    return this;
  }
}

export function createServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(config: ServiceFacadeConfig<TState, TEvents>): ServiceFacade<TState, TEvents> {
  return new ServiceFacade<TState, TEvents>(config);
}
