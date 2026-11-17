/**
 * @file InProcessExecutor.ts
 * @description In-memory direct execution adapter operating without network sockets or serialization overhead.
 */

import { BackendExecutor, Message, Delegation, Job, CallbackHandle } from './types.js';
import { BackendRegistry } from './BackendRegistry.js';
import { EventBus } from './EventBus.js';
import { CallbackRegistry, CallbackFn } from './CallbackRegistry.js';
import { JobScheduler } from './JobScheduler.js';

export class InProcessExecutor implements BackendExecutor {
  private registry: BackendRegistry;
  private eventBus: EventBus;
  private callbackRegistry: CallbackRegistry;
  private jobScheduler: JobScheduler;

  constructor(
    registry?: BackendRegistry,
    eventBus?: EventBus,
    callbackRegistry?: CallbackRegistry,
    jobScheduler?: JobScheduler
  ) {
    this.registry = registry || new BackendRegistry();
    this.eventBus = eventBus || new EventBus();
    this.callbackRegistry = callbackRegistry || new CallbackRegistry();
    this.jobScheduler = jobScheduler || new JobScheduler();
  }

  getRegistry(): BackendRegistry {
    return this.registry;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getCallbackRegistry(): CallbackRegistry {
    return this.callbackRegistry;
  }

  getJobScheduler(): JobScheduler {
    return this.jobScheduler;
  }

  async execute<T = unknown, R = unknown>(command: Message<T>): Promise<R> {
    const parts = command.operation.split('.');
    const domain = parts[0];
    const opName = parts.slice(1).join('.');

    const def = this.registry.getCommand(domain, opName);
    if (!def || !def.handler) {
      throw new Error(`[InProcessExecutor] Command not found: "${command.operation}" in domain "${domain}".`);
    }

    return (await def.handler(command.payload, command)) as R;
  }

  async query<T = unknown, R = unknown>(query: Message<T>): Promise<R> {
    const parts = query.operation.split('.');
    const domain = parts[0];
    const opName = parts.slice(1).join('.');

    const def = this.registry.getQuery(domain, opName);
    if (!def || !def.handler) {
      throw new Error(`[InProcessExecutor] Query not found: "${query.operation}" in domain "${domain}".`);
    }

    return (await def.handler(query.payload, query)) as R;
  }

  subscribe(channel: string, handler: (event: Message) => void): () => void {
    return this.eventBus.subscribe(channel, handler);
  }

  async emit(event: Message): Promise<void> {
    this.eventBus.emit(event);
  }

  registerCallback(callback: CallbackFn): CallbackHandle {
    return this.callbackRegistry.register(callback);
  }

  async delegate<T = unknown, R = unknown>(delegation: Delegation<T>): Promise<R> {
    if (delegation.callbackHandle) {
      return await this.callbackRegistry.invoke(
        delegation.callbackHandle,
        [delegation.payload],
        delegation.sessionId
      );
    }

    // Otherwise treat as command execution
    return await this.execute<T, R>({
      id: `del-${Date.now()}`,
      type: 'COMMAND',
      operation: `${delegation.target}.${delegation.operation}`,
      payload: delegation.payload,
      sessionId: delegation.sessionId,
      correlationId: delegation.correlationId,
      timestamp: Date.now(),
    });
  }

  async submitJob<T = unknown, R = unknown>(job: Partial<Job<T, R>>): Promise<Job<T, R>> {
    if (!job.type) {
      throw new Error('[InProcessExecutor] Job submission requires a valid "type".');
    }
    return this.jobScheduler.submit<T, R>(job as any);
  }
}
