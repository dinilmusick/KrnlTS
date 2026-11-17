import type { GraphEdge, GraphNode } from '@ultrst-armada/kloks/state-graph';
import {
  BEAT_FRACTIONS_PER_BAR,
  type MusicalDuration,
  durationFromBeatFractions,
} from './executionFlowGraph.js';

export interface DurationResult {
  duration: MusicalDuration;
  cycleDetected: boolean;
}

const executionOutput = (node: GraphNode) =>
  new Set((node.outputs ?? []).filter((socket) => socket.dataType === 'ExecutionFlow').map((socket) => socket.id));

const executionInput = (node: GraphNode) =>
  new Set((node.inputs ?? []).filter((socket) => socket.dataType === 'ExecutionFlow').map((socket) => socket.id));

const durationOf = (node: GraphNode): number => {
  if (node.type !== 'midi-sample') return 0;
  const execution = node.data?.execution;
  const duration = execution && typeof execution === 'object'
    ? (execution as { duration?: { beatFractions?: number } }).duration
    : undefined;
  return typeof duration?.beatFractions === 'number' ? Math.max(0, duration.beatFractions) : 0;
};

/**
 * Static planning estimate only. Runtime completion is authoritative and is
 * computed by ExecutionRuntime from actual branch/node lifecycle events.
 * Parallel paths contribute their maximum serial duration rather than a sum.
 */
export function calculateSectionDuration(
  nodes: GraphNode[],
  edges: GraphEdge[],
): DurationResult {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  const cycleNodes = new Set<string>();

  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    if (!executionOutput(source).has(edge.sourceSocket) || !executionInput(target).has(edge.targetSocket)) continue;
    const targets = outgoing.get(source.id) ?? [];
    targets.push(target.id);
    outgoing.set(source.id, targets);
  }

  const memo = new Map<string, number>();
  const active = new Set<string>();

  const longestFrom = (nodeId: string): number => {
    if (memo.has(nodeId)) return memo.get(nodeId)!;
    if (active.has(nodeId)) {
      cycleNodes.add(nodeId);
      return 0;
    }

    active.add(nodeId);
    const node = byId.get(nodeId);
    if (!node) {
      active.delete(nodeId);
      return 0;
    }

    const next = outgoing.get(nodeId) ?? [];
    const downstream = next.length === 0
      ? 0
      : Math.max(...next.map(longestFrom));
    const total = durationOf(node) + downstream;
    active.delete(nodeId);
    memo.set(nodeId, total);
    return total;
  };

  const incoming = new Set<string>();
  for (const targets of outgoing.values()) for (const target of targets) incoming.add(target);

  const roots = nodes
    .filter((node) => !incoming.has(node.id))
    .map((node) => node.id);

  const longest = roots.length > 0
    ? Math.max(...roots.map(longestFrom))
    : Math.max(0, ...nodes.map((node) => longestFrom(node.id)));

  return {
    duration: durationFromBeatFractions(longest),
    cycleDetected: cycleNodes.size > 0,
  };
}
