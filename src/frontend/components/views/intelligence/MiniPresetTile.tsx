/**
 * ASCII Architecture Flowchart: MiniPresetTile
 *
 *   ┌─────────────────────────────────────┐
 *   │      Initialize MiniPresetTile      │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpecPreset } from '../../../../backend/intelligence/types.js';
import { SigilRune } from './SigilRune.js';
import { tensorToSpec } from '../../../../backend/intelligence/helpers.js';
import { Tooltip } from '../../common/Tooltip.js';
import { BaseButton } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface MiniPresetTileProps {
  preset: IntelligenceSpecPreset;
  isActive: boolean;
  onSelect: (preset: IntelligenceSpecPreset) => void;
  size?: 'sm' | 'md';
}

// ════ MINIPRESETTILE IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const MiniPresetTile: React.FC<MiniPresetTileProps> = ({
  preset,
  isActive,
  onSelect,
  size = 'md'
}) => {
  const spec = tensorToSpec(preset.tensor);
  const categoryScores = {
    reasoning: Math.round(((spec.reasoning || 5) + (spec.planning || 5) + (spec.toolUsage || 5) + (spec.outputComplexity || 5)) / 4),
    coding: Math.round(((spec.coding || 5) + (spec.structuredOutput || 5) + (spec.jsonStrictness || 5) + (spec.determinism || 5)) / 4),
    data: Math.round(((spec.extraction || 5) + (spec.classification || 5) + (spec.summarization || 5) + (spec.context || 5)) / 4),
    modality: Math.round(((spec.creativity || 5) + (spec.vision || 5) + (spec.multimodal || 5)) / 3)
  };

  const ringParams = [
    { name: 'Reasoning', value: categoryScores.reasoning, color: 'var(--skipo-accent, #d4af37)' },
    { name: 'Coding', value: categoryScores.coding, color: 'var(--skipo-success, #2a9d8f)' },
    { name: 'Data', value: categoryScores.data, color: 'var(--skipo-warning, #f59e0b)' },
    { name: 'Modality', value: categoryScores.modality, color: 'var(--skipo-accent-glow, #ec4899)' }
  ];

  const tileDim = size === 'sm' ? 'w-11 h-11' : 'w-13 h-13';

  return (
    <Tooltip text={`${preset.name}: ${preset.description}`}>
      <BaseButton
        onClick={() => onSelect(preset)}
        className={`relative ${tileDim} p-0.5 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer overflow-hidden ${
          isActive
            ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/20 scale-105 ring-1 ring-[var(--skipo-accent)] shadow-[var(--skipo-shadow)]'
            : 'border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]/60 hover:bg-[var(--skipo-surface-hover)]'
        }`}
      >
        <SigilRune
          sigilId={preset.sigilId}
          size={size === 'sm' ? 'xs' : 'sm'}
          rings={ringParams}
          categoryScores={categoryScores}
          isDiamondLayout={true}
          intensityMultiplier={isActive ? 1.4 : 0.9}
        />
        {isActive && (
          <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--skipo-accent)]" />
        )}
      </BaseButton>
    </Tooltip>
  );
};