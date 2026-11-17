import type { ProviderId } from './aiContracts.js';

export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  acquisitionUrl: string;
}

export const AI_PROVIDER_METADATA: ProviderMetadata[] = [
  { id: 'google', name: 'Google AI Studio', acquisitionUrl: 'https://aistudio.google.com/' },
  { id: 'groq', name: 'Groq', acquisitionUrl: 'https://console.groq.com/' },
  { id: 'cerebras', name: 'Cerebras', acquisitionUrl: 'https://cloud.cerebras.ai/' },
  { id: 'together', name: 'Together AI', acquisitionUrl: 'https://api.together.xyz/' },
  { id: 'nvidia', name: 'NVIDIA', acquisitionUrl: 'https://build.nvidia.com/' },
  { id: 'openrouter', name: 'OpenRouter', acquisitionUrl: 'https://openrouter.ai/keys' },
  { id: 'huggingface', name: 'Hugging Face', acquisitionUrl: 'https://huggingface.co/settings/tokens' },
  { id: 'anthropic', name: 'Anthropic', acquisitionUrl: 'https://console.anthropic.com/' },
  { id: 'openai', name: 'OpenAI', acquisitionUrl: 'https://platform.openai.com/api-keys' },
] as const;
