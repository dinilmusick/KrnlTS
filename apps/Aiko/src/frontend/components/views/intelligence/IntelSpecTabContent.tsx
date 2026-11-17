/**
 * ASCII Architecture Flowchart: IntelSpecTabContent
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize IntelSpecTabContent   │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpec, IntelligenceSpecPreset } from '../../../../backend/intelligence/types.js';
import { CategoryRotaryStage } from './CategoryRotaryStage.js';
import { LiveMatchingRankingDrawer } from './LiveMatchingRankingDrawer.js';
import { IntelPresetListSection } from './IntelPresetListSection.js';
import { RingParam } from './SigilRune.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface IntelSpecTabContentProps {
  categories: any[];
  activeCategoryIndex: number;
  setActiveCategoryIndex: (idx: number | ((prev: number) => number)) => void;
  activeCategory: any;
  categoryRings: RingParam[];
  currentSpec: IntelligenceSpec;
  handleParameterChange: (k: keyof IntelligenceSpec, v: number) => void;
  rankingCandidates: any[];
  onResetToBaseline: () => void;
  onCopyTensor: () => void;
  copiedTensor: boolean;
  presets: IntelligenceSpecPreset[];
  activePresetId: string | null;
  onSelectPreset?: (preset: IntelligenceSpecPreset) => void;
  onDuplicatePreset: (preset: IntelligenceSpecPreset) => void;
  onDeletePreset?: (id: string) => void;
  onCreateNew: () => void;
}

// ════ INTELSPECTABCONTENT IMPLEMENTATION ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const IntelSpecTabContent: React.FC<IntelSpecTabContentProps> = ({
  categories,
  activeCategoryIndex,
  setActiveCategoryIndex,
  activeCategory,
  categoryRings,
  currentSpec,
  handleParameterChange,
  rankingCandidates,
  onResetToBaseline,
  onCopyTensor,
  copiedTensor,
  presets,
  activePresetId,
  onSelectPreset,
  onDuplicatePreset,
  onDeletePreset,
  onCreateNew
}) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <CategoryRotaryStage
          categories={categories}
          activeCategoryIndex={activeCategoryIndex}
          setActiveCategoryIndex={setActiveCategoryIndex as any}
          prevCategory={() => setActiveCategoryIndex(p => (p - 1 + categories.length) % categories.length)}
          nextCategory={() => setActiveCategoryIndex(p => (p + 1) % categories.length)}
          activeCategory={activeCategory}
          categoryRings={categoryRings}
          currentSpec={currentSpec}
          handleParameterChange={handleParameterChange}
        />

        <LiveMatchingRankingDrawer
          candidates={rankingCandidates}
          onResetToBaseline={onResetToBaseline}
          onCopyTensor={onCopyTensor}
          copiedTensor={copiedTensor}
        />
      </div>

      <IntelPresetListSection
        presets={presets}
        activePresetId={activePresetId}
        onSelectPreset={p => onSelectPreset?.(p)}
        onDuplicatePreset={onDuplicatePreset}
        onDeletePreset={id => onDeletePreset?.(id)}
        onCreateNew={onCreateNew}
      />
    </>
  );
};