/**
 * @file ServiceProxy.ts
 * @description Transparent client proxy invoking a remote or mediated service.
 * Invariant: LOCAL SERVICE = REMOTE SERVICE CONTRACT.
 */

import type {
  IService,
  ServiceDefinition,
  OperationContext,
  EndpointDescriptor,
} from './ServiceContract.js';
import type { ProtocolAdapter, ProtocolEnvelope } from '../protocols/ProtocolAdapter.js';

export class ServiceProxy<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> implements IService<TState, TEvents> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;

  private stateCache: TState;
  private eventHandlers: Map<string, Set<(payload: any) => void>> = new Map();

  constructor(
    private definition: ServiceDefinition<TState, TEvents>,
    private adapter: ProtocolAdapter,
    private endpoint: EndpointDescriptor
  ) {
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.stateCache = (definition.state?.initial || {}) as TState;
  }

  getDefinition(): ServiceDefinition<TState, TEvents> {
    return this.definition;
  }

  async start(): Promise<void> {}
  async stop(): Promise<void> {}

  async call<TIn = unknown, TOut = unknown>(
    op: string,
    input?: TIn,
    ctx: OperationContext = {}
  ): Promise<TOut> {
    if (!this.adapter.send) {
      throw new Error(`[ServiceProxy:${this.name}] Adapter does not support send().`);
    }

    const envelope: ProtocolEnvelope<TIn> = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'request',
      operation: op,
      payload: input,
      timestamp: Date.now(),
    };

    const response = await this.adapter.send(this.endpoint, envelope);
    if (response.error) {
      throw new Error(`[ServiceProxy:${this.name}] Remote error: ${response.error}`);
    }
    return response.payload as TOut;
  }

  getState(): Readonly<TState> {
    return Object.freeze({ ...this.stateCache });
  }

  setState(mutation: Partial<TState>): void {
    this.stateCache = { ...this.stateCache, ...mutation };
  }

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }

  emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of Array.from(handlers)) {
        handler(payload);
      }
    }
  }
}
