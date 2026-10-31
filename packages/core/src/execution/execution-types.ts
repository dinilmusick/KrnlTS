export type ExecutionStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "timed-out";

export interface ExecutionRequest {
  workspaceId: string;
  command: string;
  cwd?: string;
  environment?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  network?: "none" | "restricted" | "full";
  resources?: {cpu?: number; memoryMb?: number; diskMb?: number};
}

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  exitCode?: number;
  stdout: string;
  stderr: string;
  artifactIds: readonly string[];
}

export interface ExecutionProvider {
  readonly id: string;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  cancel(executionId: string): Promise<void>;
}

export interface ExecutionController {
  register(provider: ExecutionProvider): void;
  execute(request: ExecutionRequest, providerId?: string): Promise<ExecutionResult>;
  cancel(executionId: string): Promise<void>;
}
