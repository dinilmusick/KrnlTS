import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowAgent } from './WorkflowAgent.js';

test('workflow agent selects a semantic workflow and delegates execution', async () => {
  const calls: Array<{ id: string; input: unknown }> = [];
  const workflow = {
    id: 'weather',
    workspaceId: 'ws-a',
    name: 'Get Weather',
    description: 'Fetch the current weather.',
    fodProjectId: 'fod-weather',
  };
  const service = {
    async list() { return [workflow]; },
    async execute(_workspace: string, id: string, input: unknown) {
      calls.push({ id, input });
      return { success: true, output: { temperature: 22 } };
    },
  };
  const agent = new WorkflowAgent(service as any);
  const result = await agent.execute({
    query: 'Get the weather in Pune',
    workspace: 'ws-a',
    customInference: async () => JSON.stringify({ workflowId: 'weather', input: { city: 'Pune' } }),
  });

  assert.equal(result.success, true);
  assert.equal(result.workflowExecutions[0]?.workflowId, 'weather');
  assert.deepEqual(calls, [{ id: 'weather', input: { city: 'Pune' } }]);
});
