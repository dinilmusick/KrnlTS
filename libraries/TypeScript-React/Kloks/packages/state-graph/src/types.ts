import type { BaseHandle, HandleDirection } from './domain/BaseHandle.js';

export type SocketType = 'input' | 'output';

export interface Socket {
  id: string;
  label: string;
  type: SocketType;
  dataType?: string;
  direction?: HandleDirection;
  offset?: { x: number; y: number };
  basePosition?: { x: number; y: number };
  connectionMode?: 'SINGLE' | 'MULTI';
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  data?: Record<string, unknown>;
  inputs?: Socket[];
  outputs?: Socket[];
  width?: number;
  height?: number;
  positionLocked?: boolean;
  minimized?: boolean;
  handles?: BaseHandle[];
}

export interface GraphEdge {
  id: string;
  source: string;
  sourceSocket: string;
  target: string;
  targetSocket: string;
  label?: string;
  color?: string;
  wireType?: string;
  locked?: boolean;
  deletable?: boolean;
}

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface NodeGraphConfig {
  minZoom?: number;      // default 0.25
  maxZoom?: number;      // default 2.5
  gridSize?: number;     // default 20
  snapToGrid?: boolean;  // default false
  wireStyle?: 'bezier' | 'straight' | 'step';
  tracingEnabled?: boolean;        // default true: magnetic proximity traces
  magneticTracesEnabled?: boolean;// default true: alias for tracingEnabled
  autoSolidify?: boolean;         // default false: auto-lock candidate on proximity drop
  traceCutoffDistance?: number;   // default 220
  ghostRoutingEnabled?: boolean;  // default true: predictive completion ghost nodes
  ghostScenarioCount?: number;    // default 3
  ghostDecayMs?: number;          // default 250
}

export interface NodeGraphPlugin {
  registerNodeDefinition?: (def: unknown) => void;
  registerHandleType?: (type: string) => void;
  registerWireType?: (wire: unknown) => void;
  registerCompatibilityRule?: (rule: unknown) => void;
  registerViewType?: (view: unknown) => void;
  registerTheme?: (theme: unknown) => void;
  registerContextMenuAction?: (action: unknown) => void;
  registerSpawnMenuItem?: (item: unknown) => void;
}
