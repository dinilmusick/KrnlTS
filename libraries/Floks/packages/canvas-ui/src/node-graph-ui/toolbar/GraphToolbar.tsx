'use client';
import type React from 'react';
import type { GraphSettings } from '@floks/contracts';

export interface GraphToolbarProps {
  settings: GraphSettings;
  onUpdateSettings: (updates: Partial<GraphSettings>) => void;
  onRefreshTraces: () => void;
  onLockAllConnections: () => void;
  onSaveView?: () => void;
  onLoadView?: () => void;
  className?: string;
}

export function GraphToolbar({
  settings,
  onUpdateSettings,
  onRefreshTraces,
  onLockAllConnections,
  onSaveView,
  onLoadView,
  className = ''
}: GraphToolbarProps) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--skipo-accent, #d4af37)' : 'transparent',
    color: active ? '#000000' : 'var(--skipo-text, #ffffff)',
    border: '1px solid var(--skipo-border, #444)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  });

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: 'var(--skipo-surface, #1e1e1e)',
        border: '1px solid var(--skipo-border, #333)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 25
      }}
    >
      <button
        type="button"
        style={btnStyle(settings.tracingEnabled)}
        onClick={() => onUpdateSettings({ tracingEnabled: !settings.tracingEnabled })}
      >
        Tracing: {settings.tracingEnabled ? 'ON' : 'OFF'}
      </button>

      <button
        type="button"
        style={btnStyle(settings.autoSolidify)}
        onClick={() => onUpdateSettings({ autoSolidify: !settings.autoSolidify })}
      >
        Solidify: {settings.autoSolidify ? 'AUTO' : 'MANUAL'}
      </button>

      <button
        type="button"
        style={btnStyle(false)}
        onClick={onRefreshTraces}
      >
        Refresh Traces
      </button>

      <button
        type="button"
        style={btnStyle(settings.attractionEnabled)}
        onClick={() => onUpdateSettings({ attractionEnabled: !settings.attractionEnabled })}
      >
        Attraction: {settings.attractionEnabled ? 'ON' : 'OFF'}
      </button>

      <button
        type="button"
        style={btnStyle(false)}
        onClick={onLockAllConnections}
      >
        Lock All
      </button>

      {onSaveView && (
        <button type="button" style={btnStyle(false)} onClick={onSaveView}>
          Save View
        </button>
      )}

      {onLoadView && (
        <button type="button" style={btnStyle(false)} onClick={onLoadView}>
          Load View
        </button>
      )}
    </div>
  );
}
