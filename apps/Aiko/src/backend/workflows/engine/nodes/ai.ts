import { NodeRegistry, type NodeDefinition } from "../registry/index.js";
import type { MemoryStore } from "../memory/index.js";
import type { ExecutionContext } from "../executor/context.js";
import { AIAgentNodeExecutor, AI_AGENT_NODE_TYPE, type AIAgentToolBinding } from "../../aiAgentNode.js";

const definition: NodeDefinition = {
  metadata: { type: AI_AGENT_NODE_TYPE, category: "ai", displayName: "AI Agent", description: "Run an Aiko AI Agent with structured output and optional graph capability tools.", nativeExecution: true },
  inputs: {
    prompt: { type: "string", label: "Prompt" },
    tools: { type: "any", label: "Capability Tools", defaultValue: [] },
    intelligenceSpecId: { type: "string", label: "Intelligence Spec" },
    outputContract: { type: "object", label: "Output Contract" },
    maxToolCalls: { type: "number", label: "Maximum Tool Calls", defaultValue: 12 },
  },
  outputs: {
    result: { type: "any", label: "Result" },
    metadata: { type: "object", label: "Execution Metadata" },
    capability: { type: "object", label: "Agent Capability" },
  },
  async execute(inputs: Record<string, any>, _memory: MemoryStore, nodeId: string, context?: ExecutionContext) {
    if (!context?.principal || context.principal.verified !== true) throw new Error("AI Agent nodes require a verified Luth principal.");
    const tools = Array.isArray(inputs.tools) ? inputs.tools.filter((item): item is AIAgentToolBinding => item && typeof item.invoke === "function" && item.capability) : [];
    const executor = new AIAgentNodeExecutor();
    const result = await executor.execute({
      prompt: String(inputs.prompt || ""),
      tools,
      intelligenceSpecId: typeof inputs.intelligenceSpecId === "string" ? inputs.intelligenceSpecId : (context.getVariable('__workflowIntelligenceSpecId') as string | undefined),
      outputContract: inputs.outputContract,
      maxToolCalls: typeof inputs.maxToolCalls === "number" ? inputs.maxToolCalls : undefined,
      context: { workflowId: context.workspaceId, nodeId, metadata: { workspaceId: context.workspaceId } },
    });
    return { result: result.result, metadata: result.metadata, capability: { id: "ai-agent:" + nodeId, kind: "agent" } };
  },
};

export function registerAiNodes(registry: NodeRegistry) {
  registry.register(definition, true);
}
