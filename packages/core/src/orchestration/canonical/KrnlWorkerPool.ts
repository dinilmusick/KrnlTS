/**
 * @file KrnlWorkerPool.ts
 * @description Worker lifecycle management and context factory for KrnlTS services.
 * Tracks worker state transitions: created -> started -> running -> draining -> stopped.
 * Ensures all job executions happen with valid ExecutionContext.
 */

import { ExecutionContext, WorkerExecutionBoundary } from './WorkerExecutionBoundary.js';

export type KrnlWorkerState = 'created' | 'started' | 'running' | 'draining' | 'stopped';

export interface KrnlWorkerInfo {
  readonly id: string;
  readonly queueName: string;
  readonly state: KrnlWorkerState;
  readonly startedAt: number;
  readonly activeJobs: number;
}

export class KrnlWorkerPool {
  private state: KrnlWorkerState = 'created';
  private activeJobsCount = 0;
  private readonly startedAt: number = Date.now();
  private readonly workerBoundary: WorkerExecutionBoundary;

  constructor(
    public readonly queueName: string,
    public readonly workerId: string = `worker_${queueName}_${Math.random().toString(36).substring(2, 7)}`
  ) {
    this.workerBoundary = new WorkerExecutionBoundary(this.workerId);
  }

  getState(): KrnlWorkerState {
    return this.state;
  }

  getActiveJobs(): number {
    return this.activeJobsCount;
  }

  getWorkerBoundary(): WorkerExecutionBoundary {
    return this.workerBoundary;
  }

  getInfo(): KrnlWorkerInfo {
    return {
      id: this.workerId,
      queueName: this.queueName,
      state: this.state,
      startedAt: this.startedAt,
      activeJobs: this.activeJobsCount,
    };
  }

  start(): void {
    if (this.state === 'stopped') {
      throw new Error(`[KrnlWorkerPool:${this.workerId}] Cannot start stopped worker.`);
    }
    this.state = 'started';
  }

  createContext(correlationId?: string, metadata?: Record<string, unknown>): ExecutionContext {
    return {
      isWorkerContext: true,
      workerId: this.workerId,
      timestamp: Date.now(),
      correlationId: correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`,
      metadata,
    };
  }

  async runWithContext<T>(
    correlationId: string | undefined,
    metadata: Record<string, unknown> | undefined,
    fn: (ctx: ExecutionContext) => Promise<T>
  ): Promise<T> {
    if (this.state === 'stopped' || this.state === 'draining') {
      throw new Error(`[KrnlWorkerPool:${this.workerId}] Worker is not accepting new jobs (state: ${this.state}).`);
    }

    this.state = 'running';
    this.activeJobsCount++;
    const ctx = this.createContext(correlationId, metadata);
    WorkerExecutionBoundary.assertWorkerContext(ctx);

    try {
      return await fn(ctx);
    } finally {
      this.activeJobsCount--;
      if (this.activeJobsCount === 0 && this.state === 'running') {
        this.state = 'started';
      }
    }
  }

  async drain(): Promise<void> {
    this.state = 'draining';
    while (this.activeJobsCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async stop(): Promise<void> {
    await this.drain();
    this.state = 'stopped';
  }
}
