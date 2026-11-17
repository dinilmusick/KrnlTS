/**
 * ASCII Architecture Flowchart: ModelCardFooter
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize ModelCardFooter    │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Cpu, Zap, Activity, MessageSquare, Check, Play } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { Tooltip } from '../../common/Tooltip.js';
import { ModelCatalogEntry, ProviderId } from '../../../types/app.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface ModelCardFooterProps {
  model: ModelCatalogEntry;
  isSelectedForTest?: boolean;
  onSelectForTest?: (modelId: string, providerId: ProviderId) => void;
  onOpenChat?: (modelId: string, providerId: ProviderId) => void;
}

// ════ MODELCARDFOOTER IMPLEMENTATION ══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ModelCardFooter: React.FC<ModelCardFooterProps> = ({
  model: m,
  isSelectedForTest,
  onSelectForTest,
  onOpenChat
}) => {
  return (
    <div className="space-y-1 pt-1 border-t border-slate-700/20 text-[8.5px] text-slate-500 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5" title="Intelligence Rating">
            <Cpu size={9} className="text-indigo-500" />
            {m.intelligenceRating}
          </span>
          <span className="flex items-center gap-0.5" title="Tool Rating">
            <Zap size={9} className="text-amber-500" />
            {m.toolRating}
          </span>
          <span className="flex items-center gap-0.5" title="Speed Rating">
            <Activity size={9} className="text-rose-500" />
            {m.speedRating}
          </span>
        </div>

        <span className="font-bold">
          ${m.costPer1kInputUsd}/k
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 pt-0.5">
        <Tooltip text="Click to chat with model">
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
        </Tooltip>

        {onSelectForTest && (
          <Tooltip text={isSelectedForTest ? 'TARGET OVERRIDE ACTIVE (Click to deselect)' : 'SELECT DIRECT ROUTE TESTER TARGET'}>
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
          </Tooltip>
        )}
      </div>
    </div>
  );
};