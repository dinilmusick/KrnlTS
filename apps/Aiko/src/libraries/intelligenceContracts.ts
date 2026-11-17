import type { ProviderId } from './aiContracts.js';

export interface IntelligenceSpec {
  reasoning?: number;
  planning?: number;
  toolUsage?: number;
  structuredOutput?: number;
  jsonStrictness?: number;
  coding?: number;
  extraction?: number;
  classification?: number;
  summarization?: number;
  creativity?: number;
  determinism?: number;
  context?: number;
  vision?: number;
  multimodal?: number;
  outputComplexity?: number;
  [key: string]: any;
}

export type IntelligenceDimension = keyof IntelligenceSpec;

export interface IntelligenceSpecPreset {
  id: string;
  name: string;
  description: string;
  sigilId: string;
  tensor: number[];
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  avoidPaidProviders?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PreferencesSpec {
  avoidPaid?: boolean;
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  enabledProviders?: ProviderId[];
  requiredContext?: number;
}

export interface PreferencesSpecPreset {
  id: string;
  name: string;
  description: string;
  sigilId: string;
  spec: PreferencesSpec;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RankedCandidate {
  modelId: string;
  modelName: string;
  providerId: ProviderId;
  isFree: boolean;
  finalScore: number;
  breakdown: Record<string, any>;
}
