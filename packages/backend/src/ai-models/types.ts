/**
 * @file types.ts
 * @description Canonical Model Catalog and Discovery types for @kloks/backend
 */

import type { ProviderId } from '../ai-provider/types.js';

export interface ModelCatalogEntry {
  id: string;
  name: string;
  providerId: ProviderId;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
  supportsJson?: boolean;
  isFree?: boolean;
  latencyRatingMs?: number;
  qualityRating?: number;
  maxOutputTokens?: number;
  status?: 'active' | 'deprecated' | 'offline' | 'online' | 'currently_unavailable';
  runtimeStats?: Record<string, any>;
  description?: string;
}

export interface ModelHealthStatus {
  modelId: string;
  providerId: ProviderId;
  isHealthy: boolean;
  latencyMs: number;
  consecutiveFailures: number;
  lastCheckedAt: string;
  lastError?: string;
}
