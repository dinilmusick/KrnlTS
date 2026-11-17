/**
 * ASCII Architecture Flowchart: ClientIngressNode
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize ClientIngressNode   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        ClientIngressNode         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, Activity, Globe } from 'lucide-react';
import { Tooltip } from '../common/Tooltip.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════


// ════ CLIENTINGRESSNODE IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ClientIngressNode: React.FC<{ data: { totalRequests: number; isPulsing: boolean } }> = ({ data }) => {
  return (
    <div className={`relative px-4 py-3 rounded-xl border-2 border-slate-700 dark:border-slate-400 bg-amber-100/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.8)] dark:shadow-[4px_4px_0px_0px_rgba(203,213,225,0.3)] transition-all ${data.isPulsing ? 'scale-105 ring-4 ring-amber-400 dark:ring-amber-500' : ''}`}>
      <div className="flex items-center gap-3">
        <Tooltip text="External App Client Ingress">
          <div className="p-2 rounded-lg border border-amber-800/60 bg-amber-200/80 dark:bg-amber-900/60">
            <Globe size={22} className="stroke-[2.2]" />
          </div>
        </Tooltip>
        
        <div className="flex items-center gap-2 font-mono text-sm">
          <Tooltip text={`Total Client Calls: ${data.totalRequests}`}>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-800/40 bg-amber-200/50 dark:bg-amber-900/40 text-xs font-bold">
              <Activity size={14} />
              {data.totalRequests}
            </span>
          </Tooltip>

          <Tooltip text="Active Network Connector">
            <div className="p-1 rounded bg-amber-300/60 dark:bg-amber-800/60">
              <Network size={16} />
            </div>
          </Tooltip>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 border-2 border-slate-800 bg-amber-400 rounded-full" 
      />
    </div>
  );
};