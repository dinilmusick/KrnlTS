/**
 * ASCII Architecture Flowchart: MetricsView
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize MetricsView      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           MetricsView            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Activity, ShieldAlert, Clock, CheckCircle2, AlertCircle, BarChart2, Database, Key } from 'lucide-react';
import { NeoViewContainer } from '../common/NeoViewContainer.js';
import { Tooltip } from '../common/Tooltip.js';
import { RequestLogEntry, KeyModelUsageStats } from '../../types/app.js';
import { BrainNerveGraph } from './metrics/BrainNerveGraph.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface MetricsViewProps {
  onCloseToGraph: () => void;
  logs: RequestLogEntry[];
  summary: {
    totalRequests: number;
    successRatePercent: number;
    averageLatencyMs: number;
    totalFailovers: number;
  };
  usageStats?: KeyModelUsageStats[];
}


// ════ METRICSVIEW IMPLEMENTATION ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const MetricsView: React.FC<MetricsViewProps> = ({ onCloseToGraph, logs, summary, usageStats = [] }) => {
  return (
    <NeoViewContainer titleIcon={Activity} onCloseToGraph={onCloseToGraph}>
      {/* 2.5D Brain Synaptic Traffic Visual Map */}
      <BrainNerveGraph logs={logs} />

      {/* Top Summary Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-lg border-2 border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] opacity-70">Requests</div>
          <div className="text-base font-bold">{summary.totalRequests}</div>
        </div>

        <div className="p-3 rounded-lg border-2 border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] opacity-70">Success</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{summary.successRatePercent}%</div>
        </div>

        <div className="p-3 rounded-lg border-2 border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] opacity-70">Avg Latency</div>
          <div className="text-base font-bold">{summary.averageLatencyMs}ms</div>
        </div>

        <div className="p-3 rounded-lg border-2 border-slate-700 bg-slate-200/60 dark:bg-slate-800/60 text-center">
          <div className="text-[10px] opacity-70">Failovers</div>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">{summary.totalFailovers}</div>
        </div>
      </div>

      {/* Key & Model Call Count Analytics Panel */}
      <div className="p-4 rounded-xl border-2 border-slate-700 bg-slate-100/90 dark:bg-slate-900/90 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700/30 pb-2">
          <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
            <BarChart2 size={16} />
            <span>PERSISTENT KEY & MODEL USAGE STATS</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Database size={12} />
            <span>SQLITE STORED</span>
          </div>
        </div>

        {usageStats.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs border border-dashed border-slate-700/60 rounded-lg">
            <Tooltip text="Inference requests in Chat or Playground will generate usage records">
              <span>NO_USAGE_RECORDS</span>
            </Tooltip>
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/40 text-[10px] text-slate-500 uppercase">
                  <th className="py-1 px-2">Key ID</th>
                  <th className="py-1 px-2">Model ID</th>
                  <th className="py-1 px-2 text-center text-emerald-600 dark:text-emerald-400">Daily</th>
                  <th className="py-1 px-2 text-center text-cyan-600 dark:text-cyan-400">Weekly</th>
                  <th className="py-1 px-2 text-center text-purple-600 dark:text-purple-400">Monthly</th>
                  <th className="py-1 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {usageStats.map((stat, idx) => (
                  <tr key={`${stat.keyId}-${stat.modelId}-${idx}`} className="border-b border-slate-700/20 hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                    <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Key size={12} className="text-amber-500 shrink-0" />
                      <span className="truncate max-w-[120px]">{stat.keyId}</span>
                    </td>
                    <td className="py-1.5 px-2 font-bold text-indigo-600 dark:text-indigo-400">{stat.modelId}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 rounded">{stat.dayCount}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-950/40 rounded">{stat.weekCount}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-950/40 rounded">{stat.monthCount}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-slate-700 dark:text-slate-300">{stat.totalCount ?? stat.totalRequests ?? stat.allTimeCalls ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outbound Logs List */}
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-lg border-2 border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 font-mono text-xs space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tooltip text={log.statusCode === 200 ? "HTTP 200 OK" : `HTTP Error ${log.statusCode}`}>
                  {log.statusCode === 200 ? (
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />
                  )}
                </Tooltip>

                <span className="font-bold text-slate-900 dark:text-slate-100">{log.selectedModel || log.modelId}</span>

                <Tooltip text={`Provider: ${log.selectedProvider || log.providerId}`}>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 border border-slate-600 text-[10px]">
                    {log.selectedProvider || log.providerId}
                  </span>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Tooltip text={`Latency: ${log.latencyMs}ms`}>
                  <span className="flex items-center gap-0.5"><Clock size={12} /> {log.latencyMs}ms</span>
                </Tooltip>

                {log.failoverOccurred && (
                  <Tooltip text={`Failover Chain: ${(log.failoverChain || []).join(' -> ')}`}>
                    <span className="flex items-center gap-0.5 px-1 rounded bg-indigo-200 text-indigo-950 font-bold">
                      <ShieldAlert size={12} /> FAILOVER
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              "{log.promptSnippet}"
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/20">
              <span>{log.clientIp}</span>
              <span>Tokens: {log.tokensUsed}</span>
            </div>
          </div>
        ))}
      </div>
    </NeoViewContainer>
  );
};