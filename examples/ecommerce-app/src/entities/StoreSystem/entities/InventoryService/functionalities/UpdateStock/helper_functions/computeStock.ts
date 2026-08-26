export function computeStock(currentQty: number, delta: number): number {
  return Math.max(0, currentQty + delta);
}
