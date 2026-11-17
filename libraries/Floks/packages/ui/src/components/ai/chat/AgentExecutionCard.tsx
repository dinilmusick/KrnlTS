/**
 * @file AgentExecutionCard.tsx
 * @description Card showing an agent's reasoning, tool execution, status, and latency
 */

import React from 'react';
import { Terminal, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export interface AgentExecutionCardProps {
  agentName: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  toolName?: string;
  durationMs?: number;
  outputPreview?: string;
}

export const AgentExecutionCard: React.FC<AgentExecutionCardProps> = ({
  agentName,
  status,
  toolName,
  durationMs,
  outputPreview,
}) => {
  return (
    <div className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 font-mono text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-500" />
          <span className="font-bold text-slate-800 dark:text-slate-200">{agentName}</span>
          {toolName && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {toolName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {durationMs !== undefined && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock size={10} />
              {durationMs}ms
            </span>
          )}
          {status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
          {status === 'failed' && <AlertCircle size={14} className="text-rose-500" />}
          {status === 'running' && (
            <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          )}
        </div>
      </div>

      {outputPreview && (
        <pre className="p-2 rounded bg-slate-900 text-slate-100 text-[10.5px] overflow-x-auto max-h-24">
          {outputPreview}
        </pre>
      )}
    </div>
  );
};
