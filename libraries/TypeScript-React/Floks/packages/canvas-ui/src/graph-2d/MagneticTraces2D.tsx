import React from 'react';
import { SpaceNode, NodeConnection } from '@floks/contracts';
import { Trace } from '@floks/contracts';
import { CameraState } from './types.js';
import { getSocketScreenPosition } from './socketCoordinates.js';
import { Link2 } from 'lucide-react';

interface MagneticTraces2DProps {
  nodes: SpaceNode[];
  connections?: NodeConnection[];
  traces: Trace[];
  worldToScreen: (x: number, z: number) => { x: number; y: number };
  camera: CameraState;
  onSolidify: (trace: Trace) => void;
}

const TRACE_COLORS: Record<string, string> = {
  AUDIO_STEREO: '#00ffff',
  AUDIO_MONO: '#38bdf8',
  AUDIO_PACKET: '#818cf8',
  TRIGGER: '#eab308',
  MIDI_STREAM: '#ec4899',
  MIDI_PACKET: '#f43f5e',
  CURVE_STREAM: '#10b981',
  CURVE_PACKET: '#34d399',
  COMPONENT: '#a855f7',
  DEFAULT: '#60a5fa',
};

export const MagneticTraces2D: React.FC<MagneticTraces2DProps> = ({
  nodes,
  connections = [],
  traces,
  worldToScreen,
  camera,
  onSolidify,
}) => {
  const nodeMap = new Map<string, SpaceNode>(nodes.map((n) => [n.id, n]));

  // Build connection lookup set to suppress redundant magnetic traces
  const connectedPairSet = new Set<string>();
  connections.forEach((c) => {
    const fromSock = c.fromSocketId || c.fromPort || '';
    const toSock = c.toSocketId || c.toPort || '';
    connectedPairSet.add(`${c.fromNodeId}:${fromSock}->${c.toNodeId}:${toSock}`);
    connectedPairSet.add(`${c.fromNodeId}->${c.toNodeId}`);
  });

  const seenKeys = new Set<string>();
  const visibleTraces = traces.filter((t) => {
    const keyWithSockets = `${t.sourceNodeId}:${t.sourceHandleId}->${t.targetNodeId}:${t.targetHandleId}`;
    const keyNodeOnly = `${t.sourceNodeId}->${t.targetNodeId}`;
    if (connectedPairSet.has(keyWithSockets) || connectedPairSet.has(keyNodeOnly)) {
      return false;
    }
    const traceUniqueId = t.id || keyWithSockets;
    if (seenKeys.has(traceUniqueId)) {
      return false;
    }
    seenKeys.add(traceUniqueId);
    return true;
  });

  if (visibleTraces.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        {visibleTraces.map((trace) => {
          const source = nodeMap.get(trace.sourceNodeId);
          const target = nodeMap.get(trace.targetNodeId);
          if (!source || !target) return null;

          const p1 = getSocketScreenPosition(source, trace.sourceHandleId, true, worldToScreen, camera);
          const p2 = getSocketScreenPosition(target, trace.targetHandleId, false, worldToScreen, camera);
          const color = TRACE_COLORS[trace.wireType] || TRACE_COLORS.DEFAULT;

          // Spatial score maps to opacity (closer = brighter)
          const proximityOpacity = Math.max(0.35, Math.min(0.9, 1 - trace.spatialScore / 360));

          return (
            <g key={trace.id}>
              {/* Solid high-performance magnetic connection line */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={color}
                strokeWidth={1.5}
                opacity={proximityOpacity}
              />
            </g>
          );
        })}
      </svg>

      {/* Interactive 1-click Solidify Widgets placed at midpoint */}
      {visibleTraces.map((trace) => {
        const source = nodeMap.get(trace.sourceNodeId);
        const target = nodeMap.get(trace.targetNodeId);
        if (!source || !target) return null;

        const p1 = getSocketScreenPosition(source, trace.sourceHandleId, true, worldToScreen, camera);
        const p2 = getSocketScreenPosition(target, trace.targetHandleId, false, worldToScreen, camera);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <div
            key={`widget-${trace.id}`}
            style={{
              position: 'absolute',
              left: `${midX}px`,
              top: `${midY}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-auto z-20 group"
          >
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSolidify(trace);
              }}
              className="w-7 h-7 rounded-full bg-slate-950 border-2 border-cyan-400/80 text-cyan-300 hover:text-white hover:bg-cyan-950 hover:border-cyan-200 hover:scale-125 shadow-[0_0_12px_rgba(6,182,212,0.6)] flex items-center justify-center transition-all cursor-pointer group/btn"
              title={`Solidify magnetic connection: ${trace.sourceHandleId} -> ${trace.targetHandleId}`}
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400 group-hover/btn:scale-110" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
