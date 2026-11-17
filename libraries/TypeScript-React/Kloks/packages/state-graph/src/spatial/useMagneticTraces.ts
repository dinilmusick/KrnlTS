'use client';
import { useMemo, useCallback } from 'react';
import type { GraphNode, GraphEdge, NodeGraphConfig, Socket } from '../types.js';
import { ConnectionRuleStore } from '../rules/ConnectionRuleStore.js';
import { WireTypeRegistry } from '../rules/WireTypeRegistry.js';
import type { MagneticTraceRecord } from './magneticTypes.js';

export interface UseMagneticTracesParams {
  nodes: GraphNode[];
  edges: GraphEdge[];
  config?: NodeGraphConfig;
  onEdgesChange?: (edges: GraphEdge[]) => void;
}

function getSocketCanvasPos(node: GraphNode, socket: Socket, isOut: boolean, idx: number, total: number) {
  const h = node.height ?? 130;
  const w = node.width ?? 130;
  const topOffset = total === 1 ? h * 0.5 : (h * 0.25) + idx * 24;
  const nudge = socket.offset ?? { x: 0, y: 0 };
  const baseX = isOut ? node.position.x + w : node.position.x;
  return {
    x: baseX + nudge.x,
    y: node.position.y + topOffset + nudge.y
  };
}

export function useMagneticTraces({
  nodes,
  edges,
  config,
  onEdgesChange
}: UseMagneticTracesParams) {
  const isEnabled = config?.magneticTracesEnabled !== false && config?.tracingEnabled !== false;
  const cutoff = config?.traceCutoffDistance ?? 220;

  const traces = useMemo(() => {
    if (!isEnabled || nodes.length < 2) return [];

    const existingEdgeKeys = new Set(
      edges.map(e => `${e.source}:${e.sourceSocket}->${e.target}:${e.targetSocket}`)
    );

    const candidates: MagneticTraceRecord[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const srcNode = nodes[i];
      const outputs = srcNode.outputs ?? [];
      if (outputs.length === 0) continue;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const tgtNode = nodes[j];
        const inputs = tgtNode.inputs ?? [];
        if (inputs.length === 0) continue;

        outputs.forEach((outSock, outIdx) => {
          const outPos = getSocketCanvasPos(srcNode, outSock, true, outIdx, outputs.length);

          inputs.forEach((inSock, inIdx) => {
            const edgeKey = `${srcNode.id}:${outSock.id}->${tgtNode.id}:${inSock.id}`;
            if (existingEdgeKeys.has(edgeKey)) return;

            const inPos = getSocketCanvasPos(tgtNode, inSock, false, inIdx, inputs.length);
            const dist = Math.hypot(inPos.x - outPos.x, inPos.y - outPos.y);

            if (dist <= cutoff) {
              const canConnect = ConnectionRuleStore.canConnect(
                { dataType: outSock.dataType || 'ANY', direction: 'OUTPUT', handleCategory: 'DATA' },
                { dataType: inSock.dataType || 'ANY', direction: 'INPUT', handleCategory: 'DATA' }
              );

              if (canConnect) {
                const resolution = ConnectionRuleStore.resolve(
                  { dataType: outSock.dataType || 'ANY', direction: 'OUTPUT', handleCategory: 'DATA' },
                  { dataType: inSock.dataType || 'ANY', direction: 'INPUT', handleCategory: 'DATA' }
                );
                const wireType = resolution.wireType || 'DEFAULT';
                const wireDef = WireTypeRegistry.get(wireType);
                const color = wireDef?.color || '#61afef';

                const delta = Math.max(Math.abs(inPos.x - outPos.x) * 0.5, 40);
                const pathD = `M ${outPos.x},${outPos.y} C ${outPos.x + delta},${outPos.y} ${inPos.x - delta},${inPos.y} ${inPos.x},${inPos.y}`;

                candidates.push({
                  id: `mag-${srcNode.id}-${outSock.id}->${tgtNode.id}-${inSock.id}`,
                  sourceNodeId: srcNode.id,
                  sourceSocketId: outSock.id,
                  targetNodeId: tgtNode.id,
                  targetSocketId: inSock.id,
                  wireType,
                  color,
                  pathD,
                  midpoint: { x: (outPos.x + inPos.x) / 2, y: (outPos.y + inPos.y) / 2 },
                  distance: dist
                });
              }
            }
          });
        });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    // Filter to closest non-conflicting pairs for single-mode handles
    const claimedOutputs = new Set<string>();
    const claimedInputs = new Set<string>();
    const filtered: MagneticTraceRecord[] = [];

    for (const c of candidates) {
      const outKey = `${c.sourceNodeId}:${c.sourceSocketId}`;
      const inKey = `${c.targetNodeId}:${c.targetSocketId}`;
      if (!claimedOutputs.has(outKey) && !claimedInputs.has(inKey)) {
        claimedOutputs.add(outKey);
        claimedInputs.add(inKey);
        filtered.push(c);
      }
    }

    return filtered;
  }, [nodes, edges, isEnabled, cutoff]);

  const solidifyTrace = useCallback((traceId: string) => {
    const trace = traces.find(t => t.id === traceId);
    if (!trace || !onEdgesChange) return;

    const newEdge: GraphEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: trace.sourceNodeId,
      sourceSocket: trace.sourceSocketId,
      target: trace.targetNodeId,
      targetSocket: trace.targetSocketId,
      wireType: trace.wireType,
      color: trace.color,
      locked: true
    };

    onEdgesChange([...edges, newEdge]);
  }, [traces, edges, onEdgesChange]);

  const solidifyAll = useCallback(() => {
    if (traces.length === 0 || !onEdgesChange) return;

    const newEdges: GraphEdge[] = traces.map((t, idx) => ({
      id: `edge-${Date.now()}-${idx}`,
      source: t.sourceNodeId,
      sourceSocket: t.sourceSocketId,
      target: t.targetNodeId,
      targetSocket: t.targetSocketId,
      wireType: t.wireType,
      color: t.color,
      locked: true
    }));

    onEdgesChange([...edges, ...newEdges]);
  }, [traces, edges, onEdgesChange]);

  return {
    traces,
    isEnabled,
    solidifyTrace,
    solidifyAll
  };
}
