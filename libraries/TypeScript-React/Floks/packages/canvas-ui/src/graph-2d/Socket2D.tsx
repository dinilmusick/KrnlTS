// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { NodeSocketDescriptor } from '@floks/contracts';
import { SIGNAL_TYPES } from '@floks/contracts';

export interface Socket2DProps {
  nodeId: string;
  socket: NodeSocketDescriptor;
  direction?: 'in' | 'out';
  isConnected?: boolean;
  onSocketHover?: (info: { nodeId: string; socket: NodeSocketDescriptor; screenX: number; screenY: number } | null) => void;
  onSocketMouseDown?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
  onSocketMouseUp?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
  onHover?: (info: { nodeId: string; socket: NodeSocketDescriptor; screenX: number; screenY: number } | null) => void;
  onMouseDown?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
  onMouseUp?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. Socket2D: Interactive 2D Socket Component
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
export const Socket2D: React.FC<Socket2DProps> = ({
  nodeId,
  socket,
  direction,
  isConnected = false,
  onSocketHover,
  onSocketMouseDown,
  onSocketMouseUp,
  onHover,
  onMouseDown,
  onMouseUp,
}) => {
  const sigDef = SIGNAL_TYPES[socket.signalType] || SIGNAL_TYPES.trigger;
  const colorStr = sigDef.colorStr;
  const resolvedDirection = direction || (socket.polarity === 'input' ? 'in' : 'out');
  const isInput = resolvedDirection === 'in';
  const portKey = (socket as any).portId || socket.socketId;
  const hoverCb = onSocketHover || onHover;
  const downCb = onSocketMouseDown || onMouseDown;
  const upCb = onSocketMouseUp || onMouseUp;

  return (
    <div
      id={`socket-2d-${nodeId}-${resolvedDirection}-${portKey}`}
      className={`flex items-center gap-1.5 cursor-pointer group/sock select-none ${
        isInput ? 'justify-start' : 'justify-end ml-auto'
      }`}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        hoverCb?.({
          nodeId,
          socket,
          screenX: isInput ? rect.left : rect.right,
          screenY: rect.top,
        });
      }}
      onMouseLeave={() => hoverCb?.(null)}
      onMouseDown={(e) => {
        e.stopPropagation();
        downCb?.(nodeId, socket, e);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        upCb?.(nodeId, socket, e);
      }}
    >
      {isInput && (
        <div
          style={{ backgroundColor: colorStr }}
          className={`w-2.5 h-2.5 rounded-full border border-black group-hover/sock:scale-130 transition-transform ${
            isConnected ? 'ring-1 ring-white/60' : 'opacity-85'
          }`}
        />
      )}

      <span className="font-mono font-bold text-[9px] text-neutral-300 group-hover/sock:text-amber-300 tracking-tight">
        {socket.label}
      </span>

      {!isInput && (
        <div
          style={{ backgroundColor: colorStr }}
          className={`w-2.5 h-2.5 rotate-45 border border-black group-hover/sock:scale-130 transition-transform ${
            isConnected ? 'ring-1 ring-white/60' : 'opacity-85'
          }`}
        />
      )}
    </div>
  );
};
