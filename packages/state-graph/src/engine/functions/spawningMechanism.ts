import { SpaceNode, NodeConnection } from "../types/index.js";
import { getNodeSockets } from '../core/nodeSocketRegistry';

/**
 * 3D Scene Elevation & Spawning Height Configuration Policy
 * Establishes fixed distance heights above the ground surface (Y = 0) for all scene elements.
 */
export const SPAWN_ELEVATIONS = {
  GROUND_SURFACE: 0.0, // Base collision ground surface plane (Y = 0)
  GROUND_NODE: 0.0,    // Ground buildings (containers, triggers, audio IO, combiners, multiplexers, modules)
  ROAD_WIRE: 0.0,      // Stone paved roads run flat on the ground plane (Y = 0)
  EFFECT_NODE: 3.5,    // Floating magic effect orbs elevated high in the sky (Y = 3.5)
} as const;

/**
 * 1. Spawning Height Mechanism:
 * Calculates the exact elevation distance from ground surface for any SpaceNode.
 */
export function getNodeSpawnElevation(node: SpaceNode): number {
  if (node.type === 'effect') {
    return node.position && node.position[1] !== undefined && node.position[1] > 1.5
      ? node.position[1]
      : SPAWN_ELEVATIONS.EFFECT_NODE;
  }
  return SPAWN_ELEVATIONS.GROUND_NODE;
}

/**
 * 2. Node Surface Projection Function:
 * Projects a node's Y coordinate onto the ground plane surface at its designated height.
 */
export function projectNodeToGroundSurface<T extends SpaceNode>(node: T): T {
  const targetY = getNodeSpawnElevation(node);
  const currentPos = node.position || [0, 0, 0];
  if (currentPos[1] === targetY) {
    return node;
  }
  return {
    ...node,
    position: [currentPos[0], targetY, currentPos[2]] as [number, number, number],
  };
}

/**
 * 3. Wire Endpoint Surface Projection Function:
 * Computes road wire endpoints projected onto the ground surface plane (Y = 0),
 * ensuring stone roads never float mid-air or clip under the terrain.
 */
export function projectWireEndpointsToSurface(
  fromNode: SpaceNode,
  toNode: SpaceNode,
  conn?: NodeConnection
): { p1Pos: [number, number, number]; p2Pos: [number, number, number] } {
  // Wire endpoints projected to ground plane elevation Y = 0
  let p1Pos: [number, number, number] = [fromNode.position[0], SPAWN_ELEVATIONS.ROAD_WIRE, fromNode.position[2]];
  let p2Pos: [number, number, number] = [toNode.position[0], SPAWN_ELEVATIONS.ROAD_WIRE, toNode.position[2]];

  const fromSockets = getNodeSockets(fromNode);
  const toSockets = getNodeSockets(toNode);

  // Target input socket offset
  const inList = toSockets.inputs;
  if (inList.length > 0) {
    let targetIdx = conn?.toSocketIndex;
    if (targetIdx === undefined && conn?.toPort) {
      const foundIdx = inList.findIndex((s) => s.socketId === conn.toPort);
      if (foundIdx >= 0) targetIdx = foundIdx;
    }
    if (targetIdx === undefined) targetIdx = 0;
    const zOffset = (targetIdx - (inList.length - 1) / 2) * 0.85;
    p2Pos = [p2Pos[0] - 1.85, SPAWN_ELEVATIONS.ROAD_WIRE, p2Pos[2] + zOffset];
  } else {
    p2Pos = [p2Pos[0] - 1.75, SPAWN_ELEVATIONS.ROAD_WIRE, p2Pos[2]];
  }

  // Source output socket offset
  const outList = fromSockets.outputs;
  if (outList.length > 0) {
    let sourceIdx = conn?.fromSocketIndex;
    if (sourceIdx === undefined && conn?.fromPort) {
      const foundIdx = outList.findIndex((s) => s.socketId === conn.fromPort);
      if (foundIdx >= 0) sourceIdx = foundIdx;
    }
    if (sourceIdx === undefined) sourceIdx = 0;
    const zOffset = (sourceIdx - (outList.length - 1) / 2) * 0.85;
    p1Pos = [p1Pos[0] + 1.85, SPAWN_ELEVATIONS.ROAD_WIRE, p1Pos[2] + zOffset];
  } else {
    p1Pos = [p1Pos[0] + 1.75, SPAWN_ELEVATIONS.ROAD_WIRE, p1Pos[2]];
  }

  return { p1Pos, p2Pos };
}

/**
 * 4. Structured Module Graph Spawning Sequence:
 * Standard sequence called when entering a module or switching active graphs:
 *  Step 1: Ground plane collision check & initialize
 *  Step 2: Project all module nodes to designated surface heights
 *  Step 3: Spawn projected nodes
 *  Step 4: Spawn projected ground wires
 */
export function executeSceneGraphSpawningSequence(
  nodes: SpaceNode[],
  connections: NodeConnection[]
): { projectedNodes: SpaceNode[]; connections: NodeConnection[] } {
  // Step 1 & 2: Project nodes to ground plane surface
  const projectedNodes = nodes.map((n) => projectNodeToGroundSurface(n));

  // If node is a module with inner nodes, project its internal graph as well
  projectedNodes.forEach((n) => {
    if (n.type === 'module' && (n as any).innerNodes) {
      (n as any).innerNodes = ((n as any).innerNodes as SpaceNode[]).map((inner) =>
        projectNodeToGroundSurface(inner)
      );
    }
  });

  return {
    projectedNodes,
    connections,
  };
}
