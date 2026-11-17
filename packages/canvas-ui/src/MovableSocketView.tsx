'use client';
import type React from 'react';
import { useState, useRef } from 'react';
import type { Socket } from '@floks/contracts';
import { getBeamPoints } from '@floks/contracts';

export interface MovableSocketViewProps {
  key?: React.Key;
  nodeId: string;
  socket: Socket;
  isRight?: boolean;
  topOffset?: number;
  onMouseDown?: (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => void;
  onMouseUp?: (e: React.MouseEvent, nodeId: string, socketId: string, type: 'input' | 'output') => void;
  onSocketNudgeChange?: (nodeId: string, socketId: string, nudge: { x: number; y: number }) => void;
  telemetry?: {
    audioMonoLevel?: number;
    audioStereoLevels?: { left: number; right: number };
    midi?: { active: boolean; velocity: number; note: number };
    trigger?: { active: boolean; intensity: number };
    osc?: { active: boolean; value: number; phase: number };
    gain?: { db: number; formatted: string; color: string };
  };
}

export function MovableSocketView({
  nodeId,
  socket,
  isRight = false,
  topOffset = 50,
  onMouseDown,
  onMouseUp,
  onSocketNudgeChange,
  telemetry
}: MovableSocketViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingGizmo = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  const nudge = socket.offset ?? { x: 0, y: 0 };
  const isDisplaced = nudge.x !== 0 || nudge.y !== 0;
  const themeColor = isRight ? 'var(--skipo-accent, #61afef)' : '#98c379';
  const beamPoints = isDisplaced ? getBeamPoints(nudge, 6, 1.5) : '';

  const handleGizmoMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingGizmo.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, origX: nudge.x, origY: nudge.y };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingGizmo.current) return;
      const updated = {
        x: Math.round(dragStart.current.origX + (ev.clientX - dragStart.current.x)),
        y: Math.round(dragStart.current.origY + (ev.clientY - dragStart.current.y))
      };
      onSocketNudgeChange?.(nodeId, socket.id, updated);
    };

    const handleMouseUpDoc = () => {
      isDraggingGizmo.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUpDoc);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUpDoc);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: isRight ? '100%' : '0',
        top: `${topOffset}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        userSelect: 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tapered Energy Beam Tether */}
      {isDisplaced && (
        <svg
          style={{
            position: 'absolute',
            left: nudge.x + 6,
            top: nudge.y + 6,
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <polygon points={beamPoints} fill={themeColor} opacity={0.5} />
          <polygon points={beamPoints} fill="#ffffff" opacity={0.8} transform="scale(0.5)" />
        </svg>
      )}

      {telemetry && (
        <div
          aria-label={`Live signal on ${socket.label}`}
          style={{
            position: 'absolute',
            left: isRight ? 10 : -10,
            top: nudge.y,
            transform: `translateY(-50%) ${isRight ? '' : 'translateX(-100%)'}`,
            minWidth: 34,
            padding: '1px 3px',
            borderRadius: 3,
            background: 'rgba(0,0,0,0.72)',
            border: `1px solid ${telemetry.gain?.color ?? (telemetry.midi?.active ? '#ec4899' : themeColor)}`,
            color: telemetry.gain?.color ?? (telemetry.midi?.active ? '#ec4899' : themeColor),
            fontSize: 7,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 8
          }}
        >
          {telemetry.midi?.active ? `MIDI ${telemetry.midi.note}` :
           telemetry.gain?.formatted ?? (telemetry.trigger?.active ? 'TRIGGER' :
           telemetry.osc?.active ? telemetry.osc.value.toFixed(2) :
           telemetry.audioStereoLevels ? `${Math.round(Math.max(telemetry.audioStereoLevels.left, telemetry.audioStereoLevels.right) * 100)}%` : '')}
        </div>
      )}

      {/* Socket Handle */}
      <div
        style={{
          position: 'absolute',
          left: nudge.x - 6,
          top: nudge.y - 6,
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: themeColor,
          cursor: 'crosshair',
          border: '2px solid var(--skipo-surface, #222)',
          boxShadow: isHovered ? `0 0 8px ${themeColor}` : '0 2px 4px rgba(0,0,0,0.5)',
          zIndex: 4,
          transition: 'box-shadow 0.15s ease'
        }}
        title={`${socket.label} (${socket.type})`}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown?.(e, nodeId, socket.id, isRight ? 'output' : 'input');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onMouseUp?.(e, nodeId, socket.id, isRight ? 'output' : 'input');
        }}
      />

      {/* 4-Way Move Gizmo to displace handle without moving node body */}
      {isHovered && (
        <div
          title="Drag gizmo to move handle without moving node"
          style={{
            position: 'absolute',
            left: nudge.x + (isRight ? 10 : -22),
            top: nudge.y - 7,
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            backgroundColor: 'var(--skipo-surface, #222)',
            border: '1px solid var(--skipo-accent, #d4af37)',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6
          }}
          onMouseDown={handleGizmoMouseDown}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--skipo-accent, #d4af37)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
          </svg>
        </div>
      )}
    </div>
  );
}
