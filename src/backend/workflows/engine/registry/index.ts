import { MemoryStore } from "../memory/index.js";
import type { ExecutionContext } from "../executor/context.js";

export interface NodeMetadata {
  type: string;
  category: 'core' | 'math' | 'logic' | 'flow' | 'json' | 'networking' | 'ai' | 'database' | 'utilities' | 'collections' | 'string' | 'custom';
  displayName: string;
  description: string;
  defaultCode?: string;
  nativeExecution?: boolean;
  providerId?: string;
  requiresProviderRegistration?: boolean;
}

export interface NodePortDefinition {
  type: 'string' | 'number' | 'integer' | 'float' | 'boolean' | 'any' | 'array' | 'object' | 'kv' | 'list' | 'exec';
  label: string;
  defaultValue?: any;
}

export interface NodeDefinition {
  metadata: NodeMetadata;
  inputs: Record<string, NodePortDefinition>;
  outputs: Record<string, NodePortDefinition>;
  execute: (inputs: Record<string, any>, memory: MemoryStore, nodeId: string, context?: ExecutionContext) => Promise<Record<string, any>>;
}

export class NodeRegistry {
  private registry: Map<string, NodeDefinition> = new Map();

  constructor() {}

  register(definition: NodeDefinition, nativeExecution = false): void {
    const registered = nativeExecution
      ? { ...definition, metadata: { ...definition.metadata, nativeExecution: true } }
      : definition;
    this.registry.set(registered.metadata.type, registered);
  }

  getDefinition(type: string): NodeDefinition | undefined {
    return this.registry.get(type);
  }

  getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.registry.values()).sort((a, b) => a.metadata.type.localeCompare(b.metadata.type));
  }
}
