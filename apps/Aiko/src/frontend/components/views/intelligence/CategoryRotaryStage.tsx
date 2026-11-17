/**
 * ASCII Architecture Flowchart: CategoryRotaryStage
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize CategoryRotaryStage   │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Sliders, Brain, Code, Database, Eye } from 'lucide-react';
import { SigilRune, RingParam } from './SigilRune.js';
import { TactileKnob } from './TactileKnob.js';
import { IntelligenceSpec } from '../../../../backend/intelligence/types.js';
import { BaseButton } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface CategoryRotaryStageProps {
  categories: any[];
  activeCategoryIndex: number;
  setActiveCategoryIndex: (idx: number) => void;
  prevCategory: () => void;
  nextCategory: () => void;
  activeCategory: any;
  categoryRings: RingParam[];
  currentSpec: IntelligenceSpec;
  handleParameterChange: (key: keyof IntelligenceSpec, val: number) => void;
}

// ════ CATEGORYROTARYSTAGE IMPLEMENTATION ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const CategoryRotaryStage: React.FC<CategoryRotaryStageProps> = ({
  categories,
  activeCategoryIndex,
  setActiveCategoryIndex,
  prevCategory,
  nextCategory,
  activeCategory,
  categoryRings,
  currentSpec,
  handleParameterChange
}) => {
  const { setInspectionText } = useBottomStrip();

  const getCategoryIcon = (catId: string, color: string) => {
    switch (catId) {
      case 'REASONING':
        return <Brain size={15} style={{ color }} />;
      case 'CODING':
        return <Code size={15} style={{ color }} />;
      case 'DATA':
        return <Database size={15} style={{ color }} />;
      case 'MODALITY':
        return <Eye size={15} style={{ color }} />;
      default:
        return <Sliders size={15} style={{ color }} />;
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col space-y-3 p-4 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
      {/* Category Tabs Navigator - Icon Only */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--skipo-border-color)]/30">
        <BaseButton
          size="sm"
          variant="secondary"
          onClick={prevCategory}
          onMouseEnter={() => setInspectionText("PREVIOUS SPEC CATEGORY")}
          onMouseLeave={() => setInspectionText(null)}
          onFocus={() => setInspectionText("PREVIOUS SPEC CATEGORY")}
          onBlur={() => setInspectionText(null)}
          aria-label="Previous Category"
          icon={<ChevronLeft size={16} />}
        />

        <div className="flex items-center gap-2 overflow-x-auto px-2">
          {categories.map((cat, idx) => {
            const isSelected = idx === activeCategoryIndex;
            return (
              <BaseButton
                key={cat.id}
                size="sm"
                variant={isSelected ? 'accent' : 'ghost'}
                onClick={() => setActiveCategoryIndex(idx)}
                onMouseEnter={() => setInspectionText(`CATEGORY: ${cat.label.toUpperCase()} - ${cat.description}`)}
                onMouseLeave={() => setInspectionText(null)}
                onFocus={() => setInspectionText(`CATEGORY: ${cat.label.toUpperCase()} - ${cat.description}`)}
                onBlur={() => setInspectionText(null)}
                aria-label={cat.label}
                className={`p-2 rounded-lg ${
                  isSelected ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/20' : ''
                }`}
                icon={getCategoryIcon(cat.id, cat.color)}
              />
            );
          })}
        </div>

        <BaseButton
          size="sm"
          variant="secondary"
          onClick={nextCategory}
          onMouseEnter={() => setInspectionText("NEXT SPEC CATEGORY")}
          onMouseLeave={() => setInspectionText(null)}
          onFocus={() => setInspectionText("NEXT SPEC CATEGORY")}
          onBlur={() => setInspectionText(null)}
          aria-label="Next Category"
          icon={<ChevronRight size={16} />}
        />
      </div>

      {/* Central Visual Stage */}
      <div className="relative flex flex-col items-center justify-center p-3 rounded-lg border border-[var(--skipo-border-color)]/50 bg-[var(--skipo-matte-bg)] min-h-[220px]">
        <div className="absolute top-2 left-3 flex items-center gap-2">
          <span className="text-[11px] font-black uppercase" style={{ color: activeCategory.color }}>
            {activeCategory.label}
          </span>
          <span className="text-[9px] text-[var(--skipo-text-muted)]">
            (Rune Rings Glow Intensity)
          </span>
        </div>

        <SigilRune
          sigilId={activeCategory.runeId}
          size="lg"
          categoryCode={activeCategory.id}
          rings={categoryRings}
          intensityMultiplier={1.2}
        />
      </div>

      {/* Rotary Knobs Grid for Current Category */}
      <div className="pt-2">
        <div className="text-[10px] font-black tracking-wider uppercase text-[var(--skipo-text-muted)] mb-2 flex items-center gap-1">
          <Sliders size={12} /> TENSOR PARAMETERS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 justify-items-center bg-[var(--skipo-bg)]/50 p-3 rounded-lg border border-[var(--skipo-border-color)]/30">
          {activeCategory.parameters.map((param: any) => {
            const val = currentSpec[param.key as keyof IntelligenceSpec] ?? 5;
            return (
              <TactileKnob
                key={param.key}
                label={param.label}
                value={Number(val)}
                color={activeCategory.color}
                onChange={v => handleParameterChange(param.key, v)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};