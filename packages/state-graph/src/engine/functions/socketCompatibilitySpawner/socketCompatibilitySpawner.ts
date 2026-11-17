// ════ SOCKETCOMPATIBILITYSPAWNER IMPLEMENTATION ════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  SpaceNode,
  UniversalSocketDefinition,
  SignalType,
} from "../../types/index.js";
import { getNodeSockets } from '../../core/nodeSocketRegistry';
import { areSignalsCompatible } from '../universalConnectionEngine';
import {
  getAllNodeArchetypes,
} from '../../core/nodeArchetypeRegistry';
import { resolveSocketDetails } from './helpers';
import { CompatibleSpawnOption } from './types';

/**
 * 100% Algorithmic Suggestion Engine:
 * Analyzes the dragged socket definition (direction, medium, dataType, polarity)
 * and dynamically evaluates all candidate node archetypes using the universal signal compatibility engine.
 */
export function getCompatibleNodesForSocket(
  sourceNode: SpaceNode,
  direction: 'in' | 'out',
  portId?: string,
  socketIndex?: number,
  signalType?: SignalType
): {
  socketTitle: string;
  signalName: string;
  signalColor: string;
  options: CompatibleSpawnOption[];
} {
  const details = resolveSocketDetails(sourceNode, direction, portId, socketIndex, signalType);
  const resolvedSig = signalType || details.signalType || 'trigger';
  const isAudioMono = resolvedSig === 'audio_mono';
  const isAudio = resolvedSig.includes('audio');
  const isMidi = resolvedSig.includes('midi');
  const isCurve = resolvedSig.includes('curve');

  const sourceSocket: UniversalSocketDefinition = details.socketDef || {
    socketId: portId || 'socket_fallback',
    label: details.portLabel || (direction === 'in' ? 'In' : 'Out'),
    polarity: direction === 'out' ? 'output' : 'input',
    medium: (isAudio ? (isAudioMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi' : isCurve ? 'curve' : 'trigger') as any,
    dataType: resolvedSig.includes('packet') ? 'packet' : resolvedSig === 'trigger' ? 'pulse' : 'stream',
    signalType: resolvedSig,
    connectivity: direction === 'out' ? 'multi' : 'single',
    socketIndex: socketIndex ?? 0,
    description: details.socketTitle,
    colorHex: details.signalColor ? parseInt(details.signalColor.replace('#', '0x')) : 0xf59e0b,
    colorStr: details.signalColor || '#f59e0b',
    bgStr: '#212c47',
    iconName: 'zap',
    isCustom: false,
  };

  const options: CompatibleSpawnOption[] = [];

  // Query all dynamically registered archetypes
  const archetypes = getAllNodeArchetypes();

  for (const archetype of archetypes) {
    const prototypeNode = archetype.createPrototype();
    const candidateSockets = getNodeSockets(prototypeNode);

    if (direction === 'in') {
      // User dragged from an INPUT socket on sourceNode.
      // Candidate must provide a compatible OUTPUT socket to feed into this input!
      for (const candidateOut of candidateSockets.outputs) {
        const comp = areSignalsCompatible(candidateOut, sourceSocket);
        if (comp.isCompatible) {
          options.push({
            id: `${archetype.id}:${candidateOut.socketId}`,
            category: archetype.category,
            label: archetype.label,
            description: candidateOut.description || archetype.defaultDescription,
            iconName: candidateOut.iconName || archetype.iconName,
            colorHex: candidateOut.colorStr,
            badge: `${candidateOut.label} ➔ ${sourceSocket.label}`,
            matchingSocketId: candidateOut.socketId,
            matchingSocketIndex: candidateOut.socketIndex,
            spawnType: archetype.spawnType,
          });
          // Match the first compatible output port per archetype
          break;
        }
      }
    } else {
      // User dragged from an OUTPUT socket on sourceNode.
      // Candidate must provide a compatible INPUT socket to receive this output!
      for (const candidateIn of candidateSockets.inputs) {
        const comp = areSignalsCompatible(sourceSocket, candidateIn);
        if (comp.isCompatible) {
          options.push({
            id: `${archetype.id}:${candidateIn.socketId}`,
            category: archetype.category,
            label: archetype.label,
            description: candidateIn.description || archetype.defaultDescription,
            iconName: candidateIn.iconName || archetype.iconName,
            colorHex: candidateIn.colorStr,
            badge: `${sourceSocket.label} ➔ ${candidateIn.label}`,
            matchingSocketId: candidateIn.socketId,
            matchingSocketIndex: candidateIn.socketIndex,
            spawnType: archetype.spawnType,
          });
          // Match the first compatible input port per archetype
          break;
        }
      }
    }
  }

  return {
    socketTitle: details.socketTitle,
    signalName: details.signalName,
    signalColor: details.signalColor,
    options,
  };
}
