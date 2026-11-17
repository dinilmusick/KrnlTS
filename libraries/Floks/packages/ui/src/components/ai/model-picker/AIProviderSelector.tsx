/**
 * @file AIProviderSelector.tsx
 * @description Provider badge selector bar for filtering or selecting active AI provider
 */

import React from 'react';
import { getProviderIcon } from '../model-card/providerIconHelper.js';

export interface AIProviderSelectorProps {
  providers: string[];
  selectedProvider?: string;
  onSelectProvider: (providerId: string) => void;
  className?: string;
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  providers,
  selectedProvider,
  onSelectProvider,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {providers.map((p) => {
        const Icon = getProviderIcon(p);
        const isSelected = selectedProvider?.toLowerCase() === p.toLowerCase();

        return (
          <button
            key={p}
            type="button"
            onClick={() => onSelectProvider(p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all border ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <Icon size={12} />
            <span className="uppercase">{p}</span>
          </button>
        );
      })}
    </div>
  );
};
