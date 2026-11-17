// ════ SOCKETCOMPATIBILITYSPAWNER EXTRACTED HELPERS ════════════════════════════════
import {
  SpaceNode,
  UniversalSocketDefinition,
  SignalType,
} from "../../types/index.js";
import { getNodeSockets } from '../../core/nodeSocketRegistry';
import { CANONICAL_SIGNAL_TYPES } from '../canonicalSignalTable';
import { ResolvedSocketDetails } from './types';

export function resolveSocketDetails(
  sourceNode: SpaceNode,
  direction: 'in' | 'out',
  portId?: string,
  socketIndex?: number,
  explicitSignalType?: SignalType
): ResolvedSocketDetails {
  const { inputs, outputs } = getNodeSockets(sourceNode);
  const socketList = direction === 'in' ? inputs : outputs;

  let targetSocket: UniversalSocketDefinition | undefined;
  if (portId) {
    targetSocket = socketList.find((s) => s.socketId === portId);
  }
  if (!targetSocket && socketIndex !== undefined && socketIndex >= 0 && socketIndex < socketList.length) {
    targetSocket = socketList[socketIndex];
  }
  if (!targetSocket && socketList.length > 0) {
    targetSocket = socketList[0];
  }

  if (targetSocket) {
    const socketTitle =
      direction === 'in'
        ? `Feed into [${targetSocket.label}] on ${sourceNode.name}`
        : `Route [${targetSocket.label}] from ${sourceNode.name}`;

    const dataFormatLabel =
      targetSocket.dataType === 'packet'
        ? 'PACKET'
        : targetSocket.dataType === 'pulse'
        ? 'PULSE'
        : 'STREAM';

    const mediumLabel = targetSocket.medium.toUpperCase().replace('_', ' ');

    return {
      socketDef: targetSocket,
      signalType: targetSocket.signalType,
      portLabel: targetSocket.label,
      socketTitle,
      signalName: `${mediumLabel} (${dataFormatLabel})`,
      signalColor: targetSocket.colorStr,
    };
  }

  // Fallback if node has no declared sockets
  const fallbackSig = explicitSignalType || 'trigger';
  const def = CANONICAL_SIGNAL_TYPES[fallbackSig] || CANONICAL_SIGNAL_TYPES.trigger;
  return {
    signalType: fallbackSig,
    portLabel: direction === 'in' ? 'In' : 'Out',
    socketTitle: `${sourceNode.name} (${direction.toUpperCase()})`,
    signalName: (def.name || fallbackSig).toUpperCase(),
    signalColor: def.colorStr || '#f59e0b',
  };
}
