/**
 * @file ServiceOrchestration.ts
 * @description Canonical Application-Domain Level Service Orchestration for Skipo.
 *
 * Architectural Invariant:
 * - Skipo owns the application/domain boundary above services.
 * - ServiceOrchestration composes MULTIPLE independent services.
 * - ServiceOrchestration MUST NOT orchestrate internal functionalities of a single service directly.
 * - Powered by SkipoQ (in-process cross-service queue using p-queue) & KrnlQ.
 */

import {
  validateOrchestrationDAG,
  type OrchestrationStep,
  type StepRetryPolicy,
  type OrchestrationDescriptor,
  type OrchestrationContext,
  type OrchestrationResult,
  type StepExecutionResult,
  type StepExecutionStatus,
  type OrchestrationStatus,
  type SagaCompensationHandler,
  type IServiceFacade,
  type OrchestrationDefinition,
} from '@ultrst-armada/krnl';
import { SkipoQ, type SkipoQOptions } from '../execution/SkipoQ.js';
import { backendFacade as defaultBackendFacade } from '../BackendFacade.js';

export interface ServiceLike {
  id?: string;
  name?: string;
  execute?: <TIn = unknown, TOut = unknown>(operation: string, input?: TIn) => Promise<TOut>;
  call?: <TIn = unknown, TOut = unknown>(operation: string, input?: TIn, ctx?: unknown) => Promise<TOut>;
  orchestrate?: <TIn = unknown, TOut = unknown>(name: string, input?: TIn, ctx?: unknown) => Promise<TOut>;
}

export type ServiceTarget = IServiceFacade | ServiceLike | string;

export interface ServiceStepConfig<_TInput = unknown, TOutput = unknown> {
  id?: string;
  name?: string;
  retries?: number;
  retryDelayMs?: number;
  retryBackoffMultiplier?: number;
  timeoutMs?: number;
  dependencies?: string[];
  compensate?: SagaCompensationHandler<TOutput>;
  mapInput?: (results: Record<string, unknown>, ctx: OrchestrationContext) => any;
}

export interface ParallelServiceStep {
  service: ServiceTarget;
  operation: string;
  config?: ServiceStepConfig;
}

export interface ExecutionTraceItem {
  stepId: string;
  status: StepExecutionStatus;
  output?: unknown;
  error?: string;
  retryCount: number;
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

export interface ServiceOrchestrationExecutionResult<TOutput = unknown> {
  success: boolean;
  status: OrchestrationStatus;
  data?: TOutput;
  output?: TOutput;
  error?: Error;
  correlationId: string;
  trace: ExecutionTraceItem[];
  stepResults: Record<string, StepExecutionResult>;
  rawResult: OrchestrationResult<TOutput>;
}

/**
 * Validates that a target is a valid service and NOT an internal functionality.
 */
function assertServiceTarget(target: unknown): void {
  if (!target) {
    throw new Error('[ServiceOrchestration] Invariant Violation: Service target cannot be null or undefined.');
  }

  if (typeof target === 'function') {
    throw new Error(
      '[ServiceOrchestration] Invariant Violation: ServiceOrchestration composes independent services via ServiceFacade, NOT raw functionality functions or quad-units.'
    );
  }

  if (typeof target === 'object') {
    const obj = target as Record<string, unknown>;
    if (
      obj._isFunctionality === true ||
      obj.type === 'functionality' ||
      obj.kind === 'functionality' ||
      obj.isFunctionality === true ||
      obj.isQuadUnit === true ||
      ('atom' in obj && !('call' in obj))
    ) {
      throw new Error(
        '[ServiceOrchestration] Invariant Violation: ServiceOrchestration composes independent services, NOT internal functionalities or raw quad-units.'
      );
    }
  }
}

/**
 * Resolves service invocation against a target (ServiceFacade or named registered service).
 * Enforces the strict path: ServiceOrchestration -> SkipoQ -> ServiceFacade -> KrnlQ.
 */
async function invokeService(
  target: ServiceTarget,
  operation: string,
  input: unknown,
  context: OrchestrationContext
): Promise<unknown> {
  assertServiceTarget(target);

  const bf = (context.metadata?.backendFacade as any) ?? defaultBackendFacade;

  if (typeof target === 'string') {
    if (bf && typeof bf.executeCapability === 'function') {
      try {
        return await bf.executeCapability(target, operation, input, {
          correlationId: context.correlationId,
          idempotencyKey: context.idempotencyKey,
          metadata: context.metadata,
          abortSignal: context.abortSignal,
        });
      } catch (err: any) {
        if (!err.message?.includes('Cannot resolve capability') && !err.message?.includes('not found')) {
          throw err;
        }
      }
    }

    const registeredServices = (context.metadata?.registeredServices as Record<string, ServiceLike>) || {};
    let service = registeredServices[target];
    if (!service && bf && typeof bf.getService === 'function') {
      try {
        service = bf.getService(target);
      } catch {
        // Fall through
      }
    }
    if (!service) {
      throw new Error(`[ServiceOrchestration] Target service '${target}' not found in registered services or BackendFacade.`);
    }
    return invokeService(service, operation, input, context);
  }

  if (bf && typeof bf.registerService === 'function' && (target as any).id) {
    try {
      bf.registerService(target as any);
    } catch {
      // Ignored if already registered
    }
  }

  if (typeof (target as any).call === 'function') {
    return (target as any).call(operation, input, {
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      metadata: context.metadata,
      abortSignal: context.abortSignal,
    });
  }

  if (typeof (target as any).execute === 'function') {
    return (target as any).execute(operation, input, {
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      metadata: context.metadata,
      abortSignal: context.abortSignal,
    });
  }

  throw new Error(`[ServiceOrchestration] Target service has no valid 'call' or 'execute' method.`);
}

function resolveStepInput(
  step: OrchestrationStep,
  results: Record<string, unknown>,
  context: OrchestrationContext,
  mapInput?: (results: Record<string, unknown>, ctx: OrchestrationContext) => any
): any {
  if (mapInput) {
    return mapInput(results, context);
  }

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
    return depRes;
  }

  // Multi-dependency join: combine outputs of dependencies
  const joined: Record<string, unknown> = {};
  for (const dep of deps) {
    joined[dep] = results[dep];
  }
  return joined;
}

export class ServiceOrchestration<TInitialInput = unknown, TFinalOutput = unknown> {
  private steps: Array<OrchestrationStep<any, any>> = [];
  private lastStepId?: string;
  private queue?: SkipoQ;

  constructor(
    public readonly name: string,
    public readonly version: string = '1.0.0',
    queueOptions?: SkipoQOptions
  ) {
    if (queueOptions) {
      this.queue = new SkipoQ(queueOptions);
    }
  }

  /**
   * Instantiates a executable ServiceOrchestration from a pure serializable OrchestrationDefinition
   * (e.g. from Kloks distribution).
   */
  public static fromDefinition<TIn = unknown, TOut = unknown>(
    def: OrchestrationDefinition<TIn, TOut>,
    serviceResolver?: (serviceId: string) => ServiceTarget
  ): ServiceOrchestration<TIn, TOut> {
    const orch = new ServiceOrchestration<TIn, TOut>(def.name || def.id, def.version);
    for (const stepDef of def.steps) {
      if (stepDef.type === 'task' && stepDef.target && stepDef.operation) {
        const target = serviceResolver ? serviceResolver(stepDef.target) : stepDef.target;
        orch.step(stepDef.id, target, stepDef.operation, stepDef.dependsOn ? [...stepDef.dependsOn] : [], {
          name: stepDef.name,
          retries: stepDef.retryPolicy?.maxAttempts,
          retryDelayMs: stepDef.retryPolicy?.initialDelayMs,
          retryBackoffMultiplier: stepDef.retryPolicy?.backoffMultiplier,
          timeoutMs: stepDef.timeoutPolicy?.timeoutMs,
        });
      }
    }
    return orch;
  }

  /**
   * Appends a sequential service step composing an independent service.
   */
  public thenService<TStepIn = unknown, TStepOut = unknown>(
    service: ServiceTarget,
    operation: string,
    config: ServiceStepConfig<TStepIn, TStepOut> = {}
  ): this {
    assertServiceTarget(service);

    const stepId = config.id ?? `step_${this.steps.length + 1}_${operation}`;
    const dependencies = config.dependencies ?? (this.lastStepId ? [this.lastStepId] : []);

    const retryPolicy: StepRetryPolicy | undefined = config.retries
      ? {
          maxAttempts: config.retries,
          backoffMultiplier: config.retryBackoffMultiplier ?? 2,
          initialDelayMs: config.retryDelayMs ?? 50,
        }
      : undefined;

    const step: OrchestrationStep<any, TStepOut> = {
      id: stepId,
      name: config.name ?? `${typeof service === 'string' ? service : (service as any).name ?? 'Service'}.${operation}`,
      type: 'sequential',
      dependsOn: dependencies,
      timeoutPolicy: config.timeoutMs ? { timeoutMs: config.timeoutMs } : undefined,
      retryPolicy,
      compensation: config.compensate
        ? {
            name: `${stepId}_comp`,
            handler: async (ctx: OrchestrationContext) => {
              const prevOutput = ctx.results[stepId];
              await config.compensate!(prevOutput as TStepOut, ctx as any);
            },
          }
        : undefined,
      handler: async (results: any, ctx: OrchestrationContext) => {
        const stepInput = resolveStepInput(step, results, ctx, config.mapInput);
        return (await invokeService(service, operation, stepInput, ctx)) as TStepOut;
      },
    };

    this.steps.push(step);
    this.lastStepId = stepId;
    return this;
  }

  /**
   * Appends a capability step resolving dynamically through BackendFacade.
   * Consumers do not need to know which service owns this capability.
   */
  public thenCapability<TStepIn = unknown, TStepOut = unknown>(
    capability: string,
    operation?: string,
    config: ServiceStepConfig<TStepIn, TStepOut> = {}
  ): this {
    return this.thenService<TStepIn, TStepOut>(capability, operation || capability, config);
  }

  /**
   * Dispatches multiple service steps concurrently (Parallel Execution).
   */
  public parallel(
    parallelSteps: Array<ParallelServiceStep | ServiceOrchestration<any, any>>,
    config: { id?: string; name?: string; dependencies?: string[] } = {}
  ): this {
    const stepId = config.id ?? `parallel_${this.steps.length + 1}`;
    const dependencies = config.dependencies ?? (this.lastStepId ? [this.lastStepId] : []);

    const step: OrchestrationStep<any, any[]> = {
      id: stepId,
      name: config.name ?? `ParallelServices[${parallelSteps.length}]`,
      type: 'parallel',
      dependsOn: dependencies,
      handler: async (results: any, ctx: OrchestrationContext) => {
        const input = resolveStepInput(step, results, ctx);
        const promises = parallelSteps.map(async (pStep, index) => {
          if (pStep instanceof ServiceOrchestration) {
            const res = await pStep.execute(input, {
              correlationId: `${ctx.correlationId}.parallel_${index}`,
              abortSignal: ctx.abortSignal,
              metadata: ctx.metadata,
            });
            if (!res.success) throw res.error ?? new Error(`Parallel sub-orchestration failed`);
            return res.data;
          }

          assertServiceTarget(pStep.service);
          return invokeService(pStep.service, pStep.operation, input, ctx);
        });

        return Promise.all(promises);
      },
    };

    this.steps.push(step);
    this.lastStepId = stepId;
    return this;
  }

  /**
   * Branches to one of two service orchestrations based on a runtime predicate.
   */
  public branch(
    condition: (ctx: OrchestrationContext) => boolean | Promise<boolean>,
    ifTrue: ServiceOrchestration<any, any>,
    ifFalse?: ServiceOrchestration<any, any>,
    config: { id?: string; name?: string } = {}
  ): this {
    const stepId = config.id ?? `branch_${this.steps.length + 1}`;
    const dependencies = this.lastStepId ? [this.lastStepId] : [];

    const step: OrchestrationStep<any, any> = {
      id: stepId,
      name: config.name ?? `BranchCondition`,
      type: 'conditional',
      dependsOn: dependencies,
      handler: async (results: any, ctx: OrchestrationContext) => {
        const stepOutputs: Record<string, any> = {
          initial: results['input'],
          input: results['input'],
          ...results,
        };
        const enrichedCtx: OrchestrationContext = {
          ...ctx,
          stepOutputs,
          results,
        } as any;

        const isTrue = await condition(enrichedCtx);
        const input = resolveStepInput(step, results, ctx);

        if (isTrue) {
          const res = await ifTrue.execute(input, {
            correlationId: `${ctx.correlationId}.branch_true`,
            abortSignal: ctx.abortSignal,
            metadata: ctx.metadata,
          });
          if (!res.success) throw res.error ?? new Error('Branch ifTrue failed');
          return res.data;
        } else if (ifFalse) {
          const res = await ifFalse.execute(input, {
            correlationId: `${ctx.correlationId}.branch_false`,
            abortSignal: ctx.abortSignal,
            metadata: ctx.metadata,
          });
          if (!res.success) throw res.error ?? new Error('Branch ifFalse failed');
          return res.data;
        }
        return input;
      },
    };

    this.steps.push(step);
    this.lastStepId = stepId;
    return this;
  }

  /**
   * Fan-out across an array of items with parallel service executions and fan-in join.
   */
  public fanOut<TItem, TItemOut>(
    itemsExtractor: (input: any, ctx: OrchestrationContext) => TItem[],
    stepFactory: (item: TItem, index: number) => ParallelServiceStep | ServiceOrchestration<TItem, TItemOut>,
    config: { id?: string; name?: string } = {}
  ): this {
    const stepId = config.id ?? `fanOut_${this.steps.length + 1}`;
    const dependencies = this.lastStepId ? [this.lastStepId] : [];

    const step: OrchestrationStep<any, TItemOut[]> = {
      id: stepId,
      name: config.name ?? 'FanOutFanIn',
      type: 'parallel',
      dependsOn: dependencies,
      handler: async (results: any, ctx: OrchestrationContext) => {
        const input = resolveStepInput(step, results, ctx);
        const items = itemsExtractor(input, ctx);
        const promises = items.map(async (item, index) => {
          const target = stepFactory(item, index);
          if (target instanceof ServiceOrchestration) {
            const res = await target.execute(item, {
              correlationId: `${ctx.correlationId}.fanout_${index}`,
              abortSignal: ctx.abortSignal,
              metadata: ctx.metadata,
            });
            if (!res.success) throw res.error ?? new Error(`FanOut item ${index} failed`);
            return res.data as TItemOut;
          }
          assertServiceTarget(target.service);
          return (await invokeService(target.service, target.operation, item, ctx)) as TItemOut;
        });

        return Promise.all(promises);
      },
    };

    this.steps.push(step);
    this.lastStepId = stepId;
    return this;
  }

  /**
   * Composes a nested service orchestration as a sequential step.
   */
  public thenServiceOrchestration<TNestedIn = any, TNestedOut = any>(
    nested: ServiceOrchestration<TNestedIn, TNestedOut>,
    config: { id?: string; name?: string } = {}
  ): this {
    const stepId = config.id ?? `nested_${nested.name}_${this.steps.length + 1}`;
    const dependencies = this.lastStepId ? [this.lastStepId] : [];

    const step: OrchestrationStep<any, TNestedOut> = {
      id: stepId,
      name: config.name ?? `NestedOrchestration(${nested.name})`,
      type: 'sequential',
      dependsOn: dependencies,
      handler: async (results: any, ctx: OrchestrationContext) => {
        const input = resolveStepInput(step, results, ctx);
        const res = await nested.execute(input, {
          correlationId: `${ctx.correlationId}.nested_${nested.name}`,
          abortSignal: ctx.abortSignal,
          metadata: ctx.metadata,
        });
        if (!res.success) throw res.error ?? new Error(`Nested orchestration ${nested.name} failed`);
        return res.data as TNestedOut;
      },
    };

    this.steps.push(step);
    this.lastStepId = stepId;
    return this;
  }

  /**
   * Explicit DAG step addition with dependency specification (Diamond DAG).
   */
  public step<TStepIn = unknown, TStepOut = unknown>(
    stepId: string,
    service: ServiceTarget,
    operation: string,
    dependencies: string[] = [],
    config: Omit<ServiceStepConfig<TStepIn, TStepOut>, 'id' | 'dependencies'> = {}
  ): this {
    assertServiceTarget(service);

    const retryPolicy: StepRetryPolicy | undefined = config.retries
      ? {
          maxAttempts: config.retries,
          backoffMultiplier: config.retryBackoffMultiplier ?? 2,
          initialDelayMs: config.retryDelayMs ?? 50,
        }
      : undefined;

    const step: OrchestrationStep<any, TStepOut> = {
      id: stepId,
      name: config.name ?? `${typeof service === 'string' ? service : (service as any).name ?? 'Service'}.${operation}`,
      type: dependencies.length > 1 ? 'diamond' : 'sequential',
      dependsOn: dependencies,
      timeoutPolicy: config.timeoutMs ? { timeoutMs: config.timeoutMs } : undefined,
      retryPolicy,
      compensation: config.compensate
        ? {
            name: `${stepId}_comp`,
            handler: async (ctx: OrchestrationContext) => {
              const prevOutput = ctx.results[stepId];
              await config.compensate!(prevOutput as TStepOut, ctx as any);
            },
          }
        : undefined,
      handler: async (results: any, ctx: OrchestrationContext) => {
        const stepInput = resolveStepInput(step, results, ctx, config.mapInput);
        return (await invokeService(service, operation, stepInput, ctx)) as TStepOut;
      },
    };

    this.steps.push(step);
    this.lastStepId = stepId;
    return this;
  }

  /**
   * Validates DAG structure: checks for existence, circular dependencies, and returns topological order.
   */
  public validate(): void {
    const validation = validateOrchestrationDAG(this.steps);
    if (!validation.valid) {
      throw new Error(`[ServiceOrchestration] Invalid DAG: ${validation.errors.join('; ')}`);
    }
  }

  /**
   * Executes the service orchestration on the in-process SkipoQ execution engine.
   */
  public async execute(
    initialInput: TInitialInput,
    options: {
      correlationId?: string;
      idempotencyKey?: string;
      abortSignal?: AbortSignal;
      metadata?: Record<string, unknown>;
      timeoutMs?: number;
    } = {}
  ): Promise<ServiceOrchestrationExecutionResult<TFinalOutput>> {
    this.validate();

    if (!this.queue) {
      this.queue = new SkipoQ({ queueName: this.name });
    }
    const queue = this.queue;
    const descriptor: OrchestrationDescriptor = {
      id: this.name,
      name: this.name,
      version: this.version,
      scope: 'service',
      timeoutMs: options.timeoutMs,
    };

    let cancellationHandler: (() => void) | undefined;
    let wasAborted = false;
    if (options.abortSignal) {
      if (options.abortSignal.aborted) {
        wasAborted = true;
      } else {
        cancellationHandler = () => {
          wasAborted = true;
        };
        options.abortSignal.addEventListener('abort', cancellationHandler);
      }
    }

    try {
      if (wasAborted) {
        const abortErr = new Error('The operation was aborted');
        abortErr.name = 'AbortError';
        return {
          success: false,
          status: 'CANCELLED',
          error: abortErr,
          correlationId: options.correlationId ?? '',
          trace: [],
          stepResults: {},
          rawResult: {
            orchestrationId: this.name,
            correlationId: options.correlationId ?? '',
            status: 'CANCELLED',
            stepResults: {},
            error: abortErr.message,
            startedAt: Date.now(),
            completedAt: Date.now(),
            executionMetadata: {},
          },
        };
      }

      // Execute through in-process SkipoQ
      const rawResult = await queue.executeOrchestration<TInitialInput, TFinalOutput>(
        descriptor,
        this.steps,
        initialInput,
        {
          correlationId: options.correlationId,
          idempotencyKey: options.idempotencyKey,
          timeoutMs: options.timeoutMs,
          metadata: options.metadata,
          abortSignal: options.abortSignal,
        }
      );

      const trace: ExecutionTraceItem[] = Object.values(rawResult.stepResults).map((sr) => ({
        stepId: sr.stepId,
        status: sr.status,
        output: sr.output,
        error: sr.error,
        retryCount: Math.max(0, sr.attempts - 1),
        startedAt: sr.startedAt,
        completedAt: sr.completedAt,
        durationMs: Math.max(0, sr.completedAt - sr.startedAt),
      }));

      const isSuccess = rawResult.status === 'COMPLETED';
      let err: Error | undefined;
      if (!isSuccess) {
        if (wasAborted || rawResult.status === 'CANCELLED') {
          err = new Error(rawResult.error || 'The operation was aborted');
          err.name = 'AbortError';
        } else {
          err = new Error(rawResult.error || `Orchestration failed with status ${rawResult.status}`);
        }
      }

      const resultObj: ServiceOrchestrationExecutionResult<TFinalOutput> = {
        success: isSuccess,
        status: rawResult.status,
        data: rawResult.output,
        output: rawResult.output,
        error: err,
        correlationId: rawResult.correlationId,
        trace,
        stepResults: rawResult.stepResults,
        rawResult,
      };

      // Merge step outputs so consumers can inspect specific step artifacts directly on the result (e.g. res.midiEvent)
      if (rawResult.stepResults) {
        for (const stepRes of Object.values(rawResult.stepResults)) {
          if (stepRes.output && typeof stepRes.output === 'object' && !Array.isArray(stepRes.output)) {
            for (const [key, val] of Object.entries(stepRes.output)) {
              if (!(key in resultObj)) {
                (resultObj as any)[key] = val;
              }
            }
          }
        }
      }

      return resultObj;
    } finally {
      if (cancellationHandler && options.abortSignal) {
        options.abortSignal.removeEventListener('abort', cancellationHandler);
      }
    }
  }
}
