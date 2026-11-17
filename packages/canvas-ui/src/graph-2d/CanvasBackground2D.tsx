import React, { useMemo } from 'react';
import { SpaceNode } from '@floks/contracts';
import { CameraState, BIOME_CONFIGS, COORD_SCALE } from './types.js';

interface CanvasBackground2DProps {
  currentBiome?: string;
  camera: CameraState;
  containerSize: { width: number; height: number };
  nodes: SpaceNode[];
  worldToScreen: (x: number, z: number) => { x: number; y: number };
}

export const CanvasBackground2D: React.FC<CanvasBackground2DProps> = ({
  currentBiome = 'default',
  camera,
  containerSize,
  nodes,
  worldToScreen,
}) => {
  const biome = BIOME_CONFIGS[currentBiome] || BIOME_CONFIGS.default;

  // Generate grid line coordinates based on camera position and zoom
  const gridLines = useMemo((): string => {
    const lines: string[] = [];
    const gridSize = 100 * camera.zoom;
    if (gridSize < 15) return ''; // Don't render if too dense

    const cx = containerSize.width / 2;
    const cy = containerSize.height / 2;
    const offsetX = (cx - camera.x * COORD_SCALE * camera.zoom) % gridSize;
    const offsetY = (cy - camera.y * COORD_SCALE * camera.zoom) % gridSize;

    for (let x = offsetX - gridSize; x < containerSize.width + gridSize; x += gridSize) {
      lines.push(`M ${x} 0 V ${containerSize.height}`);
    }
    for (let y = offsetY - gridSize; y < containerSize.height + gridSize; y += gridSize) {
      lines.push(`M 0 ${y} H ${containerSize.width}`);
    }
    return lines.join(' ');
  }, [camera, containerSize]);

  // AoE Aura Fields for active / radiating nodes (deduplicated by ID to avoid React key collisions)
  const uniqueNodes = useMemo(() => {
    const seen = new Set<string>();
    return nodes.filter((node) => {
      if (!node.id) return false;
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
  }, [nodes]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ backgroundColor: biome.bg }}
    >
      {/* Background Grid */}
      <path d={gridLines} stroke={biome.gridColor} strokeWidth={1} fill="none" />

      {/* AoE Aura Fields */}
      {uniqueNodes.map((node) => {
        const screenPos = worldToScreen(node.position[0], node.position[2]);
        const nodeRadius = (node as any).aoeRadius || (node as any).radius;
        const radius = (nodeRadius !== undefined ? nodeRadius * COORD_SCALE : 120) * camera.zoom;
        if (radius <= 5) return null;

        return (
          <g key={`aoe-${node.id}`} opacity={0.6}>
            <circle
              cx={screenPos.x}
              cy={screenPos.y}
              r={radius}
              fill={biome.aoeColor}
              stroke={biome.gridColor}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          </g>
        );
      })}
    </svg>
  );
};
