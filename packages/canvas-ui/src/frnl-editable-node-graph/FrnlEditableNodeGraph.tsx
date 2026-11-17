'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { GraphEdge, GraphNode, NodeDefinition, Trace, ViewportState, SolidConnection, SpaceNode, NodeConnection } from '@floks/contracts';
import { ConnectionRuleStore, MagneticGraphManager } from '@floks/contracts';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from '@floks/ui';
import { NodeGraphCanvas } from '../NodeGraphCanvas.js';
import { usePredictiveGraph2D } from '../predictive/usePredictiveGraph2D.js';

export interface FrnlEditableNodeGraphProps {
  id?: string;
  parentId?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewport?: ViewportState;
  selectedNodeIds?: Set<string>;
  availableNodeTypes?: NodeDefinition[];
  magneticEnabled?: boolean;
  autoSolidifyEnabled?: boolean;
  magneticCutoff?: number;
  signalTelemetryEnabled?: boolean;
  getSocketTelemetry?: (node: GraphNode, socketId: string, isOutput: boolean) => unknown;
  className?: string;
  style?: React.CSSProperties;
  onNodesChange?: (nodes: GraphNode[]) => void;
  onEdgesChange?: (edges: GraphEdge[]) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onMagneticTracesChange?: (traces: Trace[]) => void;
  onMagneticTraceSolidify?: (trace: Trace | SolidConnection) => void;
  onPredictiveSolidify?: (ghostId: string, ghost?: any) => void;
  onPredictiveSolidifyAllForNode?: (nodeId: string, ghosts?: any[]) => void;
  onPredictiveSolidifyAll?: (ghosts?: any[]) => void;
}

export const frnlEditableNodeGraphDefinition = defineFrnlComponent({
  name: 'frnlEditableNodeGraph',
  states: {
    idle: {
      name: 'idle',
      events: {
        nodesChange: { functionId: 'frnlEditableNodeGraph.idle.nodesChange' },
        edgesChange: { functionId: 'frnlEditableNodeGraph.idle.edgesChange' },
        selectionChange: { functionId: 'frnlEditableNodeGraph.idle.selectionChange' },
        viewportChange: { functionId: 'frnlEditableNodeGraph.idle.viewportChange' },
        magneticTraceSolidify: { functionId: 'frnlEditableNodeGraph.idle.magneticTraceSolidify' },
        predictiveSolidify: { functionId: 'frnlEditableNodeGraph.idle.predictiveSolidify' },
        predictiveSolidifyAll: { functionId: 'frnlEditableNodeGraph.idle.predictiveSolidifyAll' },
      },
      visualParameters: {
        canvasBackground: 'var(--frnl-editable-node-graph-background, var(--skipo-surface-dark, #181a1f))',
        magneticColor: 'var(--frnl-editable-node-graph-magnetic, #38bdf8)',
      },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
    disabled: {
      name: 'disabled',
      events: {
        nodesChange: { functionId: 'frnlEditableNodeGraph.disabled.nodesChange' },
        edgesChange: { functionId: 'frnlEditableNodeGraph.disabled.edgesChange' },
        selectionChange: { functionId: 'frnlEditableNodeGraph.disabled.selectionChange' },
        viewportChange: { functionId: 'frnlEditableNodeGraph.disabled.viewportChange' },
        magneticTraceSolidify: { functionId: 'frnlEditableNodeGraph.disabled.magneticTraceSolidify' },
        predictiveSolidify: { functionId: 'frnlEditableNodeGraph.disabled.predictiveSolidify' },
        predictiveSolidifyAll: { functionId: 'frnlEditableNodeGraph.disabled.predictiveSolidifyAll' },
      },
      visualParameters: { opacity: 0.6 },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
  },
});

function socketPoint(node: GraphNode, socketId: string, output: boolean, viewport: ViewportState) {
  const sockets = output ? node.outputs ?? [] : node.inputs ?? [];
  const foundIndex = sockets.findIndex((socket) => socket.id === socketId);
  const index = foundIndex >= 0 ? foundIndex : 0;
  const width = node.width ?? 150;
  const height = node.height ?? 100;
  const y = height / 2 + (index - Math.max(0, sockets.length - 1) / 2) * 28;
  const x = output ? width : 0;
  return {
    x: node.position.x * viewport.zoom + viewport.panX + x * viewport.zoom,
    y: node.position.y * viewport.zoom + viewport.panY + y * viewport.zoom,
  };
}

export const FrnlEditableNodeGraph: React.FC<FrnlEditableNodeGraphProps> = ({
  id = 'frnlEditableNodeGraph',
  parentId,
  nodes,
  edges,
  viewport = { panX: 0, panY: 0, zoom: 1 },
  selectedNodeIds = new Set<string>(),
  availableNodeTypes,
  magneticEnabled = true,
  autoSolidifyEnabled = false,
  magneticCutoff = 320,
  signalTelemetryEnabled = false,
  getSocketTelemetry,
  className,
  style,
  onNodesChange,
  onEdgesChange,
  onViewportChange,
  onSelectionChange,
  onNodeDoubleClick,
  onMagneticTracesChange,
  onMagneticTraceSolidify,
  onPredictiveSolidify,
  onPredictiveSolidifyAllForNode,
  onPredictiveSolidifyAll,
}) => {
  const store = useFloksFrnlStore();
  const [traces, setTraces] = useState<Trace[]>([]);
  const manager = useMemo(() => new MagneticGraphManager(magneticCutoff), [magneticCutoff]);

  const predictive = usePredictiveGraph2D({
    nodes: nodes as any,
    connections: edges as any,
    selectedNodeId: selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null,
    selectedNodeIds: Array.from(selectedNodeIds),
    onSolidifyPredictiveNodes: (ghosts) => {
      for (const ghost of ghosts) onPredictiveSolidify?.(ghost.id, ghost);
    },
  });

  useEffect(() => {
    if (!ConnectionRuleStore.isInitialized()) ConnectionRuleStore.initializeDefaults();
  }, []);

  const handlers = useMemo(() => ({
    'frnlEditableNodeGraph.idle.nodesChange': (value: unknown) => onNodesChange?.(value as GraphNode[]),
    'frnlEditableNodeGraph.idle.edgesChange': (value: unknown) => onEdgesChange?.(value as GraphEdge[]),
    'frnlEditableNodeGraph.idle.selectionChange': (value: unknown) => onSelectionChange?.(value as Set<string>),
    'frnlEditableNodeGraph.idle.viewportChange': (value: unknown) => onViewportChange?.(value as ViewportState),
    'frnlEditableNodeGraph.idle.magneticTraceSolidify': (value: unknown) => onMagneticTraceSolidify?.(value as Trace | SolidConnection),
    'frnlEditableNodeGraph.idle.predictiveSolidify': (value: unknown) => onPredictiveSolidify?.(String(value)),
    'frnlEditableNodeGraph.idle.predictiveSolidifyAll': () => onPredictiveSolidifyAll?.(),
    'frnlEditableNodeGraph.disabled.nodesChange': () => {},
    'frnlEditableNodeGraph.disabled.edgesChange': () => {},
    'frnlEditableNodeGraph.disabled.selectionChange': () => {},
    'frnlEditableNodeGraph.disabled.viewportChange': () => {},
    'frnlEditableNodeGraph.disabled.magneticTraceSolidify': () => {},
    'frnlEditableNodeGraph.disabled.predictiveSolidify': () => {},
    'frnlEditableNodeGraph.disabled.predictiveSolidifyAll': () => {},
  }), [
    onEdgesChange, onMagneticTraceSolidify, onNodesChange, onSelectionChange,
    onViewportChange, onPredictiveSolidify, onPredictiveSolidifyAll
  ]);

  const frnl = useFrnlComponent({
    id,
    parentId,
    definition: frnlEditableNodeGraphDefinition,
    store,
    state: 'idle',
    properties: { nodeCount: nodes.length, edgeCount: edges.length },
    handlers,
  });

  useEffect(() => {
    if (!magneticEnabled) {
      setTraces([]);
      onMagneticTracesChange?.([]);
      return;
    }

    const next = manager.computeTraces(nodes as unknown as SpaceNode[]);
    setTraces(next);
    onMagneticTracesChange?.(next);

    if (autoSolidifyEnabled && next.length > 0) {
      const resolved = manager.resolveAutoSolidification(nodes as unknown as SpaceNode[], next, edges as unknown as NodeConnection[]);
      for (const trace of resolved) {
        onMagneticTraceSolidify?.(trace);
      }
    }
  }, [autoSolidifyEnabled, edges, magneticEnabled, manager, nodes, onMagneticTracesChange, onMagneticTraceSolidify]);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  return (
    <div
      id={id}
      data-frnl-component="frnlEditableNodeGraph"
      data-frnl-state={frnl.state}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: frnl.visualParameters.canvasBackground as string,
        opacity: frnl.visualParameters.opacity as number | undefined,
        ...style
      }}
    >
      <NodeGraphCanvas
        nodes={nodes}
        edges={edges}
        viewport={viewport}
        selectedNodeIds={selectedNodeIds}
        availableNodeTypes={availableNodeTypes}
        onNodesChange={(next) => frnl.events.nodesChange(next)}
        onEdgesChange={(next) => frnl.events.edgesChange(next)}
        onViewportChange={(next) => frnl.events.viewportChange(next)}
        onSelectionChange={(next) => frnl.events.selectionChange(next)}
        onNodeDoubleClick={onNodeDoubleClick}
        getSocketTelemetry={signalTelemetryEnabled && getSocketTelemetry
          ? (node, socketId, isOutput) => getSocketTelemetry(node, socketId, isOutput)
          : undefined}
      />

      {traces.length > 0 && (
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 40 }}>
          {traces.map((trace) => {
            const source = nodeMap.get(trace.sourceNodeId);
            const target = nodeMap.get(trace.targetNodeId);
            if (!source || !target) return null;
            const a = socketPoint(source, trace.sourceHandleId, true, viewport);
            const b = socketPoint(target, trace.targetHandleId, false, viewport);
            return (
              <line
                key={trace.id}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={String(frnl.visualParameters.magneticColor ?? '#38bdf8')}
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.8}
              />
            );
          })}
        </svg>
      )}

      {predictive.isActive && predictive.traces.length > 0 && (
        <svg aria-label="Predictive connection traces" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 44 }}>
          {predictive.traces.map((trace: any) => {
            const ghost = predictive.ghostNodes.find((candidate: any) => candidate.id === trace.ghostNodeId) as any;
            if (!ghost) return null;
            const parentId = trace.isFromGhostToParent ? trace.targetNodeId : trace.sourceNodeId;
            const parent = nodeMap.get(parentId);
            if (!parent) return null;
            const ghostNode = ghost.prototypeNode as GraphNode;
            const a = trace.isFromGhostToParent
              ? socketPoint(ghostNode, trace.sourceHandleId, true, viewport)
              : socketPoint(parent, trace.sourceHandleId, true, viewport);
            const b = trace.isFromGhostToParent
              ? socketPoint(parent, trace.targetHandleId, false, viewport)
              : socketPoint(ghostNode, trace.targetHandleId, false, viewport);
            return <line key={trace.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={trace.color ?? 'var(--skipo-accent, #61afef)'} strokeWidth={2} strokeDasharray="4 4" opacity={0.65} />;
          })}
        </svg>
      )}

      {predictive.isActive && predictive.ghostNodes.length > 0 && (
        <>
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 60, display: 'flex', gap: 4, pointerEvents: 'auto' }}>
            <button type="button" onClick={predictive.prevScenario}>←</button>
            <span style={{ padding: '3px 6px', fontSize: 11 }}>Scenario {predictive.scenarioIndex + 1}</span>
            <button type="button" onClick={predictive.nextScenario}>→</button>
            <button type="button" onClick={() => { predictive.solidifyAll(); onPredictiveSolidifyAll?.(predictive.ghostNodes as any[]); }}>Solidify all</button>
          </div>
          <div aria-label="Predictive nodes" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 45 }}>
            {predictive.ghostNodes.map((ghost: any) => {
              const position = ghost.worldPosition ?? [ghost.prototypeNode?.position?.x ?? 0, 0, ghost.prototypeNode?.position?.y ?? 0];
              const x = Number(position[0]) * viewport.zoom + viewport.panX;
              const y = Number(position[2] ?? position[1] ?? 0) * viewport.zoom + viewport.panY;
              return (
                <button
                  key={ghost.id}
                  type="button"
                  style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', pointerEvents: 'auto', opacity: 0.72, border: '1px dashed var(--skipo-accent, #61afef)', background: 'var(--skipo-surface, #20242b)', color: 'var(--skipo-text, #fff)', padding: '6px 10px', borderRadius: 6 }}
                  onClick={() => onPredictiveSolidify?.(ghost.id)}
                >
                  {ghost.prototypeNode?.label ?? ghost.label ?? ghost.id}
                </button>
              );
            })}
          </div>
        </>
      )}
      {predictive.isActive && predictive.selectedNodesWithGhosts.size > 0 && (
        <div aria-label="Predictive node actions" style={{ position: 'absolute', left: 10, bottom: 10, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'auto' }}>
          {Array.from(predictive.selectedNodesWithGhosts.entries()).map(([nodeId, ghosts]) => (
            <button key={nodeId} type="button" onClick={() => { predictive.solidifyAllForNode(nodeId); onPredictiveSolidifyAllForNode?.(nodeId, ghosts as any[]); }}>
              Solidify all for {nodeId} ({ghosts.length})
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

FrnlEditableNodeGraph.displayName = 'FrnlEditableNodeGraph';
