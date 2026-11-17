import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryWorkspaceStorage } from '../../storage/workspaceStorage.js';
import { WorkflowService, WorkspaceWorkflowStore } from '../WorkflowService.js';

test('saved workflow is exposed and executed as one isolated capability', async () => {
  const graphs = new Map<string, any>();
  let capturedContext: any;
  const fod = {
    async saveGraph(id: string, graph: any) { graphs.set(id, graph); return graph; },
    async getGraph(id: string) { return graphs.get(id); },
    async execute(id: string, input: unknown, context: unknown) {
      capturedContext = context;
      return { success: true, output: { filtered: [] } };
    },
  };
  const service = new WorkflowService(new WorkspaceWorkflowStore(new MemoryWorkspaceStorage()), fod as any);
  const workflow = await service.create('workspace-one', { name: 'Research', description: 'Find and filter.' });
  graphs.set(workflow.fodProjectId, {
    nodes: [
      { id: 'search', type: 'search', name: 'Search', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, outputSchema: { type: 'object', properties: { results: { type: 'array' } } } },
      { id: 'filter', type: 'filter', inputSchema: { type: 'object', properties: { results: { type: 'array' } } }, outputSchema: { type: 'object', properties: { filtered: { type: 'array' } } } },
    ],
    edges: [{ from: 'search', to: 'filter' }],
  });
  const capability = await service.getToolCapability('workspace-one', workflow.id);
  assert.equal(capability.source.kind, 'workflow');
  assert.equal(capability.name, 'Research');
  const handle = await service.getToolOutputHandle('workspace-one', workflow.id);
  assert.equal(handle.kind, 'tool-output');
  assert.equal(handle.capabilityKind, 'workflow');
  assert.equal(handle.capabilityId, capability.id);
  const result: any = await service.executeToolCapability('workspace-one', workflow.id, { query: 'aiko' },
    { userId: 'user-one', permissions: ['records:read'] });
  assert.deepEqual(result, { filtered: [] });
  assert.equal(capturedContext.workspaceId, 'workspace-one');
  assert.equal(capturedContext.userId, 'user-one');
  assert.deepEqual(capturedContext.permissions, ['records:read']);
  await assert.rejects(() => service.getToolCapability('workspace-two', workflow.id), /Workflow not found/);
});
