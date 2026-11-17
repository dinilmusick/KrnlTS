import type { ViewportState, NodeGraphConfig, GraphNode } from './types.js';

/**
 * Converts screen coordinates to canvas coordinates based on the viewport.
 */
export function screenToCanvas(
  clientX: number,
  clientY: number,
  viewport: ViewportState
): { x: number; y: number } {
  return {
    x: (clientX - viewport.panX) / viewport.zoom,
    y: (clientY - viewport.panY) / viewport.zoom,
  };
}

/**
 * Converts canvas coordinates to screen coordinates based on the viewport.
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: ViewportState
): { x: number; y: number } {
  return {
    x: canvasX * viewport.zoom + viewport.panX,
    y: canvasY * viewport.zoom + viewport.panY,
  };
}

/**
 * Zooms the viewport centered on the given mouse coordinates.
 */
export function zoomAtPoint(
  mouseX: number,
  mouseY: number,
  delta: number,
  viewport: ViewportState,
  config: NodeGraphConfig = {}
): ViewportState {
  const currentZoom = viewport.zoom;
  let newZoom = currentZoom + delta;
  
  newZoom = clampZoom(newZoom, config);

  const graphX = (mouseX - viewport.panX) / currentZoom;
  const graphY = (mouseY - viewport.panY) / currentZoom;

  const panX = mouseX - graphX * newZoom;
  const panY = mouseY - graphY * newZoom;

  return { zoom: newZoom, panX, panY };
}

/**
 * Clamps the zoom value between the min and max allowed zoom levels.
 */
export function clampZoom(zoom: number, config: NodeGraphConfig = {}): number {
  const minZoom = config.minZoom ?? 0.25;
  const maxZoom = config.maxZoom ?? 2.5;
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Calculates a viewport state that fits all provided nodes within the container.
 */
export function fitToView(
  nodes: GraphNode[],
  containerWidth: number,
  containerHeight: number,
  padding: number = 50
): ViewportState {
  if (nodes.length === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    const width = node.width ?? 150;
    const height = node.height ?? 100;
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  const zoomX = (containerWidth - padding * 2) / graphWidth;
  const zoomY = (containerHeight - padding * 2) / graphHeight;
  const targetZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in more than 1x

  const panX = (containerWidth - graphWidth * targetZoom) / 2 - minX * targetZoom;
  const panY = (containerHeight - graphHeight * targetZoom) / 2 - minY * targetZoom;

  return { zoom: targetZoom, panX, panY };
}

/**
 * Checks if a node's center is already within the central dead-zone circle of the viewport.
 * If true, camera should not auto-pan on selection to prevent irritating jitter.
 */
export function isNodeInCenterDeadZone(
  node: GraphNode,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number,
  deadZoneRatio: number = 0.35
): boolean {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const nodeW = node.width ?? 130;
  const nodeH = node.height ?? 130;
  const nodeCenterX = node.position.x + nodeW / 2;
  const nodeCenterY = node.position.y + nodeH / 2;
  const screenNodeX = nodeCenterX * viewport.zoom + viewport.panX;
  const screenNodeY = nodeCenterY * viewport.zoom + viewport.panY;
  const dist = Math.hypot(screenNodeX - centerX, screenNodeY - centerY);
  const deadZoneRadius = Math.min(containerWidth, containerHeight) * deadZoneRatio;
  return dist <= deadZoneRadius;
}

/**
 * Calculates the target pan coordinates required to center the viewport on a given node.
 */
export function getCenterPanForNode(
  node: GraphNode,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number
): { panX: number; panY: number } {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const nodeW = node.width ?? 130;
  const nodeH = node.height ?? 130;
  const nodeCenterX = node.position.x + nodeW / 2;
  const nodeCenterY = node.position.y + nodeH / 2;
  return {
    panX: Math.round(centerX - nodeCenterX * viewport.zoom),
    panY: Math.round(centerY - nodeCenterY * viewport.zoom)
  };
}
