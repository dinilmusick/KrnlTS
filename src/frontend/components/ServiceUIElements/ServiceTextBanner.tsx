/**
 * @file ServiceTextBanner.tsx
 * @description In-service informational and status banner for endpoint responses and alerts.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, Activity, X } from 'lucide-react';

export type BannerSeverity = 'info' | 'success' | 'warning' | 'danger' | 'telemetry';

export interface ServiceTextBannerProps {
  severity?: BannerSeverity;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  tags?: string[];
  onDismiss?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function ServiceTextBanner({
  severity = 'info',
  title,
  message,
  icon,
  tags,
  onDismiss,
  children,
  className = '',
}: ServiceTextBannerProps): React.ReactElement {
  const configs: Record<BannerSeverity, { border: string; bg: string; text: string; defaultIcon: React.ReactNode }> = {
    info: {
      border: 'border-blue-500/80',
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      defaultIcon: <Info className="w-4 h-4 text-blue-400" />,
    },
    success: {
      border: 'border-emerald-500/80',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      defaultIcon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
    warning: {
      border: 'border-amber-500/80',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      defaultIcon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    danger: {
      border: 'border-rose-500/80',
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      defaultIcon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    },
    telemetry: {
      border: 'border-purple-500/80',
      bg: 'bg-purple-950/40',
      text: 'text-purple-300',
      defaultIcon: <Activity className="w-4 h-4 text-purple-400" />,
    },
  };

  const current = configs[severity];

  return (
    <div
      className={`p-3 border-2 font-mono text-xs shadow-[2px_2px_0px_#000] relative ${current.border} ${current.bg} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 mt-0.5">{icon || current.defaultIcon}</span>
        <div className="space-y-1 flex-1 min-w-0">
          {title && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-black uppercase tracking-wide text-xs ${current.text}`}>
                {title}
              </span>
              {tags?.map((tag) => (
                <span key={tag} className="text-[9px] px-1 bg-black/40 border border-current text-neutral-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {message && <p className="text-[11px] text-neutral-200 leading-relaxed">{message}</p>}
          {children}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-white cursor-pointer shrink-0"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
