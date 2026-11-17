// ══════════════════════════════════════════════════════════════════════════════════
// ════ CANONICAL SERVER & DOMAIN TYPES ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

export type ProviderId = 'google' | 'groq' | 'cerebras' | 'openrouter' | 'together' | 'nvidia' | 'huggingface' | 'anthropic' | 'openai' | string;
export type RotationStrategy = 'lowest-latency' | 'round-robin' | 'weighted-random' | 'cost-optimized' | 'failover-priority' | string;

export type TaskID = string;

export interface Task {
  id: TaskID;
  instruction: string;
  toolName?: string;
  featureName?: string;
  dependencies?: TaskID[];
  dependsOn?: TaskID[];
  [key: string]: any;
}

export interface TaskResult {
  taskId: TaskID;
  success?: boolean;
  output?: any;
  error?: any;
  durationMs?: number;
  attempts?: number;
  status?: any;
  [key: string]: any;
}

export type SchedulerErrorKind =
  | 'VALIDATION'
  | 'CYCLIC_DEPENDENCY'
  | 'UNKNOWN_DEPENDENCY'
  | 'SELF_DEPENDENCY'
  | 'DUPLICATE_TASK_ID'
  | 'INVALID_REFERENCE'
  | 'EXECUTION_FAILED'
  | string;

export interface SchedulerError {
  kind: any;
  message: string;
  details?: any;
}

export interface AgentError {
  kind?: string;
  code?: string;
  message: string;
  details?: any;
  [key: string]: any;
}

export interface AgentReliabilityRequest {
  toolName?: string;
  featureName?: string;
  payload?: any;
  maxRetries?: number;
  tools?: any[];
  messages?: any[];
  prompt?: string;
  requiredContext?: number;
  intelligenceSpec?: any;
  [key: string]: any;
}

export interface AgentReliabilityAttempt {
  attempt?: number;
  attemptIndex?: number;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export interface ZodValidationErrorDetail {
  path?: string;
  message?: string;
  code?: string;
  [key: string]: any;
}

export interface ApiKeyEntry {
  id: string;
  providerId: ProviderId;
  label: string;
  key: string;
  keyValue?: string;
  status: 'active' | 'valid' | 'invalid' | 'rate-limited' | 'checking' | string;
  isActive: boolean;
  createdAt: string;
  weight: number;
  remainingCreditsUsd: number | null;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastLatencyMs: number;
  errorCount: number;
  lifespanSeconds?: number | null;
  expiresAt?: string | null;
  expiresAtIso?: string | null;
  lastUsedAt?: string | null;
  validationError?: string | null;
  failedModels?: string[];
}

export interface KeyValidationResult {
  valid?: boolean;
  isValid?: boolean;
  status?: string;
  errors?: string[];
  message?: string;
  details?: any;
  [key: string]: any;
}

export interface KeyModelUsageStats {
  keyId: string;
  modelId: string;
  totalCalls?: number;
  successfulCalls?: number;
  failedCalls?: number;
  lastUsedAt?: string;
  avgLatencyMs?: number;
  averageLatencyMs?: number;
  dailyCalls?: number;
  weeklyCalls?: number;
  monthlyCalls?: number;
  [key: string]: any;
}

export interface KeyModelFailure {
  keyId?: string;
  modelId?: string;
  errorType?: string;
  errorMessage?: string;
  timestamp?: string;
  failureCount?: number;
  penaltyPercent?: number;
  lastFailedAt?: string;
  lastError?: string;
  [key: string]: any;
}

export interface ModelCatalogEntry {
  id: string;
  name: string;
  providerId: ProviderId;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  costPer1kInputUsd?: number;
  costPer1kOutputUsd?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
  supportsJson?: boolean;
  isFree?: boolean;
  latencyRatingMs?: number;
  qualityRating?: number;
  maxOutputTokens?: number;
  status?: string;
  runtimeStats?: any;
  intelligenceSpec?: any;
  intelligenceRating?: any;
  [key: string]: any;
}

export interface ModelProfileRequest {
  providerId?: ProviderId;
  modelId?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  avoidPaidProviders?: boolean;
  intelligenceSpec?: any;
}

export interface RequestLogEntry {
  id?: string;
  timestamp?: string;
  providerId?: ProviderId;
  modelId?: string;
  keyId?: string;
  keyLabel?: string;
  status?: 'success' | 'error' | 'failover' | 'failure' | string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  errorMessage?: string;
  statusCode?: number;
  failoverOccurred?: boolean;
  [key: string]: any;
}

export interface ExecutionContract {
  id?: string;
  contractId?: string;
  workspaceId?: string;
  providerId?: ProviderId;
  modelId?: string;
  strategy?: RotationStrategy;
  keyId?: string;
  timestamp?: string;
  intelligenceSpec?: any;
  [key: string]: any;
}

export interface InferenceFeedbackRequest {
  requestId?: string;
  modelId?: string;
  keyId?: string;
  rating?: number;
  feedback?: string;
  status?: string;
  failedAspects?: string[];
  providerId?: ProviderId;
  contractId?: string;
  [key: string]: any;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema?: any;
  parameters?: any;
}

export interface McpTool extends McpToolDefinition {
  serverId?: string;
  parameters?: any;
  [key: string]: any;
}

export interface McpServerRegistration {
  id?: string;
  name?: string;
  url?: string;
  status?: 'connected' | 'disconnected' | 'error' | string;
  tools?: McpTool[];
  registeredAt?: string;
  [key: string]: any;
}

export interface AgentReliabilityResult {
  score?: number;
  totalExecutions?: number;
  successfulExecutions?: number;
  success?: boolean;
  [key: string]: any;
}

export interface ToolCall {
  id?: string;
  name?: string;
  toolName?: string;
  args?: Record<string, any>;
  callId?: string;
  function?: any;
  [key: string]: any;
}

export interface InferenceOptions {
  providerId?: ProviderId;
  modelId?: string;
  prompt?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  tools?: any[];
  messages?: any[];
  tool_choice?: any;
  [key: string]: any;
}

export interface InferenceResult {
  text: string;
  rawResponse?: any;
  toolCalls?: ToolCall[];
  tokensUsed?: { prompt: number; completion: number; total: number };
}

export interface ExecutionResponse {
  success?: boolean;
  text?: string;
  content?: string;
  data?: any;
  error?: string;
  agentExecution?: any;
  workflowMentions?: any[];
  contractId?: string;
  [key: string]: any;
}

export type IntelligenceDimension = string;

export interface IntelligenceSpec {
  reasoning?: number;
  planning?: number;
  toolUsage?: number;
  structuredOutput?: number;
  jsonStrictness?: number;
  coding?: number;
  extraction?: number;
  classification?: number;
  summarization?: number;
  creativity?: number;
  determinism?: number;
  context?: number;
  vision?: number;
  multimodal?: number;
  outputComplexity?: number;
  [key: string]: any;
}

export interface EndpointSpec {
  intelligenceSpec?: IntelligenceSpec;
  preferencesSpec?: PreferencesSpec;
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  avoidPaidProviders?: boolean;
  blacklistedProviders?: ProviderId[];
  enabledProviders?: ProviderId[];
  requiredContext?: number;
  [key: string]: any;
}

export interface PreferencesSpec {
  avoidPaid?: boolean;
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  enabledProviders?: ProviderId[];
  requiredContext?: number;
  [key: string]: any;
}

export interface ModelCheckResult {
  modelId: string;
  name?: string;
  modelName?: string;
  providerId?: ProviderId;
  status?: string;
  latencyMs?: number;
  error?: string;
  checkedAt?: string;
  supported?: boolean;
  [key: string]: any;
}

export interface StorageEndpoint {
  id: string;
  provider?: string;
  label?: string;
  status?: string;
  configuration?: any;
  enabled?: boolean;
  [key: string]: any;
}

export interface SyncEngineStatus {
  status: string;
  lastSyncAt: string;
  pendingCount: number;
  itemsSynced: number;
}

export interface WorkspaceFS {
  write: (relativePath: string, data: string | Buffer) => Promise<void>;
  read: (relativePath: string) => Promise<string>;
  exists: (relativePath: string) => Promise<boolean>;
  list: (dirPath?: string) => Promise<string[]>;
  delete: (relativePath: string) => Promise<void>;
  mkdir: (dirPath: string) => Promise<void>;
}

export * from './types/agentTypes.js';
export * from './types/credentials.js';
export * from './types/mcpTypes.js';
export * from './types/memoryAndLearning.js';
export * from './aiko/types.js';
export * from './intelligence/types.js';
