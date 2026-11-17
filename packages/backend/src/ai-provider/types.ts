/**
 * @file types.ts
 * @description Canonical AI Provider domain types for @kloks/backend
 */

export type ProviderId =
  | 'google'
  | 'groq'
  | 'cerebras'
  | 'openrouter'
  | 'together'
  | 'nvidia'
  | 'huggingface'
  | 'anthropic'
  | 'openai'
  | string;

export interface ProviderCapabilities {
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsJsonOutput: boolean;
  supportsCreditsCheck: boolean;
  maxContextWindow?: number;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  baseUrl: string;
  modelsEndpoint: string;
  defaultHeaderKey: string;
  supportsCreditsCheck: boolean;
  docUrl: string;
  description: string;
  capabilities?: Partial<ProviderCapabilities>;
}

export interface AIProviderStatus {
  id: ProviderId;
  isOnline: boolean;
  latencyMs: number;
  lastCheckedAt: string;
  error?: string;
}
