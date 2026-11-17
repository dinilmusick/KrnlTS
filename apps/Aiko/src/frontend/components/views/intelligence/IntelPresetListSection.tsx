/**
 * ASCII Architecture Flowchart: IntelPresetListSection
 *
 *   ┌────────────────────────────────────────┐
 *   │   Initialize IntelPresetListSection    │
 *   └────────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpecPreset } from '../../../../backend/intelligence/types.js';
import { BigPresetCard } from './IntelligencePresetCard.js';
import { Plus, Sparkles } from 'lucide-react';
import { BaseCard } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface IntelPresetListSectionProps {
  presets: IntelligenceSpecPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: IntelligenceSpecPreset) => void;
  onDuplicatePreset: (preset: IntelligenceSpecPreset) => void;
  onDeletePreset: (id: string) => void;
  onCreateNew: () => void;
}

// ════ INTELPRESETLISTSECTION IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const IntelPresetListSection: React.FC<IntelPresetListSectionProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onDuplicatePreset,
  onDeletePreset,
  onCreateNew
}) => {
  const { setInspectionText } = useBottomStrip();

  return (
    <div className="space-y-3 p-4 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--skipo-border-color)]/30 pb-2">
        <div className="flex items-center gap-2 font-black text-xs uppercase text-[var(--skipo-text)]">
          <Sparkles size={14} className="text-[var(--skipo-accent)]" />
          <span>INTELLIGENCE SPEC PRESET LIBRARY</span>
        </div>
        <span className="text-[10px] text-[var(--skipo-text-muted)] font-mono">
          {presets.length} Presets Available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {presets.map(preset => (
          <BigPresetCard
            key={preset.id}
            preset={preset}
            isActive={preset.id === activePresetId}
            onSelect={onSelectPreset}
            onDuplicate={onDuplicatePreset}
            onDelete={onDeletePreset}
          />
        ))}

        <BaseCard
          variant="subtle"
          onClick={onCreateNew}
          onMouseEnter={() => setInspectionText("CREATE NEW CUSTOM INTELLIGENCE SPEC PRESET")}
          onMouseLeave={() => setInspectionText(null)}
          className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-[var(--skipo-border-color)] hover:border-[var(--skipo-accent)] bg-[var(--skipo-matte-bg)] transition-all cursor-pointer aspect-square group shadow-[var(--skipo-shadow)]"
        >
          <div className="p-3 rounded-full bg-[var(--skipo-accent)]/15 text-[var(--skipo-accent)] group-hover:scale-110 transition-transform">
            <Plus size={22} />
          </div>
        </BaseCard>
      </div>
    </div>
  );
};