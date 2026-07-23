/**
 * K_LIB_Krnl_Telemetry
 * A lightweight, high-precision telemetry engine for KrnlJS.
 * Tracks latency, frequency, and resource usage per functionality ID.
 */
export class KrnlTelemetry {
    metrics;
    callLogs;
    libraryUsage;
    dataUsage;
    enabled;
    ringBufferSize;
    aiTraces;
    totalAiCalls;
    totalAiRetries;
    avgAiLatencyMs;
    runtimeStore = null;
    constructor() {
        this.metrics = new Map();
        this.callLogs = new Map();
        this.libraryUsage = new Map();
        this.dataUsage = new Map();
        this.enabled = false;
        this.ringBufferSize = 100;
        this.aiTraces = [];
        this.totalAiCalls = 0;
        this.totalAiRetries = 0;
        this.avgAiLatencyMs = 0;
    }
    setRuntimeStore(store) {
        this.runtimeStore = store;
    }
    recordAiTrace(trace) {
        if (this.aiTraces.length >= this.ringBufferSize) {
            this.aiTraces.shift();
        }
        this.aiTraces.push(trace);
        this.totalAiCalls++;
        this.totalAiRetries += trace.retryCount || 0;
        this.avgAiLatencyMs = (this.avgAiLatencyMs * (this.totalAiCalls - 1) + trace.latencyMs) / this.totalAiCalls;
        if (this.runtimeStore) {
            this.runtimeStore.appendTelemetry({
                type: "ai_trace",
                endpointId: trace.endpointId,
                timestamp: trace.timestamp,
                latencyMs: trace.latencyMs,
                retryCount: trace.retryCount,
                success: !trace.failureReason,
                failures: trace.validationFailures
            }).catch(() => { });
        }
    }
    /**
     * Starts a telemetry trace for a specific functionality.
     * @param fid
     * @returns Trace data
     */
    startTrace(fid) {
        return {
            startTime: process.hrtime.bigint(),
            startMemory: process.memoryUsage ? process.memoryUsage().heapUsed : 0
        };
    }
    /**
     * Ends a telemetry trace and updates aggregated metrics.
     * @param fid
     * @param trace
     */
    endTrace(fid, trace, success = true) {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
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
        if (!success)
            stats.errors++;
        stats.totalLatencyNs += latencyNs;
        stats.totalMemoryDelta += memoryDelta;
        stats.avgLatencyMs = (stats.totalLatencyNs / stats.calls) / 1_000_000;
        stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
        if (latencyMs > stats.peakLatencyMs)
            stats.peakLatencyMs = latencyMs;
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
        if (this.runtimeStore) {
            this.runtimeStore.appendTelemetry({
                type: "standard_call",
                endpointId: fid,
                timestamp: Date.now(),
                durationMs: latencyMs,
                success
            }).catch(() => { });
        }
    }
    /**
     * Record library usage (functions/helpers).
     */
    recordLibraryCall(libraryId, durationMs) {
        if (!this.enabled)
            return;
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
    recordDataAccess(dataKey, type = 'read') {
        if (!this.enabled)
            return;
        let stats = this.dataUsage.get(dataKey);
        if (!stats) {
            stats = { reads: 0, writes: 0 };
            this.dataUsage.set(dataKey, stats);
        }
        if (type === 'read')
            stats.reads++;
        else
            stats.writes++;
    }
    /**
     * Returns a snapshot of all metrics.
     */
    getSummary() {
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
    reset() {
        this.metrics.clear();
        this.callLogs.clear();
        this.libraryUsage.clear();
        this.dataUsage.clear();
    }
}
// Export a default shared instance for standard app usage
export const telemetry = new KrnlTelemetry();
//# sourceMappingURL=K_LIB_Krnl_Telemetry.js.map