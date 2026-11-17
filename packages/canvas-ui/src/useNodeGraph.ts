'use client';
import { useState, useCallback } from 'react';
import type {GraphNode, GraphEdge, ViewportState, NodeGraphConfig} from '@floks/contracts';
import {zoomAtPoint} from '@floks/contracts';

export function useNodeGraph(initialNodes: GraphNode[] = [], initialEdges: GraphEdge[] = []) {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);
  const [viewport, setViewport] = useState<ViewportState>({ panX: 0, panY: 0, zoom: 1 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  const addNode = useCallback((node: GraphNode) => {
    setNodes(prev => [...prev, node]);
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const addEdge = useCallback((edge: GraphEdge) => {
    setEdges(prev => [...prev, edge]);
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, []);

  const moveNode = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n));
  }, []);

  const updateViewport = useCallback((updates: Partial<ViewportState>) => {
    setViewport(prev => ({ ...prev, ...updates }));
  }, []);

  const handleZoom = useCallback((clientX: number, clientY: number, deltaY: number, config?: NodeGraphConfig) => {
    const zoomDelta = deltaY * -0.001;
    setViewport(prev => zoomAtPoint(clientX, clientY, zoomDelta, prev, config));
  }, []);

  const toJSON = useCallback(() => {
    return { nodes, edges, viewport };
  }, [nodes, edges, viewport]);

  const fromJSON = useCallback((data: { nodes: GraphNode[], edges: GraphEdge[], viewport: ViewportState }) => {
    setNodes(data.nodes || []);
    setEdges(data.edges || []);
    setViewport(data.viewport || { panX: 0, panY: 0, zoom: 1 });
    setSelectedNodeIds(new Set());
  }, []);

  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsPinned, setIsDetailsPinned] = useState(false);

  const openDetails = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
    setIsDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => setIsDetailsOpen(false), []);
  const togglePinDetails = useCallback(() => setIsDetailsPinned(p => !p), []);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeIds(new Set([nodeId]));
    if (!isDetailsPinned) setFocusedNodeId(nodeId);
  }, [isDetailsPinned]);

  const updateNode = useCallback((nodeId: string, updates: Partial<GraphNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  }, []);

  return {
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    focusedNodeId,
    isDetailsOpen,
    isDetailsPinned,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    setFocusedNodeId,
    setIsDetailsOpen,
    setIsDetailsPinned,
    openDetails,
    closeDetails,
    togglePinDetails,
    selectNode,
    updateNode,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    moveNode,
    updateViewport,
    handleZoom,
    toJSON,
    fromJSON,
  };
}
