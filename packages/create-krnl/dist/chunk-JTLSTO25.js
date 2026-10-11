// ../core/dist/chunk-K54K2KZW.js
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
        if (process.stdout && typeof process.stdout.fd === "number") fs.fsyncSync(process.stdout.fd);
        if (process.stderr && typeof process.stderr.fd === "number") fs.fsyncSync(process.stderr.fd);
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
var KrnlPolicy = class _KrnlPolicy {
  maxRetries = 0;
  timeoutMs = 5e3;
  retryDelayMs = 1e3;
  backoffStrategy = "LINEAR";
  constructor(opts = {}) {
    if (opts.maxRetries !== void 0) this.maxRetries = opts.maxRetries;
    if (opts.timeoutMs !== void 0) this.timeoutMs = opts.timeoutMs;
    if (opts.retryDelayMs !== void 0) this.retryDelayMs = opts.retryDelayMs;
    if (opts.backoffStrategy !== void 0) this.backoffStrategy = opts.backoffStrategy;
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
  KrnlPolicy
};
