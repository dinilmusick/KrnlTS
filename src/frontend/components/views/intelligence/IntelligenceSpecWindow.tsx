/**
 * ASCII Architecture Flowchart: IntelligenceSpecWindow
 *
 *   ┌─────────────────────────────────────┐
 *   │  Initialize IntelligenceSpecWindow  │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │        IntelligenceSpecWindow       │
 *   └─────────────────────────────────────┘
 */

import React, { useState, useMemo, useEffect } from 'react';
import { IntelligenceSpec, IntelligenceSpecPreset, PreferencesSpec, PreferencesSpecPreset } from '../../../../backend/intelligence/types.js';
import { ModelCatalogEntry } from '../../../types/app.js';
import { specToTensor, tensorToSpec, createDefaultIntelligenceSpec, createDefaultPreferencesSpec } from '../../../../backend/intelligence/helpers.js';
import { RingParam } from './SigilRune.js';
import { MatchingEngine } from '../../../../backend/intelligence/matchingEngine.js';
import { SpecWindowHeader } from './SpecWindowHeader.js';
import { DualActivePresetStrip } from './DualActivePresetStrip.js';
import { IntelSpecTabContent } from './IntelSpecTabContent.js';
import { PrefSpecTabContent } from './PrefSpecTabContent.js';
import { SpecSaveContainer } from './SpecSaveContainer.js';
import { CATEGORIES } from './intelligenceSpecConstants.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface IntelligenceSpecWindowProps {
  catalog?: ModelCatalogEntry[];
  presets?: IntelligenceSpecPreset[];
  activePresetId?: string | null;
  onSelectPreset?: (preset: IntelligenceSpecPreset) => void;
  onPresetsUpdated?: (presets: IntelligenceSpecPreset[]) => void;
  onSavePreset?: (preset: IntelligenceSpecPreset) => void;
  onDeletePreset?: (presetId: string) => void;
  preferencesPresets?: PreferencesSpecPreset[];
  activePreferencesPresetId?: string | null;
  onSelectPreferencesPreset?: (preset: PreferencesSpecPreset) => void;
  onPreferencesPresetsUpdated?: (presets: PreferencesSpecPreset[]) => void;
  onSavePreferencesPreset?: (preset: PreferencesSpecPreset) => void;
  onDeletePreferencesPreset?: (presetId: string) => void;
  onClose?: () => void;
}

// ════ INTELLIGENCESPECWINDOW IMPLEMENTATION ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const IntelligenceSpecWindow: React.FC<IntelligenceSpecWindowProps> = ({
  catalog = [],
  presets = [],
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  preferencesPresets = [],
  activePreferencesPresetId,
  onSelectPreferencesPreset,
  onSavePreferencesPreset,
  onDeletePreferencesPreset
}) => {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'preferences'>('intelligence');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  const [currentSpec, setCurrentSpec] = useState<IntelligenceSpec>(createDefaultIntelligenceSpec());
  const [currentPrefSpec, setCurrentPrefSpec] = useState<PreferencesSpec>(createDefaultPreferencesSpec());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedTensor, setCopiedTensor] = useState(false);
  const [isIntelModalOpen, setIsIntelModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [selectedSigil, setSelectedSigil] = useState('sigil-logic');
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [prefPresetName, setPrefPresetName] = useState('');
  const [prefPresetDescription, setPrefPresetDescription] = useState('');
  const [selectedPrefSigil, setSelectedPrefSigil] = useState('sigil-omni');

  const activePreset = useMemo(() => presets.find(p => p.id === activePresetId) || null, [presets, activePresetId]);
  const activePrefPreset = useMemo(() => preferencesPresets.find(p => p.id === activePreferencesPresetId) || null, [preferencesPresets, activePreferencesPresetId]);

  useEffect(() => {
    if (activePreset) setCurrentSpec(tensorToSpec(activePreset.tensor));
  }, [activePreset]);

  useEffect(() => {
    if (activePrefPreset?.spec) setCurrentPrefSpec(activePrefPreset.spec);
  }, [activePrefPreset]);

  const activeCategory = CATEGORIES[activeCategoryIndex];
  const matchingEngine = useMemo(() => new MatchingEngine(catalog), [catalog]);
  const currentTensor = useMemo(() => specToTensor(currentSpec), [currentSpec]);
  const rankingCandidates = useMemo(() => {
    return matchingEngine.matchCandidates(currentTensor, {
      avoidPaid: currentPrefSpec.avoidPaid,
      prioritiseReasoning: currentPrefSpec.prioritiseReasoning,
      prioritiseDeterminism: currentPrefSpec.prioritiseDeterminism,
      enabledProviders: currentPrefSpec.enabledProviders
    });
  }, [matchingEngine, currentTensor, currentPrefSpec]);

  const categoryRings: RingParam[] = useMemo(() => {
    return activeCategory.parameters.map((param) => ({
      name: param.label,
      value: Number(currentSpec[param.key] ?? 5),
      color: activeCategory.color
    }));
  }, [activeCategory, currentSpec]);

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 p-3 md:p-5 font-mono">
      <SpecWindowHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        saveStatus={saveStatus}
        onNewIntelPreset={() => { setCurrentSpec(createDefaultIntelligenceSpec()); setIsIntelModalOpen(true); }}
        onSaveIntelPreset={() => setIsIntelModalOpen(true)}
        onNewPrefPreset={() => { setCurrentPrefSpec(createDefaultPreferencesSpec()); setIsPrefModalOpen(true); }}
        onSavePrefPreset={() => setIsPrefModalOpen(true)}
      />

      <DualActivePresetStrip activePreset={activePreset} activePrefPreset={activePrefPreset} currentPrefSpec={currentPrefSpec} />

      {activeTab === 'intelligence' ? (
        <IntelSpecTabContent
          categories={CATEGORIES}
          activeCategoryIndex={activeCategoryIndex}
          setActiveCategoryIndex={setActiveCategoryIndex}
          activeCategory={activeCategory}
          categoryRings={categoryRings}
          currentSpec={currentSpec}
          handleParameterChange={(k, v) => setCurrentSpec(prev => ({ ...prev, [k]: v }))}
          rankingCandidates={rankingCandidates}
          onResetToBaseline={() => setCurrentSpec(createDefaultIntelligenceSpec())}
          onCopyTensor={() => {
            navigator.clipboard.writeText(JSON.stringify(currentTensor));
            setCopiedTensor(true);
            setTimeout(() => setCopiedTensor(false), 2000);
          }}
          copiedTensor={copiedTensor}
          presets={presets}
          activePresetId={activePresetId || null}
          onSelectPreset={p => onSelectPreset?.(p)}
          onDuplicatePreset={p => onSavePreset?.({ ...p, id: `preset-${Date.now()}`, name: `${p.name} (Copy)`, isDefault: false })}
          onDeletePreset={id => onDeletePreset?.(id)}
          onCreateNew={() => { setCurrentSpec(createDefaultIntelligenceSpec()); setIsIntelModalOpen(true); }}
        />
      ) : (
        <PrefSpecTabContent
          currentPrefSpec={currentPrefSpec}
          setCurrentPrefSpec={setCurrentPrefSpec}
          preferencesPresets={preferencesPresets}
          activePreferencesPresetId={activePreferencesPresetId || null}
          onSelectPreferencesPreset={p => onSelectPreferencesPreset?.(p)}
          onDuplicatePreset={p => onSavePreferencesPreset?.({ ...p, id: `pref-preset-${Date.now()}`, name: `${p.name} (Copy)`, isDefault: false })}
          onDeletePreferencesPreset={id => onDeletePreferencesPreset?.(id)}
          onCreateNew={() => { setCurrentPrefSpec(createDefaultPreferencesSpec()); setIsPrefModalOpen(true); }}
        />
      )}

      <SpecSaveContainer
        isIntelModalOpen={isIntelModalOpen}
        setIsIntelModalOpen={setIsIntelModalOpen}
        presetName={presetName}
        setPresetName={setPresetName}
        presetDescription={presetDescription}
        setPresetDescription={setPresetDescription}
        selectedSigil={selectedSigil}
        setSelectedSigil={setSelectedSigil}
        onSaveIntelConfirm={() => {
          onSavePreset?.({ id: `intel-preset-${Date.now()}`, name: presetName, description: presetDescription, sigilId: selectedSigil, tensor: specToTensor(currentSpec), isDefault: false });
          setIsIntelModalOpen(false);
          setSaveStatus('Intelligence preset saved');
          setTimeout(() => setSaveStatus(null), 3000);
        }}
        isPrefModalOpen={isPrefModalOpen}
        setIsPrefModalOpen={setIsPrefModalOpen}
        prefPresetName={prefPresetName}
        setPrefPresetName={setPrefPresetName}
        prefPresetDescription={prefPresetDescription}
        setPrefPresetDescription={setPrefPresetDescription}
        selectedPrefSigil={selectedPrefSigil}
        setSelectedPrefSigil={setSelectedPrefSigil}
        onSavePrefConfirm={() => {
          onSavePreferencesPreset?.({ id: `pref-preset-${Date.now()}`, name: prefPresetName, description: prefPresetDescription, sigilId: selectedPrefSigil, spec: currentPrefSpec, isDefault: false });
          setIsPrefModalOpen(false);
          setSaveStatus('Preferences preset saved');
          setTimeout(() => setSaveStatus(null), 3000);
        }}
      />
    </div>
  );
};