/**
 * ASCII Architecture Flowchart: SpecCategoryCard
 *
 *   ┌─────────────────────────────────────┐
 *   │      Initialize SpecCategoryCard    │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { IntelligenceSpec, IntelligenceDimension } from '../../../../backend/intelligence/types.js';
import { BaseInput } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SpecCategoryCardProps {
  cat: {
    code: string;
    label: string;
    icon: any;
    dims: Array<{ key: IntelligenceDimension; label: string }>;
  };
  spec: IntelligenceSpec;
  updateDimension: (dim: IntelligenceDimension, val: number) => void;
}

// ════ SPECCATEGORYCARD IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SpecCategoryCard: React.FC<SpecCategoryCardProps> = ({
  cat,
  spec,
  updateDimension
}) => {
  const CatIcon = cat.icon;
  return (
    <div className="p-2.5 rounded-md border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] space-y-2">
      <div className="flex items-center justify-between font-extrabold text-[10px] tracking-wider text-[var(--skipo-text)] uppercase border-b border-[var(--skipo-border-color)]/30 pb-1">
        <span className="flex items-center gap-1">
          <CatIcon size={12} className="text-[var(--skipo-accent)]" />
          {cat.code}
        </span>
        <span className="text-[9px] text-[var(--skipo-text-muted)]">{cat.dims.length} Dims</span>
      </div>

      <div className="space-y-1.5 pt-0.5">
        {cat.dims.map(dim => {
          const val = spec[dim.key] ?? 5;
          return (
            <div key={dim.key} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-16 truncate font-bold text-[var(--skipo-text)]" title={dim.label}>
                {dim.label}
              </span>
              <BaseInput
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={val}
                onChange={e => updateDimension(dim.key, parseFloat(e.target.value))}
                className="flex-1 accent-[var(--skipo-accent)] h-1 bg-[var(--skipo-matte-bg)] rounded cursor-pointer"
              />
              <span className="w-5 text-right font-black text-[var(--skipo-accent)]">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};