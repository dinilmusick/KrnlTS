/**
 * ASCII Architecture Flowchart: IntelligencePresetCard
 *
 *   ┌─────────────────────────────────────┐
 *   │  Initialize IntelligencePresetCard  │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │            BigPresetCard            │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpecPreset } from '../../../../backend/intelligence/types.js';
import { SigilRune } from './SigilRune.js';
import { tensorToSpec } from '../../../../backend/intelligence/helpers.js';
import { Trash2, Copy, Check } from 'lucide-react';
import { BaseButton, BaseCard } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

export { MiniPresetTile } from './MiniPresetTile.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface BigPresetCardProps {
  preset: IntelligenceSpecPreset;
  isActive: boolean;
  onSelect: (preset: IntelligenceSpecPreset) => void;
  onDuplicate?: (preset: IntelligenceSpecPreset) => void;
  onDelete?: (id: string) => void;
}

// ════ INTELLIGENCEPRESETCARD IMPLEMENTATION ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const BigPresetCard: React.FC<BigPresetCardProps> = ({
  preset,
  isActive,
  onSelect,
  onDuplicate,
  onDelete
}) => {
  const { setInspectionText } = useBottomStrip();
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

  return (
    <BaseCard
      variant={isActive ? 'surface' : 'subtle'}
      onMouseEnter={() => setInspectionText(`PRESET: ${preset.name.toUpperCase()} - ${preset.description || 'Custom Intelligence Spec'}`)}
      onMouseLeave={() => setInspectionText(null)}
      className={`group relative flex flex-col justify-between p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden aspect-square ${
        isActive
          ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/15 text-[var(--skipo-text)] shadow-[var(--skipo-shadow-hover)]'
          : 'border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] text-[var(--skipo-text)] hover:border-[var(--skipo-accent)]/60 shadow-[var(--skipo-shadow)]'
      }`}
    >
      {/* Active Indicator Pin */}
      {isActive && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg)] text-[9px] font-black border border-[var(--skipo-accent)] shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
          <Check size={10} /> ACTIVE
        </div>
      )}

      {/* Top Header Label */}
      <div className="flex items-center justify-between z-10">
        <span className="text-[11px] font-black tracking-wide truncate max-w-[130px] text-[var(--skipo-text)]">
          {preset.name}
        </span>
      </div>

      {/* 4-Sigil Diamond Layout Icon for Saved Intelligence Spec */}
      <BaseButton
        variant="ghost"
        onClick={() => onSelect(preset)}
        onMouseEnter={() => setInspectionText(`SELECT PRESET: ${preset.name.toUpperCase()}`)}
        onMouseLeave={() => setInspectionText(null)}
        onFocus={() => setInspectionText(`SELECT PRESET: ${preset.name.toUpperCase()}`)}
        onBlur={() => setInspectionText(null)}
        aria-label={`Select ${preset.name}`}
        className="flex-1 flex items-center justify-center my-auto transition-transform duration-200 group-hover:scale-105 py-1 text-[var(--skipo-text)]"
      >
        <SigilRune
          sigilId={preset.sigilId}
          size="md"
          rings={ringParams}
          categoryScores={categoryScores}
          isDiamondLayout={true}
          intensityMultiplier={isActive ? 1.3 : 1.0}
        />
      </BaseButton>

      {/* Footer Info & Actions */}
      <div className="mt-1 pt-1.5 border-t border-[var(--skipo-border-color)]/30 flex items-center justify-between text-[9px] font-mono text-[var(--skipo-text-muted)] z-10">
        <span className="truncate max-w-[110px]">
          {preset.description || 'Custom Intelligence Spec'}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {onDuplicate && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(preset);
              }}
              onMouseEnter={() => setInspectionText(`DUPLICATE PRESET: ${preset.name.toUpperCase()}`)}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText(`DUPLICATE PRESET: ${preset.name.toUpperCase()}`)}
              onBlur={() => setInspectionText(null)}
              aria-label="Duplicate Preset"
              icon={<Copy size={11} />}
            />
          )}

          {!preset.isDefault && onDelete && (
            <BaseButton
              size="sm"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset.id);
              }}
              onMouseEnter={() => setInspectionText(`DELETE PRESET: ${preset.name.toUpperCase()}`)}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText(`DELETE PRESET: ${preset.name.toUpperCase()}`)}
              onBlur={() => setInspectionText(null)}
              aria-label="Delete Custom Preset"
              icon={<Trash2 size={11} />}
            />
          )}
        </div>
      </div>
    </BaseCard>
  );
};

export const IntelligencePresetCard = BigPresetCard;