/**
 * ASCII Architecture Flowchart: MiniPreferencesPresetTile
 *
 *   ┌────────────────────────────────────────────┐
 *   │    Initialize MiniPreferencesPresetTile    │
 *   └────────────────────────────────────────────┘
 */

import React from 'react';
import { PreferencesSpecPreset } from '../../../../backend/intelligence/types.js';
import { SigilRune } from './SigilRune.js';
import { Tooltip } from '../../common/Tooltip.js';
import { getPreferencesRingParams, getDerivedPreferencesSigilId } from './PreferencesPresetCard.js';
import { BaseButton } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface MiniPreferencesPresetTileProps {
  preset: PreferencesSpecPreset;
  isActive: boolean;
  onSelect: (preset: PreferencesSpecPreset) => void;
  size?: 'sm' | 'md';
}

// ════ MINIPREFERENCESTILE IMPLEMENTATION ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const MiniPreferencesPresetTile: React.FC<MiniPreferencesPresetTileProps> = ({
  preset,
  isActive,
  onSelect,
  size = 'md'
}) => {
  const tileDim = size === 'sm' ? 'w-11 h-11' : 'w-13 h-13';
  const ringParams = getPreferencesRingParams(preset.spec);
  const derivedSigilId = getDerivedPreferencesSigilId(preset);

  return (
    <Tooltip text={`Preferences: ${preset.name} — ${preset.description}`}>
      <BaseButton
        onClick={() => onSelect(preset)}
        className={`relative ${tileDim} p-0.5 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer overflow-hidden ${
          isActive
            ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/20 scale-105 ring-1 ring-[var(--skipo-accent)] shadow-[var(--skipo-shadow)]'
            : 'border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]/60 hover:bg-[var(--skipo-surface-hover)]'
        }`}
      >
        <SigilRune
          sigilId={derivedSigilId}
          size={size === 'sm' ? 'xs' : 'sm'}
          rings={ringParams}
          isDiamondLayout={false}
          intensityMultiplier={isActive ? 1.4 : 0.9}
        />
        {isActive && (
          <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--skipo-accent)]" />
        )}
      </BaseButton>
    </Tooltip>
  );
};