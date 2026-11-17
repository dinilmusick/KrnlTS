import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AIAgentNodeExecutor, AIAgentNodeError, asAIAgentCapability, bindAIAgentCapability, AI_AGENT_NODE_CONTRACT,
  executeAIAgentNodeFromGraph, inferAIAgentOutputContract, createAikoModelInvoker, registerAIAgentNode,
  type AIAgentModelRequest, type AIAgentToolBinding
} from './aiAgentNode.js';

const resolved = { specId: 'spec-workflow', profile: { prioritiseDeterminism: true }, resolvedModel: { id: 'model-1', providerId: 'provider-1' } };
function executor(invokeModel: (request: AIAgentModelRequest) => Promise<any>, resolveModel = () => resolved) {
  return new AIAgentNodeExecutor({ resolveModel, invokeModel });
}
function tool(
  id: string, name: string, invoke: AIAgentToolBinding['invoke'] = async input => input,
  kind: 'node' | 'chain' | 'workflow' | 'http' | 'runtime' | 'agent' | 'custom' = 'workflow'
): AIAgentToolBinding {
  const capability = {
    schemaVersion: '1.0.0' as const, id: 'cap_' + id, name, description: name + ' capability',
    inputSchema: { type: 'object' as const }, outputSchema: { type: 'object' as const },
    execution: { kind: 'graph' as const, nodeIds: [id], entryNodeIds: [id], exitNodeIds: [id] },
    source: { kind, id, nodeIds: [id] }, metadata: {}, permissions: { required: [], context: [] },
  };
  return { capability, invoke };
}

test('resolves the workflow Intelligence Spec and model without a second provider configuration', async () => {
  const result = await executor(async () => ({ text: 'done' })).execute({ prompt: 'do it', intelligenceSpecId: 'spec-workflow' });
  assert.equal(result.metadata.intelligenceSpecId, 'spec-workflow');
  assert.equal(result.metadata.modelId, 'model-1');
  assert.equal(result.metadata.providerId, 'provider-1');
});

test('preserves the natural-language prompt and sends normalized capability descriptions', async () => {
  let request: AIAgentModelRequest | undefined;
  await executor(async value => { request = value; return { text: 'complete' }; }).execute({
    prompt: 'Summarize the project state.', tools: [tool('wf-1', 'Project Status')]
  });
  assert.equal(request?.prompt, 'Summarize the project state.');
  assert.equal(request?.tools[0]?.name, 'Project_Status');
  assert.equal(request?.tools[0]?.invocation.includes('workflow'), true);
  assert.equal(request?.tools[0]?.inputSchema.type, 'object');
});

test('supports multiple capabilities and sequential tool execution', async () => {
  const calls: string[] = [];
  let turn = 0;
  const result = await executor(async () => {
    turn++;
    return turn === 1 ? { toolCalls: [{ name: 'first', arguments: {} }, { name: 'second', arguments: {} }] } : { text: 'finished' };
  }).execute({ prompt: 'Run both', tools: [tool('1', 'first', async () => { calls.push('1'); return {}; }), tool('2', 'second', async () => { calls.push('2'); return {}; })] });
  assert.deepEqual(calls, ['1', '2']);
  assert.equal(result.metadata.toolCalls, 2);
});

test('supports workflow and node-chain capability kinds through the same handle contract', async () => {
  const kinds = [tool('workflow', 'workflow'), tool('chain', 'chain', undefined, 'chain')];
  const result = await executor(async request => {
    assert.deepEqual(request.tools.map(item => item.invocation.split(':')[0]), ['workflow', 'chain']);
    return { text: 'ok' };
  }).execute({ prompt: 'Use capabilities', tools: kinds });
  assert.equal(result.result, 'ok');
});

test('an AI Agent can itself be exposed and invoked as a capability', async () => {
  const agent = executor(async () => ({ text: 'delegated result' }));
  const capability = asAIAgentCapability(agent, {}, 'nested-agent');
  assert.equal(capability.source.kind, 'agent');
  const binding = bindAIAgentCapability(capability, agent, {});
  assert.equal(await binding.invoke({ prompt: 'delegate this' }, {}), 'delegated result');
});

test('infers output schema from a downstream node input connection', async () => {
  const contract = { type: 'number', description: 'Add.input[0]' };
  const inferred = inferAIAgentOutputContract('agent', [{ id: 'add', inputContracts: { 'input[0]': contract } }], [{ source: 'agent', target: 'add', targetPort: 'input[0]' }]);
  assert.deepEqual(inferred, contract);
  const result = await executeAIAgentNodeFromGraph(executor(async request => {
    assert.deepEqual(request.outputContract, contract);
    return { text: '42' };
  }), { prompt: 'Return the number' }, 'agent', [{ id: 'add', inputContracts: { 'input[0]': contract } }], [{ source: 'agent', target: 'add', targetPort: 'input[0]' }]);
  assert.equal(result.result, 42);
});

test('infers downstream contracts from canonical FOD node input schemas', () => {
  const number = { type: 'number', minimum: 0 };
  const inferred = inferAIAgentOutputContract('agent', [
    { id: 'add', contracts: { input: { type: 'object', properties: { numberInput: number } } } },
  ], [{ source: 'agent', sourceHandle: 'result', target: 'add', targetHandle: 'numberInput' }]);
  assert.deepEqual(inferred, number);
});

test('rejects incompatible downstream output contracts deterministically', () => {
  const compatible = inferAIAgentOutputContract('agent', [
    { id: 'left', inputContracts: { value: { type: 'number', description: 'left operand' } } },
    { id: 'right', inputContracts: { value: { type: 'number', description: 'right operand' } } }
  ], [
    { source: 'agent', target: 'left', targetPort: 'value' },
    { source: 'agent', target: 'right', targetPort: 'value' }
  ]);
  assert.equal(compatible?.type, 'number');
  assert.throws(() => inferAIAgentOutputContract('agent', [
    { id: 'a', inputContracts: { value: { type: 'number' } } },
    { id: 'b', inputContracts: { value: { type: 'string' } } }
  ], [{ source: 'agent', target: 'a', targetPort: 'value' }, { source: 'agent', target: 'b', targetPort: 'value' }]),
  (error: unknown) => error instanceof AIAgentNodeError && error.code === 'OUTPUT_CONTRACT_CONFLICT');
});

test('rejects malformed capability handles and unknown model tool requests', async () => {
  await assert.rejects(() => executor(async () => ({ text: 'ok' })).execute({ prompt: 'x', tools: [{ ...tool('bad', 'bad'), invoke: undefined } as any] }),
    (error: unknown) => error instanceof AIAgentNodeError && error.code === 'INVALID_TOOL_CONNECTION');
  await assert.rejects(() => executor(async () => ({ toolCalls: [{ name: 'missing', arguments: {} }] })).execute({ prompt: 'x' }),
    (error: unknown) => error instanceof AIAgentNodeError && error.code === 'INVALID_TOOL_CONNECTION');
});

test('returns stable model and tool execution error codes', async () => {
  await assert.rejects(() => executor(async () => { throw new Error('provider offline'); }).execute({ prompt: 'x' }),
    (error: unknown) => error instanceof AIAgentNodeError && error.code === 'MODEL_EXECUTION_FAILED');
  await assert.rejects(() => executor(async () => ({ toolCalls: [{ name: 'explode', arguments: {} }] })).execute({
    prompt: 'x', tools: [tool('explode', 'explode', async () => { throw new Error('downstream unavailable'); })]
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'TOOL_EXECUTION_FAILED');
});

test('parses fenced structured output and enforces downstream schema constraints', async () => {
  const parsed = await executor(async () => ({ text: '```json\n{"value":7}\n```' })).execute({
    prompt: 'return a constrained object',
    outputContract: { type: 'object', required: ['value'], properties: { value: { type: 'number', minimum: 5, maximum: 10 } } },
  });
  assert.deepEqual(parsed.result, { value: 7 });
  await assert.rejects(() => executor(async () => ({ text: '3' })).execute({
    prompt: 'return a number',
    outputContract: { type: 'number', minimum: 5 },
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'STRUCTURED_OUTPUT_INVALID');
});

test('validates structured output and reports malformed or wrong-type results', async () => {
  const valid = await executor(async () => ({ text: '{"value":7}' })).execute({
    prompt: 'produce an object', outputContract: { type: 'object', required: ['value'], properties: { value: { type: 'number' } } }
  });
  assert.deepEqual(valid.result, { value: 7 });
  await assert.rejects(() => executor(async () => ({ text: 'not json' })).execute({
    prompt: 'produce JSON', outputContract: { type: 'number' }
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'STRUCTURED_OUTPUT_INVALID');
  await assert.rejects(() => executor(async () => ({ text: '"wrong"' })).execute({
    prompt: 'produce number', outputContract: { type: 'number' }
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'STRUCTURED_OUTPUT_INVALID');
});




test('declares prompt as data and tools as a multi-capability input handle', () => {
  const prompt = AI_AGENT_NODE_CONTRACT.inputs.find(input => input.id === 'prompt');
  const tools = AI_AGENT_NODE_CONTRACT.inputs.find(input => input.id === 'tools');
  assert.equal(prompt?.kind, 'data');
  assert.equal(prompt?.required, true);
  assert.equal(tools?.kind, 'capability');
  assert.equal(tools && 'multiple' in tools ? tools.multiple : false, true);
  assert.equal(AI_AGENT_NODE_CONTRACT.toolInput.kind, 'tool-input');
  assert.equal(AI_AGENT_NODE_CONTRACT.toolInput.multiple, true);
  assert.equal(AI_AGENT_NODE_CONTRACT.toolOutput.kind, 'tool-output');
  assert.equal(AI_AGENT_NODE_CONTRACT.toolOutput.capabilityKind, 'agent');
  assert.ok(AI_AGENT_NODE_CONTRACT.outputs.some(output => output.id === 'result' && output.kind === 'data'));
  assert.ok(AI_AGENT_NODE_CONTRACT.outputs.some(output => output.id === 'capability' && output.kind === 'capability'));
});

test('registers a FOD node handler and resolves multiple capability edges at runtime', async () => {
  let registeredType = '';
  let handler: any;
  const runtime = {
    registerNodeHandler(type: string, callback: any) { registeredType = type; handler = callback; }
  };
  const agent = executor(async request => {
    assert.deepEqual(request.tools.map(item => item.name), ['node_one', 'workflow_two']);
    assert.deepEqual(request.outputContract, { type: 'number' });
    return { text: '17' };
  });
  registerAIAgentNode(runtime, agent);
  assert.equal(registeredType, 'ai-agent');
  const result = await handler({ prompt: 'compute using tools' }, {
    nodeId: 'agent',
    nodes: [{ id: 'sum', inputContracts: { value: { type: 'number' } } }],
    edges: [{ source: 'agent', sourceHandle: 'result', target: 'sum', targetPort: 'value' }],
    intelligenceSpecId: 'workflow-spec',
    async resolveCapabilityInput(handleId: 'tools') {
      assert.equal(handleId, 'tools');
      return [tool('node-1', 'node one'), { ...tool('workflow-2', 'workflow two'), kind: 'workflow' as const }];
    }
  });
  assert.equal(result.result, 17);
});
test('uses Aiko Intelligence Spec defaults when no workflow override is supplied', async () => {
  const agent = new AIAgentNodeExecutor({ invokeModel: async () => ({ text: 'default-routed' }) });
  const result = await agent.execute({ prompt: 'use canonical defaults' });
  assert.equal(result.metadata.intelligenceSpecId, 'preset-agent');
});

test('an explicit node Intelligence Spec overrides workflow and router context', async () => {
  let selected: string | undefined;
  await executor(async () => ({ text: 'ok' }), specId => {
    selected = specId;
    return resolved;
  }).execute({
    prompt: 'explicit node override',
    intelligenceSpecId: 'node-spec',
    context: { intelligenceSpecId: 'router-spec', metadata: { intelligenceSpecId: 'workflow-spec' } }
  });
  assert.equal(selected, 'node-spec');
});

test('accepts node, HTTP, runtime, and custom capability kinds', async () => {
  const capabilities = [
    tool('node', 'node_capability', undefined, 'node'),
    tool('http', 'http_client', undefined, 'http'),
    tool('runtime', 'runtime_handle', undefined, 'runtime'),
    tool('custom', 'custom_capability', undefined, 'custom')
  ];
  const result = await executor(async request => {
    assert.deepEqual(request.tools.map(item => item.invocation.split(':')[0]), ['node', 'http', 'runtime', 'custom']);
    return { text: 'accepted' };
  }).execute({ prompt: 'Use connected capabilities', tools: capabilities });
  assert.equal(result.result, 'accepted');
});

test('rejects capability names that collide after provider-safe normalization', async () => {
  await assert.rejects(() => executor(async () => ({ text: 'not reached' })).execute({
    prompt: 'use tools', tools: [tool('one', 'fetch-status'), tool('two', 'fetch status')]
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'INVALID_TOOL_CONNECTION');
});
test('uses Intelligence Spec inherited from the workflow execution context', async () => {
  let selected: string | undefined;
  const result = await executor(async () => ({ text: 'context-routed' }), specId => {
    selected = specId;
    return resolved;
  }).execute({ prompt: 'run in workflow context', context: { intelligenceSpecId: 'workflow-spec' } });
  assert.equal(selected, 'workflow-spec');
  assert.equal(result.metadata.intelligenceSpecId, 'spec-workflow');
});

test('workflow-owned Intelligence Spec metadata overrides the router fallback', async () => {
  let selected: string | undefined;
  await executor(async () => ({ text: 'ok' }), specId => {
    selected = specId;
    return resolved;
  }).execute({
    prompt: 'run in this workflow',
    context: { intelligenceSpecId: 'router-spec', metadata: { intelligenceSpecId: 'workflow-owned-spec' } }
  });
  assert.equal(selected, 'workflow-owned-spec');
});

test('adapts the canonical Aiko inference gateway tool-call and message formats', async () => {
  let captured: any;
  const invoke = createAikoModelInvoker({
    async executeProfileRequest(profile, prompt, _clientIp, options) {
      captured = { profile, prompt, options };
      return { content: '', providerUsed: 'google', modelUsed: 'gemini-test', toolCalls: [{ id: 'call-1', function: { name: 'lookup', arguments: '{"id":"42"}' } }] };
    }
  });
  const turn = await invoke({
    profile: { prioritiseDeterminism: true }, system: 'system rules', prompt: 'find item', messages: [
      { role: 'assistant', content: '', toolCalls: [{ id: 'prior-call', name: 'lookup', arguments: { id: '41' } }] },
      { role: 'tool', toolCallId: 'prior-call', content: '{\"success\":true}' }
    ], tools: [{ name: 'lookup', description: 'Find item. Output contract: object', inputSchema: { type: 'object' }, outputSchema: { type: 'object' }, invocation: 'workflow' }]
  });
  assert.equal(captured.prompt, 'find item');
  assert.equal(captured.options.messages[0].role, 'system');
  assert.equal(captured.options.messages[1].role, 'user');
  assert.equal(captured.options.tools[0].function.name, 'lookup');
  assert.equal(captured.options.messages[2].tool_calls[0].id, 'prior-call');
  assert.equal(captured.options.messages[3].tool_call_id, 'prior-call');
  assert.deepEqual(turn.toolCalls, [{ id: 'call-1', name: 'lookup', arguments: { id: '42' } }]);
  assert.equal(turn.providerId, 'google');
  assert.equal(turn.modelId, 'gemini-test');
});

test('rejects malformed JSON arguments returned by the provider adapter', async () => {
  const invoke = createAikoModelInvoker({
    async executeProfileRequest() {
      return { content: '', toolCalls: [{ id: 'bad', function: { name: 'lookup', arguments: '{bad json' } }] };
    }
  });
  await assert.rejects(() => invoke({
    profile: {}, system: 'rules', prompt: 'go', messages: [],
    tools: [{ name: 'lookup', description: 'lookup', inputSchema: {}, outputSchema: {}, invocation: 'node' }]
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'MODEL_TOOL_CALL_INVALID');
});

test('accepts natural-language string output when the downstream contract expects a string', async () => {
  const result = await executor(async () => ({ text: 'A concise natural-language answer.' })).execute({
    prompt: 'Explain this', outputContract: { type: 'string' }
  });
  assert.equal(result.result, 'A concise natural-language answer.');
});

test('does not infer result constraints from metadata or capability output edges', () => {
  const numberContract = { type: 'number' };
  const inferred = inferAIAgentOutputContract('agent', [
    { id: 'add', inputContracts: { value: numberContract } },
    { id: 'logger', inputContracts: { value: { type: 'object' } } }
  ], [
    { source: 'agent', sourceHandle: 'metadata', target: 'logger', targetPort: 'value' },
    { source: 'agent', sourceHandle: 'result', target: 'add', targetPort: 'value' }
  ]);
  assert.deepEqual(inferred, numberContract);
});

test('returns a distinct deterministic error when Intelligence Spec resolution fails', async () => {
  await assert.rejects(() => executor(async () => ({ text: 'never called' }), () => {
    throw new Error('spec unavailable');
  }).execute({ prompt: 'run' }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'INTELLIGENCE_SPEC_RESOLUTION_FAILED');
});
test('requires a non-empty prompt and enforces a deterministic tool-call ceiling', async () => {
  await assert.rejects(() => executor(async () => ({ text: 'x' })).execute({ prompt: '  ' }),
    (error: unknown) => error instanceof AIAgentNodeError && error.code === 'INVALID_PROMPT');
  await assert.rejects(() => executor(async () => ({ toolCalls: [{ name: 'one', arguments: {} }] })).execute({
    prompt: 'loop', tools: [tool('one', 'one')], maxToolCalls: 0
  }), (error: unknown) => error instanceof AIAgentNodeError && error.code === 'TOOL_CALL_LIMIT');
});
