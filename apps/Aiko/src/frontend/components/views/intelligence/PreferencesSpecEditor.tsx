/**
 * ASCII Architecture Flowchart: PreferencesSpecEditor
 *
 *   ┌────────────────────────────────────┐
 *   │  Initialize PreferencesSpecEditor  │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │       PreferencesSpecEditor        │
 *   └────────────────────────────────────┘
 */

import React from 'react';
import { PreferencesSpec } from '../../../../backend/intelligence/types.js';
import { ProviderId } from '../../../types/app.js';
import { PROVIDERS_META } from '../../../../backend/providers.js';
import { PreferenceTogglesGrid } from './PreferenceTogglesGrid.js';
import { ProviderEnablementTable } from './ProviderEnablementTable.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

const ALL_PROVIDER_IDS = Object.keys(PROVIDERS_META) as ProviderId[];

interface PreferencesSpecEditorProps {
  spec: PreferencesSpec;
  onChange: (updatedSpec: PreferencesSpec) => void;
  disabled?: boolean;
}

// ════ PREFERENCESSPECEDITOR IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PreferencesSpecEditor: React.FC<PreferencesSpecEditorProps> = ({
  spec,
  onChange,
  disabled = false
}) => {
  const enabledProviders = spec.enabledProviders || ALL_PROVIDER_IDS;

  const toggleProvider = (providerId: ProviderId) => {
    if (disabled) return;
    const isCurrentlyEnabled = enabledProviders.includes(providerId);
    let updated: ProviderId[];
    if (isCurrentlyEnabled) {
      updated = enabledProviders.filter(id => id !== providerId);
    } else {
      updated = [...enabledProviders, providerId];
    }
    onChange({
      ...spec,
      enabledProviders: updated
    });
  };

  const handleSelectAllProviders = () => {
    if (disabled) return;
    onChange({
      ...spec,
      enabledProviders: [...ALL_PROVIDER_IDS]
    });
  };

  const handleDeselectAllProviders = () => {
    if (disabled) return;
    onChange({
      ...spec,
      enabledProviders: []
    });
  };

  return (
    <div className="flex flex-col gap-6 text-slate-900 dark:text-slate-100">
      <PreferenceTogglesGrid
        spec={spec}
        onChange={onChange}
        disabled={disabled}
      />

      <ProviderEnablementTable
        allProviderIds={ALL_PROVIDER_IDS}
        enabledProviders={enabledProviders}
        toggleProvider={toggleProvider}
        onSelectAll={handleSelectAllProviders}
        onDeselectAll={handleDeselectAllProviders}
        disabled={disabled}
      />
    </div>
  );
};