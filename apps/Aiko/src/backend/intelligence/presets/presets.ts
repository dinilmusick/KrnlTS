/**
 * ASCII Architecture Flowchart: presets
 *
 *   ┌──────────────────────────────────┐
 *   │        Initialize presets        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │   DEFAULT_INTELLIGENCE_PRESETS   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             calling              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │   DEFAULT_PREFERENCES_PRESETS    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { IntelligenceSpecPreset, PreferencesSpecPreset } from '../types.js';
import { specToTensor, createDefaultIntelligenceSpec } from '../helpers.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════


export const DEFAULT_INTELLIGENCE_PRESETS: IntelligenceSpecPreset[] = [
  {
    id: 'preset-logic', name: 'The Grand Logician',
    description: 'Deep deductive synthesis, multi-step tree-of-thought planning, and formal proof decomposition.',
    sigilId: 'sigil-logic',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 10, planning: 9.5, toolUsage: 8, structuredOutput: 8.5, jsonStrictness: 8, coding: 9, extraction: 7.5, classification: 8, summarization: 8, creativity: 6, determinism: 7.5, context: 8.5, vision: 4, multimodal: 4, outputComplexity: 9.5 })),
    prioritiseReasoning: true, prioritiseDeterminism: false, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-code', name: 'The Code Architect',
    description: 'Strict algorithmic structure, bug-free AST compilation, and zero-hallucination JSON contracts.',
    sigilId: 'sigil-code',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 9, planning: 8.5, toolUsage: 8.5, structuredOutput: 10, jsonStrictness: 10, coding: 10, extraction: 7, classification: 7, summarization: 6.5, creativity: 4, determinism: 9.5, context: 8, vision: 3, multimodal: 3, outputComplexity: 8.5 })),
    prioritiseReasoning: false, prioritiseDeterminism: true, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-data', name: 'The Data Scribe',
    description: 'Massive context ingestion, entity disambiguation, and lossless document synthesis.',
    sigilId: 'sigil-data',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 7.5, planning: 7, toolUsage: 7.5, structuredOutput: 8.5, jsonStrictness: 8.5, coding: 6.5, extraction: 10, classification: 9, summarization: 9.5, creativity: 4.5, determinism: 8.5, context: 10, vision: 5, multimodal: 5, outputComplexity: 7 })),
    prioritiseReasoning: false, prioritiseDeterminism: false, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-creative', name: 'The Oracle Muse',
    description: 'Unbounded conceptual exploration, metaphor generation, and cross-domain serendipity.',
    sigilId: 'sigil-creative',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 7, planning: 6, toolUsage: 5, structuredOutput: 5, jsonStrictness: 4, coding: 5, extraction: 6, classification: 6, summarization: 8, creativity: 10, determinism: 3, context: 8, vision: 8, multimodal: 8, outputComplexity: 8 })),
    prioritiseReasoning: false, prioritiseDeterminism: false, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-vision', name: 'The Multimodal Scout',
    description: 'Direct spatial diagram interpretation, OCR extraction, and visual reasoning.',
    sigilId: 'sigil-vision',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 8, planning: 7.5, toolUsage: 8, structuredOutput: 8, jsonStrictness: 7.5, coding: 7, extraction: 8.5, classification: 8.5, summarization: 8, creativity: 7, determinism: 7, context: 8.5, vision: 10, multimodal: 10, outputComplexity: 7.5 })),
    prioritiseReasoning: false, prioritiseDeterminism: false, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-agent', name: 'The Precision Automaton',
    description: 'Zero-drift function calling, MCP orchestration, and autonomous execution loops.',
    sigilId: 'sigil-agent',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 8.5, planning: 9, toolUsage: 10, structuredOutput: 9.5, jsonStrictness: 9.5, coding: 8.5, extraction: 8, classification: 8, summarization: 7, creativity: 4, determinism: 10, context: 8.5, vision: 5, multimodal: 5, outputComplexity: 8 })),
    prioritiseReasoning: false, prioritiseDeterminism: true, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-speed', name: 'The Hyper-Speed Sprinter',
    description: 'Ultra-low latency responses optimized for ultra-fast cloud inference engines.',
    sigilId: 'sigil-omni',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 6.5, planning: 6, toolUsage: 6.5, structuredOutput: 7, jsonStrictness: 7, coding: 6.5, extraction: 6.5, classification: 7, summarization: 7, creativity: 6, determinism: 7, context: 6, vision: 4, multimodal: 4, outputComplexity: 6 })),
    prioritiseReasoning: false, prioritiseDeterminism: false, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'preset-omni', name: 'The Omni Sentinel',
    description: 'Balanced multi-purpose tensor calibration optimized for speed, cost, and versatility.',
    sigilId: 'sigil-omni',
    tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 7.5, planning: 7.5, toolUsage: 7.5, structuredOutput: 7.5, jsonStrictness: 7.5, coding: 7.5, extraction: 7.5, classification: 7.5, summarization: 7.5, creativity: 7.5, determinism: 7.5, context: 7.5, vision: 6, multimodal: 6, outputComplexity: 7.5 })),
    prioritiseReasoning: false, prioritiseDeterminism: false, avoidPaidProviders: false, isDefault: true, createdAt: new Date().toISOString()
  }
];

export const DEFAULT_PREFERENCES_PRESETS: PreferencesSpecPreset[] = [
  {
    id: 'pref-unrestricted', name: 'Unrestricted Nexus',
    description: 'All 7 cloud providers enabled, balanced routing across endpoints without restrictions.',
    sigilId: 'sigil-omni',
    spec: { avoidPaid: false, prioritiseReasoning: false, prioritiseDeterminism: false, enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'] },
    isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'pref-speed', name: 'Hyper-Speed Cluster',
    description: 'Optimized high-throughput ultra-low latency routing across fastest cloud inference providers.',
    sigilId: 'sigil-omni',
    spec: { avoidPaid: false, prioritiseReasoning: false, prioritiseDeterminism: false, enabledProviders: ['groq', 'cerebras', 'nvidia', 'google'] },
    isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'pref-cloud-titan', name: 'Cloud Titan Cluster',
    description: 'High-throughput multi-provider cloud routing across all enterprise grade endpoints.',
    sigilId: 'sigil-data',
    spec: { avoidPaid: false, prioritiseReasoning: false, prioritiseDeterminism: false, enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'] },
    isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'pref-budget', name: 'Budget Guardian',
    description: 'Zero-cost priority routing. Bypasses paid endpoints and relies exclusively on free tier APIs.',
    sigilId: 'sigil-code',
    spec: { avoidPaid: true, prioritiseReasoning: false, prioritiseDeterminism: false, enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'nvidia'] },
    isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'pref-deterministic', name: 'Strict Deterministic',
    description: 'Prioritises zero-drift output formatting & strict JSON schema validation across all routes.',
    sigilId: 'sigil-agent',
    spec: { avoidPaid: false, prioritiseReasoning: false, prioritiseDeterminism: true, enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'] },
    isDefault: true, createdAt: new Date().toISOString()
  },
  {
    id: 'pref-reasoning', name: 'Reasoning Vanguard',
    description: 'Boosts reasoning & multi-step planning weights across enabled high-performance routes.',
    sigilId: 'sigil-logic',
    spec: { avoidPaid: false, prioritiseReasoning: true, prioritiseDeterminism: false, enabledProviders: ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'] },
    isDefault: true, createdAt: new Date().toISOString()
  }
];

export default DEFAULT_INTELLIGENCE_PRESETS;