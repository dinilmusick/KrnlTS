'use client';
import type React from 'react';
import type { GraphNode } from '@floks/contracts';
import { MovableSocketView } from './MovableSocketView.js';

export interface NodeCardProps {
  key?: React.Key;
  node: GraphNode;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  onDoubleClick?: (nodeId: string) => void;
  onSocketMouseDown?: (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => void;
  onSocketMouseUp?: (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => void;
  onSocketNudgeChange?: (nodeId: string, socketId: string, nudge: { x: number; y: number }) => void;
  getSocketTelemetry?: (nodeId: string, socketId: string, isOutput: boolean) => MovableSocketTelemetry | undefined;
}

export interface MovableSocketTelemetry {
  audioMonoLevel?: number;
  audioStereoLevels?: { left: number; right: number };
  midi?: { active: boolean; velocity: number; note: number };
  trigger?: { active: boolean; intensity: number };
  osc?: { active: boolean; value: number; phase: number };
  gain?: { db: number; formatted: string; color: string };
}

function renderNodeEmblem(type: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('entity') || t.includes('system')) {
    return (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #d4af37)" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }
  if (t.includes('func') || t.includes('logic')) {
    return (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #61afef)" strokeWidth="1.8">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (t.includes('data') || t.includes('state') || t.includes('db')) {
    return (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#98c379" strokeWidth="1.8">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    );
  }
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #61afef)" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function NodeCard({
  node,
  selected,
  onMouseDown,
  onDoubleClick,
  onSocketMouseDown,
  onSocketMouseUp,
  onSocketNudgeChange,
  getSocketTelemetry
}: NodeCardProps) {
  const width = node.width ?? 130;
  const height = node.height ?? 130;
  const isLongText = (node.label || '').length > 11;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width,
        height,
        userSelect: 'none'
      }}
      onMouseDown={(e) => onMouseDown?.(e, node.id)}
      onDoubleClick={() => onDoubleClick?.(node.id)}
    >
      <style>{`
        @keyframes skipo-marquee-rtl {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Perimeter Bounded Node Body: Anti-spill with overflow:hidden and border */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--skipo-surface, rgba(25, 25, 25, 0.92))',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${selected ? 'var(--skipo-accent, #d4af37)' : 'var(--skipo-border, #333)'}`,
          borderRadius: '8px',
          boxShadow: selected ? '0 0 16px rgba(212, 175, 55, 0.45)' : '0 4px 10px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Top 2/3rd Portion: Scaled Icon Emblem */}
        <div
          style={{
            flex: '2 1 66.7%',
            height: '66.7%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, transparent 72%)',
            overflow: 'hidden'
          }}
        >
          {renderNodeEmblem(node.type)}
        </div>

        {/* Bottom 1/3rd Portion: Small Text Area with RTL Auto-Scroll */}
        <div
          style={{
            flex: '1 1 33.3%',
            height: '33.3%',
            width: '100%',
            borderTop: '1px solid var(--skipo-border, #333)',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: isLongText ? 'flex-start' : 'center'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--skipo-text, #fff)',
                letterSpacing: '0.02em',
                animation: isLongText ? 'skipo-marquee-rtl 6s linear infinite' : 'none'
              }}
            >
              <span>{node.label}</span>
              {isLongText && (
                <span style={{ paddingLeft: '16px', opacity: 0.8 }}>• {node.label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Sockets along Left Outer Border */}
      {node.inputs?.map((socket, idx) => {
        const total = node.inputs?.length ?? 1;
        const topOffset = total === 1 ? height * 0.45 : (height * 0.25) + idx * 24;
        return (
          <MovableSocketView
            key={socket.id}
            nodeId={node.id}
            socket={socket}
            topOffset={topOffset}
            onMouseDown={onSocketMouseDown}
            onMouseUp={onSocketMouseUp}
            onSocketNudgeChange={onSocketNudgeChange}
            telemetry={getSocketTelemetry?.(node.id, socket.id, false)}
          />
        );
      })}

      {/* Output Sockets along Right Outer Border */}
      {node.outputs?.map((socket, idx) => {
        const total = node.outputs?.length ?? 1;
        const topOffset = total === 1 ? height * 0.45 : (height * 0.25) + idx * 24;
        return (
          <MovableSocketView
            key={socket.id}
            nodeId={node.id}
            socket={socket}
            isRight
            topOffset={topOffset}
            onMouseDown={onSocketMouseDown}
            onMouseUp={onSocketMouseUp}
            onSocketNudgeChange={onSocketNudgeChange}
            telemetry={getSocketTelemetry?.(node.id, socket.id, true)}
          />
        );
      })}
    </div>
  );
}
