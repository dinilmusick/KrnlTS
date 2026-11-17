/**
 * @file RemoteExecutor.ts
 * @description Transport-mediated executor encapsulating connection lifecycle, correlation IDs, and callback routing.
 */

import { BackendExecutor, Message, Delegation, Job, CallbackHandle } from './types.js';
import { ITransport } from './Transport.js';
import { CallbackRegistry, CallbackFn } from './CallbackRegistry.js';
import { LoadBalancer } from './LoadBalancer.js';

export interface RemoteExecutorOptions {
  transport: ITransport;
  loadBalancer?: LoadBalancer;
  callbackRegistry?: CallbackRegistry;
  sessionId?: string;
}

export class RemoteExecutor implements BackendExecutor {
  private transport: ITransport;
  private loadBalancer?: LoadBalancer;
  private callbackRegistry: CallbackRegistry;
  private sessionId: string;

  constructor(options: RemoteExecutorOptions) {
    this.transport = options.transport;
    this.loadBalancer = options.loadBalancer;
    this.callbackRegistry = options.callbackRegistry || new CallbackRegistry();
    this.sessionId = options.sessionId || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    this.initCallbackListener();
  }

  private initCallbackListener(): void {
    this.transport.onMessage(async (msg: Message) => {
      if (msg.type === 'CALLBACK_REQUEST' && msg.payload) {
        const { handle, args } = msg.payload as { handle: CallbackHandle | string; args: any[] };
        try {
          const result = await this.callbackRegistry.invoke(handle, args, this.sessionId);
          await this.transport.send({
            id: `cb-res-${Date.now()}`,
            type: 'CALLBACK_RESULT',
            operation: msg.operation,
            correlationId: msg.id,
            sessionId: this.sessionId,
            payload: result,
            timestamp: Date.now(),
          });
        } catch (err: any) {
          await this.transport.send({
            id: `cb-err-${Date.now()}`,
            type: 'ERROR',
            operation: msg.operation,
            correlationId: msg.id,
            sessionId: this.sessionId,
            error: { code: 'CALLBACK_FAILED', message: err?.message || String(err) },
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  private prepareMessage<T>(type: Message['type'], operation: string, payload?: T): Message<T> {
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      id,
      type,
      operation,
      payload,
      sessionId: this.sessionId,
      correlationId: id,
      timestamp: Date.now(),
    };
  }

  async execute<T = unknown, R = unknown>(command: Message<T>): Promise<R> {
    const msg = this.prepareMessage<T>('COMMAND', command.operation, command.payload);
    const res = await this.transport.request<T, R>(msg);
    if (res.type === 'ERROR') {
      throw new Error(res.error?.message || `Command "${command.operation}" failed.`);
    }
    return res.payload as R;
  }

  async query<T = unknown, R = unknown>(query: Message<T>): Promise<R> {
    const msg = this.prepareMessage<T>('QUERY', query.operation, query.payload);
    const res = await this.transport.request<T, R>(msg);
    if (res.type === 'ERROR') {
      throw new Error(res.error?.message || `Query "${query.operation}" failed.`);
    }
    return res.payload as R;
  }

  subscribe(channel: string, handler: (event: Message) => void): () => void {
    return this.transport.subscribe(channel, handler);
  }

  async emit(event: Message): Promise<void> {
    const msg = this.prepareMessage('EVENT', event.operation, event.payload);
    await this.transport.send(msg);
  }

  registerCallback(callback: CallbackFn): CallbackHandle {
    return this.callbackRegistry.register(callback, this.sessionId);
  }

  async delegate<T = unknown, R = unknown>(delegation: Delegation<T>): Promise<R> {
    const msg = this.prepareMessage('COMMAND', `${delegation.target}.${delegation.operation}`, delegation);
    const res = await this.transport.request<Delegation<T>, R>(msg);
    return res.payload as R;
  }

  async submitJob<T = unknown, R = unknown>(job: Partial<Job<T, R>>): Promise<Job<T, R>> {
    const msg = this.prepareMessage('JOB_SUBMIT', `jobs.submit`, job);
    const res = await this.transport.request<Partial<Job<T, R>>, Job<T, R>>(msg);
    return res.payload as Job<T, R>;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLoadBalancer(): LoadBalancer | undefined {
    return this.loadBalancer;
  }

  getTransport(): ITransport {
    return this.transport;
  }
}
