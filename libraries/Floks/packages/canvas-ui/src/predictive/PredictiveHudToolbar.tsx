import React from 'react';
import { ChevronLeft, ChevronRight, Zap, X, Sparkles } from 'lucide-react';

interface PredictiveHudToolbarProps {
  isActive: boolean;
  scenarioIndex: number;
  totalGhosts: number;
  selectedCount: number;
  onToggleActive: () => void;
  onNextScenario: () => void;
  onPrevScenario: () => void;
  onSolidifyAll: () => void;
  onClose: () => void;
}

export const PredictiveHudToolbar: React.FC<PredictiveHudToolbarProps> = ({
  isActive,
  scenarioIndex,
  totalGhosts,
  selectedCount,
  onToggleActive,
  onNextScenario,
  onPrevScenario,
  onSolidifyAll,
  onClose,
}) => {
  // If no nodes are selected, toolbar does not display
  if (selectedCount === 0) return null;

  // If node is selected but predictive mode is dormant: show unobtrusive quick-launch pill
  if (!isActive) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <button
          onClick={onToggleActive}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-cyan-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-mono tracking-wide shadow-lg backdrop-blur-md transition-all hover:scale-105 group"
          title="Press Ctrl+Tab or Cmd+Tab to view prospective ghost nodes"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform animate-pulse" />
          <span>Predictive Nodes</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-200">
            ⌘/Ctrl+Tab
          </span>
        </button>
      </div>
    );
  }

  // Active Predictive Mode HUD
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/95 border border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>PREDICTIVE ACTIVE</span>
        </div>

        {/* Cycle Navigation */}
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-full px-1 border border-slate-700">
          <button
            onClick={onPrevScenario}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Scenario (Shift+Tab)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-1.5 text-[11px] font-mono font-semibold text-cyan-200">
            Scenario #{scenarioIndex + 1}
          </span>

          <button
            onClick={onNextScenario}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Scenario (Tab)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global Icon-Only Solidify All Button */}
        {totalGhosts > 0 && (
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSolidifyAll();
            }}
            className="relative p-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-transform hover:scale-110 shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center cursor-pointer group"
            title={`Solidify all (${totalGhosts}) predicted nodes & wires`}
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition-transform animate-pulse" />
            <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-slate-950 text-cyan-300 border border-cyan-400 font-black text-[8px] flex items-center justify-center font-mono shadow-sm">
              {totalGhosts}
            </span>
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors ml-1"
          title="Exit Predictive Mode (Esc / ⌘+Tab)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Keyboard Shortcut Subtext */}
      <div className="text-[9px] font-mono text-cyan-300/80 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/20 backdrop-blur-sm">
        Tab: next scenario • Shift+Tab: prev • Click Solidify on node or ghost
      </div>
    </div>
  );
};
