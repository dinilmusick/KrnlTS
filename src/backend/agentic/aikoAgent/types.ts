import { JSONValue } from '../../aiko/types.js';
import { AgentError } from '../types.js';
import { ModelProfileRequest } from '../../types.js';

export interface WorkflowExecutionItem {
  workflowId: string;
  workflowName: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  output?: JSONValue;
  error?: AgentError;
  durationMs: number;
}

export interface AikoAgentInput {
  query: string;
  workspace: string;
  userId?: string;
  roles?: readonly string[];
  maxIterations?: number;
  intelligenceSpecId?: string;
  selectedProvider?: string;
  selectedModel?: string;
  customInference?: (prompt: string, profile: ModelProfileRequest) => Promise<string>;
}

export interface WorkflowExecutionResult { success: boolean; output?: unknown; errors?: unknown[]; execution?: unknown; }

export interface AikoAgentResult {
  success: boolean;
  workflowExecutions: WorkflowExecutionItem[];
  finalResult?: JSONValue;
  response?: string;
  intelligenceSpecId?: string;
  resolvedModelId?: string;
  providerId?: string;
  error?: AgentError;
  durationMs: number;
}
