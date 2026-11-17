// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { GraphWireParent } from '@floks/contracts';
import { SIGNAL_TYPES } from '@floks/contracts';

export interface Wire2DProps {
  wire: GraphWireParent;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  isSelected?: boolean;
  isEnveloped?: boolean;
  isPlaying?: boolean;
  bpm?: number;
  pulseAnimTick?: number;
  zoom?: number;
  onSelect?: (wireId: string) => void;
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. Wire2D: High-Performance 2D SVG Conduit Wire Component
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
export const Wire2D: React.FC<Wire2DProps> = ({
  wire,
  p1,
  p2,
  isSelected = false,
  isEnveloped = false,
  isPlaying = false,
  bpm = 120,
  pulseAnimTick = 0,
  zoom = 1.0,
  onSelect,
}) => {
  const { pathD, cp1, cp2 } = wire.calculateCubicBezier2D(p1, p2);
  const sigDef = SIGNAL_TYPES[wire.signalType] || SIGNAL_TYPES.trigger;
  const wireColor = isSelected ? '#38bdf8' : sigDef.colorStr;

  // Pulse animation along path
  const speed = (bpm / 60) * 0.4 * wire.flowSpeedMultiplier;
  const pulseT = ((pulseAnimTick * 0.001 * speed) % 1.0);
  const pulsePoint = wire.calculatePulsePoint2D(pulseT, p1, p2, cp1, cp2);

  return (
    <g
      id={`wire-2d-${wire.id}`}
      className="cursor-pointer group select-none"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(wire.id);
      }}
    >
      {/* Outer Glow for Enveloped Conduits inside Effect Fields */}
      {isEnveloped && (
        <path
          d={pathD}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={6 * zoom}
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      )}

      {/* Invisible Expanded Hit Target for Smooth Clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={16 * zoom}
      />

      {/* Main Vector Conduit Path */}
      <path
        d={pathD}
        fill="none"
        stroke={wireColor}
        strokeWidth={(isSelected ? 3.5 : 2.0) * zoom}
        strokeLinecap="round"
        strokeDasharray={isSelected ? '6,3' : undefined}
        className="transition-all duration-150 group-hover:stroke-sky-300"
      />

      {/* Traveling Energy Pulse Orb */}
      {isPlaying && (
        <circle
          cx={pulsePoint.x}
          cy={pulsePoint.y}
          r={3.5 * zoom}
          fill={wireColor}
          filter="drop-shadow(0 0 6px white)"
        />
      )}
    </g>
  );
};
