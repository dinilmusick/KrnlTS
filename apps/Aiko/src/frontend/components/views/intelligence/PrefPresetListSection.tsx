/**
 * ASCII Architecture Flowchart: PrefPresetListSection
 *
 *   ┌────────────────────────────────────────┐
 *   │    Initialize PrefPresetListSection    │
 *   └────────────────────────────────────────┘
 */

import React from 'react';
import { PreferencesSpecPreset } from '../../../../backend/intelligence/types.js';
import { BigPreferencesPresetCard } from './PreferencesPresetCard.js';
import { Plus, CheckSquare } from 'lucide-react';
import { BaseCard } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface PrefPresetListSectionProps {
  presets: PreferencesSpecPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: PreferencesSpecPreset) => void;
  onDuplicatePreset: (preset: PreferencesSpecPreset) => void;
  onDeletePreset: (id: string) => void;
  onCreateNew: () => void;
}

// ════ PREFPRESETLISTSECTION IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PrefPresetListSection: React.FC<PrefPresetListSectionProps> = ({
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
          <CheckSquare size={14} className="text-[var(--skipo-success)]" />
          <span>PREFERENCES SPEC PRESET LIBRARY</span>
        </div>
        <span className="text-[10px] text-[var(--skipo-text-muted)] font-mono">
          {presets.length} Presets Available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {presets.map(preset => (
          <BigPreferencesPresetCard
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
          onMouseEnter={() => setInspectionText("CREATE NEW CUSTOM PREFERENCES SPEC PRESET")}
          onMouseLeave={() => setInspectionText(null)}
          className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-[var(--skipo-border-color)] hover:border-[var(--skipo-success)] bg-[var(--skipo-matte-bg)] transition-all cursor-pointer aspect-square group shadow-[var(--skipo-shadow)]"
        >
          <div className="p-3 rounded-full bg-[var(--skipo-success)]/15 text-[var(--skipo-success)] group-hover:scale-110 transition-transform">
            <Plus size={22} />
          </div>
        </BaseCard>
      </div>
    </div>
  );
};