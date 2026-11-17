// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: COMMON AGENT MESSAGE CONTRACT TYPES ════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

export type AgentLevel = 'AIKO' | 'TOOL' | 'ENDPOINT';

export type MessageStatus = 'SUCCESS' | 'FAILURE' | 'INSUFFICIENT_INFORMATION';

export type ErrorSource =
  | 'AGENT'
  | 'EXECUTOR'
  | 'TRANSPORT'
  | 'VALIDATION'
  | 'DEPENDENCY'
  | 'USER_INPUT';

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export interface Goal {
  description: string;
  expectedOutput?: string;
}

export interface Task {
  id: string;
  description: string;
  goals: Goal[];
  target?: string;
  toolName?: string;
  featureName?: string;
  instruction?: string;
  dependsOn?: string[];
  inputFromTasks?: TaskResultReference[];
}

export type EndpointTask = Task;

export interface MissingInformation {
  key: string;
  description: string;
  expectedType?: string;
  required: boolean;
}

export interface TaskResultReference {
  messageId: string;
  taskId: string;
  path?: string;
  targetContextKey: string;
}

export interface AgentMessage {
  messageId: string;
  correlationId: string;
  parentMessageId?: string;
  status: MessageStatus;
  source: {
    level: AgentLevel;
    agentId: string;
    toolName?: string;
    featureName?: string;
  };
  task: {
    taskId: string;
    instruction: string;
    description?: string;
    goals?: Goal[];
    target?: string;
  };
  result?: {
    data?: JSONValue;
    summary?: string;
    outputSchema?: Record<string, any>;
  };
  error?: {
    code: string;
    source: ErrorSource;
    message: string;
    details?: JSONValue;
    retryable: boolean;
  };
  insufficiency?: {
    missing: MissingInformation[];
    reason: string;
    attemptedActions?: string[];
  };
  context?: {
    resolvedInputs?: JSONValue;
    dependencyResults?: TaskResultReference[];
  };
  metadata: {
    createdAt: string;
    attempt?: number;
    resolvedBy?: AgentLevel;
  };
}

export interface TargetDefinition {
  name: string;
  type: 'TOOL' | 'ENDPOINT' | 'AIKO';
  description: string;
  toolName?: string;
  featureName?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  inputRequirements?: string[];
}

export interface AgentContext {
  agentLevel: AgentLevel;
  agentId: string;
  workspace: string;
  toolDefinition?: any;
  featureDefinition?: any;
  availableTools?: any[];
  scopedLearnings?: string[];
  memories?: string[];
  dependencyResults?: Record<string, JSONValue>;
  observations?: string[];
  customInference?: (prompt: string, profile: any) => Promise<string>;
  selectedProvider?: string;
  selectedModel?: string;
  intelligenceSpecId?: string;
  agentDefinition?: any;
}
