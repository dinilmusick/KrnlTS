import type { GraphNode } from '../../types.js';
import type { GhostNodeRecord, GhostTraceRecord } from './types.js';

export class GhostTracePathBuilder {
  public static buildGhostTraces(
    ghostNodes: GhostNodeRecord[],
    existingNodes: GraphNode[]
  ): GhostTraceRecord[] {
    const nodeMap = new Map<string, GraphNode>(existingNodes.map(n => [n.id, n]));
    const traces: GhostTraceRecord[] = [];

    for (const ghost of ghostNodes) {
      const source = nodeMap.get(ghost.sourceNodeId);
      if (!source) continue;

      for (const mapping of ghost.socketMappings) {
        const start = this.getRealSocketPosition(source, mapping.sourceSocketId, 'output');
        const end = this.getGhostSocketPosition(ghost, mapping.targetSocketId, 'input');
        const pathD = this.renderBezier(start.x, start.y, end.x, end.y);

        traces.push({
          id: `trace-ghost-${source.id}-${mapping.sourceSocketId}->${ghost.id}-${mapping.targetSocketId}`,
          sourceNodeId: source.id,
          sourceSocketId: mapping.sourceSocketId,
          targetGhostNodeId: ghost.id,
          targetSocketId: mapping.targetSocketId,
          wireType: mapping.wireType,
          pathD,
          scenarioIndex: ghost.scenarioIndex
        });
      }
    }

    return traces;
  }

  private static getRealSocketPosition(
    node: GraphNode,
    socketId: string,
    type: 'input' | 'output'
  ): { x: number; y: number } {
    const sockets = type === 'input' ? node.inputs : node.outputs;
    const socket = sockets?.find(s => s.id === socketId);
    const index = sockets && socket ? sockets.indexOf(socket) : 0;
    const w = node.width ?? 180;
    const count = Math.max(1, sockets?.length ?? 1);

    const x = type === 'input' ? node.position.x : node.position.x + w;
    const y = node.position.y + ((index + 1) * (node.height ?? 120)) / (count + 1);

    return {
      x: x + (socket?.offset?.x ?? 0),
      y: y + (socket?.offset?.y ?? 0)
    };
  }

  private static getGhostSocketPosition(
    ghost: GhostNodeRecord,
    socketId: string,
    type: 'input' | 'output'
  ): { x: number; y: number } {
    const sockets = type === 'input' ? ghost.inputs : ghost.outputs;
    const socket = sockets?.find(s => s.id === socketId);
    const index = sockets && socket ? sockets.indexOf(socket) : 0;
    const w = ghost.size.width;
    const count = Math.max(1, sockets?.length ?? 1);

    const x = type === 'input' ? ghost.position.x : ghost.position.x + w;
    const y = ghost.position.y + ((index + 1) * ghost.size.height) / (count + 1);

    return { x, y };
  }

  public static renderBezier(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): string {
    const delta = Math.max(Math.abs(endX - startX) * 0.5, 45);
    return `M ${startX},${startY} C ${startX + delta},${startY} ${endX - delta},${endY} ${endX},${endY}`;
  }
}
