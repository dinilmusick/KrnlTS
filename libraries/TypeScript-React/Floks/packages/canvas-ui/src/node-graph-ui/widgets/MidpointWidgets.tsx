'use client';

export interface MidpointWidgetsProps {
  x: number;
  y: number;
  locked: boolean;
  onDelete?: () => void;
  onInspect?: () => void;
  onToggleLock?: () => void;
}

export function MidpointWidgets({ x, y, locked, onDelete, onInspect, onToggleLock }: MidpointWidgetsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'var(--skipo-surface, #1e1e1e)',
        border: '1px solid var(--skipo-border, #333)',
        borderRadius: '12px',
        padding: '2px 6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        zIndex: 7, // Below node bodies (z-index 10) per Skipo invariant
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {onToggleLock && (
        <button
          type="button"
          title={locked ? 'Unlock Connection' : 'Lock Connection'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: locked ? 'var(--skipo-accent, #d4af37)' : 'var(--skipo-text-muted, #888)',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={onToggleLock}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {locked ? (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </>
            )}
          </svg>
        </button>
      )}

      {onInspect && (
        <button
          type="button"
          title="Inspect Signal"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--skipo-text-muted, #888)',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={onInspect}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      )}

      {onDelete && !locked && (
        <button
          type="button"
          title="Delete Connection"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: '#e06c75',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={onDelete}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
