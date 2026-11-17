import type { CapabilityEdge, CapabilityExecutionContext, CapabilityGraph, CapabilityGraphExecutor, CapabilityNode, JsonSchema, ToolCapability } from './contracts.js';
import { CapabilityValidationError } from './contracts.js';
import { deriveToolCapability } from './derive.js';

const edgeFrom = (edge: CapabilityEdge) => edge.from ?? edge.source ?? '';
const edgeTo = (edge: CapabilityEdge) => edge.to ?? edge.target ?? '';

function schemaIssues(schema: JsonSchema, value: unknown, path = '$'): string[] {
  const issues: string[] = [];
  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  const matches = (type: string) => {
    if (type === 'null') return value === null;
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
    if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'string') return typeof value === 'string';
    return true;
  };
  if (types.length && !types.some(matches)) return [path + ' must be ' + types.join(' or ') + '.'];
  if (schema.enum && !schema.enum.some(item => JSON.stringify(item) === JSON.stringify(value)))
    issues.push(path + ' must match one of the allowed enum values.');
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) issues.push(path + ' is shorter than minLength.');
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) issues.push(path + ' is longer than maxLength.');
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) issues.push(path + ' is below minimum.');
    if (typeof schema.maximum === 'number' && value > schema.maximum) issues.push(path + ' is above maximum.');
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) issues.push(path + ' has fewer than minItems.');
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) issues.push(path + ' has more than maxItems.');
    if (schema.items && typeof schema.items === 'object')
      value.forEach((item, index) => issues.push(...schemaIssues(schema.items as JsonSchema, item, path + '[' + index + ']')));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    for (const key of (schema.required || [])) if (!(key in object)) issues.push(path + '.' + key + ' is required.');
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (key in object) issues.push(...schemaIssues(child, object[key], path + '.' + key));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(object)) if (!(key in (schema.properties || {}))) issues.push(path + '.' + key + ' is not allowed.');
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const [key, item] of Object.entries(object)) if (!(key in (schema.properties || {})))
        issues.push(...schemaIssues(schema.additionalProperties as JsonSchema, item, path + '.' + key));
    }
  }
  return issues;
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function resolveNestedWorkflowGraph(
  graph: CapabilityGraph, resolveWorkflow: (workflowId: string) => Promise<CapabilityGraph | null>, stack: string[] = []
): Promise<CapabilityGraph> {
  const resolved = clone(graph);
  for (const node of resolved.nodes) {
    if (node.type !== 'workflow' && node.type !== 'saved-workflow') continue;
    const workflowId = node.data?.workflowId;
    if (typeof workflowId !== 'string' || !workflowId)
      throw new CapabilityValidationError(['Invalid workflow reference on node: ' + node.id]);
    if (stack.includes(workflowId))
      throw new CapabilityValidationError(['Nested workflow capability cycle: ' + [...stack, workflowId].join(' → ')]);
    const nested = await resolveWorkflow(workflowId);
    if (!nested) throw new CapabilityValidationError(['Workflow reference is inaccessible or missing: ' + workflowId]);
    const nestedGraph = await resolveNestedWorkflowGraph(nested, resolveWorkflow, [...stack, workflowId]);
    const nestedCapability = deriveToolCapability(nestedGraph, { kind: 'workflow', id: workflowId, workflowId });
    node.contracts = {
      input: nestedCapability.inputSchema,
      output: nestedCapability.outputSchema,
    };
    node.permissions = {
      required: [...new Set([...(node.permissions?.required || []), ...nestedCapability.permissions.required])],
      context: [...new Set([...(node.permissions?.context || []), ...nestedCapability.permissions.context])],
    };
    node.capabilityMetadata = {
      ...(node.capabilityMetadata || {}), nestedWorkflow: nestedCapability.metadata,
    };
  }
  return resolved;
}

export async function validateCapabilityGraph(
  graph: CapabilityGraph, resolveWorkflow?: (workflowId: string) => Promise<CapabilityGraph | null>, stack: string[] = []
): Promise<void> {
  const refs = graph.nodes.some(node => node.type === 'workflow' || node.type === 'saved-workflow');
  if (refs && !resolveWorkflow) throw new CapabilityValidationError(['Workflow resolver is required for nested workflow references.']);
  const resolved = resolveWorkflow
    ? await resolveNestedWorkflowGraph(graph, resolveWorkflow, stack) : graph;
  deriveToolCapability(resolved, { kind: 'workflow', id: 'validation' });
}

export async function executeToolCapability(
  capability: ToolCapability, graph: CapabilityGraph, input: Record<string, unknown>,
  executor: CapabilityGraphExecutor, context: CapabilityExecutionContext = {}
): Promise<unknown> {
  const denied = capability.permissions.required.filter(permission => !(context.permissions || []).includes(permission));
  if (denied.length) throw new CapabilityValidationError(['Missing required permissions: ' + denied.join(', ')]);
  const missingContext = capability.permissions.context.filter(key => context[key as keyof CapabilityExecutionContext] === undefined);
  if (missingContext.length) throw new CapabilityValidationError(['Missing required execution context: ' + missingContext.join(', ')]);
  const selected = new Set(capability.execution.nodeIds);
  const freshGraph: CapabilityGraph = clone({
    nodes: graph.nodes.filter(node => selected.has(node.id)),
    edges: graph.edges.filter(edge => selected.has(edgeFrom(edge)) && selected.has(edgeTo(edge))),
    metadata: graph.metadata || {},
  });
  const expected = deriveToolCapability(graph, capability.source, {
    name: capability.name, description: capability.description,
  });
  const includesAll = (actual: string[], required: string[]) => required.every(value => actual.includes(value));
  if (expected.id !== capability.id ||
      JSON.stringify(expected.inputSchema) !== JSON.stringify(capability.inputSchema) ||
      JSON.stringify(expected.outputSchema) !== JSON.stringify(capability.outputSchema) ||
      JSON.stringify(expected.execution) !== JSON.stringify(capability.execution) ||
      JSON.stringify(expected.metadata) !== JSON.stringify(capability.metadata) ||
      !includesAll(capability.permissions.required, expected.permissions.required) ||
      !includesAll(capability.permissions.context, expected.permissions.context))
    throw new CapabilityValidationError(['Capability projection no longer matches its graph or its required permissions/context were weakened.']);
  const inputIssues = schemaIssues(capability.inputSchema, input);
  if (inputIssues.length) throw new CapabilityValidationError(['Invalid capability input: ' + inputIssues.join('; ')]);
  const output = await executor(freshGraph, clone(input), { ...context, metadata: clone(context.metadata || {}) });
  const outputIssues = schemaIssues(capability.outputSchema, output);
  if (outputIssues.length) throw new CapabilityValidationError(['Invalid capability output: ' + outputIssues.join('; ')]);
  return output;
}
