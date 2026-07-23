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
export declare class KrnlTelemetry {
    metrics: Map<string, TelemetryStats>;
    callLogs: Map<string, CallLogEntry[]>;
    libraryUsage: Map<string, LibraryUsageStats>;
    dataUsage: Map<string, DataUsageStats>;
    enabled: boolean;
    ringBufferSize: number;
    aiTraces: any[];
    totalAiCalls: number;
    totalAiRetries: number;
    avgAiLatencyMs: number;
    private runtimeStore;
    constructor();
    setRuntimeStore(store: any): void;
    recordAiTrace(trace: any): void;
    /**
     * Starts a telemetry trace for a specific functionality.
     * @param fid
     * @returns Trace data
     */
    startTrace(fid: string): TelemetryTrace;
    /**
     * Ends a telemetry trace and updates aggregated metrics.
     * @param fid
     * @param trace
     */
    endTrace(fid: string, trace: TelemetryTrace, success?: boolean): void;
    /**
     * Record library usage (functions/helpers).
     */
    recordLibraryCall(libraryId: string, durationMs: number): void;
    /**
     * Record library data access.
     */
    recordDataAccess(dataKey: string, type?: 'read' | 'write'): void;
    /**
     * Returns a snapshot of all metrics.
     */
    getSummary(): any;
    /**
     * Clears all collected metrics.
     */
    reset(): void;
}
export declare const telemetry: KrnlTelemetry;
//# sourceMappingURL=K_LIB_Krnl_Telemetry.d.ts.map