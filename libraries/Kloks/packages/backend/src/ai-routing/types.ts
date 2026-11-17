/**
 * @file types.ts
 * @description Canonical AI Routing and Failover types for @kloks/backend
 */

import type { ProviderId } from '../ai-provider/types.js';

export interface RouteCandidate {
  providerId: ProviderId;
  modelId: string;
  weight?: number;
  priority?: number;
}

export type AIRoutingStrategy =
  | 'priority-order'
  | 'lowest-latency'
  | 'weighted-random'
  | 'round-robin';


export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  retryableStatuses?: number[];
}

export interface RouteExecutionResult<T = unknown> {
  success: boolean;
  selectedCandidate?: RouteCandidate;
  attempts: number;
  result?: T;
  error?: string;
  totalDurationMs: number;
  failoverHistory: Array<{
    candidate: RouteCandidate;
    error: string;
    durationMs: number;
  }>;
}
