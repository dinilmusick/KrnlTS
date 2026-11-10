import type {
  TelemetryInvocation,
  TelemetryMode,
  TelemetryPercentiles,
  TelemetrySnapshot,
  TelemetryStatus,
  TelemetryTargetStats,
} from './TelemetryTypes.js';

export interface TelemetrySnapshotInput {
  serviceId: string;
  mode: TelemetryMode;
  invocations: readonly TelemetryInvocation[];
  status: TelemetryStatus;
  totalInvocationCount: number;
  totalSuccessCount: number;
  totalErrorCount: number;
  activeInvocations: number;
  maxRecentInvocations: number;
}

function percentiles(values: readonly number[]): TelemetryPercentiles {
  if (!values.length) return { min: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return {
    min: sorted[0],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50: pick(0.5),
    p90: pick(0.9),
    p95: pick(0.95),
    p99: pick(0.99),
    max: sorted[sorted.length - 1],
  };
}

export function buildTelemetrySnapshot(input: TelemetrySnapshotInput): TelemetrySnapshot {
  const invocations = input.invocations.slice();
  const durations = invocations.map((item) => item.durationMs);
  const targetMap = new Map<string, TelemetryInvocation[]>();

  for (const invocation of invocations) {
    const key = `${invocation.kind}:${invocation.target}`;
    const group = targetMap.get(key) ?? [];
    group.push(invocation);
    targetMap.set(key, group);
  }

  const targets: TelemetryTargetStats[] = [...targetMap.values()].map((group) => ({
    target: group[0].target,
    kind: group[0].kind,
    count: group.length,
    successCount: group.filter((item) => item.status === 'completed').length,
    errorCount: group.filter((item) => item.status === 'failed').length,
    durationMs: percentiles(group.map((item) => item.durationMs)),
    lastInvocationAt: group[group.length - 1]?.completedAt,
  }));

  return {
    serviceId: input.serviceId,
    mode: input.mode,
    capturedAt: Date.now(),
    status: input.status,
    totals: {
      invocationCount: input.totalInvocationCount,
      successCount: input.totalSuccessCount,
      errorCount: input.totalErrorCount,
      durationMs: percentiles(durations),
    },
    targets,
    activeInvocations: input.activeInvocations,
    recentInvocations: invocations.slice(-input.maxRecentInvocations),
  };
}
