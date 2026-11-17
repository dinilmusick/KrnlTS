import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from './store.js';

export interface FrnlForceGraphNode {
  id: string;
  label?: string;
  group?: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
}

export interface FrnlForceGraphLink {
  source: string;
  target: string;
}

export interface FrnlForceGraphProps {
  id?: string;
  parentId?: string;
  nodes: FrnlForceGraphNode[];
  links: FrnlForceGraphLink[];
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onNodeClick?: (node: FrnlForceGraphNode) => void;
  onNodeHover?: (node: FrnlForceGraphNode | null) => void;
}

export const frnlForceGraphDefinition = defineFrnlComponent({
  name: 'frnlForceGraph',
  states: {
    idle: {
      name: 'idle',
      events: {
        nodeClick: { functionId: 'frnlForceGraph.idle.nodeClick' },
        nodeHover: { functionId: 'frnlForceGraph.idle.nodeHover' },
      },
      visualParameters: {
        background: 'var(--frnl-force-graph-background, var(--skipo-bg-panel, #0f172a))',
        nodeRadius: 7,
        edgeOpacity: 0.45,
      },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
    focused: {
      name: 'focused',
      events: {
        nodeClick: { functionId: 'frnlForceGraph.focused.nodeClick' },
        nodeHover: { functionId: 'frnlForceGraph.focused.nodeHover' },
      },
      visualParameters: { nodeRadius: 9, edgeOpacity: 0.7 },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
  },
});

export const frnlForceGraph: React.FC<FrnlForceGraphProps> = ({
  id = 'frnlForceGraph',
  parentId,
  nodes,
  links,
  width = 800,
  height = 500,
  className = '',
  style,
  onNodeClick,
  onNodeHover,
}) => {
  const store = useFloksFrnlStore();
  const simulationRef = useRef<Simulation<FrnlForceGraphNode, undefined> | null>(null);
  const [positions, setPositions] = useState<FrnlForceGraphNode[]>(nodes);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const handlers = useMemo(() => ({
    'frnlForceGraph.idle.nodeClick': (node: unknown) => onNodeClick?.(node as FrnlForceGraphNode),
    'frnlForceGraph.idle.nodeHover': (node: unknown) => onNodeHover?.(node as FrnlForceGraphNode | null),
    'frnlForceGraph.focused.nodeClick': (node: unknown) => onNodeClick?.(node as FrnlForceGraphNode),
    'frnlForceGraph.focused.nodeHover': (node: unknown) => onNodeHover?.(node as FrnlForceGraphNode | null),
  }), [onNodeClick, onNodeHover]);
  const frnl = useFrnlComponent({
    id,
    parentId,
    definition: frnlForceGraphDefinition,
    store,
    state: focusedId ? 'focused' : 'idle',
    properties: { nodeCount: nodes.length, edgeCount: links.length },
    handlers,
  });

  useEffect(() => {
    const simulation = forceSimulation<FrnlForceGraphNode>(nodes.map((node) => ({ ...node })))
      .force('charge', forceManyBody().strength(-70))
      .force('center', forceCenter(width / 2, height / 2))
      .force('x', forceX(width / 2).strength(0.04))
      .force('y', forceY(height / 2).strength(0.04))
      .force('link', forceLink<FrnlForceGraphNode, any>(links.map((link) => ({ ...link }))).id((node) => node.id).distance(120).strength(0.7))
      .alphaDecay(0.08)
      .velocityDecay(0.45);
    simulation.on('tick', () => setPositions([...simulation.nodes()]));
    simulationRef.current = simulation;
    return () => { simulation.stop(); simulationRef.current = null; };
  }, [height, links, nodes, width]);

  const nodeRadius = Number(frnl.visualParameters.nodeRadius ?? 7);
  const edgeOpacity = Number(frnl.visualParameters.edgeOpacity ?? 0.45);
  const background = String(frnl.visualParameters.background ?? 'transparent');

  return (
    <svg id={id} data-frnl-component="frnlForceGraph" data-frnl-state={frnl.state} className={className}
      width={width} height={height} viewBox={'0 0 ' + width + ' ' + height}
      style={{ background, ...style }}>
      {links.map((link, index) => {
        const source = positions.find((node) => node.id === link.source);
        const target = positions.find((node) => node.id === link.target);
        if (!source || !target) return null;
        return <line key={index} x1={source.x ?? 0} y1={source.y ?? 0} x2={target.x ?? 0} y2={target.y ?? 0}
          stroke="currentColor" opacity={edgeOpacity} />;
      })}
      {positions.map((node) => (
        <g key={node.id} transform={'translate(' + (node.x ?? 0) + ' ' + (node.y ?? 0) + ')'}
          onMouseEnter={() => frnl.events.nodeHover(node)} onMouseLeave={() => frnl.events.nodeHover(null)}
          onClick={() => { setFocusedId(node.id); frnl.events.nodeClick(node); }}>
          <circle r={node.id === focusedId ? nodeRadius + 2 : nodeRadius} fill="currentColor" />
          <text x={nodeRadius + 5} y="4" fontSize="11" fill="currentColor">{node.label ?? node.id}</text>
        </g>
      ))}
    </svg>
  );
};

frnlForceGraph.displayName = 'frnlForceGraph';
