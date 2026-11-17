/**
 * ASCII Architecture Flowchart: ModelCard
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize ModelCard       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            ModelCard             │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { ModelCatalogEntry, ProviderId } from '../../../types/app.js';
import { CandidateStageBreakdown } from '../../../../backend/intelligence/types.js';
import { SigilRune } from '../intelligence/SigilRune.js';
import { ModelCardHeader } from './ModelCardHeader.js';
import { ModelCardFooter } from './ModelCardFooter.js';
export { getProviderIcon } from './providerIconHelper.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface ModelCardProps {
  model: ModelCatalogEntry;
  rankIndex?: number;
  isTopMatch?: boolean;
  matchScore?: number;
  matchBreakdown?: CandidateStageBreakdown;
  isSelectedForTest?: boolean;
  providerStatus?: 'online' | 'missing-key' | 'error';
  onSelectForTest?: (modelId: string, providerId: ProviderId) => void;
  onDoubleClick?: (modelId: string, providerId: ProviderId) => void;
  onOpenChat?: (modelId: string, providerId: ProviderId) => void;
  onRefreshRoute?: (modelId: string) => void;
  onOpenKeyManager?: (providerId?: ProviderId) => void;
}

// ════ MODELCARD IMPLEMENTATION ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ModelCard: React.FC<ModelCardProps> = ({
  model: m,
  rankIndex,
  isTopMatch,
  matchScore,
  isSelectedForTest,
  providerStatus,
  onSelectForTest,
  onDoubleClick,
  onOpenChat,
  onRefreshRoute,
  onOpenKeyManager
}) => {
  const spec = m.intelligenceSpec;
  const isUnavailable = m.status === 'currently_unavailable' || m.status === 'offline' || ((m.runtimeStats?.consecutiveRouteFailures ?? 0) >= 10);

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const chatFn = onOpenChat || onDoubleClick;
    if (chatFn && !isUnavailable) {
      chatFn(m.id, m.providerId);
    }
  };

  const categoryScores = spec ? {
    reasoning: Math.round(((spec.reasoning || 5) + (spec.planning || 5) + (spec.toolUsage || 5) + (spec.outputComplexity || 5)) / 4),
    coding: Math.round(((spec.coding || 5) + (spec.structuredOutput || 5) + (spec.jsonStrictness || 5) + (spec.determinism || 5)) / 4),
    data: Math.round(((spec.extraction || 5) + (spec.classification || 5) + (spec.summarization || 5) + (spec.context || 5)) / 4),
    modality: Math.round(((spec.creativity || 5) + (spec.vision || 5) + (spec.multimodal || 5)) / 3)
  } : {
    reasoning: Math.min(10, Math.round(m.intelligenceRating / 10)),
    coding: Math.min(10, Math.round(m.intelligenceRating / 10)),
    data: Math.min(10, Math.round(m.toolRating / 10)),
    modality: Math.min(10, Math.round(m.speedRating / 10))
  };

  const ringParams = [
    { name: 'Reasoning', value: categoryScores.reasoning, color: 'var(--skipo-accent, #d4af37)' },
    { name: 'Coding', value: categoryScores.coding, color: 'var(--skipo-success, #2a9d8f)' },
    { name: 'Data', value: categoryScores.data, color: 'var(--skipo-warning, #f59e0b)' },
    { name: 'Modality', value: categoryScores.modality, color: 'var(--skipo-accent-secondary, #ec4899)' }
  ];

  return (
    <div
      onDoubleClick={handleCardDoubleClick}
      title={isUnavailable ? 'Route currently unavailable due to repeat failures' : `Double click to chat with ${m.name}`}
      className={`p-3 rounded-xl border-2 font-mono text-xs flex flex-col justify-between relative transition-all duration-100 cursor-pointer select-none group min-h-[260px] ${
        isUnavailable
          ? 'opacity-60 grayscale filter border-slate-600 bg-slate-200/60 dark:bg-slate-900/60 shadow-none'
          : isTopMatch
          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-md'
          : isSelectedForTest
          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-md'
          : 'border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-sm hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md'
      }`}
    >
      <ModelCardHeader
        model={m}
        rankIndex={rankIndex}
        isTopMatch={isTopMatch}
        matchScore={matchScore}
        providerStatus={providerStatus}
        isUnavailable={isUnavailable}
        onRefreshRoute={onRefreshRoute}
        onOpenKeyManager={onOpenKeyManager}
      />

      {/* Center: Sigil-Based Intelligence Representation */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 py-2 relative group-hover:scale-105 transition-transform duration-200">
        <SigilRune
          sigilId={`model-sigil-${m.id}`}
          size="md"
          rings={ringParams}
          categoryScores={categoryScores}
          isDiamondLayout={true}
          intensityMultiplier={isTopMatch ? 1.3 : isSelectedForTest ? 1.1 : 0.85}
        />

        <div className="flex items-center gap-1 mt-1 text-[8px] font-extrabold font-mono">
          <span className="px-1 py-0.2 rounded bg-slate-200/90 dark:bg-slate-800/90 border border-slate-400/50 dark:border-slate-600/50 text-slate-700 dark:text-slate-300">
            {m.contextWindow >= 1000000 ? `${(m.contextWindow / 1000000).toFixed(1)}M` : `${(m.contextWindow / 1000).toFixed(0)}k`} ctx
          </span>
          <span className={`px-1 py-0.2 rounded border font-black ${m.isFree ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50'}`}>
            {m.isFree ? 'FREE' : 'PAID'}
          </span>
        </div>
      </div>

      <ModelCardFooter
        model={m}
        isSelectedForTest={isSelectedForTest}
        onSelectForTest={onSelectForTest}
        onOpenChat={onOpenChat || onDoubleClick}
      />
    </div>
  );
};