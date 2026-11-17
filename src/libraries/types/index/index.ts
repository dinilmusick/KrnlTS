/**
 * ASCII Architecture Flowchart: index
 *
 *   ┌──────────────────────────────────────┐
 *   │           Initialize index           │
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

export * from './types';

import { 
  ProviderId, 
  ApiKeyEntry, 
  KeyModelUsageStats, 
  RotationStrategy, 
  ModelCatalogEntry, 
  IntelligenceSpecPreset, 
  RequestLogEntry 
} from '../../../backend/types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface AppState {
  theme: 'light' | 'dark';
  activeTab: string;
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