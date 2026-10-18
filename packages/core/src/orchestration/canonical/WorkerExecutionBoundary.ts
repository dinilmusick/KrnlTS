/**
 * @file WorkerExecutionBoundary.ts
 * @description Worker Execution Boundary mediating all job execution from Krnl workers
 * to service functionalities and orchestrations.
 * Enforces worker context invariants (no synchronous/unmediated direct execution).
 */

export interface ExecutionContext {
  readonly isWorkerContext: boolean;
  readonly workerId: string;
  readonly timestamp: number;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface BackendCommand<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly createdAt: number;
}

export interface NormalizedResult<T = unknown> {
  readonly correlationId: string;
  readonly status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  readonly data?: T;
  readonly error?: string;
  readonly executionTimestamp: number;
}

export class WorkerExecutionBoundary {
  constructor(
    public readonly workerId: string,
    private readonly handler?: (
      command: BackendCommand<any>,
      context: ExecutionContext
    ) => Promise<NormalizedResult<any>>
  ) {}

  async processJob<T = unknown>(
    command: BackendCommand<any>,
    metadata?: Record<string, unknown>
  ): Promise<NormalizedResult<T>> {
    if (!this.handler) {
      return {
        correlationId: command.correlationId,
        status: 'COMPLETED',
        data: command.payload as T,
        executionTimestamp: Date.now(),
      };
    }

    const context: ExecutionContext = {
      isWorkerContext: true,
      workerId: this.workerId,
      timestamp: Date.now(),
      correlationId: command.correlationId,
      metadata,
    };

    WorkerExecutionBoundary.assertWorkerContext(context);
    return await this.handler(command, context);
  }

  static assertWorkerContext(context?: ExecutionContext): void {
    if (!context || !context.isWorkerContext) {
      throw new Error(
        '[WorkerExecutionBoundary] Violation: DIRECT_CALL -> SERVICE_BOUNDARY is strictly forbidden. All operations must execute inside KrnlWorker context.'
      );
    }
  }
}
