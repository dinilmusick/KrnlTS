/**
 * ASCII Architecture Flowchart: useGalaxyInteractions
 *
 *   ┌────────────────────────────────────┐
 *   │  Initialize useGalaxyInteractions  │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │          getCanvasCoords           │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │               canvas               │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │                rect                │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │   Return State / Result Payload    │
 *   └────────────────────────────────────┘
 */

import { useState, useCallback, RefObject, MutableRefObject, MouseEvent } from 'react';
import { StarNode, SubNode, ContextMenuState } from '../galaxy/types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface UseGalaxyInteractionsOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  nodesRef: MutableRefObject<StarNode[]>;
  onSelectKeyNode?: (keyId: string) => void;
  onSelectModelNode?: (modelId: string) => void;
}


// ════ USEGALAXYINTERACTIONS IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function useGalaxyInteractions({
  canvasRef,
  nodesRef,
  onSelectKeyNode
}: UseGalaxyInteractionsOptions) {
  const [hoveredNode, setHoveredNode] = useState<StarNode | null>(null);
  const [hoveredSubNode, setHoveredSubNode] = useState<SubNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<StarNode | null>(null);
  const [selectedSubNode, setSelectedSubNode] = useState<SubNode | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const getCanvasCoords = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }, [canvasRef]);

  const findHit = useCallback((x: number, y: number) => {
    let hitSub: SubNode | null = null;
    let hitNode: StarNode | null = null;

    for (const node of nodesRef.current) {
      if (node.subNodes) {
        for (const sub of node.subNodes) {
          const dist = Math.hypot(sub.x - x, sub.y - y);
          if (dist <= (sub.radius || 8) + 5) {
            hitSub = sub;
            break;
          }
        }
      }
      if (hitSub) break;
      const nodeDist = Math.hypot(node.x - x, node.y - y);
      if (nodeDist <= (node.radius || 11) + 6) {
        hitNode = node;
        break;
      }
    }
    return { hitSub, hitNode };
  }, [nodesRef]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const { hitSub, hitNode } = findHit(x, y);

    nodesRef.current.forEach(n => {
      n.isHovered = hitNode?.id === n.id;
      if (n.subNodes) {
        n.subNodes.forEach(s => {
          s.isHovered = hitSub?.id === s.id;
        });
      }
    });

    setHoveredSubNode(hitSub);
    setHoveredNode(hitNode);
  }, [getCanvasCoords, findHit, nodesRef]);

  const handleMouseLeave = useCallback(() => {
    nodesRef.current.forEach(n => {
      n.isHovered = false;
      if (n.subNodes) {
        n.subNodes.forEach(s => { s.isHovered = false; });
      }
    });
    setHoveredNode(null);
    setHoveredSubNode(null);
  }, [nodesRef]);

  const handleClick = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const { hitSub, hitNode } = findHit(x, y);

    if (hitSub) {
      setSelectedSubNode(hitSub);
      setSelectedNode(null);
      setContextMenu(null);
    } else if (hitNode) {
      setSelectedNode(hitNode);
      setSelectedSubNode(null);
      setContextMenu(null);
      onSelectKeyNode?.(hitNode.id);
    } else {
      setSelectedNode(null);
      setSelectedSubNode(null);
      setContextMenu(null);
    }
  }, [getCanvasCoords, findHit, onSelectKeyNode]);

  const handleContextMenu = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const { hitNode } = findHit(x, y);
    if (hitNode) {
      setContextMenu({ x: e.clientX, y: e.clientY, node: hitNode });
    }
  }, [getCanvasCoords, findHit]);

  return {
    hoveredNode,
    hoveredSubNode,
    selectedNode,
    selectedSubNode,
    contextMenu,
    setSelectedNode,
    setSelectedSubNode,
    setContextMenu,
    handleMouseMove,
    handleMouseLeave,
    handleClick,
    handleContextMenu
  };
}