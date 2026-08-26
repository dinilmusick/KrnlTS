export function logMetric(name: string, val: number): string {
  return `[METRIC STREAM] ${name} = ${val.toFixed(2)}`;
}
