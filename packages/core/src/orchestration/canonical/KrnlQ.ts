/**
 * @file KrnlQ.ts
 * @description In-process execution queue for a single KrnlTS service.
 * Uses p-queue internally as the low-level scheduling and concurrency primitive.
 * Zero Redis, zero Docker, zero BullMQ, 100% portable TypeScript.
 */

import PQueue from 'p-queue';
import { randomUUID } from 'node:crypto';
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
import { KrnlWorkerPool } from './KrnlWorkerPool.js';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface KrnlJobOptions {
  priority?: number;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  backoffPolicy?: 'fixed' | 'exponential';
  idempotencyKey?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  abortSignal?: AbortSignal;
}

export interface KrnlJobDefinition<TInput = unknown, TOutput = unknown> {
  id?: string;
  name: string;
  payload: TInput;
  handler: (payload: TInput, context: ExecutionContext) => Promise<TOutput>;
  options?: KrnlJobOptions;
}

export interface KrnlJobHandle<TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  getStatus(): JobStatus;
  result(): Promise<TOutput>;
  cancel(): boolean;
}

export interface KrnlQueueOptions {
  queueName?: string;
  concurrency?: number;
  autoStart?: boolean;
  maxRetainedJobs?: number;
}

interface InternalJobRecord<TOutput = unknown> {
  id: string;
  name: string;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: TOutput;
  error?: string;
  abortController: AbortController;
  resolvePromise: (val: TOutput) => void;
  rejectPromise: (err: any) => void;
  promise: Promise<TOutput>;
}

function generateSecureId(prefix: string): string {
  try {
    return `${prefix}_${randomUUID()}`;
  } catch {
    return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  }
}

export class KrnlQueue {
  public readonly queueName: string;
  private readonly queue: PQueue;
  private readonly workerPool: KrnlWorkerPool;
  private readonly jobs = new Map<string, InternalJobRecord<any>>();
  private readonly idempotencyStore = new Map<string, NormalizedResult<any>>();
  private readonly activeOrchestrations = new Map<string, { abortController: AbortController; context: OrchestrationContext }>();
  private readonly maxRetainedJobs: number;

  constructor(options: KrnlQueueOptions = {}) {
    this.queueName = options.queueName ?? 'krnl_default_queue';
    this.maxRetainedJobs = options.maxRetainedJobs ?? 1000;
    const concurrency = options.concurrency ?? 10;
    this.queue = new PQueue({
      concurrency,
      autoStart: options.autoStart ?? true,
    });
    this.workerPool = new KrnlWorkerPool(this.queueName);
    this.workerPool.start();
  }

  get concurrency(): number {
    return this.queue.concurrency;
  }

  set concurrency(value: number) {
    this.queue.concurrency = value;
  }

  get size(): number {
    return this.queue.size;
  }

  get pending(): number {
    return this.queue.pending;
  }

  get isPaused(): boolean {
    return this.queue.isPaused;
  }

  getWorkerBoundary(): WorkerExecutionBoundary {
    return this.workerPool.getWorkerBoundary();
  }

  getWorkerPool(): KrnlWorkerPool {
    return this.workerPool;
  }

  pause(): void {
    this.queue.pause();
  }

  resume(): void {
    this.queue.start();
  }

  clear(): void {
    this.queue.clear();
    // Reconcile waiting jobs so their promises terminate cleanly
    for (const job of this.jobs.values()) {
      if (job.status === 'waiting') {
        job.status = 'cancelled';
        job.completedAt = Date.now();
        job.abortController.abort();
        const cancelErr = new Error('The operation was aborted');
        cancelErr.name = 'AbortError';
        job.rejectPromise(cancelErr);
      }
    }
  }

  private pruneJobs(): void {
    if (this.jobs.size <= this.maxRetainedJobs) return;
    const excess = this.jobs.size - this.maxRetainedJobs;
    let pruned = 0;
    for (const [id, record] of this.jobs.entries()) {
      if (record.status === 'completed' || record.status === 'failed' || record.status === 'cancelled') {
        this.jobs.delete(id);
        pruned++;
        if (pruned >= excess) break;
      }
    }
  }

  async drain(): Promise<void> {
    await this.queue.onIdle();
  }

  async shutdown(options: { drain?: boolean } = { drain: true }): Promise<void> {
    if (options.drain) {
      await this.drain();
    } else {
      this.clear();
    }
    // Cancel active orchestrations
    for (const active of this.activeOrchestrations.values()) {
      active.abortController.abort();
      active.context.isCancelled = true;
    }
    this.activeOrchestrations.clear();
    await this.workerPool.stop();
  }

  async close(): Promise<void> {
    await this.shutdown({ drain: false });
  }

  async dispose(): Promise<void> {
    await this.shutdown({ drain: false });
  }

  async start(): Promise<void> {
    this.resume();
  }

  async stop(): Promise<void> {
    this.pause();
  }

  /**
   * Enqueues a job returning a strong handle.
   */
  enqueue<TInput = unknown, TOutput = unknown>(
    jobDef: KrnlJobDefinition<TInput, TOutput>
  ): KrnlJobHandle<TOutput> {
    this.pruneJobs();
    const jobId = jobDef.id || generateSecureId('job');
    const abortController = new AbortController();

    if (jobDef.options?.abortSignal) {
      if (jobDef.options.abortSignal.aborted) {
        abortController.abort();
      } else {
        jobDef.options.abortSignal.addEventListener('abort', () => abortController.abort(), { once: true });
      }
    }

    let resolvePromise!: (val: TOutput) => void;
    let rejectPromise!: (err: any) => void;
    const promise = new Promise<TOutput>((res, rej) => {
      resolvePromise = res;
      rejectPromise = rej;
    });

    const record: InternalJobRecord<TOutput> = {
      id: jobId,
      name: jobDef.name,
      status: 'waiting',
      createdAt: Date.now(),
      abortController,
      resolvePromise,
      rejectPromise,
      promise,
    };
    this.jobs.set(jobId, record);

    const priority = jobDef.options?.priority ?? 0;

    // Schedule inside p-queue
    this.queue.add(
      async () => {
        if (record.status === 'cancelled' || abortController.signal.aborted) {
          record.status = 'cancelled';
          const cancelErr = new Error('The operation was aborted');
          cancelErr.name = 'AbortError';
          rejectPromise(cancelErr);
          return;
        }

        record.status = 'active';
        record.startedAt = Date.now();

        // Check idempotency cache
        const idemKey = jobDef.options?.idempotencyKey;
        if (idemKey && this.idempotencyStore.has(idemKey)) {
          const cached = this.idempotencyStore.get(idemKey)!;
          record.status = cached.status === 'COMPLETED' ? 'completed' : 'failed';
          record.completedAt = Date.now();
          if (cached.status === 'COMPLETED') {
            record.result = cached.data as TOutput;
            resolvePromise(cached.data as TOutput);
          } else {
            record.error = cached.error;
            rejectPromise(new Error(cached.error));
          }
          return;
        }

        const retries = jobDef.options?.retries ?? 0;
        const maxAttempts = retries + 1;
        const timeoutMs = jobDef.options?.timeoutMs;
        const backoffMs = jobDef.options?.backoffMs ?? 100;
        const backoffPolicy = jobDef.options?.backoffPolicy ?? 'exponential';

        let attempt = 0;
        let lastError: any;

        while (attempt < maxAttempts) {
          if (abortController.signal.aborted) {
            record.status = 'cancelled';
            const cancelErr = new Error('The operation was aborted');
            cancelErr.name = 'AbortError';
            rejectPromise(cancelErr);
            return;
          }

          attempt++;
          try {
            const result = await this.workerPool.runWithContext(
              jobDef.options?.correlationId,
              jobDef.options?.metadata,
              async (workerCtx) => {
                let timer: NodeJS.Timeout | undefined;
                try {
                  const workPromise = jobDef.handler(jobDef.payload, workerCtx);
                  if (timeoutMs && timeoutMs > 0) {
                    const timeoutPromise = new Promise<never>((_, rej) => {
                      timer = setTimeout(() => {
                        const err = new Error(`Job "${jobDef.name}" timed out after ${timeoutMs}ms.`);
                        err.name = 'TimeoutError';
                        rej(err);
                      }, timeoutMs);
                    });
                    return await Promise.race([workPromise, timeoutPromise]);
                  }
                  return await workPromise;
                } finally {
                  if (timer) clearTimeout(timer);
                }
              }
            );

            record.status = 'completed';
            record.completedAt = Date.now();
            record.result = result;

            if (idemKey) {
              this.idempotencyStore.set(idemKey, {
                correlationId: jobDef.options?.correlationId || jobId,
                status: 'COMPLETED',
                data: result,
                executionTimestamp: Date.now(),
              });
            }

            resolvePromise(result);
            return;
          } catch (err: any) {
            lastError = err;
            if (abortController.signal.aborted || err?.name === 'AbortError') {
              record.status = 'cancelled';
              record.completedAt = Date.now();
              rejectPromise(err);
              return;
            }

            if (attempt < maxAttempts) {
              const delay =
                backoffPolicy === 'exponential'
                  ? backoffMs * Math.pow(2, attempt - 1)
                  : backoffMs * attempt;
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }

        record.status = 'failed';
        record.completedAt = Date.now();
        record.error = lastError?.message || String(lastError);

        if (idemKey) {
          this.idempotencyStore.set(idemKey, {
            correlationId: jobDef.options?.correlationId || jobId,
            status: 'FAILED',
            error: record.error,
            executionTimestamp: Date.now(),
          });
        }

        rejectPromise(lastError);
      },
      { priority }
    );

    return {
      id: jobId,
      name: jobDef.name,
      getStatus: () => record.status,
      result: () => record.promise,
      cancel: () => this.cancel(jobId),
    };
  }

  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }
    job.status = 'cancelled';
    job.abortController.abort();
    return true;
  }

  getJob(jobId: string): InternalJobRecord | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Dispatches a single command through the KrnlQ worker boundary.
   */
  async executeCommand<TIn = unknown, TOut = unknown>(
    command: BackendCommand<TIn>,
    handler: (payload: TIn, context: ExecutionContext) => Promise<TOut>
  ): Promise<NormalizedResult<TOut>> {
    // 1. Check idempotency
    if (command.idempotencyKey && this.idempotencyStore.has(command.idempotencyKey)) {
      return this.idempotencyStore.get(command.idempotencyKey)! as NormalizedResult<TOut>;
    }

    try {
      const handle = this.enqueue<TIn, TOut>({
        id: command.id,
        name: command.type,
        payload: command.payload,
        handler,
        options: {
          idempotencyKey: command.idempotencyKey,
          correlationId: command.correlationId,
        },
      });

      const data = await handle.result();
      const res: NormalizedResult<TOut> = {
        correlationId: command.correlationId,
        status: 'COMPLETED',
        data,
        executionTimestamp: Date.now(),
      };
      return res;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || err?.message === 'The operation was aborted';
      const res: NormalizedResult<TOut> = {
        correlationId: command.correlationId,
        status: isAbort ? 'CANCELLED' : 'FAILED',
        error: err?.message || String(err),
        executionTimestamp: Date.now(),
      };
      return res;
    }
  }

  /**
   * Executes a full Canonical Orchestration DAG through KrnlQ and worker boundary.
   * This is a first-class queued job scheduled via this.enqueue() to respect concurrency and worker limits.
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
    const correlationId = options.correlationId || generateSecureId('corr');
    const executionId = generateSecureId('exec');

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

    this.activeOrchestrations.set(executionId, { abortController, context });

    const handle = this.enqueue<TInput, OrchestrationResult<TOutput>>({
      id: executionId,
      name: descriptor.name || descriptor.id,
      payload: input,
      options: {
        idempotencyKey: options.idempotencyKey,
        correlationId,
        metadata: options.metadata,
        abortSignal: abortController.signal,
      },
      handler: async () => {
        const timeoutMs = options.timeoutMs || descriptor.timeoutMs;
        let timeoutTimer: NodeJS.Timeout | undefined;
        let isWorkflowTimeout = false;
        if (timeoutMs && timeoutMs > 0) {
          timeoutTimer = setTimeout(() => {
            isWorkflowTimeout = true;
            context.isCancelled = true;
            abortController.abort();
          }, timeoutMs);
        }

        const stepResults: Record<string, StepExecutionResult> = {};
        const executedSteps = new Set<string>();
        const executedComps: Array<() => Promise<void>> = [];

        let finalOutput: any = undefined;
        let orchestrationStatus: OrchestrationResult['status'] = 'COMPLETED';
        let errorMessage: string | undefined;

        try {
          while (executedSteps.size < steps.length) {
            if (context.isCancelled) {
              orchestrationStatus = 'CANCELLED';
              errorMessage = 'Orchestration execution cancelled.';
              break;
            }

            const readySteps = steps.filter((step) => {
              if (executedSteps.has(step.id)) return false;
              if (!step.dependsOn || step.dependsOn.length === 0) return true;
              return step.dependsOn.every((dep) => executedSteps.has(dep));
            });

            if (readySteps.length === 0) {
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
                throw new Error(stepRes.error || `Step "${step.id}" failed with status ${stepRes.status}`);
              }
            });

            await Promise.all(batchPromises);
          }
        } catch (err: any) {
          const isExplicitStepFailure = err && err.name !== 'AbortError' && err.message !== 'The operation was aborted';
          const wasCancelled = (context.isCancelled || abortController.signal.aborted || err?.name === 'AbortError') && !isExplicitStepFailure;
          if (isWorkflowTimeout) {
            orchestrationStatus = 'TIMED_OUT';
            errorMessage = `Orchestration timed out after ${timeoutMs}ms.`;
          } else if (isExplicitStepFailure) {
            orchestrationStatus = 'FAILED';
            errorMessage = err?.message || String(err);
          } else if (wasCancelled) {
            orchestrationStatus = 'CANCELLED';
            errorMessage = 'The operation was aborted';
          } else {
            orchestrationStatus = 'FAILED';
            errorMessage = err?.message || String(err);
          }

          // SAGA COMPENSATION: Execute compensations in reverse order
          if (executedComps.length > 0) {
            for (let i = executedComps.length - 1; i >= 0; i--) {
              try {
                await executedComps[i]();
              } catch (compErr) {
                console.error(`[KrnlQ] Compensation failed:`, compErr);
              }
            }
          }
        } finally {
          if (timeoutTimer) clearTimeout(timeoutTimer);
          this.activeOrchestrations.delete(executionId);
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
      },
    });

    return await handle.result();
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
    let stepCancelled = false;
    const stepTimeoutMs = step.timeoutPolicy?.timeoutMs;

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
      const stepAbortController = new AbortController();
      if (context.abortSignal) {
        if (context.abortSignal.aborted) {
          stepAbortController.abort();
        } else {
          context.abortSignal.addEventListener('abort', () => stepAbortController.abort(), { once: true });
        }
      }

      const stepContext: OrchestrationContext = {
        ...context,
        abortSignal: stepAbortController.signal,
      };

      try {
        let stepOutput: any;
        let stepTimer: NodeJS.Timeout | undefined;
        stepCancelled = false;

        const runPromise = (async () => {
          if (step.type === 'nested' && step.nestedOrchestrationId && nestedRunner) {
            const childContext: OrchestrationContext = {
              ...stepContext,
              parentCorrelationId: context.correlationId,
              correlationId: `${context.correlationId}.${step.id}`,
            };
            return await nestedRunner(step.nestedOrchestrationId, context.results, childContext);
          }

          if (step.type === 'fanOut' && step.getItems) {
            const items = await step.getItems(stepContext);
            if (!Array.isArray(items)) throw new Error(`[fanOut] getItems must return an array.`);
            const concurrency = step.concurrency || 5;
            const results: any[] = [];
            for (let i = 0; i < items.length; i += concurrency) {
              const slice = items.slice(i, i + concurrency);
              const sliceRes = await Promise.all(
                slice.map((item) => (step.handler ? step.handler(item, stepContext) : Promise.resolve(item)))
              );
              results.push(...sliceRes);
            }
            return results;
          }

          if (step.handler) {
            return await step.handler(context.results, stepContext);
          }

          return context.results;
        })();

        const abortPromise = new Promise<never>((_, reject) => {
          if (stepAbortController.signal.aborted || context.isCancelled) {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          }
          stepAbortController.signal.addEventListener('abort', () => {
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
              const tErr = new Error(`Step "${step.id}" timed out after ${stepTimeoutMs}ms.`);
              tErr.name = 'TimeoutError';
              reject(tErr);
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
        if (stepCancelled || err?.name === 'TimeoutError') {
          return {
            stepId: step.id,
            status: 'TIMED_OUT',
            attempts,
            error: err?.message || `Step "${step.id}" timed out after ${stepTimeoutMs}ms.`,
            startedAt: stepStart,
            completedAt: Date.now(),
          };
        }

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

        if (step.catchHandler && attempts >= maxAttempts) {
          try {
            const recovered = await step.catchHandler(err, stepContext);
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
    const active = this.activeOrchestrations.get(executionId);
    if (active) {
      active.context.isCancelled = true;
      active.abortController.abort();
      return true;
    }
    return false;
  }
}
