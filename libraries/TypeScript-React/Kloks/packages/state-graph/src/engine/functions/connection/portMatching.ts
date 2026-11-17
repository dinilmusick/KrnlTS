import { SpaceNode, UniversalSocketDefinition, SignalType, NodeConnection } from '../../types/legacyTypes';
import { getNodeSockets } from '../../core/nodeSocketRegistry.js';
import { areSignalsCompatible } from './signalCompatibility.js';

export interface SocketPairMatch {
  fromSocket: UniversalSocketDefinition;
  toSocket: UniversalSocketDefinition;
  canonicalSignalType: SignalType;
}

export function findCompatibleSocketPair(
  sourceNode: SpaceNode,
  targetNode: SpaceNode,
  preferredFromPort?: string,
  preferredToPort?: string,
  existingConnections: NodeConnection[] = []
): SocketPairMatch | null {
  if (sourceNode.id === targetNode.id) return null;

  const { outputs: sourceOutputs } = getNodeSockets(sourceNode);
  const { inputs: targetInputs } = getNodeSockets(targetNode);
  if (sourceOutputs.length === 0 || targetInputs.length === 0) return null;

  const isWireExisting = (outSock: UniversalSocketDefinition, inSock: UniversalSocketDefinition) => {
    return existingConnections.some(
      (c) =>
        c.fromNodeId === sourceNode.id &&
        c.toNodeId === targetNode.id &&
        (c.fromSocketId === outSock.socketId || c.fromPort === outSock.socketId) &&
        (c.toSocketId === inSock.socketId || c.toPort === inSock.socketId)
    );
  };

  const isInputOccupied = (inSock: UniversalSocketDefinition, currentOutSock?: UniversalSocketDefinition) => {
    if (inSock.connectivity !== 'single') return false;
    return existingConnections.some(
      (c) =>
        c.toNodeId === targetNode.id &&
        (c.toSocketId === inSock.socketId || c.toPort === inSock.socketId) &&
        (!currentOutSock || c.fromNodeId !== sourceNode.id || (c.fromSocketId !== currentOutSock.socketId && c.fromPort !== currentOutSock.socketId))
    );
  };

  if (preferredFromPort || preferredToPort) {
    const preferredOut = preferredFromPort ? sourceOutputs.find((s) => s.socketId === preferredFromPort) : undefined;
    const preferredIn = preferredToPort ? targetInputs.find((s) => s.socketId === preferredToPort) : undefined;

    if (preferredOut && preferredIn) {
      const res = areSignalsCompatible(preferredOut, preferredIn);
      if (res.isCompatible && !isWireExisting(preferredOut, preferredIn)) {
        return { fromSocket: preferredOut, toSocket: preferredIn, canonicalSignalType: res.canonicalSignalType };
      }
    }
    if (preferredOut) {
      for (const inSock of targetInputs) {
        if (isInputOccupied(inSock, preferredOut) || isWireExisting(preferredOut, inSock)) continue;
        const res = areSignalsCompatible(preferredOut, inSock);
        if (res.isCompatible) return { fromSocket: preferredOut, toSocket: inSock, canonicalSignalType: res.canonicalSignalType };
      }
      // If all preferred input sockets were occupied/connected, allow compatible input socket as fallback
      for (const inSock of targetInputs) {
        if (isWireExisting(preferredOut, inSock)) continue;
        const res = areSignalsCompatible(preferredOut, inSock);
        if (res.isCompatible) return { fromSocket: preferredOut, toSocket: inSock, canonicalSignalType: res.canonicalSignalType };
      }
    }
    if (preferredIn) {
      for (const outSock of sourceOutputs) {
        if (isWireExisting(outSock, preferredIn)) continue;
        const res = areSignalsCompatible(outSock, preferredIn);
        if (res.isCompatible) return { fromSocket: outSock, toSocket: preferredIn, canonicalSignalType: res.canonicalSignalType };
      }
    }
  }

  const isOutputConnectedToTarget = (outSock: UniversalSocketDefinition) => {
    return existingConnections.some(
      (c) =>
        c.fromNodeId === sourceNode.id &&
        c.toNodeId === targetNode.id &&
        (c.fromSocketId === outSock.socketId || c.fromPort === outSock.socketId)
    );
  };

  // 1. Prioritize completely fresh output -> free input pairs (parallel 1:1 wiring)
  for (const outSock of sourceOutputs) {
    if (isOutputConnectedToTarget(outSock)) continue;
    for (const inSock of targetInputs) {
      if (isInputOccupied(inSock, outSock) || isWireExisting(outSock, inSock)) continue;
      const res = areSignalsCompatible(outSock, inSock);
      if (res.isCompatible) {
        return { fromSocket: outSock, toSocket: inSock, canonicalSignalType: res.canonicalSignalType };
      }
    }
  }

  // 2. Iterate prioritizing free, unconnected input socket pairs from any compatible output
  for (const outSock of sourceOutputs) {
    for (const inSock of targetInputs) {
      if (isInputOccupied(inSock, outSock) || isWireExisting(outSock, inSock)) continue;
      const res = areSignalsCompatible(outSock, inSock);
      if (res.isCompatible) {
        return { fromSocket: outSock, toSocket: inSock, canonicalSignalType: res.canonicalSignalType };
      }
    }
  }

  // Fallback to first compatible pair that is not an exact duplicate
  for (const outSock of sourceOutputs) {
    for (const inSock of targetInputs) {
      if (isWireExisting(outSock, inSock)) continue;
      const res = areSignalsCompatible(outSock, inSock);
      if (res.isCompatible) {
        return { fromSocket: outSock, toSocket: inSock, canonicalSignalType: res.canonicalSignalType };
      }
    }
  }

  return null;
}
