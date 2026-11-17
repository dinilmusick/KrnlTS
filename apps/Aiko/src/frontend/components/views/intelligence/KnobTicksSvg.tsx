/**
 * ASCII Architecture Flowchart: KnobTicksSvg
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize KnobTicksSvg     │
 *   └──────────────────────────────────┘
 */

import React from 'react';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface KnobTicksSvgProps {
  size: number;
  ticks: Array<{ tickAngle: number; isActive: boolean }>;
  color: string;
  clampedVal: number;
}

// ════ KNOBTICKSSVG IMPLEMENTATION ═════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const KnobTicksSvg: React.FC<KnobTicksSvgProps> = ({
  size,
  ticks,
  color,
  clampedVal
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 pointer-events-none"
    >
      {ticks.map((t, idx) => {
        const rad = ((t.tickAngle - 90) * Math.PI) / 180;
        const rOuter = size * 0.46;
        const rInner = size * 0.38;
        const x1 = size / 2 + rInner * Math.cos(rad);
        const y1 = size / 2 + rInner * Math.sin(rad);
        const x2 = size / 2 + rOuter * Math.cos(rad);
        const y2 = size / 2 + rOuter * Math.sin(rad);
        return (
          <line
            key={idx}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={t.isActive ? color : 'currentColor'}
            strokeWidth={t.isActive ? 2 : 1}
            className={t.isActive ? '' : 'text-[var(--skipo-border-color)]'}
            opacity={t.isActive ? 0.9 : 0.45}
            style={{
              filter: t.isActive && clampedVal >= 7 ? `drop-shadow(0 0 2px ${color})` : undefined
            }}
          />
        );
      })}
    </svg>
  );
};