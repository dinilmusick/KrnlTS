export type CapabilityKind='endpoint'|'service'|'fod-flow'|'gutts'|'knowledge'|'agent';
export type TaskStatus='submitted'|'working'|'input-required'|'auth-required'|'completed'|'failed'|'canceled'|'rejected';

export interface JsonSchema { type?:string; properties?:Record<string,unknown>; required?:string[]; [key:string]:unknown }

export interface SemanticValueDescriptor {
  semanticType:string;
  description?:string;
  constraints?:Record<string,unknown>;
}

export interface CapabilityDescriptor {
  id:string; name:string; description:string; kind:CapabilityKind;
  inputSchema?:JsonSchema; outputSchema?:JsonSchema;
  requirements?:RequirementTemplate[];
  provides?:SemanticValueDescriptor[];
  examples?:unknown[];
  sideEffects?:'read'|'compute'|'write'|'external'|'irreversible';
  metadata?:Record<string,unknown>;
}

export interface RequirementTemplate {
  id:string; semanticType:string; description:string; required:boolean;
  sourceField?:string; constraints?:Record<string,unknown>;
}

export interface Requirement {
  id:string; semanticType:string; description:string; required:boolean;
  sourceCapability:string; sourceField?:string;
  constraints?:Record<string,unknown>; value?:unknown;
}

export interface RuntimeContext {
  applicationId:string; sessionId:string; userId?:string;
  locale?:string; timezone?:string; metadata?:Record<string,unknown>;
}

export interface TaskContext {
  taskId:string; parentTaskId?:string; request:string;
  intent?:string; requirements:Requirement[]; artifacts:Artifact[];
  contextId?:string;
}

export interface KnowledgeContext {
  sources:string[]; retrieved:unknown[];
}

export interface AgentContext {
  runtime:RuntimeContext; task:TaskContext;
  capabilities:CapabilityDescriptor[]; knowledge?:KnowledgeContext;
}

export interface Artifact {
  id:string; type:string; value:unknown; producer:string;
  taskId:string; provenance?:Record<string,unknown>;
}

export interface SemanticRequest {
  id:string; contextId:string; input:string; intent?:string;
  requirements?:Requirement[]; metadata?:Record<string,unknown>;
}

export interface TaskNode {
  id:string; capabilityId:string; dependsOn:string[];
  input?:unknown; status:TaskStatus;
}

export interface TaskGraph {
  id:string; requestId:string; nodes:TaskNode[];
}

export interface Task {
  id:string; status:TaskStatus; request:string;
  context:TaskContext; result?:unknown; error?:string;
}

export interface SemanticPlan {
  intent?:string;
  nodes:Omit<TaskNode,'status'>[];
  requirements?:Requirement[];
}
