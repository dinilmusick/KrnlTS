//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Base_Concepts.js
 * @description These are building blocks for the basic structures that define the Krnl system.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// CREATE ENUM ////////////////////////////////////////
/**
 * Enum Template Object :
 * Template enum "class"
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
 * @param {string[]} typeNames - An array of strings representing the enum type names.
 * @returns {Readonly<object>} An immutable enum object.
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
export const krnlSystemTypes = Object.freeze(
  createEnum(["qwnsr", "brnda", "symba", "mosy"])
);

//////////////////////////////////////// KRNL SERVICE SUITES ////////////////////////////////////////
export const krnlServiceSuites = Object.freeze(
  createEnum(["UNIFIED_HTTP"])
);

export const krnlServiceSuitePorts = Object.freeze({
  UNIFIED_HTTP: 1
});

//////////////////////////////////////// KRNL PRIMITIVE DATA TYPES ////////////////////////////////////////
export const krnlPrimitiveDataTypes = Object.freeze(
  createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"])
);

//////////////////////////////////////// KRNL DATA ////////////////////////////////////////
export class krnlData {
  // --- Transport semantics ---
  isSignal = false; // boolean: stream-like vs discrete
  dataType = 0; // enum index: ["audio","control-signal","video","MIDI","OSC","text","trigger",...]
  transportKind = "single"; // "single" | "blob" | "stream"

  // --- Cross-cutting metadata ---
  timestamp = 0; // logical time
  correlationId = null; // string | number | null
  sourceId = null; // string | number | null
  tags = null; // optional string[] (can stay null on MCUs)

  // --- Type-specific payload ---
  data = null; // payload object / buffer / frame
};

//////////////////////////////////////// KRNL DATA FACTORY ////////////////////////////////////////
export class krnlDataFactory {
  static audio(opts) {
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

  static control(opts) {
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

  static midi(opts) {
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

  static text(opts) {
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

  static trigger(opts) {
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
