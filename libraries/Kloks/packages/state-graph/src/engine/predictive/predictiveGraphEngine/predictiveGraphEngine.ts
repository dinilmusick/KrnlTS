// ════ PREDICTIVEGRAPHENGINE IMPLEMENTATION ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════════════
import { SpaceNode, NodeConnection } from '../../types/legacyTypes.js';
import { getNodeSockets } from '../../core/nodeSocketRegistry.js';
import { getCompatibleNodesForSocket } from '../../functions/socketCompatibilitySpawner.js';
import { createNodeFromSpawnType } from '../../functions/spawnNodeFactory.js';
import { PredictiveGhostNode, PredictiveTrace, PredictiveSelectionResult } from '../types.js';

const TRACE_COLORS: Record<string, string> = {
  AUDIO_STEREO: '#00ffff',
  AUDIO_MONO: '#38bdf8',
  AUDIO_PACKET: '#818cf8',
  TRIGGER: '#eab308',
  MIDI_STREAM: '#ec4899',
  MIDI_PACKET: '#f43f5e',
  CURVE_STREAM: '#10b981',
  CURVE_PACKET: '#34d399',
  COMPONENT: '#a855f7',
  DEFAULT: '#38bdf8',
};

function resolveTraceColor(signalType: string): string {
  const normalized = signalType.toUpperCase();
  return TRACE_COLORS[normalized] || TRACE_COLORS.DEFAULT;
}

/**
 * Computes predictive ghost nodes and connecting traces for the currently selected nodes.
 */
export function computePredictiveGraph(
  selectedNodes: SpaceNode[],
  connections: NodeConnection[],
  scenarioIndex = 0
): PredictiveSelectionResult {
  const ghostNodes: PredictiveGhostNode[] = [];
  const traces: PredictiveTrace[] = [];
  const selectedNodesWithGhosts = new Map<string, PredictiveGhostNode[]>();

  if (!selectedNodes || selectedNodes.length === 0) {
    return { ghostNodes, traces, selectedNodesWithGhosts };
  }

  // Pre-index existing connections by socket for fast lookups
  const outgoingConnectionCount = new Map<string, number>(); 
  const incomingConnectionCount = new Map<string, number>();

  connections.forEach((c) => {
    const fromSock = c.fromSocketId || c.fromPort || '';
    const toSock = c.toSocketId || c.toPort || '';
    const fromKey = `${c.fromNodeId}:${fromSock}`;
    const toKey = `${c.toNodeId}:${toSock}`;
    outgoingConnectionCount.set(fromKey, (outgoingConnectionCount.get(fromKey) || 0) + 1);
    incomingConnectionCount.set(toKey, (incomingConnectionCount.get(toKey) || 0) + 1);
  });

  selectedNodes.forEach((parent) => {
    const parentGhosts: PredictiveGhostNode[] = [];
    const { inputs, outputs } = getNodeSockets(parent);

    const leftGhostSpecs: Array<{
      socket: any;
      polarity: 'input';
      candidate: any;
      slotIndex: number;
      candIndex: number;
      totalCands: number;
    }> = [];

    const rightGhostSpecs: Array<{
      socket: any;
      polarity: 'output';
      candidate: any;
      slotIndex: number;
      candIndex: number;
      totalCands: number;
    }> = [];

    // 1. Evaluate INPUT sockets
    inputs.forEach((inputSocket) => {
      const socketKey = `${parent.id}:${inputSocket.socketId}`;
      const existingCount = incomingConnectionCount.get(socketKey) || 0;
      const isMulti = inputSocket.connectivity === 'multi';

      if (!isMulti && existingCount > 0) return;
      const countNeeded = isMulti ? 2 : 1;

      const compatible = getCompatibleNodesForSocket(
        parent,
        'in',
        inputSocket.socketId,
        inputSocket.socketIndex,
        inputSocket.signalType
      );

      if (!compatible.options || compatible.options.length === 0) return;

      const totalCands = compatible.options.length;
      for (let slot = 0; slot < countNeeded; slot++) {
        const candIndex = (Math.abs(scenarioIndex) + slot) % totalCands;
        const candidate = compatible.options[candIndex];
        leftGhostSpecs.push({
          socket: inputSocket,
          polarity: 'input',
          candidate,
          slotIndex: slot,
          candIndex,
          totalCands,
        });
      }
    });

    // 2. Evaluate OUTPUT sockets
    outputs.forEach((outputSocket) => {
      const socketKey = `${parent.id}:${outputSocket.socketId}`;
      const existingCount = outgoingConnectionCount.get(socketKey) || 0;
      const isMulti = outputSocket.connectivity === 'multi';

      if (!isMulti && existingCount > 0) return;
      const countNeeded = isMulti ? 2 : 1;

      const compatible = getCompatibleNodesForSocket(
        parent,
        'out',
        outputSocket.socketId,
        outputSocket.socketIndex,
        outputSocket.signalType
      );

      if (!compatible.options || compatible.options.length === 0) return;

      const totalCands = compatible.options.length;
      for (let slot = 0; slot < countNeeded; slot++) {
        const candIndex = (Math.abs(scenarioIndex) + slot) % totalCands;
        const candidate = compatible.options[candIndex];
        rightGhostSpecs.push({
          socket: outputSocket,
          polarity: 'output',
          candidate,
          slotIndex: slot,
          candIndex,
          totalCands,
        });
      }
    });

    // 3. Compute spatial placement
    const px = parent.position[0];
    const pz = parent.position[2];
    const verticalGap = 2.6; 

    // Position Left
    const leftCount = leftGhostSpecs.length;
    leftGhostSpecs.forEach((spec, index) => {
      const zOffset = (index - (leftCount - 1) / 2) * verticalGap;
      const ghostId = `ghost-${parent.id}-in-${spec.socket.socketId}-${spec.slotIndex}`;
      const worldPos: [number, number, number] = [px - 5.0, 0, pz + zOffset];

      const ghost: PredictiveGhostNode = {
        id: ghostId,
        parentNodeId: parent.id,
        parentSocketId: spec.socket.socketId,
        parentSocketPolarity: 'input',
        parentSocketSignalType: spec.socket.signalType,
        parentSocketLabel: spec.socket.label,
        archetypeId: spec.candidate.id,
        category: spec.candidate.category,
        label: spec.candidate.label,
        description: spec.candidate.description,
        iconName: spec.candidate.iconName,
        colorHex: spec.candidate.colorHex,
        badge: spec.candidate.badge,
        matchingSocketId: spec.candidate.matchingSocketId,
        matchingSocketIndex: spec.candidate.matchingSocketIndex,
        spawnType: spec.candidate.spawnType,
        worldPosition: worldPos,
        slotIndex: spec.slotIndex,
        candidateIndex: spec.candIndex,
        totalCandidates: spec.totalCands,
        prototypeNode: createNodeFromSpawnType(spec.candidate.spawnType, 999, 120, worldPos) || parent,
      };

      parentGhosts.push(ghost);
      ghostNodes.push(ghost);

      traces.push({
        id: `ptrace-${ghost.id}->${parent.id}:${spec.socket.socketId}`,
        ghostNodeId: ghost.id,
        sourceNodeId: ghost.id,
        sourceHandleId: spec.candidate.matchingSocketId,
        targetNodeId: parent.id,
        targetHandleId: spec.socket.socketId,
        wireType: spec.socket.signalType,
        isFromGhostToParent: true,
        color: resolveTraceColor(spec.socket.signalType),
      });
    });

    // Position Right
    const rightCount = rightGhostSpecs.length;
    rightGhostSpecs.forEach((spec, index) => {
      const zOffset = (index - (rightCount - 1) / 2) * verticalGap;
      const ghostId = `ghost-${parent.id}-out-${spec.socket.socketId}-${spec.slotIndex}`;
      const worldPos: [number, number, number] = [px + 5.0, 0, pz + zOffset];

      const ghost: PredictiveGhostNode = {
        id: ghostId,
        parentNodeId: parent.id,
        parentSocketId: spec.socket.socketId,
        parentSocketPolarity: 'output',
        parentSocketSignalType: spec.socket.signalType,
        parentSocketLabel: spec.socket.label,
        archetypeId: spec.candidate.id,
        category: spec.candidate.category,
        label: spec.candidate.label,
        description: spec.candidate.description,
        iconName: spec.candidate.iconName,
        colorHex: spec.candidate.colorHex,
        badge: spec.candidate.badge,
        matchingSocketId: spec.candidate.matchingSocketId,
        matchingSocketIndex: spec.candidate.matchingSocketIndex,
        spawnType: spec.candidate.spawnType,
        worldPosition: worldPos,
        slotIndex: spec.slotIndex,
        candidateIndex: spec.candIndex,
        totalCandidates: spec.totalCands,
        prototypeNode: createNodeFromSpawnType(spec.candidate.spawnType, 999, 120, worldPos) || parent,
      };

      parentGhosts.push(ghost);
      ghostNodes.push(ghost);

      traces.push({
        id: `ptrace-${parent.id}:${spec.socket.socketId}->${ghost.id}`,
        ghostNodeId: ghost.id,
        sourceNodeId: parent.id,
        sourceHandleId: spec.socket.socketId,
        targetNodeId: ghost.id,
        targetHandleId: spec.candidate.matchingSocketId,
        wireType: spec.socket.signalType,
        isFromGhostToParent: false,
        color: resolveTraceColor(spec.socket.signalType),
      });
    });

    if (parentGhosts.length > 0) {
      selectedNodesWithGhosts.set(parent.id, parentGhosts);
    }
  });

  return { ghostNodes, traces, selectedNodesWithGhosts };
}
