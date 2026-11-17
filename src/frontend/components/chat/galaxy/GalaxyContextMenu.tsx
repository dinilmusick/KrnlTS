/**
 * ASCII Architecture Flowchart: GalaxyContextMenu
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize GalaxyContextMenu   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │    Render Context Menu UI        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCcw,
  Search,
  CheckCircle2,
  Ban
} from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { StarNode, ContextMenuState } from './types.js';

export interface GalaxyContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onSelectModelNode: (node: StarNode) => void;
  onSetAsNextKey: (node: StarNode) => void;
  onSetPermanentKey: (node: StarNode) => void;
  onExploreKey: (node: StarNode) => void;
  onResetProbabilities: (node: StarNode) => void;
  onDisableKey: (node: StarNode) => void;
}

export const GalaxyContextMenu: React.FC<GalaxyContextMenuProps> = ({
  contextMenu,
  onSetAsNextKey,
  onSetPermanentKey,
  onExploreKey,
  onResetProbabilities,
  onDisableKey
}) => {
  const { node } = contextMenu;

  return (
    <div
      style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
      className="fixed z-50 min-w-[240px] p-2 rounded-xl border-2 border-teal-500/90 bg-slate-950/95 backdrop-blur-md text-slate-100 shadow-2xl font-mono text-xs select-none overscroll-contain"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-slate-800 mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles size={13} className="text-cyan-400 shrink-0 animate-pulse" />
          <span className="font-black text-[11px] text-slate-200 truncate">{node.label}</span>
        </div>
        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300">
          {node.providerId}
        </span>
      </div>

      <div className="space-y-1">
        <BaseButton
          size="sm"
          variant="ghost"
          onClick={() => onSetAsNextKey(node)}
          className="w-full text-left px-2.5 py-2 flex items-center justify-between text-amber-300"
        >
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-amber-400 shrink-0" />
            <span>SET AS NEXT</span>
          </div>
          {node.isNext && !node.isPermanent && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">PRIMED</span>
          )}
        </BaseButton>

        <BaseButton
          size="sm"
          variant="ghost"
          onClick={() => onSetPermanentKey(node)}
          className="w-full text-left px-2.5 py-2 flex items-center justify-between text-yellow-300"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-yellow-400 shrink-0" />
            <span>{node.isPermanent ? 'UNSET PERMANENT' : 'USE PERMANENT'}</span>
          </div>
          {node.isPermanent && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-yellow-500/30 text-yellow-300 border border-yellow-500/40">LOCKED</span>
          )}
        </BaseButton>

        <BaseButton
          size="sm"
          variant="ghost"
          onClick={() => onExploreKey(node)}
          className="w-full text-left px-2.5 py-2 flex items-center gap-2 text-cyan-300"
        >
          <Search size={15} className="text-cyan-400 shrink-0" />
          <span>EXPLORE KEY</span>
        </BaseButton>

        <BaseButton
          size="sm"
          variant="ghost"
          onClick={() => onResetProbabilities(node)}
          className="w-full text-left px-2.5 py-2 flex items-center justify-between text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={15} className="text-emerald-400 shrink-0" />
            <span>RESET PROBABILITIES</span>
          </div>
          {node.failedModels && node.failedModels.length > 0 && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
              {node.failedModels.length} FAILS
            </span>
          )}
        </BaseButton>

        <BaseButton
          size="sm"
          variant="ghost"
          onClick={() => onDisableKey(node)}
          className={`w-full text-left px-2.5 py-2 flex items-center gap-2 ${
            node.isFailed ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {node.isFailed ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> : <Ban size={15} className="text-rose-400 shrink-0" />}
          <span>{node.isFailed ? 'ENABLE KEY' : 'DISABLE KEY'}</span>
        </BaseButton>
      </div>
    </div>
  );
};

export default GalaxyContextMenu;
