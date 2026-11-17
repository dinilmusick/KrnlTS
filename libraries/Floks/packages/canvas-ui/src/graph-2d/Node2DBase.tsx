// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { SpaceNode } from '@floks/contracts';
import { NodeSocketDescriptor, NodeSocketsResult } from '@floks/contracts';
import { Node2DSpriteSetting } from '@floks/contracts';
import { Socket2D } from './Socket2D.js';
import { RecorderNode } from '@floks/contracts';
import { RecorderWaveformDisplay } from './RecorderWaveformDisplay.js';
import {
  Castle,
  Sparkles,
  Flame,
  FileAudio,
  Activity,
  Layers,
  Music,
  Clock,
  RotateCw,
  Volume2,
  Zap,
  Radio,
  LogIn,
  LogOut,
  GitMerge,
  Split,
  Cpu,
  Repeat,
  Type,
  Hash,
  ToggleLeft,
  Braces,
  Folder,
  FileText,
} from 'lucide-react';

export const NODE_CARD_WIDTH = 210;
export const SOCKET_ROW_HEIGHT = 24;

export interface Node2DBaseProps {
  node: SpaceNode;
  sprite: Node2DSpriteSetting;
  sockets: NodeSocketsResult;
  screenPos: { x: number; y: number };
  zoom: number;
  isSelected: boolean;
  isHovered: boolean;
  isPlaying?: boolean;
  extraHeaderBadge?: React.ReactNode;
  children?: React.ReactNode;
  onNodeMouseDown?: (e: React.MouseEvent) => void;
  onNodeDoubleClick?: (e: React.MouseEvent) => void;
  onNodeMouseEnter?: () => void;
  onNodeMouseLeave?: () => void;
  onSocketHover?: (info: { nodeId: string; socket: NodeSocketDescriptor; screenX: number; screenY: number } | null) => void;
  onSocketMouseDown?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
  onSocketMouseUp?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
}

export const renderSpriteIcon = (iconName: string, color: string, className = 'w-4 h-4 shrink-0') => {
  const props = { className, style: { color } };
  switch (iconName) {
    case 'Castle': return <Castle {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'Flame': return <Flame {...props} />;
    case 'FileAudio': return <FileAudio {...props} />;
    case 'Activity': return <Activity {...props} />;
    case 'Layers': return <Layers {...props} />;
    case 'Music': return <Music {...props} />;
    case 'Clock': return <Clock {...props} />;
    case 'RotateCw': return <RotateCw {...props} />;
    case 'Volume2': return <Volume2 {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'Radio': return <Radio {...props} />;
    case 'LogIn': return <LogIn {...props} />;
    case 'LogOut': return <LogOut {...props} />;
    case 'GitMerge': return <GitMerge {...props} />;
    case 'Split': return <Split {...props} />;
    case 'Cpu': return <Cpu {...props} />;
    case 'Repeat': return <Repeat {...props} />;
    case 'Type': return <Type {...props} />;
    case 'Hash': return <Hash {...props} />;
    case 'ToggleLeft': return <ToggleLeft {...props} />;
    case 'Braces': return <Braces {...props} />;
    case 'Folder': return <Folder {...props} />;
    case 'FileText': return <FileText {...props} />;
    default: return <Castle {...props} />;
  }
};

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. Node2DBase: Master Presentation Frame for 2D Node Cards
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
export const Node2DBase: React.FC<Node2DBaseProps> = ({
  node,
  sprite,
  sockets,
  screenPos,
  zoom,
  isSelected,
  isHovered,
  children,
  onNodeMouseDown,
  onNodeDoubleClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onSocketHover,
  onSocketMouseDown,
  onSocketMouseUp,
}) => {
  const totalRows = Math.max(sockets.inputs.length, sockets.outputs.length, 1);
  const cardHeight = Math.max(70, 36 + totalRows * SOCKET_ROW_HEIGHT);

  const nodeInspectionText = `NODE: ${node.name || sprite.spriteName || node.type} (${(node.type || 'NODE').toUpperCase()})`;

  return (
    <div
      id={`floks-node-2d-${node.id}`}

      data-skipo-tip={nodeInspectionText}
      title={nodeInspectionText}
      onMouseEnter={onNodeMouseEnter}
      onMouseLeave={onNodeMouseLeave}
      onMouseDown={onNodeMouseDown}
      onDoubleClick={onNodeDoubleClick}
      style={{
        transform: `translate(${screenPos.x}px, ${screenPos.y}px) translate(-50%, -50%) scale(${zoom})`,
        width: NODE_CARD_WIDTH,
        minHeight: cardHeight,
        boxShadow: isSelected
          ? `0 0 0 2px #38bdf8, 4px 4px 0px #000000, 0 0 16px ${sprite.glowColor}`
          : `4px 4px 0px #000000, 0 0 10px ${isHovered ? sprite.glowColor : 'rgba(0,0,0,0.5)'}`,
      }}
      className={`absolute flex flex-col bg-[#0b0e17]/95 border-2 rounded-none transition-transform select-none cursor-move z-20 ${
        isSelected ? 'border-sky-400 bg-[#0f172a]' : isHovered ? 'border-amber-400' : 'border-[#334155]'
      }`}
    >
      {/* Icon-Only Body or Recorder Waveform */}
      {node.type === 'recorder' && (node as RecorderNode).isArmed ? (
        <div className="w-full px-2 py-1 my-auto">
          <RecorderWaveformDisplay node={node as RecorderNode} width={180} />
        </div>
      ) : (
        <div className="flex items-center justify-center p-3 flex-1 my-auto">
          {renderSpriteIcon(sprite.iconName, sprite.accentColor, 'w-7 h-7 shrink-0')}
        </div>
      )}

      {children}

      {/* Multi-Socket Rows (2D Node Sockets) */}
      <div className="flex flex-col gap-1 px-1.5 py-1.5 mt-auto border-t border-[#1e293b] bg-black/40">
        {Array.from({ length: totalRows }).map((_, rowIdx) => {
          const inSock = sockets.inputs[rowIdx] as NodeSocketDescriptor | undefined;
          const outSock = sockets.outputs[rowIdx] as NodeSocketDescriptor | undefined;

          return (
            <div key={`socket-row-${rowIdx}`} className="flex items-center justify-between gap-1 text-[9px] h-5">
              {/* Left Input Socket */}
              {inSock ? (
                <Socket2D
                  nodeId={node.id}
                  socket={inSock}
                  onHover={(info) => onSocketHover?.(info)}
                  onMouseDown={(nodeId, sock, e) => onSocketMouseDown?.(nodeId, sock, e)}
                  onMouseUp={(nodeId, sock, e) => onSocketMouseUp?.(nodeId, sock, e)}
                />
              ) : (
                <div />
              )}

              {/* Right Output Socket */}
              {outSock ? (
                <Socket2D
                  nodeId={node.id}
                  socket={outSock}
                  onHover={(info) => onSocketHover?.(info)}
                  onMouseDown={(nodeId, sock, e) => onSocketMouseDown?.(nodeId, sock, e)}
                  onMouseUp={(nodeId, sock, e) => onSocketMouseUp?.(nodeId, sock, e)}
                />
              ) : (
                <div />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
