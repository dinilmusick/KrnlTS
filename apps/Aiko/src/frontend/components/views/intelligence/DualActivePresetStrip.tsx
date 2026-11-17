/**
 * ASCII Architecture Flowchart: DualActivePresetStrip
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize DualActivePresetStrip │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpecPreset, PreferencesSpecPreset, PreferencesSpec } from '../../../../backend/intelligence/types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface DualActivePresetStripProps {
  activePreset: IntelligenceSpecPreset | null;
  activePrefPreset: PreferencesSpecPreset | null;
  currentPrefSpec: PreferencesSpec;
}

// ════ DUALACTIVEPRESETSTRIP IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const DualActivePresetStrip: React.FC<DualActivePresetStripProps> = ({
  activePreset,
  activePrefPreset,
  currentPrefSpec
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3 font-mono">
      <div className="flex-1 flex items-center justify-between p-3 rounded-xl border-2 border-[var(--skipo-accent)]/50 bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-[var(--skipo-accent)] bg-[var(--skipo-accent)]/15 px-2 py-0.5 rounded border border-[var(--skipo-accent)]/30">
            ACTIVE INTELLIGENCE SPEC
          </span>
          <span className="text-sm font-bold text-[var(--skipo-text)]">{activePreset?.name || 'Custom'}</span>
        </div>
        <span className="text-[10px] text-[var(--skipo-text-muted)] font-mono">
          Sigil: {activePreset?.sigilId || 'sigil-logic'}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-between p-3 rounded-xl border-2 border-[var(--skipo-success)]/50 bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-[var(--skipo-success)] bg-[var(--skipo-success)]/15 px-2 py-0.5 rounded border border-[var(--skipo-success)]/30">
            ACTIVE PREFERENCES SPEC
          </span>
          <span className="text-sm font-bold text-[var(--skipo-text)]">{activePrefPreset?.name || 'Custom'}</span>
        </div>
        <span className="text-[10px] text-[var(--skipo-text-muted)] font-mono">
          Providers Enabled: {(currentPrefSpec.enabledProviders || []).length}
        </span>
      </div>
    </div>
  );
};