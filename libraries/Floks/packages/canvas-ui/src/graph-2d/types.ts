import { SpaceNode, NodeConnection, UniversalSocketDefinition } from '@floks/contracts';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface ConnectingWireState {
  sourceNodeId: string;
  direction: 'out' | 'in';
  portId: string;
  socketIndex?: number;
  signalType: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface Canvas2DViewerProps {
  nodes: SpaceNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
  selectedConnectionId?: string | null;
  currentBiome?: string;
  isPlaying?: boolean;
  bpm?: number;
  onSelectNode: (nodeId: string | null, skipFocus?: boolean) => void;
  onSelectConnection?: (connId: string | null) => void;
  onMoveNode: (nodeId: string, position: [number, number, number]) => void;
  onConnectRequest: (
    fromNodeId: string,
    toNodeId: string,
    fromPort?: string,
    toPort?: string,
    fromSocketIndex?: number,
    toSocketIndex?: number
  ) => void;
  onInspectNode?: ((node: SpaceNode) => void) | ((nodeId: string) => void);
  onManualTriggerNode?: ((node: SpaceNode) => void) | ((nodeId: string) => void);
  onMapRightClick?: (screenX: number, screenY: number, worldPosition: [number, number, number], targetNodeId?: string | null, targetSocket?: any) => void;
  onWireReleaseEmptySpace?: (
    screenX: number,
    screenY: number,
    worldPos: [number, number, number],
    pendingWire: any
  ) => void;
  onSolidifyPredictiveNodes?: (ghosts: any[]) => void;
  [key: string]: any;
}

export const COORD_SCALE = 40.0;

export const BIOME_CONFIGS: Record<string, { bg: string; gridColor: string; aoeColor: string }> = {
  zenith: { bg: '#030712', gridColor: 'rgba(56, 189, 248, 0.08)', aoeColor: 'rgba(56, 189, 248, 0.05)' },
  nadir: { bg: '#0a0503', gridColor: 'rgba(251, 146, 60, 0.08)', aoeColor: 'rgba(251, 146, 60, 0.05)' },
  abyss: { bg: '#020617', gridColor: 'rgba(99, 102, 241, 0.08)', aoeColor: 'rgba(99, 102, 241, 0.05)' },
  default: { bg: '#050508', gridColor: 'rgba(255, 255, 255, 0.06)', aoeColor: 'rgba(255, 255, 255, 0.04)' },
};
