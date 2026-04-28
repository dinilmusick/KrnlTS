/**
 * K_LIB_Krnl_Telemetry
 * A lightweight, high-precision telemetry engine for KrnlJS.
 * Tracks latency, frequency, and resource usage per functionality ID.
 */
export class KrnlTelemetry {
  constructor() {
    this.metrics = new Map();
    this.enabled = false;
  }

  /**
   * Starts a telemetry trace for a specific functionality.
   * @param {string} fid 
   * @returns {object} Trace data
   */
  startTrace(fid) {
    return {
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage ? process.memoryUsage().heapUsed : 0
    };
  }

  /**
   * Ends a telemetry trace and updates aggregated metrics.
   * @param {string} fid 
   * @param {object} trace 
   */
  endTrace(fid, trace, success = true) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

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
  getSummary() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clears all collected metrics.
   */
  reset() {
    this.metrics.clear();
  }
}

// Export a default shared instance for standard app usage
export const telemetry = new KrnlTelemetry();
