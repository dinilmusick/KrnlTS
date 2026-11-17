import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraState, COORD_SCALE } from './types.js';

export function useCanvas2DCoordinates() {
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 });
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const worldToScreen = useCallback(
    (wx: number, wz: number): { x: number; y: number } => {
      const cx = containerSize.width / 2;
      const cy = containerSize.height / 2;
      return {
        x: cx + (wx - camera.x) * COORD_SCALE * camera.zoom,
        y: cy + (wz - camera.y) * COORD_SCALE * camera.zoom,
      };
    },
    [camera, containerSize]
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number): [number, number, number] => {
      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const localX = sx - rect.left;
      const localY = sy - rect.top;
      const cx = containerSize.width / 2;
      const cy = containerSize.height / 2;
      const wx = (localX - cx) / (camera.zoom * COORD_SCALE) + camera.x;
      const wz = (localY - cy) / (camera.zoom * COORD_SCALE) + camera.y;
      return [wx, 0, wz];
    },
    [camera, containerSize]
  );

  const setCameraPosition = useCallback((x: number, y: number, zoom?: number) => {
    setCamera((prev) => ({
      x,
      y,
      zoom: zoom !== undefined ? zoom : prev.zoom,
    }));
  }, []);

  return {
    camera,
    setCamera,
    setCameraPosition,
    containerSize,
    containerRef,
    worldToScreen,
    screenToWorld,
  };
}
