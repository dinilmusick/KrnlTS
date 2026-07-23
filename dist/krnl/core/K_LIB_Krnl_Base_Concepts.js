import fs from 'fs';
//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Base_Concepts.ts
 * @description These are building blocks for the basic structures that define the Krnl system.
 */
//////////////////////////////////////// LOGGER UTILITY ////////////////////////////////////////
/**
 * Unified logger with support for synchronous flushing.
 */
export class Logger {
    static log(...args) {
        console.log(`[${new Date().toISOString()}]`, ...args);
    }
    static error(...args) {
        console.error(`[${new Date().toISOString()}] ERROR:`, ...args);
        this.flush();
    }
    static flush() {
        if (typeof process !== 'undefined') {
            try {
                // Force synchronous flush of stdout and stderr
                if (process.stdout && typeof process.stdout.fd === 'number')
                    fs.fsyncSync(process.stdout.fd);
                if (process.stderr && typeof process.stderr.fd === 'number')
                    fs.fsyncSync(process.stderr.fd);
            }
            catch (e) {
                // Some environments don't support fsyncSync on stdout/stderr
            }
        }
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// CREATE ENUM ////////////////////////////////////////
/**
 * Enum Template Object
 */
const EnumTemplate = {
    types: [],
    listTypes() {
        return Object.freeze([...this.types]);
    },
    getTypeID(typeName) {
        return this[typeName] !== undefined ? this[typeName] : -1;
    },
};
/**
 * Creates an immutable enum object from a list of type names.
 * @param typeNames - An array of strings representing the enum type names.
 */
export function createEnum(typeNames) {
    const enumObj = Object.create(EnumTemplate);
    enumObj.types = typeNames;
    typeNames.forEach((name, index) => {
        enumObj[name] = index;
    });
    return Object.freeze(enumObj);
}
//////////////////////////////////////// KRNL SYSTEM TYPES ////////////////////////////////////////
export const krnlSystemTypes = createEnum(["qwnsr", "brnda", "symba", "mosy"]);
//////////////////////////////////////// KRNL SERVICE SUITES ////////////////////////////////////////
export const krnlServiceSuites = createEnum(["UNIFIED_HTTP"]);
//////////////////////////////////////// ENDPOINT ACCESS CONTROL ////////////////////////////////////////
/**
 * defaultConnectionBehaviour
 * Enum governing unlisted-port policy on an endpoint's access policy.
 *   0 = allow_unlisted   (open)
 *   1 = ask_key_unlisted (keyed)
 *   2 = forbid_unlisted  (restricted)
 */
export const defaultConnectionBehaviour = createEnum([
    'allow_unlisted',
    'ask_key_unlisted',
    'forbid_unlisted',
]);
export const krnlServiceSuitePorts = Object.freeze({
    UNIFIED_HTTP: 1
});
//////////////////////////////////////// KRNL PRIMITIVE DATA TYPES ////////////////////////////////////////
export const krnlPrimitiveDataTypes = createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"]);
//////////////////////////////////////// KRNL DATA ////////////////////////////////////////
export class krnlData {
    // --- Transport semantics ---
    isSignal = false;
    dataType = 0;
    transportKind = "single";
    // --- Cross-cutting metadata ---
    timestamp = 0;
    correlationId = null;
    sourceId = null;
    tags = null;
    // --- Type-specific payload ---
    data = null;
    // --- Tracing metadata aligned with core lingo ---
    sourceEmitterAddress = null;
    targetCollectorAddress = null;
    traceCorrelationId = null;
    originSystemAddress = null;
}
//////////////////////////////////////// KRNL DATA FACTORY ////////////////////////////////////////
export class krnlDataFactory {
    static audio(opts) {
        const { isSignal = true, transportKind = "stream", codec = "pcm16", sampleRate = 44100, channels = 2, frameIndex = 0, buffer, extra = {} } = opts;
        const d = new krnlData();
        d.isSignal = isSignal;
        d.transportKind = transportKind;
        d.dataType = krnlPrimitiveDataTypes.getTypeID("audio");
        d.data = {
            codec,
            sampleRate,
            channels,
            frameIndex,
            length: buffer?.length ?? 0,
            buffer,
            ...extra
        };
        return d;
    }
    static control(opts) {
        const { name, value, unit = null, curve = "linear", transportKind = "single", isSignal = false, extra = {} } = opts;
        const d = new krnlData();
        d.isSignal = isSignal;
        d.transportKind = transportKind;
        d.dataType = krnlPrimitiveDataTypes.getTypeID("control-signal");
        d.data = { name, value, unit, curve, ...extra };
        return d;
    }
    static midi(opts) {
        const { status, data1, data2, channel = 0, raw = null, transportKind = "single", isSignal = false, extra = {} } = opts;
        const d = new krnlData();
        d.isSignal = isSignal;
        d.transportKind = transportKind;
        d.dataType = krnlPrimitiveDataTypes.getTypeID("MIDI");
        d.data = { status, data1, data2, channel, raw, ...extra };
        return d;
    }
    static text(opts) {
        const { text, encoding = "utf-8", language = "en", contentType = "plain", transportKind = "single", isSignal = false, extra = {} } = opts;
        const d = new krnlData();
        d.isSignal = isSignal;
        d.transportKind = transportKind;
        d.dataType = krnlPrimitiveDataTypes.getTypeID("text");
        d.data = { text, encoding, language, contentType, ...extra };
        return d;
    }
    static trigger(opts) {
        const { name, value = 1, transportKind = "single", isSignal = false, extra = {} } = opts;
        const d = new krnlData();
        d.isSignal = isSignal;
        d.transportKind = transportKind;
        d.dataType = krnlPrimitiveDataTypes.getTypeID("trigger");
        d.data = { name, value, ...extra };
        return d;
    }
}
//////////////////////////////////////// KRNL POLICY ////////////////////////////////////////
/**
 * A minimalist policy structure for resilience (retries, timeouts).
 * Designed for cross-language portability.
 */
export class KrnlPolicy {
    maxRetries = 0;
    timeoutMs = 5000;
    retryDelayMs = 1000;
    backoffStrategy = "LINEAR";
    constructor(opts = {}) {
        if (opts.maxRetries !== undefined)
            this.maxRetries = opts.maxRetries;
        if (opts.timeoutMs !== undefined)
            this.timeoutMs = opts.timeoutMs;
        if (opts.retryDelayMs !== undefined)
            this.retryDelayMs = opts.retryDelayMs;
        if (opts.backoffStrategy !== undefined)
            this.backoffStrategy = opts.backoffStrategy;
    }
    static default() {
        return new KrnlPolicy();
    }
    static resilient() {
        return new KrnlPolicy({ maxRetries: 3, timeoutMs: 10000, retryDelayMs: 1000, backoffStrategy: "EXPONENTIAL" });
    }
}
//# sourceMappingURL=K_LIB_Krnl_Base_Concepts.js.map