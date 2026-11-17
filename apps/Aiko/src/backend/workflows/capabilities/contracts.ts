export type JsonSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  enum?: unknown[];
  [key: string]: unknown;
};
export type CapabilityKind = 'node' | 'chain' | 'workflow' | 'http' | 'runtime' | 'agent' | 'custom';
export interface ToolInputHandle {
  kind: 'tool-input'; id: string; accepts: 'tool-capabilities'; multiple: boolean;
  acceptedCapabilityIds?: string[]; acceptedCapabilityKinds?: CapabilityKind[];
}
export interface ToolOutputHandle {
  kind: 'tool-output'; id: string; capabilityId: string; capabilityKind: CapabilityKind; name: string; description: string;
  inputSchema: JsonSchema; outputSchema: JsonSchema; enabled: boolean;
}
export interface CapabilityNode {
  id: string; type: string; name?: string; description?: string; accessible?: boolean;
  inputSchema?: JsonSchema; outputSchema?: JsonSchema;
  contracts?: { input?: JsonSchema; output?: JsonSchema };
  toolOutput?: ToolOutputHandle; toolInput?: ToolInputHandle;
  permissions?: { required?: string[]; context?: string[] };
  capabilityMetadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}
export interface CapabilityEdge {
  id?: string; kind?: 'data' | 'capability'; from?: string; to?: string; source?: string; target?: string;
  sourceHandle?: string; targetHandle?: string; capabilityId?: string;
}
export interface CapabilityGraph { nodes: CapabilityNode[]; edges: CapabilityEdge[]; metadata?: Record<string, unknown>; }
export interface CapabilitySource { kind: CapabilityKind; id: string; workflowId?: string; nodeIds: string[]; }
export interface ToolCapability {
  schemaVersion: '1.0.0'; id: string; name: string; description: string;
  inputSchema: JsonSchema; outputSchema: JsonSchema;
  execution: { kind: 'graph'; nodeIds: string[]; entryNodeIds: string[]; exitNodeIds: string[] };
  source: CapabilitySource; metadata: Record<string, unknown>;
  permissions: { required: string[]; context: string[] };
}
export interface CapabilityExecutionContext {
  userId?: string; workspaceId?: string; permissions?: string[];
  metadata?: Record<string, unknown>; signal?: AbortSignal;
}
export type CapabilityGraphExecutor = (graph: CapabilityGraph, input: Record<string, unknown>, context: CapabilityExecutionContext) => Promise<unknown>;
export class CapabilityValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super('Invalid tool capability: ' + issues.join('; '));
    this.name = 'CapabilityValidationError';
  }
}

/** Stable machine-readable contract published to external consumers. */
export const AIKO_CAPABILITY_CONTRACT = {
  schemaVersion: '1.0.0',
  dataFlow: { edgeKind: 'data', source: 'node-output', target: 'node-input' },
  capabilityFlow: { edgeKind: 'capability', sourceHandleKind: 'tool-output', targetHandleKind: 'tool-input' },
  toolInput: { kind: 'tool-input', accepts: 'tool-capabilities', multiple: true },
  toolOutput: { kind: 'tool-output', executable: true, dataOutput: false },
  capabilityKinds: ['node', 'chain', 'workflow', 'http', 'runtime', 'agent', 'custom'],
  identity: 'graph-derived-stable-capability-id',
} as const;
