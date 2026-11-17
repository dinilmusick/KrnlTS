import { IntelligenceSpecResolver } from '../agentic/intelligenceSpecResolver.js';
import type { ModelProfileRequest, ExecutionResponse } from '../types.js';
import { failoverExecutionEngine } from '../failoverEngine.js';
import type { ToolCapability } from './capabilities/contracts.js';
import { createToolOutputHandle, deriveToolCapability } from './capabilities/derive.js';

export interface AIAgentOutputContract { type?: string | string[]; description?: string; required?: string[]; properties?: Record<string, unknown>; items?: unknown; enum?: unknown[]; [key: string]: unknown; }
export interface AIAgentToolCall { id?: string; name: string; arguments: Record<string, unknown>; }
/** Runtime binding for a canonical graph-derived capability. */
export interface AIAgentToolBinding {
  capability: ToolCapability;
  invoke(input: Record<string, unknown>, context: AIAgentExecutionContext): Promise<unknown>;
}
export interface AIAgentExecutionContext {
  workflowId?: string; nodeId?: string; intelligenceSpecId?: string;
  metadata?: Record<string, unknown>;
}
export interface AIAgentModelRequest {
  profile: ModelProfileRequest; modelId?: string; providerId?: string;
  system: string; prompt: string; messages: Array<{ role: 'assistant' | 'tool'; content: string; toolCallId?: string; toolCalls?: AIAgentToolCall[] }>;
  tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown>; outputSchema: AIAgentOutputContract; invocation: string }>;
  outputContract?: AIAgentOutputContract;
}
export interface AIAgentModelTurn { text?: string; toolCalls?: AIAgentToolCall[]; providerId?: string; modelId?: string; }
export interface AIAgentInferenceEngine { executeProfileRequest(profile: ModelProfileRequest, prompt: string, clientIp?: string, options?: any): Promise<ExecutionResponse>; }

function parseModelToolArguments(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === '') return {};
  if (raw === null) throw new AIAgentNodeError('MODEL_TOOL_CALL_INVALID', 'Model tool arguments cannot be null.');
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== 'string') throw new AIAgentNodeError('MODEL_TOOL_CALL_INVALID', 'Model tool arguments must be a JSON object.');
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an object.');
    return parsed as Record<string, unknown>;
  } catch { throw new AIAgentNodeError('MODEL_TOOL_CALL_INVALID', 'Model returned invalid JSON tool arguments.'); }
}

export function createAikoModelInvoker(engine: AIAgentInferenceEngine = failoverExecutionEngine): (request: AIAgentModelRequest) => Promise<AIAgentModelTurn> {
  return async request => {
    const messages = [
      { role: 'system', content: request.system },
      { role: 'user', content: request.prompt },
      ...request.messages.map(message => message.role === 'tool'
        ? { role: 'tool', tool_call_id: message.toolCallId, content: message.content }
        : message.toolCalls?.length
          ? { role: 'assistant', content: null, tool_calls: message.toolCalls.map(call => ({ id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments) } })) }
          : { role: 'assistant', content: message.content })
    ];
    const tools = request.tools.map(tool => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } }));
    const response = await engine.executeProfileRequest(request.profile, request.prompt, undefined, { messages, tools, tool_choice: tools.length ? 'auto' : undefined, response_format: request.outputContract?.type === 'object' || request.outputContract?.type === 'array' ? { type: 'json_object' } : undefined });
    const toolCalls = (response.toolCalls || []).map((call: any) => ({
      id: call.id || call.callId,
      name: call.function?.name || call.name || call.toolName,
      arguments: parseModelToolArguments(call.function?.arguments ?? call.arguments ?? call.args)
    }));
    return { text: response.content || response.text || '', toolCalls, providerId: response.providerUsed, modelId: response.modelUsed };
  };
}
export interface AIAgentNodeInput { prompt: string; tools?: AIAgentToolBinding[]; intelligenceSpecId?: string; context?: AIAgentExecutionContext; outputContract?: AIAgentOutputContract; maxToolCalls?: number; }
export interface AIAgentNodeResult {
  result: unknown; metadata: { nodeType: 'ai-agent'; intelligenceSpecId: string; providerId?: string; modelId?: string; toolCalls: number; tools: string[]; outputContract?: AIAgentOutputContract };
}
export interface AIAgentGraphNode {
  id: string; inputContracts?: Record<string, AIAgentOutputContract>; inputSchema?: AIAgentOutputContract;
  contracts?: { input?: AIAgentOutputContract };
  data?: { inputContracts?: Record<string, AIAgentOutputContract>; inputSchema?: AIAgentOutputContract; contracts?: { input?: AIAgentOutputContract } };
}
export interface AIAgentGraphEdge { source: string; target: string; sourcePort?: string; sourceHandle?: string; targetPort?: string; targetHandle?: string; }
export interface AIAgentModelResolverResult { specId: string; profile: ModelProfileRequest; resolvedModel?: { id?: string; providerId?: string } | null; }
export interface AIAgentNodeDependencies {
  resolveModel(specId?: string): AIAgentModelResolverResult;
  invokeModel(request: AIAgentModelRequest): Promise<AIAgentModelTurn>;
}

export const AI_AGENT_NODE_TYPE = 'ai-agent';
export const AI_AGENT_NODE_CONTRACT = {
  type: AI_AGENT_NODE_TYPE,
  inputs: [
    { id: 'prompt', kind: 'data', required: true, valueType: 'string' },
    { id: 'tools', kind: 'capability', multiple: true, required: false }
  ],
  toolInput: { kind: 'tool-input', id: 'tools', accepts: 'tool-capabilities', multiple: true },
  toolOutput: createAIAgentToolOutputHandle('ai-agent'),
  outputs: [
    { id: 'result', kind: 'data' },
    { id: 'metadata', kind: 'data' },
    { id: 'capability', kind: 'capability', description: 'Expose this agent as an invokable capability.' }
  ]
} as const;

function normalizeOutputSchemaForComparison(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeOutputSchemaForComparison);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record)
      .filter(key => !['description', 'title', '$comment'].includes(key))
      .sort()
      .map(key => [key, normalizeOutputSchemaForComparison(record[key])]));
  }
  return value;
}

export function inferAIAgentOutputContract(nodeId: string, nodes: AIAgentGraphNode[], edges: AIAgentGraphEdge[]): AIAgentOutputContract | undefined {
  const byId = new Map(nodes.map(node => [node.id, node] as const));
  const contracts = edges.filter(edge => edge.source === nodeId && (!edge.sourcePort && !edge.sourceHandle || (edge.sourcePort || edge.sourceHandle) === 'result')).map(edge => {
    const target = byId.get(edge.target);
    const port = edge.targetPort || edge.targetHandle;
    const properties = target?.contracts?.input?.properties || target?.inputSchema?.properties
      || target?.data?.contracts?.input?.properties || target?.data?.inputSchema?.properties;
    return port ? target?.inputContracts?.[port] || target?.data?.inputContracts?.[port] || properties?.[port] : undefined;
  }).filter((contract): contract is AIAgentOutputContract => Boolean(contract));
  if (!contracts.length) return undefined;
  const unique = new Map(contracts.map(contract => [JSON.stringify(normalizeOutputSchemaForComparison(contract)), contract] as const));
  if (unique.size > 1) throw new AIAgentNodeError('OUTPUT_CONTRACT_CONFLICT', 'Connected downstream inputs require incompatible output contracts.');
  return contracts[0];
}

export class AIAgentNodeError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: unknown) { super(message); this.name = 'AIAgentNodeError'; }
}

function validateSchema(value: unknown, schema: AIAgentOutputContract, path = 'result'): void {
  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  const matches = (type: string) => type === 'object' ? !!value && typeof value === 'object' && !Array.isArray(value)
    : type === 'array' ? Array.isArray(value) : type === 'integer' ? Number.isInteger(value)
    : type === 'number' ? typeof value === 'number' && Number.isFinite(value)
    : type === 'string' ? typeof value === 'string' : type === 'boolean' ? typeof value === 'boolean'
    : type === 'null' ? value === null : true;
  if (types.length && !types.some(matches))
    throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' must satisfy type ' + types.join(' or ') + '.');
  if (schema.enum && !schema.enum.some(item => JSON.stringify(item) === JSON.stringify(value)))
    throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' is not an allowed enum value.');
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength)
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' is shorter than minLength.');
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength)
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' is longer than maxLength.');
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum)
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' is below minimum.');
    if (typeof schema.maximum === 'number' && value > schema.maximum)
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' is above maximum.');
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems)
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' has fewer than minItems.');
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems)
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + ' has more than maxItems.');
    if (schema.items) value.forEach((item, index) => validateSchema(item, schema.items as AIAgentOutputContract, path + '[' + index + ']'));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    if (schema.required) for (const key of schema.required) if (!(key in object))
      throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + '.' + key + ' is required.');
    if (schema.properties) for (const [key, child] of Object.entries(schema.properties)) {
      if (key in object) validateSchema(object[key], child as AIAgentOutputContract, path + '.' + key);
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(object)) if (!(key in schema.properties))
        throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', path + '.' + key + ' is not allowed.');
    }
  }
}
function parseResult(text: string, contract?: AIAgentOutputContract): unknown {
  if (!contract) return text;
  const cleaned = text.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/i, '').trim();
  let value: unknown;
  if (contract.type === 'string') value = cleaned;
  else {
    try { value = JSON.parse(cleaned); }
    catch { throw new AIAgentNodeError('STRUCTURED_OUTPUT_INVALID', 'The model did not return valid JSON for the inferred output contract.'); }
  }
  validateSchema(value, contract);
  return value;
}

export class AIAgentNodeExecutor {
  private readonly dependencies: AIAgentNodeDependencies;
  constructor(dependencies: Partial<AIAgentNodeDependencies> = {}) {
    this.dependencies = {
      invokeModel: dependencies.invokeModel || createAikoModelInvoker(),
      resolveModel: dependencies.resolveModel || (specId => {
        const resolved = IntelligenceSpecResolver.resolveAgentModel('AIKO', { explicitSpecId: specId });
        return { specId: resolved.specId, profile: resolved.profile, resolvedModel: resolved.resolvedModel };
      })
    };
  }

  async execute(input: AIAgentNodeInput): Promise<AIAgentNodeResult> {
    if (typeof input.prompt !== 'string' || !input.prompt.trim()) throw new AIAgentNodeError('INVALID_PROMPT', 'AI Agent prompt must be a non-empty string.');
    const tools = input.tools || [];
    const names = new Set<string>();
    for (const tool of tools) {
      const capability = tool.capability;
      if (!capability?.id || !capability.name || !capability.inputSchema || !capability.outputSchema || typeof tool.invoke !== 'function')
        throw new AIAgentNodeError('INVALID_TOOL_CONNECTION', 'Every connected tool must resolve to a canonical capability and execution binding.', capability?.id);
      const name = capability.name.replace(/[^a-zA-Z0-9_]/g, '_');
      if (names.has(name)) throw new AIAgentNodeError('INVALID_TOOL_CONNECTION', 'Tool names must be unique after normalization: ' + name);
      names.add(name);
    }
    const outputContract = input.outputContract;
    const toolDescriptions = tools.map(tool => ({
      name: tool.capability.name.replace(/[^a-zA-Z0-9_]/g, '_'),
      description: tool.capability.description + '\nOutput contract: ' + JSON.stringify(tool.capability.outputSchema) + '\nInvocation: ' + tool.capability.source.kind + ' capability.',
      inputSchema: tool.capability.inputSchema, outputSchema: tool.capability.outputSchema,
      invocation: tool.capability.source.kind + ': invoke the connected capability with an object matching inputSchema.'
    }));
    const messages: AIAgentModelRequest['messages'] = [];
    let toolCalls = 0;
    const requestedLimit = input.maxToolCalls ?? 12;
    const limit = Number.isFinite(requestedLimit) ? Math.max(0, Math.min(Math.floor(requestedLimit), 50)) : 12;
    let turn: AIAgentModelTurn = {};
    let actualProviderId: string | undefined;
    let actualModelId: string | undefined;
    try {
      let resolved: AIAgentModelResolverResult;
      try { resolved = this.dependencies.resolveModel(input.intelligenceSpecId || (typeof input.context?.metadata?.intelligenceSpecId === 'string' ? input.context.metadata.intelligenceSpecId : undefined) || input.context?.intelligenceSpecId); }
      catch (error) { throw new AIAgentNodeError('INTELLIGENCE_SPEC_RESOLUTION_FAILED', error instanceof Error ? error.message : String(error)); }
      for (;;) {
        turn = await this.dependencies.invokeModel({
          profile: resolved.profile, modelId: resolved.resolvedModel?.id,
          providerId: resolved.resolvedModel?.providerId,
          system: 'You are an AI Agent inside an Aiko FOD workflow. Use only the supplied capability tools. Never invent tool results. Return the final answer in the exact downstream output contract when one is supplied. ' + (outputContract ? 'Required JSON Schema: ' + JSON.stringify(outputContract) : ''),
          prompt: input.prompt, messages, tools: toolDescriptions, outputContract
        });
        actualProviderId = turn.providerId || actualProviderId;
        actualModelId = turn.modelId || actualModelId;
        if (!turn.toolCalls?.length) break;
        if (toolCalls + turn.toolCalls.length > limit) throw new AIAgentNodeError('TOOL_CALL_LIMIT', 'AI Agent exceeded its deterministic tool-call limit.');
        messages.push({ role: 'assistant', content: '', toolCalls: turn.toolCalls });
        for (const call of turn.toolCalls) {
          const tool = tools.find(item => item.capability.name === call.name || item.capability.name.replace(/[^a-zA-Z0-9_]/g, '_') === call.name || item.capability.name.replace(/[^a-zA-Z0-9_]/g, '_') === call.name.replace(/[^a-zA-Z0-9_]/g, '_'));
          if (!tool) throw new AIAgentNodeError('INVALID_TOOL_CONNECTION', 'Model requested an unavailable capability: ' + call.name);
          try {
            if (!call.arguments || typeof call.arguments !== 'object' || Array.isArray(call.arguments)) throw new AIAgentNodeError('TOOL_INPUT_INVALID', 'Capability arguments must be a JSON object.');
            try { validateSchema(call.arguments, tool.capability.inputSchema as AIAgentOutputContract, 'tool.' + tool.capability.name + '.input'); }
            catch (error) { throw new AIAgentNodeError('TOOL_INPUT_INVALID', error instanceof Error ? error.message : String(error)); }
            const result = await tool.invoke(call.arguments, input.context || {});
            try { validateSchema(result, tool.capability.outputSchema, 'tool.' + tool.capability.name + '.output'); }
            catch (error) { throw new AIAgentNodeError('TOOL_OUTPUT_INVALID', error instanceof Error ? error.message : String(error)); }
            messages.push({ role: 'tool', toolCallId: call.id, content: JSON.stringify({ success: true, result }) });
          } catch (error) {
            if (error instanceof AIAgentNodeError && (error.code === 'TOOL_INPUT_INVALID' || error.code === 'TOOL_OUTPUT_INVALID')) throw error;
            throw new AIAgentNodeError('TOOL_EXECUTION_FAILED', 'Capability ' + tool.capability.name + ' failed: ' + (error instanceof Error ? error.message : String(error)), { toolId: tool.capability.id, callId: call.id });
          }
          toolCalls++;
        }
      }
      const result = parseResult(turn.text || '', outputContract);
      return { result, metadata: { nodeType: AI_AGENT_NODE_TYPE, intelligenceSpecId: resolved.specId, providerId: actualProviderId || resolved.resolvedModel?.providerId, modelId: actualModelId || resolved.resolvedModel?.id, toolCalls, tools: tools.map(tool => tool.capability.id), outputContract } };
    } catch (error) {
      if (error instanceof AIAgentNodeError) throw error;
      throw new AIAgentNodeError('MODEL_EXECUTION_FAILED', error instanceof Error ? error.message : String(error));
    }
  }
}

export function asAIAgentCapability(_executor: AIAgentNodeExecutor, _base: Omit<AIAgentNodeInput, 'prompt' | 'tools'> & { tools?: AIAgentToolBinding[] }, id: string): ToolCapability {
  const name = 'ai_agent_' + id.replace(/[^a-zA-Z0-9_]/g, '_');
  return deriveToolCapability({
    nodes: [{ id, type: AI_AGENT_NODE_TYPE, name, description: 'Invoke this AI Agent with a natural-language prompt.',
      inputSchema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string' } } }, outputSchema: {} }],
    edges: [],
  }, { kind: 'agent', id, nodeIds: [id] }, { name, description: 'Invoke this AI Agent with a natural-language prompt.' });
}

export function bindAIAgentCapability(
  capability: ToolCapability, executor: AIAgentNodeExecutor,
  base: Omit<AIAgentNodeInput, 'prompt' | 'tools'> & { tools?: AIAgentToolBinding[] }
): AIAgentToolBinding {
  return { capability, invoke: async (input, context) => (await executor.execute({
    ...base, prompt: String(input.prompt || ''), context: { ...base.context, ...context },
  })).result };
}

export function createAIAgentToolOutputHandle(id: string) {
  return createToolOutputHandle({ id, type: AI_AGENT_NODE_TYPE, name: 'AI Agent', description: 'Invoke this AI Agent.',
    inputSchema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string' } } }, outputSchema: {} },
    { capabilityKind: 'agent' });
}

export async function executeAIAgentNodeFromGraph(executor: AIAgentNodeExecutor, input: AIAgentNodeInput, nodeId: string, nodes: AIAgentGraphNode[], edges: AIAgentGraphEdge[]): Promise<AIAgentNodeResult> {
  return executor.execute({ ...input, outputContract: input.outputContract || inferAIAgentOutputContract(nodeId, nodes, edges) });
}

export interface AIAgentFodRuntimeContext extends AIAgentExecutionContext {
  nodeId: string;
  nodes: AIAgentGraphNode[];
  edges: AIAgentGraphEdge[];
  resolveCapabilityInput(handleId: 'tools'): Promise<AIAgentToolBinding[]> | AIAgentToolBinding[];
}

export interface AIAgentFodRuntimeAdapter {
  registerNodeHandler(
    nodeType: typeof AI_AGENT_NODE_TYPE,
    handler: (input: AIAgentNodeInput, context: AIAgentFodRuntimeContext) => Promise<AIAgentNodeResult>
  ): void;
}

/**
 * Registers the Aiko AI Agent node with a FOD-compatible runtime adapter.
 * The runtime owns graph scheduling and capability-edge resolution; Aiko owns
 * Intelligence Spec routing, model invocation, tool execution, and validation.
 */
export function registerAIAgentNode(runtime: AIAgentFodRuntimeAdapter, executor = new AIAgentNodeExecutor()): AIAgentNodeExecutor {
  runtime.registerNodeHandler(AI_AGENT_NODE_TYPE, async (input, context) => {
    const tools = input.tools ?? await context.resolveCapabilityInput('tools');
    return executeAIAgentNodeFromGraph(
      executor,
      { ...input, tools, context: { ...input.context, ...context } },
      context.nodeId,
      context.nodes,
      context.edges
    );
  });
  return executor;
}
