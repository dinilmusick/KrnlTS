/**
 * @file SingleKeyCard.tsx
 * @description Single API key card showing key label, masked token, latency, and status actions
 */

import React from 'react';
import { Key, CheckCircle, AlertTriangle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import { getProviderIcon } from '../model-card/providerIconHelper.js';

export interface SingleKeyCardProps {
  id: string;
  providerId: string;
  label: string;
  keyMasked: string;
  status: 'active' | 'valid' | 'invalid' | 'rate-limited' | string;
  isActive: boolean;
  lastLatencyMs?: number;
  totalCalls?: number;
  onVerify?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

export const SingleKeyCard: React.FC<SingleKeyCardProps> = ({
  id,
  providerId,
  label,
  keyMasked,
  status,
  isActive,
  lastLatencyMs = 0,
  totalCalls = 0,
  onVerify,
  onDelete,
  onToggleActive,
}) => {
  const Icon = getProviderIcon(providerId);
  const isValid = status === 'active' || status === 'valid';

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
          <Icon size={16} className="text-indigo-500" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">{label}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-slate-400/40 bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              {providerId}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 tracking-wider pt-0.5">
            {keyMasked}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right text-[10px] text-slate-400">
          <div>{lastLatencyMs}ms</div>
          <div>{totalCalls} calls</div>
        </div>

        <div className="flex items-center gap-1">
          {isValid ? (
            <CheckCircle size={15} className="text-emerald-500" />
          ) : status === 'rate-limited' ? (
            <AlertTriangle size={15} className="text-amber-500" />
          ) : (
            <XCircle size={15} className="text-rose-500" />
          )}

          {onVerify && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={() => onVerify(id)}
              title="Verify Key"
              className="p-1 text-slate-500 hover:text-indigo-600"
            >
              <RefreshCw size={13} />
            </BaseButton>
          )}

          {onDelete && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={() => onDelete(id)}
              title="Delete Key"
              className="p-1 text-slate-500 hover:text-rose-600"
            >
              <Trash2 size={13} />
            </BaseButton>
          )}
        </div>
      </div>
    </div>
  );
};
