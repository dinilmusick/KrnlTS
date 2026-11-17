import { randomUUID } from "node:crypto";
import { NodeRegistry, type NodeDefinition } from "./registry/index.js";
import { registerAllNodes } from "./nodes/index.js";
import { GraphScheduler, validateGraph, planGraphExecution } from "./scheduler/index.js";
import { MemoryStore, type LogEntry } from "./memory/index.js";
import { SDKRegistry } from "./sdk/registry/index.js";
import type { GraphJSON, NodeJSON, EdgeJSON } from "./types/graph.js";
import type { GraphExecutionServices, VerifiedLuthPrincipal } from "./executor/context.js";
import type { RuntimeNodeContext } from "../../runtime/RuntimeNodeAdapter.js";

export type { GraphJSON, NodeJSON, EdgeJSON } from "./types/graph.js";
export type { NodeDefinition, NodePortDefinition, NodeMetadata } from "./registry/index.js";
export type { SchedulerEvent, SchedulerEventType, SchedulerListener } from "./scheduler/index.js";
export type { GraphExecutionServices, VerifiedLuthPrincipal, CustomCodeExecutionService } from "./executor/context.js";
export { MemoryStore, validateGraph, planGraphExecution, registerAllNodes, NodeRegistry, SDKRegistry };

export interface GraphExecutionOptions {
  workspaceId: string;
  principal: VerifiedLuthPrincipal;
  executionId?: string;
  variables?: Record<string, unknown>;
  services?: GraphExecutionServices;
  signal?: AbortSignal;
}
export interface GraphExecutionResult {
  executionId: string;
  workspaceId: string;
  success: boolean;
  cancelled: boolean;
  outputs: Record<string, Record<string, unknown>>;
  variables: Record<string, unknown>;
  logs: LogEntry[];
  errors: Record<string, string>;
}
export class GraphEngine {
  readonly registry: NodeRegistry;
  readonly sdk: SDKRegistry;
  private readonly active = new Map<string, GraphScheduler>();
  constructor(registry?: NodeRegistry) {
    this.registry = registry || registerAllNodes(new NodeRegistry());
    this.sdk = new SDKRegistry(this.registry);
  }
  getNodeDefinitions(): NodeDefinition[] { return this.registry.getAllDefinitions(); }
  validate(graph: GraphJSON) { return validateGraph(graph); }
  plan(graph: GraphJSON) { return planGraphExecution(graph); }
  cancel(executionId: string): boolean {
    const scheduler = this.active.get(executionId);
    if (!scheduler) return false;
    scheduler.cancel();
    return true;
  }
  async execute(graph: GraphJSON, options: GraphExecutionOptions): Promise<GraphExecutionResult> {
    if (!options.workspaceId || !options.principal?.userId || options.principal.verified !== true) {
      throw new Error("Graph execution requires a verified Luth principal and workspace context.");
    }
    if (options.principal.workspaceId !== options.workspaceId) {
      throw new Error("Verified Luth principal does not belong to the requested workspace.");
    }
    const executionId = options.executionId || randomUUID();
    if (this.active.has(executionId)) throw new Error("Execution ID is already active.");
    const scheduler = new GraphScheduler(this.registry);
    const runtimeContext: RuntimeNodeContext = {
      workspaceId: options.workspaceId,
      executionId,
      principal: { id: options.principal.userId, role: options.principal.roles?.[0] || "user" },
      auth: { provider: "luth", verified: true },
      signal: options.signal,
      isCancelled: () => scheduler.getIsCancelled()
    };
    this.active.set(executionId, scheduler);
    try {
      const memory = await scheduler.run(graph, { ...(graph.variables || {}), ...(options.variables || {}) }, {
        executionId, workspaceId: options.workspaceId, principal: options.principal,
        services: options.services, signal: options.signal
      });
      const errors = memory.getErrors();
      const cancelled = scheduler.getIsCancelled();
      return {
        executionId, workspaceId: options.workspaceId,
        success: !cancelled && Object.keys(errors).length === 0,
        cancelled, outputs: memory.getAllOutputs(), variables: memory.getVariables(),
        logs: memory.getLogs(), errors
      };
    } finally {
      try {
        await options.services?.runtime?.cleanupExecution(runtimeContext);
      } finally {
        scheduler.dispose();
        this.active.delete(executionId);
      }
    }
  }
}
export function createGraphEngine(): GraphEngine { return new GraphEngine(); }
