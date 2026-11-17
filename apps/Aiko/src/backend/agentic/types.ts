export * from '../types.js';
export * from './aikoAgent/types.js';
export * from './chat/types.js';
export * from './enricher/types.js';
export * from './router/types.js';
export {
  type TaskState,
  type TaskReference,
  type TaskExecutorContext,
  type TaskExecutorResult,
  type TaskExecutor,
  type SchedulerOptions,
  type SchedulerExecuteInput,
  type SchedulerResult
} from './scheduler/types.js';
export {
  type AgentMessage,
  type AgentContext,
  type AgentLevel,
  type MessageStatus,
  type TargetDefinition
} from './message/agentMessageTypes.js';

export interface EndpointAgentInput {
  task: string;
  tool: any;
  feature: any;
  workspace: string;
  customInference?: any;
  maxAttempts?: number;
  intelligenceSpecId?: string;
  selectedProvider?: string;
  selectedModel?: string;
  injectedContext?: any;
}

export interface EndpointAgentResult {
  success: boolean;
  attempts: number;
  data?: any;
  result?: any;
  payload?: any;
  error?: any;
  durationMs: number;
  candidateLearnings?: any;
  intelligenceSpecId?: string;
  resolvedModelId?: string;
  providerId?: string;
  semanticMeaning?: any;
}
