import type { GraphNode, Socket } from '../../types.js';
import type { NodeDefinition } from '../../domain/BaseNode.js';
import type { GhostCandidate, GhostNodeRecord } from './types.js';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class GhostLayoutResolver {
  public static resolveLayout(
    candidates: GhostCandidate[],
    existingNodes: GraphNode[],
    allNodeDefs: NodeDefinition[]
  ): GhostNodeRecord[] {
    const nodeMap = new Map<string, GraphNode>(existingNodes.map(n => [n.id, n]));
    const defMap = new Map<string, NodeDefinition>(allNodeDefs.map(d => [d.type, d]));
    const occupiedRects: Rect[] = existingNodes.map(n => ({
      x: n.position.x,
      y: n.position.y,
      width: n.width ?? 180,
      height: n.height ?? 120
    }));

    const resolved: GhostNodeRecord[] = [];

    for (const cand of candidates) {
      const source = nodeMap.get(cand.sourceNodeId);
      const def = defMap.get(cand.nodeType);
      const width = 180;
      const height = 120;

      const baseX = (source ? source.position.x + (source.width ?? 180) : 0) + 80;
      const baseY = (source ? source.position.y : 0) + cand.relativeOffset.y;

      const placedRect = this.findNonOverlappingPosition(
        { x: baseX, y: baseY, width, height },
        occupiedRects
      );

      occupiedRects.push(placedRect);

      const inputs: Socket[] = (def?.inputs ?? []).map(h => ({
        id: h.id,
        label: h.label || h.id,
        type: 'input' as const,
        dataType: h.dataType,
        direction: 'INPUT'
      }));

      const outputs: Socket[] = (def?.outputs ?? []).map(h => ({
        id: h.id,
        label: h.label || h.id,
        type: 'output' as const,
        dataType: h.dataType,
        direction: 'OUTPUT'
      }));

      resolved.push({
        id: cand.id,
        nodeType: cand.nodeType,
        label: cand.label,
        position: { x: placedRect.x, y: placedRect.y },
        size: { width, height },
        scenarioIndex: cand.scenarioIndex,
        sourceNodeId: cand.sourceNodeId,
        socketMappings: cand.socketMappings,
        inputs,
        outputs
      });
    }

    return resolved;
  }

  private static findNonOverlappingPosition(ideal: Rect, existing: Rect[]): Rect {
    let curr = { ...ideal };
    let collision = true;
    let attempts = 0;
    const padding = 20;

    while (collision && attempts < 15) {
      collision = false;
      for (const box of existing) {
        if (this.intersects(curr, box, padding)) {
          collision = true;
          // Step downward and slightly staggered rightward
          curr.y = box.y + box.height + padding;
          curr.x = ideal.x + (attempts % 2 === 1 ? 24 : 0);
          break;
        }
      }
      attempts++;
    }

    return curr;
  }

  private static intersects(a: Rect, b: Rect, pad: number): boolean {
    return !(
      a.x + a.width + pad <= b.x ||
      b.x + b.width + pad <= a.x ||
      a.y + a.height + pad <= b.y ||
      b.y + b.height + pad <= a.y
    );
  }
}
