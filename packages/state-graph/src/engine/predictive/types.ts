import { SpaceNode, UniversalSocketDefinition } from '../types/legacyTypes.js';
import { CompatibleNodeCategory, NodeSpawnPayload } from '../core/nodeArchetypeRegistry.js';

export interface PredictiveGhostNode {
  id: string;
  parentNodeId: string;
  parentSocketId: string;
  parentSocketPolarity: 'input' | 'output';
  parentSocketSignalType: string;
  parentSocketLabel: string;

  archetypeId: string;
  category: CompatibleNodeCategory;
  label: string;
  description: string;
  iconName: string;
  colorHex: string;
  badge: string;
  matchingSocketId: string;
  matchingSocketIndex?: number;
  spawnType: NodeSpawnPayload;

  worldPosition: [number, number, number];
  slotIndex: number;
  candidateIndex: number;
  totalCandidates: number;
  prototypeNode: SpaceNode;
}

export interface PredictiveTrace {
  id: string;
  ghostNodeId: string;
  sourceNodeId: string;
  sourceHandleId: string;
  targetNodeId: string;
  targetHandleId: string;
  wireType: string;
  isFromGhostToParent: boolean;
  color: string;
}

export interface PredictiveSelectionResult {
  ghostNodes: PredictiveGhostNode[];
  traces: PredictiveTrace[];
  selectedNodesWithGhosts: Map<string, PredictiveGhostNode[]>;
}
