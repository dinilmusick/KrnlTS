'use client';
import type { GhostNodeRecord } from '@floks/contracts';

export interface GhostSolidifyBarProps {
  ghostNodes: GhostNodeRecord[];
  scenarioIndex: number;
  maxScenarios?: number;
  onCycleScenario: () => void;
  onSolidifyAll: () => void;
  onDismiss: () => void;
}

export function GhostSolidifyBar({
  ghostNodes,
  scenarioIndex,
  maxScenarios = 3,
  onCycleScenario,
  onSolidifyAll,
  onDismiss
}: GhostSolidifyBarProps) {
  if (ghostNodes.length === 0) return null;

  const minX = Math.min(...ghostNodes.map(n => n.position.x));
  const minY = Math.min(...ghostNodes.map(n => n.position.y));
  const barX = minX;
  const barY = Math.max(10, minY - 44);
  const ghostColor = 'var(--skipo-ghost, #00d9ff)';

  return (
    <div
      style={{
        position: 'absolute',
        left: barX,
        top: barY,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: 'rgba(20, 25, 30, 0.92)',
        border: '1px solid rgba(0, 217, 255, 0.4)',
        borderRadius: '6px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="Cycle Scenario"
        aria-label="Cycle Scenario"
        style={{
          background: 'none',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          borderRadius: '4px',
          color: ghostColor,
          padding: '2px 6px',
          fontSize: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onClick={onCycleScenario}
      >
        <span>Branch {scenarioIndex + 1}/{maxScenarios}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button
        type="button"
        title="Solidify All"
        aria-label="Solidify All"
        style={{
          backgroundColor: ghostColor,
          border: 'none',
          borderRadius: '4px',
          color: '#0b1318',
          padding: '3px 8px',
          fontSize: '10px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onClick={onSolidifyAll}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Solidify</span>
      </button>

      <button
        type="button"
        title="Dismiss"
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={onDismiss}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
