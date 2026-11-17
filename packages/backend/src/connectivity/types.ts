/**
 * @file types.ts
 * @description Canonical protocol types, messages, jobs, callbacks, and resolution interfaces.
 */

export type MessageType =
  | 'COMMAND'
  | 'QUERY'
  | 'RESULT'
  | 'EVENT'
  | 'CALLBACK_REQUEST'
  | 'CALLBACK_RESULT'
  | 'JOB_SUBMIT'
  | 'JOB_PROGRESS'
  | 'JOB_RESULT'
  | 'ERROR'
  | 'ACK';

export interface AuthContext {
  userId?: string;
  role?: string;
  permissions?: string[];
  token?: string;
}

export interface CapabilityContext {
  domain: string;
  capability: string;
  scope?: string;
}

export interface Message<T = unknown> {
  id: string;
  type: MessageType;
  operation: string;
  payload?: T;
  sessionId?: string;
  correlationId?: string;
  causationId?: string;
  sequence?: number;
  timestamp: number;
  authContext?: AuthContext;
  capabilityContext?: CapabilityContext;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CallbackHandle {
  id: string;
  sessionId: string;
  capability: string;
  expiration: number;
}

export interface Delegation<T = unknown> {
  target: string;
  operation: string;
  payload: T;
  callbackHandle?: CallbackHandle;
  eventChannel?: string;
  sessionId?: string;
  correlationId?: string;
}

export type JobState =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Job<TPayload = unknown, TResult = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  priority?: JobPriority;
  sequence?: number;
  sequenceKey?: string;
  dependencies?: string[];
  sessionId?: string;
  correlationId?: string;
  state: JobState;
  progress?: number;
  result?: TResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export type ResolutionStrategy =
  | 'LOCAL'
  | 'REMOTE'
  | 'REMOTE_FIRST'
  | 'LOCAL_FIRST';

export interface ResourceVersion {
  version: number;
  updatedAt: number;
  checksum?: string;
}

export interface DistributedLock {
  key: string;
  ownerId: string;
  leaseId: string;
  expiration: number;
}

export interface BackendInstance {
  id: string;
  url: string;
  healthy: boolean;
  capacity: number;
  activeJobs: number;
  activeConnections: number;
  latencyMs: number;
  lastHeartbeat: number;
  weight?: number;
}

export type RoutingStrategy =
  | 'roundRobin'
  | 'weighted'
  | 'leastConnections'
  | 'latencyAware'
  | 'capacityAware';

export interface IdempotentRequest<T = unknown> {
  id: string;
  idempotencyKey: string;
  operation: string;
  payload: T;
  timestamp: number;
}

export interface BackendExecutor {
  execute<T = unknown, R = unknown>(command: Message<T>): Promise<R>;
  query<T = unknown, R = unknown>(query: Message<T>): Promise<R>;
  subscribe(channel: string, handler: (event: Message) => void): () => void;
  emit(event: Message): Promise<void>;
  registerCallback(callback: (...args: unknown[]) => unknown): CallbackHandle;
  delegate<T = unknown, R = unknown>(delegation: Delegation<T>): Promise<R>;
  submitJob<T = unknown, R = unknown>(job: Partial<Job<T, R>>): Promise<Job<T, R>>;
}
