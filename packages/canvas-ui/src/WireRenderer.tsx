'use client';
import type { GraphEdge, NodeGraphConfig } from '@floks/contracts';

interface WireRendererProps {
  edges: GraphEdge[];
  nodesData: Record<string, { x: number; y: number; width: number; height: number; inputs: any[]; outputs: any[] }>;
  config?: NodeGraphConfig;
  onDeleteEdge?: (edgeId: string) => void;
  connecting?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
  } | null;
}

export function WireRenderer({ edges, nodesData, config: _config, onDeleteEdge, connecting }: WireRendererProps) {
  const getSocketPosition = (nodeId: string, socketId: string, type: 'input' | 'output') => {
    const node = nodesData[nodeId];
    if (!node) return { x: 0, y: 0 };
    
    // Simplistic socket position calculation for now
    const sockets = type === 'input' ? node.inputs : node.outputs;
    const socket = sockets?.find(s => s.id === socketId);
    const socketIndex = sockets && socket ? sockets.indexOf(socket) : 0;
      
    let x = type === 'input' ? node.x : node.x + (node.width ?? 150);
    let y = node.y + 40 + (Math.max(0, socketIndex) * 24);
    
    if (socket?.offset) {
      const zoom = (node as any).zoom ?? 1;
      x += socket.offset.x * zoom;
      y += socket.offset.y * zoom;
    }
    
    return { x, y };
  };

  const renderBezier = (startX: number, startY: number, endX: number, endY: number) => {
    const delta = Math.max(Math.abs(endX - startX) * 0.5, 50);
    return `M ${startX},${startY} C ${startX + delta},${startY} ${endX - delta},${endY} ${endX},${endY}`;
  };

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
      {edges.map(edge => {
        const start = getSocketPosition(edge.source, edge.sourceSocket, 'output');
        const end = getSocketPosition(edge.target, edge.targetSocket, 'input');
        
        const path = renderBezier(start.x, start.y, end.x, end.y);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const color = edge.color || '#61afef';

        return (
          <g key={edge.id} style={{ pointerEvents: 'auto' }}>
            {/* Hit area for easier selection/hover if needed */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={15}
            />
            {/* Actual visual wire */}
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={3}
              opacity={0.8}
            />
            {onDeleteEdge && (
              <g 
                transform={`translate(${midX}, ${midY})`} 
                onClick={() => onDeleteEdge(edge.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle r={8} fill="#ff4d4f" />
                <text x={0} y={0} fontSize={10} fill="white" textAnchor="middle" dominantBaseline="central">✕</text>
              </g>
            )}
          </g>
        );
      })}
      
      {connecting && (
        <path
          d={renderBezier(connecting.startX, connecting.startY, connecting.endX, connecting.endY)}
          fill="none"
          stroke={connecting.color || '#61afef'}
          strokeWidth={3}
          strokeDasharray="5,5"
          opacity={0.8}
        />
      )}
    </svg>
  );
}
