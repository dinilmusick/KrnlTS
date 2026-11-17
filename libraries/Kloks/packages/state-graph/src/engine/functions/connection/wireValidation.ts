import { SpaceNode, NodeConnection, UniversalSocketDefinition, SignalType } from '../../types/legacyTypes';
import { getNodeSockets } from '../../core/nodeSocketRegistry.js';
import { areSignalsCompatible } from './signalCompatibility.js';

export interface UniversalConnectionValidationResult {
  isCompatible: boolean;
  sourceSocket?: UniversalSocketDefinition;
  targetSocket?: UniversalSocketDefinition;
  canonicalSignalType: SignalType;
  replacesConnectionId?: string;
  reason?: string;
}

export function validateUniversalConnection(
  fromNode: SpaceNode,
  fromSocketOrPort: string | UniversalSocketDefinition | undefined,
  toNode: SpaceNode,
  toSocketOrPort: string | UniversalSocketDefinition | undefined,
  existingConnections: NodeConnection[] = []
): UniversalConnectionValidationResult {
  if (fromNode.id === toNode.id) {
    return { isCompatible: false, canonicalSignalType: 'trigger', reason: 'Self-connections are forbidden.' };
  }

  const fromSockets = getNodeSockets(fromNode);
  const toSockets = getNodeSockets(toNode);

  const resolveSocket = (
    nodeSockets: { inputs: UniversalSocketDefinition[]; outputs: UniversalSocketDefinition[] },
    socketOrPort: string | UniversalSocketDefinition | undefined,
    defaultPolarity: 'output' | 'input'
  ): UniversalSocketDefinition | undefined => {
    if (typeof socketOrPort === 'object' && socketOrPort !== null) {
      return socketOrPort;
    }

    const primaryList = defaultPolarity === 'output' ? nodeSockets.outputs : nodeSockets.inputs;
    const secondaryList = defaultPolarity === 'output' ? nodeSockets.inputs : nodeSockets.outputs;

    if (typeof socketOrPort === 'string' && socketOrPort.trim() !== '') {
      const portStr = socketOrPort.trim();
      
      // 1. Direct socketId match in primary list
      let match = primaryList.find((s) => s.socketId === portStr);
      if (match) return match;

      // 2. Direct socketId match in secondary list
      match = secondaryList.find((s) => s.socketId === portStr);
      if (match) return match;

      // 3. Custom meta or legacy socket ID or label match
      match = primaryList.find((s) => s.customMeta?.legacySocketId === portStr || s.label === portStr);
      if (match) return match;
      match = secondaryList.find((s) => s.customMeta?.legacySocketId === portStr || s.label === portStr);
      if (match) return match;

      // 4. Try index extraction (e.g. "out_1" or "in_audio_stereo_1" or "1")
      const indexMatch = portStr.match(/\d+$/);
      if (indexMatch) {
        const idx = parseInt(indexMatch[0], 10);
        match = primaryList.find((s) => s.socketIndex === idx);
        if (match) return match;
        match = secondaryList.find((s) => s.socketIndex === idx);
        if (match) return match;
      }

      // If explicitly specified but not found on the node, return undefined (do NOT silently default to index 0)
      return undefined;
    }

    // If undefined/empty, default to first socket in primary list
    return primaryList[0];
  };

  let fromSocket = resolveSocket(fromSockets, fromSocketOrPort, 'output');
  let toSocket = resolveSocket(toSockets, toSocketOrPort, 'input');

  if (!fromSocket || !toSocket) {
    return {
      isCompatible: false,
      canonicalSignalType: 'trigger',
      reason: 'Could not resolve matching socket descriptors on the source or destination node.',
    };
  }

  let outSocket = fromSocket;
  let inSocket = toSocket;

  // Handle bi-directional wire dragging (dragging input handle to output handle)
  if (outSocket.polarity === 'input' && inSocket.polarity === 'output') {
    outSocket = toSocket;
    inSocket = fromSocket;
  }

  if (toNode.type === 'arrangement' && (inSocket.socketId === 'omni_packet_in' || inSocket.socketId === 'container_in' || inSocket.customMeta?.isArrangementIngest || inSocket.medium === 'omni')) {
    if (outSocket.dataType !== 'packet') {
      return {
        isCompatible: false,
        sourceSocket: outSocket,
        targetSocket: inSocket,
        canonicalSignalType: outSocket.signalType,
        reason: 'Arrangement Omni Packet handle requires a discrete Packet input (from a Container or Recorder).',
      };
    }
  }

  const sigResult = areSignalsCompatible(outSocket, inSocket);
  if (!sigResult.isCompatible) {
    return {
      isCompatible: false,
      sourceSocket: outSocket,
      targetSocket: inSocket,
      canonicalSignalType: sigResult.canonicalSignalType,
      reason: sigResult.reason,
    };
  }

  // Check if exact wire connection already exists
  const exactExists = existingConnections.find(
    (c) =>
      (c.fromNodeId === fromNode.id && c.toNodeId === toNode.id &&
        (c.fromSocketId === outSocket.socketId || c.fromPort === outSocket.socketId) &&
        (c.toSocketId === inSocket.socketId || c.toPort === inSocket.socketId)) ||
      (c.fromNodeId === toNode.id && c.toNodeId === fromNode.id &&
        (c.fromSocketId === inSocket.socketId || c.fromPort === inSocket.socketId) &&
        (c.toSocketId === outSocket.socketId || c.toPort === outSocket.socketId))
  );

  if (exactExists) {
    return {
      isCompatible: false,
      sourceSocket: outSocket,
      targetSocket: inSocket,
      canonicalSignalType: sigResult.canonicalSignalType,
      reason: 'This exact wire connection already exists.',
    };
  }

  let replacesConnectionId: string | undefined;
  if (inSocket.connectivity === 'single') {
    const existingTargetConn = existingConnections.find(
      (c) => c.toNodeId === toNode.id && (c.toSocketId === inSocket!.socketId || c.toPort === inSocket!.socketId)
    );
    if (existingTargetConn) {
      replacesConnectionId = existingTargetConn.id;
    }
  }

  return {
    isCompatible: true,
    sourceSocket: outSocket,
    targetSocket: inSocket,
    canonicalSignalType: sigResult.canonicalSignalType,
    replacesConnectionId,
  };
}

export function createUniversalWire(
  fromNode: SpaceNode,
  fromSocket: UniversalSocketDefinition,
  toNode: SpaceNode,
  toSocket: UniversalSocketDefinition,
  options?: Partial<NodeConnection>
): NodeConnection {
  const compatibility = areSignalsCompatible(fromSocket, toSocket);

  return {
    id: options?.id || `wire-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fromNodeId: fromNode.id,
    fromPort: fromSocket.socketId,
    fromSocketId: fromSocket.socketId,
    fromSocketIndex: fromSocket.socketIndex,
    toNodeId: toNode.id,
    toPort: toSocket.socketId,
    toSocketId: toSocket.socketId,
    toSocketIndex: toSocket.socketIndex,
    signalType: compatibility.canonicalSignalType || fromSocket.signalType,
    signalMedium: fromSocket.medium,
    signalDataType: fromSocket.dataType,
    latencyBeats: options?.latencyBeats || 0,
    dryMix: options?.dryMix ?? 1.0,
    wetMix: options?.wetMix ?? 1.0,
    signalGain: options?.signalGain ?? 1.0,
    controlPoint: options?.controlPoint,
    effectOrder: options?.effectOrder,
    affectedByEffectIds: options?.affectedByEffectIds,
  };
}
