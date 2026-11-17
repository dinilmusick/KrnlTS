import { SpaceNode, NodeConnection, EffectNode, ContainerNode, EffectType } from "../types/index.js";
import {
  SignalType,
  getNodeOutputSignalType,
  getNodeAcceptedInputSignals,
} from './canonicalSignalTable';
import { getComponentSocketConstraint, validateComponentSocketConnection } from './componentSocketRegistry';
import {
  validateUniversalConnection,
  findCompatibleSocketPair,
} from './universalConnectionEngine';

export interface GraphIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  sourceId?: string;
  targetId?: string;
  connectionId?: string;
}

export interface GraphValidationResult {
  isValid: boolean;
  issues: GraphIssue[];
  activeWiresCount: number;
  activeEffectsCount: number;
  affectedWiresCount: number;
}

export interface WireSpatialIntersection {
  connection: NodeConnection;
  fromNode: SpaceNode;
  toNode: SpaceNode;
  wireSignalType: SignalType;
  distanceToSphere: number;
  isSignalCompatible: boolean;
}

/**
 * Calculates Euclidean distance from a 3D effect sphere center to a wire segment.
 * Scaled Y weighting (0.4) allows hovering orbs to comfortably envelop ground-laid conduits.
 */
export function getDistanceToWireSegment(
  spherePos: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  controlPoint?: [number, number, number]
): { distance: number; closestPoint: [number, number, number]; t: number } {
  if (controlPoint) {
    const res1 = getDistanceToWireSegment(spherePos, p1, controlPoint);
    const res2 = getDistanceToWireSegment(spherePos, controlPoint, p2);
    return res1.distance < res2.distance ? res1 : res2;
  }

  const sx = spherePos[0];
  const sy = spherePos[1] || 0;
  const sz = spherePos[2];

  const x1 = p1[0], y1 = p1[1] || 0, z1 = p1[2];
  const x2 = p2[0], y2 = p2[1] || 0, z2 = p2[2];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dy * dy + dz * dz;

  let t = 0;
  if (lenSq > 0.00001) {
    t = ((sx - x1) * dx + (sy - y1) * dy + (sz - z1) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }

  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const cz = z1 + t * dz;

  const distDx = sx - cx;
  const distDy = (sy - cy) * 0.63; // 0.63^2 ≈ 0.4 Y weighting
  const distDz = sz - cz;

  const distance = Math.sqrt(distDx * distDx + distDy * distDy + distDz * distDz);

  return { distance, closestPoint: [cx, cy, cz], t };
}

/**
 * Determines whether two nodes can connect via a wire and what signal type the wire will carry.
 * Universally evaluates socket definitions, medium, format, and polarity.
 */
export function evaluateWireSignalCompatibility(
  fromNode: SpaceNode,
  toNode: SpaceNode,
  toPort?: string,
  fromPort?: string,
  existingConnections: NodeConnection[] = []
): { isCompatible: boolean; signalType: SignalType; reason?: string } {
  if (fromNode.id === toNode.id) {
    return { isCompatible: false, signalType: 'trigger', reason: 'Self-connections are forbidden' };
  }

  // Effect Orbs can only affect wires, never nodes directly
  if (fromNode.type === 'effect' || toNode.type === 'effect') {
    return {
      isCompatible: false,
      signalType: 'trigger',
      reason: 'Effect orbs cannot be connected directly to nodes. They only affect wires.',
    };
  }

  // 1. Try finding best compatible socket pair (respecting any preferred ports)
  const pair = findCompatibleSocketPair(fromNode, toNode, fromPort, toPort, existingConnections);
  if (pair) {
    return {
      isCompatible: true,
      signalType: pair.canonicalSignalType,
    };
  }

  // 2. Direct validation fallback for descriptive error feedback
  const validation = validateUniversalConnection(fromNode, fromPort, toNode, toPort, existingConnections);
  return {
    isCompatible: validation.isCompatible,
    signalType: validation.canonicalSignalType,
    reason: validation.reason,
  };
}

/**
 * Checks if an EffectNode signal type is compatible with a wire connection signal type.
 * Audio effects (audio, audio_mono, audio_stereo) affect any audio wire.
 */
export function areSignalTypesCompatibleForEffect(
  effectSignal: SignalType,
  wireSignal: SignalType,
  effectType?: EffectType
): boolean {
  if (effectType === 'pan') {
    return wireSignal === 'audio_stereo';
  }
  if (effectSignal === wireSignal) return true;

  const isAudioEffect =
    effectSignal === 'audio' ||
    effectSignal === 'audio_mono' ||
    effectSignal === 'audio_stereo';
  const isAudioWire =
    wireSignal === 'audio' ||
    wireSignal === 'audio_mono' ||
    wireSignal === 'audio_stereo';

  if (isAudioEffect && isAudioWire) return true;

  return false;
}

/**
 * Checks if a specific EffectNode sphere encompasses a given wire and shares matching signal type.
 */
export function isWireAffectedByEffect(
  effect: EffectNode,
  conn: NodeConnection,
  fromNode: SpaceNode,
  toNode: SpaceNode
): boolean {
  if (!effect.active) return false;
  if (effect.id === fromNode.id || effect.id === toNode.id) return false;

  const wireSignal = conn.signalType || getNodeOutputSignalType(fromNode);
  const effectSignal =
    effect.signalType ||
    (effect.effectType === 'gain'
      ? 'audio'
      : effect.effectType === 'pan'
      ? 'audio_stereo'
      : effect.effectType === 'velocity'
      ? 'midi'
      : 'trigger');

  // Rule: An effect of signal type A will affect wires with compatible signal protocol
  if (!areSignalTypesCompatibleForEffect(effectSignal, wireSignal, effect.effectType)) {
    return false;
  }

  const { distance } = getDistanceToWireSegment(effect.position, fromNode.position, toNode.position, conn.controlPoint);
  return distance <= (effect.radius || 6.0);
}

/**
 * Finds all active EffectNodes currently affecting a specific wire connection,
 * sorted by connection's explicit effectOrder precedence if defined.
 */
export function getEffectsAffectingWire(
  conn: NodeConnection,
  nodes: SpaceNode[]
): EffectNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const fromNode = nodeMap.get(conn.fromNodeId);
  const toNode = nodeMap.get(conn.toNodeId);
  if (!fromNode || !toNode) return [];

  const effectNodes = nodes.filter((n): n is EffectNode => n.type === 'effect' && n.active);
  const activeEffects = effectNodes.filter((effect) => isWireAffectedByEffect(effect, conn, fromNode, toNode));

  if (conn.effectOrder && conn.effectOrder.length > 0) {
    const orderMap = new Map<string, number>(conn.effectOrder.map((id, index) => [id, index]));
    return activeEffects.sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
      return orderA - orderB;
    });
  }

  return activeEffects;
}

/**
 * Finds all wire connections currently enveloped by an EffectNode sphere.
 */
export function getWiresAffectedByEffect(
  effect: EffectNode,
  connections: NodeConnection[],
  nodes: SpaceNode[]
): WireSpatialIntersection[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const results: WireSpatialIntersection[] = [];

  connections.forEach((conn) => {
    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);
    if (!fromNode || !toNode) return;

    const wireSignal = conn.signalType || getNodeOutputSignalType(fromNode);
    const effectSignal =
      effect.signalType ||
      (effect.effectType === 'gain'
        ? 'audio'
        : effect.effectType === 'pan'
        ? 'audio_stereo'
        : effect.effectType === 'velocity'
        ? 'midi'
        : 'trigger');
    const isSignalCompatible = areSignalTypesCompatibleForEffect(effectSignal, wireSignal, effect.effectType);

    const { distance } = getDistanceToWireSegment(effect.position, fromNode.position, toNode.position, conn.controlPoint);
    if (distance <= (effect.radius || 6.0)) {
      results.push({
        connection: conn,
        fromNode,
        toNode,
        wireSignalType: wireSignal,
        distanceToSphere: distance,
        isSignalCompatible,
      });
    }
  });

  return results;
}

/**
 * Performs deep graph validation, verifying node signatures, wire signal matching,
 * dangling references, and effect sphere collisions.
 */
export function validateProjectGraph(
  nodes: SpaceNode[],
  connections: NodeConnection[]
): GraphValidationResult {
  const issues: GraphIssue[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const seenConns = new Set<string>();

  // 1. Verify Node IDs
  const idCounts = new Map<string, number>();
  nodes.forEach((n) => {
    idCounts.set(n.id, (idCounts.get(n.id) || 0) + 1);
  });
  idCounts.forEach((count, id) => {
    if (count > 1) {
      issues.push({ id: `dup-node-${id}`, type: 'error', message: `Duplicate node ID detected: ${id}`, sourceId: id });
    }
  });

  // 2. Verify Wire Connections & Signal Compatibility
  connections.forEach((conn) => {
    const key = `${conn.fromNodeId}->${conn.toNodeId}`;
    if (seenConns.has(key)) {
      issues.push({ id: `dup-wire-${conn.id}`, type: 'warning', message: `Redundant duplicate wire between nodes: ${key}`, connectionId: conn.id });
    }
    seenConns.add(key);

    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);

    if (!fromNode || !toNode) {
      issues.push({
        id: `dangling-${conn.id}`,
        type: 'error',
        message: `Dangling wire: Connected node ID (${!fromNode ? conn.fromNodeId : conn.toNodeId}) is missing from graph`,
        connectionId: conn.id,
      });
      return;
    }

    const evalResult = evaluateWireSignalCompatibility(
      fromNode,
      toNode,
      conn.toPort || conn.toSocketId,
      conn.fromPort || conn.fromSocketId,
      connections
    );
    if (!evalResult.isCompatible) {
      issues.push({
        id: `incompatible-${conn.id}`,
        type: 'error',
        message: evalResult.reason || 'Signal protocol mismatch',
        sourceId: fromNode.id,
        targetId: toNode.id,
        connectionId: conn.id,
      });
    }
  });

  const activeEffects = nodes.filter((n): n is EffectNode => n.type === 'effect' && n.active);
  let affectedWiresCount = 0;

  connections.forEach((conn) => {
    if (getEffectsAffectingWire(conn, nodes).length > 0) {
      affectedWiresCount++;
    }
  });

  const hasErrors = issues.some((i) => i.type === 'error');

  return {
    isValid: !hasErrors,
    issues,
    activeWiresCount: connections.length,
    activeEffectsCount: activeEffects.length,
    affectedWiresCount,
  };
}

/**
 * Graph Generator & Maintainer: Repairs, normalizes, and regenerates a pristine graph representation.
 */
export function repairAndNormalizeGraph(
  nodes: SpaceNode[],
  connections: NodeConnection[]
): { nodes: SpaceNode[]; connections: NodeConnection[]; repairedCount: number } {
  let repairedCount = 0;
  const nodeMap = new Map<string, SpaceNode>();

  // 1. Sanitize Nodes
  const sanitizedNodes = nodes.map((n) => {
    const safeNode: SpaceNode = { ...n };
    if (safeNode.type === 'effect') {
      const eff = safeNode as EffectNode;
      if (!eff.signalType) {
        eff.signalType = eff.effectType === 'repeater' ? 'trigger' : 'audio';
        repairedCount++;
      }
      if (typeof eff.radius !== 'number' || eff.radius <= 0) {
        eff.radius = 6.0;
        repairedCount++;
      }
    }
    nodeMap.set(safeNode.id, safeNode);
    return safeNode;
  });

  // 2. Sanitize and Validate Wires
  const seenConns = new Set<string>();
  const validConnections: NodeConnection[] = [];

  connections.forEach((conn) => {
    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);
    if (!fromNode || !toNode) {
      repairedCount++;
      return; // Prune dangling wires
    }

    const key = `${conn.fromNodeId}:${conn.fromPort || conn.fromSocketId || ''}->${conn.toNodeId}:${conn.toPort || conn.toSocketId || ''}`;
    if (seenConns.has(key)) {
      repairedCount++;
      return; // Prune duplicate wires
    }
    seenConns.add(key);

    const compat = evaluateWireSignalCompatibility(
      fromNode,
      toNode,
      conn.toPort || conn.toSocketId,
      conn.fromPort || conn.fromSocketId,
      validConnections
    );
    if (!compat.isCompatible) {
      repairedCount++;
      return; // Prune strictly incompatible wires
    }

    const wireSignal = compat.signalType;
    const activeEffects = nodes.filter((n): n is EffectNode => n.type === 'effect' && n.active && isWireAffectedByEffect(n, conn, fromNode, toNode));

    validConnections.push({
      ...conn,
      id: conn.id || `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      signalType: wireSignal,
      latencyBeats: typeof conn.latencyBeats === 'number' ? conn.latencyBeats : 0,
      affectedByEffectIds: activeEffects.map((e) => e.id),
    });
  });

  return { nodes: sanitizedNodes, connections: validConnections, repairedCount };
}
