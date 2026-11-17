/**
 * @file ModelCardHeader.tsx
 * @description Header for AI Model Card displaying rank, provider badge, status, and name
 */

import React from 'react';
import { AlertOctagon, RefreshCw, Key } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import type { AIModelMeta } from './types.js';
import { getProviderIcon } from './providerIconHelper.js';

export interface ModelCardHeaderProps {
  model: AIModelMeta;
  rankIndex?: number;
  isTopMatch?: boolean;
  matchScore?: number;
  providerStatus?: 'online' | 'missing-key' | 'error';
  isUnavailable?: boolean;
  onRefreshRoute?: (modelId: string) => void;
  onOpenKeyManager?: (providerId?: string) => void;
}

export const ModelCardHeader: React.FC<ModelCardHeaderProps> = ({
  model: m,
  rankIndex,
  isTopMatch,
  matchScore,
  providerStatus,
  isUnavailable = false,
  onRefreshRoute,
  onOpenKeyManager,
}) => {
  const ProviderIcon = getProviderIcon(m.providerId);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {rankIndex !== undefined && !isUnavailable && (
            <span
              className={`px-1 py-0.5 rounded text-[9px] font-black tracking-tight uppercase border ${
                isTopMatch
                  ? 'bg-emerald-400 text-slate-950 border-emerald-600 shadow-sm'
                  : rankIndex < 3
                  ? 'bg-indigo-300 text-indigo-950 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-600'
              }`}
            >
              {isTopMatch ? '★ #1 MATCH' : `#${rankIndex + 1}`}
            </span>
          )}

          <span className="flex items-center gap-1 px-1 py-0.5 rounded border border-slate-700/50 bg-slate-200/80 dark:bg-slate-800/80 text-[8px] font-bold">
            <ProviderIcon size={9} />
            {m.providerId.toUpperCase()}
          </span>

          {providerStatus === 'missing-key' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpenKeyManager?.(m.providerId);
              }}
              title={`No API key configured for ${m.providerId.toUpperCase()}. Click to add.`}
              className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-600/50 text-[7.5px] font-bold cursor-pointer hover:bg-amber-500/40 transition-colors flex items-center gap-0.5"
            >
              <Key size={8} /> KEY NEEDED
            </span>
          )}
        </div>

        {matchScore !== undefined && !isUnavailable && (
          <div className="text-right shrink-0">
            <div
              className={`text-xs font-black leading-none ${
                isTopMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {matchScore}
            </div>
          </div>
        )}
      </div>

      {isUnavailable && (
        <div className="bg-rose-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded flex items-center justify-between gap-1 border border-rose-800 shadow-sm">
          <span className="flex items-center gap-1 truncate">
            <AlertOctagon size={10} className="shrink-0" /> ROUTE UNAVAILABLE
          </span>
          {onRefreshRoute && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRefreshRoute(m.id);
              }}
              title="Probe & refresh route status"
              className="bg-white/20 hover:bg-white/40 p-0.5 rounded shrink-0"
            >
              <RefreshCw size={9} />
            </BaseButton>
          )}
        </div>
      )}

      <h4
        className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 pt-0.5"
        title={m.name}
      >
        {m.name}
      </h4>
    </div>
  );
};
