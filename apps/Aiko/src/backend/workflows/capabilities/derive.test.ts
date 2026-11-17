import test from 'node:test';
import assert from 'node:assert/strict';
import { attachToolOutputHandle, createToolOutputHandle, deriveToolCapability } from './derive.js';
import { executeToolCapability, resolveNestedWorkflowGraph, validateCapabilityGraph } from './execute.js';
import { CapabilityValidationError, type CapabilityGraph, type CapabilityNode } from './contracts.js';

const schema = (property: string) => ({ type: 'object', properties: { [property]: { type: 'string' } }, required: [property] });
const node = (id: string, property = id, outProperty = property + 'Result'): CapabilityNode => ({
  id, type: 'transform', name: id, description: id + ' operation',
  inputSchema: schema(property), outputSchema: schema(outProperty),
});
const graph = (nodes: CapabilityNode[], edges: Array<{ from: string; to: string }> = []): CapabilityGraph => ({ nodes, edges });

test('single node derives stable capability and toolOutput handle', () => {
  const source = node('search');
  const handle = createToolOutputHandle(source);
  const capability = deriveToolCapability(graph([source]), { kind: 'node', id: source.id });
  assert.equal(handle.kind, 'tool-output');
  assert.equal(handle.capabilityId, capability.id);
  assert.equal(capability.source.kind, 'node');
  assert.deepEqual(capability.execution.entryNodeIds, ['search']);
  const largerGraph = graph([node('unrelated'), source]);
  const scoped = deriveToolCapability(largerGraph, { kind: 'node', id: 'search' });
  assert.deepEqual(scoped.execution.nodeIds, ['search']);
  assert.throws(() => deriveToolCapability(largerGraph, { kind: 'node', id: 'search', nodeIds: ['unrelated'] }), /exactly its source node/);
  assert.deepEqual(Object.keys(scoped.inputSchema.properties || {}), ['search']);
});

test('multi-node chain is represented as one capability with external contracts', () => {
  const capability = deriveToolCapability(graph([node('search', 'query'), node('filter', 'records'), node('average', 'values', 'averageResult')], [
    { from: 'search', to: 'filter' }, { from: 'filter', to: 'average' },
  ]), { kind: 'chain', id: 'chain-1' });
  assert.equal(capability.source.kind, 'chain');
  assert.deepEqual(capability.execution.nodeIds, ['search', 'filter', 'average']);
  assert.deepEqual(capability.execution.entryNodeIds, ['search']);
  assert.deepEqual(capability.execution.exitNodeIds, ['average']);
  assert.deepEqual(Object.keys(capability.inputSchema.properties || {}), ['query']);
  assert.deepEqual(Object.keys(capability.outputSchema.properties || {}), ['averageResult']);
  const reordered = deriveToolCapability(graph([node('average', 'values', 'averageResult'), node('search', 'query'), node('filter', 'records')], [
    { from: 'filter', to: 'average' }, { from: 'search', to: 'filter' },
  ]), { kind: 'chain', id: 'chain-1' });
  assert.equal(reordered.name, capability.name);
  assert.deepEqual(reordered.inputSchema, capability.inputSchema);
  assert.deepEqual(reordered.execution, capability.execution);
});

test('saved workflow exposes one workflow capability', () => {
  const capability = deriveToolCapability(graph([node('search'), node('filter')], [{ from: 'search', to: 'filter' }]),
    { kind: 'workflow', id: 'workflow-1', workflowId: 'workflow-1' }, { name: 'Research', description: 'Search and filter.' });
  assert.equal(capability.source.kind, 'workflow');
  assert.equal(capability.name, 'Research');
  assert.equal(capability.source.workflowId, 'workflow-1');
  assert.throws(() => deriveToolCapability(graph([node('search'), node('filter')], [{ from: 'search', to: 'filter' }]),
    { kind: 'workflow', id: 'workflow-1', workflowId: 'workflow-1', nodeIds: ['search'] }), /include every node/);
});

test('nested workflow references are recursively resolved and cycle checked', async () => {
  const parent = graph([{ ...node('nested'), type: 'workflow', data: { workflowId: 'child' } }]);
  await assert.doesNotReject(() => validateCapabilityGraph(parent, async id => id === 'child' ? graph([node('inner')]) : null));
  await assert.rejects(() => validateCapabilityGraph(parent, async () => parent, ['child']), CapabilityValidationError);
  await assert.rejects(() => validateCapabilityGraph(parent, async () => null), /inaccessible or missing/);
});

test('serialization preserves handle and capability contracts', () => {
  const handle = createToolOutputHandle(node('persisted'));
  const roundTrip = JSON.parse(JSON.stringify({ handle, capability: deriveToolCapability(graph([node('persisted')]), { kind: 'node', id: 'persisted' }) }));
  assert.deepEqual(roundTrip.handle, handle);
  assert.equal(roundTrip.capability.id, handle.capabilityId);
  const attached = attachToolOutputHandle(node('persisted'));
  const savedGraph = JSON.parse(JSON.stringify(graph([attached])));
  const restored = deriveToolCapability(savedGraph, { kind: 'node', id: 'persisted' });
  assert.equal(restored.id, attached.toolOutput.capabilityId);
  restored.inputSchema.properties!.persisted = { type: 'number' };
  assert.equal((savedGraph.nodes[0] as CapabilityNode).inputSchema?.properties?.persisted.type, 'string');
});

test('schema derivation rejects missing and conflicting contracts', () => {
  assert.throws(() => deriveToolCapability(graph([{ id: 'bad', type: 'bad' }]), { kind: 'node', id: 'bad' }), CapabilityValidationError);
  const conflicting = graph([node('a', 'same'), { ...node('b', 'same'), inputSchema: { type: 'object', properties: { same: { type: 'number' } } } }]);
  assert.throws(() => deriveToolCapability(conflicting, { kind: 'chain', id: 'conflict' }), /Conflicting input schema/);
});

test('invalid edges, cycles, duplicate IDs and inaccessible nodes are rejected', () => {
  assert.throws(() => deriveToolCapability(graph([node('a')], [{ from: 'a', to: 'missing' }]), { kind: 'node', id: 'a' }), /missing node/);
  assert.throws(() => deriveToolCapability(graph([node('a'), node('b')], [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }]), { kind: 'chain', id: 'cycle' }), /cycle/);
  assert.throws(() => deriveToolCapability(graph([node('a'), node('a')]), { kind: 'node', id: 'a' }), /unique/);
  assert.throws(() => deriveToolCapability(graph([{ ...node('private'), accessible: false }]), { kind: 'node', id: 'private' }), /inaccessible/);
});

test('execution enforces permissions and isolates input and graph objects', async () => {
  const secure = { ...node('secure'), data: { nested: { value: 'original' } } };
  const source = graph([secure]);
  const capability = deriveToolCapability(source, { kind: 'workflow', id: 'w', workflowId: 'w' }, { permissions: ['records:read'] });
  await assert.rejects(() => executeToolCapability(capability, source, { query: 'secret' },
    async () => 'ok', {}), /Missing required permissions/);
  let seen: any;
  const result = await executeToolCapability(capability, source, { secure: 'safe' },
    async (projected, input) => { seen = { projected, input }; input.secure = 'mutated'; (projected.nodes[0] as any).data = { nested: { value: 'mutated' } }; return { secureResult: 'done' }; },
    { permissions: ['records:read'] });
  assert.deepEqual(result, { secureResult: 'done' });
  assert.equal(seen.input.secure, 'mutated');
  assert.equal((source.nodes[0] as any).data.nested.value, 'original');
});

test('execution rejects stale graph projections', async () => {
  const original = graph([node('a')]);
  const capability = deriveToolCapability(original, { kind: 'node', id: 'a' });
  const changed = graph([node('b')]);
  await assert.rejects(() => executeToolCapability(capability, changed, {}, async () => 'no'), CapabilityValidationError);
});

test('nested workflow nodes inherit deterministic contracts from their saved workflow graph', async () => {
  const parent = graph([{ id: 'child-node', type: 'workflow', data: { workflowId: 'child' } }]);
  const resolved = await resolveNestedWorkflowGraph(parent, async id => id === 'child'
    ? graph([node('inner', 'request')]) : null);
  const capability = deriveToolCapability(resolved, { kind: 'workflow', id: 'parent', workflowId: 'parent' });
  assert.deepEqual(Object.keys(capability.inputSchema.properties || {}), ['request']);
  assert.deepEqual(Object.keys(capability.outputSchema.properties || {}), ['requestResult']);
  assert.equal((parent.nodes[0] as any).contracts, undefined);
});

test('capability edges do not alter dataflow topology or external schemas', () => {
  const source = attachToolOutputHandle(node('source', 'query'));
  const target = attachToolOutputHandle({ ...node('target', 'result'), toolInput: {
    kind: 'tool-input' as const, id: 'target-input', accepts: 'tool-capabilities' as const, multiple: true,
  } });
  const graphWithCapabilityEdge: CapabilityGraph = {
    nodes: [source, target],
    edges: [
      { from: 'source', to: 'target' },
      { kind: 'capability', source: 'source', target: 'target', id: 'tool-link',
        sourceHandle: source.toolOutput.id, targetHandle: target.toolInput.id,
        capabilityId: source.toolOutput.capabilityId },
    ],
  };
  const capability = deriveToolCapability(graphWithCapabilityEdge, { kind: 'chain', id: 'data-chain' });
  assert.deepEqual(capability.execution.nodeIds, ['source', 'target']);
  assert.deepEqual(capability.execution.entryNodeIds, ['source']);
  assert.deepEqual(capability.execution.exitNodeIds, ['target']);
  assert.deepEqual(Object.keys(capability.inputSchema.properties || {}), ['query']);
});

test('node permission and context requirements are included in the capability contract', async () => {
  const protectedNode = { ...node('protected'), permissions: { required: ['records:read'], context: ['workspaceId'] } };
  const protectedGraph = graph([protectedNode]);
  const capability = deriveToolCapability(protectedGraph, { kind: 'node', id: 'protected' });
  assert.deepEqual(capability.permissions.required, ['records:read']);
  assert.deepEqual(capability.permissions.context, ['workspaceId']);
  await assert.rejects(() => executeToolCapability(capability, protectedGraph, {}, async () => 'no', {}), /Missing required permissions/);
  await assert.rejects(() => executeToolCapability(capability, protectedGraph, {}, async () => 'no',
    { permissions: ['records:read'] }), /Missing required execution context/);
  const weakened = { ...capability, permissions: { required: [], context: [] } };
  await assert.rejects(() => executeToolCapability(weakened, protectedGraph, {}, async () => 'no',
    { permissions: ['records:read'] }), /weakened/);
});

test('nested workflow capability permissions are propagated to the parent projection', async () => {
  const parent = graph([{ id: 'child-node', type: 'workflow', data: { workflowId: 'child' } }]);
  const resolved = await resolveNestedWorkflowGraph(parent, async id => id === 'child'
    ? graph([{ ...node('inner'), permissions: { required: ['inner:read'], context: ['workspaceId'] } }]) : null);
  const capability = deriveToolCapability(resolved, { kind: 'workflow', id: 'parent', workflowId: 'parent' });
  assert.deepEqual(capability.permissions.required, ['inner:read']);
  assert.deepEqual(capability.permissions.context, ['workspaceId']);
});

test('capability execution validates required input and output JSON contracts', async () => {
  const source = graph([node('lookup', 'query', 'lookupResult')]);
  const capability = deriveToolCapability(source, { kind: 'node', id: 'lookup' });
  let executions = 0;
  const executor = async () => { executions++; return { lookupResult: 'ok' }; };
  await assert.rejects(() => executeToolCapability(capability, source, {}, executor), /query is required/);
  await assert.rejects(() => executeToolCapability(capability, source, { query: 42 }, executor), /must be string/);
  assert.equal(executions, 0);
  await assert.rejects(() => executeToolCapability(capability, source, { query: 'ok' },
    async () => { executions++; return { wrong: true }; }), /Invalid capability output/);
  assert.equal(executions, 1);
  assert.deepEqual(await executeToolCapability(capability, source, { query: 'ok' }, executor), { lookupResult: 'ok' });
});

test('stale serialized node output handles are rejected after contract changes', () => {
  const attached = attachToolOutputHandle(node('versioned'));
  const changed = { ...attached, outputSchema: schema('changed') };
  assert.throws(() => deriveToolCapability(graph([changed]), { kind: 'node', id: 'versioned' }), /Stale or invalid toolOutput/);
});
