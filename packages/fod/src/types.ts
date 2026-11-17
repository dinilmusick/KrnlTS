export type FodPortDirection = 'input' | 'output';
export type FodNodeCategory = 'host-app' | 'gutts' | 'flow' | 'system';

export interface FodPort {
  id:string;
  name:string;
  direction:FodPortDirection;
  dataType:string;
  required?:boolean;
  description?:string;
  schema?:Record<string,unknown>;
}

export interface FodNodeDefinition {
  type:string;
  label:string;
  description:string;
  category:FodNodeCategory;
  group:string;
  inputs:FodPort[];
  outputs:FodPort[];
  metadata?:Record<string,unknown>;
}

export interface FodEndpointDescriptor {
  id:string;
  serviceId:string;
  serviceName:string;
  operationId:string;
  operationName:string;
  description?:string;
  runtime?:string;
  deployment?:string;
  inputSchema?:Record<string,unknown>;
  outputSchema?:Record<string,unknown>;
  invoke:(input:unknown)=>Promise<unknown>;
}

export interface FodFlowNode {
  id:string;
  type:string;
  position:{x:number;y:number};
  data:Record<string,unknown>;
}

export interface FodFlowEdge {
  id:string;
  source:string;
  sourceHandle?:string;
  target:string;
  targetHandle?:string;
}

export interface FodFlow {
  id:string;
  name:string;
  description?:string;
  version:number;
  createdAt:string;
  updatedAt:string;
  nodes:FodFlowNode[];
  edges:FodFlowEdge[];
  viewport?:{x:number;y:number;zoom:number};
  metadata?:Record<string,unknown>;
}

export interface FodExecutionEvent {
  type:'flow-started'|'node-started'|'node-completed'|'node-failed'|'flow-completed';
  timestamp:number;
  flowId:string;
  nodeId?:string;
  data?:unknown;
}

export interface FodExecutionResult {
  success:boolean;
  flowId:string;
  output:unknown;
  outputs:Record<string,unknown>;
  errors:Array<{nodeId?:string;message:string}>;
  events:FodExecutionEvent[];
}

export interface FodRuntimeOptions {
  workspaceId:string;
  workspaceService:any;
  endpoints?:FodEndpointDescriptor[];
  nodes?:FodNodeDefinition[];
  onEvent?:(event:FodExecutionEvent)=>void;
}
