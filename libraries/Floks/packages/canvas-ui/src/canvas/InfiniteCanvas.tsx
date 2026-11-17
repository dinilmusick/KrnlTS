'use client';
import type { Transform, CanvasItem } from './types.js';
import { CanvasViewport } from './CanvasViewport.js';
import { MiniMap } from './MiniMap.js';

interface InfiniteCanvasProps {
  items: CanvasItem[];
  transform: Transform;
  onTransformChange: (t: Transform) => void;
  showGrid?: boolean;
  showMiniMap?: boolean;
  gridSize?: number;
}

export function InfiniteCanvas({
  items,
  transform,
  onTransformChange,
  showGrid = true,
  showMiniMap = true,
  gridSize = 40
}: InfiniteCanvasProps) {
  
  const gridBackground = showGrid ? {
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize * transform.scale}px ${gridSize * transform.scale}px`,
    backgroundPosition: `${transform.x}px ${transform.y}px`,
  } : {};

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#16161a', ...gridBackground }}>
      <CanvasViewport transform={transform} onChange={onTransformChange}>
        {items.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
            }}
          >
            {item.content}
          </div>
        ))}
      </CanvasViewport>
      
      {showMiniMap && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 100 }}>
          <MiniMap items={items} transform={transform} />
        </div>
      )}
    </div>
  );
}
