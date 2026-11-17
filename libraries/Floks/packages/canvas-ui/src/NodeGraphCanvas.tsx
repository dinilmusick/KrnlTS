'use client';
import type React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import type { GraphNode, GraphEdge, NodeGraphConfig, ViewportState, Socket, NodeDefinition } from '@floks/contracts';
import { NodeCard } from './NodeCard.js';
import { WireRenderer } from './WireRenderer.js';
import { canvasToScreen, isNodeInCenterDeadZone, getCenterPanForNode, getNodesInSelection, ConnectionRuleStore } from '@floks/contracts';
import { CompatibleNodePicker } from './node-graph-ui/widgets/CompatibleNodePicker.js';
import { NodeSearchPalette } from './node-graph-ui/widgets/NodeSearchPalette.js';
import { CanvasContextMenu } from './node-graph-ui/widgets/CanvasContextMenu.js';

export interface NodeGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewport: ViewportState;
  config?: NodeGraphConfig;
  selectedNodeIds: Set<string>;
  availableNodeTypes?: NodeDefinition[];
  onNodesChange?: (nodes: GraphNode[]) => void;
  onEdgesChange?: (edges: GraphEdge[]) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getSocketTelemetry?: (node: GraphNode, socketId: string, isOutput: boolean) => any;
}

export function NodeGraphCanvas({
  nodes,
  edges,
  viewport,
  config,
  selectedNodeIds,
  availableNodeTypes,
  onNodesChange,
  onEdgesChange,
  onNodeDoubleClick,
  onViewportChange,
  onSelectionChange,
  getSocketTelemetry
}: NodeGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const nodeMouseDownPos = useRef<{ x: number; y: number; nodeId: string } | null>(null);
  const hasDraggedNode = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Smooth camera glide
  const smoothPanTo = useCallback((targetX: number, targetY: number) => {
    if (!onViewportChange) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startX = viewport.panX;
    const startY = viewport.panY;
    const startTime = performance.now();
    const duration = 220; // 220ms smooth glide

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      onViewportChange({
        ...viewport,
        panX: Math.round(startX + (targetX - startX) * ease),
        panY: Math.round(startY + (targetY - startY) * ease)
      });
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [viewport, onViewportChange]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const [boxSelection, setBoxSelection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [connecting, setConnecting] = useState<{
    nodeId: string; socketId: string; type: 'input' | 'output'; dataType?: string; startX: number; startY: number; endX: number; endY: number;
  } | null>(null);
  const [pickerState, setPickerState] = useState<{
    x: number; y: number; graphX: number; graphY: number; sourceHandle: { nodeId: string; socketId: string; direction: 'input' | 'output'; dataType?: string };
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; graphX: number; graphY: number } | null>(null);
  const [spawnMenuState, setSpawnMenuState] = useState<{ x: number; y: number; graphX: number; graphY: number } | null>(null);
  const lastMousePos = useRef<{ screenX: number; screenY: number }>({ screenX: 0, screenY: 0 });

  // Initialize central rules store
  useEffect(() => {
    if (!ConnectionRuleStore.isInitialized()) ConnectionRuleStore.initializeDefaults();
  }, []);

  // Keyboard Shortcuts: N (Spawn Menu), Cmd+A (Select All), Delete / Backspace (Delete Selected), Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true'
        );
        if (!isInput) {
          e.preventDefault();
          const rect = containerRef.current?.getBoundingClientRect();
          const screenX = lastMousePos.current.screenX || (rect ? rect.width / 2 : 250);
          const screenY = lastMousePos.current.screenY || (rect ? rect.height / 2 : 200);
          const graphX = (screenX - viewport.panX) / viewport.zoom;
          const graphY = (screenY - viewport.panY) / viewport.zoom;
          setContextMenu(null);
          setPickerState(null);
          setSpawnMenuState({ x: screenX, y: screenY, graphX, graphY });
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onSelectionChange?.(new Set(nodes.map(n => n.id)));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.size > 0 && onNodesChange) {
          const remainingNodes = nodes.filter(n => !selectedNodeIds.has(n.id));
          onNodesChange(remainingNodes);
          onEdgesChange?.(edges.filter(ed => !selectedNodeIds.has(ed.source) && !selectedNodeIds.has(ed.target)));
          onSelectionChange?.(new Set());
        }
      } else if (e.key === 'Escape') {
        setContextMenu(null);
        setPickerState(null);
        setSpawnMenuState(null);
        setConnecting(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, selectedNodeIds, viewport, onNodesChange, onEdgesChange, onSelectionChange]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!onViewportChange) return;
    const zoomDelta = e.deltaY * -0.001;
    const minZoom = config?.minZoom ?? 0.25;
    const maxZoom = config?.maxZoom ?? 2.5;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, viewport.zoom + zoomDelta));
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const graphX = (mouseX - viewport.panX) / viewport.zoom;
    const graphY = (mouseY - viewport.panY) / viewport.zoom;
    onViewportChange({ zoom: newZoom, panX: mouseX - graphX * newZoom, panY: mouseY - graphY * newZoom });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    setSpawnMenuState(null);
    if (e.button === 1) { // Middle click: Pan canvas
      setIsPanning(true);
      return;
    }
    if (e.button === 0 && e.target === containerRef.current) { // Left click canvas: Box selection
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setBoxSelection({ startX: x, startY: y, endX: x, endY: y });
      onSelectionChange?.(new Set());
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      lastMousePos.current = { screenX: e.clientX - r.left, screenY: e.clientY - r.top };
    }
    if (isPanning && onViewportChange) {
      onViewportChange({ ...viewport, panX: viewport.panX + e.movementX, panY: viewport.panY + e.movementY });
      return;
    }
    if (boxSelection && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setBoxSelection(prev => prev ? { ...prev, endX: e.clientX - rect.left, endY: e.clientY - rect.top } : null);
      return;
    }
    if (dragNodeId && onNodesChange) {
      if (nodeMouseDownPos.current) {
        const dist = Math.hypot(e.clientX - nodeMouseDownPos.current.x, e.clientY - nodeMouseDownPos.current.y);
        if (dist > 4) {
          hasDraggedNode.current = true;
        }
      }
      const dx = e.movementX / viewport.zoom;
      const dy = e.movementY / viewport.zoom;
      onNodesChange(nodes.map(n => n.id === dragNodeId ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n));
      return;
    }
    if (connecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setConnecting(prev => prev ? { ...prev, endX: e.clientX - rect.left, endY: e.clientY - rect.top } : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);

    // Left-click node selection (without dragging): auto-pan to center IF outside dead zone
    if (nodeMouseDownPos.current && !hasDraggedNode.current) {
      const clickedId = nodeMouseDownPos.current.nodeId;
      const clickedNode = nodes.find(n => n.id === clickedId);
      if (clickedNode && containerRef.current && onViewportChange) {
        const rect = containerRef.current.getBoundingClientRect();
        if (!isNodeInCenterDeadZone(clickedNode, viewport, rect.width, rect.height)) {
          const targetPan = getCenterPanForNode(clickedNode, viewport, rect.width, rect.height);
          smoothPanTo(targetPan.panX, targetPan.panY);
        }
      }
    }
    // When dragging a node (hasDraggedNode.current is true): DO NOT auto-pan! Camera stays put.

    nodeMouseDownPos.current = null;
    hasDraggedNode.current = false;
    setDragNodeId(null);
    if (boxSelection) {
      const selected = getNodesInSelection(boxSelection.startX, boxSelection.startY, boxSelection.endX, boxSelection.endY, nodes, viewport);
      onSelectionChange?.(new Set(selected));
      setBoxSelection(null);
    }
    if (connecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      const graphX = (dropX - viewport.panX) / viewport.zoom;
      const graphY = (dropY - viewport.panY) / viewport.zoom;
      // Dropped on empty canvas: open CompatibleNodePicker
      setPickerState({
        x: dropX, y: dropY, graphX, graphY,
        sourceHandle: { nodeId: connecting.nodeId, socketId: connecting.socketId, direction: connecting.type, dataType: connecting.dataType }
      });
      setConnecting(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContextMenu({ x, y, graphX: (x - viewport.panX) / viewport.zoom, graphY: (y - viewport.panY) / viewport.zoom });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      nodeMouseDownPos.current = { x: e.clientX, y: e.clientY, nodeId };
      hasDraggedNode.current = false;
      setDragNodeId(nodeId);
      if (e.metaKey || e.ctrlKey) { // Cmd+Click toggle
        const next = new Set(selectedNodeIds);
        if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
        onSelectionChange?.(next);
      } else if (!selectedNodeIds.has(nodeId)) {
        onSelectionChange?.(new Set([nodeId]));
      }
    }
  };

  const handleSocketMouseDown = (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const node = nodes.find(n => n.id === nodeId);
    const socket = (type === 'input' ? node?.inputs : node?.outputs)?.find(s => s.id === socketId);
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setConnecting({ nodeId, socketId, type, dataType: socket?.dataType, startX: x, startY: y, endX: x, endY: y });
  };

  const handleSocketMouseUp = (e: React.MouseEvent, targetNodeId: string, targetSocketId: string, targetType: 'input' | 'output') => {
    e.stopPropagation();
    if (!connecting || connecting.nodeId === targetNodeId || connecting.type === targetType) {
      setConnecting(null);
      return;
    }
    const sourceNode = nodes.find(n => n.id === connecting.nodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);
    const sourceSocket = (connecting.type === 'output' ? sourceNode?.outputs : sourceNode?.inputs)?.find(s => s.id === connecting.socketId);
    const targetSocket = (targetType === 'input' ? targetNode?.inputs : targetNode?.outputs)?.find(s => s.id === targetSocketId);
    const canConnect = ConnectionRuleStore.canConnect(
      { handleCategory: 'DATA', dataType: sourceSocket?.dataType || 'ANY', direction: connecting.type === 'output' ? 'OUTPUT' : 'INPUT' },
      { handleCategory: 'DATA', dataType: targetSocket?.dataType || 'ANY', direction: targetType === 'input' ? 'INPUT' : 'OUTPUT' }
    );
    if (canConnect) {
      const isOut = connecting.type === 'output';
      const newEdge: GraphEdge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: isOut ? connecting.nodeId : targetNodeId,
        sourceSocket: isOut ? connecting.socketId : targetSocketId,
        target: isOut ? targetNodeId : connecting.nodeId,
        targetSocket: isOut ? targetSocketId : connecting.socketId,
        locked: true
      };
      onEdgesChange?.([...edges, newEdge]);
    }
    setConnecting(null);
  };

  // Spawn node(s) and solidify connections immediately
  const handlePickerSelect = useCallback((selectedTypes: string[]) => {
    if (!pickerState || !onNodesChange) return;
    const { graphX, graphY, sourceHandle } = pickerState;
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    selectedTypes.forEach((type, idx) => {
      const id = `node-${Date.now()}-${idx}`;
      const posX = graphX + idx * 200;
      const posY = graphY + idx * 40;
      const def = availableNodeTypes?.find(d => d.type === type) || ConnectionRuleStore.getNodeType(type);
      const isSourceOut = sourceHandle.direction === 'output';
      const inputs = def?.inputs?.map(i => ({ id: i.id, label: i.label || i.id, type: 'input' as const, dataType: i.dataType })) ?? [{ id: 'in-1', label: 'In', type: 'input' as const, dataType: sourceHandle.dataType || 'ANY' }];
      const outputs = def?.outputs?.map(o => ({ id: o.id, label: o.label || o.id, type: 'output' as const, dataType: o.dataType })) ?? [{ id: 'out-1', label: 'Out', type: 'output' as const, dataType: sourceHandle.dataType || 'ANY' }];
      newNodes.push({ id, type, label: def?.label || type, position: { x: posX, y: posY }, inputs, outputs });
      const targetSocket = isSourceOut ? inputs[0] : outputs[0];
      if (targetSocket) {
        newEdges.push({
          id: `edge-${Date.now()}-${idx}`,
          source: isSourceOut ? sourceHandle.nodeId : id,
          sourceSocket: isSourceOut ? sourceHandle.socketId : targetSocket.id,
          target: isSourceOut ? id : sourceHandle.nodeId,
          targetSocket: isSourceOut ? targetSocket.id : sourceHandle.socketId,
          locked: true
        });
      }
    });
    onNodesChange([...nodes, ...newNodes]);
    if (newEdges.length > 0) onEdgesChange?.([...edges, ...newEdges]);
    setPickerState(null);
  }, [pickerState, nodes, edges, availableNodeTypes, onNodesChange, onEdgesChange]);

  const handleSocketNudgeChange = (nodeId: string, socketId: string, nudge: { x: number; y: number }) => {
    if (!onNodesChange) return;
    const updatedNodes = nodes.map(n => {
      if (n.id !== nodeId) return n;
      const updateList = (list?: Socket[]) => list?.map(s => s.id === socketId ? { ...s, offset: nudge } : s);
      return {
        ...n,
        inputs: updateList(n.inputs),
        outputs: updateList(n.outputs)
      };
    });
    onNodesChange(updatedNodes);
  };

  const nodesData = nodes.reduce((acc, node) => {
    const p = canvasToScreen(node.position.x, node.position.y, viewport);
    acc[node.id] = {
      x: p.x,
      y: p.y,
      width: (node.width ?? 150) * viewport.zoom,
      height: (node.height ?? 100) * viewport.zoom,
      inputs: node.inputs || [],
      outputs: node.outputs || [],
      zoom: viewport.zoom
    };
    return acc;
  }, {} as Record<string, any>);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--skipo-surface-dark, #181a1f)' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <WireRenderer edges={edges} nodesData={nodesData} connecting={connecting ? { startX: connecting.startX, startY: connecting.startY, endX: connecting.endX, endY: connecting.endY } : null} />
      <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0 0', transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})` }}>
        {nodes.map(node => (
          <NodeCard
            key={node.id}
            node={node}
            selected={selectedNodeIds.has(node.id)}
            onMouseDown={handleNodeMouseDown}
            onDoubleClick={onNodeDoubleClick}
            onSocketMouseDown={handleSocketMouseDown}
            onSocketMouseUp={handleSocketMouseUp}
            onSocketNudgeChange={handleSocketNudgeChange}
            getSocketTelemetry={getSocketTelemetry ? (nodeId, socketId, isOutput) => getSocketTelemetry(nodes.find(n => n.id === nodeId)!, socketId, isOutput) : undefined}
          />
        ))}
      </div>
      {boxSelection && (
        <div style={{ position: 'absolute', left: Math.min(boxSelection.startX, boxSelection.endX), top: Math.min(boxSelection.startY, boxSelection.endY), width: Math.abs(boxSelection.endX - boxSelection.startX), height: Math.abs(boxSelection.endY - boxSelection.startY), backgroundColor: 'rgba(97, 175, 239, 0.18)', border: '1px solid var(--skipo-accent, #61afef)', pointerEvents: 'none' }} />
      )}
      {pickerState && (
        <CompatibleNodePicker x={pickerState.x} y={pickerState.y} sourceHandle={pickerState.sourceHandle} availableNodeTypes={availableNodeTypes} onSelect={handlePickerSelect} onClose={() => setPickerState(null)} />
      )}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x} y={contextMenu.y} availableNodeTypes={availableNodeTypes} hasSelection={selectedNodeIds.size > 0}
          onSpawnNode={(type) => {
            const def = availableNodeTypes?.find(d => d.type === type) || ConnectionRuleStore.getNodeType(type);
            const id = `node-${Date.now()}`;
            const inputs = def?.inputs?.map(i => ({ id: i.id, label: i.label || i.id, type: 'input' as const, dataType: i.dataType })) ?? [{ id: 'in-1', label: 'In', type: 'input' as const }];
            const outputs = def?.outputs?.map(o => ({ id: o.id, label: o.label || o.id, type: 'output' as const, dataType: o.dataType })) ?? [{ id: 'out-1', label: 'Out', type: 'output' as const }];
            onNodesChange?.([...nodes, { id, type, label: def?.label || type, position: { x: contextMenu.graphX, y: contextMenu.graphY }, inputs, outputs }]);
          }}
          onOpenSpawnMenu={() => {
            setSpawnMenuState({
              x: contextMenu.x,
              y: contextMenu.y,
              graphX: contextMenu.graphX,
              graphY: contextMenu.graphY
            });
          }}
          onSelectAll={() => onSelectionChange?.(new Set(nodes.map(n => n.id)))}
          onDeleteSelected={() => {
            onNodesChange?.(nodes.filter(n => !selectedNodeIds.has(n.id)));
            onEdgesChange?.(edges.filter(ed => !selectedNodeIds.has(ed.source) && !selectedNodeIds.has(ed.target)));
            onSelectionChange?.(new Set());
          }}
          onClearSelection={() => onSelectionChange?.(new Set())}
          onClose={() => setContextMenu(null)}
        />
      )}
      {spawnMenuState && (
        <NodeSearchPalette
          x={spawnMenuState.x}
          y={spawnMenuState.y}
          availableNodeTypes={availableNodeTypes}
          onSpawnNode={(type) => {
            const def = availableNodeTypes?.find(d => d.type === type) || ConnectionRuleStore.getNodeType(type);
            const id = `node-${Date.now()}`;
            const inputs = def?.inputs?.map(i => ({ id: i.id, label: i.label || i.id, type: 'input' as const, dataType: i.dataType })) ?? [{ id: 'in-1', label: 'In', type: 'input' as const }];
            const outputs = def?.outputs?.map(o => ({ id: o.id, label: o.label || o.id, type: 'output' as const, dataType: o.dataType })) ?? [{ id: 'out-1', label: 'Out', type: 'output' as const }];
            onNodesChange?.([...nodes, { id, type, label: def?.label || type, position: { x: spawnMenuState.graphX, y: spawnMenuState.graphY }, inputs, outputs }]);
            setSpawnMenuState(null);
          }}
          onClose={() => setSpawnMenuState(null)}
        />
      )}
    </div>
  );
}
