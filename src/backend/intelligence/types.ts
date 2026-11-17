/**
 * ASCII Architecture Flowchart: types
 *
 *   ┌──────────────────────────────────┐
 *   │         Initialize types         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     INTELLIGENCE_DIMENSIONS      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { ProviderId } from '../types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

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


// ════ TYPES IMPLEMENTATION ════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const INTELLIGENCE_DIMENSIONS: IntelligenceDimension[] = [
  'reasoning',
  'planning',
  'toolUsage',
  'outputComplexity',
  'coding',
  'structuredOutput',
  'jsonStrictness',
  'determinism',
  'extraction',
  'classification',
  'summarization',
  'context',
  'creativity',
  'vision',
  'multimodal'
];

export interface IntelligenceSpecPreset {
  id: string;
  name: string;
  description: string;
  sigilId: string;
  tensor: number[]; // 15-dimensional vector corresponding to INTELLIGENCE_DIMENSIONS
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

export interface EndpointSpec {
  intelligenceSpec?: IntelligenceSpec;
  preferencesSpec?: PreferencesSpec;
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  avoidPaidProviders?: boolean;
  blacklistedProviders?: ProviderId[];
  enabledProviders?: ProviderId[];
  requiredContext?: number;
}

export interface ModelRuntimeStats {
  downrankCount: number;
  lastFailureAt?: string;
  totalFailures: number;
  totalSuccesses: number;
  consecutiveRouteFailures: number;
  lastDowngradedAt?: string;
}

export interface CandidateStageBreakdown {
  baseScore: number;
  distance: number;
  downrankPenalty: number;
  costPenalty: number;
  finalScore: number;
  isBlacklisted: boolean;
  dimensionDiffs: Partial<Record<IntelligenceDimension, { target: number; model: number; diff: number; penaltyMultiplier: number }>>;
}

export interface RankedCandidate {
  modelId: string;
  modelName: string;
  providerId: ProviderId;
  isFree: boolean;
  finalScore: number;
  breakdown: CandidateStageBreakdown;
}

export interface RankingResult {
  winner: RankedCandidate | null;
  candidates: RankedCandidate[];
  endpointSpec: EndpointSpec;
}

export interface ModelCheckResult {
  modelId: string;
  name?: string;
  modelName?: string;
  providerId?: ProviderId;
  status: 'working' | 'failed' | 'non-working';
  latencyMs: number;
  error?: string;
  checkedAt?: string;
}