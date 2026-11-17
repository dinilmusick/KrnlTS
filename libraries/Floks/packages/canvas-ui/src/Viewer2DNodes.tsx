'use client';
import type React from 'react';
import { useState, useRef } from 'react';
import type { GraphNode, Socket } from '@floks/contracts';
import { getBeamPoints, calculateSocketCoordinates } from '@floks/contracts';

export interface Viewer2DNodesProps {
  key?: React.Key;
  node: GraphNode;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  onDoubleClick?: (nodeId: string) => void;
  onSocketMouseDown?: (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => void;
  onSocketNudgeChange?: (nodeId: string, socketId: string, nudge: { x: number; y: number }) => void;
}

export function Viewer2DNodes({
  node,
  selected,
  onMouseDown,
  onDoubleClick,
  onSocketMouseDown,
  onSocketNudgeChange
}: Viewer2DNodesProps) {
  const cardWidth = node.width ?? 180;
  const headerHeight = 36;
  const socketSpacing = 36;
  const centerX = cardWidth / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: cardWidth,
        backgroundColor: 'rgba(20, 24, 30, 0.9)',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${selected ? '#d4af37' : 'rgba(255, 255, 255, 0.12)'}`,
        borderRadius: '10px',
        color: '#f5ede4',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
        boxShadow: selected ? '0 0 20px rgba(212, 175, 55, 0.45)' : '0 8px 16px rgba(0, 0, 0, 0.4)',
        zIndex: selected ? 25 : 15
      }}
      onMouseDown={(e) => onMouseDown?.(e, node.id)}
      onDoubleClick={() => onDoubleClick?.(node.id)}
    >
      {/* Node Header */}
      <div
        style={{
          height: `${headerHeight}px`,
          padding: '0 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>{node.label}</span>
        <span
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#a0aec0'
          }}
        >
          {node.type}
        </span>
      </div>

      {/* Node Content / Body Area */}
      <div style={{ position: 'relative', minHeight: '60px', padding: '12px 16px' }}>
        {node.data && (
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {Object.keys(node.data).length} properties
          </div>
        )}
      </div>

      {/* Sockets Container (centered horizontally at node midpoint) */}
      <div style={{ position: 'absolute', top: headerHeight + 10, left: centerX, width: 0, height: 0 }}>
        {node.inputs?.map((socket, idx) => (
          <MovableSocketHandle
            key={socket.id}
            socket={socket}
            nodeId={node.id}
            cardWidth={cardWidth}
            isOutput={false}
            baseY={idx * socketSpacing}
            onSocketMouseDown={onSocketMouseDown}
            onSocketNudgeChange={onSocketNudgeChange}
          />
        ))}

        {node.outputs?.map((socket, idx) => (
          <MovableSocketHandle
            key={socket.id}
            socket={socket}
            nodeId={node.id}
            cardWidth={cardWidth}
            isOutput={true}
            baseY={idx * socketSpacing}
            onSocketMouseDown={onSocketMouseDown}
            onSocketNudgeChange={onSocketNudgeChange}
          />
        ))}
      </div>
    </div>
  );
}

interface MovableSocketHandleProps {
  key?: React.Key;
  socket: Socket;
  nodeId: string;
  cardWidth: number;
  isOutput: boolean;
  baseY: number;
  onSocketMouseDown?: (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => void;
  onSocketNudgeChange?: (nodeId: string, socketId: string, nudge: { x: number; y: number }) => void;
}

export function MovableSocketHandle({
  socket,
  nodeId,
  cardWidth,
  isOutput,
  baseY,
  onSocketMouseDown,
  onSocketNudgeChange
}: MovableSocketHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localNudge, setLocalNudge] = useState<{ x: number; y: number }>(
    socket.offset ?? { x: 0, y: 0 }
  );
  const isDraggingGizmoRef = useRef(false);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number; origX: number; origY: number }>({
    clientX: 0,
    clientY: 0,
    origX: 0,
    origY: 0
  });

  const nudge = socket.offset ?? localNudge;
  const isDisplaced = nudge.x !== 0 || nudge.y !== 0;

  // Implementation directive coordinate math with 12px spatial clearance
  const coords = calculateSocketCoordinates(baseY, {
    cardWidth,
    isOutput,
    clearance: 12,
    nudge
  });

  // Gizmo dragging handlers
  const handleGizmoMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingGizmoRef.current = true;
    dragStartPosRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      origX: nudge.x,
      origY: nudge.y
    };

    const handleWindowMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingGizmoRef.current) return;
      const dx = moveEvt.clientX - dragStartPosRef.current.clientX;
      const dy = moveEvt.clientY - dragStartPosRef.current.clientY;
      const updated = {
        x: Math.round(dragStartPosRef.current.origX + dx),
        y: Math.round(dragStartPosRef.current.origY + dy)
      };
      setLocalNudge(updated);
      onSocketNudgeChange?.(nodeId, socket.id, updated);
    };

    const handleWindowMouseUp = () => {
      isDraggingGizmoRef.current = false;
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Tapered energy beam points relative to displaced handle
  const beamCorePoints = getBeamPoints(nudge, 5, 1.2);
  const beamShroudPoints = getBeamPoints(nudge, 8, 2.5);

  const socketThemeColor = isOutput ? '#61afef' : '#98c379';
  const gizmoOffsetX = isOutput ? 18 : -18;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tapered Energy Beam Tether rendered when displaced */}
      {isDisplaced && (
        <svg
          style={{
            position: 'absolute',
            left: coords.effectiveX,
            top: coords.effectiveY,
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {/* Glowing outer shroud */}
          <polygon
            points={beamShroudPoints}
            fill={socketThemeColor}
            opacity={0.35}
          />
          {/* Intense inner core */}
          <polygon
            points={beamCorePoints}
            fill="#ffffff"
            opacity={0.9}
          />
        </svg>
      )}

      {/* Displaced Socket Handle (28px / w-7 h-7) */}
      <div
        style={{
          position: 'absolute',
          left: coords.effectiveX - 14,
          top: coords.effectiveY - 14,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#181a1f',
          border: `2px solid ${socketThemeColor}`,
          boxShadow: isHovered
            ? `0 0 12px ${socketThemeColor}, inset 0 0 6px ${socketThemeColor}`
            : '0 2px 6px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'crosshair',
          zIndex: 4
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSocketMouseDown?.(e, nodeId, socket.id, isOutput ? 'output' : 'input');
        }}
      >
        {/* Internal visual indicator for connection states */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: socketThemeColor,
            boxShadow: `0 0 4px ${socketThemeColor}`
          }}
        />
      </div>

      {/* Hover-activated drag gizmo adjacent to handle */}
      {(isHovered || isDraggingGizmoRef.current) && (
        <div
          title="Drag to displace socket handle"
          style={{
            position: 'absolute',
            left: coords.effectiveX + gizmoOffsetX - 8,
            top: coords.effectiveY - 8,
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: 'rgba(30, 34, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            zIndex: 6,
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
          onMouseDown={handleGizmoMouseDown}
        >
          {/* Monochromatic 4-way move vector icon */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" />
            <polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
        </div>
      )}
    </div>
  );
}
