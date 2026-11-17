export type ProviderId = 'google' | 'groq' | 'cerebras' | 'openrouter' | 'together' | 'nvidia' | 'huggingface' | 'anthropic' | 'openai' | string;
export type RotationStrategy = 'lowest-latency' | 'round-robin' | 'weighted-random' | 'cost-optimized' | 'failover-priority' | string;

export interface ApiKeyEntry {
  id: string;
  providerId: ProviderId;
  label: string;
  key: string;
  keyValue?: string;
  status: string;
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
  status?: string;
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
