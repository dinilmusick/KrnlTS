/**
 * @file types.ts
 * @description Canonical AI Inference domain contracts and types
 */

import type { ProviderId } from '../ai-provider/types.js';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface InferenceOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  messages?: Array<{ role: string; content: string }>;
  signal?: AbortSignal;
}

export interface InferenceResult {
  text: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  durationMs?: number;
}

export type ErrorClassification =
  | 'UNKNOWN'
  | 'MODEL_UNAVAILABLE'
  | 'AUTH_FAILURE'
  | 'RATE_LIMITED'
  | 'PAYMENT_REQUIRED'
  | 'CONTEXT_OVERFLOW'
  | 'PARAMETER_MISMATCH'
  | 'SERVER_ERROR';

export interface ParsedProviderError {
  classification: ErrorClassification;
  providerId: ProviderId;
  modelId: string;
  statusCode?: number;
  message: string;
  suggestion: string;
  isModelSpecific: boolean;
  isKeySpecific: boolean;
}
