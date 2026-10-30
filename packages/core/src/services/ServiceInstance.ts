/**
 * @file ServiceInstance.ts
 * @description Concrete service implementation in KrnlTS.
 */

import type { IService, ServiceDefinition, OperationContext } from './ServiceContract.js';
import { ServiceStateStore } from '../state/ServiceStateStore.js';
import { LifecycleManager } from '../lifecycle/LifecycleManager.js';
import { TelemetryController } from '../telemetry/TelemetryController.js';

export class ServiceInstance<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> implements IService<TState, TEvents> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly telemetry: TelemetryController;

  private stateStore?: ServiceStateStore<TState>;
  private readonly lifecycle: LifecycleManager;
  private initialized = false;
  private disposed = false;

  constructor(private readonly definition: ServiceDefinition<TState, TEvents>) {
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.telemetry = new TelemetryController(this.id);
    this.lifecycle = new LifecycleManager();
    if (definition.state) {
      this.stateStore = new ServiceStateStore<TState>(definition.state.initial);
    }
  }

  getDefinition(): ServiceDefinition<TState, TEvents> {
    return this.definition;
  }

  getStatus(): ReturnType<LifecycleManager['getStatus']> {
    return this.lifecycle.getStatus();
  }

  async start(): Promise<void> {
    if (this.disposed) throw new Error('[Service:' + this.name + '] Cannot start a disposed service.');
    const current = this.lifecycle.getStatus();
    if (current === 'running') return;
    if (current === 'initializing' || current === 'starting' || current === 'stopping') {
      throw new Error("[Service:" + this.name + "] Cannot start while status is '" + current + "'.");
    }

    if (!this.initialized) {
      this.lifecycle.transitionTo('initializing');
      try {
        await this.definition.lifecycle?.onInit?.();
        this.initialized = true;
        this.lifecycle.transitionTo('ready');
      } catch (error) {
        this.lifecycle.transitionTo('uninitialized');
        throw error;
      }
    }

    this.lifecycle.transitionTo('starting');
    try {
      await this.definition.lifecycle?.onStart?.();
      this.lifecycle.transitionTo('running');
    } catch (error) {
      this.lifecycle.transitionTo('ready');
      throw error;
    }
  }

  async stop(): Promise<void> {
    const current = this.lifecycle.getStatus();
    if (current === 'stopped') return;
    if (current !== 'running') {
      throw new Error("[Service:" + this.name + "] Cannot stop while status is '" + current + "'.");
    }

    this.lifecycle.transitionTo('stopping');
    try {
      await this.definition.lifecycle?.onStop?.();
      this.lifecycle.transitionTo('stopped');
    } catch (error) {
      this.lifecycle.transitionTo('running');
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === 'running') await this.stop();
    await this.definition.lifecycle?.onDispose?.();
    this.disposed = true;
  }

  async call<TIn = unknown, TOut = unknown>(
    op: string,
    input?: TIn,
    ctx: OperationContext = {}
  ): Promise<TOut> {
    this.lifecycle.assertRunning(this.name);
    const operation = this.definition.operations[op];
    if (!operation) {
      throw new Error("[Service:" + this.name + "] Operation '" + op + "' not found.");
    }
    if (ctx.metadata?.__krnlTelemetryInternal === true) {
      return (await operation.handler(input, ctx)) as TOut;
    }

    const parentSpanId = typeof ctx.metadata?.__krnlTelemetryParentSpanId === 'string'
      ? ctx.metadata.__krnlTelemetryParentSpanId
      : undefined;
    const handle = this.telemetry.begin(op, 'service', ctx.correlationId, parentSpanId);
    try {
      const output = await operation.handler(input, ctx);
      handle.end();
      return output as TOut;
    } catch (error) {
      handle.end(error);
      throw error;
    }
  }

  getState(): Readonly<TState> {
    return this.stateStore?.getState() ?? Object.freeze({} as TState);
  }

  setState(mutation: Partial<TState>): void {
    if (!this.stateStore) {
      this.stateStore = new ServiceStateStore<TState>({ ...(mutation as TState) });
      return;
    }
    this.stateStore.setState(mutation);
  }

}
