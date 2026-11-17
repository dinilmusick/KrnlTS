export interface Position {
  x: number;
  y: number;
}

export interface NodeJSON {
  id: string;
  type: string;
  label?: string;
  position: Position;
  data: Record<string, any>;
}

export interface EdgeJSON {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  animated?: boolean;
}

export interface ViewportJSON {
  x: number;
  y: number;
  zoom: number;
}

import type { FodGraph } from "../../types.js";
export interface GraphJSON extends FodGraph {
  nodes: NodeJSON[];
  edges: EdgeJSON[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
  viewport?: ViewportJSON;
}

// === Phase 1: Core Concepts & Data Types ===

export enum DataType {
  // Primitive Types
  Number = "Number",
  Integer = "Integer",
  Float = "Float",
  Boolean = "Boolean",
  String = "String",
  Null = "Null",
  Undefined = "Undefined",

  // Collection Types
  Array = "Array",
  Object = "Object",
  Map = "Map",
  Set = "Set",

  // Structured Types
  JSON = "JSON",
  Binary = "Binary",
  File = "File",
  Date = "Date",
  Time = "Time",
  Duration = "Duration",
  Color = "Color",
  URL = "URL",

  // Runtime Types
  HTTPRequest = "HTTPRequest",
  HTTPResponse = "HTTPResponse",
  WebSocketConnection = "WebSocketConnection",
  Stream = "Stream",
  Error = "Error",
  Promise = "Promise",

  // Generic Types
  Any = "Any",
  Unknown = "Unknown"
}

// === Phase 1: Port Rules & Connections ===

export enum PortDirection {
  Input = "input",
  Output = "output"
}

export enum PortType {
  Execution = "execution",
  Data = "data",
  Event = "event"
}

export interface PortDefinition {
  id: string;
  name: string;
  direction: PortDirection;
  portType: PortType;
  dataType: DataType;
  required: boolean;
  multipleConnectionsAllowed: boolean;
  defaultValue?: any;
}

export interface ConnectionDefinition {
  sourceNode: string;
  sourcePort: string;
  destinationNode: string;
  destinationPort: string;
}

// === Phase 1: Variables ===

export enum VariableScope {
  Global = "global",
  Graph = "graph",
  Session = "session",
  Persistent = "persistent"
}

export interface VariableDefinition {
  id: string;
  name: string;
  type: DataType;
  scope: VariableScope;
  initialValue?: any;
  mutable: boolean;
  persistent: boolean;
}

// === Phase 1: Project File Format (Serialization Models) ===

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  createdDate: string;
  modifiedDate: string;
  engineVersion: string;
  tags?: string[];
  thumbnail?: string;
  license?: string;
}

export interface ProjectSettings {
  defaultTheme: string;
  gridSize: number;
  snapEnabled: boolean;
  autoSave: boolean;
  zoomLimits: {
    min: number;
    max: number;
  };
  executionPolicy: string;
  errorPolicy: string;
}

export interface GraphMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  tags?: string[];
}

export interface GroupDefinition {
  id: string;
  name: string;
  color: string;
  memberNodes: string[];
}

export interface CommentDefinition {
  id: string;
  position: Position;
  size: {
    width: number;
    height: number;
  };
  text: string;
  color: string;
}

export interface GraphDefinition {
  metadata: GraphMetadata;
  nodes: NodeJSON[];
  edges: EdgeJSON[];
  connections?: ConnectionDefinition[]; // Optional detailed format
  groups?: GroupDefinition[];
  comments?: CommentDefinition[];
  viewport?: ViewportJSON;
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: "image" | "icon" | "gif" | "video" | "audio" | "document";
  refId: string;
}

export interface ProjectThemeReference {
  themeId: string;
  version: string;
}

export interface ProjectPluginReference {
  pluginId: string;
  version: string;
}

export interface ExecutionSettings {
  defaultTimeout: number;
  parallelExecutionEnabled: boolean;
  retryPolicy: any;
  loggingLevel: "info" | "success" | "warn" | "error" | "ai";
}

export interface ProjectJSON {
  version: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  variables: VariableDefinition[];
  graphs: GraphDefinition[];
  assets: ProjectAsset[];
  themes: ProjectThemeReference[];
  plugins: ProjectPluginReference[];
  executionSettings: ExecutionSettings;
}

// === Phase 2: Error Handling & Execution Context Types ===

export enum ErrorCategory {
  Validation = "Validation",
  Runtime = "Runtime",
  Network = "Network",
  FileSystem = "FileSystem",
  Database = "Database",
  AI = "AI",
  InternalEngine = "InternalEngine",
  UserExecutor = "UserExecutor"
}

export enum Severity {
  Info = "Info",
  Warning = "Warning",
  Error = "Error",
  Fatal = "Fatal"
}

export interface WorkflowError {
  id: string;
  code: string;
  category: ErrorCategory;
  severity: Severity;
  nodeId?: string;
  graphId?: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
  stack?: string;
  technicalMessage?: string;
  userMessage?: string;
}


