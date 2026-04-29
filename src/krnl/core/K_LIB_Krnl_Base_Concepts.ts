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
  static log(...args: any[]): void {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }

  static error(...args: any[]): void {
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args);
    this.flush();
  }

  static flush(): void {
    if (typeof process !== 'undefined') {
      try {
        // Force synchronous flush of stdout and stderr
        if (process.stdout && typeof process.stdout.fd === 'number') fs.fsyncSync(process.stdout.fd);
        if (process.stderr && typeof process.stderr.fd === 'number') fs.fsyncSync(process.stderr.fd);
      } catch (e) {
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
  types: [] as string[],
  listTypes(): readonly string[] {
    return Object.freeze([...this.types]);
  },
  getTypeID(typeName: string): number {
    return (this as any)[typeName] !== undefined ? (this as any)[typeName] : -1;
  },
};

/**
 * Creates an immutable enum object from a list of type names.
 * @param typeNames - An array of strings representing the enum type names.
 */
export function createEnum<T extends string>(typeNames: T[]): Readonly<Record<T, number> & typeof EnumTemplate> {
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

export const krnlServiceSuitePorts = Object.freeze({
  UNIFIED_HTTP: 1
} as const);

//////////////////////////////////////// KRNL PRIMITIVE DATA TYPES ////////////////////////////////////////
export const krnlPrimitiveDataTypes = createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"]);

//////////////////////////////////////// KRNL DATA ////////////////////////////////////////
export class krnlData {
  // --- Transport semantics ---
  isSignal: boolean = false; 
  dataType: number = 0; 
  transportKind: "single" | "blob" | "stream" = "single"; 

  // --- Cross-cutting metadata ---
  timestamp: number = 0; 
  correlationId: string | number | null = null;
  sourceId: string | number | null = null;
  tags: string[] | null = null; 

  // --- Type-specific payload ---
  data: any = null; 

  // --- Tracing metadata aligned with core lingo ---
  sourceEmitterAddress: string | null = null;
  targetCollectorAddress: string | null = null;
  traceCorrelationId: string | null = null;
  originSystemAddress: string | null = null;
}

//////////////////////////////////////// KRNL DATA FACTORY ////////////////////////////////////////
export class krnlDataFactory {
  static audio(opts: {
    isSignal?: boolean,
    transportKind?: "single" | "blob" | "stream",
    codec?: string,
    sampleRate?: number,
    channels?: number,
    frameIndex?: number,
    buffer?: any,
    extra?: object
  }): krnlData {
    const {
      isSignal = true,
      transportKind = "stream",
      codec = "pcm16",
      sampleRate = 44100,
      channels = 2,
      frameIndex = 0,
      buffer,
      extra = {}
    } = opts;

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

  static control(opts: {
    name: string,
    value: any,
    unit?: string | null,
    curve?: string,
    transportKind?: "single" | "blob" | "stream",
    isSignal?: boolean,
    extra?: object
  }): krnlData {
    const {
      name,
      value,
      unit = null,
      curve = "linear",
      transportKind = "single",
      isSignal = false,
      extra = {}
    } = opts;

    const d = new krnlData();
    d.isSignal = isSignal;
    d.transportKind = transportKind;
    d.dataType = krnlPrimitiveDataTypes.getTypeID("control-signal");
    d.data = { name, value, unit, curve, ...extra };
    return d;
  }

  static midi(opts: {
    status: number, data1: number, data2: number,
    channel?: number,
    raw?: any,
    transportKind?: "single" | "blob" | "stream",
    isSignal?: boolean,
    extra?: object
  }): krnlData {
    const {
      status, data1, data2,
      channel = 0,
      raw = null,
      transportKind = "single",
      isSignal = false,
      extra = {}
    } = opts;

    const d = new krnlData();
    d.isSignal = isSignal;
    d.transportKind = transportKind;
    d.dataType = krnlPrimitiveDataTypes.getTypeID("MIDI");
    d.data = { status, data1, data2, channel, raw, ...extra };
    return d;
  }

  static text(opts: {
    text: string,
    encoding?: string,
    language?: string,
    contentType?: string,
    transportKind?: "single" | "blob" | "stream",
    isSignal?: boolean,
    extra?: object
  }): krnlData {
    const {
      text,
      encoding = "utf-8",
      language = "en",
      contentType = "plain",
      transportKind = "single",
      isSignal = false,
      extra = {}
    } = opts;

    const d = new krnlData();
    d.isSignal = isSignal;
    d.transportKind = transportKind;
    d.dataType = krnlPrimitiveDataTypes.getTypeID("text");
    d.data = { text, encoding, language, contentType, ...extra };
    return d;
  }

  static trigger(opts: {
    name: string,
    value?: number,
    transportKind?: "single" | "blob" | "stream",
    isSignal?: boolean,
    extra?: object
  }): krnlData {
    const {
      name,
      value = 1,
      transportKind = "single",
      isSignal = false,
      extra = {}
    } = opts;

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
  maxRetries: number = 0;
  timeoutMs: number = 5000;
  retryDelayMs: number = 1000;
  backoffStrategy: "LINEAR" | "EXPONENTIAL" = "LINEAR";

  constructor(opts: Partial<KrnlPolicy> = {}) {
    Object.assign(this, opts);
  }

  static default(): KrnlPolicy {
    return new KrnlPolicy();
  }

  static resilient(): KrnlPolicy {
    return new KrnlPolicy({ maxRetries: 3, timeoutMs: 10000, retryDelayMs: 1000, backoffStrategy: "EXPONENTIAL" });
  }
}
