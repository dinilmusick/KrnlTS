// ═══════════════════════════════════════════════════════════════════
// PRIMITIVES & ROOT SPACE NODE
// ═══════════════════════════════════════════════════════════════════
import { AssetPoolScope } from "./audio";
import { UniversalSocketDefinition } from "./signals";
import {
  EffectNode,
  TriggerNode,
  ContainerNode,
} from "./nodesAudio";
import {
  RecorderNode,
  PlayerNode,
  SamplerNode,
  AudioPadsNode,
} from "./nodesPlayback";
import {
  ConverterNode,
  CombinerNode,
  MultiplexerNode,
  ModuleNode,
} from "./nodesRouting";
import {
  ControlNode,
  InputStripNode,
  OutputStripNode,
  ButtonNode,
} from "./nodesControl";
import { ArrangementNode } from "./nodesArrangement";

export interface CodeNode {
  id: string;
  type: 'code';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  code: string; // Standard JavaScript code payload
  width: number; // Resizable width (default 380)
  height: number; // Resizable height (default 260)
  executionMode?: 'enrich' | 'eval_and_enrich' | 'on_pulse';
  lastErrorMessage?: string | null;
  lastExecutionOutput?: any;
  totalPulsesProcessed?: number;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface StringNode {
  id: string;
  type: 'primitive_string';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value?: string;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface NumberNode {
  id: string;
  type: 'primitive_number';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface BooleanNode {
  id: string;
  type: 'primitive_boolean';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value: boolean;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface ObjectNode {
  id: string;
  type: 'primitive_object';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value?: Record<string, any>;
  rawJson?: string;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface FolderPathNode {
  id: string;
  type: 'folder_path';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  scope: AssetPoolScope;
  selectedFolder?: string;
  folders?: string[];
  foldersData?: Array<{
    name: string;
    dataType?: string;
    channelType?: string;
    fileCount?: number;
    path: string;
  }>;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export type SpaceNode = (
  | TriggerNode
  | ContainerNode
  | EffectNode
  | CombinerNode
  | MultiplexerNode
  | ModuleNode
  | ConverterNode
  | RecorderNode
  | PlayerNode
  | SamplerNode
  | AudioPadsNode
  | ControlNode
  | InputStripNode
  | OutputStripNode
  | ButtonNode
  | ArrangementNode
  | CodeNode
  | StringNode
  | NumberNode
  | BooleanNode
  | ObjectNode
  | FolderPathNode
) & {
  socketOffsets?: Record<string, { x: number; y: number }>;
};
