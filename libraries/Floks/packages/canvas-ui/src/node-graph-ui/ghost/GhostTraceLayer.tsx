'use client';
import type { GhostTraceRecord } from '@floks/contracts';

export interface GhostTraceLayerProps {
  traces: GhostTraceRecord[];
  hoveredGhostId?: string | null;
}

export function GhostTraceLayer({ traces, hoveredGhostId }: GhostTraceLayerProps) {
  if (traces.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 3
      }}
    >
      {traces.map(trace => {
        const isHovered = hoveredGhostId === trace.targetGhostNodeId;
        const color = 'var(--skipo-ghost, #00d9ff)';

        return (
          <g key={trace.id}>
            <path
              d={trace.pathD}
              fill="none"
              stroke={color}
              strokeWidth={isHovered ? 2.5 : 2}
              strokeDasharray="6,4"
              opacity={isHovered ? 0.9 : 0.6}
              style={{
                transition: 'opacity 0.15s ease, stroke-width 0.15s ease'
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
