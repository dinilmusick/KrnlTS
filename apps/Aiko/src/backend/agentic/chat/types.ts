import { JSONValue } from '../../aiko/types.js';
import { AgentError } from '../types.js';

export interface WorkflowMention {
  workflowId: string;
  workflowName: string;
  start?: number;
  end?: number;
}

export type AgentStepPhase = 'IDLE' | 'AIKO_AGENT_RUNNING' | 'WORKFLOW_RUNNING' | 'RESULT';

export interface AgentWorkflowExecutionItem {
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'blocked';
  output?: JSONValue;
  durationMs?: number;
}

export interface AgentExecutionState {
  phase: AgentStepPhase;
  workflows: AgentWorkflowExecutionItem[];
  tools?: Array<{ toolName: string; status: 'pending' | 'running' | 'success' | 'failed'; features?: Array<{ featureName: string; status: 'pending' | 'running' | 'success' | 'failed'; instruction?: string }> }>;
  totalDurationMs?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  workflowMentions?: WorkflowMention[];
  toolMentions?: Array<{ toolName: string; featureName?: string }>;
  agentExecution?: AgentExecutionState;
  finalResult?: JSONValue;
  error?: boolean;
  errorMessage?: string;
  providerId?: string;
  modelId?: string;
  keyUsedId?: string;
  keyLabel?: string;
  latencyMs?: number;
}

export interface ChatAgentRequest {
  query: string;
  workspace: string;
  userId?: string;
  roles?: readonly string[];
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  selectedProvider?: string;
  selectedModel?: string;
  customInference?: (prompt: string, profile: any) => Promise<string>;
}

export interface ChatAgentResponse {
  success: boolean;
  message: ChatMessage;
  error?: AgentError;
}
