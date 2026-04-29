import { z } from "zod";

export interface KrnlFunctionality<I = any, O = any> {
    id: string;
    api: (input: I, context: { entity: any, state: any }) => Promise<O>;
    schema?: z.ZodType<I>;
    visibility?: "public" | "private" | "protected";
    description?: string;
}

export interface KrnlPeer {
    id: string;
    address: string;
    lastSeen: number;
    tags?: string[];
    capabilities?: string[];
}

export interface TelemetrySnapshot {
    calls: number;
    errors: number;
    avgLatencyMs: number;
    peakLatencyMs: number;
    avgMemoryDelta: number;
}
