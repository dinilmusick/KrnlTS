/**
 * ASCII Architecture Flowchart: LiveMatchingRankingDrawer
 *
 *   ┌──────────────────────────────────────────┐
 *   │   Initialize LiveMatchingRankingDrawer   │
 *   └──────────────────────────────────────────┘
 */

import React from 'react';
import { RankedCandidate } from '../../../../backend/intelligence/types.js';
import { Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface LiveMatchingRankingDrawerProps {
  candidates: RankedCandidate[];
  onResetToBaseline: () => void;
  onCopyTensor: () => void;
  copiedTensor: boolean;
}

// ════ LIVEMATCHINGRANKINGDRAWER IMPLEMENTATION ════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const LiveMatchingRankingDrawer: React.FC<LiveMatchingRankingDrawerProps> = ({
  candidates,
  onResetToBaseline,
  onCopyTensor,
  copiedTensor
}) => {
  const { setInspectionText } = useBottomStrip();

  return (
    <div className="lg:col-span-5 flex flex-col space-y-3 p-4 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--skipo-border-color)]/30">
        <div className="flex items-center gap-2 font-black text-xs uppercase text-[var(--skipo-text)]">
          <Sparkles size={14} className="text-[var(--skipo-accent)]" />
          <span>LIVE ROUTING CANDIDATES</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BaseButton
            size="sm"
            variant="ghost"
            onClick={onCopyTensor}
            onMouseEnter={() => setInspectionText(copiedTensor ? "TENSOR VECTOR COPIED TO CLIPBOARD" : "COPY TENSOR VECTOR")}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText(copiedTensor ? "TENSOR VECTOR COPIED TO CLIPBOARD" : "COPY TENSOR VECTOR")}
            onBlur={() => setInspectionText(null)}
            aria-label="Copy Tensor Vector"
            className="px-2"
            icon={copiedTensor ? <Check size={14} className="text-[var(--skipo-success)]" /> : <Copy size={14} />}
          />
          <BaseButton
            size="sm"
            variant="secondary"
            onClick={onResetToBaseline}
            onMouseEnter={() => setInspectionText("RESET SPEC TO BASELINE DEFAULT")}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText("RESET SPEC TO BASELINE DEFAULT")}
            onBlur={() => setInspectionText(null)}
            aria-label="Reset to Baseline"
            className="px-2"
            icon={<RotateCcw size={14} />}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-1">
        {candidates.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--skipo-text-muted)]">
            No active candidates available.
          </div>
        ) : (
          candidates.map((c, idx) => (
            <div
              key={c.modelId}
              className={`p-2.5 rounded-lg flex items-center justify-between transition-all ${
                idx === 0
                  ? 'border-2 border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/15 text-[var(--skipo-text)] shadow-[var(--skipo-shadow-btn)]'
                  : 'border border-[var(--skipo-border-color)]/50 bg-[var(--skipo-matte-bg)] text-[var(--skipo-text)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[var(--skipo-text-muted)] w-4">
                  #{idx + 1}
                </span>
                <div>
                  <div className="font-bold text-xs text-[var(--skipo-text)]">
                    {c.modelName}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--skipo-text-muted)] uppercase">
                    {c.providerId}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-black text-[var(--skipo-accent)]">
                  {c.finalScore}/100
                </div>
                <div className="text-[9px] font-mono text-[var(--skipo-text-muted)]">
                  Base: {Math.round(c.breakdown?.baseScore ?? c.finalScore)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};