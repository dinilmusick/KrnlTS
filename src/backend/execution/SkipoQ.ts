/**
 * @file SkipoQ.ts
 * @description In-process execution queue for cross-service ServiceOrchestrations in Skipo.
 * Uses p-queue internally as the low-level scheduling and concurrency primitive.
 * Zero Redis, zero Docker, zero BullMQ, 100% portable TypeScript.
 *
 * Strict Execution Path:
 * ServiceOrchestration -> SkipoQ -> ServiceFacade -> KrnlQ -> Worker -> Functionality
 */

import PQueue from 'p-queue';
import { randomUUID } from 'node:crypto';
import {
  type OrchestrationDescriptor,
  type OrchestrationStep,
  type OrchestrationContext,
  type OrchestrationResult,
  type StepExecutionResult,
  type StepRetryPolicy,
  validateOrchestrationDAG,
  type IServiceFacade,
} from '@ultrst-armada/krnl';

export type SkipoJobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface SkipoJobOptions {
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

export interface SkipoJobDefinition<TInput = unknown, TOutput = unknown> {
  id?: string;
  name: string;
  payload: TInput;
  handler: (payload: TInput, options: SkipoJobOptions) => Promise<TOutput>;
  options?: SkipoJobOptions;
}

export interface SkipoJobHandle<TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  getStatus(): SkipoJobStatus;
  result(): Promise<TOutput>;
  cancel(): boolean;
}

export interface SkipoQOptions {
  queueName?: string;
  concurrency?: number;
  autoStart?: boolean;
  maxRetainedJobs?: number;
}

interface InternalSkipoJobRecord<TOutput = unknown> {
  id: string;
  name: string;
  status: SkipoJobStatus;
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

export class SkipoQ {
  public readonly queueName: string;
  private readonly queue: PQueue;
  private readonly jobs = new Map<string, InternalSkipoJobRecord<any>>();
  private readonly idempotencyStore = new Map<string, any>();
  private readonly activeOrchestrations = new Map<string, { abortController: AbortController; context: OrchestrationContext }>();
  private readonly serviceRegistry = new Map<string, IServiceFacade | any>();
  private readonly maxRetainedJobs: number;

  constructor(options: SkipoQOptions = {}) {
    this.queueName = options.queueName ?? 'skipo_cross_service_queue';
    this.maxRetainedJobs = options.maxRetainedJobs ?? 1000;
    const concurrency = options.concurrency ?? 20;
    this.queue = new PQueue({
      concurrency,
      autoStart: options.autoStart ?? true,
    });
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

  registerService(name: string, service: IServiceFacade | any): this {
    if (!name || typeof name !== 'string') {
      throw new Error('[SkipoQ] Service name must be a non-empty string.');
    }
    if (!service) {
      throw new Error('[SkipoQ] Cannot register null or undefined service.');
    }
    if (typeof service !== 'object' && typeof service !== 'function') {
      throw new Error(`[SkipoQ] Invalid service registration for "${name}": service must be an object or facade.`);
    }
    if (!('call' in service) && !('execute' in service) && !('start' in service)) {
      throw new Error(
        `[SkipoQ] Service "${name}" must provide .call(), .execute(), or .start() interface to be registered.`
      );
    }
    if (this.serviceRegistry.has(name)) {
      console.warn(`[SkipoQ] Warning: Overwriting previously registered service "${name}".`);
    }
    this.serviceRegistry.set(name, service);
    return this;
  }

  getService(name: string): IServiceFacade | any | undefined {
    return this.serviceRegistry.get(name);
  }

  pause(): void {
    this.queue.pause();
  }

  resume(): void {
    this.queue.start();
  }

  clear(): void {
    this.queue.clear();
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
    for (const active of this.activeOrchestrations.values()) {
      active.abortController.abort();
      active.context.isCancelled = true;
    }
    this.activeOrchestrations.clear();
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
   * Enqueues an orchestration task into SkipoQ.
   */
  enqueue<TInput = unknown, TOutput = unknown>(
    jobDef: SkipoJobDefinition<TInput, TOutput>
  ): SkipoJobHandle<TOutput> {
    this.pruneJobs();
    const jobId = jobDef.id || generateSecureId('skipo_job');
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

    const record: InternalSkipoJobRecord<TOutput> = {
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

        const idemKey = jobDef.options?.idempotencyKey;
        if (idemKey && this.idempotencyStore.has(idemKey)) {
          const cached = this.idempotencyStore.get(idemKey);
          record.status = 'completed';
          record.completedAt = Date.now();
          record.result = cached;
          resolvePromise(cached);
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
            let timer: NodeJS.Timeout | undefined;
            const workPromise = jobDef.handler(jobDef.payload, {
              ...jobDef.options,
              abortSignal: abortController.signal,
            });

            let result: TOutput;
            if (timeoutMs && timeoutMs > 0) {
              const timeoutPromise = new Promise<never>((_, rej) => {
                timer = setTimeout(() => {
                  const err = new Error(`Job "${jobDef.name}" timed out after ${timeoutMs}ms.`);
                  err.name = 'TimeoutError';
                  rej(err);
                }, timeoutMs);
              });
              result = await Promise.race([workPromise, timeoutPromise]);
            } else {
              result = await workPromise;
            }
            if (timer) clearTimeout(timer);

            record.status = 'completed';
            record.completedAt = Date.now();
            record.result = result;

            if (idemKey) {
              this.idempotencyStore.set(idemKey, result);
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

  /**
   * Executes a ServiceOrchestration across services via SkipoQ.
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
      abortSignal?: AbortSignal;
    } = {}
  ): Promise<OrchestrationResult<TOutput>> {
    const startedAt = Date.now();
    const correlationId = options.correlationId || generateSecureId('corr_skipoq');
    const executionId = generateSecureId('exec_skipoq');

    if (options.idempotencyKey && this.idempotencyStore.has(options.idempotencyKey)) {
      return this.idempotencyStore.get(options.idempotencyKey);
    }

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
      scope: 'service',
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

            const batch = readySteps.slice(0, this.concurrency);

            const batchPromises = batch.map(async (step) => {
              const stepRes = await this.executeSingleStep(step, context);
              stepResults[step.id] = stepRes;
              executedSteps.add(step.id);

              if (stepRes.status === 'COMPLETED') {
                context.results[step.id] = stepRes.output;
                finalOutput = stepRes.output;

                if (step.compensation?.handler) {
                  executedComps.push(() => step.compensation!.handler!(context));
                }
              } else if (stepRes.status === 'SKIPPED') {
                // Skipped
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
                console.error(`[SkipoQ] Compensation failed:`, compErr);
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
          this.idempotencyStore.set(options.idempotencyKey, result);
        }

        return result;
      },
    });

    return await handle.result();
  }

  private async executeSingleStep(
    step: OrchestrationStep,
    context: OrchestrationContext
  ): Promise<StepExecutionResult> {
    const stepStart = Date.now();
    let attempts = 0;
    const maxAttempts = step.retryPolicy?.maxAttempts ?? 1;

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
      try {
        let stepOutput: any;
        let stepTimer: NodeJS.Timeout | undefined;
        stepCancelled = false;

        const runPromise = (async () => {
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
    const base = policy.backoffMs ?? policy.initialDelayMs ?? 100;
    const multiplier = policy.backoffMultiplier ?? 2;
    let delay: number;
    if (policy.backoff === 'exponential' || policy.backoffMultiplier) {
      delay = base * Math.pow(multiplier, attempt - 1);
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

export const skipoQ = new SkipoQ();
