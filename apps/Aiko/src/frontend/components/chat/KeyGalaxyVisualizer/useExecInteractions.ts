/**
 * ASCII Architecture Flowchart: useExecInteractions
 *
 *   ┌──────────────────────────────────┐
 *   │  Initialize useExecInteractions  │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         getCanvasCoords          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              canvas              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               rect               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { RefObject } from 'react';
import { ExecutionNode, ExecutionEdge } from '../galaxy/executionTypes.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface UseExecInteractionsOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  execNodes: ExecutionNode[];
  execEdges: ExecutionEdge[];
  draggedNodeRef: any;
  setExecHoveredNode: (n: ExecutionNode | null) => void;
  setExecHoveredEdge: (e: ExecutionEdge | null) => void;
  setExecSelectedNode: (n: ExecutionNode | null) => void;
  setExecSelectedEdge: (e: ExecutionEdge | null) => void;
  execHoveredEdge: ExecutionEdge | null;
  setActiveOverlayEdge: (e: ExecutionEdge | null) => void;
}


// ════ USEEXECINTERACTIONS IMPLEMENTATION ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function useExecInteractions({
  canvasRef,
  execNodes,
  execEdges,
  draggedNodeRef,
  setExecHoveredNode,
  setExecHoveredEdge,
  setExecSelectedNode,
  setExecSelectedEdge,
  execHoveredEdge,
  setActiveOverlayEdge
}: UseExecInteractionsOptions) {
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handleExecMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      return;
    }

    const hitNode = execNodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.radius + 6);
    setExecHoveredNode(hitNode || null);

    if (hitNode) {
      setExecHoveredEdge(null);
      return;
    }

    const hitEdge = execEdges.find(edge => {
      const s = execNodes.find(n => n.id === edge.source);
      const t = execNodes.find(n => n.id === edge.target);
      if (!s || !t) return false;
      const l2 = Math.hypot(t.x - s.x, t.y - s.y) ** 2;
      if (l2 === 0) return Math.hypot(s.x - x, s.y - y) < 8;
      let tval = ((x - s.x) * (t.x - s.x) + (y - s.y) * (t.y - s.y)) / l2;
      tval = Math.max(0, Math.min(1, tval));
      const dist = Math.hypot(x - (s.x + tval * (t.x - s.x)), y - (s.y + tval * (t.y - s.y)));
      return dist < 6;
    });

    setExecHoveredEdge(hitEdge || null);
  };

  const handleExecMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hitNode = execNodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.radius + 6);

    if (hitNode) {
      draggedNodeRef.current = hitNode;
      setExecSelectedNode(hitNode);
      setExecSelectedEdge(null);
    } else {
      const hitEdge = execHoveredEdge;
      if (hitEdge) {
        setExecSelectedEdge(hitEdge);
        setExecSelectedNode(null);
      } else {
        setExecSelectedNode(null);
        setExecSelectedEdge(null);
      }
    }
  };

  const handleExecMouseUp = () => {
    draggedNodeRef.current = null;
  };

  const handleExecDoubleClick = (execSelectedEdge: ExecutionEdge | null) => {
    if (execSelectedEdge && execSelectedEdge.type !== 'access') {
      setActiveOverlayEdge(execSelectedEdge);
    }
  };

  return {
    handleExecMouseMove,
    handleExecMouseDown,
    handleExecMouseUp,
    handleExecDoubleClick
  };
}