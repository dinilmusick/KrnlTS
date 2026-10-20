/**
 * @file ServiceFacade.ts
 * @description Canonical ServiceFacade for KrnlTS services.
 * Callable boundary of a service, composing functionalities, functionality orchestrations,
 * state, events, dependencies, capabilities, and lifecycle.
 * All external invocations strictly route through KrnlQ and worker execution boundary.
 */

import type {
  IService,
  ServiceDefinition,
  OperationContext,
  DependencyContract,
  ServiceCapability,
  ServiceStatus,
  ServiceNamespace,
} from './ServiceContract.js';
import { ServiceInstance } from './ServiceInstance.js';
import { FunctionalityOrchestration } from '../orchestration/FunctionalityOrchestration.js';
import { KrnlQueue, KrnlQueueOptions } from '../orchestration/canonical/KrnlQ.js';
import {
  BackendCommand,
  WorkerExecutionBoundary,
} from '../orchestration/canonical/WorkerExecutionBoundary.js';
import {
  OrchestrationResult,
  OrchestrationStep,
  OrchestrationContext,
} from '../orchestration/canonical/model.js';

export interface DefaultFrontendReference {
  component: string;
  package?: string;
  export?: string;
  relationship?: 'recommended' | 'required';
}

export interface ServiceFacadeConfig<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>,
  TLibraries extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  name?: string;
  version?: string;
  description?: string;
  functionalities?: Record<string, unknown>;
  functionalityOrchestrations?: Record<string, FunctionalityOrchestration>;
  /** @deprecated Use functionalityOrchestrations */
  orchestrations?: Record<string, FunctionalityOrchestration>;
  libraries?: TLibraries;
  definition?: ServiceDefinition<TState, TEvents>;
  instance?: IService<TState, TEvents>;
  dependencies?: DependencyContract[];
  capabilities?: ServiceCapability[];
  queueOptions?: KrnlQueueOptions;
  concurrency?: number;
  /** Canonical FLOKS frontend component recommended for this service. */
  defaultFrontend?: DefaultFrontendReference;
}

export type IServiceFacade = ServiceFacade<any, any, any>;

export class ServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>,
  TLibraries extends Record<string, unknown> = Record<string, unknown>
> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;

  public readonly functionalities: Record<string, unknown>;
  public readonly functionalityOrchestrations: Record<string, FunctionalityOrchestration>;
  public readonly libraries: TLibraries;
  public readonly dependencies: readonly DependencyContract[];
  public readonly capabilities: readonly ServiceCapability[];
  public readonly defaultFrontend?: DefaultFrontendReference;

  private readonly instance: IService<TState, TEvents>;
  private readonly queue: KrnlQueue;

  constructor(config: ServiceFacadeConfig<TState, TEvents, TLibraries>) {
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
    this.libraries = (config.libraries ? { ...config.libraries } : {}) as TLibraries;
    this.dependencies = Object.freeze(config.dependencies ? [...config.dependencies] : []);
    this.capabilities = Object.freeze(config.capabilities ? [...config.capabilities] : []);
    this.defaultFrontend = config.defaultFrontend ? Object.freeze({ ...config.defaultFrontend }) : undefined;

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

    this.queue = new KrnlQueue({
      queueName: `krnl_queue_${this.id}`,
      concurrency: config.concurrency ?? config.queueOptions?.concurrency ?? 10,
      autoStart: config.queueOptions?.autoStart ?? true,
    });
  }

  get orchestrations(): Record<string, FunctionalityOrchestration> {
    return this.functionalityOrchestrations;
  }

  getInstance(): IService<TState, TEvents> {
    return this.instance;
  }

  getQueue(): KrnlQueue {
    return this.queue;
  }

  getExecutionEngine(): KrnlQueue {
    return this.queue;
  }

  getWorkerBoundary(): WorkerExecutionBoundary {
    return this.queue.getWorkerBoundary();
  }

  getStatus(): ServiceStatus {
    return this.instance.getStatus();
  }

  async start(): Promise<void> {
    await this.instance.start();
    await this.queue.start();
  }

  async stop(): Promise<void> {
    await this.queue.stop();
    await this.instance.stop();
  }

  async dispose(): Promise<void> {
    await this.queue.dispose();
    await this.instance.dispose();
  }

  /**
   * External caller callable boundary for single functionality / operation execution.
   * Path: External Caller -> Service Facade -> KrnlQ Job -> Worker -> Functionality -> Result.
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

    const result = await this.queue.executeCommand<TIn, TOut>(command, async (payload, workerCtx) => {
      // Execute inside KrnlWorker context
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
   * Path: External Caller -> Service Facade -> KrnlQ Command -> Worker -> FunctionalityOrchestration -> Result.
   */
  async orchestrate<TIn = unknown, TOut = unknown>(
    orchestrationName: string,
    input?: TIn,
    options: {
      correlationId?: string;
      idempotencyKey?: string;
      timeoutMs?: number;
      metadata?: Record<string, unknown>;
      abortSignal?: AbortSignal;
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

    const cmdResult = await this.queue.executeCommand<TIn, OrchestrationResult<TOut>>(
      command,
      async (payload, workerCtx) => {
        WorkerExecutionBoundary.assertWorkerContext(workerCtx);

        // Helper to resolve inputs for dependent steps
        const resolveStepInput = (step: OrchestrationStep, results: Record<string, unknown>) => {
          const deps = step.dependsOn;
          if (!deps || deps.length === 0) {
            return results['input'];
          }
          if (deps.length === 1) {
            const depRes = results[deps[0]];
            const initialInput = results['input'];
            if (
              typeof depRes === 'object' &&
              depRes !== null &&
              typeof initialInput === 'object' &&
              initialInput !== null &&
              !Array.isArray(depRes) &&
              !Array.isArray(initialInput)
            ) {
              return { ...initialInput, ...depRes };
            }
            return depRes !== undefined ? depRes : results['input'];
          }
          const joined: Record<string, unknown> = {};
          for (const dep of deps) {
            joined[dep] = results[dep];
          }
          return joined;
        };

        // Bind orchestration steps to functionalities of THIS service
        const rawSteps = orch.getSteps();
        const boundSteps: OrchestrationStep[] = rawSteps.map((s) => {
          let compensation = s.compensation;
          if (s.compensation?.target && !s.compensation.handler) {
            compensation = {
              ...s.compensation,
              handler: async (compCtx: OrchestrationContext) => {
                await this.call(s.compensation!.target!, compCtx.results[s.id], {
                  correlationId: compCtx.correlationId,
                });
              },
            };
          }

          if (s.type === 'task' && s.target) {
            return {
              ...s,
              compensation,
              handler: async (_stepInput: any, stepCtx) => {
                const resolvedInput = resolveStepInput(s, stepCtx.results);
                const stepPayload: Record<string, any> =
                  typeof resolvedInput === 'object' && resolvedInput !== null && !Array.isArray(resolvedInput)
                    ? { ...stepCtx.results, ...resolvedInput }
                    : { ...stepCtx.results };

                if (stepCtx.results.input) {
                  stepPayload.input = stepCtx.results.input;
                }
                return await this.call(s.target!, stepPayload, {
                  correlationId: stepCtx.correlationId,
                });
              },
            };
          }
          return {
            ...s,
            compensation,
          };
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
            abortSignal: options.abortSignal,
          });
          if (nestedResult.status !== 'COMPLETED') {
            throw new Error(nestedResult.error || `Nested orchestration "${childOrchId}" failed.`);
          }
          return nestedResult.output;
        };

        return await this.queue.executeOrchestration<TIn, TOut>(
          { id: orch.id, name: orch.name, version: orch.version, timeoutMs: orch.timeoutMs, scope: 'functionality' },
          boundSteps,
          payload,
          {
            correlationId: workerCtx.correlationId,
            idempotencyKey: command.idempotencyKey,
            timeoutMs: options.timeoutMs || orch.timeoutMs,
            metadata: options.metadata,
            nestedRunner,
            abortSignal: options.abortSignal,
          }
        );
      }
    );

    if (cmdResult.status === 'FAILED') {
      throw new Error(cmdResult.error || `[ServiceFacade:${this.id}] Orchestration failed.`);
    }

    return cmdResult.data as OrchestrationResult<TOut>;
  }

  /**
   * Executes a callable operation or orchestration through KrnlQ and worker boundary.
   * Path: External Caller -> Service Facade -> KrnlQ Command -> Worker -> Functionality / Orchestration -> Result.
   * Strictly queue-mediated; zero unmediated bypasses.
   */
  async execute<TIn = unknown, TOut = unknown>(
    target: string,
    input?: TIn,
    options?: {
      correlationId?: string;
      idempotencyKey?: string;
      timeoutMs?: number;
      metadata?: Record<string, unknown>;
      abortSignal?: AbortSignal;
    }
  ): Promise<any> {
    if (this.functionalityOrchestrations[target]) {
      const res = await this.orchestrate<TIn, TOut>(target, input, options);
      if (res.status === 'FAILED') {
        throw new Error(res.error || `[ServiceFacade:${this.id}] Orchestration "${target}" failed.`);
      }
      return res;
    }
    return this.call<TIn, TOut>(target, input, {
      correlationId: options?.correlationId,
      idempotencyKey: options?.idempotencyKey,
    });
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

  registerLibrary<TLib = unknown>(name: string, library: TLib): this {
    if (!name || typeof name !== 'string') {
      throw new Error('[ServiceFacade] Library name must be a non-empty string.');
    }
    if (library === undefined || library === null) {
      throw new Error(`[ServiceFacade] Library "${name}" must not be null or undefined.`);
    }
    (this.libraries as Record<string, unknown>)[name] = library;
    return this;
  }

  getLibrary<TLib = unknown>(name: string): TLib {
    const lib = (this.libraries as Record<string, unknown>)[name];
    if (lib === undefined || lib === null) {
      throw new Error(`[ServiceFacade:${this.id}] Library "${name}" not found on service facade.`);
    }
    return lib as TLib;
  }

  get namespace(): ServiceNamespace<TLibraries, Record<string, unknown>, Record<string, FunctionalityOrchestration>> {
    return this.getNamespace();
  }

  getNamespace(): ServiceNamespace<TLibraries, Record<string, unknown>, Record<string, FunctionalityOrchestration>> {
    return {
      serviceId: this.id,
      serviceName: this.name,
      version: this.version,
      description: this.description,
      libraries: { ...this.libraries },
      functionalities: { ...this.functionalities },
      functionalityOrchestrations: { ...this.functionalityOrchestrations },
      capabilities: this.capabilities,
      dependencies: this.dependencies,
    };
  }

  getServiceFacadeMetadata(): ServiceNamespace<TLibraries, Record<string, unknown>, Record<string, FunctionalityOrchestration>> {
    return this.getNamespace();
  }
}

export function createServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>,
  TLibraries extends Record<string, unknown> = Record<string, unknown>
>(config: ServiceFacadeConfig<TState, TEvents, TLibraries>): ServiceFacade<TState, TEvents, TLibraries> {
  return new ServiceFacade<TState, TEvents, TLibraries>(config);
}

