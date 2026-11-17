// ═══════════════════════════════════════════════════════════════════
// ROUTING, MULTIPLEXER & MODULE NODES
// ═══════════════════════════════════════════════════════════════════
import { SignalKind, UniversalSocketDefinition, NodeConnection, SignalType } from "./signals";
import { SpaceNode } from "./nodesPrimitives";

export interface ConverterNode {
  id: string;
  type: 'converter';
  converterType: 'stereo_to_mono' | 'mono_to_stereo';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  mode?: 'sum' | 'left' | 'right'; // For stereo_to_mono: 'sum' (L+R), 'left', 'right'
  gain?: number; // 0.0 to 2.0 amplitude scaling
}

export interface CombinerNode {
  id: string;
  type: 'combiner';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  signalType: SignalKind;
  inputCount: number; // Settable number of input sockets (2 to 8)
  combineMode: 'sum' | 'merge' | 'or' | 'average' | 'max';
  gain?: number;
}

export interface MultiplexerNode {
  id: string;
  type: 'multiplexer';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  signalType: SignalKind;
  outputCount: number; // Settable number of output sockets (2 to 8)
  distributionMode: 'broadcast' | 'round_robin' | 'channel_select';
  activeChannel?: number;
  gain?: number;
}

export interface ModuleSocketMapping {
  id: string; // unique mapping ID
  direction: 'input' | 'output';
  innerNodeId: string;
  innerPortId?: string; // port on inner node (e.g. 'capture', 'record', 'play_stop', or specific socket)
  innerSocketIndex?: number;
  label: string; // user-visible label for the exposed module socket, e.g. "Clock In", "Audio L/R", "Mod CV", "MIDI Ch 1"
  signalType: SignalType;
  moduleSocketIndex: number; // 0, 1, 2... index on the module's outer shell
}

export interface ModuleNode {
  id: string;
  type: 'module';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  description?: string;
  category?: string;
  // Nested Sub-Graph Flow
  innerNodes: SpaceNode[];
  innerConnections: NodeConnection[];
  // Dynamic Sockets Exposed to Outer Graph
  exposedInputs: ModuleSocketMapping[];
  exposedOutputs: ModuleSocketMapping[];
  isPlaying?: boolean;
}
