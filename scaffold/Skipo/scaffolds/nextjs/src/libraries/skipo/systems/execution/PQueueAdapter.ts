import PQueue from "p-queue";
import type { ExecutionJob, ExecutionJobStatus, JobPriority } from "./types";

export interface PQueueAdapterOptions {
  queueName: string;
  maxConcurrency: number;
  maxRetainedJobs?: number;
}

type Processor<TPayload> = (job: ExecutionJob<TPayload>) => Promise<unknown>;

interface QueueJobRecord {
  status: ExecutionJobStatus;
  result?: unknown;
  error?: string;
}

const priorityValue: Record<JobPriority, number> = {
  CRITICAL: 100,
  HIGH: 50,
  NORMAL: 0,
  LOW: -50,
};

/**
 * In-process command scheduler backed by p-queue.
 *
 * Queue contents and status records live only in this process. They are not
 * persisted, shared across processes, or recoverable after a process restart.
 */
export class PQueueAdapter<TPayload = Record<string, unknown>> {
  private readonly queue: PQueue;
  private readonly jobs = new Map<string, QueueJobRecord>();
  private closed = false;
  public readonly queueName: string;
  private readonly maxRetainedJobs: number;

  constructor(
    options: PQueueAdapterOptions,
    private readonly processor: Processor<TPayload>,
  ) {
    this.queueName = options.queueName;
    this.maxRetainedJobs = options.maxRetainedJobs ?? 1000;
    this.queue = new PQueue({
      concurrency: Math.max(1, options.maxConcurrency),
      autoStart: true,
    });
  }

  enqueue(job: ExecutionJob<TPayload>): string {
    if (this.closed) throw new Error(`[PQueueAdapter:${this.queueName}] Queue is closed.`);
    this.pruneJobs();
    this.jobs.set(job.id, { status: "QUEUED" });

    void this.queue.add(
      async () => {
        const record = this.jobs.get(job.id);
        if (!record) return;
        record.status = "RUNNING";

        const attempts = Math.max(1, job.retryPolicy.maxAttempts);
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
          try {
            record.result = await this.processor(job);
            record.status = "COMPLETED";
            return;
          } catch (error) {
            record.error = error instanceof Error ? error.message : String(error);
            if (attempt < attempts) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.max(0, job.retryPolicy.backoffMs)),
              );
            }
          }
        }

        record.status = "FAILED";
      },
      { priority: priorityValue[job.priority] ?? priorityValue.NORMAL },
    ).catch((error: unknown) => {
      const record = this.jobs.get(job.id);
      if (!record) return;
      record.status = "FAILED";
      record.error = error instanceof Error ? error.message : String(error);
    });

    return job.id;
  }

  getJobStatus(jobId: string): ExecutionJobStatus | undefined {
    return this.jobs.get(jobId)?.status;
  }

  getJobResult(jobId: string): unknown {
    return this.jobs.get(jobId)?.result;
  }

  getJobError(jobId: string): string | undefined {
    return this.jobs.get(jobId)?.error;
  }

  private pruneJobs(): void {
    if (this.jobs.size < this.maxRetainedJobs) return;
    for (const [id, record] of this.jobs) {
      if (record.status === "COMPLETED" || record.status === "FAILED") {
        this.jobs.delete(id);
        if (this.jobs.size < this.maxRetainedJobs) return;
      }
    }
  }

  async onIdle(): Promise<void> {
    await this.queue.onIdle();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.queue.onIdle();
    this.queue.pause();
  }

  get concurrency(): number {
    return this.queue.concurrency;
  }

  get size(): number {
    return this.queue.size;
  }

  get pending(): number {
    return this.queue.pending;
  }
}
