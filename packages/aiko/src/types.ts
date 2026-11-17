export type AikoSourceKind='endpoint'|'fod-flow'|'gutts-api'|'custom';

export interface AikoIntelligenceSpec { [key:string]: unknown; }

export interface AikoTool {
  id:string;
  name:string;
  description?:string;
  inputSchema?:unknown;
  execute:(input:unknown)=>Promise<unknown>;
  sourceKind:AikoSourceKind;
  sourceId:string;
}

export interface AikoAgentDefinition {
  schemaVersion:'1.0.0';
  id:string;
  name:string;
  description:string;
  agentType:'TOOL'|'ENDPOINT'|'AIKO';
  tool:AikoTool;
  intelligenceSpec:AikoIntelligenceSpec;
  intelligenceSpecId?:string;
  sourceKind:AikoSourceKind;
  sourceId:string;
  allowedToolIds?:string[];
  custom?:boolean;
}

export interface AikoCapability {
  id:string;
  name:string;
  description?:string;
  sourceKind:AikoSourceKind;
  sourceId:string;
  inputSchema?:unknown;
  execute:(input:unknown)=>Promise<unknown>;
}

export interface AikoKey {
  id:string;
  providerId:string;
  label:string;
  status?:string;
  isActive?:boolean;
  emailGroup?:string;
  expiresAt?:string|null;
}

export interface AikoIntelligenceResolver {
  resolve(specId?:string, context?:{agent?:AikoAgentDefinition;tool?:AikoTool}):Promise<{spec:AikoIntelligenceSpec;specId?:string}>|{spec:AikoIntelligenceSpec;specId?:string};
}

export interface AikoKeyRuntime {
  listKeys():Promise<AikoKey[]>;
  getActiveKey(providerId:string):Promise<AikoKey|null>;
  rotateKey(providerId:string):Promise<AikoKey|null>;
  addKey?(input:{providerId:string;label:string;key:string;emailGroup?:string}):Promise<AikoKey>;
  syncFromAikoEngine():Promise<{synced:number;message?:string}>;
}

export interface AikoRuntimeOptions {
  customAgents?: AikoAgentDefinition[];
  capabilities:(()=>Promise<AikoCapability[]>|AikoCapability[])|AikoCapability[];
  resolver:AikoIntelligenceResolver;
  resolveNaturalLanguage?: (agent:AikoAgentDefinition,input:string)=>Promise<unknown>;
  keys:AikoKeyRuntime;
}
