/**
 * @file AIModelPicker.tsx
 * @description Compact dropdown / modal model selector for Chat and Prompt interfaces
 */

import React, { useState } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import type { AIModelMeta } from '../model-card/types.js';
import { getProviderIcon } from '../model-card/providerIconHelper.js';

export interface AIModelPickerProps {
  models: AIModelMeta[];
  selectedModelId?: string;
  onSelectModel: (model: AIModelMeta) => void;
  className?: string;
}

export const AIModelPicker: React.FC<AIModelPickerProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = models.find((m) => m.id === selectedModelId) || models[0];
  const CurrentIcon = current ? getProviderIcon(current.providerId) : Sparkles;

  return (
    <div className={`relative inline-block text-left font-mono text-xs ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 font-bold shadow-sm"
      >
        <CurrentIcon size={13} className="text-indigo-500" />
        <span className="truncate max-w-[140px]">{current ? current.name : 'Select Model'}</span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 max-h-60 overflow-y-auto">
          {models.map((m) => {
            const Icon = getProviderIcon(m.providerId);
            const isSelected = m.id === current?.id;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectModel(m);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : ''
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate font-semibold">{m.name}</span>
                </div>
                {isSelected && <Check size={13} className="text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
