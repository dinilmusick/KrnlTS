import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';
import { WorkspaceWorkflowStore, WorkflowService } from './WorkflowService.js';

test('workflow CRUD persists graph data in the owning Aiko workspace', async () => {
  const storage = new MemoryWorkspaceStorage();
  const calls: string[] = [];
  const fod = {
    async saveGraph(id: string, graph: any) { calls.push('save:' + id); return graph; },
    async getGraph(id: string) { calls.push('get:' + id); return { nodes: [], edges: [], metadata: { id } }; },
    async execute(id: string, input?: unknown) { calls.push('execute:' + id); return { success: true, output: input }; },
  };
  try {
    const service = new WorkflowService(new WorkspaceWorkflowStore(storage), fod as any);
    const a = await service.create('workspace-a', { name: 'Get Weather', description: 'Fetch weather.' });
    assert.equal(a.workspaceId, 'workspace-a');
    assert.equal((await service.getGraph('workspace-a', a.id)).metadata?.workflowId, a.id);
    const result = await service.execute('workspace-a', a.id, { city: 'Pune' });
    assert.deepEqual(result.output, { city: 'Pune' });
    assert.equal(await service.get('workspace-b', a.id), null);
    assert.ok(calls.some(call => call === 'execute:' + a.fodProjectId));
  } finally {
    // MemoryWorkspaceStorage is isolated per test instance.
  }
});
