'use client';

import { useCallback, useState } from 'react';
import type { GraphEdge, GraphNode, ViewportState } from '@ultrst-armada/kloks/state-graph';

export function useKoneGraphState(initialNodes: GraphNode[], initialEdges: GraphEdge[]) {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdgesState] = useState<GraphEdge[]>(initialEdges);
  const [viewport, setViewport] = useState<ViewportState>({ panX: 0, panY: 0, zoom: 1 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  const updateNode = useCallback((id: string, patch: Partial<GraphNode>) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  }, []);

  const addNode = useCallback((node: GraphNode) => {
    setNodes((current) => current.some((candidate) => candidate.id === node.id) ? current : [...current, node]);
  }, []);

  const addEdge = useCallback((edge: GraphEdge) => {
    setEdgesState((current) => current.some((candidate) => candidate.id === edge.id) ? current : [...current, edge]);
  }, []);

  const setEdges = useCallback((next: GraphEdge[] | ((current: GraphEdge[]) => GraphEdge[])) => {
    setEdgesState(next);
  }, []);

  const updateViewport = useCallback((next: ViewportState) => {
    setViewport(next);
  }, []);

  return {
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    updateViewport,
    updateNode,
    addNode,
    addEdge,
  };
}
