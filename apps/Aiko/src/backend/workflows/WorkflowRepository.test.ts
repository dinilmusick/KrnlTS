import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';
import { WorkspaceWorkflowRepository } from './WorkflowRepository.js';
import { WorkflowService } from './WorkflowService.js';

test('graphs and immutable versions are persisted and isolated by workspace', async () => {
  const storage = new MemoryWorkspaceStorage();
  const repository = new WorkspaceWorkflowRepository(storage);
  const service = new WorkflowService(repository, { execute: async () => ({ success: true }) } as any);
  const workflow = await service.create('workspace-alpha', { name: 'Graph', description: '' });
  const graph = { nodes: [{ id: 'n1', type: 'start' }], edges: [], metadata: { owner: 'alpha' } };
  await service.saveGraph('workspace-alpha', workflow.id, graph);
  const versions = await service.listVersions('workspace-alpha', workflow.id);
  assert.equal(versions.length, 2, 'initial empty graph and first edit are versioned');
  assert.deepEqual(await service.getGraph('workspace-alpha', workflow.id), graph);
  assert.equal(await service.get('workspace-beta', workflow.id), null);
  await assert.rejects(() => service.getGraph('workspace-beta', workflow.id), /not found/i);
  assert.equal((await repository.list('workspace-beta')).length, 0);
});

test('concurrent graph writes receive unique monotonic versions', async () => {
  const repository = new WorkspaceWorkflowRepository(new MemoryWorkspaceStorage());
  const workflow = { id: 'workflow-1', workspaceId: 'workspace-a', name: 'Concurrent', description: '', fodProjectId: 'legacy-1' };
  await repository.save(workflow);
  await Promise.all(Array.from({ length: 12 }, (_, index) =>
    repository.saveGraph('workspace-a', workflow.id, { nodes: [{ index }], edges: [] })));
  const versions = await repository.listVersions('workspace-a', workflow.id);
  assert.equal(versions.length, 12);
  assert.deepEqual(versions.map(item => item.version), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.equal(new Set(versions.map(item => item.id)).size, 12);
});

test('execution input, output, logs and timestamps persist with workspace ownership', async () => {
  const storage = new MemoryWorkspaceStorage();
  const repository = new WorkspaceWorkflowRepository(storage);
  const service = new WorkflowService(repository, {
    async execute(_id: string, input: unknown) {
      return { success: true, output: { echoed: input }, execution: { logs: [{ level: 'info', message: 'completed', data: { count: 1 } }] } };
    },
  } as any);
  const workflow = await service.create('workspace-a', { name: 'Run', description: '' });
  const result = await service.execute('workspace-a', workflow.id, { query: 'hello' }, { userId: 'user-a' });
  assert.deepEqual(result.output, { echoed: { query: 'hello' } });
  const [execution] = await service.listExecutions('workspace-a', workflow.id);
  assert.equal(execution.status, 'succeeded');
  assert.deepEqual(execution.input, { query: 'hello' });
  assert.deepEqual(execution.result?.output, result.output);
  assert.equal(execution.logs[0].message, 'completed');
  assert.ok(execution.completedAt);
  assert.equal(await service.getExecution('workspace-b', workflow.id, execution.id), null);
});

test('database/storage failures are surfaced rather than treated as an empty workspace', async () => {
  const failing = {
    async read() { const error = new Error('database unavailable') as Error & { code: string }; error.code = 'ECONNREFUSED'; throw error; },
    async write() { throw new Error('database unavailable'); },
    async delete() {},
    async exists() { return false; },
    async list() { return []; },
    async mkdir() {},
  };
  const repository = new WorkspaceWorkflowRepository(failing as any);
  await assert.rejects(() => repository.list('workspace-a'), /database unavailable/);
});

test('workspace and record identifiers cannot escape the workspace namespace', async () => {
  const repository = new WorkspaceWorkflowRepository(new MemoryWorkspaceStorage());
  await assert.rejects(() => repository.list('../other-workspace'), /Invalid workspace scope/);
  await assert.rejects(() => repository.get('workspace-a', '../secret'), /Invalid workflow ID/);
  await assert.rejects(() => repository.get('workspace-a', 'bad\\path'), /Invalid workflow ID/);
});

test('graph and version manifest updates fail atomically when workspace storage rejects a write', async () => {
  const memory = new MemoryWorkspaceStorage();
  let unavailable = false;
  const storage = {
    read: (path: string) => memory.read(path),
    write: (path: string, data: string) => unavailable ? Promise.reject(new Error('database unavailable')) : memory.write(path, data),
    delete: (path: string) => memory.delete(path),
    exists: (path: string) => memory.exists(path),
    list: (path: string) => memory.list(path),
    mkdir: (path: string) => memory.mkdir(path),
  };
  const repository = new WorkspaceWorkflowRepository(storage as any);
  const workflow = { id: 'atomic-workflow', workspaceId: 'workspace-a', name: 'Atomic', description: '', fodProjectId: 'legacy' };
  await repository.save(workflow);
  const original = { nodes: [{ id: 'original' }], edges: [] };
  await repository.saveGraph('workspace-a', workflow.id, original);
  unavailable = true;
  await assert.rejects(() => repository.saveGraph('workspace-a', workflow.id, { nodes: [{ id: 'uncommitted' }], edges: [] }), /database unavailable/);
  unavailable = false;
  assert.deepEqual(await repository.getGraph('workspace-a', workflow.id), original);
  assert.equal((await repository.listVersions('workspace-a', workflow.id)).length, 1);
});

test('legacy graph data is copied into Aiko once and is thereafter read locally', async () => {
  const repository = new WorkspaceWorkflowRepository(new MemoryWorkspaceStorage());
  const workflow = { id: 'legacy-workflow', workspaceId: 'workspace-a', name: 'Legacy', description: '', fodProjectId: 'fod-legacy-project' };
  await repository.save(workflow);
  const legacyGraph = { nodes: [{ id: 'legacy-node' }], edges: [] };
  let legacyReads = 0;
  const service = new WorkflowService(repository, {
    async getGraph() { legacyReads += 1; return legacyGraph; },
    async execute() { return { success: true }; },
  } as any);
  assert.deepEqual(await service.getGraph('workspace-a', workflow.id), legacyGraph);
  assert.deepEqual(await service.getGraph('workspace-a', workflow.id), legacyGraph);
  assert.equal(legacyReads, 1);
  assert.equal((await repository.listVersions('workspace-a', workflow.id)).length, 1);
});

test('custom nodes, libraries and visual overrides round-trip with versioned graph data', async () => {
  const repository = new WorkspaceWorkflowRepository(new MemoryWorkspaceStorage());
  const workflow = { id: 'extended-graph', workspaceId: 'workspace-a', name: 'Extended', description: '', fodProjectId: 'legacy' };
  await repository.save(workflow);
  const graph = {
    nodes: [{ id: 'custom-1', type: 'custom:transform' }],
    edges: [],
    customNodes: [{ id: 'transform', implementation: 'inline-reference' }],
    libraries: [{ id: 'math', version: '1.0.0' }],
    visualOverrides: { 'custom-1': { color: '#123456', width: 240 } },
  };
  await repository.saveGraph('workspace-a', workflow.id, graph);
  assert.deepEqual(await repository.getGraph('workspace-a', workflow.id), graph);
  assert.deepEqual((await repository.listVersions('workspace-a', workflow.id))[0].graph, graph);
});

test('execution log and completed execution retention limits are enforced', async () => {
  const repository = new WorkspaceWorkflowRepository(new MemoryWorkspaceStorage());
  const workflow = { id: 'retention-workflow', workspaceId: 'workspace-retention', name: 'Retention', description: '', fodProjectId: 'legacy' };
  await repository.save(workflow);
  const logs = Array.from({ length: 1005 }, (_, index) => ({
    id: 'log-' + index, timestamp: new Date(index).toISOString(), level: 'info' as const, message: 'log-' + index,
  }));
  await repository.createExecution({
    id: 'execution-logs', workspaceId: workflow.workspaceId, workflowId: workflow.id, status: 'succeeded',
    logs, startedAt: new Date(0).toISOString(), completedAt: new Date(1).toISOString(), updatedAt: new Date(1).toISOString(),
  });
  assert.equal((await repository.getExecution(workflow.workspaceId, workflow.id, 'execution-logs'))?.logs.length, 1000);
  for (let index = 0; index < 105; index += 1) {
    const timestamp = new Date(index + 2).toISOString();
    await repository.createExecution({
      id: 'execution-' + index, workspaceId: workflow.workspaceId, workflowId: workflow.id, status: 'succeeded',
      logs: [], startedAt: timestamp, completedAt: timestamp, updatedAt: timestamp,
    });
  }
  const retained = await repository.listExecutions(workflow.workspaceId, workflow.id);
  assert.equal(retained.length, 100);
  assert.equal(retained.some(item => item.id === 'execution-logs'), false);
  assert.equal(retained.some(item => item.id === 'execution-104'), true);
});

test('graph version retention is bounded while version numbers remain monotonic', async () => {
  const repository = new WorkspaceWorkflowRepository(new MemoryWorkspaceStorage());
  const workflow = { id: 'version-retention', workspaceId: 'workspace-version', name: 'Versions', description: '', fodProjectId: 'legacy' };
  await repository.save(workflow);
  for (let index = 0; index < 501; index += 1) {
    await repository.saveGraph(workflow.workspaceId, workflow.id, { nodes: [{ index }], edges: [] });
  }
  const versions = await repository.listVersions(workflow.workspaceId, workflow.id);
  assert.equal(versions.length, 500);
  assert.equal(versions[0].version, 2);
  assert.equal(versions.at(-1)?.version, 501);
});
