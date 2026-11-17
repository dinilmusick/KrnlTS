import { SpaceNode, NodeConnection, ContainerNode, ArrangementNode } from '../types/legacyTypes.js';
import { PredictiveGhostNode } from './types.js';
import { createNodeFromSpawnType } from '../functions/spawnNodeFactory.js';
import { validateUniversalConnection } from '../functions/universalConnectionEngine.js';
import { ingestContainerIntoArrangement } from '../functions/containerClipSync.js';
import { getNodeSockets } from '../core/nodeSocketRegistry.js';

export interface MaterializeResult {
  updatedNodes: SpaceNode[];
  createdConnections: NodeConnection[];
}

let configuredSolidifySynthEngine: any = null;
export function configureSolidifyExecution(synthEngineInstance: any): void {
  configuredSolidifySynthEngine = synthEngineInstance;
}
export function getSolidifySynthEngine(): any {
  return configuredSolidifySynthEngine || (globalThis as any).__KLOKS_SYNTH_ENGINE__;
}

/**
 * Atomically materializes a batch of predictive ghost nodes and creates their
 * respective wire connections to parent handles.
 */
export function materializePredictiveGhostBatch(
  ghosts: PredictiveGhostNode[],
  existingNodes: SpaceNode[],
  bpm: number,
  existingConnections: NodeConnection[]
): MaterializeResult {
  if (!ghosts || ghosts.length === 0) {
    return { updatedNodes: existingNodes, createdConnections: [] };
  }

  let currentNodes = [...existingNodes];
  const createdConnections: NodeConnection[] = [];

  ghosts.forEach((ghost, idx) => {
    const newNode = createNodeFromSpawnType(
      ghost.spawnType,
      currentNodes.length + 1,
      bpm,
      ghost.worldPosition
    );
    if (!newNode) return;

    currentNodes = [...currentNodes, newNode];

    const parentNode = currentNodes.find((n) => n.id === ghost.parentNodeId);
    if (!parentNode) return;

    let fromNode: SpaceNode;
    let toNode: SpaceNode;
    let fromPort: string | undefined;
    let toPort: string | undefined;
    let toIndex: number | undefined;

    if (ghost.parentSocketPolarity === 'output') {
      fromNode = parentNode;
      toNode = newNode;
      fromPort = ghost.parentSocketId;
      toPort = ghost.matchingSocketId;
      toIndex = ghost.matchingSocketIndex;
    } else {
      fromNode = newNode;
      toNode = parentNode;
      fromPort = ghost.matchingSocketId;
      toPort = ghost.parentSocketId;
    }

    const allConns = [...existingConnections, ...createdConnections];
    const validation = validateUniversalConnection(fromNode, fromPort, toNode, toPort, allConns);

    if (validation.isCompatible && validation.sourceSocket && validation.targetSocket) {
      const srcSock = validation.sourceSocket;
      const tgtSock = validation.targetSocket;

      createdConnections.push({
        id: `conn-pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${idx}`,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        fromSocketId: srcSock.socketId,
        toSocketId: tgtSock.socketId,
        fromPort: srcSock.socketId,
        toPort: tgtSock.socketId,
        toSocketIndex: tgtSock.socketIndex ?? toIndex,
        signalType: validation.canonicalSignalType,
        signalDataType: srcSock.dataType,
        signalMedium: srcSock.medium,
        latencyBeats: 0,
      });

      if (toNode.type === 'arrangement' && fromNode.type === 'container') {
        const targetTrackId = tgtSock.customMeta?.trackId;
        const updatedArr = ingestContainerIntoArrangement(
          toNode as ArrangementNode,
          fromNode as ContainerNode,
          targetTrackId
        );
        currentNodes = currentNodes.map((n) => (n.id === toNode.id ? updatedArr : n));
      }
    } else {
      // Fallback: guaranteed connection creation matching target sockets
      const srcSock = validation.sourceSocket || getNodeSockets(fromNode).outputs.find((s) => s.socketId === fromPort) || getNodeSockets(fromNode).outputs[0];
      const tgtSock = validation.targetSocket || getNodeSockets(toNode).inputs.find((s) => s.socketId === toPort) || getNodeSockets(toNode).inputs[0];

      if (srcSock && tgtSock) {
        createdConnections.push({
          id: `conn-pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${idx}`,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          fromSocketId: srcSock.socketId,
          toSocketId: tgtSock.socketId,
          fromPort: srcSock.socketId,
          toPort: tgtSock.socketId,
          toSocketIndex: tgtSock.socketIndex ?? toIndex,
          signalType: validation.canonicalSignalType || srcSock.signalType || 'trigger',
          signalDataType: srcSock.dataType,
          signalMedium: srcSock.medium,
          latencyBeats: 0,
        });
      }
    }
  });

  return {
    updatedNodes: currentNodes,
    createdConnections,
  };
}
