import { SpaceNode } from '../types/legacyTypes';
import { projectNodeToGroundSurface } from './spawningMechanism';
import {
  createContainerNode,
  createTriggerNode,
  createEffectNode,
  createCombinerNode,
  createMultiplexerNode,
  createModuleNode,
  createConverterNode,
  createRecorderNode,
  createPlayerNode,
  createSamplerNode,
  createAudioPadsNode,
  createControlNode,
  createButtonNode,
  createArrangementNode,
  createCodeNode,
  createStringNode,
  createNumberNode,
  createBooleanNode,
  createObjectNode,
  createFolderPathNode,
} from './nodeFactory';

export function createNodeFromSpawnType(
  spawnType: any,
  nodeIndex: number,
  bpm: number,
  worldPos: [number, number, number]
): SpaceNode | null {
  switch (spawnType.kind) {
    case 'arrangement':
      return projectNodeToGroundSurface(createArrangementNode(nodeIndex, worldPos));
    case 'container':
      return projectNodeToGroundSurface(
        createContainerNode(spawnType.containerType, nodeIndex, bpm, worldPos, spawnType.audioFormat)
      );
    case 'recorder':
      return projectNodeToGroundSurface(
        createRecorderNode(
          spawnType.recorderType || 'audio_stereo',
          nodeIndex,
          worldPos,
          spawnType.recordingMode || 'standard'
        )
      );
    case 'player':
      return projectNodeToGroundSurface(
        createPlayerNode(spawnType.playerType || 'audio_stereo', nodeIndex, worldPos)
      );
    case 'sampler':
      return projectNodeToGroundSurface(createSamplerNode(nodeIndex, worldPos));
    case 'audio_pads':
      return projectNodeToGroundSurface(createAudioPadsNode(nodeIndex, worldPos));
    case 'trigger': {
      const trig = createTriggerNode(nodeIndex, worldPos);
      trig.triggerType = spawnType.triggerType;
      return projectNodeToGroundSurface(trig);
    }
    case 'button':
      return projectNodeToGroundSurface(createButtonNode(nodeIndex, worldPos));
    case 'code':
      return projectNodeToGroundSurface(createCodeNode(nodeIndex, worldPos));
    case 'primitive_string':
    case 'string':
      return projectNodeToGroundSurface(createStringNode(nodeIndex, worldPos, spawnType.initialValue));
    case 'primitive_number':
    case 'number':
      return projectNodeToGroundSurface(createNumberNode(nodeIndex, worldPos, spawnType.initialValue));
    case 'primitive_boolean':
    case 'boolean':
      return projectNodeToGroundSurface(createBooleanNode(nodeIndex, worldPos, spawnType.initialValue));
    case 'primitive_object':
    case 'object':
      return projectNodeToGroundSurface(createObjectNode(nodeIndex, worldPos, spawnType.initialValue));
    case 'folder_path':
      return projectNodeToGroundSurface(createFolderPathNode(nodeIndex, worldPos, spawnType.scope));
    case 'effect':
      return projectNodeToGroundSurface(createEffectNode(spawnType.effectType, nodeIndex, worldPos));
    case 'combiner':
      return projectNodeToGroundSurface(createCombinerNode(nodeIndex, 3, worldPos, spawnType.signalType));
    case 'multiplexer':
      return projectNodeToGroundSurface(createMultiplexerNode(nodeIndex, 4, worldPos, spawnType.signalType));
    case 'module':
      return projectNodeToGroundSurface(createModuleNode(nodeIndex, 'Custom Flow Module', worldPos));
    case 'control':
      return projectNodeToGroundSurface(createControlNode(nodeIndex, worldPos));
    case 'converter':
      return projectNodeToGroundSurface(createConverterNode(spawnType.converterType, nodeIndex, worldPos));
    default:
      return null;
  }
}
