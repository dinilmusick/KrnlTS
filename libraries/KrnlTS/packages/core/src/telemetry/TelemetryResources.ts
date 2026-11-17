/**
 * @file TelemetryResources.ts
 * @description Capability-detected runtime resource sampling.
 */

import type { TelemetryResourceSample } from './TelemetryTypes.js';

type ProcessLike = {
  memoryUsage?: () => {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    arrayBuffers?: number;
  };
  cpuUsage?: (previous?: { user: number; system: number }) => { user: number; system: number };
};

type PerformanceLike = {
  now?: () => number;
  eventLoopUtilization?: (previous?: unknown) => {
    active: number;
    idle: number;
    utilization: number;
  };
};

const runtimeProcess = typeof globalThis !== 'undefined'
  ? (globalThis as unknown as { process?: ProcessLike }).process
  : undefined;

const runtimePerformance = typeof globalThis !== 'undefined'
  ? (globalThis as unknown as { performance?: PerformanceLike }).performance
  : undefined;

export function telemetryNow(): number {
  return runtimePerformance?.now ? runtimePerformance.now() : Date.now();
}

export function sampleResources(): TelemetryResourceSample {
  const memory = runtimeProcess?.memoryUsage?.();
  const cpu = runtimeProcess?.cpuUsage?.();
  const eventLoop = runtimePerformance?.eventLoopUtilization?.();

  return {
    cpuUserMicros: cpu?.user,
    cpuSystemMicros: cpu?.system,
    heapUsedBytes: memory?.heapUsed,
    heapTotalBytes: memory?.heapTotal,
    rssBytes: memory?.rss,
    externalBytes: memory?.external,
    arrayBuffersBytes: memory?.arrayBuffers,
    eventLoopUtilization: eventLoop?.utilization,
    scope: memory || cpu || eventLoop ? 'process' : 'runtime',
  };
}

export function deltaResources(
  start: TelemetryResourceSample,
  end: TelemetryResourceSample
): TelemetryResourceSample {
  const delta = (a?: number, b?: number) =>
    a === undefined || b === undefined ? undefined : b - a;

  return {
    cpuUserMicros: delta(start.cpuUserMicros, end.cpuUserMicros),
    cpuSystemMicros: delta(start.cpuSystemMicros, end.cpuSystemMicros),
    heapUsedBytes: delta(start.heapUsedBytes, end.heapUsedBytes),
    heapTotalBytes: delta(start.heapTotalBytes, end.heapTotalBytes),
    rssBytes: delta(start.rssBytes, end.rssBytes),
    externalBytes: delta(start.externalBytes, end.externalBytes),
    arrayBuffersBytes: delta(start.arrayBuffersBytes, end.arrayBuffersBytes),
    eventLoopUtilization: delta(start.eventLoopUtilization, end.eventLoopUtilization),
    scope: start.scope,
  };
}
