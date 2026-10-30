/**
 * @file TelemetryTypes.ts
 * @description Framework-native service invocation telemetry contracts.
 */

export type TelemetryMode = 'off' | 'standard' | 'detailed' | 'profile';

export type TelemetryStatus = {
  enabled: boolean;
  mode: TelemetryMode;
  serviceId: string;
  invocationCount: number;
  activeInvocations: number;
  lastInvocationAt?: number;
};

export interface TelemetryResourceSample {
  cpuUserMicros?: number;
  cpuSystemMicros?: number;
  heapUsedBytes?: number;
  heapTotalBytes?: number;
  rssBytes?: number;
  externalBytes?: number;
  arrayBuffersBytes?: number;
  eventLoopUtilization?: number;
  scope: 'process' | 'runtime';
}

export interface TelemetryInvocation {
  invocationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceId: string;
  target: string;
  kind: 'service' | 'functionality' | 'orchestration';
  correlationId?: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  status: 'completed' | 'failed';
  error?: { name: string; message: string };
  resources?: {
    start: TelemetryResourceSample;
    end: TelemetryResourceSample;
    delta: TelemetryResourceSample;
  };
}

export interface TelemetryPercentiles {
  min: number;
  mean: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

export interface TelemetryTargetStats {
  target: string;
  kind: TelemetryInvocation['kind'];
  count: number;
  successCount: number;
  errorCount: number;
  durationMs: TelemetryPercentiles;
  lastInvocationAt?: number;
}

export interface TelemetrySnapshot {
  serviceId: string;
  mode: TelemetryMode;
  capturedAt: number;
  status: TelemetryStatus;
  totals: {
    invocationCount: number;
    successCount: number;
    errorCount: number;
    durationMs: TelemetryPercentiles;
  };
  targets: TelemetryTargetStats[];
  activeInvocations: number;
  recentInvocations: TelemetryInvocation[];
}

export interface TelemetryOptions {
  mode?: TelemetryMode;
  maxSamples?: number;
  maxRecentInvocations?: number;
}

export interface TelemetryHandle {
  readonly invocationId: string;
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  end(error?: unknown): void;
}
