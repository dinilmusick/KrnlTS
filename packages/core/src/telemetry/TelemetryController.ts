/**
 * @file TelemetryController.ts
 * @description Per-service telemetry recorder and public control surface.
 */

import { createTelemetryId, type ActiveInvocation } from './TelemetryInternals.js';
import { buildTelemetrySnapshot } from './TelemetrySnapshotBuilder.js';
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
  TelemetrySnapshot,
  TelemetryStatus,
} from './TelemetryTypes.js';



export class TelemetryController {
  private mode: TelemetryMode;
  private readonly maxSamples: number;
  private readonly maxRecentInvocations: number;
  private readonly samples: TelemetryInvocation[] = [];
  private readonly active = new Map<string, ActiveInvocation>();
  private totalInvocationCount = 0;
  private totalSuccessCount = 0;
  private totalErrorCount = 0;
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
      invocationCount: this.totalInvocationCount,
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

    const invocationId = createTelemetryId('inv');
    const spanId = createTelemetryId('span');
    const traceId = parentSpanId ? this.findTraceId(parentSpanId) ?? createTelemetryId('trace') : id('trace');
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
    this.totalInvocationCount = 0;
    this.totalSuccessCount = 0;
    this.totalErrorCount = 0;
    this.lastInvocationAt = undefined;
  }

  snapshot(): TelemetrySnapshot {
    return buildTelemetrySnapshot({
      serviceId: this.serviceId,
      mode: this.mode,
      invocations: this.samples,
      status: this.status(),
      totalInvocationCount: this.totalInvocationCount,
      totalSuccessCount: this.totalSuccessCount,
      totalErrorCount: this.totalErrorCount,
      activeInvocations: this.active.size,
      maxRecentInvocations: this.maxRecentInvocations,
    });
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
    this.totalInvocationCount += 1;
    if (invocation.status === 'completed') this.totalSuccessCount += 1;
    else this.totalErrorCount += 1;
    if (this.samples.length > this.maxSamples) this.samples.splice(0, this.samples.length - this.maxSamples);
    this.lastInvocationAt = Date.now();
  }
}
