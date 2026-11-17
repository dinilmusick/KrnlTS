/**
 * @file queueContracts.ts
 * @description Pure browser-safe command, job, queue, and execution contracts.
 * ZERO Node/server/BullMQ dependency closure.
 * Conforms to Skipo Governance (< 200 lines).
 */

export interface CorrelationMetadata {
  correlationId: string;
  idempotencyKey?: string;
  timestamp: number;
  source?: string;
  traceId?: string;
}

export interface BackendCommand<TPayload = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  metadata?: Record<string, unknown>;
  correlationId: string;
  idempotencyKey?: string;
  createdAt: number;
}

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface ExecutionJob<TPayload = unknown> {
  id: string;
  correlationId: string;
  command: BackendCommand<TPayload>;
  status: JobStatus;
  priority: JobPriority;
  retryPolicy?: RetryPolicy;
  attemptsMade: number;
  createdAt: number;
  completedAt?: number;
}

export interface NormalizedResult<TData = unknown> {
  correlationId: string;
  status: 'COMPLETED' | 'FAILED';
  data?: TData;
  error?: string;
  executionTimestamp: number;
}

export interface QueueTransportOptions {
  gatewayUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface QueueGatewayContract {
  enqueue<T = unknown>(command: BackendCommand<T>): Promise<{ jobId: string; correlationId: string }>;
  checkStatus(jobId: string): Promise<NormalizedResult>;
}

export interface WorkspaceDescriptor {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceSyncSummary {
  success: boolean;
  workspaceId: string;
  folderKey: string;
  workingDir?: string;
  persistenceType: string;
  targetLocation: string;
  syncedFiles: Array<{ fileName: string; action: string; sizeBytes?: number }>;
  uploadedCount: number;
  downloadedCount: number;
  syncedAt: string;
  error?: string;
}

export interface WorkspaceLookupResult {
  user?: any;
  workspace: any;
  connection?: any;
}

export interface WorkspaceListResult {
  success: boolean;
  workspaces: any[];
  activeWorkspaceId?: string | null;
  storage_connections?: any[];
}

export interface WorkspaceMutationResult {
  success: boolean;
  workspace?: any;
  workspaces?: any[];
}

export interface WorkspaceFileEntry {
  path: string;
  name: string;
  sizeBytes?: number;
  updatedAt?: string | number;
  isFolder?: boolean;
}

export interface WorkspaceServiceContract {
  readonly type: 'remote' | 'working';
  findWorkspace(workspaceId: string): Promise<WorkspaceLookupResult>;
  listWorkspaces(userId?: string): Promise<WorkspaceListResult>;
  createWorkspace(userId: string, data: any): Promise<WorkspaceMutationResult>;
  updateWorkspace(userId: string, params: any): Promise<WorkspaceMutationResult>;
  deleteWorkspace(userId: string, workspaceId: string): Promise<{ success: boolean; workspaces?: any[] }>;
  readFile(workspaceId: string, filePath: string): Promise<Uint8Array | string>;
  writeFile(workspaceId: string, filePath: string, content: Uint8Array | string): Promise<{ success: boolean; path: string; sizeBytes?: number }>;
  deleteFile(workspaceId: string, filePath: string): Promise<{ success: boolean }>;
  listFiles(workspaceId: string, subfolder?: string): Promise<WorkspaceFileEntry[]>;
  sync?(workspaceId: string, options?: any): Promise<WorkspaceSyncSummary>;
}
