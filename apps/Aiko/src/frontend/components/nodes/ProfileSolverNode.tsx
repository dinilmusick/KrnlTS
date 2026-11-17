/**
 * ASCII Architecture Flowchart: ProfileSolverNode
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize ProfileSolverNode   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        ProfileSolverNode         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Zap, ShieldAlert, Sliders } from 'lucide-react';
import { Tooltip } from '../common/Tooltip.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════


// ════ PROFILESOLVERNODE IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ProfileSolverNode: React.FC<{ data: { strategy: string; activeFailovers: number; isPulsing: boolean } }> = ({ data }) => {
  return (
    <div className={`relative px-4 py-3 rounded-xl border-2 border-slate-700 dark:border-slate-400 bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-100 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.8)] dark:shadow-[4px_4px_0px_0px_rgba(203,213,225,0.3)] transition-all ${data.isPulsing ? 'scale-105 ring-4 ring-indigo-400 dark:ring-indigo-500' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 border-slate-800 bg-indigo-400 rounded-full" 
      />

      <div className="flex items-center gap-3">
        <Tooltip text="Capability Profile Matching Engine">
          <div className="p-2 rounded-lg border border-indigo-800/60 bg-indigo-200/80 dark:bg-indigo-900/60">
            <Cpu size={22} className="stroke-[2.2]" />
          </div>
        </Tooltip>

        <div className="flex items-center gap-2 font-mono text-sm">
          <Tooltip text={`Rotation Strategy: ${data.strategy}`}>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-indigo-800/40 bg-indigo-200/50 dark:bg-indigo-900/40 text-xs font-bold">
              <Zap size={14} />
              {data.strategy.slice(0, 8)}
            </span>
          </Tooltip>

          <Tooltip text={`Total Failovers Handled: ${data.activeFailovers}`}>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-indigo-800/40 bg-indigo-200/50 dark:bg-indigo-900/40 text-xs font-bold">
              <ShieldAlert size={14} />
              {data.activeFailovers}
            </span>
          </Tooltip>

          <Tooltip text="Multidimensional Matcher">
            <div className="p-1 rounded bg-indigo-300/60 dark:bg-indigo-800/60">
              <Sliders size={16} />
            </div>
          </Tooltip>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 border-2 border-slate-800 bg-indigo-400 rounded-full" 
      />
    </div>
  );
};