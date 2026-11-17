/**
 * ASCII Architecture Flowchart: intelligenceSpecConstants
 *
 *   ┌──────────────────────────────────────────┐
 *   │  Initialize intelligenceSpecConstants    │
 *   └──────────────────────────────────────────┘
 */

import { IntelligenceSpec } from '../../../../backend/intelligence/types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export type SpecCategory = 'REASONING' | 'CODING' | 'DATA' | 'MODALITY';

export interface CategoryConfig {
  id: SpecCategory;
  label: string;
  runeId: string;
  color: string;
  description: string;
  parameters: Array<{ key: keyof IntelligenceSpec; label: string; description: string }>;
}

// ════ CONSTANTS DECLARATIONS ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'REASONING',
    label: 'Reasoning & Planning',
    runeId: 'sigil-logic',
    color: 'var(--skipo-accent, #d4af37)',
    description: 'Autonomous cognition, multi-step logic & problem solving',
    parameters: [
      { key: 'reasoning', label: 'Reasoning', description: 'Complex logical derivation' },
      { key: 'planning', label: 'Planning', description: 'Decomposition of tasks' },
      { key: 'toolUsage', label: 'Tool Usage', description: 'MCP & external tools' },
      { key: 'outputComplexity', label: 'Complexity', description: 'Deep synthesized depth' }
    ]
  },
  {
    id: 'CODING',
    label: 'Code & Systems',
    runeId: 'sigil-code',
    color: 'var(--skipo-success, #2a9d8f)',
    description: 'Syntax exactness, AST generation & deterministic output',
    parameters: [
      { key: 'coding', label: 'Code Gen', description: 'Full program generation' },
      { key: 'structuredOutput', label: 'Structured', description: 'Schema conformity' },
      { key: 'jsonStrictness', label: 'JSON Strict', description: 'Strict JSON grammar' },
      { key: 'determinism', label: 'Determinism', description: 'Reproducible outputs' }
    ]
  },
  {
    id: 'DATA',
    label: 'Data & Context',
    runeId: 'sigil-data',
    color: 'var(--skipo-warning, #f59e0b)',
    description: 'Information extraction, classification & context windows',
    parameters: [
      { key: 'extraction', label: 'Extraction', description: 'Entity & fact retrieval' },
      { key: 'classification', label: 'Classify', description: 'Taxonomy tagging' },
      { key: 'summarization', label: 'Summary', description: 'Condensation of records' },
      { key: 'context', label: 'Context', description: 'Massive token context' }
    ]
  },
  {
    id: 'MODALITY',
    label: 'Modality & Vision',
    runeId: 'sigil-creative',
    color: 'var(--skipo-accent-glow, #ec4899)',
    description: 'Visual perception, multimodal processing & tone styling',
    parameters: [
      { key: 'creativity', label: 'Creative', description: 'Prose & stylistic tone' },
      { key: 'vision', label: 'Vision OCR', description: 'Image perception & OCR' },
      { key: 'multimodal', label: 'Multimodal', description: 'Audio/Video handling' }
    ]
  }
];

export const SIGIL_OPTIONS = [
  { id: 'sigil-logic', label: 'Logic Rune' },
  { id: 'sigil-code', label: 'Circuit Matrix' },
  { id: 'sigil-data', label: 'Vault Rune' },
  { id: 'sigil-creative', label: 'Solar Star' },
  { id: 'sigil-vision', label: 'Ocular Portal' },
  { id: 'sigil-agent', label: 'Gyroscope' },
  { id: 'sigil-local', label: 'Stone Cairn' },
  { id: 'sigil-omni', label: 'Omni Nexus' }
];