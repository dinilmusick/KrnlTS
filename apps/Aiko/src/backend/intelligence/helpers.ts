/**
 * ASCII Architecture Flowchart: helpers
 *
 *   ┌──────────────────────────────────┐
 *   │        Initialize helpers        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │   ALL_INTELLIGENCE_DIMENSIONS    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │   createDefaultPreferencesSpec   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  createDefaultIntelligenceSpec   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { IntelligenceSpec, EndpointSpec, IntelligenceDimension, PreferencesSpec } from '../types.js';

// ════ HELPERS IMPLEMENTATION ══════════════════════════════════════════════════════

export const ALL_INTELLIGENCE_DIMENSIONS: IntelligenceDimension[] = [
  'reasoning', 'planning', 'toolUsage', 'structuredOutput', 'jsonStrictness',
  'coding', 'extraction', 'classification', 'summarization', 'creativity',
  'determinism', 'context', 'vision', 'multimodal', 'outputComplexity'
];

export function createDefaultPreferencesSpec(overrides?: Partial<PreferencesSpec>): PreferencesSpec {
  return {
    avoidPaid: false,
    prioritiseReasoning: false,
    prioritiseDeterminism: false,
    enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'],
    ...overrides
  };
}

export function createDefaultIntelligenceSpec(overrides?: Partial<IntelligenceSpec>): IntelligenceSpec {
  return {
    reasoning: 5, planning: 5, toolUsage: 5, structuredOutput: 5, jsonStrictness: 5,
    coding: 5, extraction: 5, classification: 5, summarization: 5, creativity: 5,
    determinism: 5, context: 5, vision: 0, multimodal: 0, outputComplexity: 5,
    ...overrides
  };
}

export function expandSimplifiedProfile(profile: any): EndpointSpec {
  if (profile && profile.intelligenceSpec) {
    return {
      intelligenceSpec: { ...createDefaultIntelligenceSpec(), ...profile.intelligenceSpec },
      prioritiseReasoning: Boolean(profile.prioritiseReasoning),
      prioritiseDeterminism: Boolean(profile.prioritiseDeterminism),
      avoidPaidProviders: Boolean(profile.avoidPaidProviders),
      blacklistedProviders: Array.isArray(profile.blacklistedProviders) ? profile.blacklistedProviders : [],
      requiredContext: profile.requiredContext ? Number(profile.requiredContext) : undefined
    };
  }

  const baseIntel = profile?.intelligence ?? 5;
  const baseTool = profile?.toolUsage ?? 5;
  const speed = profile?.speed ?? 5;
  const costSens = profile?.costSensitivity ?? 5;

  return {
    intelligenceSpec: createDefaultIntelligenceSpec({
      reasoning: baseIntel,
      planning: Math.min(10, baseIntel),
      toolUsage: baseTool,
      structuredOutput: Math.min(10, baseTool),
      jsonStrictness: Math.min(10, baseTool),
      coding: baseIntel,
      extraction: Math.min(10, baseIntel),
      classification: Math.min(10, baseIntel),
      summarization: Math.min(10, baseIntel),
      creativity: Math.max(1, 10 - speed / 2),
      determinism: baseTool,
      context: profile?.requiredContext ? Math.min(10, Math.ceil(profile.requiredContext / 10000)) : 5,
      vision: 0,
      multimodal: 0,
      outputComplexity: baseIntel
    }),
    prioritiseReasoning: baseIntel >= 8,
    prioritiseDeterminism: baseTool >= 8,
    avoidPaidProviders: costSens >= 7,
    blacklistedProviders: Array.isArray(profile?.blacklistedProviders) ? profile.blacklistedProviders : [],
    requiredContext: profile?.requiredContext ? Number(profile.requiredContext) : undefined
  };
}

export function heuristicallyScoreModel(id: string, name: string, contextWindow = 8192): IntelligenceSpec {
  const lower = (id + ' ' + name).toLowerCase();
  let reasoning = 5, planning = 5, toolUsage = 5, structuredOutput = 5;
  let jsonStrictness = 5, coding = 5, extraction = 5, classification = 5;
  let summarization = 5, creativity = 5, determinism = 5, vision = 0, multimodal = 0, outputComplexity = 5;

  if (lower.includes('r1') || lower.includes('o1') || lower.includes('o3') || lower.includes('pro') || lower.includes('reasoning')) {
    reasoning = 10; planning = 9; coding = 9.5; structuredOutput = 9; jsonStrictness = 9; outputComplexity = 9;
  } else if (lower.includes('70b') || lower.includes('opus') || lower.includes('sonnet') || lower.includes('3.3')) {
    reasoning = 9; planning = 8.5; coding = 9; toolUsage = 9; structuredOutput = 8.5; jsonStrictness = 8.5;
  } else if (lower.includes('8b') || lower.includes('flash') || lower.includes('haiku') || lower.includes('mini')) {
    reasoning = 6.5; planning = 6; coding = 6.5; toolUsage = 7.5; structuredOutput = 7; jsonStrictness = 7;
  }

  if (lower.includes('gemini') || lower.includes('vision') || lower.includes('multimodal') || lower.includes('4o')) {
    vision = 8.5; multimodal = 8.5;
  }

  const contextRating = Math.min(10, Math.max(1, Math.round(contextWindow / 10000)));

  return {
    reasoning, planning, toolUsage, structuredOutput, jsonStrictness, coding,
    extraction, classification, summarization, creativity, determinism,
    context: contextRating, vision, multimodal, outputComplexity
  };
}

export function specToTensor(spec: IntelligenceSpec): number[] {
  return ALL_INTELLIGENCE_DIMENSIONS.map(dim => Number(spec[dim] ?? 5));
}

export function tensorToSpec(tensor: number[]): IntelligenceSpec {
  const spec: Partial<IntelligenceSpec> = {};
  ALL_INTELLIGENCE_DIMENSIONS.forEach((dim, idx) => {
    spec[dim] = typeof tensor[idx] === 'number' ? tensor[idx] : 5;
  });
  return spec as IntelligenceSpec;
}