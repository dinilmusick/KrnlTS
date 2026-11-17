import React from 'react';
import { BaseSelect } from '@ultrst-armada/floks';
import type { IntelligenceSpecPreset, PreferencesSpecPreset } from '../../../libraries/intelligenceContracts.js';

export interface SpecSelectionRowProps {
  intelligenceSpecId?: string;
  onChangeIntelligenceSpecId: (specId: string) => void;
  preferenceSpecId?: string;
  onChangePreferenceSpecId: (prefId: string) => void;
  presets?: IntelligenceSpecPreset[];
  preferencesPresets?: PreferencesSpecPreset[];
}

export const SpecSelectionRow: React.FC<SpecSelectionRowProps> = ({
  intelligenceSpecId = '',
  onChangeIntelligenceSpecId,
  preferenceSpecId = '',
  onChangePreferenceSpecId,
  presets = [],
  preferencesPresets = []
}) => {
  const intelOptions = [
    { value: '', label: 'Auto (Default Matching)' },
    ...presets.map((p) => ({
      value: p.id,
      label: `${p.name}`
    }))
  ];

  const prefOptions = [
    { value: '', label: 'None (Default Routing)' },
    ...preferencesPresets.map((p) => ({
      value: p.id,
      label: `${p.name}`
    }))
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="block text-[10px] uppercase font-bold text-[var(--skipo-accent,#6366f1)] font-mono">
          Intelligence Spec
        </label>
        <BaseSelect
          value={intelligenceSpecId}
          onChange={(e) => onChangeIntelligenceSpecId(e.target.value)}
          options={intelOptions}
          className="text-xs h-8"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] uppercase font-bold text-[var(--skipo-accent,#6366f1)] font-mono">
          Preferences Spec
        </label>
        <BaseSelect
          value={preferenceSpecId}
          onChange={(e) => onChangePreferenceSpecId(e.target.value)}
          options={prefOptions}
          className="text-xs h-8"
        />
      </div>
    </div>
  );
};

export default SpecSelectionRow;
