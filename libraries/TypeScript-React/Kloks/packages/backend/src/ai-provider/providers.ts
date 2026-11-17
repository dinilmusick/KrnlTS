/**
 * @file providers.ts
 * @description Master metadata, color mappings, and lookup for supported AI Providers.
 */

import type { ProviderId, ProviderMeta } from './types.js';

export const PROVIDERS_META: Record<string, ProviderMeta> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    modelsEndpoint: '/v1beta/models',
    defaultHeaderKey: 'x-goog-api-key',
    supportsCreditsCheck: true,
    docUrl: 'https://ai.google.dev',
    description: 'Gemini 2.5/3.0 Flash, Gemini Pro, Multimodal AI',
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 1048576,
    },
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras Systems',
    baseUrl: 'https://api.cerebras.ai',
    modelsEndpoint: '/v1/models',
    defaultHeaderKey: 'Authorization',
    supportsCreditsCheck: true,
    docUrl: 'https://cerebras.ai',
    description: 'Wafer-scale ultra-fast Llama inference engine',
    capabilities: {
      supportsTools: true,
      supportsVision: false,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072,
    },
  },
  groq: {
    id: 'groq',
    name: 'Groq LPU',
    baseUrl: 'https://api.groq.com/openai',
    modelsEndpoint: '/v1/models',
    defaultHeaderKey: 'Authorization',
    supportsCreditsCheck: true,
    docUrl: 'https://groq.com',
    description: 'Ultra-low latency LPU hardware inference',
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072,
    },
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face Hub',
    baseUrl: 'https://api-inference.huggingface.co',
    modelsEndpoint: '/models',
    defaultHeaderKey: 'Authorization',
    supportsCreditsCheck: false,
    docUrl: 'https://huggingface.co',
    description: 'Open source models & Inference Endpoints',
    capabilities: {
      supportsTools: false,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: false,
      supportsCreditsCheck: false,
      maxContextWindow: 32768,
    },
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    modelsEndpoint: '/v1/models',
    defaultHeaderKey: 'Authorization',
    supportsCreditsCheck: true,
    docUrl: 'https://openrouter.ai',
    description: 'Unified gateway to 100+ multi-vendor models',
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 2000000,
    },
  },
  together: {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz',
    modelsEndpoint: '/v1/models',
    defaultHeaderKey: 'Authorization',
    supportsCreditsCheck: true,
    docUrl: 'https://together.ai',
    description: 'High-throughput open source models',
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072,
    },
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com',
    modelsEndpoint: '/v1/models',
    defaultHeaderKey: 'Authorization',
    supportsCreditsCheck: true,
    docUrl: 'https://build.nvidia.com',
    description: 'NVIDIA NIM Enterprise & Open Models',
    capabilities: {
      supportsTools: true,
      supportsVision: true,
      supportsStreaming: true,
      supportsJsonOutput: true,
      supportsCreditsCheck: true,
      maxContextWindow: 131072,
    },
  },
};

export const PROVIDER_COLORS: Record<string, string> = {
  google: '#4285F4',
  groq: '#F55036',
  cerebras: 'var(--skipo-success, #2a9d8f)',
  openrouter: 'var(--skipo-accent, #d4af37)',
  together: '#8B5CF6',
  nvidia: '#76B900',
  huggingface: '#FFD21E',
  anthropic: '#D97706',
  openai: '#10A37F',
};

export function getProviderMeta(providerId: ProviderId): ProviderMeta | undefined {
  return PROVIDERS_META[providerId];
}

export function listProviders(): ProviderMeta[] {
  return Object.values(PROVIDERS_META);
}
