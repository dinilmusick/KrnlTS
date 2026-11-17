import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Trash2, Edit2, Check, X } from 'lucide-react';
import { BaseButton, BaseInput } from '../../base/index.js';
import type { ExistingKeyControlProps } from './contracts.js';

export const ExistingKeyControl: React.FC<ExistingKeyControlProps> = ({ providerKey, usageStats = [], onVerifyKey, onDeleteKey, onUpdateKeyLabel }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState('');
  const stats = usageStats.filter((item) => item.keyId === providerKey.id);
  const day = stats.reduce((sum, item) => sum + (item.dayCount ?? item.dailyCalls ?? 0), 0);
  const week = stats.reduce((sum, item) => sum + (item.weekCount ?? item.weeklyCalls ?? 0), 0);
  const month = stats.reduce((sum, item) => sum + (item.monthCount ?? item.monthlyCalls ?? 0), 0);

  return (
    <div className="flex items-center justify-between flex-1 gap-2">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <BaseInput value={label} onChange={(e) => setLabel(e.target.value)} className="p-1 text-[10px] w-32" autoFocus />
              <BaseButton size="sm" variant="success" onClick={() => { if (label.trim()) { onUpdateKeyLabel(providerKey.id, label.trim()); setEditing(false); } }} className="p-0.5"><Check size={10} /></BaseButton>
              <BaseButton size="sm" variant="danger" onClick={() => setEditing(false)} className="p-0.5"><X size={10} /></BaseButton>
            </div>
          ) : (
            <>
              <span className="text-[10px] text-slate-500 font-bold truncate">{providerKey.key ? `${providerKey.key.slice(0, 10)}...` : 'ENV'}</span>
              <BaseButton size="sm" variant="ghost" onClick={() => { setEditing(true); setLabel(providerKey.label); }} className="p-0.5"><Edit2 size={10} /></BaseButton>
            </>
          )}
          {providerKey.status === 'active' && <CheckCircle2 size={13} className="text-emerald-600" />}
          {providerKey.status === 'invalid' && <AlertTriangle size={13} className="text-rose-600" />}
          {providerKey.status === 'checking' && <span className="text-[9px] text-amber-500 animate-pulse">Verifying...</span>}
        </div>
        {providerKey.lifespan && <div className="text-[9px] text-slate-500">{providerKey.lifespan}</div>}
      </div>
      <div className="flex items-center gap-1 text-[9px] bg-slate-200/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/50">
        <span>{day}D</span><span>{week}W</span><span>{month}M</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <BaseButton size="sm" variant="secondary" aria-label="Re-verify key" onClick={() => onVerifyKey(providerKey.id)}><RefreshCw size={11} /></BaseButton>
        <BaseButton size="sm" variant="danger" aria-label="Delete key" onClick={() => onDeleteKey(providerKey.id)}><Trash2 size={11} /></BaseButton>
      </div>
    </div>
  );
};
