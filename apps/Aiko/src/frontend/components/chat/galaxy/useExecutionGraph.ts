/**
 * ASCII Architecture Flowchart: useExecutionGraph
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize useExecutionGraph   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          draggedNodeRef          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           tickPhysics            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             updated              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../../views/DirectChatView/types.js';
import { ExecutionNode, ExecutionEdge } from './executionTypes.js';
import { buildExecutionGraph } from './graphBuilder.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface UseExecutionGraphOptions {
  messages: ChatMessage[];
  loading: boolean;
  selectedModel?: string;
  selectedProvider?: string;
  keys?: any[];
  width?: number;
  height?: number;
}


// ════ USEEXECUTIONGRAPH IMPLEMENTATION ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function useExecutionGraph({
  messages,
  loading,
  selectedModel = 'gemini-2.5-flash',
  selectedProvider = 'google',
  keys = [],
  width = 800,
  height = 280
}: UseExecutionGraphOptions) {
  const [nodes, setNodes] = useState<ExecutionNode[]>([]);
  const [edges, setEdges] = useState<ExecutionEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<ExecutionNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<ExecutionEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<ExecutionNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ExecutionEdge | null>(null);

  const draggedNodeRef = useRef<ExecutionNode | null>(null);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildExecutionGraph({
      messages,
      loading,
      selectedModel,
      selectedProvider,
      keys,
      height,
      existingNodes: nodes
    });
    setNodes(newNodes);
    setEdges(newEdges);
  }, [messages, loading, selectedModel, selectedProvider, keys, height]);

  const tickPhysics = useCallback(() => {
    setNodes(prev => {
      const updated = prev.map(n => ({ ...n }));
      const cx = width / 2;
      const cy = height / 2;

      // Gravity / Center Attraction
      updated.forEach(n => {
        const dx = cx - n.x;
        const dy = cy - n.y;
        n.vx += dx * 0.003;
        n.vy += dy * 0.003;
        n.vx *= 0.82;
        n.vy *= 0.82;
      });

      // Node Repulsion
      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const n1 = updated[i];
          const n2 = updated[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = n1.radius + n2.radius + 35;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.08;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // Spring links pull
      edges.forEach(e => {
        const s = updated.find(n => n.id === e.source);
        const t = updated.find(n => n.id === e.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = e.type === 'access' ? 50 : 80;
          const force = (dist - targetDist) * 0.02;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        }
      });

      // Apply positions + boundaries
      updated.forEach(n => {
        if (draggedNodeRef.current?.id === n.id) {
          n.vx = 0;
          n.vy = 0;
        } else {
          n.x += n.vx;
          n.y += n.vy;
        }
        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
      });

      return updated;
    });
  }, [edges, width, height]);

  return {
    nodes,
    edges,
    hoveredNode,
    hoveredEdge,
    selectedNode,
    selectedEdge,
    draggedNodeRef,
    setHoveredNode,
    setHoveredEdge,
    setSelectedNode,
    setSelectedEdge,
    tickPhysics
  };
}