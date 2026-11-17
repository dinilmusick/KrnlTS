export type JobPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type ExecutionJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface ExecutionJob<TPayload = Record<string, unknown>> {
  id: string;
  command: {
    id: string;
    type: string;
    payload: TPayload;
  };
  priority: JobPriority;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number;
  };
  createdAt: number;
  status: ExecutionJobStatus;
}
