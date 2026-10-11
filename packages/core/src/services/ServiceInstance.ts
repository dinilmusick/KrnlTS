/**
 * @file ServiceInstance.ts
 * @description Concrete service implementation in KrnlTS.
 */

import type {
  IService,
  ServiceDefinition,
  OperationContext,
} from './ServiceContract.js';
import { ServiceStateStore } from '../state/ServiceStateStore.js';
import { ServiceEventBus } from '../events/ServiceEventBus.js';
import { LifecycleManager } from '../lifecycle/LifecycleManager.js';

export class ServiceInstance<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> implements IService<TState, TEvents> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;

  private stateStore?: ServiceStateStore<TState>;
  private eventBus: ServiceEventBus<TEvents>;
  private lifecycle: LifecycleManager;

  constructor(private definition: ServiceDefinition<TState, TEvents>) {
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.lifecycle = new LifecycleManager();
    this.eventBus = new ServiceEventBus<TEvents>();

    if (definition.state?.initial) {
      this.stateStore = new ServiceStateStore<TState>(definition.state.initial);
    }
  }

  getDefinition(): ServiceDefinition<TState, TEvents> {
    return this.definition;
  }

  async start(): Promise<void> {
    this.lifecycle.setStatus('starting');
    if (this.definition.lifecycle?.onInit) {
      await this.definition.lifecycle.onInit();
    }
    if (this.definition.lifecycle?.onStart) {
      await this.definition.lifecycle.onStart();
    }
    this.lifecycle.setStatus('running');
  }

  async stop(): Promise<void> {
    this.lifecycle.setStatus('stopping');
    if (this.definition.lifecycle?.onStop) {
      await this.definition.lifecycle.onStop();
    }
    if (this.definition.lifecycle?.onDispose) {
      await this.definition.lifecycle.onDispose();
    }
    this.lifecycle.setStatus('stopped');
  }

  async call<TIn = unknown, TOut = unknown>(
    op: string,
    input?: TIn,
    ctx: OperationContext = {}
  ): Promise<TOut> {
    this.lifecycle.assertRunning(this.name);
    const operation = this.definition.operations[op];
    if (!operation) {
      throw new Error(`[Service:${this.name}] Operation '${op}' not found.`);
    }
    return (await operation.handler(input, ctx)) as TOut;
  }

  getState(): Readonly<TState> {
    if (!this.stateStore) {
      return Object.freeze({} as TState);
    }
    return this.stateStore.getState();
  }

  setState(mutation: Partial<TState>): void {
    if (!this.stateStore) {
      this.stateStore = new ServiceStateStore<TState>(mutation as TState);
      return;
    }
    this.stateStore.setState(mutation);
  }

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void {
    return this.eventBus.on(event, handler);
  }

  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void {
    this.eventBus.emit(event, payload);
  }
}
