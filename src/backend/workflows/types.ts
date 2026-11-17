export type { AikoWorkflow, WorkflowInput } from '../../libraries/workflowContracts.js';
import type { AikoWorkflow, WorkflowInput } from '../../libraries/workflowContracts.js';

export interface WorkflowExecutionContext {
  userId?: string;
  roles?: readonly string[];
  conversationId?: string;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  output?: unknown;
  execution?: unknown;
  errors?: unknown[];
}

export interface FodGraph {
  nodes: unknown[];
  edges: unknown[];
  variables?: Record<string, unknown>;
  customNodes?: unknown[];
  libraries?: unknown[];
  visualOverrides?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
