import { SpaceNode, UniversalSocketDefinition } from '@floks/contracts';
import { getNodeSockets } from '@floks/contracts';
import { GraphNodeParent } from '@floks/contracts';
import { CameraState } from './types.js';

export interface SocketScreenPosition {
  x: number;
  y: number;
  socket: UniversalSocketDefinition;
  isOutput: boolean;
  localOffset: { x: number; y: number };
}

/**
 * Calculates the local pixel offset of a socket handle relative to node card center,
 * enforcing that handles always spawn just outside the node body and cannot be pushed
 * into the node body area.
 */
export function getSocketLocalOffset(
  node: SpaceNode,
  socketId: string,
  isOutput: boolean,
  index: number,
  totalSockets: number
): { x: number; y: number } {
  const isCustomBox = node.type === 'arrangement' || node.type === 'code';
  const clearance = isCustomBox ? 16 : 14;
  return GraphNodeParent.calculateConstrainedSocketOffset(
    node,
    socketId,
    isOutput,
    index,
    totalSockets,
    clearance
  );
}

/**
 * Computes exact viewport screen coordinates for a given socket on a node.
 */
export function getSocketScreenPosition(
  node: SpaceNode,
  socketId: string | undefined,
  isOutput: boolean,
  worldToScreen: (x: number, z: number) => { x: number; y: number },
  camera: CameraState
): { x: number; y: number } {
  const center = worldToScreen(node.position[0], node.position[2]);
  const { inputs, outputs } = getNodeSockets(node);
  const sockets = isOutput ? outputs : inputs;

  if (sockets.length === 0) {
    return center;
  }

  let idx = -1;
  if (socketId) {
    idx = sockets.findIndex((s) => s.socketId === socketId);
  }
  const validIdx = idx >= 0 ? idx : 0;
  const targetSocket = sockets[validIdx];

  const localOffset = getSocketLocalOffset(
    node,
    targetSocket.socketId,
    isOutput,
    validIdx,
    sockets.length
  );

  return {
    x: center.x + localOffset.x * camera.zoom,
    y: center.y + localOffset.y * camera.zoom,
  };
}
