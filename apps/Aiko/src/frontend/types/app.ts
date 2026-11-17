/**
 * ASCII Architecture Flowchart: app
 *
 *   ┌──────────────────────────────────────┐
 *   │            Initialize app            │
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

import type {
  ProviderId,
  RotationStrategy,
  ApiKeyEntry,
  KeyModelUsageStats,
  KeyModelFailure,
  ModelCatalogEntry,
  ModelProfileRequest,
  RequestLogEntry,
  ExecutionContract,
  InferenceFeedbackRequest,
  McpToolDefinition,
  AgentReliabilityResult,
  ToolCall,
} from '../../libraries/aiContracts.js';
import type {
  IntelligenceSpecPreset,
  IntelligenceSpec,
  IntelligenceDimension,
} from '../../libraries/intelligenceContracts.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export type {
  ProviderId,
  RotationStrategy,
  ApiKeyEntry,
  KeyModelUsageStats,
  KeyModelFailure,
  ModelCatalogEntry,
  ModelProfileRequest,
  RequestLogEntry,
  ExecutionContract,
  InferenceFeedbackRequest,
  McpToolDefinition,
  AgentReliabilityResult,
  ToolCall,
  IntelligenceSpecPreset,
  IntelligenceSpec,
  IntelligenceDimension
};

export type ActiveTabType = 
  | 'keys' 
  | 'models-browser'
  | 'catalog' 
  | 'playground' 
  | 'chat' 
  | 'spec'
  | 'mcp'
  | 'workflows'
  | 'metrics' 
  | 'storage'
  | 'apidocs';

export interface AppState {
  theme: 'light' | 'dark';
  activeTab: ActiveTabType;
  keys: ApiKeyEntry[];
  usageStats: KeyModelUsageStats[];
  strategy: RotationStrategy;
  catalog: ModelCatalogEntry[];
  presets?: IntelligenceSpecPreset[];
  activePresetId?: string | null;
  providerStatuses?: Array<{
    providerId: ProviderId;
    status: 'online' | 'missing-key' | 'error';
    error?: string;
    modelsCount: number;
  }>;
  logs: RequestLogEntry[];
  metricsSummary: {
    totalRequests: number;
    successRatePercent: number;
    averageLatencyMs: number;
    totalFailovers: number;
  };
  activeTrafficPulse: {
    providerId?: ProviderId;
    keyId?: string;
    modelId?: string;
    timestamp: number;
  } | null;
}