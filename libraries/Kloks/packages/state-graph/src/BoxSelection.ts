import type { GraphNode, ViewportState } from './types.js';

export function getNodesInSelection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  nodes: GraphNode[],
  viewport: ViewportState
): string[] {
  // Convert screen coordinates of selection box to canvas coordinates
  const canvasStartX = (startX - viewport.panX) / viewport.zoom;
  const canvasStartY = (startY - viewport.panY) / viewport.zoom;
  const canvasEndX = (endX - viewport.panX) / viewport.zoom;
  const canvasEndY = (endY - viewport.panY) / viewport.zoom;

  const minX = Math.min(canvasStartX, canvasEndX);
  const maxX = Math.max(canvasStartX, canvasEndX);
  const minY = Math.min(canvasStartY, canvasEndY);
  const maxY = Math.max(canvasStartY, canvasEndY);

  return nodes.filter(node => {
    const nodeWidth = node.width ?? 150;
    const nodeHeight = node.height ?? 100; // approximation
    
    // Check if node rectangle intersects with selection rectangle
    const intersectX = node.position.x < maxX && (node.position.x + nodeWidth) > minX;
    const intersectY = node.position.y < maxY && (node.position.y + nodeHeight) > minY;
    
    return intersectX && intersectY;
  }).map(node => node.id);
}
