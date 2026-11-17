'use client';
import React from 'react';
import { useBottomStrip } from './BottomStripContext.js';

export interface ApiCallIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  activeCount?: number;
}

export const ApiCallIndicator: React.FC<ApiCallIndicatorProps> = ({
  activeCount,
  className = '',
  ...props
}) => {
  const { apiActivity, setInspectionText } = useBottomStrip();
  const count = activeCount !== undefined ? activeCount : apiActivity.activeCount;
  const isBusy = count > 0;

  const inspectionLabel = isBusy
    ? `API IN-FLIGHT: ${count} ACTIVE REQUEST(S)${apiActivity.lastEndpoint ? ` (${apiActivity.lastMethod || 'REQ'} ${apiActivity.lastEndpoint})` : ''}`
    : 'API NETWORK: IDLE (ZERO PENDING CALLS)';

  return (
    <span
      className={`skipo-api-indicator ${isBusy ? 'skipo-api-indicator--busy' : ''} ${className}`}
      onMouseEnter={() => setInspectionText(inspectionLabel)}
      onMouseLeave={() => setInspectionText(null)}
      onFocus={() => setInspectionText(inspectionLabel)}
      onBlur={() => setInspectionText(null)}
      tabIndex={0}
      aria-label={inspectionLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: isBusy ? 'var(--skipo-accent)' : 'var(--skipo-text-muted)',
        cursor: 'default',
        transition: 'color 0.2s ease',
      }}
      {...props}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: isBusy ? 'skipo-pulse-glow 1.5s infinite ease-in-out' : undefined
        }}
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      {isBusy && (
        <span style={{ fontSize: '10px', fontWeight: 900, fontFamily: 'var(--skipo-font-mono)' }}>
          {count}
        </span>
      )}
    </span>
  );
};

ApiCallIndicator.displayName = 'ApiCallIndicator';
