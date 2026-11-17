/**
 * ASCII Architecture Flowchart: PrefSpecTabContent
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize PrefSpecTabContent    │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { PreferencesSpec, PreferencesSpecPreset } from '../../../../backend/intelligence/types.js';
import { PreferencesSpecEditor } from './PreferencesSpecEditor.js';
import { PrefPresetListSection } from './PrefPresetListSection.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface PrefSpecTabContentProps {
  currentPrefSpec: PreferencesSpec;
  setCurrentPrefSpec: (spec: PreferencesSpec) => void;
  preferencesPresets: PreferencesSpecPreset[];
  activePreferencesPresetId: string | null;
  onSelectPreferencesPreset?: (preset: PreferencesSpecPreset) => void;
  onDuplicatePreset: (preset: PreferencesSpecPreset) => void;
  onDeletePreferencesPreset?: (id: string) => void;
  onCreateNew: () => void;
}

// ════ PREFSPECTABCONTENT IMPLEMENTATION ═══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PrefSpecTabContent: React.FC<PrefSpecTabContentProps> = ({
  currentPrefSpec,
  setCurrentPrefSpec,
  preferencesPresets,
  activePreferencesPresetId,
  onSelectPreferencesPreset,
  onDuplicatePreset,
  onDeletePreferencesPreset,
  onCreateNew
}) => {
  return (
    <>
      <PreferencesSpecEditor
        spec={currentPrefSpec}
        onChange={setCurrentPrefSpec}
      />
      <PrefPresetListSection
        presets={preferencesPresets}
        activePresetId={activePreferencesPresetId}
        onSelectPreset={p => onSelectPreferencesPreset?.(p)}
        onDuplicatePreset={onDuplicatePreset}
        onDeletePreset={id => onDeletePreferencesPreset?.(id)}
        onCreateNew={onCreateNew}
      />
    </>
  );
};