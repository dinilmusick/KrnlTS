/**
 * ASCII Architecture Flowchart: SpecSaveContainer
 *
 *   ┌────────────────────────────────────────┐
 *   │      Initialize SpecSaveContainer      │
 *   └────────────────────────────────────────┘
 */

import React from 'react';
import { SaveIntelPresetModal } from './SaveIntelPresetModal.js';
import { SavePrefPresetModal } from './SavePrefPresetModal.js';
import { SIGIL_OPTIONS } from './intelligenceSpecConstants.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SpecSaveContainerProps {
  isIntelModalOpen: boolean;
  setIsIntelModalOpen: (open: boolean) => void;
  presetName: string;
  setPresetName: (name: string) => void;
  presetDescription: string;
  setPresetDescription: (desc: string) => void;
  selectedSigil: string;
  setSelectedSigil: (sigil: string) => void;
  onSaveIntelConfirm: () => void;

  isPrefModalOpen: boolean;
  setIsPrefModalOpen: (open: boolean) => void;
  prefPresetName: string;
  setPrefPresetName: (name: string) => void;
  prefPresetDescription: string;
  setPrefPresetDescription: (desc: string) => void;
  selectedPrefSigil: string;
  setSelectedPrefSigil: (sigil: string) => void;
  onSavePrefConfirm: () => void;
}

// ════ SPECSAVECONTAINER IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SpecSaveContainer: React.FC<SpecSaveContainerProps> = ({
  isIntelModalOpen,
  setIsIntelModalOpen,
  presetName,
  setPresetName,
  presetDescription,
  setPresetDescription,
  selectedSigil,
  setSelectedSigil,
  onSaveIntelConfirm,
  isPrefModalOpen,
  setIsPrefModalOpen,
  prefPresetName,
  setPrefPresetName,
  prefPresetDescription,
  setPrefPresetDescription,
  selectedPrefSigil,
  setSelectedPrefSigil,
  onSavePrefConfirm
}) => {
  return (
    <>
      <SaveIntelPresetModal
        isOpen={isIntelModalOpen}
        onClose={() => setIsIntelModalOpen(false)}
        presetName={presetName}
        setPresetName={setPresetName}
        presetDescription={presetDescription}
        setPresetDescription={setPresetDescription}
        selectedSigil={selectedSigil}
        setSelectedSigil={setSelectedSigil}
        sigilOptions={SIGIL_OPTIONS}
        onConfirm={onSaveIntelConfirm}
      />

      <SavePrefPresetModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        prefPresetName={prefPresetName}
        setPrefPresetName={setPrefPresetName}
        prefPresetDescription={prefPresetDescription}
        setPrefPresetDescription={setPrefPresetDescription}
        selectedPrefSigil={selectedPrefSigil}
        setSelectedPrefSigil={setSelectedPrefSigil}
        sigilOptions={SIGIL_OPTIONS}
        onConfirm={onSavePrefConfirm}
      />
    </>
  );
};