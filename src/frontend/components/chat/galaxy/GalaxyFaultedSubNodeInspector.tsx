/**
 * ASCII Architecture Flowchart: GalaxyFaultedSubNodeInspector
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Initialize GalaxyFaultedSubNodeInspector    │
 *   └──────────────────────────────────────────────┘
 */

import React from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { ApiKeyEntry } from '../../../../backend/types.js';
import { SubNode, StarNode } from './types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface GalaxyFaultedSubNodeInspectorProps {
  selectedSubNode: SubNode;
  keys: ApiKeyEntry[];
  nodes: StarNode[];
  onClose: () => void;
  onResetProbabilities: (node: StarNode) => void;
}

// ════ GALAXYFAULTEDSUBNODEINSPECTOR IMPLEMENTATION ════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const GalaxyFaultedSubNodeInspector: React.FC<GalaxyFaultedSubNodeInspectorProps> = ({
  selectedSubNode,
  keys,
  nodes,
  onClose,
  onResetProbabilities
}) => {
  const parentKey = keys.find(k => k.id === selectedSubNode.parentKeyId);
  const parentNode = nodes.find(n => n.id === selectedSubNode.parentKeyId);

  const failuresList = selectedSubNode.allFailures && selectedSubNode.allFailures.length > 0
    ? selectedSubNode.allFailures
    : [{
        modelId: selectedSubNode.modelId,
        failureCount: selectedSubNode.failureCount,
        penaltyPercent: selectedSubNode.penaltyPercent,
        lastFailedAt: selectedSubNode.lastFailedAt,
        lastError: selectedSubNode.lastError
      }];

  return (
    <div
      className="absolute top-2 right-2 bottom-2 w-[310px] max-w-[92%] p-3 rounded-xl border-2 border-rose-500/90 bg-slate-950/95 backdrop-blur-md text-slate-200 text-xs shadow-2xl z-30 flex flex-col font-mono overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="font-bold text-rose-400 flex items-center justify-between border-b border-rose-900/60 pb-2 shrink-0">
        <span className="flex items-center gap-1.5 text-[11px] truncate">
          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          <span className="truncate">FAULTED MODEL CLUSTER</span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold">
            {failuresList.length} ERRORED
          </span>
          <BaseButton
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </BaseButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-2 text-[11px] min-h-0">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
          <div className="text-slate-400 text-[10px]">PARENT API KEY:</div>
          <div className="font-bold text-slate-100 truncate text-[11px]">
            {parentKey?.label || selectedSubNode.parentKeyId}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-rose-300/90 uppercase tracking-wider flex items-center justify-between">
            <span>FAULTED ENDPOINTS:</span>
            <span className="text-[8.5px] text-slate-400">({failuresList.length})</span>
          </div>
          <div className="space-y-1.5">
            {failuresList.map((fm, idx) => (
              <div key={idx} className="p-2 rounded-lg border border-rose-900/70 bg-rose-950/40 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-white font-bold text-[10.5px] truncate">✕ {fm.modelId}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700 font-bold shrink-0">
                    -{fm.penaltyPercent}% prob
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>{fm.failureCount} fail(s)</span>
                  {fm.lastFailedAt && <span>{new Date(fm.lastFailedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {fm.lastError && (
                  <div className="text-[8.5px] text-rose-300/90 p-1 rounded bg-slate-950/70 border border-rose-900/40 italic break-words">
                    {fm.lastError}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-rose-900/60 pt-2 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between text-[9.5px] text-slate-400">
          <span>Circuit Breaker:</span>
          <span className="font-bold text-amber-300">Penalties Active</span>
        </div>
        {parentNode && (
          <BaseButton
            size="sm"
            variant="danger"
            onClick={() => {
              onResetProbabilities(parentNode);
              onClose();
            }}
            className="w-full py-1.5 text-[10px] font-bold flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={12} />
            <span>CLEAR FAULT PENALTIES</span>
          </BaseButton>
        )}
      </div>
    </div>
  );
};