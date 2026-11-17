import { NodeRegistry, NodeDefinition } from "../../registry/index.js";
import { WorkflowNode } from "../types/index.js";
import { ExecutionContext } from "../../executor/context.js";

export class SDKRegistry {
  private sdkNodes: Map<string, WorkflowNode> = new Map();

  constructor(private readonly registry: NodeRegistry) {}

  registerNode(node: WorkflowNode): void {
    this.sdkNodes.set(node.metadata.name, node);

    // Adapt to standard NodeDefinition for backwards compatibility with legacy executor/visualizer
    const adaptedDefinition: NodeDefinition = {
      metadata: {
        type: node.metadata.name,
        category: this.mapCategory(node.metadata.category),
        displayName: node.metadata.displayName,
        description: node.metadata.description
      },
      inputs: Object.fromEntries(
        Object.entries(node.inputs).map(([key, port]) => [
          key,
          {
            type: this.mapPortType(port.type),
            label: port.name,
            defaultValue: port.defaultValue
          }
        ])
      ),
      outputs: Object.fromEntries(
        Object.entries(node.outputs).map(([key, port]) => [
          key,
          {
            type: this.mapPortType(port.type),
            label: port.name
          }
        ])
      ),
      execute: async (inputs, memory, nodeId, executionContext) => {
        // Construct a contextualized execution context for running the SDK node
        // In actual system execution, the context is created by the Scheduler.
        // We can wrap/delegated execution if needed, or if an actual Context is passed.
        // If a scheduler-managed Context is registered in memory or passed globally, use it.
        const schedulerMock = {
          getIsCancelled: () => false,
          logMessage: (msg: string, lvl: any, nid?: string) => memory.log(msg, lvl, nid)
        };
        const context = executionContext || new ExecutionContext(schedulerMock, memory.getVariables());
        
        // Populate inputs into variables or pass them as context objects if needed
        Object.entries(inputs).forEach(([k, v]) => {
          context.setVariable(k, v);
        });

        const result = await node.execute(context);
        if (!result.success) {
          throw new Error(result.errors?.join("; ") || "SDK execution failed.");
        }
        return result.outputs;
      }
    };

    this.registry.register(adaptedDefinition, true);
  }

  getNode(name: string): WorkflowNode | undefined {
    return this.sdkNodes.get(name);
  }

  getAllNodes(): WorkflowNode[] {
    return Array.from(this.sdkNodes.values());
  }

  private mapCategory(cat: string): any {
    const list = ['core', 'math', 'logic', 'flow', 'json', 'networking', 'ai', 'database', 'utilities', 'collections', 'string'];
    const lower = cat.toLowerCase();
    if (list.includes(lower)) return lower;
    if (lower === 'variable' || lower === 'variables') return 'utilities';
    if (lower === 'parsing') return 'json';
    if (lower === 'object') return 'collections';
    return 'utilities';
  }

  private mapPortType(t: any): any {
    const list = ['string', 'number', 'integer', 'float', 'boolean', 'any', 'array', 'object'];
    const lower = String(t).toLowerCase();
    if (list.includes(lower)) return lower;
    return 'any';
  }
}
