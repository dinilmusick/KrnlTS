'use client';
import { useState, useRef, useEffect } from 'react';
import type { TileConfig } from './types.js';
import { Tile } from './Tile.js';

export function TileGrid({
  tiles,
  onReorder: _onReorder,
  onTileClick
}: {
  tiles: TileConfig[];
  onReorder?: (tiles: TileConfig[]) => void;
  onTileClick?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(3);
  const [tileMinHeight, setTileMinHeight] = useState<number>(110);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0) return;

        // Dynamic column & row configuration based on container width & height
        let cols = 1;
        if (width >= 1200) cols = 4;
        else if (width >= 860) cols = 3;
        else if (width >= 540) cols = 2;
        else cols = 1;

        // Adapt tile height based on available container vertical height and total tiles
        const estimatedRows = Math.ceil(tiles.length / cols);
        let dynamicHeight = 110;
        if (height > 0 && estimatedRows > 0) {
          const availableRowHeight = (height - (estimatedRows + 1) * 16) / estimatedRows;
          dynamicHeight = Math.max(90, Math.min(180, Math.floor(availableRowHeight)));
        }

        setColumns(cols);
        setTileMinHeight(dynamicHeight);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [tiles.length]);

  return (
    <div
      ref={containerRef}
      className="skipo-tile-grid-container"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `minmax(${tileMinHeight}px, auto)`,
        gap: '14px',
        padding: '14px',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} onClick={onTileClick} />
      ))}
    </div>
  );
}
