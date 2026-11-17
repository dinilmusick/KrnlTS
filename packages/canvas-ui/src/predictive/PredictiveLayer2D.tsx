import React, { useState } from 'react';
import type {SpaceNode, PredictiveGhostNode, PredictiveTrace} from '@floks/contracts';
import { CameraState } from '../graph-2d/types.js';
import { getSocketScreenPosition } from '../graph-2d/socketCoordinates.js';
import { PredictiveGhostNodeCard } from './PredictiveGhostNodeCard.js';
import { Zap, Sparkles } from 'lucide-react';

export interface PredictiveLayer2DProps {
  nodes: SpaceNode[];

  ghostNodes: PredictiveGhostNode[];
  traces: PredictiveTrace[];
  selectedNodesWithGhosts: Map<string, PredictiveGhostNode[]>;
  worldToScreen: (x: number, z: number) => { x: number; y: number };
  camera: CameraState;
  onSolidifyGhost: (ghost: PredictiveGhostNode) => void;
  onSolidifyAllForNode: (parentNodeId: string) => void;
  isActive?: boolean;
  targetNodes?: SpaceNode[];
  onToggleActive?: () => void;
}

export const PredictiveLayer2D: React.FC<PredictiveLayer2DProps> = ({
  nodes,
  ghostNodes,
  traces,
  selectedNodesWithGhosts,
  worldToScreen,
  camera,
  onSolidifyGhost,
  onSolidifyAllForNode,
  isActive = false,
  targetNodes = [],
  onToggleActive,
}) => {
  const [hoveredGhostId, setHoveredGhostId] = useState<string | null>(null);
  const nodeMap = new Map<string, SpaceNode>(nodes.map((n) => [n.id, n]));
  const ghostMap = new Map<string, PredictiveGhostNode>(ghostNodes.map((g) => [g.id, g]));

  // If predictive mode is inactive but node(s) are selected, render nothing
  if (!isActive) {
    return null;
  }

  if (ghostNodes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* SVG Predictive Connection Traces */}
      <svg className="w-full h-full absolute inset-0">
        <defs>
          <filter id="ghost-trace-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {traces.map((trace) => {
          const ghost = ghostMap.get(trace.ghostNodeId);
          if (!ghost) return null;

          let p1: { x: number; y: number };
          let p2: { x: number; y: number };

          if (trace.isFromGhostToParent) {
            // Ghost (Out) -> Parent (In)
            const parent = nodeMap.get(trace.targetNodeId);
            if (!parent) return null;
            p1 = getSocketScreenPosition(ghost.prototypeNode, trace.sourceHandleId, true, worldToScreen, camera);
            p2 = getSocketScreenPosition(parent, trace.targetHandleId, false, worldToScreen, camera);
          } else {
            // Parent (Out) -> Ghost (In)
            const parent = nodeMap.get(trace.sourceNodeId);
            if (!parent) return null;
            p1 = getSocketScreenPosition(parent, trace.sourceHandleId, true, worldToScreen, camera);
            p2 = getSocketScreenPosition(ghost.prototypeNode, trace.targetHandleId, false, worldToScreen, camera);
          }

          const isHovered = hoveredGhostId === ghost.id;
          const strokeColor = trace.color || '#38bdf8';
          const dx = Math.abs(p2.x - p1.x) * 0.45;
          const path = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

          return (
            <g key={trace.id}>
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isHovered ? 2.5 : 1.5}
                opacity={isHovered ? 0.9 : 0.6}
              />
            </g>
          );
        })}
      </svg>

      {/* Holographic Ghost Node Cards */}
      {ghostNodes.map((ghost) => {
        const screenPos = worldToScreen(ghost.worldPosition[0], ghost.worldPosition[2]);
        return (
          <PredictiveGhostNodeCard
            key={ghost.id}
            ghost={ghost}
            screenPos={screenPos}
            zoom={camera.zoom}
            onSolidify={onSolidifyGhost}
            isHovered={hoveredGhostId === ghost.id}
            onHoverChange={(hovered) => setHoveredGhostId(hovered ? ghost.id : null)}
          />
        );
      })}

      {/* Icon-Only Solidify All Button on Each Selected Node */}
      {Array.from(selectedNodesWithGhosts.entries()).map(([parentNodeId, ghosts]) => {
        const parent = nodeMap.get(parentNodeId);
        if (!parent || ghosts.length === 0) return null;

        const screenPos = worldToScreen(parent.position[0], parent.position[2]);
        const yOffset = -54 * Math.max(0.7, Math.min(1.2, camera.zoom));

        return (
          <div
            key={`solidify-all-${parentNodeId}`}
            style={{
              position: 'absolute',
              left: `${screenPos.x}px`,
              top: `${screenPos.y + yOffset}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="pointer-events-auto z-40"
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
                onSolidifyAllForNode(parentNodeId);
              }}
              className="relative w-8 h-8 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 hover:text-white hover:bg-cyan-900 hover:border-cyan-200 hover:scale-125 shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center transition-all cursor-pointer group"
              title={`Solidify all (${ghosts.length}) predicted nodes for ${parent.name}`}
            >
              <Zap className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
              {ghosts.length > 1 && (
                <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[15px] h-3.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[8px] flex items-center justify-center font-mono shadow-sm">
                  {ghosts.length}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
