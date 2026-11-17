// ═══════════════════════════════════════════════════════════════════
// WORKSPACE & PROJECT DATA CONFIGS
// ═══════════════════════════════════════════════════════════════════
import { SpaceNode } from "./nodesPrimitives";
import { SignalType, NodeConnection } from "./signals";

export type MapChannelType = 'audio' | 'midi' | 'osc' | 'trigger';
export type MapChannelDirection = 'input' | 'output';

export interface MapChannelConfig {
  id: string;
  sourceId: string;
  name: string;
  type: MapChannelType;
  direction: MapChannelDirection;
  enabled: boolean;
  gain?: number; // 0.0 to 2.0 (for audio channels)
  isMuted?: boolean;
  color?: string;
  audioFormat?: 'mono' | 'stereo';
  signalType?: SignalType;
  ioLevel?: 'physical' | 'typed'; // 'physical' for top-level map external IO, 'typed' for nested map signal ports
  portType?: 'external_endpoint' | 'typed_port';
  metadata?: Record<string, any>;
}

export interface MapIoConfig {
  inputs: MapChannelConfig[];
  outputs: MapChannelConfig[];
  level?: 'physical' | 'typed';
}

export interface DawProject {
  id: string;
  name: string;
  description: string;
  folderPath: string;
  createdAt: number;
  updatedAt: number;
  sampleCount?: number;
  nodeCount?: number;
  bpm: number;
  masterVolume?: number;
  currentBiome?: string;
  nodes?: SpaceNode[];
  connections?: NodeConnection[];
  mapIoConfig?: MapIoConfig;
}

export interface CurvePoint {
  id: string;
  x: number; // beat position (0 to lengthInBeats)
  y: number; // normalized value (0.0 to 1.0)
  tension?: number; // bezier curvature (-1.0 to 1.0)
}

export type CurveModTarget = 'cutoff' | 'volume' | 'pan' | 'reverb' | 'pitch' | 'delay';

export interface CurveTrackData {
  id: string;
  name: string;
  lengthInBeats: number;
  points: CurvePoint[];
  targetParam: CurveModTarget;
  targetNodeId?: string; // specific node ID, or 'all'
  minValue: number;
  maxValue: number;
}
