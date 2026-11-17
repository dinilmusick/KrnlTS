'use client';
import React, { forwardRef } from 'react';
import '../../styles/composite.css';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'syncing' | 'error';
  label?: string;
}

export const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(({
  status,
  label,
  className = '',
  ...props
}, ref) => {
  const colorMap = {
    online: 'var(--skipo-success)',
    offline: 'var(--skipo-text-muted)',
    syncing: 'var(--skipo-warning)',
    error: 'var(--skipo-danger)'
  };
  return (
    <div ref={ref} className={`skipo-status-indicator ${className}`} style={{display: 'flex', alignItems: 'center', gap: '6px'}} {...props}>
      <span className="skipo-status-dot" style={{ backgroundColor: colorMap[status] }} />
      {label && <span>{label}</span>}
    </div>
  );
});
StatusIndicator.displayName = 'StatusIndicator';
