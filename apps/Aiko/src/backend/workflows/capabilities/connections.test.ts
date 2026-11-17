import test from 'node:test';
import assert from 'node:assert/strict';
import { attachToolOutputHandle, deriveToolCapability } from './derive.js';
import { validateCapabilityConnection, validateCapabilityConnectionSet, validateCapabilityGraphConnections } from './connections.js';
import { CapabilityValidationError, type CapabilityNode } from './contracts.js';

const contract = { type: 'object', properties: { value: { type: 'string' } } };
const node = (id: string): CapabilityNode => ({ id, type: 'generic', inputSchema: contract, outputSchema: contract });

test('React Flow source/target edges derive one deterministic chain capability', () => {
  const a = node('a'), b = node('b');
  const edges = [{ id: 'e1', source: 'a', target: 'b' }];
  const first = deriveToolCapability({ nodes: [a, b], edges }, { kind: 'chain', id: 'ab' });
  const second = deriveToolCapability({ nodes: [a, b], edges }, { kind: 'chain', id: 'ab' });
  assert.equal(first.id, second.id);
  assert.deepEqual(first.execution.nodeIds, ['a', 'b']);
});

test('capability links are validated and serialized as graph-level edges', () => {
  const source = attachToolOutputHandle(node('source'));
  const target = { ...node('agent'), toolInput: {
    kind: 'tool-input' as const, id: 'input-1', accepts: 'tool-capabilities' as const, multiple: true,
  } };
  const connection = {
    kind: 'capability' as const, id: 'connection-1', source: source.id, sourceHandle: source.toolOutput.id,
    target: target.id, targetHandle: target.toolInput.id, capabilityId: source.toolOutput.capabilityId,
  };
  validateCapabilityConnection(connection, source, target);
  const serialized = JSON.parse(JSON.stringify(connection));
  assert.deepEqual(serialized, connection);
  assert.throws(() => validateCapabilityConnection({ ...connection, sourceHandle: 'wrong' }, source, target), CapabilityValidationError);
  assert.throws(() => validateCapabilityConnection({ ...connection, targetHandle: 'wrong' }, source, target), /Target handle is invalid/);
  const restricted = { ...target, toolInput: { ...target.toolInput, acceptedCapabilityKinds: ['workflow'] as Array<'node' | 'chain' | 'workflow'> } };
  assert.throws(() => validateCapabilityConnection(connection, source, restricted), /does not accept this capability kind/);
});

test('connection sets enforce single-capability input cardinality and source accessibility', () => {
  const source = attachToolOutputHandle(node('source'));
  const target = { ...node('agent'), toolInput: {
    kind: 'tool-input' as const, id: 'input-1', accepts: 'tool-capabilities' as const, multiple: false,
  } };
  const connection = {
    kind: 'capability' as const, id: 'connection-1', source: source.id, sourceHandle: source.toolOutput.id,
    target: target.id, targetHandle: target.toolInput.id, capabilityId: source.toolOutput.capabilityId,
  };
  validateCapabilityConnectionSet([connection], target, id => id === source.id ? source : null);
  assert.throws(() => validateCapabilityConnectionSet([connection, { ...connection, id: 'connection-2' }],
    target, id => id === source.id ? source : null), /only one capability/);
  assert.throws(() => validateCapabilityConnectionSet([connection], target, () => null), /source node is missing/);
});

test('serialized capability edge graphs reject cycles and missing endpoints', () => {
  const a = attachToolOutputHandle({ ...node('a'), toolInput: {
    kind: 'tool-input' as const, id: 'in-a', accepts: 'tool-capabilities' as const, multiple: true,
  } });
  const b = attachToolOutputHandle({ ...node('b'), toolInput: {
    kind: 'tool-input' as const, id: 'in-b', accepts: 'tool-capabilities' as const, multiple: true,
  } });
  const edge = (id: string, source: typeof a, target: typeof b) => ({
    kind: 'capability' as const, id, source: source.id, target: target.id,
    sourceHandle: source.toolOutput.id, targetHandle: target.toolInput.id,
    capabilityId: source.toolOutput.capabilityId,
  });
  assert.throws(() => validateCapabilityGraphConnections({ nodes: [a, b], edges: [
    edge('a-to-b', a, b), edge('b-to-a', b, a),
  ] }), /contains a cycle/);
  assert.throws(() => validateCapabilityGraphConnections({ nodes: [a], edges: [
    { ...edge('missing', a, b), target: 'missing-node' },
  ] }), /missing node/);
});

test('graph-wide validation enforces toolInput cardinality and unique edge IDs', () => {
  const a = attachToolOutputHandle(node('a'));
  const b = attachToolOutputHandle(node('b'));
  const target = { ...node('target'), toolInput: {
    kind: 'tool-input' as const, id: 'target-input', accepts: 'tool-capabilities' as const, multiple: false,
  } };
  const edge = (id: string, source: typeof a) => ({
    kind: 'capability' as const, id, source: source.id, target: target.id,
    sourceHandle: source.toolOutput.id, targetHandle: target.toolInput.id,
    capabilityId: source.toolOutput.capabilityId,
  });
  assert.throws(() => validateCapabilityGraphConnections({ nodes: [a, b, target], edges: [
    edge('one', a), edge('two', b),
  ] }), /only one capability/);
  assert.throws(() => validateCapabilityGraphConnections({ nodes: [a, b, target], edges: [
    edge('duplicate', a), edge('duplicate', b),
  ] }), /Duplicate capability connection ID/);
});

test('capability connections reject inaccessible source and target nodes', () => {
  const source = { ...attachToolOutputHandle(node('private-source')), accessible: false };
  const target = { ...node('private-target'), toolInput: {
    kind: 'tool-input' as const, id: 'private-input', accepts: 'tool-capabilities' as const, multiple: true,
  } };
  const connection = {
    kind: 'capability' as const, id: 'private-link', source: source.id, sourceHandle: source.toolOutput.id,
    target: target.id, targetHandle: target.toolInput.id, capabilityId: source.toolOutput.capabilityId,
  };
  assert.throws(() => validateCapabilityConnection(connection, source, target), /source node is inaccessible/);
  assert.throws(() => validateCapabilityConnection(connection, { ...source, accessible: true },
    { ...target, accessible: false }), /target node is inaccessible/);
});
