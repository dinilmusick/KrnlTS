'use client';

export interface SolidifyWidgetProps {
  x: number;
  y: number;
  onSolidify: () => void;
}

export function SolidifyWidget({ x, y, onSolidify }: SolidifyWidgetProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 7,
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="Solidify Connection"
        aria-label="Solidify Connection"
        style={{
          backgroundColor: 'var(--skipo-accent, #61afef)',
          border: '1px solid var(--skipo-border, #61afef)',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          color: 'var(--skipo-text, #ffffff)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          transition: 'transform 0.1s ease'
        }}
        onClick={onSolidify}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>
  );
}
