/**
 * @file ServiceProxy.ts
 * @description Transparent client proxy for the remote service contract.
 *
 * Lifecycle is local client lifecycle. Remote execution remains transport-mediated.
 * State and event methods are local cache/subscription semantics.
 */

import type { IService, ServiceDefinition, OperationContext, EndpointDescriptor } from './ServiceContract.js';
import type { ProtocolAdapter, ProtocolEnvelope } from '../protocols/ProtocolAdapter.js';
import { LifecycleManager } from '../lifecycle/LifecycleManager.js';
import { TelemetryController } from '../telemetry/TelemetryController.js';

export class ServiceProxy<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> implements IService<TState, TEvents> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly telemetry: TelemetryController;

  private stateCache: TState;
  private readonly eventHandlers: Map<string, Set<(payload: any) => void>> = new Map();
  private readonly lifecycle = new LifecycleManager();
  private disposed = false;

  constructor(
    private readonly definition: ServiceDefinition<TState, TEvents>,
    private readonly adapter: ProtocolAdapter,
    private readonly endpoint: EndpointDescriptor
  ) {
    if (!definition) {
      throw new Error('[ServiceProxy] Missing service definition.');
    }
    if (!adapter || typeof adapter.send !== 'function') {
      throw new Error("[ServiceProxy:" + (definition.name || 'unknown') + "] Missing or invalid protocol adapter.");
    }
    if (!endpoint || typeof endpoint.address !== 'string' || endpoint.address.length === 0) {
      throw new Error("[ServiceProxy:" + (definition.name || 'unknown') + "] Missing or invalid endpoint descriptor.");
    }
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.telemetry = new TelemetryController(this.id);
    this.stateCache = { ...(definition.state?.initial ?? {}) } as TState;
  }

  getDefinition(): ServiceDefinition<TState, TEvents> {
    return this.definition;
  }

  getStatus(): ReturnType<LifecycleManager['getStatus']> {
    return this.lifecycle.getStatus();
  }

  async start(): Promise<void> {
    if (this.disposed) {
      throw new Error('[ServiceProxy:' + this.name + '] Cannot start a disposed service proxy.');
    }
    const status = this.lifecycle.getStatus();
    if (status === 'running') return;
    if (status === 'stopping' || status === 'starting' || status === 'initializing') {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot start while status is '" + status + "'.");
    }
    if (status === 'uninitialized') {
      this.lifecycle.transitionTo('initializing');
      this.lifecycle.transitionTo('ready');
    }
    this.lifecycle.transitionTo('starting');
    this.lifecycle.transitionTo('running');
  }

  async stop(): Promise<void> {
    const status = this.lifecycle.getStatus();
    if (status === 'stopped') return;
    if (status !== 'running') {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot stop while status is '" + status + "'.");
    }
    this.lifecycle.transitionTo('stopping');
    this.lifecycle.transitionTo('stopped');
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === 'running') await this.stop();
    this.disposed = true;
  }

  async call<TIn = unknown, TOut = unknown>(
    op: string,
    input?: TIn,
    ctx: OperationContext = {}
  ): Promise<TOut> {
    if (!this.definition.operations[op]) {
      throw new Error("[ServiceProxy:" + this.name + "] Operation '" + op + "' not found.");
    }
    if (this.lifecycle.getStatus() !== 'running') {
      await this.start();
    }
    if (!this.adapter.send) {
      throw new Error("[ServiceProxy:" + this.name + "] Adapter does not support send().");
    }

    const envelope: ProtocolEnvelope<TIn> = {
      id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: 'request',
      operation: op,
      payload: input,
      timestamp: Date.now(),
    };

    const parentSpanId = typeof ctx.metadata?.__krnlTelemetryParentSpanId === 'string'
      ? ctx.metadata.__krnlTelemetryParentSpanId
      : undefined;
    const handle = this.telemetry.begin(op, 'service', ctx.correlationId, parentSpanId);
    try {
      const response = await this.adapter.send(this.endpoint, envelope);
      if (response.error) {
        const error = new Error("[ServiceProxy:" + this.name + "] Remote error: " + response.error);
        handle.end(error);
        throw error;
      }
      handle.end();
      return response.payload as TOut;
    } catch (error) {
      handle.end(error);
      throw error;
    }
  }

  getState(): Readonly<TState> {
    return Object.freeze({ ...this.stateCache });
  }

  setState(mutation: Partial<TState>): void {
    this.stateCache = { ...this.stateCache, ...mutation };
  }

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of Array.from(handlers)) {
      try {
        handler(payload);
      } catch (error) {
        console.error("[ServiceProxy:" + this.name + "] Event handler error for '" + event + "':", error);
      }
    }
  }
}
