/**
 * ASCII Architecture Flowchart: SpecWindowHeader
 *
 *   ┌─────────────────────────────────────┐
 *   │      Initialize SpecWindowHeader    │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { Cpu, Sliders, CheckSquare, Plus, Save } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SpecWindowHeaderProps {
  activeTab: 'intelligence' | 'preferences';
  setActiveTab: (tab: 'intelligence' | 'preferences') => void;
  saveStatus: string | null;
  onNewIntelPreset: () => void;
  onSaveIntelPreset: () => void;
  onNewPrefPreset: () => void;
  onSavePrefPreset: () => void;
}

// ════ SPECWINDOWHEADER IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SpecWindowHeader: React.FC<SpecWindowHeaderProps> = ({
  activeTab,
  setActiveTab,
  saveStatus,
  onNewIntelPreset,
  onSaveIntelPreset,
  onNewPrefPreset,
  onSavePrefPreset
}) => {
  const { setInspectionText } = useBottomStrip();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg)] shadow-[var(--skipo-shadow-btn)] border border-[var(--skipo-border-color)]">
          <Cpu size={18} />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-black tracking-wide uppercase text-[var(--skipo-text)] flex items-center gap-2">
            ROUTER SPEC MATRIX
          </h1>
          <p className="text-[10px] text-[var(--skipo-text-muted)] font-mono">
            Intelligence and Preferences Presets
          </p>
        </div>
      </div>

      {/* Tab Switcher - Icon Only */}
      <div className="flex items-center gap-1 bg-[var(--skipo-matte-bg)] p-1 rounded-lg border border-[var(--skipo-border-color)]/60">
        <BaseButton
          size="sm"
          onClick={() => setActiveTab('intelligence')}
          onMouseEnter={() => setInspectionText("VIEW: INTELLIGENCE SPEC MATRIX")}
          onMouseLeave={() => setInspectionText(null)}
          onFocus={() => setInspectionText("VIEW: INTELLIGENCE SPEC MATRIX")}
          onBlur={() => setInspectionText(null)}
          aria-label="Intelligence Spec"
          variant={activeTab === 'intelligence' ? 'accent' : 'ghost'}
          className="px-2 py-1"
          icon={<Sliders size={15} />}
        />
        <BaseButton
          size="sm"
          onClick={() => setActiveTab('preferences')}
          onMouseEnter={() => setInspectionText("VIEW: PREFERENCES SPEC MATRIX")}
          onMouseLeave={() => setInspectionText(null)}
          onFocus={() => setInspectionText("VIEW: PREFERENCES SPEC MATRIX")}
          onBlur={() => setInspectionText(null)}
          aria-label="Preferences Spec"
          variant={activeTab === 'preferences' ? 'accent' : 'ghost'}
          className="px-2 py-1"
          icon={<CheckSquare size={15} />}
        />
      </div>

      {/* Action Controls - Icon Only */}
      <div className="flex items-center gap-2">
        {saveStatus && (
          <span className="text-[10px] font-bold text-[var(--skipo-success)] bg-[var(--skipo-success)]/15 px-2 py-1 rounded border border-[var(--skipo-success)]">
            {saveStatus}
          </span>
        )}

        {activeTab === 'intelligence' ? (
          <>
            <BaseButton
              size="sm"
              variant="secondary"
              onClick={onNewIntelPreset}
              onMouseEnter={() => setInspectionText("CREATE NEW INTELLIGENCE SPEC")}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText("CREATE NEW INTELLIGENCE SPEC")}
              onBlur={() => setInspectionText(null)}
              aria-label="New Intelligence Spec"
              className="px-2.5"
              icon={<Plus size={15} />}
            />
            <BaseButton
              size="sm"
              variant="accent"
              onClick={onSaveIntelPreset}
              onMouseEnter={() => setInspectionText("SAVE INTELLIGENCE SPEC")}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText("SAVE INTELLIGENCE SPEC")}
              onBlur={() => setInspectionText(null)}
              aria-label="Save Intelligence Spec"
              className="px-2.5"
              icon={<Save size={15} />}
            />
          </>
        ) : (
          <>
            <BaseButton
              size="sm"
              variant="secondary"
              onClick={onNewPrefPreset}
              onMouseEnter={() => setInspectionText("CREATE NEW PREFERENCE SPEC")}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText("CREATE NEW PREFERENCE SPEC")}
              onBlur={() => setInspectionText(null)}
              aria-label="New Preference Spec"
              className="px-2.5"
              icon={<Plus size={15} />}
            />
            <BaseButton
              size="sm"
              variant="accent"
              onClick={onSavePrefPreset}
              onMouseEnter={() => setInspectionText("SAVE PREFERENCE SPEC")}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText("SAVE PREFERENCE SPEC")}
              onBlur={() => setInspectionText(null)}
              aria-label="Save Preference Spec"
              className="px-2.5"
              icon={<Save size={15} />}
            />
          </>
        )}
      </div>
    </div>
  );
};