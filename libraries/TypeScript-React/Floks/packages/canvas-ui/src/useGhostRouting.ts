'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  GraphNode,
  GraphEdge,
  NodeGraphConfig,
  NodeDefinition,
  GhostNodeRecord,
  GhostTraceRecord,
} from '@floks/contracts';
import {
  ConnectionRuleStore,
  GhostStore,
  inferGhostNodes,
  resolveGhostLayout,
  buildGhostTraces,
} from '@floks/contracts';

export interface UseGhostRoutingParams {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeIds: Set<string>;
  config?: NodeGraphConfig;
  availableNodeTypes?: NodeDefinition[];
  onNodesChange?: (nodes: GraphNode[]) => void;
  onEdgesChange?: (edges: GraphEdge[]) => void;
}

export function useGhostRouting({
  nodes,
  edges,
  selectedNodeIds,
  config,
  availableNodeTypes,
  onNodesChange,
  onEdgesChange
}: UseGhostRoutingParams) {
  const ghostStore = useRef(GhostStore.getInstance()).current;
  const [activeGhostNodes, setActiveGhostNodes] = useState<GhostNodeRecord[]>([]);
  const [activeGhostTraces, setActiveGhostTraces] = useState<GhostTraceRecord[]>([]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [hoveredGhostId, setHoveredGhostId] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync store state to component state
  useEffect(() => {
    const unsubscribe = ghostStore.subscribe(() => {
      setActiveGhostNodes(ghostStore.getActiveGhostNodes());
      setActiveGhostTraces(ghostStore.getActiveGhostTraces());
      setScenarioIndex(ghostStore.scenarioIndex);
      setHoveredGhostId(ghostStore.hoveredGhostId);
    });
    return () => unsubscribe();
  }, [ghostStore]);

  // Debounced inference on selection change
  useEffect(() => {
    if (config?.ghostRoutingEnabled === false) {
      ghostStore.clear();
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (selectedNodeIds.size === 0) {
      ghostStore.clear();
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const selected = nodes.filter(n => selectedNodeIds.has(n.id));
      const defs = availableNodeTypes && availableNodeTypes.length > 0
        ? availableNodeTypes
        : ConnectionRuleStore.listNodeTypes();

      const candidates = inferGhostNodes(selected, defs, {
        scenarioCount: config?.ghostScenarioCount ?? 3
      });

      const layoutNodes = resolveGhostLayout(candidates, nodes, defs);
      const traces = buildGhostTraces(layoutNodes, nodes);

      ghostStore.setPredictions(layoutNodes, traces, Array.from(selectedNodeIds));
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [nodes, selectedNodeIds, config?.ghostRoutingEnabled, config?.ghostScenarioCount, availableNodeTypes, ghostStore]);

  // Solidify single ghost node
  const solidifyOne = useCallback((ghostId: string) => {
    const ghost = ghostStore.ghostNodes.find(g => g.id === ghostId);
    if (!ghost) return;

    const realNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const realNode: GraphNode = {
      id: realNodeId,
      type: ghost.nodeType,
      label: ghost.label,
      position: { ...ghost.position },
      width: ghost.size.width,
      height: ghost.size.height,
      inputs: ghost.inputs,
      outputs: ghost.outputs
    };

    const newEdges: GraphEdge[] = ghost.socketMappings.map(m => ({
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: ghost.sourceNodeId,
      sourceSocket: m.sourceSocketId,
      target: realNodeId,
      targetSocket: m.targetSocketId,
      wireType: m.wireType
    }));

    onNodesChange?.([...nodes, realNode]);
    onEdgesChange?.([...edges, ...newEdges]);
    ghostStore.clear();
  }, [nodes, edges, onNodesChange, onEdgesChange, ghostStore]);

  // Solidify all ghost nodes in active scenario
  const solidifyAll = useCallback(() => {
    const activeNodes = ghostStore.getActiveGhostNodes();
    if (activeNodes.length === 0) return;

    const newRealNodes: GraphNode[] = [];
    const newRealEdges: GraphEdge[] = [];

    for (const ghost of activeNodes) {
      const realNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      newRealNodes.push({
        id: realNodeId,
        type: ghost.nodeType,
        label: ghost.label,
        position: { ...ghost.position },
        width: ghost.size.width,
        height: ghost.size.height,
        inputs: ghost.inputs,
        outputs: ghost.outputs
      });

      for (const m of ghost.socketMappings) {
        newRealEdges.push({
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: ghost.sourceNodeId,
          sourceSocket: m.sourceSocketId,
          target: realNodeId,
          targetSocket: m.targetSocketId,
          wireType: m.wireType
        });
      }
    }

    onNodesChange?.([...nodes, ...newRealNodes]);
    onEdgesChange?.([...edges, ...newRealEdges]);
    ghostStore.clear();
  }, [nodes, edges, onNodesChange, onEdgesChange, ghostStore]);

  const cycleScenario = useCallback(() => {
    ghostStore.cycleScenario(config?.ghostScenarioCount ?? 3);
  }, [ghostStore, config?.ghostScenarioCount]);

  const dismiss = useCallback(() => {
    ghostStore.clear();
  }, [ghostStore]);

  return {
    isActive: ghostStore.isActive,
    activeGhostNodes,
    activeGhostTraces,
    scenarioIndex,
    hoveredGhostId,
    setHoveredGhostId: (id: string | null) => ghostStore.setHoveredGhostId(id),
    solidifyOne,
    solidifyAll,
    cycleScenario,
    dismiss
  };
}
