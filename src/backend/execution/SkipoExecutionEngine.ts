/**
 * @file SkipoExecutionEngine.ts
 * @description Canonical Skipo Execution Engine managing SkipoQ and cross-service dispatches.
 *
 * Invariants:
 * - External caller -> ServiceOrchestration -> SkipoQ -> ServiceFacade -> KrnlQ -> Worker -> Service Operation -> Result
 * - Zero synchronous unmediated bypasses.
 * - Single-service apps and multi-service orchestrations are fully supported.
 */

import { WorkerExecutionBoundary } from '@ultrst-armada/krnl';
import {
  ServiceOrchestration,
  type ServiceTarget,
  type ServiceOrchestrationExecutionResult,
} from '../orchestration/ServiceOrchestration.js';
import { SkipoQ, type SkipoQOptions } from './SkipoQ.js';

export interface ServiceExecutionOptions {
  correlationId?: string;
  idempotencyKey?: string;
  abortSignal?: AbortSignal;
  metadata?: Record<string, unknown>;
  timeoutMs?: number;
}

export class SkipoExecutionEngine {
  private queue: SkipoQ;
  private workerBoundary: WorkerExecutionBoundary;
  private services: Map<string, ServiceTarget> = new Map();

  constructor(options: SkipoQOptions = {}) {
    this.queue = new SkipoQ({ queueName: options.queueName ?? 'skipo_main_queue', ...options });
    this.workerBoundary = new WorkerExecutionBoundary('skipo_engine_worker');
  }

  public registerService(name: string, service: ServiceTarget): this {
    this.services.set(name, service);
    this.queue.registerService(name, service);
    return this;
  }

  public getService(name: string): ServiceTarget | undefined {
    return this.services.get(name);
  }

  public getQueue(): SkipoQ {
    return this.queue;
  }

  public getWorkerBoundary(): WorkerExecutionBoundary {
    return this.workerBoundary;
  }

  /**
   * Dispatches a service operation through the ServiceFacade -> KrnlQ pipeline.
   * Enforces that all execution runs mediated through the queue and worker context.
   */
  public async executeService<TInput = unknown, TOutput = unknown>(
    serviceOrName: ServiceTarget,
    operation: string,
    input?: TInput,
    options: ServiceExecutionOptions = {}
  ): Promise<TOutput> {
    const targetService = typeof serviceOrName === 'string'
      ? this.services.get(serviceOrName)
      : serviceOrName;

    if (!targetService) {
      throw new Error(`[SkipoExecutionEngine] Service '${String(serviceOrName)}' is not registered.`);
    }

    // Build a single-step service orchestration that executes through SkipoQ
    const orchestration = new ServiceOrchestration<TInput, TOutput>(
      `executeService_${operation}`,
      '1.0.0'
    );

    orchestration.thenService<TInput, TOutput>(targetService, operation, {
      id: `op_${operation}`,
      timeoutMs: options.timeoutMs,
    });

    const result = await orchestration.execute(input as TInput, {
      correlationId: options.correlationId ?? `corr_svc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      idempotencyKey: options.idempotencyKey,
      abortSignal: options.abortSignal,
      metadata: options.metadata,
    });

    if (!result.success) {
      throw result.error ?? new Error(`Service operation '${operation}' execution failed.`);
    }

    return result.data as TOutput;
  }

  /**
   * Executes a ServiceOrchestration through SkipoQ.
   */
  public async executeOrchestration<TInput = unknown, TOutput = unknown>(
    orchestration: ServiceOrchestration<TInput, TOutput>,
    input: TInput,
    options: ServiceExecutionOptions = {}
  ): Promise<ServiceOrchestrationExecutionResult<TOutput>> {
    return orchestration.execute(input, {
      correlationId: options.correlationId,
      idempotencyKey: options.idempotencyKey,
      abortSignal: options.abortSignal,
      metadata: options.metadata,
    });
  }

  /**
   * Graceful cleanup of queues.
   */
  public async close(): Promise<void> {
    await this.queue.dispose();
  }
}

export const skipoExecutionEngine = new SkipoExecutionEngine();
export const skipoWorkerBoundary = skipoExecutionEngine.getWorkerBoundary();
