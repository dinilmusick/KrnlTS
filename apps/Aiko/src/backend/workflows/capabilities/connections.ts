import type { CapabilityEdge, CapabilityNode } from './contracts.js';
import { CapabilityValidationError } from './contracts.js';

export interface CapabilityConnection extends CapabilityEdge {
  kind: 'capability';
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  capabilityId: string;
}

export function validateCapabilityConnection(
  connection: CapabilityConnection, source: CapabilityNode, target: CapabilityNode
): void {
  const output = source.toolOutput, input = target.toolInput;
  const issues: string[] = [];
  if (connection.source !== source.id || connection.target !== target.id)
    issues.push('Connection endpoints do not match graph nodes.');
  if (source.accessible === false) issues.push('Capability source node is inaccessible: ' + source.id);
  if (target.accessible === false) issues.push('Capability target node is inaccessible: ' + target.id);
  if (!output || !output.enabled) issues.push('Source node does not expose an enabled toolOutput handle.');
  if (!input) issues.push('Target node does not expose a toolInput handle.');
  if (output && (connection.sourceHandle !== output.id || connection.capabilityId !== output.capabilityId))
    issues.push('Source handle or capability identity is invalid.');
  if (input && connection.targetHandle !== input.id) issues.push('Target handle is invalid.');
  if (input && output && input.accepts !== 'tool-capabilities') issues.push('Target handle does not accept tool capabilities.');
  if (input?.acceptedCapabilityIds && output && !input.acceptedCapabilityIds.includes(output.capabilityId))
    issues.push('Target handle does not accept this capability identity.');
  if (input?.acceptedCapabilityKinds && output && !input.acceptedCapabilityKinds.includes(output.capabilityKind))
    issues.push('Target handle does not accept this capability kind.');
  if (issues.length) throw new CapabilityValidationError(issues);
}

export function validateCapabilityConnectionSet(
  connections: CapabilityConnection[], target: CapabilityNode,
  resolveSource: (nodeId: string) => CapabilityNode | null
): void {
  if (connections.length > 1 && target.toolInput?.multiple === false)
    throw new CapabilityValidationError(['Target toolInput accepts only one capability connection.']);
  const ids = new Set<string>();
  for (const connection of connections) {
    if (ids.has(connection.id)) throw new CapabilityValidationError(['Duplicate capability connection ID: ' + connection.id]);
    ids.add(connection.id);
    const source = resolveSource(connection.source);
    if (!source) throw new CapabilityValidationError(['Capability source node is missing: ' + connection.source]);
    validateCapabilityConnection(connection, source, target);
  }
}

export function validateCapabilityGraphConnections(graph: { nodes: CapabilityNode[]; edges: CapabilityEdge[] }): void {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const capabilityEdges = graph.edges.filter(edge => edge.kind === 'capability');
  const adjacency = new Map<string, string[]>();
  const edgeIds = new Set<string>();
  const byTarget = new Map<string, CapabilityConnection[]>();
  for (const edge of capabilityEdges) {
    const sourceId = edge.source ?? edge.from ?? '';
    const targetId = edge.target ?? edge.to ?? '';
    const source = nodes.get(sourceId), target = nodes.get(targetId);
    if (!source || !target)
      throw new CapabilityValidationError(['Capability connection references an inaccessible or missing node: ' + sourceId + ' → ' + targetId]);
    if (!edge.id || !edge.sourceHandle || !edge.targetHandle || !edge.capabilityId)
      throw new CapabilityValidationError(['Capability connection is missing a stable ID, handle, or capability identity.']);
    if (edgeIds.has(edge.id)) throw new CapabilityValidationError(['Duplicate capability connection ID: ' + edge.id]);
    edgeIds.add(edge.id);
    validateCapabilityConnection({
      ...edge, kind: 'capability', id: edge.id, source: sourceId, target: targetId,
      sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle, capabilityId: edge.capabilityId,
    }, source, target);
    adjacency.set(sourceId, [...(adjacency.get(sourceId) || []), targetId]);
    const group = byTarget.get(targetId) || [];
    group.push({ ...edge, kind: 'capability', id: edge.id, source: sourceId, target: targetId,
      sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle, capabilityId: edge.capabilityId });
    byTarget.set(targetId, group);
  }
  for (const [targetId, connections] of byTarget) {
    const target = nodes.get(targetId)!;
    validateCapabilityConnectionSet(connections, target, sourceId => nodes.get(sourceId) || null);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new CapabilityValidationError(['Capability connection graph contains a cycle at node: ' + id]);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of adjacency.get(id) || []) visit(next);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of nodes.keys()) visit(id);
}
