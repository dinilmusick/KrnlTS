// src/krnl/core/K_LIB_Krnl_Base_Concepts.js
import fs from "fs";
var Logger = class {
  static log(...args) {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}]`, ...args);
  }
  static error(...args) {
    console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] ERROR:`, ...args);
    this.flush();
  }
  static flush() {
    if (typeof process !== "undefined") {
      try {
        if (process.stdout && typeof process.stdout.fd === "number")
          fs.fsyncSync(process.stdout.fd);
        if (process.stderr && typeof process.stderr.fd === "number")
          fs.fsyncSync(process.stderr.fd);
      } catch (e) {
      }
    }
  }
};
var EnumTemplate = {
  types: [],
  listTypes() {
    return Object.freeze([...this.types]);
  },
  getTypeID(typeName) {
    return this[typeName] !== void 0 ? this[typeName] : -1;
  }
};
function createEnum(typeNames) {
  const enumObj = Object.create(EnumTemplate);
  enumObj.types = typeNames;
  typeNames.forEach((name, index) => {
    enumObj[name] = index;
  });
  return Object.freeze(enumObj);
}
var krnlSystemTypes = createEnum(["qwnsr", "brnda", "symba", "mosy"]);
var krnlServiceSuites = createEnum(["UNIFIED_HTTP"]);
var defaultConnectionBehaviour = createEnum([
  "allow_unlisted",
  "ask_key_unlisted",
  "forbid_unlisted"
]);
var krnlServiceSuitePorts = Object.freeze({
  UNIFIED_HTTP: 1
});
var krnlPrimitiveDataTypes = createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"]);
var krnlData = class {
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
};
var krnlDataFactory = class {
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
};
var KrnlPolicy = class _KrnlPolicy {
  maxRetries = 0;
  timeoutMs = 5e3;
  retryDelayMs = 1e3;
  backoffStrategy = "LINEAR";
  constructor(opts = {}) {
    if (opts.maxRetries !== void 0)
      this.maxRetries = opts.maxRetries;
    if (opts.timeoutMs !== void 0)
      this.timeoutMs = opts.timeoutMs;
    if (opts.retryDelayMs !== void 0)
      this.retryDelayMs = opts.retryDelayMs;
    if (opts.backoffStrategy !== void 0)
      this.backoffStrategy = opts.backoffStrategy;
  }
  static default() {
    return new _KrnlPolicy();
  }
  static resilient() {
    return new _KrnlPolicy({ maxRetries: 3, timeoutMs: 1e4, retryDelayMs: 1e3, backoffStrategy: "EXPONENTIAL" });
  }
};

export {
  Logger,
  createEnum,
  krnlSystemTypes,
  krnlServiceSuites,
  defaultConnectionBehaviour,
  krnlServiceSuitePorts,
  krnlPrimitiveDataTypes,
  krnlData,
  krnlDataFactory,
  KrnlPolicy
};
