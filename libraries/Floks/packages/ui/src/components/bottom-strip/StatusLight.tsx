'use client';
import React from 'react';
import { useBottomStrip } from './BottomStripContext.js';

export interface StatusLightProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'idle' | 'active' | 'saving' | 'saved' | 'error' | 'warning';
  label?: string;
  pulse?: boolean;
}

export const StatusLight: React.FC<StatusLightProps> = ({
  status = 'idle',
  label,
  pulse = false,
  className = '',
  ...props
}) => {
  const { setInspectionText } = useBottomStrip();
  const defaultLabels: Record<string, string> = {
    idle: 'STATUS: SYSTEM READY (IDLE)',
    active: 'STATUS: PROCESSING ACTIVE TASK',
    saving: 'STATUS: SAVING CHANGES TO DISK',
    saved: 'STATUS: ALL CHANGES SAVED',
    error: 'STATUS: SYSTEM ERROR DETECTED',
    warning: 'STATUS: SYSTEM WARNING',
  };

  const displayText = label || defaultLabels[status] || 'STATUS: UNKNOWN';

  const colorMap: Record<string, string> = {
    idle: 'var(--skipo-text-muted)',
    active: 'var(--skipo-info)',
    saving: 'var(--skipo-accent)',
    saved: 'var(--skipo-success)',
    error: 'var(--skipo-danger)',
    warning: 'var(--skipo-warning)',
  };

  const currentColor = colorMap[status];

  return (
    <span
      className={`skipo-status-light skipo-status-light--${status} ${pulse ? 'skipo-status-light--pulse' : ''} ${className}`}
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: currentColor,
        boxShadow: pulse ? `0 0 8px ${currentColor}` : undefined,
        cursor: 'default',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setInspectionText(displayText)}
      onMouseLeave={() => setInspectionText(null)}
      onFocus={() => setInspectionText(displayText)}
      onBlur={() => setInspectionText(null)}
      tabIndex={0}
      aria-label={displayText}
      {...props}
    />
  );
};

StatusLight.displayName = 'StatusLight';
