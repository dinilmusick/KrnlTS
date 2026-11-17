'use client';
import React, { useRef, useState } from 'react';
import type { Transform } from './types.js';

interface CanvasViewportProps {
  children: React.ReactNode;
  transform: Transform;
  onChange: (t: Transform) => void;
  minZoom?: number;
  maxZoom?: number;
}

export function CanvasViewport({ 
  children, 
  transform, 
  onChange, 
  minZoom = 0.1, 
  maxZoom = 5 
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    // Using the same math logic as node-graph Viewport
    const zoomDelta = e.deltaY * -0.001;
    let newScale = transform.scale + zoomDelta;
    newScale = Math.max(minZoom, Math.min(maxZoom, newScale));
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const graphX = (mouseX - transform.x) / transform.scale;
    const graphY = (mouseY - transform.y) / transform.scale;

    const x = mouseX - graphX * newScale;
    const y = mouseY - graphY * newScale;
    
    onChange({ x, y, scale: newScale });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || e.metaKey))) {
      setIsPanning(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onChange({
        ...transform,
        x: transform.x + e.movementX,
        y: transform.y + e.movementY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transformOrigin: '0 0',
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        willChange: 'transform'
      }}>
        {children}
      </div>
    </div>
  );
}
