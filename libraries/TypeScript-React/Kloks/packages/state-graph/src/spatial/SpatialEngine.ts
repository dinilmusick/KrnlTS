import type { BaseHandle, HandlePosition } from '../domain/BaseHandle.js';
import type { BaseNode } from '../domain/BaseNode.js';

export class SpatialEngine {
  public static calculateEffectiveHandlePosition(node: BaseNode, handle: BaseHandle): HandlePosition {
    // If basePosition.x is unset (0), compute default with 12px spatial clearance
    let baseX = handle.basePosition.x;
    if (baseX === 0 && node.size?.width) {
      baseX = handle.direction === 'OUTPUT' ? (node.size.width / 2) + 12 : -(node.size.width / 2) - 12;
    }
    // Handle position relative to canvas: node top-left + handle basePosition + handle offset
    return {
      x: node.position.x + baseX + handle.offset.x,
      y: node.position.y + handle.basePosition.y + handle.offset.y
    };
  }

  public static calculateDistance(p1: HandlePosition, p2: HandlePosition): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static calculateOffsetMagnitude(handle: BaseHandle): number {
    return Math.sqrt(handle.offset.x * handle.offset.x + handle.offset.y * handle.offset.y);
  }
}
