import test from 'node:test';
import assert from 'node:assert/strict';
import { CredentialStore } from '../../storage/credentialStore.js';
import { MemoryWorkspaceStorage } from '../../storage/workspaceStorage.js';
import { RuntimeNodeAdapter } from '../../runtime/RuntimeNodeAdapter.js';
import { RuntimeProviderRegistry } from '../../runtime/RuntimeProviderRegistry.js';
import { RuntimeService } from '../../runtime/RuntimeService.js';
import { RuntimeAccountService } from '../../runtime/RuntimeAccountService.js';
import type { RuntimeProvider } from '../../runtime/types.js';
import { deriveToolCapability } from './derive.js';
import { executeToolCapability } from './execute.js';
import { WorkflowService, WorkspaceWorkflowStore } from '../WorkflowService.js';
import { AIAgentNodeExecutor, asAIAgentCapability, bindAIAgentCapability, inferAIAgentOutputContract } from '../aiAgentNode.js';

test('workflow Intelligence Spec flows through an AI Agent to a runtime capability and typed downstream output', async () => {
  const storage = new MemoryWorkspaceStorage();
  const registry = new RuntimeProviderRegistry();
  const accounts = new RuntimeAccountService(storage);
  const credentials = new CredentialStore(storage);
  await credentials.save('workspace-one', {
    schemaVersion: '1.0.0', name: 'runtime-account', type: 'API_KEY',
    data: { type: 'API_KEY', apiKey: 'credential-sample-value' },
  });
  let command = '';
  let providerCredential = '';
  let modelSawCredential = false;
  const provider: RuntimeProvider = {
    id: 'fly-io', displayName: 'Fly.io', description: 'Test provider.',
    capabilities: ['exec', 'filesystem', 'persistent'],
    validateConfiguration: () => [],
    describeConfiguration: configuration => ({ kind: 'test-machine', details: configuration }),
    async spawn(request) {
      return { providerRuntimeId: 'runtime-one', lifecycle: 'ready', capabilities: ['exec'],
        resource: { kind: 'test-machine', details: { source: request.source } } };
    },
    async status() { return 'ready'; },
    async execute(_handle, request, context) {
      command = request.command;
      providerCredential = JSON.stringify(context.credential);
      return { exitCode: 0, stdout: '42', stderr: '', durationMs: 1 };
    },
    async terminate() {},
  };
  registry.register(provider);
  const runtimes = new RuntimeService(registry, accounts, storage);
  await runtimes.saveAccount('workspace-one', {
    id: 'runtime-account-one', providerId: 'fly-io', displayName: 'Runtime',
    credentialRef: 'runtime-account',
  });
  const adapter = new RuntimeNodeAdapter(runtimes);
  const capability = deriveToolCapability({
    nodes: [{
      id: 'runtime-node', type: 'runtime/fly-io', name: 'runtime_runner',
      inputSchema: { type: 'object', required: ['command'], properties: { command: { type: 'string' } } },
      outputSchema: { type: 'object', properties: { stdout: { type: 'string' }, exitStatus: { type: 'number' } } },
    }],
    edges: [],
  }, { kind: 'runtime', id: 'runtime-node', nodeIds: ['runtime-node'] }, { name: 'runtime_runner' });
  const binding = {
    capability,
    async invoke(input: Record<string, unknown>) {
      const output = await adapter.executeCapability('runtime/fly-io', {
        accountId: 'runtime-account-one', configuration: { region: 'test' }, command: String(input.command),
      }, { workspaceId: 'workspace-one', executionId: 'workflow-one' });
      return { stdout: output.stdout, exitStatus: output.exitStatus };
    },
  };
  const expected = { type: 'number', description: 'downstream.numberInput' };
  const outputContract = inferAIAgentOutputContract('agent-node', [
    { id: 'downstream', contracts: { input: { type: 'object', properties: { numberInput: expected } } } },
  ], [{ source: 'agent-node', sourceHandle: 'result', target: 'downstream', targetHandle: 'numberInput' }]);
  let selectedSpec = '';
  let turn = 0;
  const agent = new AIAgentNodeExecutor({
    resolveModel(specId) {
      selectedSpec = specId || '';
      return { specId: specId || 'default', profile: {}, resolvedModel: { id: 'model', providerId: 'provider' } };
    },
    async invokeModel(request) {
      modelSawCredential ||= JSON.stringify(request).includes('credential-sample-value');
      turn++;
      if (turn === 1) return { toolCalls: [{ id: 'call-one', name: 'runtime_runner', arguments: { command: 'emit-number' } }] };
      assert.ok(request.messages.some(message => message.role === 'tool' && message.content.includes('"stdout":"42"')));
      return { text: '42' };
    },
  });
  const result = await agent.execute({
    prompt: 'Run the command and return its numeric result.',
    tools: [binding],
    context: { workspaceId: 'workspace-one', metadata: { intelligenceSpecId: 'workflow-spec' } },
    outputContract,
  });
  assert.equal(selectedSpec, 'workflow-spec');
  assert.equal(command, 'emit-number');
  assert.ok(providerCredential.includes('credential-sample-value'));
  assert.equal(modelSawCredential, false);
  assert.equal(result.result, 42);
  assert.equal(result.metadata.toolCalls, 1);
  assert.equal(JSON.stringify(result).includes('credential-sample-value'), false);
});

test('saved-workflow and node-chain projections are consumable through AI Agent.tools', async () => {
  const workflowCapability = deriveToolCapability({
    nodes: [{ id: 'saved-workflow-node', type: 'workflow-step',
      inputSchema: { type: 'object', properties: { value: { type: 'number' } } },
      outputSchema: { type: 'object', properties: { value: { type: 'number' } } } }],
    edges: [],
  }, { kind: 'workflow', id: 'saved-workflow', nodeIds: ['saved-workflow-node'] }, { name: 'saved_workflow' });
  const chainCapability = deriveToolCapability({
    nodes: [
      { id: 'chain-start', type: 'source', inputSchema: { type: 'object', properties: { value: { type: 'number' } } }, outputSchema: { type: 'object', properties: { value: { type: 'number' } } } },
      { id: 'chain-end', type: 'transform', inputSchema: { type: 'object', properties: { value: { type: 'number' } } }, outputSchema: { type: 'object', properties: { value: { type: 'number' } } } },
    ],
    edges: [{ from: 'chain-start', to: 'chain-end' }],
  }, { kind: 'chain', id: 'node-chain', nodeIds: ['chain-start', 'chain-end'] }, { name: 'node_chain' });
  const bindings = [
    { capability: workflowCapability, invoke: async (input: Record<string, unknown>) => ({ value: input.value }) },
    { capability: chainCapability, invoke: async (input: Record<string, unknown>) => ({ value: Number(input.value) + 1 }) },
  ];
  let turn = 0;
  const agent = new AIAgentNodeExecutor({
    resolveModel: () => ({ specId: 'spec', profile: {}, resolvedModel: { id: 'model', providerId: 'provider' } }),
    async invokeModel() {
      turn++;
      return turn === 1 ? { toolCalls: [
        { id: 'saved-workflow-call', name: 'saved_workflow', arguments: { value: 41 } },
        { id: 'node-chain-call', name: 'node_chain', arguments: { value: 41 } },
      ] } : { text: 'workflow and chain completed' };
    },
  });
  const result = await agent.execute({ prompt: 'Use both graph projections.', tools: bindings });
  assert.deepEqual(result.metadata.tools, [workflowCapability.id, chainCapability.id]);
  assert.equal(result.metadata.toolCalls, 2);
  assert.equal(result.result, 'workflow and chain completed');
});

test('an AI Agent can be exposed as a canonical capability and consumed by another AI Agent', async () => {
  const inner = new AIAgentNodeExecutor({ resolveModel: () => ({ specId: 'inner-spec', profile: {}, resolvedModel: { id: 'inner-model', providerId: 'test-provider' } }), invokeModel: async () => ({ text: 'inner-result' }) });
  const capability = asAIAgentCapability(inner, {}, 'inner-agent-node');
  const binding = bindAIAgentCapability(capability, inner, {});
  let turn = 0;
  const outer = new AIAgentNodeExecutor({
    resolveModel: () => ({ specId: 'outer-spec', profile: {}, resolvedModel: { id: 'model', providerId: 'provider' } }),
    async invokeModel() {
      turn++;
      return turn === 1
        ? { toolCalls: [{ id: 'nested-call', name: capability.name, arguments: { prompt: 'delegate' } }] }
        : { text: 'outer-result' };
    },
  });
  const result = await outer.execute({ prompt: 'Use the inner agent.', tools: [binding] });
  assert.equal(capability.source.kind, 'agent');
  assert.equal(result.result, 'outer-result');
  assert.equal(result.metadata.toolCalls, 1);
});

test('saved workflow toolOutput is consumed through AI Agent.tools using the same capability contract', async () => {
  const storage = new MemoryWorkspaceStorage();
  const graphs = new Map<string, any>();
  const fod = {
    async saveGraph(id: string, graph: any) { graphs.set(id, graph); return graph; },
    async getGraph(id: string) { return graphs.get(id); },
    async execute(_id: string, input: any) { return { success: true, output: { filtered: String(input.query).toUpperCase() } }; },
  };
  const workflows = new WorkflowService(new WorkspaceWorkflowStore(storage), fod as any);
  const workflow = await workflows.create('workspace-one', { name: 'Research capability', description: 'Search and normalize.' });
  graphs.set(workflow.fodProjectId, {
    nodes: [
      { id: 'search', type: 'search', name: 'Search', inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string' } } }, outputSchema: { type: 'object', properties: { results: { type: 'array' } } } },
      { id: 'normalize', type: 'normalize', name: 'Normalize', inputSchema: { type: 'object', properties: { results: { type: 'array' } } }, outputSchema: { type: 'object', required: ['filtered'], properties: { filtered: { type: 'string' } } } },
    ],
    edges: [{ id: 'edge-search-normalize', kind: 'data', source: 'search', target: 'normalize' }],
  });
  const capability = await workflows.getToolCapability('workspace-one', workflow.id);
  const handle = await workflows.getToolOutputHandle('workspace-one', workflow.id);
  assert.equal(handle.capabilityId, capability.id);
  const binding = {
    capability,
    invoke: (input: Record<string, unknown>) => workflows.executeToolCapability(
      'workspace-one', workflow.id, input, { userId: 'user-one', workspaceId: 'workspace-one' }
    ),
  };
  let turn = 0;
  const agent = new AIAgentNodeExecutor({
    resolveModel: () => ({ specId: 'workflow-spec', profile: {}, resolvedModel: { id: 'model', providerId: 'test-provider' } }),
    async invokeModel(request) {
      turn++;
      if (turn === 1) return { toolCalls: [{ id: 'workflow-call', name: capability.name, arguments: { query: 'aiko' } }] };
      assert.ok(request.messages.some(message => message.role === 'tool' && message.content.includes('AIKO')));
      return { text: 'Research complete.' };
    },
  });
  const result = await agent.execute({ prompt: 'Use the saved workflow.', tools: [binding] });
  assert.equal(result.result, 'Research complete.');
  assert.equal(result.metadata.toolCalls, 1);
});

test('node-chain graph projections are invoked by AI Agent.tools through the canonical executor', async () => {
  const graph = {
    nodes: [
      { id: 'start', type: 'source', name: 'increment_input', inputSchema: { type: 'object', required: ['value'], properties: { value: { type: 'number' } } }, outputSchema: { type: 'object', properties: { value: { type: 'number' } } } },
      { id: 'finish', type: 'transform', name: 'increment_output', inputSchema: { type: 'object', properties: { value: { type: 'number' } } }, outputSchema: { type: 'object', required: ['value'], properties: { value: { type: 'number' } } } },
      { id: 'unrelated', type: 'other', inputSchema: { type: 'object' }, outputSchema: { type: 'object' } },
    ],
    edges: [{ id: 'chain-edge', kind: 'data' as const, source: 'start', target: 'finish' }],
  };
  const capability = deriveToolCapability(graph, { kind: 'chain', id: 'start', nodeIds: ['start', 'finish'] }, { name: 'increment_chain' });
  const binding = {
    capability,
    invoke: (input: Record<string, unknown>) => executeToolCapability(
      capability, graph, input,
      async (projection, values) => {
        assert.deepEqual(projection.nodes.map(node => node.id), ['start', 'finish']);
        return { value: Number(values.value) + 1 };
      },
      { workspaceId: 'workspace-one', userId: 'user-one' }
    ),
  };
  let turn = 0;
  const agent = new AIAgentNodeExecutor({
    resolveModel: () => ({ specId: 'chain-spec', profile: {}, resolvedModel: { id: 'model', providerId: 'test-provider' } }),
    async invokeModel() {
      turn++;
      return turn === 1
        ? { toolCalls: [{ id: 'chain-call', name: capability.name, arguments: { value: 41 } }] }
        : { text: '42' };
    },
  });
  const result = await agent.execute({ prompt: 'Run the chain.', tools: [binding], outputContract: { type: 'number' } });
  assert.equal(result.result, 42);
  assert.equal(result.metadata.toolCalls, 1);
});
