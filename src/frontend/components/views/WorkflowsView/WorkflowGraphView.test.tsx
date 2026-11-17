import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('native workflow editor uses in-process graph API and ReactFlow', async () => {
  const source = await readFile(new URL('./WorkflowGraphView.tsx', import.meta.url), 'utf8');
  assert.match(source, /@xyflow\/react/);
  assert.match(source, /getWorkflowGraph/);
  assert.match(source, /getWorkflowNodeCatalog/);
  assert.match(source, /saveWorkflowGraph/);
  assert.match(source, /executeWorkflow/);
  assert.doesNotMatch(source, /iframe|editor-url|FOD_BASE_URL/i);
});
