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

export interface CallLogEntry {
    timestamp: number;
    durationMs: number;
    success: boolean;
}

export interface LibraryUsageStats {
    calls: number;
    totalDurationMs: number;
    avgDurationMs: number;
}

export interface DataUsageStats {
    reads: number;
    writes: number;
}

export class KrnlTelemetry {
  metrics: Map<string, TelemetryStats>;
  callLogs: Map<string, CallLogEntry[]>;
  libraryUsage: Map<string, LibraryUsageStats>;
  dataUsage: Map<string, DataUsageStats>;
  enabled: boolean;
  ringBufferSize: number;

  constructor() {
    this.metrics = new Map<string, TelemetryStats>();
    this.callLogs = new Map<string, CallLogEntry[]>();
    this.libraryUsage = new Map<string, LibraryUsageStats>();
    this.dataUsage = new Map<string, DataUsageStats>();
    this.enabled = false;
    this.ringBufferSize = 100;
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
    const latencyMs = latencyNs / 1_000_000;

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

    stats.avgLatencyMs = (stats.totalLatencyNs / stats.calls) / 1_000_000;
    stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
    
    if (latencyMs > stats.peakLatencyMs) stats.peakLatencyMs = latencyMs;
    stats.lastUpdated = Date.now();

    // Log call entry to ring buffer
    if (this.enabled) {
      let logs = this.callLogs.get(fid);
      if (!logs) {
        logs = [];
        this.callLogs.set(fid, logs);
      }
      logs.push({
        timestamp: Date.now(),
        durationMs: latencyMs,
        success
      });
      if (logs.length > this.ringBufferSize) {
        logs.shift();
      }
    }
  }

  /**
   * Record library usage (functions/helpers).
   */
  recordLibraryCall(libraryId: string, durationMs: number): void {
    if (!this.enabled) return;
    let stats = this.libraryUsage.get(libraryId);
    if (!stats) {
      stats = { calls: 0, totalDurationMs: 0, avgDurationMs: 0 };
      this.libraryUsage.set(libraryId, stats);
    }
    stats.calls++;
    stats.totalDurationMs += durationMs;
    stats.avgDurationMs = stats.totalDurationMs / stats.calls;
  }

  /**
   * Record library data access.
   */
  recordDataAccess(dataKey: string, type: 'read' | 'write' = 'read'): void {
    if (!this.enabled) return;
    let stats = this.dataUsage.get(dataKey);
    if (!stats) {
      stats = { reads: 0, writes: 0 };
      this.dataUsage.set(dataKey, stats);
    }
    if (type === 'read') stats.reads++;
    else stats.writes++;
  }

  /**
   * Returns a snapshot of all metrics.
   */
  getSummary(): any {
    return {
      metrics: Object.fromEntries(this.metrics),
      callLogs: Object.fromEntries(this.callLogs),
      libraryUsage: Object.fromEntries(this.libraryUsage),
      dataUsage: Object.fromEntries(this.dataUsage)
    };
  }

  /**
   * Clears all collected metrics.
   */
  reset(): void {
    this.metrics.clear();
    this.callLogs.clear();
    this.libraryUsage.clear();
    this.dataUsage.clear();
  }
}

// Export a default shared instance for standard app usage
export const telemetry = new KrnlTelemetry();
