'use client';
import type { Transform, CanvasItem } from './types.js';

interface MiniMapProps {
  items: CanvasItem[];
  transform: Transform;
  width?: number;
  height?: number;
}

export function MiniMap({ items, transform, width = 150, height = 100 }: MiniMapProps) {
  // Simple minimap logic - finding bounds
  let minX = 0, minY = 0, maxX = 1000, maxY = 1000;
  
  if (items.length > 0) {
    minX = Math.min(...items.map(i => i.x));
    minY = Math.min(...items.map(i => i.y));
    maxX = Math.max(...items.map(i => i.x + (i.width || 100)));
    maxY = Math.max(...items.map(i => i.y + (i.height || 100)));
  }

  // Padding
  minX -= 200; minY -= 200;
  maxX += 200; maxY += 200;

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  
  const scaleX = width / contentWidth;
  const scaleY = height / contentHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (height - contentHeight * scale) / 2 - minY * scale;

  return (
    <div style={{
      width,
      height,
      backgroundColor: 'rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: item.x * scale + offsetX,
            top: item.y * scale + offsetY,
            width: (item.width || 100) * scale,
            height: (item.height || 100) * scale,
            backgroundColor: 'rgba(97, 175, 239, 0.5)',
            borderRadius: '2px',
          }}
        />
      ))}
      
      {/* Viewport indicator - approximated */}
      <div style={{
        position: 'absolute',
        left: -transform.x / transform.scale * scale + offsetX,
        top: -transform.y / transform.scale * scale + offsetY,
        width: 1000 / transform.scale * scale, // Approximation of viewport width
        height: 800 / transform.scale * scale,
        border: '1px solid #d4af37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
      }} />
    </div>
  );
}
