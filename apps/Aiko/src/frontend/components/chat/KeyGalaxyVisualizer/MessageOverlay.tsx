import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { IconOnlyButton } from '@ultrst-armada/floks';
import { ExecutionEdge } from '../galaxy/executionTypes.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface MessageOverlayProps {
  edge: ExecutionEdge;
  onClose: () => void;
}

// ════ IMPLEMENTATION ═════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const MessageOverlay: React.FC<MessageOverlayProps> = ({ edge, onClose }) => {
  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      className="absolute inset-0 bg-slate-950/95 border border-slate-800 rounded-2xl flex flex-col p-4 z-50 overflow-hidden overscroll-contain select-text text-slate-300 font-mono text-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
          <HelpCircle size={13} />
          <span>MESSAGE TRANSMISSION INSIGHTS</span>
        </span>
        <IconOnlyButton
          icon={<X size={15} />}
          onClick={onClose}
          aria-label="Close"
          label="Close"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px] overscroll-contain">
        <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-2 rounded-lg border border-slate-850">
          <div>
            <div className="text-slate-400 font-bold uppercase text-[9px]">Sender</div>
            <div className="font-mono text-white text-[10px]">{edge.source}</div>
          </div>
          <div>
            <div className="text-slate-400 font-bold uppercase text-[9px]">Recipient</div>
            <div className="font-mono text-white text-[10px]">{edge.target}</div>
          </div>
        </div>

        {edge.metadata?.task && (
          <div className="space-y-1">
            <div className="text-cyan-400 font-bold uppercase text-[9px]">Assigned Task</div>
            <div className="p-2 rounded bg-cyan-950/20 border border-cyan-900/40 text-slate-100 font-bold">
              {edge.metadata.task.instruction}
            </div>
          </div>
        )}

        {edge.metadata?.result && (
          <div className="space-y-1">
            <div className="text-emerald-400 font-bold uppercase text-[9px]">Execution Output</div>
            <pre className="p-2 rounded bg-slate-900/90 border border-slate-800 overflow-x-auto text-[10px] max-h-[110px] text-emerald-300 font-mono">
              {JSON.stringify(edge.metadata.result, null, 2)}
            </pre>
          </div>
        )}

        {edge.metadata?.error && (
          <div className="space-y-1">
            <div className="text-rose-400 font-bold uppercase text-[9px]">Execution Error</div>
            <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 space-y-1">
              <div className="text-white font-bold font-mono">
                Code: {edge.metadata.error.code || 'UNKNOWN_ERROR'}
              </div>
              <div className="text-rose-200">{edge.metadata.error.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
