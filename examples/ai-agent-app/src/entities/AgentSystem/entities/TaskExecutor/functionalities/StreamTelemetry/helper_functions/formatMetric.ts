export function formatMetric(name: string, val: number): string {
  return `[METRIC] ${name} = ${val.toFixed(2)}`;
}
