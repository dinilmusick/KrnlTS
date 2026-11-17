// ════ GRAPHMANAGER IMPLEMENTATION ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════════════
import { SpaceNode, NodeConnection, EffectNode, SignalType } from "../../types/index.js";
import {
  getNodeOutputSignalType,
} from '../canonicalSignalTable';
import {
  validateUniversalConnection,
  findCompatibleSocketPair,
} from '../universalConnectionEngine';
import {
  getDistanceToWireSegment,
  isWireAffectedByEffect,
  areSignalTypesCompatibleForEffect,
} from './helpers';
import { GraphIssue, GraphValidationResult, WireSpatialIntersection } from './types';

/**
 * Determines whether two nodes can connect via a wire and what signal type the wire will carry.
 * Universally evaluates socket definitions, medium, format, and polarity.
 */
export function evaluateWireSignalCompatibility(
  fromNode: SpaceNode,
  toNode: SpaceNode,
  fromPort?: string,
  toPort?: string
): { isCompatible: boolean; signalType: SignalType; reason?: string } {
  if (fromNode.id === toNode.id) {
    return { isCompatible: false, signalType: 'trigger', reason: 'Self-connections are forbidden' };
  }

  if (fromNode.type === 'effect' || toNode.type === 'effect') {
    return {
      isCompatible: false,
      signalType: 'trigger',
      reason: 'Effect orbs cannot be connected directly to nodes. They only affect wires.',
    };
  }

  // 1. Try finding best compatible socket pair (respecting any preferred ports)
  const pair = findCompatibleSocketPair(fromNode, toNode, fromPort, toPort);
  if (pair) {
    return {
      isCompatible: true,
      signalType: pair.canonicalSignalType,
    };
  }

  // 2. Direct validation fallback for descriptive error feedback
  const validation = validateUniversalConnection(fromNode, fromPort, toNode, toPort);
  return {
    isCompatible: validation.isCompatible,
    signalType: validation.canonicalSignalType,
    reason: validation.reason,
  };
}

/**
 * Finds all active EffectNodes currently affecting a specific wire connection.
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

    if (isWireAffectedByEffect(effect, conn, fromNode, toNode)) {
      const { distance } = getDistanceToWireSegment(effect.position, fromNode.position, toNode.position, conn.controlPoint);
      results.push({
        connection: conn,
        fromNode,
        toNode,
        wireSignalType: conn.signalType || getNodeOutputSignalType(fromNode),
        distanceToSphere: distance,
        isSignalCompatible: true,
      });
    }
  });

  return results;
}

/**
 * Performs deep graph validation.
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
        message: `Dangling wire: Connected node ID missing from graph`,
        connectionId: conn.id,
      });
      return;
    }

    const evalResult = evaluateWireSignalCompatibility(fromNode, toNode);
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
 * Repairs, normalizes, and regenerates a pristine graph representation.
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

    const key = `${conn.fromNodeId}->${conn.toNodeId}`;
    if (seenConns.has(key)) {
      repairedCount++;
      return; // Prune duplicate wires
    }
    seenConns.add(key);

    const compat = evaluateWireSignalCompatibility(fromNode, toNode);
    if (!compat.isCompatible) {
      repairedCount++;
      return; // Prune strictly incompatible wires
    }

    const wireSignal = compat.signalType;
    const activeEffects = sanitizedNodes.filter((n): n is EffectNode => n.type === 'effect' && n.active && isWireAffectedByEffect(n, conn, fromNode, toNode));

    validConnections.push({
      ...conn,
      id: conn.id || `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      signalType: wireSignal,
      affectedByEffectIds: activeEffects.map((e) => e.id),
    });
  });

  return { nodes: sanitizedNodes, connections: validConnections, repairedCount };
}
