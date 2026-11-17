import type { IntelligenceSpec, PreferencesSpec } from './intelligenceContracts.js';

export function createDefaultPreferencesSpec(overrides?: Partial<PreferencesSpec>): PreferencesSpec {
  return {
    avoidPaid: false,
    prioritiseReasoning: false,
    prioritiseDeterminism: false,
    enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'],
    ...overrides,
  };
}

export function createDefaultIntelligenceSpec(overrides?: Partial<IntelligenceSpec>): IntelligenceSpec {
  return {
    reasoning: 5, planning: 5, toolUsage: 5, structuredOutput: 5, jsonStrictness: 5,
    coding: 5, extraction: 5, classification: 5, summarization: 5, creativity: 5,
    determinism: 5, context: 5, vision: 0, multimodal: 0, outputComplexity: 5,
    ...overrides,
  };
}
