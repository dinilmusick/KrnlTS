// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { SpaceNode, NodeConnection, DawProject } from "../types/index.js";
import { evaluateWireSignalCompatibility, getEffectsAffectingWire, validateProjectGraph } from '../functions/graphManager';
import { projectNodeToGroundSurface } from '../functions/spawningMechanism';
import { NodeAssetRegistry, Node2DSpriteSetting } from './nodeAssetRegistry';

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & INTERFACES (Universal Graph Transport)
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface GraphNodePayload {
  node: SpaceNode;
  sprite2D: Node2DSpriteSetting;
  connectedInputCount: number;
  connectedOutputCount: number;
}

export interface GraphSnapshot {
  nodes: SpaceNode[];
  connections: NodeConnection[];
  meta: {
    nodeCount: number;
    wireCount: number;
    isValid: boolean;
    timestamp: number;
  };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. UNIVERSAL GRAPH ENGINE SERVICE
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Universal Graph Service:
 * Decouples graph business logic, signal routing validation, and spatial coordinates
 * from rendering layers (3D Qwnsr vs 2D Sprite Canvas).
 */
export class GraphDataService {
  /**
   * Fetches enriched node payloads with pluggable 2D sprite descriptors.
   */
  public static getEnrichedNodes(nodes: SpaceNode[], connections: NodeConnection[]): GraphNodePayload[] {
    return nodes.map((node) => {
      const inCount = connections.filter((c) => c.toNodeId === node.id).length;
      const outCount = connections.filter((c) => c.fromNodeId === node.id).length;
      const sprite2D = NodeAssetRegistry.get2DSpriteSetting(node);

      return {
        node,
        sprite2D,
        connectedInputCount: inCount,
        connectedOutputCount: outCount,
      };
    });
  }

  /**
   * Resolves 2D canvas coordinates from 3D world coordinates.
   * In 3D space: [X, Y (elevation), Z (depth)] -> In 2D plane: [X, Z] mapped to screen (x, y).
   */
  public static worldToCanvasCoords(
    worldPos: [number, number, number],
    pan: { x: number; y: number },
    zoom: number,
    center: { cx: number; cy: number },
    worldScale = 40
  ): { x: number; y: number } {
    const screenX = center.cx + (worldPos[0] * worldScale + pan.x) * zoom;
    const screenY = center.cy + (worldPos[2] * worldScale + pan.y) * zoom;
    return { x: screenX, y: screenY };
  }

  /**
   * Resolves 3D world coordinates from 2D screen click coordinates.
   */
  public static canvasToWorldCoords(
    screenPos: { x: number; y: number },
    pan: { x: number; y: number },
    zoom: number,
    center: { cx: number; cy: number },
    worldScale = 40
  ): [number, number, number] {
    const worldX = (screenPos.x - center.cx) / (worldScale * zoom) - pan.x / worldScale;
    const worldZ = (screenPos.y - center.cy) / (worldScale * zoom) - pan.y / worldScale;
    return [worldX, 0, worldZ];
  }

  /**
   * Creates a standardized snapshot of the active graph.
   */
  public static createGraphSnapshot(nodes: SpaceNode[], connections: NodeConnection[]): GraphSnapshot {
    const validation = validateProjectGraph(nodes, connections);
    return {
      nodes: nodes.map((n) => projectNodeToGroundSurface(n)),
      connections,
      meta: {
        nodeCount: nodes.length,
        wireCount: connections.length,
        isValid: validation.isValid,
        timestamp: Date.now(),
      },
    };
  }
}
