export function formatDecayTime(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

export function formatMilliseconds(ms: number): string {
  return `${Math.round(ms)}ms`;
}
