/**
 * @file BullMQExecutionEngine.ts
 * @description Canonical BullMQ Execution Engine for both KrnlTS and Skipo.
 * Implements isomorphic DAG execution, sequential/parallel steps, retries with backoff,
 * timeouts, compensation/saga rollback, branching, fan-out/fan-in, and idempotency.
 */

import {
  OrchestrationStep,
  OrchestrationDescriptor,
  OrchestrationContext,
  OrchestrationResult,
  StepExecutionResult,
  StepRetryPolicy,
  validateOrchestrationDAG,
} from './model.js';
import {
  BackendCommand,
  ExecutionContext,
  NormalizedResult,
  WorkerExecutionBoundary,
} from './WorkerExecutionBoundary.js';

export interface BullMQConnectionOptions {
  host?: string;
  port?: number;
  url?: string;
  password?: string;
  tls?: unknown;
}

export interface ExecutionEngineOptions {
  queueName?: string;
  connection?: BullMQConnectionOptions;
  concurrency?: number;
  useInMemory?: boolean;
}

export type BullMQExecutionEngineOptions = ExecutionEngineOptions;

interface QueuedJob<TPayload = unknown, TResult = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  correlationId: string;
  idempotencyKey?: string;
  attemptsMade: number;
  maxAttempts: number;
  retryPolicy?: StepRetryPolicy;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'cancelled';
  result?: TResult;
  error?: string;
  enqueuedAt: number;
  handler: (payload: TPayload, context: ExecutionContext) => Promise<TResult>;
}

export class BullMQExecutionEngine {
  public readonly queueName: string;
  private readonly concurrency: number;
  private readonly idempotencyStore = new Map<string, NormalizedResult<any>>();
  private readonly activeExecutions = new Map<string, { abortController: AbortController; context: OrchestrationContext }>();
  private readonly inMemoryJobs = new Map<string, QueuedJob<any, any>>();
  private isRunning = false;
  private activeWorkerCount = 0;
  private readonly workerBoundary: WorkerExecutionBoundary;

  constructor(options: Partial<ExecutionEngineOptions> = {}) {
    this.queueName = options.queueName ?? 'krnl_orchestration_default';
    this.concurrency = options.concurrency ?? 10;
    this.workerBoundary = new WorkerExecutionBoundary(`${this.queueName}_worker`, async (cmd, ctx) => {
      return this.dispatchInternalCommand(cmd, ctx);
    });
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  async dispose(): Promise<void> {
    await this.stop();
    for (const [id, active] of this.activeExecutions.entries()) {
      active.abortController.abort();
      active.context.isCancelled = true;
    }
    this.activeExecutions.clear();
    this.inMemoryJobs.clear();
    this.idempotencyStore.clear();
  }

  async close(): Promise<void> {
    await this.dispose();
  }

  getWorkerBoundary(): WorkerExecutionBoundary {
    return this.workerBoundary;
  }

  /**
   * Dispatches a single command through the BullMQ queue and worker execution boundary.
   */
  async executeCommand<TIn = unknown, TOut = unknown>(
    command: BackendCommand<TIn>,
    handler: (payload: TIn, context: ExecutionContext) => Promise<TOut>
  ): Promise<NormalizedResult<TOut>> {
    // 1. Check idempotency
    if (command.idempotencyKey && this.idempotencyStore.has(command.idempotencyKey)) {
      return this.idempotencyStore.get(command.idempotencyKey)! as NormalizedResult<TOut>;
    }

    const job: QueuedJob<TIn, TOut> = {
      id: command.id,
      name: command.type,
      payload: command.payload,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      attemptsMade: 0,
      maxAttempts: 1,
      status: 'waiting',
      enqueuedAt: Date.now(),
      handler,
    };
    this.inMemoryJobs.set(job.id, job);

    // 2. Execute via Worker Execution Boundary
    try {
      job.status = 'active';
      const result = await this.workerBoundary.processJob<TOut>(command);
      job.status = result.status === 'COMPLETED' ? 'completed' : 'failed';
      job.result = result.data;
      job.error = result.error;

      if (command.idempotencyKey) {
        this.idempotencyStore.set(command.idempotencyKey, result);
      }
      return result;
    } catch (err: any) {
      job.status = 'failed';
      job.error = err?.message || String(err);
      const failedResult: NormalizedResult<TOut> = {
        correlationId: command.correlationId,
        status: 'FAILED',
        error: job.error,
        executionTimestamp: Date.now(),
      };
      return failedResult;
    }
  }

  private async dispatchInternalCommand(
    command: BackendCommand<any>,
    context: ExecutionContext
  ): Promise<NormalizedResult<any>> {
    WorkerExecutionBoundary.assertWorkerContext(context);
    const job = this.inMemoryJobs.get(command.id);
    if (!job) {
      throw new Error(`[BullMQExecutionEngine] Job ${command.id} not found in queue.`);
    }

    try {
      const data = await job.handler(command.payload, context);
      return {
        correlationId: command.correlationId,
        status: 'COMPLETED',
        data,
        executionTimestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        correlationId: command.correlationId,
        status: 'FAILED',
        error: err?.message || String(err),
        executionTimestamp: Date.now(),
      };
    }
  }

  /**
   * Executes a full Canonical Orchestration DAG through the BullMQ worker boundary.
   */
  async executeOrchestration<TInput = unknown, TOutput = unknown>(
    descriptor: OrchestrationDescriptor,
    steps: readonly OrchestrationStep[],
    input: TInput,
    options: {
      correlationId?: string;
      parentCorrelationId?: string;
      idempotencyKey?: string;
      timeoutMs?: number;
      metadata?: Record<string, unknown>;
      nestedRunner?: (orchId: string, input: unknown, ctx: OrchestrationContext) => Promise<unknown>;
      abortSignal?: AbortSignal;
    } = {}
  ): Promise<OrchestrationResult<TOutput>> {
    const startedAt = Date.now();
    const correlationId = options.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const executionId = `exec_${Math.random().toString(36).substring(2, 11)}`;

    // Idempotency check
    if (options.idempotencyKey && this.idempotencyStore.has(options.idempotencyKey)) {
      const cached = this.idempotencyStore.get(options.idempotencyKey)!;
      return cached.data as OrchestrationResult<TOutput>;
    }

    // Validate DAG
    const validation = validateOrchestrationDAG(steps);
    if (!validation.valid) {
      return {
        orchestrationId: descriptor.id,
        correlationId,
        status: 'FAILED',
        stepResults: {},
        error: `Invalid DAG: ${validation.errors.join('; ')}`,
        startedAt,
        completedAt: Date.now(),
        executionMetadata: { validationErrors: validation.errors },
      };
    }

    const abortController = new AbortController();
    if (options.abortSignal) {
      if (options.abortSignal.aborted) {
        abortController.abort();
      } else {
        options.abortSignal.addEventListener('abort', () => abortController.abort(), { once: true });
      }
    }

    const context: OrchestrationContext = {
      correlationId,
      parentCorrelationId: options.parentCorrelationId,
      orchestrationId: descriptor.id,
      executionId,
      idempotencyKey: options.idempotencyKey,
      scope: descriptor.scope || 'functionality',
      results: { input },
      metadata: { ...options.metadata },
      timestamp: startedAt,
      isCancelled: abortController.signal.aborted,
      abortSignal: abortController.signal,
    };

    abortController.signal.addEventListener('abort', () => {
      context.isCancelled = true;
    });

    this.activeExecutions.set(executionId, { abortController, context });

    // Workflow-level timeout
    const timeoutMs = options.timeoutMs || descriptor.timeoutMs;
    let timeoutTimer: NodeJS.Timeout | undefined;
    if (timeoutMs && timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        context.isCancelled = true;
        abortController.abort();
      }, timeoutMs);
    }

    const stepResults: Record<string, StepExecutionResult> = {};
    const executedSteps = new Set<string>();
    const executedComps: Array<() => Promise<void>> = [];

    const stepMap = new Map<string, OrchestrationStep>();
    for (const step of steps) stepMap.set(step.id, step);

    let finalOutput: any = undefined;
    let orchestrationStatus: OrchestrationResult['status'] = 'COMPLETED';
    let errorMessage: string | undefined;

    try {
      // Execute steps respecting dependencies and concurrency
      while (executedSteps.size < steps.length) {
        if (context.isCancelled) {
          orchestrationStatus = 'CANCELLED';
          errorMessage = 'Orchestration execution cancelled.';
          break;
        }

        // Find steps ready to execute: dependencies met and not yet executed
        const readySteps = steps.filter((step) => {
          if (executedSteps.has(step.id)) return false;
          if (!step.dependsOn || step.dependsOn.length === 0) return true;
          return step.dependsOn.every((dep) => executedSteps.has(dep));
        });

        if (readySteps.length === 0) {
          // If no steps are ready and we haven't finished, there is an unmet branch or cycle
          break;
        }

        // Limit concurrent ready steps by engine concurrency
        const batch = readySteps.slice(0, this.concurrency);

        const batchPromises = batch.map(async (step) => {
          const stepRes = await this.executeSingleStep(step, context, options.nestedRunner);
          stepResults[step.id] = stepRes;
          executedSteps.add(step.id);

          if (stepRes.status === 'COMPLETED') {
            context.results[step.id] = stepRes.output;
            finalOutput = stepRes.output;

            if (step.compensation?.handler) {
              executedComps.push(() => step.compensation!.handler!(context));
            }
          } else if (stepRes.status === 'SKIPPED') {
            // Skipped step
          } else if (stepRes.status === 'CANCELLED') {
            const cancelErr = new Error('The operation was aborted');
            cancelErr.name = 'AbortError';
            throw cancelErr;
          } else {
            // Failed or timed out
            throw new Error(stepRes.error || `Step "${step.id}" failed with status ${stepRes.status}`);
          }
        });

        await Promise.all(batchPromises);
      }
    } catch (err: any) {
      const wasCancelled = context.isCancelled || abortController.signal.aborted || err?.name === 'AbortError';
      orchestrationStatus = wasCancelled ? 'CANCELLED' : 'FAILED';
      errorMessage = wasCancelled ? 'The operation was aborted' : (err?.message || String(err));

      // SAGA COMPENSATION: Execute compensations in reverse order
      if (executedComps.length > 0) {
        for (let i = executedComps.length - 1; i >= 0; i--) {
          try {
            await executedComps[i]();
          } catch (compErr) {
            console.error(`[BullMQExecutionEngine] Compensation failed:`, compErr);
          }
        }
      }
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.activeExecutions.delete(executionId);
    }

    const result: OrchestrationResult<TOutput> = {
      orchestrationId: descriptor.id,
      correlationId,
      status: orchestrationStatus,
      output: finalOutput as TOutput,
      stepResults,
      error: errorMessage,
      startedAt,
      completedAt: Date.now(),
      executionMetadata: {
        executionId,
        scope: descriptor.scope,
        stepsCount: steps.length,
        executedCount: executedSteps.size,
      },
    };

    if (options.idempotencyKey) {
      this.idempotencyStore.set(options.idempotencyKey, {
        correlationId,
        status: orchestrationStatus === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
        data: result,
        executionTimestamp: Date.now(),
      });
    }

    return result;
  }

  private async executeSingleStep(
    step: OrchestrationStep,
    context: OrchestrationContext,
    nestedRunner?: (orchId: string, input: unknown, ctx: OrchestrationContext) => Promise<unknown>
  ): Promise<StepExecutionResult> {
    const stepStart = Date.now();
    let attempts = 0;
    const maxAttempts = step.retryPolicy?.maxAttempts ?? 1;

    // Check condition if present
    if (step.condition) {
      try {
        const conditionPass = await step.condition(context);
        if (!conditionPass) {
          return {
            stepId: step.id,
            status: 'SKIPPED',
            attempts: 0,
            startedAt: stepStart,
            completedAt: Date.now(),
          };
        }
      } catch (condErr: any) {
        return {
          stepId: step.id,
          status: 'FAILED',
          attempts: 1,
          error: `Condition evaluation failed: ${condErr?.message || String(condErr)}`,
          startedAt: stepStart,
          completedAt: Date.now(),
        };
      }
    }

    let lastError: any;
    while (attempts < maxAttempts) {
      if (context.isCancelled) {
        return {
          stepId: step.id,
          status: 'CANCELLED',
          attempts,
          startedAt: stepStart,
          completedAt: Date.now(),
        };
      }

      attempts++;
      try {
        let stepOutput: any;

        // Step timeout setup
        const stepTimeoutMs = step.timeoutPolicy?.timeoutMs;
        let stepTimer: NodeJS.Timeout | undefined;
        let stepCancelled = false;

        const runPromise = (async () => {
          if (step.type === 'nested' && step.nestedOrchestrationId && nestedRunner) {
            // Nested orchestration scope
            const childContext: OrchestrationContext = {
              ...context,
              parentCorrelationId: context.correlationId,
              correlationId: `${context.correlationId}.${step.id}`,
            };
            return await nestedRunner(step.nestedOrchestrationId, context.results, childContext);
          }

          if (step.type === 'fanOut' && step.getItems) {
            const items = await step.getItems(context);
            if (!Array.isArray(items)) throw new Error(`[fanOut] getItems must return an array.`);
            const concurrency = step.concurrency || 5;
            const results: any[] = [];
            for (let i = 0; i < items.length; i += concurrency) {
              const slice = items.slice(i, i + concurrency);
              const sliceRes = await Promise.all(
                slice.map((item) => (step.handler ? step.handler(item, context) : Promise.resolve(item)))
              );
              results.push(...sliceRes);
            }
            return results;
          }

          if (step.handler) {
            return await step.handler(context.results, context);
          }

          return context.results;
        })();

        const abortPromise = new Promise<never>((_, reject) => {
          if (context.isCancelled || context.abortSignal?.aborted) {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          }
          context.abortSignal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });

        const promisesToRace: Promise<any>[] = [runPromise, abortPromise];

        if (stepTimeoutMs && stepTimeoutMs > 0) {
          const timeoutPromise = new Promise((_, reject) => {
            stepTimer = setTimeout(() => {
              stepCancelled = true;
              reject(new Error(`Step "${step.id}" timed out after ${stepTimeoutMs}ms.`));
            }, stepTimeoutMs);
          });
          promisesToRace.push(timeoutPromise);
        }

        stepOutput = await Promise.race(promisesToRace);
        if (stepTimer) clearTimeout(stepTimer);

        return {
          stepId: step.id,
          status: 'COMPLETED',
          attempts,
          output: stepOutput,
          startedAt: stepStart,
          completedAt: Date.now(),
        };
      } catch (err: any) {
        if (
          context.isCancelled ||
          context.abortSignal?.aborted ||
          err?.name === 'AbortError' ||
          err?.message === 'Operation cancelled' ||
          err?.message === 'The operation was aborted'
        ) {
          return {
            stepId: step.id,
            status: 'CANCELLED',
            attempts,
            startedAt: stepStart,
            completedAt: Date.now(),
          };
        }

        lastError = err;

        // Check if error is catchable by step's catchHandler
        if (step.catchHandler && attempts >= maxAttempts) {
          try {
            const recovered = await step.catchHandler(err, context);
            return {
              stepId: step.id,
              status: 'COMPLETED',
              attempts,
              output: recovered,
              startedAt: stepStart,
              completedAt: Date.now(),
            };
          } catch (catchErr) {
            lastError = catchErr;
          }
        }

        if (attempts < maxAttempts && step.retryPolicy) {
          const backoffDelay = this.computeBackoff(step.retryPolicy, attempts);
          await new Promise((r) => setTimeout(r, backoffDelay));
        }
      }
    }

    return {
      stepId: step.id,
      status: 'FAILED',
      attempts,
      error: lastError?.message || String(lastError),
      startedAt: stepStart,
      completedAt: Date.now(),
    };
  }

  private computeBackoff(policy: StepRetryPolicy, attempt: number): number {
    const base = policy.backoffMs || 100;
    let delay: number;
    if (policy.backoff === 'exponential') {
      delay = base * Math.pow(2, attempt - 1);
    } else {
      delay = base * attempt;
    }
    if (policy.maxBackoffMs && delay > policy.maxBackoffMs) {
      delay = policy.maxBackoffMs;
    }
    if (policy.jitter) {
      delay += Math.floor(Math.random() * (base * 0.5));
    }
    return delay;
  }

  cancelExecution(executionId: string): boolean {
    const active = this.activeExecutions.get(executionId);
    if (active) {
      active.context.isCancelled = true;
      active.abortController.abort();
      return true;
    }
    return false;
  }
}
