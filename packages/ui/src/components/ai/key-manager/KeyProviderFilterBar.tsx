/**
 * @file KeyProviderFilterBar.tsx
 * @description Filter tabs for filtering keys by provider with count badges
 */

import React from 'react';
import { getProviderIcon } from '../model-card/providerIconHelper.js';

export interface KeyProviderFilterBarProps {
  providers: string[];
  activeFilter?: string;
  onFilterChange: (providerId?: string) => void;
  counts?: Record<string, number>;
}

export const KeyProviderFilterBar: React.FC<KeyProviderFilterBarProps> = ({
  providers,
  activeFilter,
  onFilterChange,
  counts = {},
}) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
      <button
        type="button"
        onClick={() => onFilterChange(undefined)}
        className={`px-3 py-1 rounded-lg border font-bold transition-all ${
          !activeFilter
            ? 'bg-indigo-600 text-white border-indigo-700'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
        }`}
      >
        ALL ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>

      {providers.map((p) => {
        const Icon = getProviderIcon(p);
        const isSelected = activeFilter?.toLowerCase() === p.toLowerCase();
        const count = counts[p] ?? 0;

        return (
          <button
            key={p}
            type="button"
            onClick={() => onFilterChange(p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Icon size={12} />
            <span className="uppercase">{p}</span>
            {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
          </button>
        );
      })}
    </div>
  );
};
