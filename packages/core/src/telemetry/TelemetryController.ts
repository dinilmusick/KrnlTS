/**
 * @file TelemetryController.ts
 * @description Per-service telemetry recorder and public control surface.
 */

import { randomUUID } from 'node:crypto';
import {
  deltaResources,
  sampleResources,
  telemetryNow,
} from './TelemetryResources.js';
import type {
  TelemetryHandle,
  TelemetryInvocation,
  TelemetryMode,
  TelemetryOptions,
  TelemetryPercentiles,
  TelemetrySnapshot,
  TelemetryStatus,
  TelemetryTargetStats,
} from './TelemetryTypes.js';

type ActiveInvocation = {
  invocationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceId: string;
  target: string;
  kind: TelemetryInvocation['kind'];
  correlationId?: string;
  startedAt: number;
  resourcesStart?: ReturnType<typeof sampleResources>;
};

const id = (prefix: string) => `${prefix}_${randomUUID()}`;

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

export class TelemetryController {
  private mode: TelemetryMode;
  private readonly maxSamples: number;
  private readonly maxRecentInvocations: number;
  private readonly samples: TelemetryInvocation[] = [];
  private readonly active = new Map<string, ActiveInvocation>();
  private lastInvocationAt?: number;

  constructor(private readonly serviceId: string, options: TelemetryOptions = {}) {
    this.mode = options.mode ?? 'off';
    this.maxSamples = Math.max(1, options.maxSamples ?? 2048);
    this.maxRecentInvocations = Math.max(1, options.maxRecentInvocations ?? 100);
  }

  enable(mode: Exclude<TelemetryMode, 'off'> = 'standard'): void {
    this.mode = mode;
  }

  disable(): void {
    this.mode = 'off';
    this.active.clear();
  }

  setMode(mode: TelemetryMode): void {
    this.mode = mode;
    if (mode === 'off') this.active.clear();
  }

  getMode(): TelemetryMode {
    return this.mode;
  }

  status(): TelemetryStatus {
    return {
      enabled: this.mode !== 'off',
      mode: this.mode,
      serviceId: this.serviceId,
      invocationCount: this.samples.length,
      activeInvocations: this.active.size,
      lastInvocationAt: this.lastInvocationAt,
    };
  }

  begin(
    target: string,
    kind: ActiveInvocation['kind'],
    correlationId?: string,
    parentSpanId?: string,
  ): TelemetryHandle {
    if (this.mode === 'off') {
      return {
        invocationId: '',
        traceId: '',
        spanId: '',
        parentSpanId,
        end: () => undefined,
      };
    }

    const invocationId = id('inv');
    const spanId = id('span');
    const traceId = parentSpanId ? this.findTraceId(parentSpanId) ?? id('trace') : id('trace');
    const active: ActiveInvocation = {
      invocationId,
      traceId,
      spanId,
      parentSpanId,
      serviceId: this.serviceId,
      target,
      kind,
      correlationId,
      startedAt: telemetryNow(),
      resourcesStart: this.mode === 'standard' ? undefined : sampleResources(),
    };

    this.active.set(invocationId, active);

    return {
      invocationId,
      traceId,
      spanId,
      parentSpanId,
      end: (error?: unknown) => this.finish(active, error),
    };
  }

  reset(): void {
    this.samples.length = 0;
    this.active.clear();
    this.lastInvocationAt = undefined;
  }

  snapshot(): TelemetrySnapshot {
    const invocations = this.samples.slice();
    const durations = invocations.map((item) => item.durationMs);
    const successCount = invocations.filter((item) => item.status === 'completed').length;
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
      serviceId: this.serviceId,
      mode: this.mode,
      capturedAt: Date.now(),
      status: this.status(),
      totals: {
        invocationCount: invocations.length,
        successCount,
        errorCount: invocations.length - successCount,
        durationMs: percentiles(durations),
      },
      targets,
      activeInvocations: this.active.size,
      recentInvocations: invocations.slice(-this.maxRecentInvocations),
    };
  }

  functionality(name: string): TelemetryTargetStats | undefined {
    return this.snapshot().targets.find((target) => target.kind === 'functionality' && target.target === name);
  }

  functionalities(): TelemetryTargetStats[] {
    return this.snapshot().targets.filter((target) => target.kind === 'functionality');
  }

  private findTraceId(parentSpanId: string): string | undefined {
    for (let index = this.samples.length - 1; index >= 0; index -= 1) {
      if (this.samples[index].spanId === parentSpanId) return this.samples[index].traceId;
    }
    for (const active of this.active.values()) {
      if (active.spanId === parentSpanId) return active.traceId;
    }
    return undefined;
  }

  private finish(active: ActiveInvocation, error?: unknown): void {
    if (!this.active.delete(active.invocationId)) return;

    const completedAt = telemetryNow();
    const resourcesEnd = this.mode === 'standard' ? undefined : sampleResources();
    const invocation: TelemetryInvocation = {
      invocationId: active.invocationId,
      traceId: active.traceId,
      spanId: active.spanId,
      parentSpanId: active.parentSpanId,
      serviceId: active.serviceId,
      target: active.target,
      kind: active.kind,
      correlationId: active.correlationId,
      startedAt: active.startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt - active.startedAt),
      status: error === undefined ? 'completed' : 'failed',
      error: error === undefined ? undefined : {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
      },
      resources: active.resourcesStart && resourcesEnd
        ? { start: active.resourcesStart, end: resourcesEnd, delta: deltaResources(active.resourcesStart, resourcesEnd) }
        : undefined,
    };

    this.samples.push(invocation);
    if (this.samples.length > this.maxSamples) this.samples.splice(0, this.samples.length - this.maxSamples);
    this.lastInvocationAt = Date.now();
  }
}
