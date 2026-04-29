/**
 * K_LIB_Krnl_Telemetry
 * A lightweight, high-precision telemetry engine for KrnlJS.
 * Tracks latency, frequency, and resource usage per functionality ID.
 */

export interface TelemetryStats {
    calls: number;
    errors: number;
    totalLatencyNs: number;
    avgLatencyMs: number;
    peakLatencyMs: number;
    totalMemoryDelta: number;
    avgMemoryDelta: number;
    lastUpdated: number;
}

export interface TelemetryTrace {
    startTime: bigint;
    startMemory: number;
}

export class KrnlTelemetry {
  metrics: Map<string, TelemetryStats>;
  enabled: boolean;

  constructor() {
    this.metrics = new Map<string, TelemetryStats>();
    this.enabled = false;
  }

  /**
   * Starts a telemetry trace for a specific functionality.
   * @param fid 
   * @returns Trace data
   */
  startTrace(fid: string): TelemetryTrace {
    return {
      startTime: process.hrtime.bigint(),
      startMemory: (process as any).memoryUsage ? (process as any).memoryUsage().heapUsed : 0
    };
  }

  /**
   * Ends a telemetry trace and updates aggregated metrics.
   * @param fid 
   * @param trace 
   */
  endTrace(fid: string, trace: TelemetryTrace, success: boolean = true): void {
    const endTime = process.hrtime.bigint();
    const endMemory = (process as any).memoryUsage ? (process as any).memoryUsage().heapUsed : 0;

    const latencyNs = Number(endTime - trace.startTime);
    const memoryDelta = endMemory - trace.startMemory;

    let stats = this.metrics.get(fid);
    if (!stats) {
      stats = {
        calls: 0,
        errors: 0,
        totalLatencyNs: 0,
        avgLatencyMs: 0,
        peakLatencyMs: 0,
        totalMemoryDelta: 0,
        avgMemoryDelta: 0,
        lastUpdated: 0
      };
      this.metrics.set(fid, stats);
    }

    stats.calls++;
    if (!success) stats.errors++;
    stats.totalLatencyNs += latencyNs;
    stats.totalMemoryDelta += memoryDelta;

    const latencyMs = latencyNs / 1_000_000;
    stats.avgLatencyMs = (stats.totalLatencyNs / stats.calls) / 1_000_000;
    stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
    
    if (latencyMs > stats.peakLatencyMs) stats.peakLatencyMs = latencyMs;
    stats.lastUpdated = Date.now();
  }

  /**
   * Returns a snapshot of all metrics.
   */
  getSummary(): Record<string, TelemetryStats> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clears all collected metrics.
   */
  reset(): void {
    this.metrics.clear();
  }
}

// Export a default shared instance for standard app usage
export const telemetry = new KrnlTelemetry();
