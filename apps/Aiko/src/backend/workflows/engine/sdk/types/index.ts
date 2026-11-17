import { ExecutionContext } from "../../executor/context.js";
import { DataType } from "../../types/graph.js";

export enum SDKPortType {
  Execution = "execution",
  Data = "data",
  Event = "event"
}

export enum SDKParameterType {
  Integer = "Integer",
  Float = "Float",
  Boolean = "Boolean",
  String = "String",
  Enum = "Enum",
  Color = "Color",
  File = "File",
  Folder = "Folder",
  JSON = "JSON",
  Array = "Array",
  Object = "Object"
}

export interface SDKPortDefinition {
  name: string;
  type: DataType | string;
  portType: SDKPortType;
  required: boolean;
  dynamic?: boolean;
  description?: string;
  defaultValue?: any;
}

export interface SDKParameterDefinition {
  name: string;
  type: SDKParameterType;
  defaultValue?: any;
  validation?: (value: any) => string | null;
  description?: string;
  options?: string[]; // For Enum type
}

export interface SDKNodeMetadata {
  name: string;
  displayName: string;
  category: string;
  version: string; // "major.minor.patch"
  description: string;
  icon?: string;
  keywords?: string[];
  tags?: string[];
}

export interface SDKExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  warnings?: string[];
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  category: string;
  version: string;
  metadata: SDKNodeMetadata;
  inputs: Record<string, SDKPortDefinition>;
  outputs: Record<string, SDKPortDefinition>;
  parameters?: Record<string, SDKParameterDefinition>;
  
  execute(context: ExecutionContext): Promise<SDKExecutionResult>;
  validate?(inputs: Record<string, any>): string[];
  migrate?(oldNode: any): any;
}
