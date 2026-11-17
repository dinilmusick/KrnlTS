/**
 * @file Badge.tsx
 * @description Theme-connected status badge component.
 * Uses Skipo status variables to automatically adapt to theme changes.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { ServiceStatus } from '@/libraries/types/srkl';

interface BadgeProps {
  status?: ServiceStatus | string;
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  children?: React.ReactNode;
}

export function Badge({ status, variant, children }: BadgeProps): React.ReactElement {
  const isSuccess = variant === 'success' || status === 'ONLINE' || status === 'ACTIVE' || status === 'SUCCESS';
  const isWarning = variant === 'warning' || status === 'DEGRADED' || status === 'SYNCING';
  const isDanger = variant === 'error' || status === 'OFFLINE' || status === 'FAILED' || status === 'UNAUTHENTICATED';
  const isInfo = variant === 'info';

  const getColorStyles = (): React.CSSProperties => {
    if (isSuccess) {
      return {
        borderColor: 'var(--skipo-success)',
        backgroundColor: 'var(--skipo-matte-bg)',
        color: 'var(--skipo-success)',
      };
    }
    if (isWarning) {
      return {
        borderColor: 'var(--skipo-warning)',
        backgroundColor: 'var(--skipo-matte-bg)',
        color: 'var(--skipo-warning)',
      };
    }
    if (isDanger) {
      return {
        borderColor: 'var(--skipo-danger)',
        backgroundColor: 'var(--skipo-matte-bg)',
        color: 'var(--skipo-danger)',
      };
    }
    if (isInfo) {
      return {
        borderColor: 'var(--skipo-info)',
        backgroundColor: 'var(--skipo-matte-bg)',
        color: 'var(--skipo-info)',
      };
    }
    return {
      borderColor: 'var(--skipo-border-color)',
      backgroundColor: 'var(--skipo-matte-bg)',
      color: 'var(--skipo-text-muted)',
    };
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border select-none"
      style={{
        borderRadius: 'var(--skipo-radius-sm)',
        ...getColorStyles(),
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children || status}
    </span>
  );
}
