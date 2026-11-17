import { SpaceNode, ExposedSocketReference } from "../types/index.js";
import { getNodeSockets } from './nodeSocketRegistry';

/**
 * Resolves all sockets from every node in the project graph,
 * identifying which sockets are marked as 'Exposed' for Control Panels.
 */
export function getAllProjectSockets(nodes: SpaceNode[]): {
  inputs: ExposedSocketReference[];
  outputs: ExposedSocketReference[];
  exposedList: ExposedSocketReference[];
} {
  const allInputs: ExposedSocketReference[] = [];
  const allOutputs: ExposedSocketReference[] = [];
  const exposedList: ExposedSocketReference[] = [];

  nodes.forEach((node) => {
    // Determine which sockets on this node are flagged as exposed
    const nodeExposedRefs: ExposedSocketReference[] = (node as any).exposedSockets || [];
    const exposedSocketIdSet = new Set(nodeExposedRefs.map((r) => `${r.socketId}_${r.direction}`));

    const { inputs, outputs } = getNodeSockets(node);

    inputs.forEach((sock, idx) => {
      const isExposed = exposedSocketIdSet.has(`${sock.socketId}_input`);
      const ref: ExposedSocketReference = {
        id: `${node.id}_${sock.socketId}_in`,
        nodeId: node.id,
        nodeName: node.name || (node as any).label || 'Node',
        nodeType: node.type,
        socketId: sock.socketId,
        socketIndex: idx,
        label: sock.label || sock.socketId,
        direction: 'input',
        signalType: sock.signalType || 'trigger',
        medium: sock.medium,
        dataType: sock.dataType,
        isExposed,
      };
      allInputs.push(ref);
      if (isExposed) exposedList.push(ref);
    });

    outputs.forEach((sock, idx) => {
      const isExposed = exposedSocketIdSet.has(`${sock.socketId}_output`);
      const ref: ExposedSocketReference = {
        id: `${node.id}_${sock.socketId}_out`,
        nodeId: node.id,
        nodeName: node.name || (node as any).label || 'Node',
        nodeType: node.type,
        socketId: sock.socketId,
        socketIndex: idx,
        label: sock.label || sock.socketId,
        direction: 'output',
        signalType: sock.signalType || 'trigger',
        medium: sock.medium,
        dataType: sock.dataType,
        isExposed,
      };
      allOutputs.push(ref);
      if (isExposed) exposedList.push(ref);
    });
  });

  return {
    inputs: allInputs,
    outputs: allOutputs,
    exposedList,
  };
}

/**
 * Toggles socket exposure state on a target node.
 */
export function toggleNodeSocketExposure(
  nodes: SpaceNode[],
  nodeId: string,
  socketId: string,
  direction: 'input' | 'output'
): SpaceNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const currentExposed: ExposedSocketReference[] = (node as any).exposedSockets || [];
    const existsIndex = currentExposed.findIndex(
      (r) => r.socketId === socketId && r.direction === direction
    );

    let updatedExposed: ExposedSocketReference[];

    if (existsIndex >= 0) {
      // Remove from exposed
      updatedExposed = currentExposed.filter((_, idx) => idx !== existsIndex);
    } else {
      // Find socket definition
      const { inputs, outputs } = getNodeSockets(node);
      const pool = direction === 'input' ? inputs : outputs;
      const sockDef = pool.find((s) => s.socketId === socketId) || pool[0];

      const newRef: ExposedSocketReference = {
        id: `${node.id}_${socketId}_${direction}`,
        nodeId: node.id,
        nodeName: node.name || (node as any).label || 'Node',
        nodeType: node.type,
        socketId,
        socketIndex: sockDef?.socketIndex ?? 0,
        label: sockDef?.label || socketId,
        direction,
        signalType: sockDef?.signalType || 'trigger',
        medium: sockDef?.medium,
        dataType: sockDef?.dataType,
        isExposed: true,
      };

      updatedExposed = [...currentExposed, newRef];
    }

    return {
      ...node,
      exposedSockets: updatedExposed,
    };
  });
}
