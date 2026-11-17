import { NodeRegistry, type NodeDefinition } from "../registry/index.js";
import type { MemoryStore } from "../memory/index.js";
import type { ExecutionContext } from "../executor/context.js";
import {
  RUNTIME_NODE_DEFINITIONS,
  RUNTIME_PROVIDER_NODE_DEFINITIONS,
  type RuntimeNodeContext,
  type RuntimeNodeDefinition
} from "../../../runtime/RuntimeNodeAdapter.js";

function runtimeContext(context?: ExecutionContext): RuntimeNodeContext {
  if (!context?.workspaceId || !context.principal || context.principal.verified !== true ||
      context.principal.workspaceId !== context.workspaceId) {
    throw new Error("Runtime nodes require a verified Luth principal and matching workspace.");
  }
  if (context.signal.aborted || context.isCancelled()) throw new Error("Runtime operation was cancelled.");
  return {
    workspaceId: context.workspaceId,
    executionId: context.executionId,
    principal: { id: context.principal.userId, role: context.principal.roles?.[0] || "user" },
    auth: { provider: "luth", verified: true },
    signal: context.signal,
    isCancelled: () => context.isCancelled()
  };
}

const runtimeDefinitions: RuntimeNodeDefinition[] = [
  ...RUNTIME_NODE_DEFINITIONS,
  ...RUNTIME_PROVIDER_NODE_DEFINITIONS
];

const definitions: NodeDefinition[] = runtimeDefinitions.map(definition => ({
  metadata: {
    type: definition.type,
    category: "utilities",
    displayName: definition.displayName,
    description: definition.description,
    nativeExecution: true,
    ...(definition.provider ? {
      providerId: definition.provider.id,
      requiresProviderRegistration: true
    } : {})
  },
  inputs: Object.fromEntries(Object.entries(definition.inputs).map(([name, port]) => [
    name, { type: port.type, label: port.label, ...(port.required ? { required: port.required } : {}) }
  ])),
  outputs: Object.fromEntries(Object.entries(definition.outputs).map(([name, port]) => [
    name, { type: port.type, label: port.label }
  ])),
  async execute(inputs, _memory: MemoryStore, _nodeId: string, context?: ExecutionContext) {
    const adapter = context?.services.runtime;
    if (!adapter) throw new Error("Runtime nodes require Aiko's RuntimeNodeAdapter.");
    const result = await adapter.execute(definition.type, inputs, runtimeContext(context));
    const error = result.error as { message?: string } | undefined;
    if (error) throw new Error(error.message || "Aiko RuntimeNodeAdapter operation failed.");
    return result;
  }
}));

export function registerRuntimeNodes(registry: NodeRegistry): void {
  definitions.forEach(definition => registry.register(definition, true));
}
export { definitions as RUNTIME_ENGINE_NODE_DEFINITIONS };
