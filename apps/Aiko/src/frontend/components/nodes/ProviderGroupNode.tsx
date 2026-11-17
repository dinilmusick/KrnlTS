/**
 * ASCII Architecture Flowchart: ProviderGroupNode
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize ProviderGroupNode   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        ProviderGroupNode         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            activeKeys            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           totalCredits           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server, Key, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tooltip } from '../common/Tooltip.js';
import { ApiKeyEntry, ProviderId } from '../../types/app.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface ProviderNodeData {
  providerId: ProviderId;
  providerName: string;
  keys: ApiKeyEntry[];
  isPulsing: boolean;
}


// ════ PROVIDERGROUPNODE IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ProviderGroupNode: React.FC<{ data: ProviderNodeData }> = ({ data }) => {
  const activeKeys = data.keys.filter(k => k.status === 'active');
  const totalCredits = data.keys.reduce((sum, k) => sum + k.remainingCreditsUsd, 0);
  const avgLatency = data.keys.length > 0 ? Math.round(data.keys.reduce((sum, k) => sum + k.lastLatencyMs, 0) / data.keys.length) : 0;

  return (
    <div className={`relative px-4 py-3 rounded-xl border-2 border-slate-700 dark:border-slate-400 bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.8)] dark:shadow-[4px_4px_0px_0px_rgba(203,213,225,0.3)] min-w-[220px] transition-all ${data.isPulsing ? 'scale-105 ring-4 ring-emerald-400 dark:ring-emerald-500' : ''}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 border-slate-800 bg-emerald-400 rounded-full" 
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-800/30 pb-1.5">
          <div className="flex items-center gap-2">
            <Tooltip text={data.providerName}>
              <div className="p-1.5 rounded bg-emerald-200 dark:bg-emerald-900 border border-emerald-700/60">
                <Server size={18} />
              </div>
            </Tooltip>
            <span className="font-mono text-xs font-bold truncate max-w-[110px]">{data.providerName}</span>
          </div>

          <Tooltip text={`${activeKeys.length}/${data.keys.length} API Keys Active`}>
            <span className="flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900/60 border border-emerald-700/40">
              <Key size={13} />
              {activeKeys.length}
            </span>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between font-mono text-xs gap-2">
          <Tooltip text={`Total Provider Credits: $${totalCredits.toFixed(2)}`}>
            <span className="flex items-center gap-1">
              <DollarSign size={13} />
              ${totalCredits.toFixed(1)}
            </span>
          </Tooltip>

          <Tooltip text={`Average Ping Latency: ${avgLatency}ms`}>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {avgLatency}ms
            </span>
          </Tooltip>

          <Tooltip text={activeKeys.length > 0 ? "Provider Operational" : "No Active Keys"}>
            {activeKeys.length > 0 ? (
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  );
};