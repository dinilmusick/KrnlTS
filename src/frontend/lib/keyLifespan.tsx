/**
 * ASCII Architecture Flowchart: keyLifespan
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize keyLifespan      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        getKeyLifespanInfo        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             isNvidia             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             baseTime             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ApiKeyEntry } from '../types/app.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface LifespanInfo {
  daysLeft: number;
  isExpired: boolean;
  isUrgent: boolean;
  isWarning: boolean;
  formattedDate: string;
  remainingText: string;
  fullSubscript: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}


// ════ KEYLIFESPAN IMPLEMENTATION ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function getKeyLifespanInfo(keyEntry?: Partial<ApiKeyEntry> | null): LifespanInfo | null {
  if (!keyEntry) return null;
  
  // NVIDIA NIM keys expire in 6 months by default, check expiresAt
  let expiresAt = keyEntry.expiresAt;
  const isNvidia = keyEntry.providerId === 'nvidia';

  if (!expiresAt && isNvidia) {
    // Fallback: 180 days from createdAt or now
    const baseTime = keyEntry.createdAt ? new Date(keyEntry.createdAt).getTime() : Date.now();
    expiresAt = new Date(baseTime + 180 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (!expiresAt) return null;

  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) return null;

  const now = Date.now();
  const diffMs = expTime - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isUrgent = daysLeft <= 14;
  const isWarning = daysLeft <= 30 && !isUrgent;

  const formattedDate = new Date(expTime).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  let remainingText = '';
  if (isExpired) {
    remainingText = 'Expired';
  } else if (daysLeft === 1) {
    remainingText = '1 day remaining';
  } else if (daysLeft < 30) {
    remainingText = `${daysLeft} days left`;
  } else {
    const months = Math.floor(daysLeft / 30);
    const remDays = daysLeft % 30;
    remainingText = remDays > 4 ? `${months}m ${remDays}d left (${daysLeft}d)` : `${months}m left (${daysLeft}d)`;
  }

  const prefix = isNvidia ? '6-mo token' : 'Token life';
  const fullSubscript = isExpired
    ? `${prefix} • EXPIRED on ${formattedDate}`
    : `${prefix} • Expires ${formattedDate} (${remainingText})`;

  let colorClass = 'text-emerald-600 dark:text-emerald-400';
  let bgClass = 'bg-emerald-50 dark:bg-emerald-950/60';
  let borderClass = 'border-emerald-500/30';

  if (isExpired || isUrgent) {
    colorClass = 'text-rose-600 dark:text-rose-400';
    bgClass = 'bg-rose-50 dark:bg-rose-950/60';
    borderClass = 'border-rose-500/40';
  } else if (isWarning) {
    colorClass = 'text-amber-600 dark:text-amber-400';
    bgClass = 'bg-amber-50 dark:bg-amber-950/60';
    borderClass = 'border-amber-500/40';
  }

  return {
    daysLeft,
    isExpired,
    isUrgent,
    isWarning,
    formattedDate,
    remainingText,
    fullSubscript,
    colorClass,
    bgClass,
    borderClass
  };
}

export const KeyLifespanSubscript: React.FC<{
  keyEntry?: Partial<ApiKeyEntry> | null;
  className?: string;
  compact?: boolean;
}> = ({ keyEntry, className = '', compact = false }) => {
  const info = getKeyLifespanInfo(keyEntry);
  if (!info) return null;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${info.bgClass} ${info.colorClass} ${info.borderClass} ${className}`}
        title={`Expiration: ${info.formattedDate} • ${info.remainingText}`}
      >
        <Clock size={10} className="shrink-0" />
        <span>{info.isExpired ? 'EXPIRED' : `${info.daysLeft}d left`}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 font-mono text-[9.5px] font-semibold tracking-tight ${info.colorClass} ${className}`}
      title={`Token Valid Until: ${info.formattedDate}`}
    >
      <Clock size={10} className="shrink-0" />
      <span>{info.fullSubscript}</span>
      {info.isUrgent && (
        <AlertTriangle size={10} className="text-rose-500 shrink-0 ml-0.5 animate-pulse" />
      )}
    </div>
  );
};