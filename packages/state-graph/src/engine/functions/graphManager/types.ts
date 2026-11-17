import { SpaceNode, NodeConnection } from "../../types/index.js";
import { SignalType } from "../canonicalSignalTable.js";

export interface GraphIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  sourceId?: string;
  targetId?: string;
  connectionId?: string;
}

export interface GraphValidationResult {
  isValid: boolean;
  issues: GraphIssue[];
  activeWiresCount: number;
  activeEffectsCount: number;
  affectedWiresCount: number;
}

export interface WireSpatialIntersection {
  connection: NodeConnection;
  fromNode: SpaceNode;
  toNode: SpaceNode;
  wireSignalType: SignalType;
  distanceToSphere: number;
  isSignalCompatible: boolean;
}
