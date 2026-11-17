'use client';
import type { MagneticTraceRecord } from '@floks/contracts';
import { SolidifyWidget } from './SolidifyWidget.js';

export interface MagneticTraceLayerProps {
  traces: MagneticTraceRecord[];
  onSolidify: (traceId: string) => void;
}

export function MagneticTraceLayer({ traces, onSolidify }: MagneticTraceLayerProps) {
  if (traces.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes skipo-magnetic-flow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 4
        }}
      >
        {traces.map(trace => {
          return (
            <g key={trace.id} style={{ pointerEvents: 'auto' }}>
              {/* Invisible wide hit area for easy click-to-solidify */}
              <path
                d={trace.pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: 'pointer' }}
                onClick={() => onSolidify(trace.id)}
              />
              {/* Glow background */}
              <path
                d={trace.pathD}
                fill="none"
                stroke={trace.color}
                strokeWidth={5}
                opacity={0.25}
              />
              {/* Active magnetic dashed trace with directional energy flow */}
              <path
                d={trace.pathD}
                fill="none"
                stroke={trace.color}
                strokeWidth={2.2}
                strokeDasharray="6,4"
                opacity={0.85}
                style={{
                  animation: 'skipo-magnetic-flow 0.8s linear infinite',
                  cursor: 'pointer'
                }}
                onClick={() => onSolidify(trace.id)}
              />
            </g>
          );
        })}
      </svg>
      {/* Midpoint Solidify buttons */}
      {traces.map(trace => (
        <SolidifyWidget
          key={`widget-${trace.id}`}
          x={trace.midpoint.x}
          y={trace.midpoint.y}
          onSolidify={() => onSolidify(trace.id)}
        />
      ))}
    </>
  );
}
