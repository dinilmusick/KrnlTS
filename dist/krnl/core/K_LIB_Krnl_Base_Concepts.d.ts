/**
 * @file K_LIB_Krnl_Base_Concepts.ts
 * @description These are building blocks for the basic structures that define the Krnl system.
 */
/**
 * Unified logger with support for synchronous flushing.
 */
export declare class Logger {
    static log(...args: any[]): void;
    static error(...args: any[]): void;
    static flush(): void;
}
/**
 * Enum Template Object
 */
declare const EnumTemplate: {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
};
/**
 * Creates an immutable enum object from a list of type names.
 * @param typeNames - An array of strings representing the enum type names.
 */
export declare function createEnum<T extends string>(typeNames: T[]): Readonly<Record<T, number> & typeof EnumTemplate>;
export declare const krnlSystemTypes: Readonly<Record<"qwnsr" | "brnda" | "symba" | "mosy", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
export declare const krnlServiceSuites: Readonly<Record<"UNIFIED_HTTP", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
/**
 * defaultConnectionBehaviour
 * Enum governing unlisted-port policy on an endpoint's access policy.
 *   0 = allow_unlisted   (open)
 *   1 = ask_key_unlisted (keyed)
 *   2 = forbid_unlisted  (restricted)
 */
export declare const defaultConnectionBehaviour: Readonly<Record<"allow_unlisted" | "ask_key_unlisted" | "forbid_unlisted", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
export declare const krnlServiceSuitePorts: Readonly<{
    readonly UNIFIED_HTTP: 1;
}>;
export declare const krnlPrimitiveDataTypes: Readonly<Record<"audio" | "control-signal" | "video" | "MIDI" | "OSC" | "text" | "trigger", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
export interface KrnlTraceContext {
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
export declare class krnlData implements KrnlTraceContext {
    isSignal: boolean;
    dataType: number;
    transportKind: "single" | "blob" | "stream";
    timestamp: number;
    correlationId: string | number | null;
    sourceId: string | number | null;
    tags: string[] | null;
    data: any;
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
export declare class krnlDataFactory {
    static audio(opts: {
        isSignal?: boolean;
        transportKind?: "single" | "blob" | "stream";
        codec?: string;
        sampleRate?: number;
        channels?: number;
        frameIndex?: number;
        buffer?: any;
        extra?: object;
    }): krnlData;
    static control(opts: {
        name: string;
        value: any;
        unit?: string | null;
        curve?: string;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
    static midi(opts: {
        status: number;
        data1: number;
        data2: number;
        channel?: number;
        raw?: any;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
    static text(opts: {
        text: string;
        encoding?: string;
        language?: string;
        contentType?: string;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
    static trigger(opts: {
        name: string;
        value?: number;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
}
/**
 * A minimalist policy structure for resilience (retries, timeouts).
 * Designed for cross-language portability.
 */
export declare class KrnlPolicy {
    maxRetries: number;
    timeoutMs: number;
    retryDelayMs: number;
    backoffStrategy: "LINEAR" | "EXPONENTIAL";
    constructor(opts?: Partial<KrnlPolicy>);
    static default(): KrnlPolicy;
    static resilient(): KrnlPolicy;
}
export {};
//# sourceMappingURL=K_LIB_Krnl_Base_Concepts.d.ts.map