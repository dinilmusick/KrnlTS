import React, { useRef, useState, useCallback } from 'react';
import { SolarSystemEntity } from './types.js';

export interface UseSolarInteractionsProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hitMapRef: React.MutableRefObject<Array<{
    entity: SolarSystemEntity;
    x: number;
    y: number;
    radius: number;
    parentScreenX?: number;
    parentScreenY?: number;
  }>>;
  hoveredEntityRef: React.MutableRefObject<SolarSystemEntity | null>;
  selectedEntityRef: React.MutableRefObject<SolarSystemEntity | null>;
  panRef: React.MutableRefObject<{ x: number; y: number }>;
  zoomRef: React.MutableRefObject<number>;
  simTimeRef: React.MutableRefObject<number>;
  setInspectionText: (text: string | null, desc?: string | null) => void;
  onSelectEntity?: (entity: SolarSystemEntity) => void;
  onOpenDetails?: (entity: SolarSystemEntity) => void;
}

export function useSolarInteractions({
  canvasRef,
  hitMapRef,
  hoveredEntityRef,
  selectedEntityRef,
  panRef,
  zoomRef,
  simTimeRef,
  setInspectionText,
  onSelectEntity,
  onOpenDetails
}: UseSolarInteractionsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const draggingSphereRef = useRef<{
    entity: SolarSystemEntity;
    parentScreenX: number;
    parentScreenY: number;
    hasMoved: boolean;
  } | null>(null);

  const updatePan = useCallback((newPan: { x: number; y: number }) => {
    panRef.current = newPan;
  }, [panRef]);

  const updateZoom = useCallback((newZoom: number) => {
    zoomRef.current = newZoom;
  }, [zoomRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging) {
      updatePan({
        x: panRef.current.x + (e.clientX - dragStart.x),
        y: panRef.current.y + (e.clientY - dragStart.y)
      });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggingSphereRef.current) {
      const { entity, parentScreenX, parentScreenY } = draggingSphereRef.current;
      draggingSphereRef.current.hasMoved = true;
      const mouseAngle = Math.atan2(my - parentScreenY, mx - parentScreenX);
      entity.orbitAngle = mouseAngle - simTimeRef.current * entity.orbitSpeed;
      return;
    }

    let hit: SolarSystemEntity | null = null;
    for (const item of hitMapRef.current) {
      if (Math.hypot(item.x - mx, item.y - my) <= item.radius + 4) {
        hit = item.entity;
        break;
      }
    }

    if (hit) {
      if (hoveredEntityRef.current?.id !== hit.id) {
        hoveredEntityRef.current = hit;
        setInspectionText(hit.name, hit.description || `${hit.kind.toUpperCase()}: ${hit.name}`);
      }
    } else if (hoveredEntityRef.current !== null) {
      hoveredEntityRef.current = null;
      setInspectionText(null);
    }
  }, [isDragging, dragStart, updatePan, setInspectionText, canvasRef, hitMapRef, hoveredEntityRef, panRef, simTimeRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button === 0) {
      for (const item of hitMapRef.current) {
        if (Math.hypot(item.x - mx, item.y - my) <= item.radius + 4) {
          if (item.entity.orbitRadius > 0 && item.parentScreenX !== undefined && item.parentScreenY !== undefined) {
            draggingSphereRef.current = {
              entity: item.entity,
              parentScreenX: item.parentScreenX,
              parentScreenY: item.parentScreenY,
              hasMoved: false
            };
            return;
          }
        }
      }
    }
  }, [canvasRef, hitMapRef]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || isDragging) setIsDragging(false);
    if (e.button === 0 && draggingSphereRef.current) draggingSphereRef.current = null;
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    if (draggingSphereRef.current) draggingSphereRef.current = null;
    hoveredEntityRef.current = null;
    setInspectionText(null);
  }, [hoveredEntityRef, setInspectionText]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingSphereRef.current?.hasMoved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const item of hitMapRef.current) {
      if (Math.hypot(item.x - mx, item.y - my) <= item.radius + 4) {
        selectedEntityRef.current = item.entity;
        onSelectEntity?.(item.entity);
        return;
      }
    }
    selectedEntityRef.current = null;
  }, [canvasRef, hitMapRef, onSelectEntity, selectedEntityRef]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const item of hitMapRef.current) {
      if (Math.hypot(item.x - mx, item.y - my) <= item.radius + 4) {
        onOpenDetails?.(item.entity);
        return;
      }
    }
  }, [canvasRef, hitMapRef, onOpenDetails]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    updateZoom(Math.min(2.5, Math.max(0.4, zoomRef.current * zoomFactor)));
  }, [updateZoom, zoomRef]);

  return {
    isDragging,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
    handleDoubleClick,
    handleWheel
  };
}
