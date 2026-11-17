/**
 * ASCII Architecture Flowchart: GalaxyHoverTooltip
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize GalaxyHoverTooltip  │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ApiKeyEntry } from '../../../../backend/types.js';
import { SubNode, StarNode } from './types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface GalaxyHoverTooltipProps {
  hoveredSubNode: SubNode | null;
  hoveredNode: StarNode | null;
  keys: ApiKeyEntry[];
}

// ════ GALAXYHOVERTOOLTIP IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const GalaxyHoverTooltip: React.FC<GalaxyHoverTooltipProps> = ({
  hoveredSubNode,
  hoveredNode,
  keys
}) => {
  if (hoveredSubNode) {
    const parentKey = keys.find(k => k.id === hoveredSubNode.parentKeyId);
    const failuresList = hoveredSubNode.allFailures && hoveredSubNode.allFailures.length > 0
      ? hoveredSubNode.allFailures
      : [{
          modelId: hoveredSubNode.modelId,
          failureCount: hoveredSubNode.failureCount,
          penaltyPercent: hoveredSubNode.penaltyPercent,
          lastFailedAt: hoveredSubNode.lastFailedAt,
          lastError: hoveredSubNode.lastError
        }];

    return (
      <div className="absolute top-3 right-3 p-3 rounded-xl border-2 border-rose-500/90 bg-slate-950/95 backdrop-blur-md text-slate-200 text-[10px] space-y-2 shadow-xl pointer-events-none z-20 w-[300px] max-h-[380px] overflow-y-auto">
        <div className="font-bold text-rose-400 flex items-center justify-between border-b border-rose-900/60 pb-1.5">
          <span className="flex items-center gap-1.5 text-[11px]">
            <AlertTriangle size={13} className="text-rose-400 shrink-0" />
            <span>FAULTED CLUSTER</span>
          </span>
          <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-700 font-bold">
            {failuresList.length} ERRORED
          </span>
        </div>

        <div className="text-[10px] text-slate-300">
          <span className="text-slate-400">Parent Key:</span>{' '}
          <span className="font-bold text-slate-200">{parentKey?.label || hoveredSubNode.parentKeyId}</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="text-[9px] font-bold text-rose-300/80 uppercase tracking-wider">Faulted Endpoints:</div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
            {failuresList.map((fm, idx) => (
              <div key={idx} className="p-1.5 rounded-lg border border-rose-900/70 bg-rose-950/40 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-white font-bold text-[10px] truncate">✕ {fm.modelId}</span>
                  <span className="text-[8.5px] px-1 py-0.2 rounded bg-rose-900/80 text-rose-200 border border-rose-700/80 font-bold shrink-0">
                    -{fm.penaltyPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] text-slate-400">
                  <span>{fm.failureCount} fail(s)</span>
                  {fm.lastFailedAt && <span>{new Date(fm.lastFailedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {fm.lastError && (
                  <div className="text-[8px] text-rose-300/80 line-clamp-1 italic">{fm.lastError}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hoveredNode) {
    return (
      <div className="absolute top-3 right-3 p-3 rounded-lg border-2 border-slate-700 bg-slate-900/95 backdrop-blur-md text-slate-200 text-[10px] space-y-1 shadow-lg pointer-events-none z-10 max-w-[260px]">
        <div className="font-bold text-teal-400 flex items-center justify-between border-b border-slate-800 pb-1">
          <span>STAR KEY NODE</span>
          <span className="uppercase text-[9px] px-1 rounded bg-slate-800 border border-slate-700" style={{ color: hoveredNode.baseColor }}>
            {hoveredNode.providerId}
          </span>
        </div>
        <div className="font-mono truncate font-bold text-white">{hoveredNode.label}</div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Calls:</span>
          <span className="font-bold text-emerald-400">{hoveredNode.totalCalls}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Avg Latency:</span>
          <span className="font-bold text-amber-300">{hoveredNode.latencyMs ? `${hoveredNode.latencyMs}ms` : '35ms'}</span>
        </div>
      </div>
    );
  }

  return null;
};