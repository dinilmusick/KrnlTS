/**
 * ASCII Architecture Flowchart: types
 *
 *   ┌──────────────────────────────────────┐
 *   │           Initialize types           │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │  Execute Component / Pipeline Logic  │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │    Return State / Result Payload     │
 *   └──────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ DEPENDENCY-AWARE TASK SCHEDULER TYPES ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { JSONValue, ExecutionResult, ExecutionError } from '../../aiko/types.js';
import { AgentError } from '../types.js';

export type TaskID = string;

export type TaskState = 'PENDING' | 'READY' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export interface TaskReference {
  taskId: TaskID;
  path?: string;
  targetContextKey?: string;
  field?: string;
  alias?: string;
}

export interface Task {
  id: TaskID;
  instruction: string;
  featureName: string;
  dependsOn: TaskID[];
  inputFromTasks?: TaskReference[];
  status?: TaskState;
}

export interface SchedulerTaskResult {
  taskId: TaskID;
  state: TaskState;
  result?: JSONValue;
  error?: ExecutionError | AgentError;
  durationMs: number;
  attempts?: number;
  rawResult?: ExecutionResult;
  instruction?: string;
  featureName?: string;
}

export type SchedulerErrorKind =
  | 'VALIDATION'
  | 'CYCLIC_DEPENDENCY'
  | 'UNKNOWN_DEPENDENCY'
  | 'SELF_DEPENDENCY'
  | 'DUPLICATE_TASK_ID'
  | 'INVALID_REFERENCE'
  | 'EXECUTION_FAILED';

export interface SchedulerError {
  kind: SchedulerErrorKind;
  message: string;
  details?: JSONValue;
}

export interface SchedulerResult {
  success: boolean;
  tasks: SchedulerTaskResult[];
  executionOrder: TaskID[];
  error?: SchedulerError;
  durationMs: number;
}

export interface TaskExecutorContext {
  task: Task;
  context: Record<string, JSONValue>;
}

export interface TaskExecutorResult {
  success: boolean;
  result?: JSONValue;
  error?: ExecutionError | AgentError;
  rawResult?: ExecutionResult;
  attempts?: number;
}

export interface TaskExecutor {
  execute(params: TaskExecutorContext): Promise<TaskExecutorResult>;
}

export interface SchedulerOptions {
  maxConcurrency?: number;
}

export interface SchedulerExecuteInput {
  tasks: Task[];
  executor: TaskExecutor;
  options?: SchedulerOptions;
}