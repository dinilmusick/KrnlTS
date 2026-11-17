/**
 * ASCII Architecture Flowchart: KeyModelVerificationSuite
 *
 *   ┌──────────────────────────────────────────┐
 *   │  Initialize KeyModelVerificationSuite    │
 *   └──────────────────────────────────────────┘
 */

import React from 'react';
import { BaseButton } from '@ultrst-armada/floks';
import { Tooltip } from '../../common/Tooltip.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface ModelCheckResultItem {
  modelId: string;
  name: string;
  status: 'working' | 'failed';
  error?: string;
  latencyMs?: number;
}

export interface KeyModelVerificationSuiteProps {
  keyId: string;
  onHide: () => void;
  results?: ModelCheckResultItem[];
  failedModels?: Array<{ modelId: string; failureCount: number; lastError?: string; penaltyPercent?: number }>;
  isExpanded?: boolean;
}

// ════ KEYMODELVERIFICATIONSUITE IMPLEMENTATION ════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const KeyModelVerificationSuite: React.FC<KeyModelVerificationSuiteProps> = ({
  onHide,
  results,
  failedModels,
  isExpanded = true
}) => {
  if (!isExpanded) return null;

  return (
    <div className="p-2.5 rounded-lg border border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 font-mono text-[11px] space-y-1.5 shadow-inner">
      <div className="flex items-center justify-between font-bold border-b border-slate-700/30 pb-1 text-[10px] text-slate-500">
        <span>MODEL VERIFICATION SUITE</span>
        <BaseButton
          size="sm"
          variant="ghost"
          onClick={onHide}
          className="text-rose-500 font-bold text-[9px] uppercase p-0.5"
        >
          [Hide]
        </BaseButton>
      </div>

      {results && results.length > 0 ? (
        <div className="space-y-1">
          {results.map((m, idx) => (
            <div key={`manual-${m.modelId}-${idx}`} className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
              <span className="font-bold flex items-center gap-1.5 truncate">
                <span className={m.status === 'working' ? 'text-emerald-500 font-black' : 'text-rose-500 font-black'}>
                  {m.status === 'working' ? '●' : '▲'}
                </span>
                {m.name || m.modelId}
              </span>
              <span className="text-[10px] shrink-0 text-slate-400 flex items-center gap-1">
                {m.status === 'working' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                    WORKING {m.latencyMs ? `(${m.latencyMs}ms)` : ''}
                  </span>
                ) : (
                  <Tooltip text={m.error || 'Testing error occurred'}>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20 cursor-help max-w-[200px] truncate">
                      FAILED: {m.error || 'Unknown Error'}
                    </span>
                  </Tooltip>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : failedModels && failedModels.length > 0 ? (
        <div className="space-y-1">
          {failedModels.map((f, idx) => (
            <div key={`fail-${f.modelId}-${idx}`} className="flex items-center justify-between gap-2 p-1 rounded bg-rose-500/5 border border-rose-500/10">
              <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
                <span>▲</span> {f.modelId}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                <span className="font-bold bg-rose-500 text-slate-950 px-1 py-0.2 rounded text-[9px]">
                  PENALTY: {f.penaltyPercent}%
                </span>
                <Tooltip text={f.lastError || 'Unknown connection failure'}>
                  <span className="text-slate-400 border border-slate-700 bg-slate-900/40 px-1 py-0.2 rounded cursor-help">
                    FAILS: {f.failureCount}
                  </span>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-400 p-2 text-center text-[10px] italic">
          No models tested or failures recorded for this key yet. Click the verify button above to run checks.
        </div>
      )}
    </div>
  );
};