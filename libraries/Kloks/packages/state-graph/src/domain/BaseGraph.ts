import type { BaseNode, NodePosition, NodeSize } from './BaseNode.js';
import type { BaseConnection } from './BaseConnection.js';
import type { BaseViewWindow } from './BaseViewWindow.js';

export interface GraphSettings {
  tracingEnabled: boolean;
  autoSolidify: boolean;
  traceCutoffDistance: number;
  attractionEnabled: boolean;
  attractionSpeed: number;
  attractionStrength: number;
}

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  tracingEnabled: true,
  autoSolidify: false,
  traceCutoffDistance: 250,
  attractionEnabled: false,
  attractionSpeed: 1.0,
  attractionStrength: 1.0
};

export interface Group {
  id: string;
  name?: string;
  nodeIds: string[];
  childGroups: string[];
  settingsOverrides: Partial<GraphSettings>;
  position: NodePosition;
  size: NodeSize;
}

export interface Landmark {
  id: string;
  number: number;
  name: string;
  cameraPosition: { x: number; y: number };
  zoom: number;
}

export interface GraphView {
  id: string;
  name: string;
  nodePositions: Record<string, NodePosition>;
  nodeSizes: Record<string, NodeSize>;
  handleOffsets: Record<string, { x: number; y: number }>;
  groupStates: Record<string, unknown>;
  viewWindows: unknown[];
  camera: { x: number; y: number };
  zoom: number;
  selectedNodes: string[];
  graphSettingsOverrides: Partial<GraphSettings>;
}

export abstract class BaseGraph {
  public id: string;
  public type: string;
  public nodes: BaseNode[];
  public connections: BaseConnection[];
  public groups: Group[];
  public viewWindows: BaseViewWindow[];
  public landmarks: Landmark[];
  public views: GraphView[];
  public settings: GraphSettings;
  public theme: string;

  constructor(id: string, type: string = 'default') {
    this.id = id;
    this.type = type;
    this.nodes = [];
    this.connections = [];
    this.groups = [];
    this.viewWindows = [];
    this.landmarks = [];
    this.views = [];
    this.settings = { ...DEFAULT_GRAPH_SETTINGS };
    this.theme = 'default';
  }
}

export class CustomGraph extends BaseGraph {
  public customGraphDefinition?: Record<string, unknown>;
}
