export * from './types.js';
import type {PredictiveGhostNodeCardProps} from './types.js';
import React from 'react';
import {Zap} from 'lucide-react';

export const PredictiveGhostNodeCard: React.FC<PredictiveGhostNodeCardProps> = ({
  ghost, screenPos, zoom, onSolidify, isHovered = false, onHoverChange,
}) => {
  const node = ghost.prototypeNode;
  const inputs = Array.isArray(node.inputs) ? node.inputs : [];
  const outputs = Array.isArray(node.outputs) ? node.outputs : [];
  const scale = Math.max(0.65, Math.min(1.15, zoom));
  return (
    <div
      style={{
        position: 'absolute', left: screenPos.x, top: screenPos.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
      className="pointer-events-auto z-30 select-none"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div
        className={`relative w-[170px] min-h-[76px] rounded-lg bg-slate-950/70 backdrop-blur-md border-2 border-dashed border-cyan-400/70 p-2 flex flex-col items-center justify-center ${isHovered ? 'border-cyan-200 shadow-[0_0_30px_rgba(56,189,248,0.5)]' : 'shadow-[0_0_18px_rgba(56,189,248,0.25)]'}`}
      >
        <div className="w-full flex items-center justify-between pb-1 border-b border-cyan-500/20 text-[8px] font-mono text-cyan-300/80">
          <span className="font-extrabold uppercase truncate max-w-[120px]">{node.name || ghost.label}</span>
          <span>[${ghost.candidateIndex + 1}/${ghost.totalCandidates}]</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-cyan-200 mt-2 truncate max-w-[140px]">{ghost.label}</span>
        <span className="text-[8px] font-mono text-cyan-400/60">{ghost.badge} · {node.type}</span>

        {inputs.map((socket, idx) => {
          const local = {x: -82, y: ((idx + 1) * 56) / (inputs.length + 1) - 28};
          return <span key={socket.id} style={{left: `calc(50% + ${local.x}px)`, top: `calc(50% + ${local.y}px)`}} className="absolute w-2.5 h-2.5 rounded-full border bg-cyan-950 border-cyan-500/60" title={`Input: ${socket.label}`} />;
        })}
        {outputs.map((socket, idx) => {
          const local = {x: 82, y: ((idx + 1) * 56) / (outputs.length + 1) - 28};
          return <span key={socket.id} style={{left: `calc(50% + ${local.x}px)`, top: `calc(50% + ${local.y}px)`}} className="absolute w-2.5 h-2.5 rounded-full border bg-cyan-950 border-cyan-500/60" title={`Output: ${socket.label}`} />;
        })}

        <button
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSolidify(ghost); }}
          className="absolute -top-3 -right-3 z-40 w-7 h-7 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-900 hover:text-white hover:border-cyan-200 hover:scale-125 shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center transition-all cursor-pointer"
          title={`Solidify ${ghost.label}`}
        >
          <Zap className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
