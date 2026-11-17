import { SpaceNode, NodeConnection, EffectNode } from "../types/index.js";
import {
  getDistanceToWireSegment,
  isWireAffectedByEffect,
  getEffectsAffectingWire,
  getWiresAffectedByEffect,
  WireSpatialIntersection,
} from './graphManager';

export {
  getDistanceToWireSegment,
  isWireAffectedByEffect,
  getEffectsAffectingWire,
  getWiresAffectedByEffect,
};
export type { WireSpatialIntersection };

/**
 * Returns all active effects affecting a given wire connection.
 */
export function getActiveEffectsForWire(
  conn: NodeConnection,
  allNodes: SpaceNode[]
): EffectNode[] {
  return getEffectsAffectingWire(conn, allNodes);
}

/**
 * Finds all active effects affecting any outgoing wire from a given source node.
 */
export function getActiveEffectsForNodeWires(
  sourceNodeId: string,
  connections: NodeConnection[],
  allNodes: SpaceNode[]
): { connection: NodeConnection; effects: EffectNode[] }[] {
  const outgoing = connections.filter((c) => c.fromNodeId === sourceNodeId);
  return outgoing.map((conn) => ({
    connection: conn,
    effects: getEffectsAffectingWire(conn, allNodes),
  }));
}

/**
 * Helper to get active effects affecting a specific node (backward compatibility adapter mapping to wires)
 */
export function getActiveEffectsForNode(
  target: SpaceNode,
  allNodes: SpaceNode[],
  connections: NodeConnection[] = []
): EffectNode[] {
  const relevantConns = connections.filter(
    (c) => c.fromNodeId === target.id || c.toNodeId === target.id
  );
  const effectsMap = new Map<string, EffectNode>();
  relevantConns.forEach((conn) => {
    const effs = getEffectsAffectingWire(conn, allNodes);
    effs.forEach((e) => effectsMap.set(e.id, e));
  });
  return Array.from(effectsMap.values());
}
