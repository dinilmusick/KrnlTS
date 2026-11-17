/**
 * ASCII Architecture Flowchart: IntelligenceSpecEditor
 *
 *   ┌─────────────────────────────────────┐
 *   │  Initialize IntelligenceSpecEditor  │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │              CATEGORIES             │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │        IntelligenceSpecEditor       │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpec, IntelligenceDimension } from '../../../../backend/intelligence/types.js';
import { Cpu, Code2, Layers, Sparkles } from 'lucide-react';
import { SpecCategoryCard } from './SpecCategoryCard.js';
import { SpecWeightToggles } from './SpecWeightToggles.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface IntelligenceSpecEditorProps {
  spec: IntelligenceSpec;
  onChange: (updated: IntelligenceSpec) => void;
  prioritiseReasoning: boolean;
  onToggleReasoning: (v: boolean) => void;
  prioritiseDeterminism: boolean;
  onToggleDeterminism: (v: boolean) => void;
  preferLocal: boolean;
  onTogglePreferLocal: (v: boolean) => void;
  avoidPaidProviders: boolean;
  onToggleAvoidPaid: (v: boolean) => void;
}

const CATEGORIES: Array<{ code: string; label: string; icon: any; dims: Array<{ key: IntelligenceDimension; label: string }> }> = [
  {
    code: 'REASONING',
    label: 'Reasoning & Logic',
    icon: Cpu,
    dims: [
      { key: 'reasoning', label: 'Reasoning' },
      { key: 'planning', label: 'Planning' },
      { key: 'toolUsage', label: 'Tooling' },
      { key: 'outputComplexity', label: 'Complexity' }
    ]
  },
  {
    code: 'CODING',
    label: 'Code & Structure',
    icon: Code2,
    dims: [
      { key: 'coding', label: 'Coding' },
      { key: 'structuredOutput', label: 'Structured' },
      { key: 'jsonStrictness', label: 'JSON Strict' },
      { key: 'determinism', label: 'Determinism' }
    ]
  },
  {
    code: 'DATA',
    label: 'Data & Context',
    icon: Layers,
    dims: [
      { key: 'extraction', label: 'Extraction' },
      { key: 'classification', label: 'Classify' },
      { key: 'summarization', label: 'Summary' },
      { key: 'context', label: 'Context' }
    ]
  },
  {
    code: 'MODALITY',
    label: 'Vision & Creative',
    icon: Sparkles,
    dims: [
      { key: 'creativity', label: 'Creative' },
      { key: 'vision', label: 'Vision' },
      { key: 'multimodal', label: 'Multimodal' }
    ]
  }
];

// ════ INTELLIGENCESPECEDITOR IMPLEMENTATION ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const IntelligenceSpecEditor: React.FC<IntelligenceSpecEditorProps> = ({
  spec,
  onChange,
  prioritiseReasoning,
  onToggleReasoning,
  prioritiseDeterminism,
  onToggleDeterminism,
  preferLocal,
  onTogglePreferLocal,
  avoidPaidProviders,
  onToggleAvoidPaid
}) => {
  const updateDimension = (dim: IntelligenceDimension, val: number) => {
    onChange({ ...spec, [dim]: val });
  };

  return (
    <div className="space-y-2.5 font-mono text-xs">
      {/* 15-Dimension Parameter Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {CATEGORIES.map(cat => (
          <SpecCategoryCard
            key={cat.code}
            cat={cat}
            spec={spec}
            updateDimension={updateDimension}
          />
        ))}
      </div>

      {/* Stage Weights & Hard Constraint Toggles */}
      <SpecWeightToggles
        prioritiseReasoning={prioritiseReasoning}
        onToggleReasoning={onToggleReasoning}
        prioritiseDeterminism={prioritiseDeterminism}
        onToggleDeterminism={onToggleDeterminism}
        preferLocal={preferLocal}
        onTogglePreferLocal={onTogglePreferLocal}
        avoidPaidProviders={avoidPaidProviders}
        onToggleAvoidPaid={onToggleAvoidPaid}
      />
    </div>
  );
};