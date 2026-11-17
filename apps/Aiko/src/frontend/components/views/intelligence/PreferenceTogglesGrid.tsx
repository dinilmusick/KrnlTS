/**
 * ASCII Architecture Flowchart: PreferenceTogglesGrid
 *
 *   ┌────────────────────────────────────────┐
 *   │    Initialize PreferenceTogglesGrid    │
 *   └────────────────────────────────────────┘
 */

import React from 'react';
import { PreferencesSpec } from '../../../../backend/intelligence/types.js';
import { PreferenceFilterCard } from './PreferenceFilterCard.js';
import { DollarSign, Sparkles, ShieldAlert, Sliders } from 'lucide-react';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface PreferenceTogglesGridProps {
  spec: PreferencesSpec;
  onChange: (updatedSpec: PreferencesSpec) => void;
  disabled?: boolean;
}

// ════ PREFERENCETOGGLESGRID IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PreferenceTogglesGrid: React.FC<PreferenceTogglesGridProps> = ({
  spec,
  onChange,
  disabled = false
}) => {
  const toggleFilter = (key: keyof PreferencesSpec) => {
    if (disabled) return;
    onChange({ ...spec, [key]: !spec[key] });
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--skipo-border-color)]/30 pb-2">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-[var(--skipo-accent)]" />
          <h3 className="text-sm font-black tracking-wider uppercase text-[var(--skipo-text)]">
            Preferences & Constraints
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--skipo-text-muted)]">
          Router Constraint Rules
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <PreferenceFilterCard
          label="Avoid Paid Providers"
          description="Applies cost penalty."
          active={Boolean(spec.avoidPaid)}
          onClick={() => toggleFilter('avoidPaid')}
          icon={<DollarSign size={16} />}
          activeColorClass="text-amber-200"
          activeBorderClass="border-amber-500 bg-amber-500/10"
          activeIconBgClass="bg-amber-500/20 text-amber-400"
          disabled={disabled}
        />

        <PreferenceFilterCard
          label="Prioritise Deep Reasoning"
          description="Boosts reasoning weights."
          active={Boolean(spec.prioritiseReasoning)}
          onClick={() => toggleFilter('prioritiseReasoning')}
          icon={<Sparkles size={16} />}
          activeColorClass="text-indigo-200"
          activeBorderClass="border-indigo-500 bg-indigo-500/10"
          activeIconBgClass="bg-indigo-500/20 text-indigo-400"
          disabled={disabled}
        />

        <PreferenceFilterCard
          label="Prioritise Determinism"
          description="Boosts determinism weights."
          active={Boolean(spec.prioritiseDeterminism)}
          onClick={() => toggleFilter('prioritiseDeterminism')}
          icon={<ShieldAlert size={16} />}
          activeColorClass="text-rose-200"
          activeBorderClass="border-rose-500 bg-rose-500/10"
          activeIconBgClass="bg-rose-500/20 text-rose-400"
          disabled={disabled}
        />
      </div>
    </div>
  );
};