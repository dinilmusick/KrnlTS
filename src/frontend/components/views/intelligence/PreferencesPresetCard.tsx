/**
 * ASCII Architecture Flowchart: PreferencesPresetCard
 *
 *   ┌────────────────────────────────────┐
 *   │  Initialize PreferencesPresetCard  │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │      BigPreferencesPresetCard      │
 *   └────────────────────────────────────┘
 */

import React from 'react';
import { PreferencesSpecPreset, PreferencesSpec } from '../../../../backend/intelligence/types.js';
import { SigilRune } from './SigilRune.js';
import { Check, Copy, Trash2 } from 'lucide-react';
import { BaseButton, BaseCard } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

export { MiniPreferencesPresetTile } from './MiniPreferencesPresetTile.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface BigPreferencesPresetCardProps {
  preset: PreferencesSpecPreset;
  isActive: boolean;
  onSelect: (preset: PreferencesSpecPreset) => void;
  onDuplicate?: (preset: PreferencesSpecPreset) => void;
  onDelete?: (id: string) => void;
}

export const getPreferencesRingParams = (spec: any = {}) => {
  const enabledCount = Array.isArray(spec.enabledProviders) ? spec.enabledProviders.length : 0;
  const providerVal = Math.min(10, Math.round((enabledCount / 7) * 10));
  const costVal = spec.avoidPaid ? 10 : 3;
  const priorityVal = (spec.prioritiseReasoning ? 5 : 0) + (spec.prioritiseDeterminism ? 5 : 0);

  return [
    { name: 'Providers Matrix', value: providerVal, color: 'var(--skipo-accent, #d4af37)' },
    { name: 'Cost Filter', value: costVal, color: 'var(--skipo-warning, #f59e0b)' },
    { name: 'Reasoning Strictness', value: priorityVal, color: 'var(--skipo-accent-glow, #ec4899)' }
  ];
};

export const getDerivedPreferencesSigilId = (preset: PreferencesSpecPreset) => {
  if (preset.sigilId && preset.sigilId !== 'sigil-omni') {
    return preset.sigilId;
  }
  const spec: Partial<PreferencesSpec> = preset.spec || {};
  if (spec.avoidPaid) return 'sigil-data';
  if (spec.prioritiseReasoning) return 'sigil-logic';
  if (spec.prioritiseDeterminism) return 'sigil-code';
  return 'sigil-omni';
};

// ════ PREFERENCESPRESETCARD IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const BigPreferencesPresetCard: React.FC<BigPreferencesPresetCardProps> = ({
  preset,
  isActive,
  onSelect,
  onDuplicate,
  onDelete
}) => {
  const { setInspectionText } = useBottomStrip();
  const spec = preset.spec || ({} as any);
  const enabledProviders = spec.enabledProviders || [];
  const ringParams = getPreferencesRingParams(spec);
  const derivedSigilId = getDerivedPreferencesSigilId(preset);
  
  const filterBadges: Array<{ label: string; active: boolean; color: string }> = [
    { label: 'AVOID PAID', active: Boolean(spec.avoidPaid), color: 'bg-amber-500/20 text-amber-500 border-amber-500/50' },
    { label: 'REASONING+', active: Boolean(spec.prioritiseReasoning), color: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/50' },
    { label: 'DETERMINISTIC', active: Boolean(spec.prioritiseDeterminism), color: 'bg-rose-500/20 text-rose-500 border-rose-500/50' }
  ].filter(b => b.active);

  return (
    <BaseCard
      variant={isActive ? 'surface' : 'base'}
      onMouseEnter={() => setInspectionText(`PREFERENCE PRESET: ${preset.name.toUpperCase()} - ${preset.description || 'Custom Preferences Spec'}`)}
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

      {/* Center Sigil Rune Visual */}
      <BaseButton
        variant="ghost"
        onClick={() => onSelect(preset)}
        onMouseEnter={() => setInspectionText(`SELECT PREFERENCE PRESET: ${preset.name.toUpperCase()}`)}
        onMouseLeave={() => setInspectionText(null)}
        onFocus={() => setInspectionText(`SELECT PREFERENCE PRESET: ${preset.name.toUpperCase()}`)}
        onBlur={() => setInspectionText(null)}
        aria-label={`Select ${preset.name}`}
        className="flex-1 flex flex-col items-center justify-center my-auto transition-transform duration-200 group-hover:scale-105 py-1 text-[var(--skipo-text)]"
      >
        <SigilRune
          sigilId={derivedSigilId}
          size="md"
          rings={ringParams}
          isDiamondLayout={false}
          intensityMultiplier={isActive ? 1.3 : 1.0}
        />

        <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
          <span className="text-[8.5px] font-mono font-bold text-[var(--skipo-text-muted)]">
            {enabledProviders.length} PROVIDERS
          </span>
        </div>
      </BaseButton>

      {/* Filter Badges Strip */}
      {filterBadges.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 z-10">
          {filterBadges.map((b, idx) => (
            <span key={idx} className={`px-1 py-0.5 rounded text-[8px] font-black border shrink-0 ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Footer Info & Actions */}
      <div className="mt-1 pt-1.5 border-t border-[var(--skipo-border-color)]/30 flex items-center justify-between text-[9px] font-mono text-[var(--skipo-text-muted)] z-10">
        <span className="truncate max-w-[110px]">
          {preset.description || 'Custom Preferences Spec'}
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
              onMouseEnter={() => setInspectionText(`DUPLICATE PREFERENCE PRESET: ${preset.name.toUpperCase()}`)}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText(`DUPLICATE PREFERENCE PRESET: ${preset.name.toUpperCase()}`)}
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
              onMouseEnter={() => setInspectionText(`DELETE PREFERENCE PRESET: ${preset.name.toUpperCase()}`)}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText(`DELETE PREFERENCE PRESET: ${preset.name.toUpperCase()}`)}
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

export const PreferencesPresetCard = BigPreferencesPresetCard;