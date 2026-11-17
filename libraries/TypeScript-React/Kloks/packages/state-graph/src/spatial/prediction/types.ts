import type { Socket } from '../../types.js';

export interface GhostSocketMapping {
  sourceSocketId: string;
  targetSocketId: string;
  wireType: string;
}

export interface GhostCandidate {
  id: string;
  nodeType: string;
  label: string;
  scenarioIndex: number;
  score: number;
  sourceNodeId: string;
  socketMappings: GhostSocketMapping[];
  relativeOffset: { x: number; y: number };
}

export interface GhostNodeRecord {
  id: string;
  nodeType: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  scenarioIndex: number;
  sourceNodeId: string;
  socketMappings: GhostSocketMapping[];
  inputs?: Socket[];
  outputs?: Socket[];
}

export interface GhostTraceRecord {
  id: string;
  sourceNodeId: string;
  sourceSocketId: string;
  targetGhostNodeId: string;
  targetSocketId: string;
  wireType: string;
  pathD: string;
  scenarioIndex: number;
}

export interface GhostInferenceOptions {
  scenarioCount?: number;
  maxSuggestionsPerNode?: number;
  customScorer?: (sourceType: string, candidateType: string) => number;
}
