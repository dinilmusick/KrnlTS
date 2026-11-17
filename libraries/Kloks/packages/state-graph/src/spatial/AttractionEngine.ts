import type { BaseNode, NodePosition } from '../domain/BaseNode.js';

export class AttractionEngine {
  public static computeSimilarity(nodeA: BaseNode, nodeB: BaseNode): number {
    if (nodeA.id === nodeB.id) return 1.0;

    let score = 0;
    let factors = 0;

    // 1. Type match
    factors += 1;
    if (nodeA.type === nodeB.type) {
      score += 1.0;
    }

    // 2. Input signatures match
    factors += 1;
    const inTypesA = new Set(nodeA.handles.filter(h => h.direction === 'INPUT').map(h => h.dataType));
    const inTypesB = new Set(nodeB.handles.filter(h => h.direction === 'INPUT').map(h => h.dataType));
    const sharedIn = [...inTypesA].filter(t => inTypesB.has(t)).length;
    const totalIn = Math.max(1, new Set([...inTypesA, ...inTypesB]).size);
    score += sharedIn / totalIn;

    // 3. Output signatures match
    factors += 1;
    const outTypesA = new Set(nodeA.handles.filter(h => h.direction === 'OUTPUT').map(h => h.dataType));
    const outTypesB = new Set(nodeB.handles.filter(h => h.direction === 'OUTPUT').map(h => h.dataType));
    const sharedOut = [...outTypesA].filter(t => outTypesB.has(t)).length;
    const totalOut = Math.max(1, new Set([...outTypesA, ...outTypesB]).size);
    score += sharedOut / totalOut;

    return factors > 0 ? score / factors : 0;
  }

  public static calculateStep(
    nodes: BaseNode[],
    strength: number = 1.0,
    speed: number = 1.0
  ): Map<string, NodePosition> {
    const updatedPositions = new Map<string, NodePosition>();

    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      if (nodeA.positionLocked) {
        updatedPositions.set(nodeA.id, { ...nodeA.position });
        continue;
      }

      let forceX = 0;
      let forceY = 0;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const nodeB = nodes[j];

        const similarity = this.computeSimilarity(nodeA, nodeB);
        if (similarity <= 0.1) continue;

        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const dist = Math.max(20, Math.sqrt(dx * dx + dy * dy));

        // Attractive force towards similar nodes
        const f = similarity * strength * speed;
        forceX += (dx / dist) * f;
        forceY += (dy / dist) * f;
      }

      updatedPositions.set(nodeA.id, {
        x: nodeA.position.x + forceX,
        y: nodeA.position.y + forceY
      });
    }

    return updatedPositions;
  }
}
