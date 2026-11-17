import { createHash } from 'node:crypto';
import type { CapabilityEdge, CapabilityGraph, CapabilityKind, CapabilityNode, CapabilitySource, JsonSchema, ToolCapability, ToolOutputHandle } from './contracts.js';
import { CapabilityValidationError } from './contracts.js';
import { validateCapabilityGraphConnections } from './connections.js';

const edgeFrom = (edge: CapabilityEdge) => edge.from ?? edge.source ?? '';
const edgeTo = (edge: CapabilityEdge) => edge.to ?? edge.target ?? '';
const isDataEdge = (edge: CapabilityEdge) => edge.kind !== 'capability';
const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(item => cloneValue(item)) as T;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map(key => [key, cloneValue(record[key])])) as T;
  }
  return value;
};
const schemaOf = (node: CapabilityNode, side: 'input' | 'output') =>
  node.contracts?.[side] ?? node[side === 'input' ? 'inputSchema' : 'outputSchema'] ??
  (node.data?.[side === 'input' ? 'inputSchema' : 'outputSchema'] as JsonSchema | undefined);
const nodeName = (node: CapabilityNode) => node.name || String(node.data?.name || node.data?.label || node.type);
const nodeDescription = (node: CapabilityNode) => node.description || String(node.data?.description || '');
const stableId = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
const objectSchema = (properties: Record<string, JsonSchema>, required: string[]): JsonSchema =>
  ({ type: 'object', properties, required: [...new Set(required)].sort(), additionalProperties: false });

function topological(graph: CapabilityGraph) {
  const ids = new Set(graph.nodes.map(node => node.id));
  const indegree = new Map(graph.nodes.map(node => [node.id, 0]));
  const outgoing = new Map(graph.nodes.map(node => [node.id, [] as string[]]));
  const issues: string[] = [];
  if (ids.size !== graph.nodes.length) issues.push('Node IDs must be unique.');
  for (const edge of graph.edges) {
    if (!isDataEdge(edge)) continue;
    const from = edgeFrom(edge), to = edgeTo(edge);
    if (!ids.has(from) || !ids.has(to)) issues.push('Edge references a missing node: ' + from + ' → ' + to);
    else { indegree.set(to, (indegree.get(to) || 0) + 1); outgoing.get(from)!.push(to); }
  }
  const queue = [...indegree].filter(([, count]) => count === 0).map(([id]) => id).sort();
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!; order.push(id);
    for (const next of (outgoing.get(id) || []).sort()) {
      const count = (indegree.get(next) || 0) - 1; indegree.set(next, count);
      if (count === 0) { queue.push(next); queue.sort(); }
    }
  }
  if (order.length !== graph.nodes.length) issues.push('Capability graph contains a cycle.');
  return { order, issues, outgoing };
}

function mergeSchemas(nodes: CapabilityNode[], side: 'input' | 'output'): JsonSchema {
  const schemas = nodes.map(node => schemaOf(node, side)!);
  if (schemas.length === 1) return cloneValue(schemas[0]);
  if (schemas.some(schema => schema.type !== 'object'))
    throw new CapabilityValidationError(['Cannot compose non-object ' + side + ' schemas across graph branches.']);
  const properties: Record<string, JsonSchema> = {}; const required: string[] = [];
  for (const schema of schemas) {
    for (const [key, value] of Object.entries(schema.properties || {})) {
      if (properties[key] && JSON.stringify(properties[key]) !== JSON.stringify(value))
        throw new CapabilityValidationError(['Conflicting ' + side + ' schema property: ' + key]);
      properties[key] = cloneValue(value);
    }
    required.push(...(schema.required || []));
  }
  return objectSchema(Object.fromEntries(Object.keys(properties).sort().map(key => [key, properties[key]])), required);
}

export function deriveToolCapability(
  graph: CapabilityGraph, source: Omit<CapabilitySource, 'nodeIds'> & { nodeIds?: string[] },
  options: { name?: string; description?: string; permissions?: string[]; context?: string[] } = {}
): ToolCapability {
  const selectedIds = source.nodeIds?.length ? source.nodeIds : ['node', 'http', 'runtime', 'agent', 'custom'].includes(source.kind) ? [source.id] : graph.nodes.map(node => node.id);
  const selected = new Set(selectedIds);
  const nodes = graph.nodes.filter(node => selected.has(node.id));
  const allNodeIds = new Set(graph.nodes.map(node => node.id));
  const projectedEdges = graph.edges.filter(edge => {
    const from = edgeFrom(edge), to = edgeTo(edge);
    return (selected.has(from) && selected.has(to)) ||
      (selected.has(from) && !allNodeIds.has(to)) || (selected.has(to) && !allNodeIds.has(from));
  });
  const projectedGraph: CapabilityGraph = { ...graph, nodes, edges: projectedEdges };
  validateCapabilityGraphConnections(projectedGraph);
  const { order, issues, outgoing } = topological(projectedGraph);
  if (!graph.nodes.length) issues.push('Capability graph must contain at least one node.');
  if (selected.size !== selectedIds.length) issues.push('Capability node selection contains duplicate IDs.');
  if (source.kind === 'node' && (selectedIds.length !== 1 || selectedIds[0] !== source.id))
    issues.push('A node capability must select exactly its source node.');
  if (source.kind === 'workflow' && selected.size !== graph.nodes.length)
    issues.push('A workflow capability must include every node in its saved workflow.');
  if (nodes.length !== selected.size) issues.push('Capability references an inaccessible or missing node.');
  for (const node of nodes) {
    if (node.accessible === false) issues.push('Node is inaccessible: ' + node.id);
    if (node.toolOutput) {
      const { toolOutput, ...withoutOutput } = node;
      const nodeCapability = deriveToolCapability({ nodes: [withoutOutput], edges: [] }, { kind: 'node', id: node.id });
      const expectedHandle = createToolOutputHandleForCapability(nodeCapability);
      if (toolOutput.id !== expectedHandle.id || toolOutput.capabilityId !== expectedHandle.capabilityId ||
          toolOutput.capabilityKind !== expectedHandle.capabilityKind || toolOutput.name !== expectedHandle.name ||
          toolOutput.description !== expectedHandle.description ||
          JSON.stringify(toolOutput.inputSchema) !== JSON.stringify(expectedHandle.inputSchema) ||
          JSON.stringify(toolOutput.outputSchema) !== JSON.stringify(expectedHandle.outputSchema))
        issues.push('Stale or invalid toolOutput handle on node: ' + node.id);
    }
    if (!schemaOf(node, 'input')) issues.push('Missing input contract: ' + node.id);
    if (!schemaOf(node, 'output')) issues.push('Missing output contract: ' + node.id);
  }
  if (issues.length) throw new CapabilityValidationError(issues);
  const dataEdges = projectedGraph.edges.filter(isDataEdge);
  const entries = nodes.filter(node => !dataEdges.some(edge => selected.has(edgeFrom(edge)) && edgeTo(edge) === node.id)).map(node => node.id).sort();
  const exits = nodes.filter(node => !(outgoing.get(node.id) || []).some(id => selected.has(id))).map(node => node.id).sort();
  const kind = source.kind === 'workflow' || source.kind === 'http' || source.kind === 'runtime' || source.kind === 'agent'
    ? source.kind : source.kind === 'chain' ? 'chain' : nodes.length === 1 ? 'node' : 'chain';
  const inputSchema = mergeSchemas(nodes.filter(node => entries.includes(node.id)), 'input');
  const outputSchema = mergeSchemas(nodes.filter(node => exits.includes(node.id)), 'output');
  const orderedNodes = order.filter(nodeId => selected.has(nodeId)).map(nodeId => nodes.find(node => node.id === nodeId)!);
  const name = options.name?.trim() || (kind === 'workflow' ? 'Workflow capability' : orderedNodes.map(nodeName).join(' → '));
  const description = options.description?.trim() || orderedNodes.map(nodeDescription).filter(Boolean).join(' ');
  const requiredPermissions = [...new Set([
    ...(options.permissions || []), ...nodes.flatMap(node => node.permissions?.required || []),
  ])].sort();
  const requiredContext = [...new Set([
    ...(options.context || []), ...nodes.flatMap(node => node.permissions?.context || []),
  ])].sort();
  const capabilityMetadata = Object.fromEntries([...nodes].sort((a, b) => a.id.localeCompare(b.id))
    .filter(node => node.capabilityMetadata).map(node => [node.id, node.capabilityMetadata]));
  const identity = { kind, id: source.id, workflowId: source.workflowId, nodeIds: nodes.map(node => node.id).sort() };
  const id = 'cap_' + stableId(identity);
  return {
    schemaVersion: '1.0.0', id, name, description, inputSchema, outputSchema,
    execution: { kind: 'graph', nodeIds: order.filter(nodeId => selected.has(nodeId)), entryNodeIds: entries, exitNodeIds: exits },
    source: { ...identity, kind }, metadata: { graphMetadata: cloneValue(graph.metadata || {}), nodes: cloneValue(capabilityMetadata) },
    permissions: { required: requiredPermissions, context: requiredContext },
  };
}

export function createToolOutputHandleForCapability(capability: ToolCapability): ToolOutputHandle {
  return { kind: 'tool-output', id: 'handle_' + stableId({ capabilityId: capability.id }),
    capabilityId: capability.id, capabilityKind: capability.source.kind,
    name: capability.name, description: capability.description,
    inputSchema: cloneValue(capability.inputSchema), outputSchema: cloneValue(capability.outputSchema), enabled: true };
}

export function createToolOutputHandle(node: CapabilityNode, options: { name?: string; description?: string; capabilityKind?: CapabilityKind } = {}): ToolOutputHandle {
  const inputSchema = schemaOf(node, 'input'), outputSchema = schemaOf(node, 'output');
  if (!inputSchema || !outputSchema) throw new CapabilityValidationError(['Node requires input and output contracts: ' + node.id]);
  const capability = deriveToolCapability({ nodes: [node], edges: [] }, { kind: options.capabilityKind || 'node', id: node.id, nodeIds: [node.id] }, options);
  return createToolOutputHandleForCapability(capability);
}

export function attachToolOutputHandle<T extends CapabilityNode>(
  node: T, options: { name?: string; description?: string; capabilityKind?: CapabilityKind } = {}
): T & { toolOutput: ToolOutputHandle } {
  return { ...node, toolOutput: createToolOutputHandle(node, options) };
}
