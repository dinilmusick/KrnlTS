import React, { useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
  type OnSelectionChangeParams,
  type Viewport,
} from '@xyflow/react';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from './store.js';

export type FrnlNodeGraphNode<T extends Record<string, unknown> = Record<string, unknown>> = Node<T>;
export type FrnlNodeGraphEdge = Edge;

export interface FrnlNodeGraphProps {
  id?: string;
  parentId?: string;
  nodes: FrnlNodeGraphNode[];
  edges: FrnlNodeGraphEdge[];
  nodeTypes?: NodeTypes;
  editable?: boolean;
  fitView?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onNodeClick?: NodeMouseHandler;
  onNodeDragStop?: NodeMouseHandler;
  onSelectionChange?: (selection: OnSelectionChangeParams) => void;
  onViewportChange?: (viewport: Viewport) => void;
}

export const frnlNodeGraphDefinition = defineFrnlComponent({
  name: 'frnlNodeGraph',
  states: {
    idle: {
      name: 'idle',
      events: {
        nodeClick: { functionId: 'frnlNodeGraph.idle.nodeClick' },
        nodeDrag: { functionId: 'frnlNodeGraph.idle.nodeDrag' },
        connect: { functionId: 'frnlNodeGraph.idle.connect' },
        nodesChange: { functionId: 'frnlNodeGraph.idle.nodesChange' },
        edgesChange: { functionId: 'frnlNodeGraph.idle.edgesChange' },
        selectionChange: { functionId: 'frnlNodeGraph.idle.selectionChange' },
        viewportChange: { functionId: 'frnlNodeGraph.idle.viewportChange' },
      },
      visualParameters: {
        canvasBackground: 'var(--frnl-node-graph-background, var(--skipo-bg-panel, #0f172a))',
        edgeColor: 'var(--frnl-node-graph-edge, var(--skipo-border-subtle, #334155))',
        selectionColor: 'var(--frnl-node-graph-selection, var(--skipo-accent, #38bdf8))',
      },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
    disabled: {
      name: 'disabled',
      events: {
        nodeClick: { functionId: 'frnlNodeGraph.disabled.nodeClick' },
        nodeDrag: { functionId: 'frnlNodeGraph.disabled.nodeDrag' },
        connect: { functionId: 'frnlNodeGraph.disabled.connect' },
        nodesChange: { functionId: 'frnlNodeGraph.disabled.nodesChange' },
        edgesChange: { functionId: 'frnlNodeGraph.disabled.edgesChange' },
        selectionChange: { functionId: 'frnlNodeGraph.disabled.selectionChange' },
        viewportChange: { functionId: 'frnlNodeGraph.disabled.viewportChange' },
      },
      visualParameters: { opacity: 0.65 },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
  },
});

export const frnlNodeGraph: React.FC<FrnlNodeGraphProps> = ({
  id = 'frnlNodeGraph',
  parentId,
  nodes,
  edges,
  nodeTypes,
  editable = true,
  fitView = true,
  showControls = true,
  showMiniMap = false,
  showBackground = true,
  className = '',
  style,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDragStop,
  onSelectionChange,
  onViewportChange,
}) => {
  const store = useFloksFrnlStore();
  const handlers = useMemo(() => {
    const forward = <T,>(fn?: (value: T) => void) => (value: T) => fn?.(value);
    const forwardNode = (fn?: NodeMouseHandler) => (value: unknown) => {
      const payload = value as { event: Parameters<NodeMouseHandler>[0]; node: Parameters<NodeMouseHandler>[1] };
      fn?.(payload.event, payload.node);
    };
    return {
      'frnlNodeGraph.idle.nodeClick': forwardNode(onNodeClick),
      'frnlNodeGraph.idle.nodeDrag': forwardNode(onNodeDragStop),
      'frnlNodeGraph.idle.connect': forward(onConnect),
      'frnlNodeGraph.idle.nodesChange': forward(onNodesChange),
      'frnlNodeGraph.idle.edgesChange': forward(onEdgesChange),
      'frnlNodeGraph.idle.selectionChange': forward(onSelectionChange),
      'frnlNodeGraph.idle.viewportChange': forward(onViewportChange),
      'frnlNodeGraph.disabled.nodeClick': () => {},
      'frnlNodeGraph.disabled.nodeDrag': () => {},
      'frnlNodeGraph.disabled.connect': () => {},
      'frnlNodeGraph.disabled.nodesChange': () => {},
      'frnlNodeGraph.disabled.edgesChange': () => {},
      'frnlNodeGraph.disabled.selectionChange': () => {},
      'frnlNodeGraph.disabled.viewportChange': () => {},
    };
  }, [onConnect, onEdgesChange, onNodeClick, onNodeDragStop, onNodesChange, onSelectionChange, onViewportChange]);
  const frnl = useFrnlComponent({
    id,
    parentId,
    definition: frnlNodeGraphDefinition,
    store,
    state: editable ? 'idle' : 'disabled',
    properties: { editable, nodeCount: nodes.length, edgeCount: edges.length },
    handlers,
  });

  const graphStyle = useMemo<React.CSSProperties>(() => ({
    width: '100%',
    height: '100%',
    opacity: frnl.visualParameters.opacity as number | undefined,
    background: frnl.visualParameters.canvasBackground as string | undefined,
    ...style,
  }), [frnl.visualParameters, style]);

  return (
    <div id={id} data-frnl-component="frnlNodeGraph" data-frnl-state={frnl.state} className={className} style={graphStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        fitView={fitView}
        onNodesChange={(changes) => frnl.events.nodesChange(changes)}
        onEdgesChange={(changes) => frnl.events.edgesChange(changes)}
        onConnect={(connection) => editable && frnl.events.connect(connection)}
        onNodeClick={(event, node) => editable && frnl.events.nodeClick({ event, node })}
        onNodeDragStop={(event, node) => editable && frnl.events.nodeDrag({ event, node })}
        onSelectionChange={(selection) => editable && frnl.events.selectionChange(selection)}
        onViewportChange={(viewport) => editable && frnl.events.viewportChange(viewport)}
        proOptions={{ hideAttribution: true }}
      >
        {showBackground && <Background />}
        {showControls && <Controls />}
        {showMiniMap && <MiniMap />}
      </ReactFlow>
    </div>
  );
};

frnlNodeGraph.displayName = 'frnlNodeGraph';
