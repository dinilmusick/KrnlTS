export function clampCrossoverFrequencies(
  low: number,
  high: number
): { crossoverLow: number; crossoverHigh: number } {
  const safeLow = Math.max(40, Math.min(800, low));
  const safeHigh = Math.max(safeLow + 100, Math.min(16000, high));
  return { crossoverLow: safeLow, crossoverHigh: safeHigh };
}

export function formatFrequencyHz(freq: number): string {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`;
  }
  return `${Math.round(freq)}Hz`;
}
