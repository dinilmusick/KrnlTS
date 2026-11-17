/**
 * @file ModelCardFooter.tsx
 * @description Footer for AI Model Card displaying metrics and action controls
 */

import React from 'react';
import { Cpu, Zap, Activity, MessageSquare, Check, Play } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import type { AIModelMeta } from './types.js';

export interface ModelCardFooterProps {
  model: AIModelMeta;
  isSelectedForTest?: boolean;
  onSelectForTest?: (modelId: string, providerId: string) => void;
  onOpenChat?: (modelId: string, providerId: string) => void;
}

export const ModelCardFooter: React.FC<ModelCardFooterProps> = ({
  model: m,
  isSelectedForTest,
  onSelectForTest,
  onOpenChat,
}) => {
  return (
    <div className="space-y-1 pt-1 border-t border-slate-700/20 text-[8.5px] text-slate-500 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5" title="Intelligence Rating">
            <Cpu size={9} className="text-indigo-500" />
            {m.intelligenceRating ?? 85}
          </span>
          <span className="flex items-center gap-0.5" title="Tool Rating">
            <Zap size={9} className="text-amber-500" />
            {m.toolRating ?? 80}
          </span>
          <span className="flex items-center gap-0.5" title="Speed Rating">
            <Activity size={9} className="text-rose-500" />
            {m.speedRating ?? 90}
          </span>
        </div>

        <span className="font-bold">
          ${m.costPer1kInputUsd ?? m.inputCostPer1k ?? 0}/k
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 pt-0.5">
        <BaseButton
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChat?.(m.id, m.providerId);
          }}
          className="text-[8px] flex items-center gap-1 font-bold px-1.5 py-0.5"
          icon={<MessageSquare size={9} className="text-indigo-500" />}
        >
          CHAT
        </BaseButton>

        {onSelectForTest && (
          <BaseButton
            size="sm"
            variant={isSelectedForTest ? 'accent' : 'secondary'}
            onClick={(e) => {
              e.stopPropagation();
              onSelectForTest(m.id, m.providerId);
            }}
            className="p-1"
          >
            {isSelectedForTest ? <Check size={11} /> : <Play size={11} />}
          </BaseButton>
        )}
      </div>
    </div>
  );
};
