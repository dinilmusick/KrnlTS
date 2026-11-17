export interface SocketCoordOptions {
  cardWidth: number;
  cardHeight?: number;
  isOutput: boolean;
  clearance?: number;
  nudge?: { x: number; y: number };
}

export interface SocketCoordResult {
  baseX: number;
  effectiveX: number;
  effectiveY: number;
  nudge: { x: number; y: number };
}

/**
 * Calculates socket handle coordinates enforcing that the handle always appears just
 * outside the node body edge on spawn and cannot be pushed into the node body area.
 */
export function calculateSocketCoordinates(
  baseY: number,
  options: SocketCoordOptions
): SocketCoordResult {
  const clearance = Math.max(12, options.clearance ?? 14);
  const nudge = options.nudge ?? { x: 0, y: 0 };
  const halfWidth = options.cardWidth / 2;
  const halfHeight = (options.cardHeight ?? 80) / 2;
  
  // Anti-obscuring rule: pushed outward from node body edge by at least clearance
  const baseX = options.isOutput 
    ? halfWidth + clearance 
    : -halfWidth - clearance;

  let effectiveX = baseX + nudge.x;
  let effectiveY = baseY + nudge.y;

  const minMargin = 4;
  const bodyLeft = -halfWidth;
  const bodyRight = halfWidth;
  const bodyTop = -halfHeight;
  const bodyBottom = halfHeight;

  if (
    effectiveX > bodyLeft - minMargin &&
    effectiveX < bodyRight + minMargin &&
    effectiveY > bodyTop - minMargin &&
    effectiveY < bodyBottom + minMargin
  ) {
    if (options.isOutput) {
      effectiveX = bodyRight + Math.max(minMargin, clearance / 2);
    } else {
      effectiveX = bodyLeft - Math.max(minMargin, clearance / 2);
    }
  }

  return {
    baseX,
    effectiveX,
    effectiveY,
    nudge: {
      x: effectiveX - baseX,
      y: effectiveY - baseY,
    },
  };
}

/**
 * Dual-layered polygon beam points helper for tapered energy beam tethers.
 * Tapers from thick at base (node body) to a fine point at head (displaced handle).
 */
export const getBeamPoints = (
  nudge: { x: number; y: number },
  baseW = 5,
  headW = 1.2
): string => {
  const vx = -nudge.x;
  const vy = -nudge.y;
  const d = Math.sqrt(vx * vx + vy * vy);
  if (d < 1) return "";

  const px = -vy / d;
  const py = vx / d;

  const hL_x = -px * headW;
  const hL_y = -py * headW;
  const hR_x = px * headW;
  const hR_y = py * headW;

  const bR_x = vx + px * baseW;
  const bR_y = vy + py * baseW;
  const bL_x = vx - px * baseW;
  const bL_y = vy - py * baseW;

  return `${hL_x},${hL_y} ${hR_x},${hR_y} ${bR_x},${bR_y} ${bL_x},${bL_y}`;
};
