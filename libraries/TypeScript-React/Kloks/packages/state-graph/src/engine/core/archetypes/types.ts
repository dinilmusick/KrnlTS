import {
  SpaceNode,
  ContainerType,
  TriggerType,
  SignalKind,
  EffectType,
} from "../../types/index.js";
import {
  createContainerNode,
  createRecorderNode,
  createPlayerNode,
  createSamplerNode,
  createAudioPadsNode,
  createTriggerNode,
  createCombinerNode,
  createMultiplexerNode,
  createConverterNode,
  createModuleNode,
  createEffectNode,
  createControlNode,
  createStringNode,
  createNumberNode,
  createBooleanNode,
  createObjectNode,
  createFolderPathNode,
} from '../../functions/nodeFactory';

export type CompatibleNodeCategory =
  | 'Containers'
  | 'Recorders & Players'
  | 'Instruments'
  | 'Audio Effects'
  | 'Inputs / Outputs'
  | 'Routing'
  | 'Controls'
  | 'Modules'
  | 'Triggers'
  | 'Data & Parameters';

export type NodeSpawnPayload =
  | { kind: 'container'; containerType: ContainerType; audioFormat?: 'mono' | 'stereo' }
  | { kind: 'recorder'; recorderType: 'audio_stereo' | 'audio_mono' | 'midi' | 'curve'; recordingMode?: 'standard' | 'retrospective' }
  | { kind: 'player'; playerType: 'audio_stereo' | 'audio_mono' | 'midi' | 'curve' }
  | { kind: 'sampler' }
  | { kind: 'audio_pads' }
  | { kind: 'trigger'; triggerType: TriggerType }
  | { kind: 'combiner'; signalType?: SignalKind }
  | { kind: 'multiplexer'; signalType?: SignalKind }
  | { kind: 'converter'; converterType: 'stereo_to_mono' | 'mono_to_stereo' }
  | { kind: 'effect'; effectType: EffectType }
  | { kind: 'module' }
  | { kind: 'control' }
  | { kind: 'primitive_string'; initialValue?: string }
  | { kind: 'primitive_number'; initialValue?: number }
  | { kind: 'primitive_boolean'; initialValue?: boolean }
  | { kind: 'primitive_object'; initialValue?: Record<string, any> }
  | { kind: 'folder_path'; scope?: any };

export interface NodeArchetypeDefinition {
  id: string;
  category: CompatibleNodeCategory;
  label: string;
  defaultDescription: string;
  iconName: string;
  spawnType: NodeSpawnPayload;
  createPrototype: () => SpaceNode;
}

/**
 * Master Registry of all Node Archetypes.
 * Completely algorithmic and extensible for plugins, sub-graphs, and custom nodes.
 */