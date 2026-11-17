/**
 * @file JobScheduler.ts
 * @description DAG-based job sequencing engine supporting dependency ordering, priority queues, and concurrency control.
 */

import { Job, JobPriority } from './types.js';

export type JobHandler<TPayload = any, TResult = any> = (
  job: Job<TPayload, TResult>,
  updateProgress: (progress: number) => void
) => Promise<TResult>;

export class JobScheduler {
  private jobs = new Map<string, Job<any, any>>();
  private handlers = new Map<string, JobHandler>();
  private sequenceCounters = new Map<string, number>();
  private activeCount = 0;
  private maxConcurrency: number;
  private paused = false;

  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  registerHandler<TPayload = any, TResult = any>(
    type: string,
    handler: JobHandler<TPayload, TResult>
  ): this {
    this.handlers.set(type, handler);
    return this;
  }

  submit<TPayload = any, TResult = any>(
    input: Partial<Job<TPayload, TResult>> & { type: string; payload: TPayload }
  ): Job<TPayload, TResult> {
    const id = input.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const streamKey = input.sequenceKey || 'default';
    const seq = (this.sequenceCounters.get(streamKey) ?? 0) + 1;
    this.sequenceCounters.set(streamKey, seq);

    const job: Job<TPayload, TResult> = {
      id,
      type: input.type,
      payload: input.payload,
      priority: input.priority || 'NORMAL',
      sequence: seq,
      sequenceKey: streamKey,
      dependencies: input.dependencies || [],
      sessionId: input.sessionId,
      correlationId: input.correlationId,
      state: 'PENDING',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(id, job);
    this.checkAndQueue(job);
    this.drainQueue();

    return job;
  }

  private checkAndQueue(job: Job): boolean {
    if (job.state !== 'PENDING') return false;

    // Check if all dependencies are COMPLETED
    const depsResolved = (job.dependencies || []).every((depId) => {
      const dep = this.jobs.get(depId);
      return dep && dep.state === 'COMPLETED';
    });

    if (depsResolved) {
      job.state = 'QUEUED';
      job.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  private priorityWeight(priority?: JobPriority): number {
    switch (priority) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'NORMAL': return 2;
      case 'LOW': return 1;
      default: return 2;
    }
  }

  private async drainQueue(): Promise<void> {
    if (this.paused || this.activeCount >= this.maxConcurrency) return;

    const queuedJobs = Array.from(this.jobs.values())
      .filter((j) => j.state === 'QUEUED')
      .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority) || (a.sequence || 0) - (b.sequence || 0));

    for (const job of queuedJobs) {
      if (this.activeCount >= this.maxConcurrency) break;
      this.executeJob(job);
    }
  }

  private async executeJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.state = 'FAILED';
      job.error = `[JobScheduler] No registered handler for job type "${job.type}".`;
      job.updatedAt = Date.now();
      return;
    }

    this.activeCount++;
    job.state = 'RUNNING';
    job.updatedAt = Date.now();

    const progressCallback = (progress: number) => {
      job.progress = Math.min(100, Math.max(0, progress));
      job.updatedAt = Date.now();
    };

    try {
      job.result = await handler(job, progressCallback);
      job.state = 'COMPLETED';
      job.progress = 100;
    } catch (err: any) {
      job.state = 'FAILED';
      job.error = err?.message || String(err);
    } finally {
      job.updatedAt = Date.now();
      this.activeCount--;

      // Wake up any dependent jobs
      for (const pendingJob of this.jobs.values()) {
        if (pendingJob.dependencies?.includes(job.id)) {
          this.checkAndQueue(pendingJob);
        }
      }

      this.drainQueue();
    }
  }

  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.state === 'COMPLETED' || job.state === 'FAILED') return false;
    job.state = 'CANCELLED';
    job.updatedAt = Date.now();
    return true;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.drainQueue();
  }

  status(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  clear(): void {
    this.jobs.clear();
    this.sequenceCounters.clear();
    this.activeCount = 0;
  }
}
