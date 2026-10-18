/**
 * @file ServiceFacade.ts
 * @description Canonical ServiceFacade for KrnlTS services.
 * Callable boundary of a service, composing functionalities, functionality orchestrations,
 * state, events, dependencies, capabilities, and lifecycle.
 * All external invocations strictly route through the BullMQ execution engine and worker boundary.
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
import { FunctionalityOrchestration } from '../orchestration/FunctionalityOrchestration.js';
import {
  BullMQExecutionEngine,
  BullMQConnectionOptions,
} from '../orchestration/canonical/BullMQExecutionEngine.js';
import {
  BackendCommand,
  WorkerExecutionBoundary,
} from '../orchestration/canonical/WorkerExecutionBoundary.js';
import {
  OrchestrationResult,
  OrchestrationStep,
} from '../orchestration/canonical/model.js';

export interface ServiceFacadeConfig<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  name?: string;
  version?: string;
  description?: string;
  functionalities?: Record<string, unknown>;
  functionalityOrchestrations?: Record<string, FunctionalityOrchestration>;
  /** @deprecated Use functionalityOrchestrations */
  orchestrations?: Record<string, FunctionalityOrchestration>;
  definition?: ServiceDefinition<TState, TEvents>;
  instance?: IService<TState, TEvents>;
  dependencies?: DependencyContract[];
  capabilities?: ServiceCapability[];
  queueConnection?: BullMQConnectionOptions;
  concurrency?: number;
}

export type IServiceFacade = ServiceFacade;

export class ServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;

  public readonly functionalities: Record<string, unknown>;
  public readonly functionalityOrchestrations: Record<string, FunctionalityOrchestration>;
  public readonly dependencies: readonly DependencyContract[];
  public readonly capabilities: readonly ServiceCapability[];

  private readonly instance: IService<TState, TEvents>;
  private readonly executionEngine: BullMQExecutionEngine;

  constructor(config: ServiceFacadeConfig<TState, TEvents>) {
    if (!config || !config.id || typeof config.id !== 'string') {
      throw new Error('[ServiceFacade] ServiceFacade requires a valid id.');
    }
    this.id = config.id;
    this.name = config.name || config.id;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';

    this.functionalities = config.functionalities ? { ...config.functionalities } : {};
    this.functionalityOrchestrations = config.functionalityOrchestrations
      ? { ...config.functionalityOrchestrations }
      : config.orchestrations
      ? { ...config.orchestrations }
      : {};
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

    this.executionEngine = new BullMQExecutionEngine({
      queueName: `krnl_queue_${this.id}`,
      connection: config.queueConnection,
      concurrency: config.concurrency ?? 10,
    });
  }

  get orchestrations(): Record<string, FunctionalityOrchestration> {
    return this.functionalityOrchestrations;
  }

  getInstance(): IService<TState, TEvents> {
    return this.instance;
  }

  getExecutionEngine(): BullMQExecutionEngine {
    return this.executionEngine;
  }

  getWorkerBoundary(): WorkerExecutionBoundary {
    return this.executionEngine.getWorkerBoundary();
  }

  getStatus(): ServiceStatus {
    return this.instance.getStatus();
  }

  async start(): Promise<void> {
    await this.instance.start();
    await this.executionEngine.start();
  }

  async stop(): Promise<void> {
    await this.executionEngine.stop();
    await this.instance.stop();
  }

  async dispose(): Promise<void> {
    await this.executionEngine.dispose();
    await this.instance.dispose();
  }

  /**
   * External caller callable boundary for single functionality / operation execution.
   * Path: External Caller -> Service Facade -> BullMQ Command -> Worker -> Functionality -> Result.
   * Strictly avoids synchronous unmediated execution outside the queue.
   */
  async call<TIn = unknown, TOut = unknown>(
    op: string,
    input?: TIn,
    ctx?: OperationContext
  ): Promise<TOut> {
    const correlationId = ctx?.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const commandId = `cmd_${this.id}_${op}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const command: BackendCommand<TIn> = {
      id: commandId,
      type: `${this.id}.${op}`,
      payload: (input ?? {}) as TIn,
      correlationId,
      idempotencyKey: ctx?.idempotencyKey,
      createdAt: Date.now(),
    };

    const result = await this.executionEngine.executeCommand<TIn, TOut>(command, async (payload, workerCtx) => {
      // Execute in worker context
      WorkerExecutionBoundary.assertWorkerContext(workerCtx);

      // 1. Check direct functionality implementation
      if (this.functionalities[op] && typeof (this.functionalities[op] as any).execute === 'function') {
        return await (this.functionalities[op] as any).execute(payload, {
          correlationId: workerCtx.correlationId,
          state: this.instance.getState(),
        });
      }

      // 2. Fall back to service definition operation handler
      return await this.instance.call<TIn, TOut>(op, payload, {
        correlationId: workerCtx.correlationId,
        idempotencyKey: command.idempotencyKey,
      });
    });

    if (result.status === 'FAILED') {
      throw new Error(result.error || `[ServiceFacade:${this.id}] Operation '${op}' execution failed.`);
    }

    return result.data as TOut;
  }

  /**
   * External caller callable boundary for functionality orchestration execution.
   * Path: External Caller -> Service Facade -> BullMQ Command -> Worker -> FunctionalityOrchestration -> Result.
   */
  async orchestrate<TIn = unknown, TOut = unknown>(
    orchestrationName: string,
    input?: TIn,
    options: {
      correlationId?: string;
      idempotencyKey?: string;
      timeoutMs?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<OrchestrationResult<TOut>> {
    const orch = this.functionalityOrchestrations[orchestrationName];
    if (!orch) {
      throw new Error(
        `[ServiceFacade:${this.id}] FunctionalityOrchestration "${orchestrationName}" not found.`
      );
    }

    const correlationId = options.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const commandId = `cmd_orch_${this.id}_${orchestrationName}_${Date.now()}`;

    const command: BackendCommand<TIn> = {
      id: commandId,
      type: `${this.id}.orchestrations.${orchestrationName}`,
      payload: (input ?? {}) as TIn,
      correlationId,
      idempotencyKey: options.idempotencyKey,
      createdAt: Date.now(),
    };

    const cmdResult = await this.executionEngine.executeCommand<TIn, OrchestrationResult<TOut>>(
      command,
      async (payload, workerCtx) => {
        WorkerExecutionBoundary.assertWorkerContext(workerCtx);

        // Bind orchestration steps to functionalities of THIS service
        const rawSteps = orch.getSteps();
        const boundSteps: OrchestrationStep[] = rawSteps.map((s) => {
          if (s.type === 'task' && s.target) {
            return {
              ...s,
              handler: async (stepInput: any, stepCtx) => {
                return await this.call(s.target!, stepInput, {
                  correlationId: stepCtx.correlationId,
                });
              },
            };
          }
          return s;
        });

        // Nested orchestration runner (FunctionalityOrchestration -> FunctionalityOrchestration)
        const nestedRunner = async (
          childOrchId: string,
          childInput: unknown,
          childCtx: any
        ): Promise<unknown> => {
          const childOrch = this.functionalityOrchestrations[childOrchId];
          if (!childOrch) {
            throw new Error(
              `[ServiceFacade:${this.id}] Nested FunctionalityOrchestration "${childOrchId}" not found in service.`
            );
          }
          const nestedResult = await this.orchestrate(childOrchId, childInput, {
            correlationId: childCtx.correlationId,
            timeoutMs: childOrch.timeoutMs,
          });
          if (nestedResult.status !== 'COMPLETED') {
            throw new Error(nestedResult.error || `Nested orchestration "${childOrchId}" failed.`);
          }
          return nestedResult.output;
        };

        return await this.executionEngine.executeOrchestration<TIn, TOut>(
          { id: orch.id, name: orch.name, version: orch.version, timeoutMs: orch.timeoutMs, scope: 'functionality' },
          boundSteps,
          payload,
          {
            correlationId: workerCtx.correlationId,
            idempotencyKey: command.idempotencyKey,
            timeoutMs: options.timeoutMs || orch.timeoutMs,
            metadata: options.metadata,
            nestedRunner,
          }
        );
      }
    );

    if (cmdResult.status === 'FAILED') {
      throw new Error(cmdResult.error || `[ServiceFacade:${this.id}] Orchestration failed.`);
    }

    return cmdResult.data as OrchestrationResult<TOut>;
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

  registerFunctionalityOrchestration(name: string, orchestration: FunctionalityOrchestration): this {
    if (!name || typeof name !== 'string') {
      throw new Error('[ServiceFacade] FunctionalityOrchestration name must be a non-empty string.');
    }
    if (!orchestration) {
      throw new Error('[ServiceFacade] FunctionalityOrchestration instance is required.');
    }
    this.functionalityOrchestrations[name] = orchestration;
    return this;
  }

  /** @deprecated Use registerFunctionalityOrchestration */
  registerOrchestration(name: string, orchestration: FunctionalityOrchestration): this {
    return this.registerFunctionalityOrchestration(name, orchestration);
  }
}

export function createServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(config: ServiceFacadeConfig<TState, TEvents>): ServiceFacade<TState, TEvents> {
  return new ServiceFacade<TState, TEvents>(config);
}
