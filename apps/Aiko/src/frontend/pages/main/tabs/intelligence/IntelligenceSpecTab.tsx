/**
 * @file IntelligenceSpecTab.tsx
 * @description Canonical Intelligence Spec Tab within Main Page.
 * Conforms to L9 (Lines <= 200).
 */

import React from 'react';
import { IntelligenceSpecWindow } from '../../../../components/views/intelligence/IntelligenceSpecWindow.js';

export interface IntelligenceSpecTabProps {
  onClose: () => void;
  catalog: any;
  presets: any[];
  activePresetId?: string;
  onSelectPreset: (preset: any) => void;
  onPresetsUpdated: (presets: any[]) => void;
  onSavePreset: (preset: any) => Promise<boolean>;
  onDeletePreset: (presetId: string) => Promise<boolean>;
  preferencesPresets: any[];
  activePreferencesPresetId?: string;
  onSelectPreferencesPreset: (preset: any) => void;
  onPreferencesPresetsUpdated: (presets: any[]) => void;
}

export function IntelligenceSpecTab(props: IntelligenceSpecTabProps) {
  return <IntelligenceSpecWindow {...props} />;
}

export default IntelligenceSpecTab;
