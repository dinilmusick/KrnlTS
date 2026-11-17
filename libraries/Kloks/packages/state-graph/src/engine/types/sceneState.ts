// ═══════════════════════════════════════════════════════════════════
// SCENE STATE, BIOMES & GRAPH INTERACTION TYPES
// ═══════════════════════════════════════════════════════════════════
import { SpaceNode } from "./nodesPrimitives";
import { NodeConnection, UniversalSocketDefinition } from "./signals";
import { ModuleSocketMapping } from "./nodesRouting";
import { DawProject } from "./sceneData";

export interface ModulePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  color: string;
  author?: string;
  createdAt: number;
  innerNodes: SpaceNode[];
  innerConnections: NodeConnection[];
  exposedInputs: ModuleSocketMapping[];
  exposedOutputs: ModuleSocketMapping[];
}

export interface QwnsrProjectBundle {
  format: 'qwnsr_project';
  version: '1.0.0';
  appName: 'Qwnsr Control';
  exportedAt: number;
  project: DawProject;
  appearanceSettings?: AppearanceSettings;
}

export interface QwnsrModuleBundle {
  format: 'qwnsr_module';
  version: '1.0.0';
  appName: 'Qwnsr Control';
  exportedAt: number;
  preset: ModulePreset;
}


export interface MidiInputDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface AppSceneState {
  bpm: number;
  masterVolume: number;
  isGlobalPlaying: boolean;
  nodes: SpaceNode[];
  connections: NodeConnection[];
}

export type NodeCategoryKey =
  | 'container_midi'
  | 'container_audio'
  | 'container_curve'
  | 'trigger_beats'
  | 'trigger_beat_fractions'
  | 'effect_repeater'
  | 'effect_delay'
  | 'module'
  | 'control';

export interface NodeMeshSetting {
  meshUrl: string; // 'default_pbr' or filename/url e.g. '/assets/3d_meshes/stellar_crystal.obj'
  meshName?: string;
  scale: number; // 0.2 to 3.0, default 1.0
  rotationSpeed: number; // 0.0 to 5.0, default 1.0
  wireframe: boolean;
  emissiveIntensity: number; // 0.0 to 3.0
  ringOrbit: boolean;
  colorOverride?: string;
}

export interface MeshAssetItem {
  filename: string;
  format: string;
  url: string;
  size: number;
  label: string;
  isBuiltin?: boolean;
}

export interface AppearanceSettings {
  categoryMeshes: Record<NodeCategoryKey, NodeMeshSetting>;
  nodeOverrides?: Record<string, Partial<NodeMeshSetting>>;
  particleDensity: number;
  bloomIntensity: number;
  themePreset: 'black_and_gold' | 'deep_space_blue' | 'cyber_neon' | 'coffee_theme';
}

export type BiomeType = 'verdant_forest' | 'volcanic_citadel' | 'arcane_valley' | 'autumn_highlands' | 'default';

export interface INodeVisuals {
  triggerNodeFlash: (nodeId: string) => void;
  triggerVisualFeedback?: (nodeId: string) => void;
  spawnLaserPulse?: (sourcePosition: [number, number, number], destPosition: [number, number, number], color?: any, connId?: string) => void;
  triggerPulseForNodeConnections?: (nodeId: string, payload: any) => void;
}

export interface CanvasInteractionManager {
  focusOnPosition: (pos: [number, number, number]) => void;
  resetView: () => void;
  panBy?: (dirX: number, dirZ: number, speed?: number) => void;
}
