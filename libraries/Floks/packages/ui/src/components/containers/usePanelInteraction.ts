import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { PanelGeometry } from './usePanelGeometry.js';
import type { ResizeDirection } from './ResizeHandles.js';

function calculateResized(dir: ResizeDirection, orig: PanelGeometry, dx: number, dy: number, minW: number, minH: number): PanelGeometry {
  let { x, y, width, height } = orig;
  if (dir.includes('e')) width = Math.max(minW, orig.width + dx);
  if (dir.includes('s')) height = Math.max(minH, orig.height + dy);
  if (dir.includes('w')) {
    const nextW = Math.max(minW, orig.width - dx);
    x = orig.x + (orig.width - nextW);
    width = nextW;
  }
  if (dir.includes('n')) {
    const nextH = Math.max(minH, orig.height - dy);
    y = orig.y + (orig.height - nextH);
    height = nextH;
  }
  return { x, y, width, height };
}

function calculateDragged(orig: PanelGeometry, dx: number, dy: number): PanelGeometry {
  const maxW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const maxH = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const nextX = Math.max(0, Math.min(maxW - 60, orig.x + dx));
  const nextY = Math.max(0, Math.min(maxH - 40, orig.y + dy));
  return { ...orig, x: nextX, y: nextY };
}

function useInteractionListeners(
  isInteracting: boolean,
  setIsInteracting: (v: boolean) => void,
  activeOpRef: React.MutableRefObject<{ type: 'drag' | 'resize'; dir?: ResizeDirection; startX: number; startY: number; origGeo: PanelGeometry } | null>,
  updateGeometry: (next: Partial<PanelGeometry> | ((prev: PanelGeometry) => PanelGeometry)) => void,
  minWidth: number,
  minHeight: number
) {
  useEffect(() => {
    if (!isInteracting) return;
    const onMouseMove = (e: MouseEvent) => {
      const op = activeOpRef.current;
      if (!op) return;
      const dx = e.clientX - op.startX;
      const dy = e.clientY - op.startY;
      if (op.type === 'drag') updateGeometry(calculateDragged(op.origGeo, dx, dy));
      if (op.type === 'resize' && op.dir) updateGeometry(calculateResized(op.dir, op.origGeo, dx, dy, minWidth, minHeight));
    };
    const onMouseUp = () => { setIsInteracting(false); activeOpRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isInteracting, minWidth, minHeight, updateGeometry, setIsInteracting, activeOpRef]);
}

export function usePanelInteraction(
  geometry: PanelGeometry,
  updateGeometry: (next: Partial<PanelGeometry> | ((prev: PanelGeometry) => PanelGeometry)) => void,
  minWidth: number,
  minHeight: number
) {
  const [isInteracting, setIsInteracting] = useState(false);
  const activeOpRef = useRef<{ type: 'drag' | 'resize'; dir?: ResizeDirection; startX: number; startY: number; origGeo: PanelGeometry } | null>(null);

  const handleMouseDownHeader = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsInteracting(true);
    activeOpRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, origGeo: { ...geometry } };
  }, [geometry]);

  const handleStartResize = useCallback((dir: ResizeDirection, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInteracting(true);
    activeOpRef.current = { type: 'resize', dir, startX: e.clientX, startY: e.clientY, origGeo: { ...geometry } };
  }, [geometry]);

  useInteractionListeners(isInteracting, setIsInteracting, activeOpRef, updateGeometry, minWidth, minHeight);
  return { isInteracting, handleMouseDownHeader, handleStartResize };
}

