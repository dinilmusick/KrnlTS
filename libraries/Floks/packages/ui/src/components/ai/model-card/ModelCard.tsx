/**
 * @file ModelCard.tsx
 * @description Master reusable AI Model Card component
 */

import React from 'react';
import type { AIModelMeta } from './types.js';
import { ModelCardHeader } from './ModelCardHeader.js';
import { ModelCardFooter } from './ModelCardFooter.js';

export interface ModelCardProps {
  model: AIModelMeta;
  rankIndex?: number;
  isTopMatch?: boolean;
  matchScore?: number;
  isSelectedForTest?: boolean;
  providerStatus?: 'online' | 'missing-key' | 'error';
  isUnavailable?: boolean;
  onSelectForTest?: (modelId: string, providerId: string) => void;
  onDoubleClick?: (modelId: string, providerId: string) => void;
  onOpenChat?: (modelId: string, providerId: string) => void;
  onRefreshRoute?: (modelId: string) => void;
  onOpenKeyManager?: (providerId?: string) => void;
  visualSlot?: React.ReactNode;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model: m,
  rankIndex,
  isTopMatch,
  matchScore,
  isSelectedForTest,
  providerStatus,
  isUnavailable = false,
  onSelectForTest,
  onDoubleClick,
  onOpenChat,
  onRefreshRoute,
  onOpenKeyManager,
  visualSlot,
}) => {
  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const chatFn = onOpenChat || onDoubleClick;
    if (chatFn && !isUnavailable) {
      chatFn(m.id, m.providerId);
    }
  };

  return (
    <div
      onDoubleClick={handleCardDoubleClick}
      title={isUnavailable ? 'Route currently unavailable' : `Double click to chat with ${m.name}`}
      className={`p-3 rounded-xl border-2 font-mono text-xs flex flex-col justify-between relative transition-all duration-100 cursor-pointer select-none group min-h-[220px] ${
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

      {/* Visual / Sigil / Diagram Slot */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 py-2 relative">
        {visualSlot ? (
          visualSlot
        ) : (
          <div className="w-12 h-12 rounded-full border border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400">
            AI
          </div>
        )}

        <div className="flex items-center gap-1 mt-1 text-[8px] font-extrabold font-mono">
          <span className="px-1 py-0.5 rounded bg-slate-200/90 dark:bg-slate-800/90 border border-slate-400/50 dark:border-slate-600/50 text-slate-700 dark:text-slate-300">
            {m.contextWindow && m.contextWindow >= 1000000
              ? `${(m.contextWindow / 1000000).toFixed(1)}M`
              : m.contextWindow
              ? `${(m.contextWindow / 1000).toFixed(0)}k`
              : '128k'}{' '}
            ctx
          </span>
          <span
            className={`px-1 py-0.5 rounded border font-black ${
              m.isFree
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50'
            }`}
          >
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
