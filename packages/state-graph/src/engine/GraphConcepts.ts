/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * GraphConcepts: Graph Topology, Node Lookup & Socket Compatibility Helpers
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * @role component
 */

import { SpaceNode, NodeConnection, ContainerNode } from './types/legacyTypes';

export const GraphConcepts = {
  /**
   * Finds connected source node for a given target node & port/socket.
   */
  findSourceNode(
    targetNodeId: string,
    targetPort: string,
    connections: NodeConnection[],
    allNodes: SpaceNode[]
  ): SpaceNode | null {
    const conn = connections.find(
      (c) => c.toNodeId === targetNodeId && (c.toPort === targetPort || c.toSocketIndex === 0)
    );
    if (!conn) return null;
    return allNodes.find((n) => n.id === conn.fromNodeId) || null;
  },

  /**
   * Finds connected target node for a given source node & port/socket.
   */
  findTargetNode(
    sourceNodeId: string,
    sourcePort: string,
    connections: NodeConnection[],
    allNodes: SpaceNode[]
  ): SpaceNode | null {
    const conn = connections.find(
      (c) => c.fromNodeId === sourceNodeId && (c.fromPort === sourcePort || c.fromSocketIndex === 0)
    );
    if (!conn) return null;
    return allNodes.find((n) => n.id === conn.toNodeId) || null;
  },

  /**
   * Finds connected container target for a node (e.g. for Player or Recorder).
   */
  findTargetContainer(
    sourceNodeId: string,
    sourcePort: string,
    connections: NodeConnection[],
    allNodes: SpaceNode[]
  ): ContainerNode | null {
    const node = GraphConcepts.findTargetNode(sourceNodeId, sourcePort, connections, allNodes);
    if (node && node.type === 'container') {
      return node as ContainerNode;
    }
    return null;
  },
};

export const findSourceNode = GraphConcepts.findSourceNode;
export const findTargetNode = GraphConcepts.findTargetNode;
export const findTargetContainer = GraphConcepts.findTargetContainer;

