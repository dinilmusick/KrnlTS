/**
 * @file types.ts
 * @description Canonical AI Key Management contracts and types for @kloks/backend
 */

import type { ProviderId } from '../ai-provider/types.js';

export type RotationStrategy =
  | 'lowest-latency'
  | 'round-robin'
  | 'weighted-random'
  | 'failover-priority';

export interface ApiKeyEntry {
  id: string;
  providerId: ProviderId;
  label: string;
  emailGroup?: string;
  key: string;
  keyValue?: string;
  status: 'active' | 'valid' | 'invalid' | 'rate-limited' | 'checking';
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
  lastUsedAt?: string | null;
  validationError?: string | null;
  failedModels?: string[];
}

export interface KeyValidationResult {
  valid: boolean;
  status: 'valid' | 'invalid' | 'rate-limited';
  error?: string;
  latencyMs: number;
}

export interface KeyModelUsageStats {
  keyId: string;
  modelId: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastUsedAt?: string;
  avgLatencyMs?: number;
}
