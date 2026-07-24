"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/krnl/core/K_LIB_Krnl_Error_Concepts.ts
var krnlErrorCodes, krnlErrorMessages, CUSTOM_ERROR_CODE, krnlError;
var init_K_LIB_Krnl_Error_Concepts = __esm({
  "src/krnl/core/K_LIB_Krnl_Error_Concepts.ts"() {
    "use strict";
    krnlErrorCodes = Object.freeze({
      // Enum errors (0-99)
      ENUM_ID_NOT_FOUND: -1,
      // State errors (100-199)
      STATE_NOT_FOUND: 100,
      STATE_DUPLICATE_NAME: 101,
      STATE_INDEX_OUT_OF_RANGE: 102,
      // Functionality errors (200-299)
      FUNCTIONALITY_NOT_DEFINED: 200,
      FUNCTIONALITY_ALREADY_DEFINED: 201,
      FUNCTIONALITY_INSTANCE_NOT_FOUND: 202,
      REMOTE_EXECUTION_FAILED: 203,
      // Interface errors (300-399)
      EMITTER_NOT_FOUND: 300,
      COLLECTOR_NOT_FOUND: 301,
      COLLECTOR_NOT_SUBSCRIBED: 302,
      // Hierarchy errors (400-499)
      ENTITY_NOT_FOUND: 400,
      // Networking/RPC errors (500-599)
      ERR_NET_RPC_TIMEOUT_EXCEEDED: 500,
      ERR_NET_RPC_NETWORK_ERROR: 501,
      ERR_NET_RPC_INTERNAL_SERVER_ERROR: 502,
      ERR_SYS_ENTITY_BUSY_RESERVED: 503,
      ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504,
      ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505
    });
    krnlErrorMessages = Object.freeze({
      // Enum
      [krnlErrorCodes.ENUM_ID_NOT_FOUND]: "ERR_LIB_ENUM_ID_NOT_FOUND",
      // State
      [krnlErrorCodes.STATE_NOT_FOUND]: "ERR_LIB_STATE_NOT_FOUND",
      [krnlErrorCodes.STATE_DUPLICATE_NAME]: "ERR_LIB_STATE_DUPLICATE_NAME",
      [krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE]: "ERR_LIB_STATE_INDEX_OUT_OF_RANGE",
      // Functionality
      [krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED]: "ERR_LIB_FUNCTIONALITY_NOT_DEFINED",
      [krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED]: "ERR_LIB_FUNCTIONALITY_ALREADY_DEFINED",
      [krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND]: "ERR_LIB_FUNCTIONALITY_INSTANCE_NOT_FOUND",
      [krnlErrorCodes.REMOTE_EXECUTION_FAILED]: "ERR_LIB_REMOTE_EXECUTION_FAILED",
      // Interface
      [krnlErrorCodes.EMITTER_NOT_FOUND]: "ERR_INT_EMITTER_NOT_FOUND",
      [krnlErrorCodes.COLLECTOR_NOT_FOUND]: "ERR_INT_COLLECTOR_NOT_FOUND",
      [krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED]: "ERR_INT_COLLECTOR_NOT_SUBSCRIBED",
      // Hierarchy
      [krnlErrorCodes.ENTITY_NOT_FOUND]: "ERR_SYS_ENTITY_NOT_FOUND",
      // Networking/RPC
      [krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED]: "ERR_NET_RPC_TIMEOUT_EXCEEDED",
      [krnlErrorCodes.ERR_NET_RPC_NETWORK_ERROR]: "ERR_NET_RPC_NETWORK_ERROR",
      [krnlErrorCodes.ERR_NET_RPC_INTERNAL_SERVER_ERROR]: "ERR_NET_RPC_INTERNAL_SERVER_ERROR",
      [krnlErrorCodes.ERR_SYS_ENTITY_BUSY_RESERVED]: "ERR_SYS_ENTITY_BUSY_RESERVED",
      [krnlErrorCodes.ERR_COM_INGRESS_ROUTE_NOT_FOUND]: "ERR_COM_INGRESS_ROUTE_NOT_FOUND",
      [krnlErrorCodes.ERR_KRNL_UNRESOLVED_REMOTE_TARGET]: "ERR_KRNL_UNRESOLVED_REMOTE_TARGET"
    });
    CUSTOM_ERROR_CODE = -999;
    krnlError = class extends Error {
      code;
      errorMessage;
      constructor(code) {
        const isNumeric = typeof code === "number";
        const numericCode = isNumeric ? code : CUSTOM_ERROR_CODE;
        const message = isNumeric ? krnlErrorMessages[numericCode] ?? `Error: ${code}` : code;
        super(message);
        this.code = numericCode;
        this.errorMessage = this.message;
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Messaging_Concepts.ts
var krnlGlobalEmitterAddress, krnlLocalEmitterAddress, krnlMessage, krnlEmitter, krnlCollector, krnlInterface;
var init_K_LIB_Krnl_Messaging_Concepts = __esm({
  "src/krnl/core/K_LIB_Krnl_Messaging_Concepts.ts"() {
    "use strict";
    init_K_LIB_Krnl_Error_Concepts();
    krnlGlobalEmitterAddress = class {
      systemID = 0;
      // ["qwnsr", "brnda", "symba", "mosy"]
      subSystemID = 0;
      // ["qwnsrControl", "qwnsrBlocks"]
      entityAddress = [];
      // nesting of type
      emitterID = 0;
    };
    krnlLocalEmitterAddress = class {
      isOwnerEntity = true;
      siblingID = 0;
      emitterID = 0;
    };
    krnlMessage = class {
      data = null;
      timestamp = 0;
      // Tracing metadata aligned with core lingo
      sourceEmitterAddress = null;
      targetCollectorAddress = null;
      traceCorrelationId = null;
      originSystemAddress = null;
    };
    krnlEmitter = class {
      subscribers;
      localAddress;
      constructor() {
        this.subscribers = [];
        this.localAddress = null;
      }
      /**
       * Pushes data into the emitter and notifies all subscribers.
       */
      pushDataStreamToEmitter(data, time = {}, transform = (msg) => msg) {
        const msg = new krnlMessage();
        msg.data = data;
        msg.timestamp = typeof time === "number" ? time : time?.timestamp || Date.now();
        const transformed = transform(msg);
        for (let i = 0; i < this.subscribers.length; i++) {
          this.subscribers[i](transformed);
        }
      }
      /**
       * Subscribes a handler to this emitter. Handler is called on every push.
       */
      subscribe(handler) {
        this.subscribers.push(handler);
        return () => {
          const idx = this.subscribers.indexOf(handler);
          if (idx >= 0) this.subscribers.splice(idx, 1);
        };
      }
      /**
       * Subscribes once and auto-unsubscribes after first message.
       */
      subscribeOnce(handler) {
        let unsubscribe = null;
        const wrapped = (msg) => {
          if (unsubscribe) unsubscribe();
          handler(msg);
        };
        unsubscribe = this.subscribe(wrapped);
        return unsubscribe;
      }
      /**
       * Resets the emitter and removes all subscribers.
       */
      disconnectEmitter() {
        this.subscribers = [];
      }
    };
    krnlCollector = class {
      emitter;
      unsubscribe;
      _directHandler;
      constructor() {
        this.emitter = null;
        this.unsubscribe = null;
      }
      /**
       * Subscribes this collector to an emitter. Messages are forwarded to the handler.
       */
      subscribeTo(emitter, handler = null, options = {}) {
        const { mode = "stream" } = options;
        const resolvedHandler = typeof handler === "function" ? handler : (msg) => {
          if (typeof this._directHandler === "function") {
            return this._directHandler(msg);
          }
          return msg;
        };
        this.disconnectCollector();
        this.emitter = emitter;
        this.unsubscribe = mode === "once" ? emitter.subscribeOnce(resolvedHandler) : emitter.subscribe(resolvedHandler);
        return this.unsubscribe;
      }
      /**
       * Collects a single message from the emitter and auto-disconnects.
       */
      collectNext(emitter, timeoutMs = null) {
        return new Promise((resolve, reject) => {
          let timeout = null;
          const cleanup = () => {
            if (timeout) clearTimeout(timeout);
            this.disconnectCollector();
          };
          this.subscribeTo(emitter, (msg) => {
            cleanup();
            resolve(msg);
          }, { mode: "once" });
          if (typeof timeoutMs === "number" && timeoutMs > 0) {
            timeout = setTimeout(() => {
              cleanup();
              reject(new Error(`Collector timeout after ${timeoutMs}ms`));
            }, timeoutMs);
          }
        });
      }
      /**
       * Pipes messages from a connected emitter through a transform function.
       */
      pipeTo(target, fn) {
        const pipeEmitter = new krnlEmitter();
        this.emitter = pipeEmitter;
        const unsub = pipeEmitter.subscribe((msg) => {
          fn(msg);
        });
        this.unsubscribe = unsub;
        return () => {
          this.disconnectCollector();
        };
      }
      /**
       * Pushes data directly into this collector's connected emitter.
       */
      pushDataStreamToEmitter(data) {
        if (this.emitter === null) {
          throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED);
        }
        this.emitter.pushDataStreamToEmitter(data);
      }
      /**
       * Disconnects from the current emitter.
       */
      disconnectCollector() {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
          this.emitter = null;
        }
      }
    };
    krnlInterface = class {
      ownerEntity;
      emitters;
      collectors;
      constructor(ownerEntity) {
        this.ownerEntity = ownerEntity;
        this.emitters = /* @__PURE__ */ new Map();
        this.collectors = /* @__PURE__ */ new Map();
      }
      /**
       * Creates and registers a new emitter.
       */
      createEmitter(name) {
        const emitter = new krnlEmitter();
        this.emitters.set(name, emitter);
        emitter.localAddress = {
          isOwnerEntity: false,
          siblingID: 0,
          emitterID: this.emitters.size - 1
        };
        return emitter;
      }
      /**
       * Creates and registers a new collector.
       */
      createCollector(name) {
        const collector = new krnlCollector();
        this.collectors.set(name, collector);
        return collector;
      }
      /**
       * Gets an emitter by name.
       */
      getEmitter(name) {
        const emitter = this.emitters.get(name);
        if (!emitter) throw new krnlError(krnlErrorCodes.EMITTER_NOT_FOUND);
        return emitter;
      }
      /**
       * Gets a collector by name.
       */
      getCollector(name) {
        const collector = this.collectors.get(name);
        if (!collector) throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_FOUND);
        return collector;
      }
      /**
       * Removes an emitter by name.
       */
      removeEmitter(name) {
        const emitter = this.emitters.get(name);
        if (emitter) {
          emitter.disconnectEmitter();
          this.emitters.delete(name);
        }
      }
      /**
       * Removes a collector by name.
       */
      removeCollector(name) {
        const collector = this.collectors.get(name);
        if (collector) {
          collector.disconnectCollector();
          this.collectors.delete(name);
        }
      }
      /**
       * Gets all emitters in scope (self + owner + siblings).
       */
      getEmittersInScope() {
        const interfaces = this.getInterfacesInScope();
        const result = [];
        for (let i = 0; i < interfaces.length; i++) {
          for (const emitter of interfaces[i].emitters.values()) {
            result.push(emitter);
          }
        }
        return result;
      }
      /**
       * Gets all interfaces in scope (self, owner, and siblings).
       */
      getInterfacesInScope() {
        const owner = this.ownerEntity.hierarchyManager ? this.ownerEntity.hierarchyManager.getOwnerEntity() : null;
        if (!owner) return [this];
        const scopes = [this];
        if (owner.interface) scopes.push(owner.interface);
        const siblings = owner.hierarchyManager ? owner.hierarchyManager.getAllOwnedComponentEntities() : [];
        for (let i = 0; i < siblings.length; i++) {
          if (siblings[i] !== this.ownerEntity && siblings[i].interface) {
            scopes.push(siblings[i].interface);
          }
        }
        return scopes;
      }
      /**
       * Disconnects all emitters and collectors.
       */
      dispose() {
        for (const emitter of this.emitters.values()) {
          emitter.disconnectEmitter();
        }
        for (const collector of this.collectors.values()) {
          collector.disconnectCollector();
        }
        this.emitters.clear();
        this.collectors.clear();
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Entity_Compositional_Hierarchy.ts
var krnlEntityCompositionalHierarchyManager;
var init_K_LIB_Krnl_Entity_Compositional_Hierarchy = __esm({
  "src/krnl/core/K_LIB_Krnl_Entity_Compositional_Hierarchy.ts"() {
    "use strict";
    krnlEntityCompositionalHierarchyManager = class {
      self;
      owner;
      EntityClass;
      ownedComponents;
      componentBaseNames;
      componentInstanceCounters;
      /**
       * @param self - The entity this manager belongs to.
       * @param owner - The parent entity (if any).
       * @param EntityClass - Reference to the Entity base class for instantiation.
       */
      constructor(self, owner, EntityClass) {
        this.self = self;
        this.owner = owner;
        this.EntityClass = EntityClass;
        this.ownedComponents = /* @__PURE__ */ new Map();
        this.componentBaseNames = /* @__PURE__ */ new Map();
        this.componentInstanceCounters = /* @__PURE__ */ new Map();
      }
      /**
       * Spawns a unique component entity within this host.
       */
      createComponentEntity(name, CustomClass = null, options = {}) {
        const ClassToUse = CustomClass || this.EntityClass;
        const shouldBeSingleton = options.Singleton ?? ClassToUse.Singleton ?? true;
        if (shouldBeSingleton && this.ownedComponents.has(name)) {
          return this.ownedComponents.get(name);
        }
        const currentCount = this.componentInstanceCounters.get(name) || 0;
        const nextCount = currentCount + 1;
        this.componentInstanceCounters.set(name, nextCount);
        const resolvedName = shouldBeSingleton ? name : `${name}#${nextCount}`;
        const newEntity = new ClassToUse(resolvedName, this.self, {
          Singleton: shouldBeSingleton,
          baseName: name,
          instanceNumber: nextCount
        });
        this.ownedComponents.set(resolvedName, newEntity);
        const group = this.componentBaseNames.get(name) || [];
        group.push(newEntity);
        this.componentBaseNames.set(name, group);
        if (this.self._onComponentAdded) {
          this.self._onComponentAdded(newEntity);
        }
        return newEntity;
      }
      /**
       * Registers a pre-existing entity instance as a component of this host.
       */
      addComponentEntityInstance(instance) {
        this.ownedComponents.set(instance.id, instance);
        instance.hierarchyManager.owner = this.self;
        const base = instance.baseName || instance.id;
        const group = this.componentBaseNames.get(base) || [];
        group.push(instance);
        this.componentBaseNames.set(base, group);
        if (instance._promoteAllExistingFunctionalities) {
          instance._promoteAllExistingFunctionalities();
        }
      }
      /**
       * Returns a list of all component entities owned by this host.
       */
      getAllOwnedComponentEntities() {
        return Array.from(this.ownedComponents.values());
      }
      /**
       * Returns all component entity instances created from the same base component name.
       */
      getOwnedComponentEntitiesByName(name) {
        return [...this.componentBaseNames.get(name) || []];
      }
      /**
       * Returns the parent entity.
       */
      getOwnerEntity() {
        return this.owner;
      }
      /**
       * Recursively disposes of all owned components.
       */
      dispose() {
        this.ownedComponents.forEach((entity) => {
          if (entity.dispose) entity.dispose();
        });
        this.ownedComponents.clear();
        this.componentBaseNames.clear();
        this.componentInstanceCounters.clear();
      }
      /**
       * Disposes a specific component instance by ID/name.
       */
      disposeComponentEntity(entityId) {
        const entity = this.ownedComponents.get(entityId);
        if (!entity) return false;
        if (entity.dispose) entity.dispose();
        this.ownedComponents.delete(entityId);
        const base = entity.baseName || entity.entityName;
        const group = this.componentBaseNames.get(base) || [];
        this.componentBaseNames.set(base, group.filter((e) => e !== entity));
        return true;
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Telemetry.ts
var K_LIB_Krnl_Telemetry_exports = {};
__export(K_LIB_Krnl_Telemetry_exports, {
  KrnlTelemetry: () => KrnlTelemetry,
  telemetry: () => telemetry
});
var KrnlTelemetry, telemetry;
var init_K_LIB_Krnl_Telemetry = __esm({
  "src/krnl/core/K_LIB_Krnl_Telemetry.ts"() {
    "use strict";
    KrnlTelemetry = class {
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
        this.metrics = /* @__PURE__ */ new Map();
        this.callLogs = /* @__PURE__ */ new Map();
        this.libraryUsage = /* @__PURE__ */ new Map();
        this.dataUsage = /* @__PURE__ */ new Map();
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
          }).catch(() => {
          });
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
        const latencyMs = latencyNs / 1e6;
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
        stats.avgLatencyMs = stats.totalLatencyNs / stats.calls / 1e6;
        stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
        if (latencyMs > stats.peakLatencyMs) stats.peakLatencyMs = latencyMs;
        stats.lastUpdated = Date.now();
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
          }).catch(() => {
          });
        }
      }
      /**
       * Record library usage (functions/helpers).
       */
      recordLibraryCall(libraryId, durationMs) {
        if (!this.enabled) return;
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
      recordDataAccess(dataKey, type = "read") {
        if (!this.enabled) return;
        let stats = this.dataUsage.get(dataKey);
        if (!stats) {
          stats = { reads: 0, writes: 0 };
          this.dataUsage.set(dataKey, stats);
        }
        if (type === "read") stats.reads++;
        else stats.writes++;
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
    };
    telemetry = new KrnlTelemetry();
  }
});

// src/krnl/tools/ObjectKit.js
var ObjectKit;
var init_ObjectKit = __esm({
  "src/krnl/tools/ObjectKit.js"() {
    "use strict";
    ObjectKit = class _ObjectKit {
      /**
       * Structurally deep clones an object with circular dependency check.
       */
      static deepClone(obj, seen = /* @__PURE__ */ new Map()) {
        if (obj === null || typeof obj !== "object") {
          return obj;
        }
        if (seen.has(obj)) {
          return seen.get(obj);
        }
        if (obj instanceof Date) {
          return new Date(obj.getTime());
        }
        if (obj instanceof RegExp) {
          return new RegExp(obj.source, obj.flags);
        }
        if (Array.isArray(obj)) {
          const cloneArr = [];
          seen.set(obj, cloneArr);
          for (const item of obj) {
            cloneArr.push(_ObjectKit.deepClone(item, seen));
          }
          return cloneArr;
        }
        const cloneObj = Object.create(Object.getPrototypeOf(obj));
        seen.set(obj, cloneObj);
        for (const key of Reflect.ownKeys(obj)) {
          const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
          if (descriptor) {
            descriptor.value = _ObjectKit.deepClone(descriptor.value, seen);
            Object.defineProperty(cloneObj, key, descriptor);
          }
        }
        return cloneObj;
      }
      /**
       * Recursively deep merges override objects into a base.
       */
      static deepMerge(base, ...overrides) {
        let result = _ObjectKit.deepClone(base);
        for (const override of overrides) {
          if (override === null || typeof override !== "object") {
            continue;
          }
          for (const key of Object.keys(override)) {
            const val = override[key];
            if (val === void 0) {
              delete result[key];
            } else if (val && typeof val === "object" && !Array.isArray(val)) {
              if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
                result[key] = _ObjectKit.deepMerge(result[key], val);
              } else {
                result[key] = _ObjectKit.deepClone(val);
              }
            } else {
              result[key] = _ObjectKit.deepClone(val);
            }
          }
        }
        return result;
      }
      /**
       * Performs a strict structural equality check.
       */
      static deepEqual(a, b) {
        if (Object.is(a, b))
          return true;
        if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
          return false;
        }
        if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
          return false;
        }
        if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime();
        }
        if (a instanceof RegExp && b instanceof RegExp) {
          return a.toString() === b.toString();
        }
        const keysA = Reflect.ownKeys(a);
        const keysB = Reflect.ownKeys(b);
        if (keysA.length !== keysB.length)
          return false;
        const setB = new Set(keysB);
        for (const key of keysA) {
          if (!setB.has(key))
            return false;
          if (!_ObjectKit.deepEqual(a[key], b[key]))
            return false;
        }
        return true;
      }
      /**
       * Performs an object diff between before and after states.
       */
      static objectDiff(before, after) {
        const added = {};
        const removed = {};
        const changed = {};
        if (before === null || typeof before !== "object" || after === null || typeof after !== "object") {
          return { added, removed, changed };
        }
        const keysBefore = Object.keys(before);
        const keysAfter = Object.keys(after);
        for (const key of keysAfter) {
          if (!(key in before)) {
            added[key] = _ObjectKit.deepClone(after[key]);
          } else if (!_ObjectKit.deepEqual(before[key], after[key])) {
            if (before[key] && typeof before[key] === "object" && after[key] && typeof after[key] === "object" && !Array.isArray(before[key]) && !Array.isArray(after[key])) {
              const nested = _ObjectKit.objectDiff(before[key], after[key]);
              if (Object.keys(nested.added).length > 0 || Object.keys(nested.removed).length > 0 || Object.keys(nested.changed).length > 0) {
                changed[key] = nested;
              }
            } else {
              changed[key] = { from: _ObjectKit.deepClone(before[key]), to: _ObjectKit.deepClone(after[key]) };
            }
          }
        }
        for (const key of keysBefore) {
          if (!(key in after)) {
            removed[key] = _ObjectKit.deepClone(before[key]);
          }
        }
        return { added, removed, changed };
      }
      /**
       * Accesses an in-memory object by dot-notation.
       */
      static getPath(obj, path14, defaultValue) {
        if (!path14)
          return obj;
        const parts = path14.split(".");
        let current = obj;
        for (const part of parts) {
          if (current === null || current === void 0) {
            return defaultValue;
          }
          current = current[part];
        }
        return current !== void 0 ? current : defaultValue;
      }
      /**
       * Mutates or sets an in-memory object by dot-notation.
       */
      static setPath(obj, path14, value) {
        if (!path14)
          return obj;
        const parts = path14.split(".");
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (current[part] === void 0 || current[part] === null) {
            current[part] = {};
          }
          current = current[part];
        }
        current[parts[parts.length - 1]] = value;
        return obj;
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Functionality_Types.ts
function cloneState(source) {
  return ObjectKit.deepClone(source);
}
var krnlTransportAdapter, MemoryTransportAdapter, krnlLocalFunctionality, krnlRemoteFunctionality;
var init_K_LIB_Krnl_Functionality_Types = __esm({
  "src/krnl/core/K_LIB_Krnl_Functionality_Types.ts"() {
    "use strict";
    init_K_LIB_Krnl_Messaging_Concepts();
    init_K_LIB_Krnl_Telemetry();
    init_ObjectKit();
    krnlTransportAdapter = class {
    };
    MemoryTransportAdapter = class extends krnlTransportAdapter {
      targetEntity;
      constructor(targetEntity) {
        super();
        this.targetEntity = targetEntity;
      }
      async call(targetFunction, input, opts) {
        if (!this.targetEntity || typeof this.targetEntity.call !== "function") {
          throw new Error("MemoryTransportAdapter: Invalid target entity.");
        }
        return await this.targetEntity.call(targetFunction, input, opts);
      }
    };
    krnlLocalFunctionality = class {
      id;
      visibility;
      initialState;
      api;
      isLocal = true;
      sourcePath;
      helpers;
      emitters;
      schema;
      description;
      method;
      tests;
      examples;
      intelligenceSpec;
      /** Port-based access control policy. Absent = unrestricted. */
      accessPolicy;
      /** Shared secret for allow_with_key / ask_key_unlisted gates. */
      accessKey;
      lifecycle;
      state;
      hostEntity;
      intention;
      ai;
      constructor(config = {}) {
        const {
          id,
          visibility = "public",
          // Default: public (bubbles up)
          initialState = {},
          api = (input) => input,
          helpers = {},
          emitters = {},
          events = {},
          schema = null,
          onMount = null,
          onTeardown = null,
          sourcePath = null,
          accessPolicy = null,
          accessKey = null,
          tests = []
        } = config;
        if (!id) throw new Error("LocalFunctionality requires an ID.");
        this.id = id;
        this.visibility = visibility;
        this.initialState = initialState;
        this.api = api;
        this.sourcePath = sourcePath;
        this.helpers = new Map(Object.entries(helpers));
        this.emitters = /* @__PURE__ */ new Map();
        this.schema = schema;
        this.description = config.description || "";
        this.method = config.method || "POST";
        this.tests = tests;
        this.examples = config.examples || null;
        this.intention = config.intention || null;
        this.intelligenceSpec = config.intelligenceSpec || null;
        if (accessPolicy) this.accessPolicy = accessPolicy;
        if (accessKey) this.accessKey = accessKey;
        this.lifecycle = {
          beginning: onMount || events.beginning,
          during: events.during,
          end: events.end,
          failure: events.failure,
          teardown: onTeardown || events.teardown
        };
        if (!emitters["state:changed"]) {
          this.emitters.set("state:changed", new krnlEmitter());
        }
        Object.entries(emitters).forEach(([eid, e]) => {
          this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
        });
        this.state = this._createObservedState(cloneState(initialState));
      }
      _createObservedState(initialState) {
        const self = this;
        const proxyCache = /* @__PURE__ */ new WeakMap();
        const handler = {
          get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === "object" && value !== null) {
              if (!proxyCache.has(value)) {
                proxyCache.set(value, new Proxy(value, handler));
              }
              return proxyCache.get(value);
            }
            return value;
          },
          set(target, prop, value, receiver) {
            const result = Reflect.set(target, prop, value, receiver);
            if (result) {
              self._notifyStateChanged(prop, value);
            }
            return result;
          },
          deleteProperty(target, prop) {
            const result = Reflect.deleteProperty(target, prop);
            if (result) {
              self._notifyStateChanged(prop, void 0);
            }
            return result;
          }
        };
        return new Proxy(initialState, handler);
      }
      _notifyStateChanged(prop, value) {
        const stateEmitter = this.emitters.get("state:changed");
        if (stateEmitter) {
          stateEmitter.pushDataStreamToEmitter({
            prop,
            value,
            state: this.state,
            // This is the proxied state
            functionalityId: this.id
          });
        }
      }
      /**
       * Updates the visibility and handles interface registration/deregistration.
       * This is the mechanism used to STOP bubbling at a certain level.
       */
      setVisibility(v) {
        const oldVisibility = this.visibility;
        this.visibility = v;
        if (!this.hostEntity) return;
        if (oldVisibility === "private" && v === "public") {
          this._registerInInterface();
          const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
          if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
        } else if (oldVisibility === "public" && v === "private") {
          this._unregisterFromInterface();
          const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
          if (owner && owner._onComponentFunctionalityRemoved) {
            owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
          }
        }
      }
      _unregisterFromInterface() {
        const entity = this.hostEntity;
        if (!entity) return;
        entity.interface.removeCollector(this.id);
        this.emitters.forEach((_, eid) => {
          entity.interface.removeEmitter(`${this.id}:${eid}`);
        });
      }
      _registerInInterface() {
        const entity = this.hostEntity;
        const mainCollector = entity.interface.createCollector(this.id);
        mainCollector._directHandler = async (msg) => {
          const caller = msg.metadata?.caller || "anonymous";
          return await this.execute(msg.data, { caller });
        };
        this.emitters.forEach((emitter, eid) => {
          const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${eid}`);
          emitter.subscribe((msg) => interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time));
        });
      }
      /**
       * checkAccess — port-based access gate.
       *
       * f(p, k) ∈ { PASS, REJECT }
       *   FORBID  if p ∈ P_forbid
       *   PASS    if p ∈ P_allow
       *   KEY(k)  if p ∈ P_allow_with_key
       *   default_connection_behaviour(p, k)   otherwise (unlisted)
       */
      checkAccess(callerPort, key) {
        const p = this.accessPolicy;
        if (!p) return { allowed: true };
        if (p.forbid.includes(callerPort))
          return { allowed: false, reason: `Port ${callerPort} is explicitly forbidden from accessing this endpoint.` };
        if (p.allow.includes(callerPort))
          return { allowed: true };
        if (p.allow_with_key.includes(callerPort)) {
          if (key && key === this.accessKey) return { allowed: true };
          return {
            allowed: false,
            reason: key ? `Invalid access key for port ${callerPort}.` : `Port ${callerPort} requires an access key (x-krnl-access-key header).`
          };
        }
        switch (p.default_connection_behaviour) {
          case "allow_unlisted":
            return { allowed: true };
          case "ask_key_unlisted":
            if (key && key === this.accessKey) return { allowed: true };
            return {
              allowed: false,
              reason: key ? `Invalid access key for this endpoint.` : `This endpoint requires an access key. Provide it via the 'x-krnl-access-key' header.`
            };
          case "forbid_unlisted":
            return { allowed: false, reason: `Port ${callerPort} is not permitted. This is a restricted (internal) endpoint.` };
        }
      }
      bindToEntity(entity) {
        this.hostEntity = entity;
        if (this.visibility === "public") {
          this._registerInInterface();
        }
        if (typeof this.lifecycle.beginning === "function") {
          this.lifecycle.beginning({
            state: this.state,
            emitters: this.emitters,
            helpers: this.helpers,
            entity: this.hostEntity,
            functionality: this
          });
        }
        return this;
      }
      teardown() {
        if (typeof this.lifecycle.teardown === "function") {
          this.lifecycle.teardown({
            state: this.state,
            emitters: this.emitters,
            helpers: this.helpers,
            entity: this.hostEntity,
            functionality: this
          });
        }
      }
      async execute(input, opts = {}) {
        const caller = opts.caller || "default";
        const activeState = this.state;
        const activeTelemetry = this.hostEntity?.telemetry || telemetry;
        const trace = activeTelemetry.enabled ? activeTelemetry.startTrace(this.id) : null;
        if (this.accessPolicy && opts.callerPort !== void 0) {
          const access = this.checkAccess(opts.callerPort, opts.accessKey);
          if (!access.allowed) {
            if (trace) activeTelemetry.endTrace(this.id, trace, false);
            return { status: "error", message: `[AccessDenied] ${access.reason}`, payload: null };
          }
        }
        if (this.schema && this.schema.input) {
          try {
            if (typeof this.schema.input.verify === "function") {
              const verifyError = this.schema.input.verify(input);
              if (verifyError) {
                throw new Error(`Protobuf verification failed: ${verifyError}`);
              }
            } else if (typeof this.schema.input.parse === "function") {
              input = this.schema.input.parse(input);
            } else if (typeof this.schema.input === "function") {
              if (!this.schema.input(input)) {
                throw new Error(`Input validation failed.`);
              }
            }
          } catch (err) {
            const msg = err.errors ? JSON.stringify(err.errors) : err.message;
            throw new Error(`[KrnlSchemaError] Input validation failed for "${this.id}": ${msg}`);
          }
        }
        try {
          if (typeof this.lifecycle.during === "function") {
            this.lifecycle.during({ input, opts, state: activeState, entity: this.hostEntity });
          }
          let result = await this.api(input, {
            state: activeState,
            emitters: this.emitters,
            helpers: this.helpers,
            entity: this.hostEntity,
            functionality: this,
            caller
          });
          if (this.schema && this.schema.output) {
            try {
              if (typeof this.schema.output.verify === "function") {
                const verifyError = this.schema.output.verify(result);
                if (verifyError) {
                  console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": Protobuf verification failed: ${verifyError}`);
                }
              } else if (typeof this.schema.output.parse === "function") {
                this.schema.output.parse(result);
              } else if (typeof this.schema.output === "function") {
                if (!this.schema.output(result)) {
                  console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}".`);
                }
              }
            } catch (err) {
              const msg = err.errors ? JSON.stringify(err.errors) : err.message;
              console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": ${msg}`);
            }
          }
          if (trace) activeTelemetry.endTrace(this.id, trace, true);
          const interactionEvent = {
            type: "frontend:interaction",
            fid: this.id,
            timestamp: Date.now(),
            input,
            output: result
          };
          const stateEmitter = this.emitters.get("state:changed");
          stateEmitter?.pushDataStreamToEmitter(interactionEvent);
          let rootSystem = this.hostEntity;
          while (rootSystem && !rootSystem._frontend) {
            rootSystem = rootSystem.hierarchyManager?.getOwnerEntity?.();
          }
          const frontend = rootSystem?._frontend;
          if (frontend) {
            frontend.interactionsHistory.push(interactionEvent);
            if (frontend.interactionsHistory.length > 50) {
              frontend.interactionsHistory.shift();
            }
          }
          return {
            status: "success",
            payload: result
          };
        } catch (err) {
          if (trace) activeTelemetry.endTrace(this.id, trace, false);
          const interactionEvent = {
            type: "frontend:interaction",
            fid: this.id,
            timestamp: Date.now(),
            input,
            output: { status: "error", message: err.message, payload: null }
          };
          const stateEmitter = this.emitters.get("state:changed");
          stateEmitter?.pushDataStreamToEmitter(interactionEvent);
          let rootSystem = this.hostEntity;
          while (rootSystem && !rootSystem._frontend) {
            rootSystem = rootSystem.hierarchyManager?.getOwnerEntity?.();
          }
          const frontend = rootSystem?._frontend;
          if (frontend) {
            frontend.interactionsHistory.push(interactionEvent);
            if (frontend.interactionsHistory.length > 50) {
              frontend.interactionsHistory.shift();
            }
          }
          if (typeof this.lifecycle.failure === "function") {
            this.lifecycle.failure({ error: err, input, caller });
          }
          return {
            status: "error",
            message: err.message,
            payload: null
          };
        }
      }
    };
    krnlRemoteFunctionality = class {
      id;
      targetFunction;
      targetEntity;
      visibility;
      isLocal = false;
      transport;
      hostEntity;
      constructor(config = {}) {
        const { id, targetEntity, targetFunction, transport, visibility = "public" } = config;
        this.id = id;
        this.targetFunction = targetFunction || id;
        this.targetEntity = targetEntity;
        this.visibility = visibility;
        if (transport) {
          this.transport = transport;
        } else if (targetEntity) {
          this.transport = new MemoryTransportAdapter(targetEntity);
        } else {
          throw new Error("RemoteFunctionality requires either a transport or a targetEntity.");
        }
      }
      setVisibility(v) {
        const oldVisibility = this.visibility;
        this.visibility = v;
        if (this.hostEntity && oldVisibility === "private" && v === "public") {
          this._registerInInterface();
          const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
          if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
        } else if (this.hostEntity && oldVisibility === "public" && v === "private") {
          this._unregisterFromInterface();
          const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
          if (owner && owner._onComponentFunctionalityRemoved) {
            owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
          }
        }
      }
      _unregisterFromInterface() {
        if (!this.hostEntity) return;
        this.hostEntity.interface.removeCollector(this.id);
      }
      _registerInInterface() {
        const mainCollector = this.hostEntity.interface.createCollector(this.id);
        mainCollector._directHandler = async (msg) => {
          const caller = msg.metadata?.caller || "anonymous";
          return await this.execute(msg.data, { caller });
        };
      }
      bindToEntity(entity) {
        this.hostEntity = entity;
        if (this.visibility === "public") {
          this._registerInInterface();
        }
      }
      async execute(input, opts = {}) {
        return await this.transport.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
      }
    };
  }
});

// src/krnl/core/K_ENT_Krnl_Entity_Base.ts
var krnlEntityBase;
var init_K_ENT_Krnl_Entity_Base = __esm({
  "src/krnl/core/K_ENT_Krnl_Entity_Base.ts"() {
    "use strict";
    init_K_LIB_Krnl_Messaging_Concepts();
    init_K_LIB_Krnl_Entity_Compositional_Hierarchy();
    init_K_LIB_Krnl_Functionality_Types();
    init_K_LIB_Krnl_Error_Concepts();
    init_K_LIB_Krnl_Telemetry();
    krnlEntityBase = class _krnlEntityBase {
      __krnlEntityInstance;
      id;
      entityName;
      Singleton;
      baseName;
      instanceNumber;
      telemetry;
      _telemetryEnabled = false;
      get telemetryEnabled() {
        return this._telemetryEnabled;
      }
      set telemetryEnabled(val) {
        this._telemetryEnabled = val;
        this.telemetry.enabled = val;
      }
      systemType = "BaseEntity";
      interface;
      localFunctionalities;
      remoteFunctionalities;
      collectors;
      hierarchyManager;
      intention;
      // Extension points for decorators/middleware
      async _decorateResult(result, fid, input) {
        return result;
      }
      async _decorateError(error, fid, input) {
        return error;
      }
      /**
       * @param name - The unique identity of the entity.
       * @param owner - The parent entity (if any).
       */
      constructor(name, owner = null, options = {}) {
        this.__krnlEntityInstance = true;
        this.id = name || "UnnamedEntity";
        this.entityName = this.id;
        this.Singleton = options.Singleton ?? this.constructor.Singleton ?? true;
        this.baseName = options.baseName || this.entityName;
        this.instanceNumber = options.instanceNumber || 1;
        this.telemetry = new KrnlTelemetry();
        this.telemetryEnabled = options.telemetryEnabled || false;
        this.intention = options.intention || null;
        this.interface = new krnlInterface(this);
        this.localFunctionalities = /* @__PURE__ */ new Map();
        this.remoteFunctionalities = /* @__PURE__ */ new Map();
        this.collectors = /* @__PURE__ */ new Set();
        this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
          this,
          // Host.
          owner,
          // Parent.
          _krnlEntityBase
          // Base class for nesting.
        );
      }
      /**
       * Registers a local logic block.
       * If the functionality is 'public', it is automatically promoted to the owner.
       */
      addLocal(localFunctionality) {
        const functionality = localFunctionality instanceof krnlLocalFunctionality ? localFunctionality : new krnlLocalFunctionality(localFunctionality);
        functionality.bindToEntity(this);
        this.localFunctionalities.set(functionality.id, functionality);
        const owner = this.hierarchyManager.getOwnerEntity();
        if (owner && owner._onComponentFunctionalityAdded) {
          owner._onComponentFunctionalityAdded(this, functionality);
        }
        return functionality;
      }
      /**
       * Registers a proxy for a functionality on another entity.
       * If the proxy is 'public', it is promoted to the owner (Recursive Bubbling).
       */
      addRemote(remoteFunctionality) {
        const functionality = remoteFunctionality instanceof krnlRemoteFunctionality ? remoteFunctionality : new krnlRemoteFunctionality(remoteFunctionality);
        functionality.bindToEntity(this);
        this.remoteFunctionalities.set(functionality.id, functionality);
        const owner = this.hierarchyManager.getOwnerEntity();
        if (owner && owner._onComponentFunctionalityAdded) {
          owner._onComponentFunctionalityAdded(this, functionality);
        }
        return functionality;
      }
      /**
       * INTERFACE PROMOTION
       * Handles the automatic bubbling of component logic to the owner.
       */
      _onComponentFunctionalityAdded(component, functionality) {
        if (component._isIngressNetworkMember) return;
        if (functionality.visibility !== "public") return;
        const existing = this.remoteFunctionalities.get(functionality.id);
        if (existing) {
          existing.targetEntity = component;
          existing.targetFunction = functionality.id;
          return;
        }
        this.addRemote({
          id: functionality.id,
          targetEntity: component,
          targetFunction: functionality.id,
          visibility: "public"
          // Bubbles up further by default.
        });
      }
      /**
       * Removes a promoted remote functionality and recursively propagates removal upward.
       */
      _onComponentFunctionalityRemoved(component, functionalityId) {
        const existing = this.remoteFunctionalities.get(functionalityId);
        if (!existing) return;
        if (existing.targetEntity !== component) return;
        this.remoteFunctionalities.delete(functionalityId);
        const owner = this.hierarchyManager.getOwnerEntity();
        if (owner && owner._onComponentFunctionalityRemoved) {
          owner._onComponentFunctionalityRemoved(this, functionalityId);
        }
      }
      /**
       * Internal helper to trigger promotion of all existing functionalities.
       */
      _promoteAllExistingFunctionalities() {
        const owner = this.hierarchyManager.getOwnerEntity();
        if (!owner || !owner._onComponentFunctionalityAdded) return;
        this.localFunctionalities.forEach((f) => {
          owner._onComponentFunctionalityAdded(this, f);
        });
        this.remoteFunctionalities.forEach((f) => {
          owner._onComponentFunctionalityAdded(this, f);
        });
      }
      /**
       * Executes a functionality by ID.
       */
      async call(fid, input, opts = {}) {
        const unwrap = opts.unwrap !== false;
        try {
          let result;
          if (this.localFunctionalities.has(fid)) {
            result = await this.localFunctionalities.get(fid).execute(input, opts);
          } else if (this.remoteFunctionalities.has(fid)) {
            result = await this.remoteFunctionalities.get(fid).execute(input, opts);
          } else {
            throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
          }
          result = await this._decorateResult(result, fid, input);
          if (unwrap && result && typeof result === "object" && result.status === "success" && "payload" in result && !result.skipUnwrap) {
            return result.payload;
          }
          if (result && typeof result === "object" && result.status === "error") {
            throw new krnlError(result.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
          }
          return result;
        } catch (err) {
          let finalErr = err;
          finalErr = await this._decorateError(err, fid, input);
          if (finalErr && typeof finalErr === "object" && finalErr.status === "error") {
            const wrapper = new krnlError(finalErr.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
            Object.assign(wrapper, finalErr);
            throw wrapper;
          }
          throw finalErr;
        }
      }
      getLocal(fid) {
        return this.localFunctionalities.get(fid);
      }
      getRemote(fid) {
        return this.remoteFunctionalities.get(fid);
      }
      resolveLocalFunctionality(fid) {
        if (this.localFunctionalities.has(fid)) {
          return this.localFunctionalities.get(fid);
        }
        let current = this.remoteFunctionalities.get(fid);
        const visited = /* @__PURE__ */ new Set();
        while (current) {
          if (visited.has(current)) {
            break;
          }
          visited.add(current);
          if (current.isLocal) {
            return current;
          }
          if (current.transport && current.transport.targetEntity) {
            const target = current.transport.targetEntity;
            const targetFid = current.targetFunction;
            if (target.localFunctionalities && target.localFunctionalities.has(targetFid)) {
              return target.localFunctionalities.get(targetFid);
            }
            if (target.remoteFunctionalities && target.remoteFunctionalities.has(targetFid)) {
              current = target.remoteFunctionalities.get(targetFid);
              continue;
            }
          }
          break;
        }
        return null;
      }
      addChild(instance) {
        return this.hierarchyManager.addComponentEntityInstance(instance);
      }
      getTelemetry() {
        const summary = this.telemetry.getSummary();
        return {
          entity: this.entityName,
          timestamp: Date.now(),
          metrics: summary.metrics,
          callLogs: summary.callLogs,
          libraryUsage: summary.libraryUsage,
          dataUsage: summary.dataUsage
        };
      }
      disposeOwnedComponent(entityId) {
        return this.hierarchyManager.disposeComponentEntity(entityId);
      }
      dispose() {
        if (this.hierarchyManager) this.hierarchyManager.dispose();
        if (this.interface) this.interface.dispose();
        this.localFunctionalities.forEach((func) => {
          if (typeof func.teardown === "function") {
            func.teardown();
          }
        });
        this.localFunctionalities.clear();
        this.remoteFunctionalities.clear();
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Base_Concepts.ts
function createEnum(typeNames) {
  const enumObj = Object.create(EnumTemplate);
  enumObj.types = typeNames;
  typeNames.forEach((name, index) => {
    enumObj[name] = index;
  });
  return Object.freeze(enumObj);
}
var import_fs, Logger, EnumTemplate, krnlSystemTypes, krnlServiceSuites, defaultConnectionBehaviour, krnlServiceSuitePorts, krnlPrimitiveDataTypes, krnlData, krnlDataFactory, KrnlPolicy;
var init_K_LIB_Krnl_Base_Concepts = __esm({
  "src/krnl/core/K_LIB_Krnl_Base_Concepts.ts"() {
    "use strict";
    import_fs = __toESM(require("fs"), 1);
    Logger = class {
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
            if (process.stdout && typeof process.stdout.fd === "number") import_fs.default.fsyncSync(process.stdout.fd);
            if (process.stderr && typeof process.stderr.fd === "number") import_fs.default.fsyncSync(process.stderr.fd);
          } catch (e) {
          }
        }
      }
    };
    EnumTemplate = {
      types: [],
      listTypes() {
        return Object.freeze([...this.types]);
      },
      getTypeID(typeName) {
        return this[typeName] !== void 0 ? this[typeName] : -1;
      }
    };
    krnlSystemTypes = createEnum(["qwnsr", "brnda", "symba", "mosy"]);
    krnlServiceSuites = createEnum(["UNIFIED_HTTP"]);
    defaultConnectionBehaviour = createEnum([
      "allow_unlisted",
      "ask_key_unlisted",
      "forbid_unlisted"
    ]);
    krnlServiceSuitePorts = Object.freeze({
      UNIFIED_HTTP: 1
    });
    krnlPrimitiveDataTypes = createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"]);
    krnlData = class {
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
    krnlDataFactory = class {
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
          status,
          data1,
          data2,
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
    };
    KrnlPolicy = class _KrnlPolicy {
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
  }
});

// src/krnl/core/krnl_pb.js
var import_minimal, $Reader, $Writer, $util, $Object, $undefined, $Error, $TypeError, $String, $Number, $parseInt, $BigInt, $Array, $Boolean, $root, krnl;
var init_krnl_pb = __esm({
  "src/krnl/core/krnl_pb.js"() {
    "use strict";
    import_minimal = __toESM(require("protobufjs/minimal.js"), 1);
    $Reader = import_minimal.default.Reader;
    $Writer = import_minimal.default.Writer;
    $util = import_minimal.default.util;
    $Object = $util.global.Object;
    $undefined = $util.global.undefined;
    $Error = $util.global.Error;
    $TypeError = $util.global.TypeError;
    $String = $util.global.String;
    $Number = $util.global.Number;
    $parseInt = $util.global.parseInt;
    $BigInt = $util.global.BigInt;
    $Array = $util.global.Array;
    $Boolean = $util.global.Boolean;
    $root = import_minimal.default.roots["default"] || (import_minimal.default.roots["default"] = {});
    krnl = $root.krnl = (() => {
      const krnl2 = {};
      krnl2.MessageKind = (function() {
        const valuesById = $Object.create(null), values = $Object.create(valuesById);
        values[valuesById[0] = "UNKNOWN"] = 0;
        values[valuesById[1] = "REGISTER_INGRESS"] = 1;
        values[valuesById[2] = "ROUTE_DATA"] = 2;
        values[valuesById[3] = "RPC_REQUEST"] = 3;
        values[valuesById[4] = "RPC_RESPONSE"] = 4;
        values[valuesById[5] = "INTROSPECT"] = 5;
        values[valuesById[6] = "INTROSPECT_RESPONSE"] = 6;
        return values;
      })();
      krnl2.KrnlMessage = (function() {
        const KrnlMessage = function(properties) {
          if (properties) {
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        };
        KrnlMessage.prototype.kind = 0;
        KrnlMessage.prototype.routeId = "";
        KrnlMessage.prototype.requestId = "";
        KrnlMessage.prototype.traceCorrelationId = "";
        KrnlMessage.prototype.originSystemAddress = "";
        KrnlMessage.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
        KrnlMessage.prototype.method = "";
        KrnlMessage.prototype.collectorName = "";
        KrnlMessage.prototype.jsonPayload = "";
        KrnlMessage.prototype.binaryPayload = $util.newBuffer([]);
        KrnlMessage.create = function(properties) {
          return new KrnlMessage(properties);
        };
        KrnlMessage.encode = function(message, writer, _depth) {
          if (!writer)
            writer = $Writer.create();
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          if (message.kind != null && $Object.hasOwnProperty.call(message, "kind") && message.kind !== 0)
            writer.uint32(
              /* id 1, wireType 0 =*/
              8
            ).int32(message.kind);
          if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId") && message.routeId !== "")
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.routeId);
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId") && message.requestId !== "")
            writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).string(message.requestId);
          if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId") && message.traceCorrelationId !== "")
            writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).string(message.traceCorrelationId);
          if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress") && message.originSystemAddress !== "")
            writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).string(message.originSystemAddress);
          if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp") && (typeof message.timestamp === "object" ? message.timestamp.low || message.timestamp.high : message.timestamp !== 0))
            writer.uint32(
              /* id 6, wireType 0 =*/
              48
            ).int64(message.timestamp);
          if (message.method != null && $Object.hasOwnProperty.call(message, "method") && message.method !== "")
            writer.uint32(
              /* id 7, wireType 2 =*/
              58
            ).string(message.method);
          if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName") && message.collectorName !== "")
            writer.uint32(
              /* id 8, wireType 2 =*/
              66
            ).string(message.collectorName);
          if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload") && message.jsonPayload !== "")
            writer.uint32(
              /* id 9, wireType 2 =*/
              74
            ).string(message.jsonPayload);
          if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload") && message.binaryPayload.length)
            writer.uint32(
              /* id 10, wireType 2 =*/
              82
            ).bytes(message.binaryPayload);
          if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        KrnlMessage.encodeDelimited = function(message, writer) {
          return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };
        KrnlMessage.decode = function(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
          let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.krnl.KrnlMessage(), value;
          while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
              _end = $undefined;
              break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 0)
                  break;
                if (value = reader.int32())
                  message.kind = value;
                else
                  delete message.kind;
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.routeId = value;
                else
                  delete message.routeId;
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.requestId = value;
                else
                  delete message.requestId;
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.traceCorrelationId = value;
                else
                  delete message.traceCorrelationId;
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.originSystemAddress = value;
                else
                  delete message.originSystemAddress;
                continue;
              }
              case 6: {
                if (wireType !== 0)
                  break;
                if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                  message.timestamp = value;
                else
                  delete message.timestamp;
                continue;
              }
              case 7: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.method = value;
                else
                  delete message.method;
                continue;
              }
              case 8: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.collectorName = value;
                else
                  delete message.collectorName;
                continue;
              }
              case 9: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.jsonPayload = value;
                else
                  delete message.jsonPayload;
                continue;
              }
              case 10: {
                if (wireType !== 2)
                  break;
                if ((value = reader.bytes()).length)
                  message.binaryPayload = value;
                else
                  delete message.binaryPayload;
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
          }
          if (_end !== $undefined)
            throw $Error("missing end group");
          return message;
        };
        KrnlMessage.decodeDelimited = function(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        KrnlMessage.verify = function(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.kind != null && $Object.hasOwnProperty.call(message, "kind")) {
            if (typeof message.kind !== "number" || (message.kind | 0) !== message.kind)
              return "kind: enum value expected";
          }
          if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId")) {
            if (!$util.isString(message.routeId))
              return "routeId: string expected";
          }
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId")) {
            if (!$util.isString(message.requestId))
              return "requestId: string expected";
          }
          if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId")) {
            if (!$util.isString(message.traceCorrelationId))
              return "traceCorrelationId: string expected";
          }
          if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress")) {
            if (!$util.isString(message.originSystemAddress))
              return "originSystemAddress: string expected";
          }
          if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp")) {
            if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
              return "timestamp: integer|Long expected";
          }
          if (message.method != null && $Object.hasOwnProperty.call(message, "method")) {
            if (!$util.isString(message.method))
              return "method: string expected";
          }
          if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName")) {
            if (!$util.isString(message.collectorName))
              return "collectorName: string expected";
          }
          if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload")) {
            if (!$util.isString(message.jsonPayload))
              return "jsonPayload: string expected";
          }
          if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload")) {
            if (!(message.binaryPayload && typeof message.binaryPayload.length === "number" || $util.isString(message.binaryPayload)))
              return "binaryPayload: buffer expected";
          }
          return null;
        };
        KrnlMessage.fromObject = function(object, _depth) {
          if (object instanceof $root.krnl.KrnlMessage)
            return object;
          if (!$util.isObject(object))
            throw $TypeError(".krnl.KrnlMessage: object expected");
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let message = new $root.krnl.KrnlMessage();
          if (object.kind !== 0 && (typeof object.kind !== "string" || $root.krnl.MessageKind[object.kind] !== 0))
            switch (object.kind) {
              case "UNKNOWN":
              case 0:
                message.kind = 0;
                break;
              case "REGISTER_INGRESS":
              case 1:
                message.kind = 1;
                break;
              case "ROUTE_DATA":
              case 2:
                message.kind = 2;
                break;
              case "RPC_REQUEST":
              case 3:
                message.kind = 3;
                break;
              case "RPC_RESPONSE":
              case 4:
                message.kind = 4;
                break;
              case "INTROSPECT":
              case 5:
                message.kind = 5;
                break;
              case "INTROSPECT_RESPONSE":
              case 6:
                message.kind = 6;
                break;
              default:
                if (typeof object.kind === "number" && (object.kind | 0) === object.kind)
                  message.kind = object.kind;
            }
          if (object.routeId != null) {
            if (typeof object.routeId !== "string" || object.routeId.length)
              message.routeId = $String(object.routeId);
          }
          if (object.requestId != null) {
            if (typeof object.requestId !== "string" || object.requestId.length)
              message.requestId = $String(object.requestId);
          }
          if (object.traceCorrelationId != null) {
            if (typeof object.traceCorrelationId !== "string" || object.traceCorrelationId.length)
              message.traceCorrelationId = $String(object.traceCorrelationId);
          }
          if (object.originSystemAddress != null) {
            if (typeof object.originSystemAddress !== "string" || object.originSystemAddress.length)
              message.originSystemAddress = $String(object.originSystemAddress);
          }
          if (object.timestamp != null) {
            if (typeof object.timestamp === "object" ? object.timestamp.low || object.timestamp.high : $Number(object.timestamp) !== 0) {
              if ($util.Long)
                message.timestamp = $util.Long.fromValue(object.timestamp, false);
              else if (typeof object.timestamp === "string")
                message.timestamp = $parseInt(object.timestamp, 10);
              else if (typeof object.timestamp === "number")
                message.timestamp = object.timestamp;
              else if (typeof object.timestamp === "object")
                message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            }
          }
          if (object.method != null) {
            if (typeof object.method !== "string" || object.method.length)
              message.method = $String(object.method);
          }
          if (object.collectorName != null) {
            if (typeof object.collectorName !== "string" || object.collectorName.length)
              message.collectorName = $String(object.collectorName);
          }
          if (object.jsonPayload != null) {
            if (typeof object.jsonPayload !== "string" || object.jsonPayload.length)
              message.jsonPayload = $String(object.jsonPayload);
          }
          if (object.binaryPayload != null) {
            if (object.binaryPayload.length) {
              if (typeof object.binaryPayload === "string")
                $util.base64.decode(object.binaryPayload, message.binaryPayload = $util.newBuffer($util.base64.length(object.binaryPayload)), 0);
              else if (object.binaryPayload.length >= 0)
                message.binaryPayload = object.binaryPayload;
            }
          }
          return message;
        };
        KrnlMessage.toObject = function(message, options, _depth) {
          if (!options)
            options = {};
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let object = {};
          if (options.defaults) {
            object.kind = options.enums === $String ? "UNKNOWN" : 0;
            object.routeId = "";
            object.requestId = "";
            object.traceCorrelationId = "";
            object.originSystemAddress = "";
            if ($util.Long) {
              let long = new $util.Long(0, 0, false);
              object.timestamp = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
            } else
              object.timestamp = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            object.method = "";
            object.collectorName = "";
            object.jsonPayload = "";
            if (options.bytes === $String)
              object.binaryPayload = "";
            else {
              object.binaryPayload = [];
              if (options.bytes !== $Array)
                object.binaryPayload = $util.newBuffer(object.binaryPayload);
            }
          }
          if (message.kind != null && $Object.hasOwnProperty.call(message, "kind"))
            object.kind = options.enums === $String ? $root.krnl.MessageKind[message.kind] === $undefined ? message.kind : $root.krnl.MessageKind[message.kind] : message.kind;
          if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId"))
            object.routeId = message.routeId;
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
            object.requestId = message.requestId;
          if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId"))
            object.traceCorrelationId = message.traceCorrelationId;
          if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress"))
            object.originSystemAddress = message.originSystemAddress;
          if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
            if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
              object.timestamp = typeof message.timestamp === "number" ? $BigInt(message.timestamp) : $util.Long.fromBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0, false).toBigInt();
            else if (typeof message.timestamp === "number")
              object.timestamp = options.longs === $String ? $String(message.timestamp) : message.timestamp;
            else
              object.timestamp = options.longs === $String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === $Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
          if (message.method != null && $Object.hasOwnProperty.call(message, "method"))
            object.method = message.method;
          if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName"))
            object.collectorName = message.collectorName;
          if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload"))
            object.jsonPayload = message.jsonPayload;
          if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload"))
            object.binaryPayload = options.bytes === $String ? $util.base64.encode(message.binaryPayload, 0, message.binaryPayload.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.binaryPayload) : message.binaryPayload;
          return object;
        };
        KrnlMessage.prototype.toJSON = function() {
          return KrnlMessage.toObject(this, import_minimal.default.util.toJSONOptions);
        };
        KrnlMessage.getTypeUrl = function(prefix) {
          if (prefix === $undefined)
            prefix = "type.googleapis.com";
          return prefix + "/krnl.KrnlMessage";
        };
        return KrnlMessage;
      })();
      krnl2.RpcResponse = (function() {
        const RpcResponse = function(properties) {
          if (properties) {
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        };
        RpcResponse.prototype.requestId = "";
        RpcResponse.prototype.ok = false;
        RpcResponse.prototype.error = "";
        RpcResponse.prototype.jsonResult = "";
        RpcResponse.prototype.errorDocumentation = "";
        RpcResponse.create = function(properties) {
          return new RpcResponse(properties);
        };
        RpcResponse.encode = function(message, writer, _depth) {
          if (!writer)
            writer = $Writer.create();
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId") && message.requestId !== "")
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.requestId);
          if (message.ok != null && $Object.hasOwnProperty.call(message, "ok") && message.ok !== false)
            writer.uint32(
              /* id 2, wireType 0 =*/
              16
            ).bool(message.ok);
          if (message.error != null && $Object.hasOwnProperty.call(message, "error") && message.error !== "")
            writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).string(message.error);
          if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult") && message.jsonResult !== "")
            writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).string(message.jsonResult);
          if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation") && message.errorDocumentation !== "")
            writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).string(message.errorDocumentation);
          if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        RpcResponse.encodeDelimited = function(message, writer) {
          return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };
        RpcResponse.decode = function(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
          let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.krnl.RpcResponse(), value;
          while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
              _end = $undefined;
              break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.requestId = value;
                else
                  delete message.requestId;
                continue;
              }
              case 2: {
                if (wireType !== 0)
                  break;
                if (value = reader.bool())
                  message.ok = value;
                else
                  delete message.ok;
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.error = value;
                else
                  delete message.error;
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.jsonResult = value;
                else
                  delete message.jsonResult;
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.errorDocumentation = value;
                else
                  delete message.errorDocumentation;
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
          }
          if (_end !== $undefined)
            throw $Error("missing end group");
          return message;
        };
        RpcResponse.decodeDelimited = function(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        RpcResponse.verify = function(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId")) {
            if (!$util.isString(message.requestId))
              return "requestId: string expected";
          }
          if (message.ok != null && $Object.hasOwnProperty.call(message, "ok")) {
            if (typeof message.ok !== "boolean")
              return "ok: boolean expected";
          }
          if (message.error != null && $Object.hasOwnProperty.call(message, "error")) {
            if (!$util.isString(message.error))
              return "error: string expected";
          }
          if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult")) {
            if (!$util.isString(message.jsonResult))
              return "jsonResult: string expected";
          }
          if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation")) {
            if (!$util.isString(message.errorDocumentation))
              return "errorDocumentation: string expected";
          }
          return null;
        };
        RpcResponse.fromObject = function(object, _depth) {
          if (object instanceof $root.krnl.RpcResponse)
            return object;
          if (!$util.isObject(object))
            throw $TypeError(".krnl.RpcResponse: object expected");
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let message = new $root.krnl.RpcResponse();
          if (object.requestId != null) {
            if (typeof object.requestId !== "string" || object.requestId.length)
              message.requestId = $String(object.requestId);
          }
          if (object.ok != null) {
            if (object.ok)
              message.ok = $Boolean(object.ok);
          }
          if (object.error != null) {
            if (typeof object.error !== "string" || object.error.length)
              message.error = $String(object.error);
          }
          if (object.jsonResult != null) {
            if (typeof object.jsonResult !== "string" || object.jsonResult.length)
              message.jsonResult = $String(object.jsonResult);
          }
          if (object.errorDocumentation != null) {
            if (typeof object.errorDocumentation !== "string" || object.errorDocumentation.length)
              message.errorDocumentation = $String(object.errorDocumentation);
          }
          return message;
        };
        RpcResponse.toObject = function(message, options, _depth) {
          if (!options)
            options = {};
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let object = {};
          if (options.defaults) {
            object.requestId = "";
            object.ok = false;
            object.error = "";
            object.jsonResult = "";
            object.errorDocumentation = "";
          }
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
            object.requestId = message.requestId;
          if (message.ok != null && $Object.hasOwnProperty.call(message, "ok"))
            object.ok = message.ok;
          if (message.error != null && $Object.hasOwnProperty.call(message, "error"))
            object.error = message.error;
          if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult"))
            object.jsonResult = message.jsonResult;
          if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation"))
            object.errorDocumentation = message.errorDocumentation;
          return object;
        };
        RpcResponse.prototype.toJSON = function() {
          return RpcResponse.toObject(this, import_minimal.default.util.toJSONOptions);
        };
        RpcResponse.getTypeUrl = function(prefix) {
          if (prefix === $undefined)
            prefix = "type.googleapis.com";
          return prefix + "/krnl.RpcResponse";
        };
        return RpcResponse;
      })();
      return krnl2;
    })();
  }
});

// src/krnl/core/K_LIB_Krnl_System_Comm_Component.ts
async function _loadWs() {
  if (!_WS) {
    const mod = await import("ws");
    _WS = mod.WebSocket;
    _WSServer = mod.WebSocketServer;
  }
  return { WebSocket: _WS, WebSocketServer: _WSServer };
}
var WebSocketTransportAdapter, _WS, _WSServer, krnlSystemCommComponent;
var init_K_LIB_Krnl_System_Comm_Component = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Comm_Component.ts"() {
    "use strict";
    init_K_LIB_Krnl_Functionality_Types();
    init_K_LIB_Krnl_Base_Concepts();
    init_K_LIB_Krnl_Error_Concepts();
    init_krnl_pb();
    WebSocketTransportAdapter = class extends krnlTransportAdapter {
      commComponent;
      remoteAddress;
      /**
       * @param commComponent - The local system's comm component.
       * @param remoteAddress - "host:port" of the remote system.
       */
      constructor(commComponent, remoteAddress) {
        super();
        this.commComponent = commComponent;
        this.remoteAddress = remoteAddress;
      }
      async call(targetFunction, input, opts = {}) {
        const policy = opts.policy instanceof KrnlPolicy ? opts.policy : new KrnlPolicy(opts);
        const data = {
          ...input,
          meta: {
            ...input?.meta || {},
            accessKey: opts.accessKey
          }
        };
        return await this.commComponent.callWsRpc(this.remoteAddress, "call", { fid: targetFunction, data }, policy);
      }
    };
    krnlSystemCommComponent = class {
      ownerEntity;
      listenPort;
      host;
      routes;
      _routeSeq;
      _wsServer;
      _wsClients;
      _wsIngress;
      _wsPendingRpc;
      _wsRpcHandlers;
      _introspectionProvider;
      /**
       * @param ownerEntity
       * @param listenPort - WS server port (only used in "ws" mode).
       * @param host - Interface to bind to.
       */
      constructor(ownerEntity, listenPort = 10099, host = "0.0.0.0") {
        this.ownerEntity = ownerEntity;
        this.listenPort = listenPort;
        this.host = host;
        this.routes = /* @__PURE__ */ new Map();
        this._routeSeq = 0;
        this._wsServer = null;
        this._wsClients = /* @__PURE__ */ new Map();
        this._wsIngress = /* @__PURE__ */ new Map();
        this._wsPendingRpc = /* @__PURE__ */ new Map();
        this._wsRpcHandlers = /* @__PURE__ */ new Map();
        this._introspectionProvider = null;
      }
      /**
       * Binds a local emitter directly to another in-process system's collector.
       */
      wireDirectly(localEmitterName, remoteCommComponent, remoteCollectorName) {
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const remoteCollector = remoteCommComponent.ownerEntity.interface.getCollector(remoteCollectorName);
        const unsubscribe = emitter.subscribe((msg) => {
          if (remoteCollector.emitter) {
            remoteCollector.emitter.pushDataStreamToEmitter(msg.data);
          }
          if (remoteCollector._directHandler) {
            remoteCollector._directHandler(msg);
          }
        });
        const routeId = `route_${this._routeSeq++}`;
        const route = {
          id: routeId,
          sourceEmitter: localEmitterName,
          targetSystem: remoteCommComponent.ownerEntity.entityName,
          targetCollector: remoteCollectorName,
          mode: "direct",
          disconnect: unsubscribe
        };
        this.routes.set(routeId, route);
        Logger.log(
          `[CommComponent:${this.ownerEntity.entityName}] DIRECT route created: ${localEmitterName} \u2192 ${route.targetSystem}.${remoteCollectorName}`
        );
        return route;
      }
      /**
       * Starts a WebSocket server so that remote systems can push data into local collectors.
       */
      async startWsServer(externalServer = null) {
        if (this._wsServer) return;
        const { WebSocketServer } = await _loadWs();
        return new Promise((resolve, reject) => {
          if (externalServer) {
            if (this.ownerEntity.options?.wsPath) {
              this._wsServer = new WebSocketServer({ noServer: true });
              externalServer.on("upgrade", (req, socket, head) => {
                const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
                if (url.pathname === this.ownerEntity.options.wsPath) {
                  this._wsServer.handleUpgrade(req, socket, head, (ws) => {
                    this._wsServer.emit("connection", ws);
                  });
                }
              });
            } else {
              this._wsServer = new WebSocketServer({ server: externalServer });
            }
            resolve();
          } else {
            this._wsServer = new WebSocketServer({ port: this.listenPort, host: this.host });
            this._wsServer.on("listening", () => {
              Logger.log(`[CommComponent:${this.ownerEntity.entityName}] WS server listening on :${this.listenPort}`);
              resolve();
            });
          }
          this._wsServer.on("error", (err) => {
            Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS server error:`, err.message);
            reject(err);
          });
          this._wsServer.on("connection", (ws) => {
            ws.on("error", (err) => {
              Logger.error(`[CommComponent:${this.ownerEntity.entityName}] Incoming WS error:`, err.message);
            });
            ws.on("message", (raw) => {
              try {
                let msg;
                const rawStr = raw.toString().trim();
                if (rawStr.startsWith("{") && rawStr.endsWith("}")) {
                  const parsed = JSON.parse(rawStr);
                  msg = {
                    kind: parsed.kind === "rpc-request" ? krnl.MessageKind.RPC_REQUEST : parsed.kind === "rpc-response" ? krnl.MessageKind.RPC_RESPONSE : parsed.kind === "register-ingress" ? krnl.MessageKind.REGISTER_INGRESS : parsed.kind === "route-data" ? krnl.MessageKind.ROUTE_DATA : parsed.kind === "introspect" ? krnl.MessageKind.INTROSPECT : krnl.MessageKind.UNKNOWN,
                    routeId: parsed.routeId || "",
                    requestId: parsed.requestId || "",
                    method: parsed.method || "",
                    collectorName: parsed.collectorName || "",
                    jsonPayload: parsed.params ? JSON.stringify(parsed.params) : parsed.data ? JSON.stringify(parsed.data) : ""
                  };
                } else {
                  msg = krnl.KrnlMessage.decode(new Uint8Array(raw));
                }
                if (msg.kind === krnl.MessageKind.REGISTER_INGRESS) {
                  this.registerWsIngress(msg.routeId, msg.collectorName);
                  return;
                }
                if (msg.kind === krnl.MessageKind.ROUTE_DATA) {
                  const handler = this._wsIngress.get(msg.routeId);
                  if (handler) {
                    const payload = msg.jsonPayload ? JSON.parse(msg.jsonPayload) : void 0;
                    handler(payload);
                  }
                  return;
                }
                if (msg.kind === krnl.MessageKind.RPC_REQUEST) {
                  const callerPort = ws._socket?.remotePort;
                  this._handleRpcRequest(ws, msg, callerPort);
                  return;
                }
                if (msg.kind === krnl.MessageKind.RPC_RESPONSE) {
                  this._handleRpcResponse(msg);
                  return;
                }
                if (msg.kind === krnl.MessageKind.INTROSPECT) {
                  this._handleIntrospect(ws, msg);
                  return;
                }
              } catch (e) {
                Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS message error:`, e.message);
              }
            });
          });
        });
      }
      /**
       * Connects to a remote system's CommComponent WS server.
       */
      async wireViaWs(localEmitterName, remoteAddress, remoteCollectorName, remoteSystemName, options = {}) {
        const { WebSocket } = await _loadWs();
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const ws = new WebSocket(`ws://${remoteAddress}`);
        const {
          managedBy = this.ownerEntity.entityName,
          externallyMutable = true,
          metadata = {}
        } = options;
        await new Promise((resolve, reject) => {
          ws.once("open", resolve);
          ws.once("error", reject);
        });
        ws.on("error", (err) => {
          Logger.error(`[CommComponent:${this.ownerEntity.entityName}] Outgoing WS error to ${remoteSystemName}:`, err.message);
        });
        this._wsClients.set(remoteSystemName, ws);
        const routeId = `ws_route_${this._routeSeq++}`;
        const regMsg = krnl.KrnlMessage.encode({
          kind: krnl.MessageKind.REGISTER_INGRESS,
          routeId,
          collectorName: remoteCollectorName
        }).finish();
        ws.send(regMsg);
        const unsubscribe = emitter.subscribe((msg) => {
          if (ws.readyState === _WS.OPEN) {
            const dataMsg = krnl.KrnlMessage.encode({
              kind: krnl.MessageKind.ROUTE_DATA,
              routeId,
              jsonPayload: JSON.stringify(msg.data)
            }).finish();
            ws.send(dataMsg);
          }
        });
        const route = {
          id: routeId,
          sourceEmitter: localEmitterName,
          targetSystem: remoteSystemName,
          targetCollector: remoteCollectorName,
          mode: "ws",
          managedBy,
          externallyMutable,
          metadata,
          disconnect: () => {
            unsubscribe();
            ws.close();
            this._wsClients.delete(remoteSystemName);
          }
        };
        this.routes.set(routeId, route);
        Logger.log(
          `[CommComponent:${this.ownerEntity.entityName}] WS route created: ${localEmitterName} \u2192 ${remoteSystemName}.${remoteCollectorName} @ ${remoteAddress}`
        );
        return route;
      }
      /**
       * Registers a WS ingress handler.
       */
      registerWsIngress(routeId, localCollectorName) {
        this._wsIngress.set(routeId, (data) => {
          const collector = this.ownerEntity.interface.getCollector(localCollectorName);
          if (collector._directHandler) {
            collector._directHandler({ data });
          }
        });
      }
      defineRpc(methodName, handler) {
        this._wsRpcHandlers.set(methodName, handler);
      }
      setIntrospectionProvider(providerFn) {
        this._introspectionProvider = providerFn;
      }
      async _getWsRpcClient(remoteAddress) {
        const { WebSocket } = await _loadWs();
        let ws = this._wsClients.get(remoteAddress);
        if (ws && (ws.readyState === 1 || ws.readyState === 0)) {
          return ws;
        }
        ws = new WebSocket(`ws://${remoteAddress}`);
        this._wsClients.set(remoteAddress, ws);
        ws.on("error", (err) => {
          Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS error to ${remoteAddress}:`, err.message);
          this._wsClients.delete(remoteAddress);
        });
        ws.on("close", () => {
          this._wsClients.delete(remoteAddress);
        });
        ws.on("message", (raw) => {
          try {
            let msg;
            const rawStr = raw.toString().trim();
            if (rawStr.startsWith("{") && rawStr.endsWith("}")) {
              const parsed = JSON.parse(rawStr);
              msg = {
                kind: parsed.kind === "rpc-response" ? krnl.MessageKind.RPC_RESPONSE : krnl.MessageKind.UNKNOWN,
                requestId: parsed.requestId || "",
                ok: parsed.ok,
                error: parsed.error,
                result: parsed.result
              };
            } else {
              msg = krnl.KrnlMessage.decode(new Uint8Array(raw));
            }
            if (msg.kind === krnl.MessageKind.RPC_RESPONSE) {
              this._handleRpcResponse(msg);
            }
          } catch (_) {
          }
        });
        await new Promise((resolve, reject) => {
          const connTimeout = setTimeout(() => {
            ws.close();
            reject(new Error("ERR_NET_CONNECTION_TIMEOUT"));
          }, 5e3);
          ws.once("open", () => {
            clearTimeout(connTimeout);
            resolve(true);
          });
          ws.once("error", (err) => {
            clearTimeout(connTimeout);
            reject(err);
          });
        });
        return ws;
      }
      async callWsRpc(remoteAddress, method, params = {}, policy = KrnlPolicy.default()) {
        let lastError = null;
        for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
          try {
            const requestId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const ws = await this._getWsRpcClient(remoteAddress);
            const result = await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                this._wsPendingRpc.delete(requestId);
                reject({ code: krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED, message: "ERR_NET_RPC_TIMEOUT_EXCEEDED" });
              }, policy.timeoutMs);
              this._wsPendingRpc.set(requestId, { resolve, reject, timeoutId, ws });
              const rpcReq = krnl.KrnlMessage.encode({
                kind: krnl.MessageKind.RPC_REQUEST,
                requestId,
                traceCorrelationId: requestId,
                originSystemAddress: this.ownerEntity.entityName,
                timestamp: Date.now(),
                method,
                jsonPayload: JSON.stringify(params)
              }).finish();
              ws.send(rpcReq);
            });
            return result;
          } catch (err) {
            lastError = err;
            if (attempt < policy.maxRetries) {
              const delay = policy.backoffStrategy === "EXPONENTIAL" ? policy.retryDelayMs * Math.pow(2, attempt) : policy.retryDelayMs;
              Logger.log(`[CommComponent:${this.ownerEntity.entityName}] RPC failed (attempt ${attempt + 1}). Retrying in ${delay}ms...`);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }
        throw lastError;
      }
      async _handleRpcRequest(ws, msg, callerPort) {
        const { requestId, method } = msg;
        const params = msg.jsonPayload ? JSON.parse(msg.jsonPayload) : void 0;
        if (params?.target && this.ownerEntity._ingressNetwork) {
          const member = this.ownerEntity._ingressNetwork.members.get(params.target.toLowerCase());
          if (member) {
            const { target, ...memberParams } = params;
            const memberMsg = { ...msg, jsonPayload: JSON.stringify(memberParams) };
            await member.entity.commComponent._handleRpcRequest(ws, memberMsg, callerPort);
            return;
          }
        }
        const handler = this._wsRpcHandlers.get(method);
        if (!handler) {
          const rpcResp = krnl.RpcResponse.encode({
            requestId,
            ok: false,
            error: `Unknown RPC method: ${method}`
          }).finish();
          const envelope = krnl.KrnlMessage.encode({
            kind: krnl.MessageKind.RPC_RESPONSE,
            requestId,
            binaryPayload: rpcResp
          }).finish();
          ws.send(envelope);
          return;
        }
        try {
          const result = await handler(params, { callerPort });
          const rpcResp = krnl.RpcResponse.encode({
            requestId,
            ok: true,
            jsonResult: JSON.stringify(result)
          }).finish();
          const envelope = krnl.KrnlMessage.encode({
            kind: krnl.MessageKind.RPC_RESPONSE,
            requestId,
            binaryPayload: rpcResp
          }).finish();
          ws.send(envelope);
        } catch (e) {
          let errorMsg = e.message || String(e);
          const rpcResp = krnl.RpcResponse.encode({
            requestId,
            ok: false,
            error: errorMsg,
            errorDocumentation: e.errorDocumentation || ""
          }).finish();
          const envelope = krnl.KrnlMessage.encode({
            kind: krnl.MessageKind.RPC_RESPONSE,
            requestId,
            binaryPayload: rpcResp
          }).finish();
          ws.send(envelope);
        }
      }
      async _handleIntrospect(ws, msg) {
        const baseInfo = {
          entity: this.ownerEntity.entityName,
          methods: Array.from(this._wsRpcHandlers.keys())
        };
        let finalInfo = baseInfo;
        if (this._introspectionProvider) {
          try {
            const extra = await this._introspectionProvider();
            finalInfo = { ...baseInfo, ...extra };
          } catch (e) {
            finalInfo = { ...baseInfo, error: `Introspection provider failed: ${e.message}` };
          }
        }
        const envelope = krnl.KrnlMessage.encode({
          kind: krnl.MessageKind.INTROSPECT_RESPONSE,
          requestId: msg.requestId,
          jsonPayload: JSON.stringify(finalInfo)
        }).finish();
        ws.send(envelope);
      }
      _handleRpcResponse(msg) {
        let responseMsg = msg;
        if (msg.binaryPayload) {
          try {
            const dec = krnl.RpcResponse.decode(msg.binaryPayload);
            responseMsg = {
              requestId: dec.requestId,
              ok: dec.ok,
              error: dec.error,
              result: dec.jsonResult ? JSON.parse(dec.jsonResult) : void 0,
              errorDocumentation: dec.errorDocumentation
            };
          } catch (e) {
            Logger.error("Failed to decode RpcResponse payload:", e);
          }
        }
        const pending = this._wsPendingRpc.get(responseMsg.requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this._wsPendingRpc.delete(responseMsg.requestId);
        if (responseMsg.ok) pending.resolve(responseMsg.result);
        else pending.reject(new Error(responseMsg.error || "RPC error"));
      }
      listRoutes() {
        return Array.from(this.routes.values()).map((r) => ({
          id: r.id,
          sourceEmitter: r.sourceEmitter,
          targetSystem: r.targetSystem,
          targetCollector: r.targetCollector,
          mode: r.mode,
          managedBy: r.managedBy || null,
          externallyMutable: r.externallyMutable !== false,
          metadata: r.metadata || {}
        }));
      }
      disconnectRoute(routeId, options = {}) {
        const { requester = null, force = false } = options;
        const route = this.routes.get(routeId);
        if (!route) throw new Error(`[CommComponent] Route not found: ${routeId}`);
        if (!force && route.externallyMutable === false) {
          const manager = route.managedBy || this.ownerEntity.entityName;
          if (requester && requester !== manager) {
            throw new Error(`[CommComponent] Route ${routeId} is immutable for requester ${requester}.`);
          }
        }
        if (route.disconnect) route.disconnect();
        this.routes.delete(routeId);
      }
      dispose() {
        for (const [id] of this.routes) {
          try {
            this.disconnectRoute(id, { force: true });
          } catch (_) {
          }
        }
        if (this._wsServer) {
          this._wsServer.close();
          this._wsServer = null;
        }
        for (const ws of this._wsClients.values()) ws.close();
        this._wsClients.clear();
        this._wsIngress.clear();
        for (const pending of this._wsPendingRpc.values()) {
          clearTimeout(pending.timeoutId);
          pending.reject(new Error("CommComponent disposed"));
        }
        this._wsPendingRpc.clear();
        this._wsRpcHandlers.clear();
        Logger.log(`[CommComponent:${this.ownerEntity.entityName}] Disposed.`);
      }
    };
  }
});

// src/krnl/tools/AsyncKit.js
var AsyncKit;
var init_AsyncKit = __esm({
  "src/krnl/tools/AsyncKit.js"() {
    "use strict";
    AsyncKit = class _AsyncKit {
      /**
       * Classic sleep/delay.
       */
      static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      /**
       * Rejects if the task does not finish within ms.
       */
      static withTimeout(promise, ms, label = "Operation") {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`[KrnlTimeoutError] ${label} timed out after ${ms}ms`));
          }, ms);
        });
        return Promise.race([
          promise.then((val) => {
            clearTimeout(timer);
            return val;
          }),
          timeoutPromise
        ]);
      }
      /**
       * Retries an async execution up to maxAttempts times.
       */
      static async retry(fn, maxAttempts, delayMs = 1e3) {
        let attempts = 0;
        while (attempts < maxAttempts) {
          try {
            return await fn();
          } catch (err) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw err;
            }
            await _AsyncKit.sleep(delayMs);
          }
        }
        throw new Error("Retry failed");
      }
      static async pLimit(tasks, concurrency) {
        const results = [];
        let index = 0;
        const worker = async () => {
          while (index < tasks.length) {
            const i = index++;
            results[i] = await tasks[i]();
          }
        };
        const workers = [];
        for (let i = 0; i < concurrency && i < tasks.length; i++) {
          workers.push(worker());
        }
        await Promise.all(workers);
        return results;
      }
      /**
       * Debounces a function.
       */
      static debounce(fn, ms) {
        let timer = null;
        return (...args) => {
          if (timer)
            clearTimeout(timer);
          timer = setTimeout(() => fn(...args), ms);
        };
      }
      /**
       * Throttles a function.
       */
      static throttle(fn, ms) {
        let lastCall = 0;
        return (...args) => {
          const now = Date.now();
          if (now - lastCall >= ms) {
            lastCall = now;
            fn(...args);
          }
        };
      }
      /**
       * Wraps a function to run only once and cache its outcome.
       */
      static once(fn) {
        let run = false;
        let result;
        return (...args) => {
          if (!run) {
            run = true;
            result = fn(...args);
          }
          return result;
        };
      }
      /**
       * computational memoization cache helper.
       */
      static memoize(fn, keyFn) {
        const cache = /* @__PURE__ */ new Map();
        return (...args) => {
          const key = keyFn ? keyFn(...args) : JSON.stringify(args);
          if (cache.has(key)) {
            return cache.get(key);
          }
          const val = fn(...args);
          cache.set(key, val);
          return val;
        };
      }
    };
  }
});

// src/krnl/tools/StringKit.js
var StringKit;
var init_StringKit = __esm({
  "src/krnl/tools/StringKit.js"() {
    "use strict";
    StringKit = class _StringKit {
      static toCamelCase(str) {
        return str.replace(/[-_]+/g, " ").replace(/[^\w\s]/g, "").replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, "");
      }
      static toPascalCase(str) {
        const camel = _StringKit.toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
      }
      static toSnakeCase(str) {
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/[-_\s]+/g, "_").replace(/^[_\s]+|[_\s]+$/g, "").toLowerCase();
      }
      static toKebabCase(str) {
        return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/[-_\s]+/g, "-").replace(/^[-_\s]+|[-_\s]+$/g, "").toLowerCase();
      }
      static toScreamingSnake(str) {
        return _StringKit.toSnakeCase(str).toUpperCase();
      }
      static toSlug(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-_]/g, "").replace(/[\s-_]+/g, "-").replace(/^-+|-+$/g, "");
      }
      static generateUUID() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === "x" ? r : r & 3 | 8;
          return v.toString(16);
        });
      }
      static generateShortId(length = 8) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.random() * chars.length | 0);
        }
        return result;
      }
      static generatePrefixedId(prefix, length = 8) {
        return `${prefix}-${_StringKit.generateShortId(length)}`;
      }
      static interpolate(tmpl, data) {
        return tmpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
          return data[key] !== void 0 ? String(data[key]) : `{{${key}}}`;
        });
      }
    };
  }
});

// src/krnl/tools/CacheKit.js
var import_fs2, import_path, LRUCache, TTLCache, CacheKit, FileCache;
var init_CacheKit = __esm({
  "src/krnl/tools/CacheKit.js"() {
    "use strict";
    import_fs2 = __toESM(require("fs"), 1);
    import_path = __toESM(require("path"), 1);
    LRUCache = class {
      maxSize;
      cache;
      constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = /* @__PURE__ */ new Map();
      }
      get(key) {
        if (!this.cache.has(key))
          return void 0;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
      }
      set(key, value) {
        if (this.cache.has(key)) {
          this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey !== void 0)
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
      }
      delete(key) {
        return this.cache.delete(key);
      }
      clear() {
        this.cache.clear();
      }
      size() {
        return this.cache.size;
      }
    };
    TTLCache = class {
      ttlMs;
      cache;
      constructor(ttlMs) {
        this.ttlMs = ttlMs;
        this.cache = /* @__PURE__ */ new Map();
      }
      get(key) {
        const entry = this.cache.get(key);
        if (!entry)
          return null;
        if (Date.now() > entry.expires) {
          this.cache.delete(key);
          return null;
        }
        return entry.value;
      }
      set(key, value) {
        this.cache.set(key, {
          value,
          expires: Date.now() + this.ttlMs
        });
      }
      delete(key) {
        return this.cache.delete(key);
      }
      clear() {
        this.cache.clear();
      }
    };
    CacheKit = class {
      /**
       * Stale-While-Revalidate utility.
       */
      static swr(cache, key, fetchFn) {
        const cached = cache.get(key);
        if (cached !== null) {
          setTimeout(() => {
            fetchFn().then((fresh) => cache.set(key, fresh)).catch(() => {
            });
          }, 0);
          return Promise.resolve(cached);
        }
        return fetchFn().then((fresh) => {
          cache.set(key, fresh);
          return fresh;
        });
      }
    };
    FileCache = class {
      cacheDir;
      constructor(cacheDir) {
        this.cacheDir = cacheDir;
        try {
          if (!import_fs2.default.existsSync(cacheDir)) {
            import_fs2.default.mkdirSync(cacheDir, { recursive: true });
          }
        } catch (e) {
        }
      }
      getFilePath(key) {
        return import_path.default.join(this.cacheDir, `${encodeURIComponent(key)}.json`);
      }
      get(key) {
        const file = this.getFilePath(key);
        if (!import_fs2.default.existsSync(file))
          return null;
        try {
          const content = import_fs2.default.readFileSync(file, "utf8");
          return JSON.parse(content);
        } catch (e) {
          return null;
        }
      }
      set(key, value) {
        const file = this.getFilePath(key);
        try {
          import_fs2.default.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
        } catch (e) {
        }
      }
      delete(key) {
        const file = this.getFilePath(key);
        if (import_fs2.default.existsSync(file)) {
          try {
            import_fs2.default.unlinkSync(file);
          } catch (e) {
          }
        }
      }
      clear() {
        try {
          const files = import_fs2.default.readdirSync(this.cacheDir);
          for (const file of files) {
            import_fs2.default.unlinkSync(import_path.default.join(this.cacheDir, file));
          }
        } catch (e) {
        }
      }
    };
  }
});

// src/krnl/tools/KrnlFS.js
var import_fs3, import_promises, import_path2, import_os, FileLock, KrnlFS;
var init_KrnlFS = __esm({
  "src/krnl/tools/KrnlFS.js"() {
    "use strict";
    import_fs3 = __toESM(require("fs"), 1);
    import_promises = __toESM(require("fs/promises"), 1);
    import_path2 = __toESM(require("path"), 1);
    import_os = __toESM(require("os"), 1);
    init_ObjectKit();
    FileLock = class _FileLock {
      static locks = /* @__PURE__ */ new Map();
      static async acquire(filePath) {
        const resolvedPath = import_path2.default.resolve(filePath);
        const existing = _FileLock.locks.get(resolvedPath) || Promise.resolve();
        let release = () => {
        };
        const nextLock = new Promise((resolve) => {
          release = () => {
            _FileLock.locks.delete(resolvedPath);
            resolve();
          };
        });
        _FileLock.locks.set(resolvedPath, nextLock);
        await existing;
        return release;
      }
    };
    KrnlFS = class _KrnlFS {
      // --- File primitives ---
      static async readFile(filePath, encoding = "utf8") {
        return await import_promises.default.readFile(filePath, encoding);
      }
      static async writeFile(filePath, content) {
        await import_promises.default.writeFile(filePath, content);
      }
      /**
       * Atomic file writing via temp files.
       */
      static async writeFileAtomic(filePath, content) {
        const dir = import_path2.default.dirname(filePath);
        await _KrnlFS.ensureDir(dir);
        const tempFile = import_path2.default.join(dir, `.${import_path2.default.basename(filePath)}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
        try {
          await import_promises.default.writeFile(tempFile, content);
          await import_promises.default.rename(tempFile, filePath);
        } catch (e) {
          if (import_fs3.default.existsSync(tempFile)) {
            await import_promises.default.unlink(tempFile).catch(() => {
            });
          }
          throw e;
        }
      }
      static async appendFile(filePath, content) {
        await import_promises.default.appendFile(filePath, content);
      }
      static async deleteFile(filePath) {
        await import_promises.default.unlink(filePath);
      }
      static async fileExists(filePath) {
        try {
          const stat = await import_promises.default.stat(filePath);
          return stat.isFile();
        } catch (e) {
          return false;
        }
      }
      static async getFileStat(filePath) {
        const stat = await import_promises.default.stat(filePath);
        return {
          size: stat.size,
          createdAt: stat.birthtime,
          modifiedAt: stat.mtime,
          isDir: stat.isDirectory()
        };
      }
      // --- JSON convenience ---
      static async readJSON(filePath) {
        try {
          const content = await _KrnlFS.readFile(filePath, "utf8");
          return JSON.parse(content);
        } catch (e) {
          return null;
        }
      }
      static async writeJSON(filePath, data, indent = 2) {
        const content = JSON.stringify(data, null, indent);
        await _KrnlFS.writeFileAtomic(filePath, content);
      }
      static async updateJSON(filePath, patch) {
        const release = await FileLock.acquire(filePath);
        try {
          let existing = await _KrnlFS.readJSON(filePath);
          if (!existing) {
            existing = {};
          }
          const updated = ObjectKit.deepMerge(existing, patch);
          await _KrnlFS.writeJSON(filePath, updated);
          return updated;
        } finally {
          release();
        }
      }
      // --- Directory primitives ---
      static async ensureDir(dirPath) {
        await import_promises.default.mkdir(dirPath, { recursive: true });
      }
      static async deleteDir(dirPath, recursive = true) {
        await import_promises.default.rm(dirPath, { recursive, force: true });
      }
      static async listDir(dirPath) {
        return await import_promises.default.readdir(dirPath);
      }
      static async *walkDir(dirPath, filter) {
        const list = await _KrnlFS.listDir(dirPath);
        for (const item of list) {
          const full = import_path2.default.join(dirPath, item);
          const stat = await _KrnlFS.getFileStat(full);
          if (stat.isDir) {
            yield* _KrnlFS.walkDir(full, filter);
          } else {
            if (!filter || filter(full)) {
              yield full;
            }
          }
        }
      }
      static async dirExists(dirPath) {
        try {
          const stat = await import_promises.default.stat(dirPath);
          return stat.isDirectory();
        } catch (e) {
          return false;
        }
      }
      static async copyDir(src, dest) {
        await _KrnlFS.ensureDir(dest);
        const list = await _KrnlFS.listDir(src);
        for (const item of list) {
          const srcItem = import_path2.default.join(src, item);
          const destItem = import_path2.default.join(dest, item);
          const stat = await _KrnlFS.getFileStat(srcItem);
          if (stat.isDir) {
            await _KrnlFS.copyDir(srcItem, destItem);
          } else {
            await import_promises.default.copyFile(srcItem, destItem);
          }
        }
      }
      // --- Path utilities ---
      static join(...parts) {
        return import_path2.default.join(...parts);
      }
      static resolve(...parts) {
        return import_path2.default.resolve(...parts);
      }
      static relative(from, to) {
        return import_path2.default.relative(from, to);
      }
      static basename(filePath, ext) {
        return import_path2.default.basename(filePath, ext);
      }
      static dirname(filePath) {
        return import_path2.default.dirname(filePath);
      }
      static extname(filePath) {
        return import_path2.default.extname(filePath);
      }
      static normalize(filePath) {
        return import_path2.default.normalize(filePath);
      }
      static isSafe(filePath, root) {
        const resolvedPath = import_path2.default.resolve(filePath);
        const resolvedRoot = import_path2.default.resolve(root);
        return resolvedPath.startsWith(resolvedRoot);
      }
      // --- Candidate resolution ---
      static async firstExisting(candidates) {
        for (const cand of candidates) {
          if (await _KrnlFS.fileExists(cand)) {
            return cand;
          }
        }
        return null;
      }
      // --- Watching ---
      static watchFile(filePath, handler, debounceMs = 100) {
        let timer = null;
        return import_fs3.default.watch(filePath, (event) => {
          if (timer)
            clearTimeout(timer);
          timer = setTimeout(() => handler(event), debounceMs);
        });
      }
      static watchDir(dirPath, handler, debounceMs = 100) {
        let timer = null;
        return import_fs3.default.watch(dirPath, (event, filename) => {
          if (timer)
            clearTimeout(timer);
          timer = setTimeout(() => handler(event, filename), debounceMs);
        });
      }
      // --- Temp ---
      static createTempFile(prefix = "tmp-") {
        return import_path2.default.join(import_os.default.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}.tmp`);
      }
      static createTempDir(prefix = "tmp-dir-") {
        const dir = import_path2.default.join(import_os.default.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}`);
        import_fs3.default.mkdirSync(dir, { recursive: true });
        return dir;
      }
      static async withTempDir(fn, prefix = "tmp-") {
        const tempDir = _KrnlFS.createTempDir(prefix);
        try {
          return await fn(tempDir);
        } finally {
          await _KrnlFS.deleteDir(tempDir, true).catch(() => {
          });
        }
      }
    };
  }
});

// src/krnl/tools/KrnlEnv.js
var import_fs4, import_path3, KrnlEnv;
var init_KrnlEnv = __esm({
  "src/krnl/tools/KrnlEnv.js"() {
    "use strict";
    import_fs4 = __toESM(require("fs"), 1);
    import_path3 = __toESM(require("path"), 1);
    KrnlEnv = class {
      /**
       * Reads a process environment variable with type coercion and defaults.
       */
      static get(key, defaultValue) {
        const val = process.env[key];
        if (val === void 0) {
          if (defaultValue !== void 0)
            return defaultValue;
          throw new Error(`[KrnlEnvError] Missing required environment variable: ${key}`);
        }
        if (typeof defaultValue === "number") {
          const num = Number(val);
          if (isNaN(num)) {
            throw new Error(`[KrnlEnvError] Expected number for ${key}, received: ${val}`);
          }
          return num;
        }
        if (typeof defaultValue === "boolean") {
          return val === "true" || val === "1";
        }
        try {
          if (defaultValue && typeof defaultValue === "object") {
            return JSON.parse(val);
          }
        } catch (e) {
        }
        return val;
      }
      /**
       * Asserts environment variable is set and returns its string value.
       */
      static require(key) {
        const val = process.env[key];
        if (val === void 0) {
          throw new Error(`[KrnlEnvError] Missing required environment variable: ${key}`);
        }
        return val;
      }
      /**
       * Loads a .env file and injects variables into process.env.
       */
      static load(filePath) {
        const file = filePath || import_path3.default.join(process.cwd(), ".env");
        if (!import_fs4.default.existsSync(file))
          return;
        try {
          const content = import_fs4.default.readFileSync(file, "utf8");
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
              continue;
            const equalsIndex = trimmed.indexOf("=");
            if (equalsIndex === -1)
              continue;
            const key = trimmed.slice(0, equalsIndex).trim();
            let value = trimmed.slice(equalsIndex + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            if (process.env[key] === void 0) {
              process.env[key] = value;
            }
          }
        } catch (e) {
        }
      }
      /**
       * Validates the entire config using a Zod schema.
       */
      static schema(zodSchema) {
        try {
          return zodSchema.parse(process.env);
        } catch (err) {
          throw new Error(`[KrnlEnvError] Environment validation failed: ${err.message || String(err)}`);
        }
      }
    };
  }
});

// src/krnl/tools/KrnlShell.js
var import_child_process, import_path4, import_fs5, KrnlShell;
var init_KrnlShell = __esm({
  "src/krnl/tools/KrnlShell.js"() {
    "use strict";
    import_child_process = require("child_process");
    import_path4 = __toESM(require("path"), 1);
    import_fs5 = __toESM(require("fs"), 1);
    KrnlShell = class {
      /**
       * Promisified command execution.
       */
      static exec(cmd, opts = {}) {
        const timeout = opts.timeout || 3e4;
        return new Promise((resolve, reject) => {
          (0, import_child_process.exec)(cmd, { ...opts, timeout }, (error, stdout, stderr) => {
            if (error) {
              reject(new Error(`[KrnlShellError] Command failed: ${cmd}
Exit Code: ${error.code}
Stderr: ${String(stderr)}`));
            } else {
              resolve({ stdout: String(stdout), stderr: String(stderr) });
            }
          });
        });
      }
      /**
       * Streaming command execution.
       */
      static spawn(cmd, args, opts = {}) {
        const child = (0, import_child_process.spawn)(cmd, args, opts);
        const promise = new Promise((resolve, reject) => {
          child.on("close", (code, signal) => {
            resolve({ code, signal });
          });
          child.on("error", (err) => {
            reject(err);
          });
        });
        return {
          pid: child.pid,
          kill: (signal) => child.kill(signal),
          promise
        };
      }
      /**
       * Defines posix vs win32 specific commands.
       */
      static platform(routing) {
        return process.platform === "win32" ? routing.win32 : routing.posix;
      }
      /**
       * Resolves the full path of a binary.
       */
      static which(cmd) {
        const envPath = process.env.PATH || "";
        const paths = envPath.split(import_path4.default.delimiter);
        const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
        for (const p of paths) {
          for (const ext of extensions) {
            const fullPath = import_path4.default.join(p, `${cmd}${ext}`);
            try {
              if (import_fs5.default.existsSync(fullPath) && import_fs5.default.statSync(fullPath).isFile()) {
                return fullPath;
              }
            } catch (e) {
            }
          }
        }
        return null;
      }
    };
  }
});

// src/krnl/tools/KrnlHTTP.js
var KrnlHTTP;
var init_KrnlHTTP = __esm({
  "src/krnl/tools/KrnlHTTP.js"() {
    "use strict";
    init_AsyncKit();
    KrnlHTTP = class _KrnlHTTP {
      /**
       * Helper to perform fetch with timeout and retries.
       */
      static async requestRaw(url, opts = {}) {
        const timeout = opts.timeout || 6e4;
        const retries = opts.retries || 0;
        const perform = async () => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          try {
            const response = await fetch(url, {
              ...opts,
              signal: controller.signal
            });
            clearTimeout(id);
            return response;
          } catch (e) {
            clearTimeout(id);
            throw e;
          }
        };
        return await AsyncKit.retry(perform, retries + 1, 1e3);
      }
      static async request(url, opts = {}) {
        try {
          const res = await _KrnlHTTP.requestRaw(url, opts);
          if (!res.ok) {
            return { status: "error", message: `HTTP Error ${res.status}: ${res.statusText}`, code: res.status };
          }
          const data = await res.json();
          return { status: "success", data };
        } catch (e) {
          return { status: "error", message: e.message || String(e) };
        }
      }
      static async get(url, opts = {}) {
        return await _KrnlHTTP.request(url, { ...opts, method: "GET" });
      }
      static async post(url, body, opts = {}) {
        return await _KrnlHTTP.request(url, {
          ...opts,
          method: "POST",
          headers: { "Content-Type": "application/json", ...opts.headers },
          body: JSON.stringify(body)
        });
      }
      static async put(url, body, opts = {}) {
        return await _KrnlHTTP.request(url, {
          ...opts,
          method: "PUT",
          headers: { "Content-Type": "application/json", ...opts.headers },
          body: JSON.stringify(body)
        });
      }
      static async del(url, opts = {}) {
        return await _KrnlHTTP.request(url, { ...opts, method: "DELETE" });
      }
      /**
       * Creates a client instance.
       */
      static createClient(baseUrl, defaultHeaders = {}) {
        return {
          get: (path14, opts = {}) => _KrnlHTTP.get(`${baseUrl}${path14}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
          post: (path14, body, opts = {}) => _KrnlHTTP.post(`${baseUrl}${path14}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
          put: (path14, body, opts = {}) => _KrnlHTTP.put(`${baseUrl}${path14}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
          del: (path14, opts = {}) => _KrnlHTTP.del(`${baseUrl}${path14}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
        };
      }
      /**
       * Streaming SSE / Chunk response.
       */
      static async *streamResponse(url, opts = {}) {
        const res = await _KrnlHTTP.requestRaw(url, opts);
        if (!res.ok || !res.body) {
          throw new Error(`Failed to initialize stream: HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done)
              break;
            yield decoder.decode(value, { stream: true });
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  }
});

// src/krnl/tools/GitManager.js
var import_fs6, import_path5, GitManager;
var init_GitManager = __esm({
  "src/krnl/tools/GitManager.js"() {
    "use strict";
    init_KrnlShell();
    import_fs6 = __toESM(require("fs"), 1);
    import_path5 = __toESM(require("path"), 1);
    GitManager = class _GitManager {
      static isRepo(dirPath) {
        return import_fs6.default.existsSync(import_path5.default.join(dirPath, ".git"));
      }
      static async init(dirPath) {
        if (_GitManager.isRepo(dirPath))
          return;
        await KrnlShell.exec("git init", { cwd: dirPath });
      }
      static async clone(repoUrl, destPath) {
        const parentDir = import_path5.default.dirname(destPath);
        if (!import_fs6.default.existsSync(parentDir)) {
          import_fs6.default.mkdirSync(parentDir, { recursive: true });
        }
        await KrnlShell.exec(`git clone ${repoUrl} ${import_path5.default.basename(destPath)}`, { cwd: parentDir });
      }
      static async commit(dirPath, message) {
        if (!_GitManager.isRepo(dirPath)) {
          throw new Error(`[GitManagerError] Directory ${dirPath} is not a git repository.`);
        }
        const { stdout: status } = await KrnlShell.exec("git status --porcelain", { cwd: dirPath });
        if (!status.trim()) {
          return false;
        }
        await KrnlShell.exec("git add -A", { cwd: dirPath });
        await KrnlShell.exec(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: dirPath });
        return true;
      }
      static async push(dirPath, remote = "origin", branch = "main") {
        if (!_GitManager.isRepo(dirPath)) {
          throw new Error(`[GitManagerError] Directory ${dirPath} is not a git repository.`);
        }
        await KrnlShell.exec(`git push ${remote} ${branch}`, { cwd: dirPath });
      }
    };
  }
});

// src/krnl/tools/index.js
var init_tools = __esm({
  "src/krnl/tools/index.js"() {
    "use strict";
    init_ObjectKit();
    init_AsyncKit();
    init_StringKit();
    init_CacheKit();
    init_KrnlFS();
    init_KrnlEnv();
    init_KrnlShell();
    init_KrnlHTTP();
    init_GitManager();
  }
});

// src/krnl/core/K_LIB_Krnl_Aiko_Client.ts
var K_LIB_Krnl_Aiko_Client_exports = {};
__export(K_LIB_Krnl_Aiko_Client_exports, {
  KrnlAikoClient: () => KrnlAikoClient
});
var KrnlAikoClient;
var init_K_LIB_Krnl_Aiko_Client = __esm({
  "src/krnl/core/K_LIB_Krnl_Aiko_Client.ts"() {
    "use strict";
    init_tools();
    KrnlAikoClient = class _KrnlAikoClient {
      baseUrl;
      lastUsedModelId = null;
      constructor(aikoPort, aikoHost = "localhost") {
        this.baseUrl = `http://${aikoHost}:${aikoPort}`;
      }
      static discover(system) {
        const aikoPeer = system.peers?.get("Aiko");
        if (aikoPeer && aikoPeer.address) {
          let addr = aikoPeer.address;
          if (!addr.startsWith("http")) {
            addr = `http://${addr}`;
          }
          try {
            const url = new URL(addr);
            return new _KrnlAikoClient(Number(url.port || 10095), url.hostname);
          } catch (e) {
            console.error("[KrnlAikoClient] Failed to parse discovered Aiko address:", addr, e);
          }
        }
        return null;
      }
      async infer(intelligenceSpec, systemPrompt, userPrompt) {
        const client = KrnlHTTP.createClient(this.baseUrl);
        const result = await client.post("/call/infer", {
          intelligenceSpec,
          systemPrompt,
          userPrompt
        });
        if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.payload && result.data.payload.status === "success" && result.data.payload.response) {
          this.lastUsedModelId = result.data.payload.modelId || null;
          return result.data.payload.response;
        }
        const errMsg = result.status === "success" ? result.data?.payload?.message || result.data?.message : result.message;
        throw new Error(errMsg || "Invalid or empty response from Aiko infer endpoint");
      }
      async downrankModel(modelId) {
        try {
          const client = KrnlHTTP.createClient(this.baseUrl);
          await client.post("/call/downrankModel", { modelId });
        } catch (e) {
          console.error("[KrnlAikoClient] Failed to send downrank request to Aiko:", e.message);
        }
      }
      async fetchCatalog() {
        const client = KrnlHTTP.createClient(this.baseUrl);
        const result = await client.post("/call/SessionManager/AgentProfileManager", {
          action: "list"
        });
        if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.profiles) {
          return result.data.profiles;
        }
        return {
          "endpoint-grade-1": { description: "Nano \u2014 simple CRUD" },
          "endpoint-grade-2": { description: "Mini \u2014 standard ops" },
          "endpoint-grade-3": { description: "Standard \u2014 moderate logic" },
          "endpoint-grade-4": { description: "Large \u2014 complex reasoning" },
          "endpoint-grade-5": { description: "Expert \u2014 escalation handler" },
          "orchestrator-standard": { description: "Standard routing" },
          "orchestrator-pro": { description: "Complex routing + escalation" }
        };
      }
      async isAlive() {
        try {
          const client = KrnlHTTP.createClient(this.baseUrl);
          const result = await client.post("/call/heartbeat", {});
          return result && result.status === "success";
        } catch (e) {
          return false;
        }
      }
      static getNotRunningMessage() {
        return "Aiko is not running. Please start it with: cd ~/Projects/Javascript/Aiko && node src/Aiko.js";
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_Base_Functionality_APIs.ts
var K_LIB_Krnl_System_Base_Functionality_APIs_exports = {};
__export(K_LIB_Krnl_System_Base_Functionality_APIs_exports, {
  adminCommandApi: () => adminCommandApi,
  aiOrchestrationApi: () => aiOrchestrationApi,
  buildEndpointDefinition: () => buildEndpointDefinition,
  deregisterAppApi: () => deregisterAppApi,
  discoverPeersApi: () => discoverPeersApi,
  findFreePortsApi: () => findFreePortsApi,
  getAikoCatalogApi: () => getAikoCatalogApi,
  getEndpointDefinitionsApi: () => getEndpointDefinitionsApi,
  getFullDocumentationApi: () => getFullDocumentationApi,
  getIngressNetworkTopologyApi: () => getIngressNetworkTopologyApi,
  getLastActionDocsApi: () => getLastActionDocsApi,
  getManifestApi: () => getManifestApi,
  getTaskListApi: () => getTaskListApi,
  getTelemetryLogApi: () => getTelemetryLogApi,
  getUsedPortsApi: () => getUsedPortsApi,
  heartbeatApi: () => heartbeatApi,
  heartbeatAppApi: () => heartbeatAppApi,
  listAppsApi: () => listAppsApi,
  lookupAppApi: () => lookupAppApi,
  registerAppApi: () => registerAppApi,
  setEndpointDefinitionApi: () => setEndpointDefinitionApi,
  shutdownApi: () => shutdownApi,
  systemCommandsCollectorHandler: () => systemCommandsCollectorHandler,
  telemetryApi: () => telemetryApi
});
function heartbeatApi(entity) {
  return () => ({
    name: entity.entityName,
    type: entity.systemType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function telemetryApi(entity) {
  return () => {
    const summary = telemetry.getSummary();
    return {
      entityName: entity.entityName,
      systemType: entity.systemType,
      flags: entity.getSystemFlags(),
      owner: entity.hierarchyManager.getOwnerEntity()?.entityName || null,
      ownedEntities: entity.hierarchyManager.getAllOwnedComponentEntities().map((e) => e.entityName),
      activeRoutes: entity.commComponent.listRoutes(),
      uptime: typeof process !== "undefined" && process.uptime ? process.uptime() : null,
      performance: summary.metrics || summary,
      callLogs: summary.callLogs,
      libraryUsage: summary.libraryUsage,
      dataUsage: summary.dataUsage
    };
  };
}
function adminCommandApi(entity) {
  return async ({ command, args }) => {
    console.log(`[${entity.entityName}] Admin command: ${command}`, args);
    if (command === "set-discoverable") {
      return {
        status: "acknowledged",
        command,
        flags: entity.setDiscoverable(Boolean(args?.value))
      };
    }
    if (command === "reserve") {
      return {
        status: "acknowledged",
        command,
        flags: entity.reserveFor(args?.serviceName || "unknown")
      };
    }
    if (command === "release-reservation") {
      return {
        status: "acknowledged",
        command,
        flags: entity.releaseReservation(args?.serviceName || null)
      };
    }
    if (command === "shutdown") {
      console.log(`[${entity.entityName}] Graceful shutdown initiated via admin command.`);
      setTimeout(() => {
        entity.dispose();
        process.exit(0);
      }, 500);
      return {
        status: "acknowledged",
        command,
        message: "System will shutdown in 500ms"
      };
    }
    return { status: "acknowledged", command, flags: entity.getSystemFlags() };
  };
}
function discoverPeersApi(entity) {
  return ({ includeBusy = true } = {}) => {
    const peers = entity.listPeers();
    if (includeBusy) return peers;
    return peers.filter((peer) => !peer.busy);
  };
}
function getManifestApi(entity) {
  return () => entity.getManifest();
}
function getLastActionDocsApi(entity) {
  return () => {
    return {
      preemptiveDocumentation: entity._lastPreemptiveDoc || null,
      errorDocumentation: entity._lastErrorDoc || null
    };
  };
}
function getFullDocumentationApi(entity) {
  return () => {
    if (entity._documentationProvider && typeof entity._documentationProvider.getDocsForLayer === "function") {
      return entity._documentationProvider.getDocsForLayer("LAYER_1_ENTRY") || [];
    }
    return [];
  };
}
function systemCommandsCollectorHandler(entity) {
  return (msg) => {
    console.log(`[${entity.entityName}] system-commands received:`, JSON.stringify(msg.data));
  };
}
function getUsedPortsApi(entity) {
  return () => {
    const registry = entity.getRegisteredPorts();
    return {
      entity: entity.entityName,
      ports: Object.values(registry),
      registry
    };
  };
}
function findFreePortsApi(entity) {
  return async ({
    count = 1,
    rangeStart = 3e3,
    rangeEnd = 65535
  }) => {
    if (count < 1) throw new Error("count must be \u2265 1");
    if (rangeStart < 1 || rangeEnd > 65535 || rangeStart > rangeEnd) {
      throw new Error("Invalid port range: 1 \u2264 rangeStart \u2264 rangeEnd \u2264 65535");
    }
    const usedSet = new Set(
      Object.values(entity.getRegisteredPorts())
    );
    const usedByPeer = {
      [entity.entityName]: Array.from(usedSet)
    };
    const peers = entity.listPeers();
    await Promise.allSettled(
      peers.map(async (peer) => {
        try {
          const remote = entity.getRemoteEntity(peer.id);
          if (!remote) return;
          const result = await remote.call("getUsedPorts", {});
          const payload = result?.payload ?? result;
          const peerPorts = Array.isArray(payload?.ports) ? payload.ports : [];
          usedByPeer[peer.id] = peerPorts;
          peerPorts.forEach((p) => usedSet.add(p));
        } catch (_) {
        }
      })
    );
    const freePorts = [];
    for (let p = rangeStart; p <= rangeEnd && freePorts.length < count; p++) {
      if (!usedSet.has(p)) freePorts.push(p);
    }
    if (freePorts.length < count) {
      throw new Error(
        `Only ${freePorts.length} free port(s) available in [${rangeStart}, ${rangeEnd}]; requested ${count}.`
      );
    }
    return { freePorts, queriedPeers: peers.length, totalUsedCount: usedSet.size, usedByPeer };
  };
}
function shutdownApi(entity) {
  return ({ timeoutMs = 1e4 } = {}) => {
    setTimeout(() => {
      entity.gracefulShutdown({ timeoutMs }).catch((err) => {
        console.error(`[${entity.entityName}] gracefulShutdown error:`, err?.message ?? err);
        process.exit(1);
      });
    }, 200);
    return {
      status: "acknowledged",
      message: `Graceful shutdown initiated for '${entity.entityName}' and all owned microservices.`,
      entity: entity.entityName,
      timeoutMs
    };
  };
}
function getIngressNetworkTopologyApi(entity) {
  return () => {
    if (!entity._ingressNetwork) return null;
    return entity.getIngressNetworkTopology();
  };
}
function registerAppApi(entity) {
  return ({ name, port, pid }) => {
    if (!entity._registryApps) {
      entity._registryApps = /* @__PURE__ */ new Map();
    }
    entity._registryApps.set(name, {
      name,
      port,
      pid,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastHeartbeat: Date.now()
    });
    console.log(`[Registry] Registered app "${name}" on port ${port} (PID ${pid})`);
    return { success: true };
  };
}
function deregisterAppApi(entity) {
  return ({ name }) => {
    if (entity._registryApps) {
      const deleted = entity._registryApps.delete(name);
      if (deleted) {
        console.log(`[Registry] Deregistered app "${name}"`);
      }
    }
    return { success: true };
  };
}
function heartbeatAppApi(entity) {
  return ({ name }) => {
    if (entity._registryApps && entity._registryApps.has(name)) {
      const app = entity._registryApps.get(name);
      app.lastHeartbeat = Date.now();
      return { success: true };
    }
    return { success: false, error: `App "${name}" not registered` };
  };
}
function lookupAppApi(entity) {
  return ({ name }) => {
    if (entity._registryApps && entity._registryApps.has(name)) {
      const app = entity._registryApps.get(name);
      return {
        name: app.name,
        port: app.port,
        pid: app.pid,
        registeredAt: app.registeredAt
      };
    }
    return { error: `App "${name}" not found` };
  };
}
function listAppsApi(entity) {
  return () => {
    if (!entity._registryApps) return [];
    return Array.from(entity._registryApps.values()).map((app) => ({
      name: app.name,
      port: app.port,
      pid: app.pid,
      registeredAt: app.registeredAt
    }));
  };
}
function buildEndpointDefinition(fn, entity, runtimeOverride = null, memory = "") {
  const isSystem = entity._krnlSystemEndpointIds?.has(fn.id) || fn.id === "getEndpointDefinitions" || fn.id === "setEndpointDefinition" || fn.id === "getTelemetryLog";
  let inputSchema = {};
  let outputSchema = {};
  if (fn.schema) {
    if (fn.schema.input) {
      try {
        inputSchema = (0, import_zod_to_json_schema.zodToJsonSchema)(fn.schema.input);
      } catch (e) {
        inputSchema = { type: "object" };
      }
    }
    if (fn.schema.output) {
      try {
        outputSchema = (0, import_zod_to_json_schema.zodToJsonSchema)(fn.schema.output);
      } catch (e) {
        outputSchema = { type: "object" };
      }
    }
  }
  const defaultSpec = {
    reasoning: 3,
    planning: 1,
    toolUsage: 1,
    structuredOutput: 5,
    jsonStrictness: 5,
    coding: 1,
    extraction: 3,
    classification: 3,
    summarization: 3,
    creativity: 3,
    determinism: 5,
    context: 3,
    vision: 1,
    multimodal: 1,
    outputComplexity: 3
  };
  const codeSpec = fn.ai?.intelligenceSpec || fn.intelligenceSpec || defaultSpec;
  const mergedSpec = runtimeOverride?.intelligenceSpec || codeSpec;
  const emittersList = [];
  if (fn.emitters) {
    fn.emitters.forEach((_, eid) => {
      emittersList.push(`${fn.id}:${eid}`);
    });
  }
  return {
    id: fn.id,
    category: isSystem ? "krnl_system" : "app",
    method: fn.method || "POST",
    visibility: fn.visibility || "public",
    inputSchema,
    outputSchema,
    description: runtimeOverride?.description || fn.description || `Execute ${fn.id}`,
    systemInstructions: runtimeOverride?.systemInstructions || fn.ai?.systemInstructions || "",
    examples: runtimeOverride?.examples || fn.examples || [],
    examplePayload: runtimeOverride?.examplePayload || fn.example || null,
    intelligenceSpec: mergedSpec,
    agentTools: runtimeOverride?.agentTools || fn.ai?.agentTools || [],
    retryConfig: runtimeOverride?.retryConfig || fn.ai?.retryConfig || { maxRetries: 4, timeoutMs: 12e3, retryDelayMs: 500, backoffStrategy: "LINEAR" },
    staticWatchVars: runtimeOverride?.staticWatchVars || fn.ai?.staticWatchVars || [],
    dynamicWatchVars: runtimeOverride?.dynamicWatchVars || fn.ai?.dynamicWatchVars || [],
    accessPolicy: fn.accessPolicy || null,
    emitters: emittersList,
    sourcePath: fn.sourcePath || null,
    memory: memory || "",
    runtimeEdited: !!runtimeOverride
  };
}
function getEndpointDefinitionsApi(entity) {
  return async () => {
    const list = [];
    const store = entity._aiProfilesStore;
    const overrides = store ? await store.getAllEndpointDefinitions() : {};
    const seen = /* @__PURE__ */ new Set();
    const processF = async (fn) => {
      if (seen.has(fn.id)) return;
      seen.add(fn.id);
      const override = overrides[fn.id] || null;
      const mem = store ? await store.getEndpointMemory(fn.id) : "";
      list.push(buildEndpointDefinition(fn, entity, override, mem));
    };
    if (entity.localFunctionalities) {
      for (const fn of entity.localFunctionalities.values()) {
        await processF(fn);
      }
    }
    if (entity.remoteFunctionalities) {
      for (const fn of entity.remoteFunctionalities.values()) {
        await processF(fn);
      }
    }
    return list;
  };
}
function setEndpointDefinitionApi(entity) {
  return async ({ id, override }) => {
    const store = entity._aiProfilesStore;
    if (!store) {
      throw new Error("Runtime Store not initialized.");
    }
    const current = await store.getEndpointDefinition(id) || {};
    const updated = { ...current, ...override };
    await store.setEndpointDefinition(id, updated);
    if (typeof entity.initializeAiLayer === "function") {
      await entity.initializeAiLayer(entity._entityDataDir);
    }
    const fn = entity.localFunctionalities.get(id) || entity.remoteFunctionalities.get(id);
    if (!fn) {
      throw new Error(`Endpoint ${id} not found.`);
    }
    const mem = await store.getEndpointMemory(id);
    return buildEndpointDefinition(fn, entity, updated, mem);
  };
}
function getTelemetryLogApi(entity) {
  return async ({ limit } = {}) => {
    const store = entity._aiProfilesStore;
    if (!store) return [];
    return await store.getTelemetryLog(limit);
  };
}
function getAikoCatalogApi(entity) {
  return async () => {
    if (!entity._aikoClient) {
      throw new Error("Aiko client not initialized.");
    }
    try {
      entity._aikoCatalog = await entity._aikoClient.fetchCatalog();
      return { status: "success", catalog: entity._aikoCatalog };
    } catch (e) {
      return { status: "error", message: `Failed to fetch catalog: ${e.message}`, catalog: entity._aikoCatalog };
    }
  };
}
function aiOrchestrationApi(entity) {
  return async ({ message }) => {
    if (!entity._aiOrchestrator) {
      const { KrnlAikoClient: KrnlAikoClient2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_Aiko_Client(), K_LIB_Krnl_Aiko_Client_exports));
      throw new Error(KrnlAikoClient2.getNotRunningMessage());
    }
    try {
      await entity._aiOrchestrator.orchestrate(message);
      return { status: "pipeline-started", info: entity._aiOrchestrator.taskRunner.getStatus() };
    } catch (e) {
      return { status: "error", message: e.message };
    }
  };
}
function getTaskListApi(entity) {
  return () => {
    if (!entity._aiOrchestrator) {
      return { status: "inactive", tasks: [], cursor: 0 };
    }
    return entity._aiOrchestrator.taskRunner.getStatus();
  };
}
var import_zod_to_json_schema;
var init_K_LIB_Krnl_System_Base_Functionality_APIs = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Base_Functionality_APIs.ts"() {
    "use strict";
    init_K_LIB_Krnl_Telemetry();
    import_zod_to_json_schema = require("zod-to-json-schema");
  }
});

// src/krnl/core/K_LIB_Krnl_Protocol_MCP.ts
var KrnlMcpProtocol;
var init_K_LIB_Krnl_Protocol_MCP = __esm({
  "src/krnl/core/K_LIB_Krnl_Protocol_MCP.ts"() {
    "use strict";
    KrnlMcpProtocol = class {
      system;
      /**
       * @param system
       */
      constructor(system) {
        this.system = system;
      }
      /**
       * Returns the MCP Tools list based on system functionalities.
       */
      async listTools() {
        if (this.system._ingressNetwork) {
          const tools2 = this.system._ingressNetwork.getAggregatedMcpTools();
          return { tools: tools2 };
        }
        const manifest = this.system.getManifest();
        const apiIds = Object.keys(manifest.inputs.api);
        const tools = apiIds.map((fid) => {
          const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
          const description = functionality?.description || `Execute ${fid} on ${this.system.entityName}`;
          let inputSchema = { type: "object", properties: {} };
          if (functionality?.schema?.input) {
            inputSchema.properties = {
              data: { type: "object", description: "Input data for the functionality" }
            };
          }
          return {
            name: fid,
            description,
            inputSchema
          };
        });
        return { tools };
      }
      /**
       * Handles an MCP JSON-RPC request.
       */
      async handleRequest(rpc, opts = {}) {
        const { method, params, id } = rpc;
        if (method === "tools/list") {
          const result = await this.listTools();
          return { jsonrpc: "2.0", id, result };
        }
        if (method === "tools/call") {
          const { name, arguments: args } = params;
          try {
            let result;
            if (this.system._ingressNetwork && name.includes(".")) {
              const parts = name.split(".");
              const prefix = parts[0].toLowerCase();
              const toolName = parts.slice(1).join(".");
              const entry = this.system._ingressNetwork.members.get(prefix);
              if (entry) {
                result = await entry.entity.call(toolName, args, opts);
              } else {
                throw new Error(`Ingress member for prefix '${prefix}' not found.`);
              }
            } else {
              result = await this.system.call(name, args, opts);
            }
            return {
              jsonrpc: "2.0",
              id,
              result: {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
              }
            };
          } catch (error) {
            return {
              jsonrpc: "2.0",
              id,
              error: {
                code: -32e3,
                message: error.message,
                data: {
                  errorDocumentation: error.errorDocumentation || null
                }
              }
            };
          }
        }
        if (method === "initialize") {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: { listChanged: false }
              },
              serverInfo: {
                name: this.system.entityName,
                version: "1.0.0"
              }
            }
          };
        }
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: "Method not found" }
        };
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Protocol_ACP.ts
var KrnlAcpProtocol;
var init_K_LIB_Krnl_Protocol_ACP = __esm({
  "src/krnl/core/K_LIB_Krnl_Protocol_ACP.ts"() {
    "use strict";
    KrnlAcpProtocol = class {
      system;
      /**
       * @param system
       */
      constructor(system) {
        this.system = system;
      }
      /**
       * ACP Information endpoint.
       */
      getInfo() {
        const manifest = this.system.getManifest();
        return {
          agentId: this.system.entityName,
          type: manifest.systemType,
          version: "1.0.0",
          protocols: ["ACP", "MCP", "KrnlWS"],
          description: `Krnl System Entity: ${this.system.entityName}`
        };
      }
      /**
       * ACP Capabilities endpoint.
       */
      getCapabilities() {
        const manifest = this.system.getManifest();
        return {
          services: Object.keys(manifest.inputs.api).map((fid) => ({
            id: fid,
            name: fid,
            type: "functionality"
          })),
          events: manifest.outputs.events.map((eid) => ({
            id: eid,
            type: "event"
          }))
        };
      }
      /**
       * ACP Message endpoint handler.
       */
      async handleMessage(payload, opts = {}) {
        const { action, data } = payload;
        try {
          const result = await this.system.call(action, data, opts);
          return {
            status: "success",
            result,
            metadata: {
              processedBy: this.system.entityName,
              timestamp: Date.now()
            }
          };
        } catch (error) {
          return {
            status: "error",
            error: error.message,
            errorDocumentation: error.errorDocumentation || null,
            metadata: {
              processedBy: this.system.entityName,
              timestamp: Date.now()
            }
          };
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts
var K_LIB_Krnl_System_Unified_Http_Adapter_exports = {};
__export(K_LIB_Krnl_System_Unified_Http_Adapter_exports, {
  krnlUnifiedHttpAdapter: () => krnlUnifiedHttpAdapter
});
var import_http, krnlUnifiedHttpAdapter;
var init_K_LIB_Krnl_System_Unified_Http_Adapter = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts"() {
    "use strict";
    import_http = __toESM(require("http"), 1);
    init_K_LIB_Krnl_Protocol_MCP();
    init_K_LIB_Krnl_Protocol_ACP();
    init_K_LIB_Krnl_Base_Concepts();
    krnlUnifiedHttpAdapter = class {
      system;
      port;
      host;
      server;
      _isExternalServer;
      mcp;
      acp;
      enableFriendlyRouting;
      /**
       * @param system
       * @param port
       * @param host
       */
      constructor(system, port, host = "0.0.0.0") {
        this.system = system;
        this.port = port;
        this.host = host;
        this.server = null;
        this._isExternalServer = false;
        this.mcp = new KrnlMcpProtocol(system);
        this.acp = new KrnlAcpProtocol(system);
        this.enableFriendlyRouting = false;
      }
      /**
       * Starts the adapter.
       */
      async start(externalServer = null) {
        if (this.server) return;
        if (externalServer) {
          this.server = externalServer;
          this._isExternalServer = true;
          this.server.on("request", (req, res) => {
            this._handleRequest(req, res);
          });
        } else {
          this.server = import_http.default.createServer((req, res) => {
            this._handleRequest(req, res);
          });
          return new Promise((resolve, reject) => {
            this.server.listen(this.port, this.host, () => {
              Logger.log(`[${this.system.entityName}] Unified HTTP Adapter active on http://${this.host}:${this.port}`);
              resolve();
            });
            this.server.on("error", reject);
          });
        }
      }
      stop() {
        if (this.server && !this._isExternalServer) {
          this.server.close();
          console.log(`[${this.system.entityName}] Unified HTTP Adapter stopped.`);
        }
        this.server = null;
      }
      async _handleRequest(req, res) {
        const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        const path14 = url.pathname;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }
        if (this.system._ingressNetwork) {
          const segments = path14.split("/").filter(Boolean);
          const prefix = segments[0]?.toLowerCase();
          if (prefix && this.system._ingressNetwork.members.has(prefix)) {
            if (segments.length === 3 && segments[1] === "frontend" && segments[2] === "default" && !path14.endsWith("/")) {
              res.writeHead(302, { "Location": path14 + "/" + url.search });
              res.end();
              return;
            }
            let subPath = "/" + segments.slice(1).join("/") + url.search;
            if (path14.endsWith("/") && !subPath.endsWith("/")) {
              subPath += "/";
            }
            await this.system._ingressNetwork.routeHttpRequest(prefix, req, res, subPath);
            return;
          }
        }
        if (this.system._ingressNetwork) {
          const segments = path14.split("/").filter(Boolean);
          if (segments[0] && segments[1] && segments[0].toLowerCase() !== "default") {
            const key = `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
            if (this.system._ingressNetwork.members.has(key)) {
              await this.system._ingressNetwork.routeHttpRequest(key, req, res, req.url || "/");
              return;
            }
          }
        }
        if (path14.startsWith("/frontend/default")) {
          if (this.system._frontend) {
            const subPath = path14.slice("/frontend/default".length) || "/";
            await this.system._frontend.handleRequest(req, res, subPath);
          } else {
            this._sendJson(res, 404, { status: "error", message: "Frontend not enabled." });
          }
          return;
        }
        const isKrnlRoute = path14.startsWith("/call/") || path14.startsWith("/sse/") || path14.startsWith("/mcp") || path14.startsWith("/acp") || path14 === "/manifest" || path14 === "/health";
        if (!isKrnlRoute) {
          if (this.enableFriendlyRouting) {
            let fid = path14.slice(1);
            if (fid.endsWith("/")) fid = fid.slice(0, -1);
            const functionality = this.system.localFunctionalities.get(fid) || this.system.remoteFunctionalities.get(fid);
            const resolved = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : null;
            if (functionality) {
              const expectedMethod = (resolved || functionality).method || "POST";
              if (req.method !== expectedMethod) {
                this._sendJson(res, 405, {
                  status: "error",
                  message: `Method ${req.method} not allowed for ${fid}. Use ${expectedMethod}.`
                });
                return;
              }
              try {
                Logger.log(`[HttpAdapter] Friendly route hit: ${fid} (${req.method})`);
                const input = req.method === "GET" ? Object.fromEntries(url.searchParams.entries()) : await this._readJsonBody(req);
                const data = input && typeof input === "object" && !("data" in input) && Object.keys(input).length > 0 ? { data: input } : input;
                const result = await this.system.call(fid, data.data || data, {
                  unwrap: false,
                  callerPort: req.socket?.remotePort,
                  accessKey: req.headers["x-krnl-access-key"]
                });
                this._sendJson(res, 200, result);
              } catch (e) {
                Logger.error(`[HttpAdapter] Friendly route error (${fid}):`, e.message);
                this._sendJson(res, 200, {
                  status: "error",
                  message: e.message,
                  errorDocumentation: e.errorDocumentation || null
                });
              }
              return;
            }
          }
          this._sendJson(res, 404, this.system.getNotFoundResponse(path14));
          return;
        }
        try {
          if (path14.startsWith("/call/")) {
            const fid = path14.split("/")[2];
            const body = await this._readJsonBody(req);
            const result = await this.system.call(fid, body, {
              unwrap: false,
              callerPort: req.socket?.remotePort,
              accessKey: req.headers["x-krnl-access-key"]
            });
            this._sendJson(res, 200, result);
            return;
          }
          if (path14.startsWith("/sse/")) {
            const fid = path14.split("/")[2];
            this._handleSse(req, res, fid);
            return;
          }
          if (path14 === "/ai") {
            const { message } = await this._readJsonBody(req);
            if (!this.system._aiOrchestrator) {
              const { KrnlAikoClient: KrnlAikoClient2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_Aiko_Client(), K_LIB_Krnl_Aiko_Client_exports));
              this._sendJson(res, 200, {
                status: "error",
                message: KrnlAikoClient2.getNotRunningMessage()
              });
              return;
            }
            const result = await this.system._aiOrchestrator.handle(message);
            this._sendJson(res, 200, result);
            return;
          }
          if (path14 === "/ai/manifest") {
            const agents = this.system._aiOrchestrator?.getAgentSummaries() ?? [];
            this._sendJson(res, 200, {
              aiEnabled: !!this.system._aiOrchestrator,
              aikoAlive: this.system.isAikoAlive(),
              endpoints: agents
            });
            return;
          }
          if (path14 === "/mcp") {
            const body = await this._readJsonBody(req);
            const result = await this.mcp.handleRequest(body, {
              callerPort: req.socket?.remotePort,
              accessKey: req.headers["x-krnl-access-key"]
            });
            this._sendJson(res, 200, result);
            return;
          }
          if (path14 === "/health") {
            const healthData = { status: "ok", entity: this.system.entityName };
            if (this.system._subappErrors && this.system._subappErrors.length > 0) {
              healthData.status = "issues";
              healthData.issues = this.system._subappErrors;
            }
            this._sendJson(res, 200, healthData);
            return;
          }
          if (path14.startsWith("/acp")) {
            if (path14 === "/acp/info" || path14 === "/acp") {
              this._sendJson(res, 200, this.acp.getInfo());
            } else if (path14 === "/acp/capabilities") {
              this._sendJson(res, 200, this.acp.getCapabilities());
            } else if (path14 === "/acp/messages" && req.method === "POST") {
              const body = await this._readJsonBody(req);
              const result = await this.acp.handleMessage(body, {
                callerPort: req.socket?.remotePort,
                accessKey: req.headers["x-krnl-access-key"]
              });
              this._sendJson(res, 200, result);
            } else {
              this._sendJson(res, 404, { error: "ACP route not found" });
            }
            return;
          }
          if (path14 === "/manifest") {
            if (this.system._ingressNetwork) {
              this._sendJson(res, 200, this.system._ingressNetwork.getGrossManifest(`http://${req.headers.host}`));
            } else {
              this._sendJson(res, 200, this.system.getManifest());
            }
            return;
          }
        } catch (error) {
          Logger.error(`[HttpAdapter] Fatal handler error ${path14}:`, error.message || error);
          this._sendJson(res, 200, {
            status: "error",
            message: error.message || String(error),
            errorDocumentation: error.errorDocumentation || null
          });
        }
      }
      _handleSse(req, res, fid) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });
        const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
        if (!functionality) {
          res.write(`data: ${JSON.stringify({ error: "Functionality not found" })}

`);
          res.end();
          return;
        }
        const stateEmitter = functionality.emitters.get("state:changed");
        const unsubscribe = stateEmitter?.subscribe((msg) => {
          res.write(`data: ${JSON.stringify(msg.data)}

`);
        });
        const interval = setInterval(() => {
          if (res.writable) {
            res.write(": keepalive\n\n");
          }
        }, 15e3);
        req.on("close", () => {
          if (unsubscribe) unsubscribe();
          clearInterval(interval);
          res.end();
        });
      }
      _sendJson(res, status, data) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }
      _readJsonBody(req) {
        return new Promise((resolve, reject) => {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            if (!body) return resolve({});
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error("Invalid JSON body"));
            }
          });
        });
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_Frontend_Adapter.ts
var import_fs7, import_path6, import_http2, import_net, import_url, import_meta, _metaUrl, _filename, _dirname, KrnlFrontendAdapter;
var init_K_LIB_Krnl_System_Frontend_Adapter = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Frontend_Adapter.ts"() {
    "use strict";
    import_fs7 = __toESM(require("fs"), 1);
    import_path6 = __toESM(require("path"), 1);
    import_http2 = __toESM(require("http"), 1);
    import_net = __toESM(require("net"), 1);
    import_url = require("url");
    init_K_ENT_Krnl_System_Entity_Base();
    import_meta = {};
    _metaUrl = typeof import_meta !== "undefined" && import_meta.url ? import_meta.url : null;
    _filename = _metaUrl ? (0, import_url.fileURLToPath)(_metaUrl) : "";
    _dirname = _metaUrl ? import_path6.default.dirname(_filename) : "";
    KrnlFrontendAdapter = class extends krnlSystemEntityBase {
      childProcess = null;
      appPort = -1;
      socketPath = null;
      appPath;
      options;
      originalConfigName = null;
      patchedConfigName = null;
      registeredRoutes = /* @__PURE__ */ new Set();
      routeWatcher = null;
      status = "stopped";
      lastLogLine = "";
      statusMessage = "Not started";
      constructor(name, appPath, options = {}) {
        super(`frontend-${name}`, null, -1, "127.0.0.1", { Singleton: true, _skipMagneticLoading: true });
        this.appPath = appPath;
        this.options = options;
        this._isIngressNetworkMember = true;
        this.unifiedHttpAdapter._handleRequest = async (req, res) => {
          const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
          const pathname = url.pathname;
          if (pathname.endsWith("/__krnl/config")) {
            res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
            const rawHost = this.options.backendHost || "127.0.0.1";
            const host = rawHost === "::" || rawHost === "0.0.0.0" || rawHost === "" ? "localhost" : rawHost;
            const port = this.options.backendPort || 10099;
            const prefix = this.options.frontendPrefix || "frontend";
            res.end(JSON.stringify({
              wsUrl: `ws://${host}:${port}/ws`,
              httpUrl: `http://${host}:${port}`,
              basePath: `/${prefix}/${this.entityName.replace(/^frontend-/, "").toLowerCase()}`,
              name: this.entityName.replace(/^frontend-/, "").toLowerCase()
            }));
            return;
          }
          if (pathname.endsWith("/__krnl/bridge.js")) {
            const candidatePaths = [
              import_path6.default.resolve(_dirname, "./K_LIB_Krnl_Frontend_Bridge_Bundle.global.js"),
              import_path6.default.resolve(_dirname, "./K_LIB_Krnl_Frontend_Bridge_Bundle.js"),
              import_path6.default.resolve(_dirname, "../../dist/K_LIB_Krnl_Frontend_Bridge_Bundle.global.js"),
              import_path6.default.resolve(_dirname, "../../dist/K_LIB_Krnl_Frontend_Bridge_Bundle.js")
            ];
            const finalPath = candidatePaths.find((p) => import_fs7.default.existsSync(p));
            if (finalPath) {
              res.writeHead(200, { "Content-Type": "application/javascript", "Access-Control-Allow-Origin": "*" });
              res.end(import_fs7.default.readFileSync(finalPath));
            } else {
              res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
              res.end(JSON.stringify({ status: "error", message: `Bridge bundle not found. Tried paths: ${candidatePaths.join(", ")}` }));
            }
            return;
          }
          await this.proxyRequest(req, res, req.url || "/");
        };
      }
      async loadBridgesFromFolder(folderPath) {
        if (!import_fs7.default.existsSync(folderPath)) return;
        const files = import_fs7.default.readdirSync(folderPath);
        for (const file of files) {
          if (file.endsWith(".bridge.ts") || file.endsWith(".bridge.js")) {
            const fullPath = import_path6.default.resolve(folderPath, file);
            try {
              const module2 = await import(fullPath);
              const bridgeDesc = module2.bridge;
              if (bridgeDesc && bridgeDesc.name) {
                console.log(`[FrontendAdapter:${this.entityName}] Loaded bridge script: ${bridgeDesc.name}`);
                if (this.options.backendPort === void 0 && bridgeDesc.backendPort !== void 0) {
                  this.options.backendPort = bridgeDesc.backendPort;
                }
                if (this.options.backendHost === void 0 && bridgeDesc.backendHost !== void 0) {
                  this.options.backendHost = bridgeDesc.backendHost;
                }
              }
            } catch (err) {
              console.error(`[FrontendAdapter:${this.entityName}] Failed to load bridge script ${file}:`, err.message);
            }
          }
        }
      }
      async scanAndRegisterApiRoutes() {
        const pagesApiDir = import_path6.default.join(this.appPath, "pages", "api");
        const appDir = import_path6.default.join(this.appPath, "app");
        const foundRoutes = [];
        if (import_fs7.default.existsSync(pagesApiDir)) {
          this._findPagesRoutes(pagesApiDir, pagesApiDir, foundRoutes);
        }
        if (import_fs7.default.existsSync(appDir)) {
          this._findAppRoutes(appDir, appDir, foundRoutes);
        }
        for (const route of foundRoutes) {
          if (!this.registeredRoutes.has(route)) {
            this.registeredRoutes.add(route);
            this.addLocal({
              id: route,
              api: async (input) => {
                return new Promise((resolve, reject) => {
                  const reqData = JSON.stringify(input || {});
                  const reqOptions = this.socketPath ? {
                    socketPath: this.socketPath,
                    path: `/${route}`,
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Content-Length": Buffer.byteLength(reqData)
                    }
                  } : {
                    hostname: "127.0.0.1",
                    port: this.appPort,
                    path: `/${route}`,
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Content-Length": Buffer.byteLength(reqData)
                    }
                  };
                  const req = import_http2.default.request(reqOptions, (res) => {
                    let data = "";
                    res.on("data", (chunk) => data += chunk);
                    res.on("end", () => {
                      try {
                        resolve(JSON.parse(data));
                      } catch {
                        resolve({ status: "success", raw: data });
                      }
                    });
                  });
                  req.on("error", (err) => reject(err));
                  req.write(reqData);
                  req.end();
                });
              }
            });
            console.log(`[FrontendAdapter:${this.entityName}] Dynamically registered route endpoint: ${route}`);
          }
        }
        for (const route of Array.from(this.registeredRoutes)) {
          if (!foundRoutes.includes(route)) {
            this.localFunctionalities.delete(route);
            this.registeredRoutes.delete(route);
            console.log(`[FrontendAdapter:${this.entityName}] Dynamically removed route endpoint: ${route}`);
          }
        }
      }
      _findPagesRoutes(dir, baseDir, routes) {
        if (!import_fs7.default.existsSync(dir)) return;
        const files = import_fs7.default.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith(".") || file === "node_modules") continue;
          const fullPath = import_path6.default.join(dir, file);
          const stat = import_fs7.default.statSync(fullPath);
          if (stat.isDirectory()) {
            this._findPagesRoutes(fullPath, baseDir, routes);
          } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
            const rel = import_path6.default.relative(baseDir, fullPath);
            const withoutExt = rel.substring(0, rel.lastIndexOf("."));
            const routePath = `api/${withoutExt.replace(/\\/g, "/")}`;
            routes.push(routePath);
          }
        }
      }
      _findAppRoutes(dir, baseDir, routes) {
        if (!import_fs7.default.existsSync(dir)) return;
        const files = import_fs7.default.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith(".") || file === "node_modules") continue;
          const fullPath = import_path6.default.join(dir, file);
          const stat = import_fs7.default.statSync(fullPath);
          if (stat.isDirectory()) {
            this._findAppRoutes(fullPath, baseDir, routes);
          } else if ((file === "route.ts" || file === "route.js") && dir.includes("api")) {
            const apiIndex = dir.indexOf("api");
            const routePath = dir.substring(apiIndex).replace(/\\/g, "/");
            routes.push(routePath);
          }
        }
      }
      setupApiRouteWatcher() {
        if (this.options.mode === "prod") return;
        const pagesApiDir = import_path6.default.join(this.appPath, "pages", "api");
        const appDir = import_path6.default.join(this.appPath, "app");
        const onChange = () => {
          this.scanAndRegisterApiRoutes().catch(console.error);
        };
        if (import_fs7.default.existsSync(pagesApiDir)) {
          this.routeWatcher = import_fs7.default.watch(pagesApiDir, { recursive: true }, onChange);
        } else if (import_fs7.default.existsSync(appDir)) {
          this.routeWatcher = import_fs7.default.watch(appDir, { recursive: true }, onChange);
        }
      }
      async startApp() {
        console.log(`[FrontendAdapter:${this.entityName}] startApp starting...`);
        const wrapperDir = import_path6.default.dirname(this.appPath);
        await this.loadBridgesFromFolder(wrapperDir);
        await this.loadBridgesFromFolder(import_path6.default.join(wrapperDir, "bridges"));
        await this.scanAndRegisterApiRoutes();
        this.setupApiRouteWatcher();
        let packageJson = {};
        const pkgPath = import_path6.default.join(this.appPath, "package.json");
        if (import_fs7.default.existsSync(pkgPath)) {
          try {
            packageJson = JSON.parse(import_fs7.default.readFileSync(pkgPath, "utf8"));
          } catch (_) {
          }
        }
        const isEsm = packageJson.type === "module";
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        let framework = "generic";
        if (deps["next"]) framework = "nextjs";
        else if (deps["vite"]) framework = "vite";
        const cleanName = this.entityName.replace(/^frontend-/, "").toLowerCase();
        const prefix = this.options.frontendPrefix || "frontend";
        const basePath = `/${prefix}/${cleanName}`;
        const socketName = `krnl-frontend-${cleanName}.sock`;
        this.socketPath = import_path6.default.join("/tmp", socketName);
        if (import_fs7.default.existsSync(this.socketPath)) {
          try {
            import_fs7.default.unlinkSync(this.socketPath);
          } catch (_) {
          }
        }
        if (framework === "nextjs") {
          await this._patchNextConfig(basePath, isEsm);
        }
        const initialBasePort = this.options.backendPort && this.options.backendPort > 0 ? this.options.backendPort + 2e3 : 12e3;
        this.appPort = await this._probeAvailablePort(initialBasePort, "127.0.0.1");
        this.socketPath = null;
        let command = process.execPath;
        let args = [];
        if (framework === "nextjs") {
          const nextBin = import_path6.default.join(this.appPath, "node_modules", "next", "dist", "bin", "next");
          const fallbackNextBin = import_path6.default.join(this.appPath, "node_modules", ".bin", "next");
          const resolvedNextBin = import_fs7.default.existsSync(nextBin) ? nextBin : import_fs7.default.existsSync(fallbackNextBin) ? fallbackNextBin : null;
          if (resolvedNextBin) {
            command = process.execPath;
            args = [resolvedNextBin, this.options.mode === "prod" ? "start" : "dev", "-H", "127.0.0.1", "-p", this.appPort.toString()];
          } else {
            command = import_path6.default.join(import_path6.default.dirname(process.execPath), "npx");
            args = ["next", this.options.mode === "prod" ? "start" : "dev", "-H", "127.0.0.1", "-p", this.appPort.toString()];
          }
        } else if (framework === "vite") {
          const viteBin = import_path6.default.join(this.appPath, "node_modules", "vite", "bin", "vite.js");
          if (import_fs7.default.existsSync(viteBin)) {
            command = process.execPath;
            args = [viteBin, "--host", "127.0.0.1", "--port", this.appPort.toString(), "--strictPort", "--base", `${basePath}/`];
          } else {
            command = import_path6.default.join(import_path6.default.dirname(process.execPath), "npx");
            args = ["vite", "--host", "127.0.0.1", "--port", this.appPort.toString(), "--strictPort", "--base", `${basePath}/`];
          }
        } else {
          command = "npm";
          args = ["run", this.options.mode === "prod" ? "start" : "dev"];
        }
        const host = this.options.backendHost || "127.0.0.1";
        const port = this.options.backendPort || 10099;
        const env = {
          ...process.env,
          ...this.appPort > 0 ? { PORT: this.appPort.toString() } : {},
          NEXT_PUBLIC_KRNL_BASE_PATH: basePath,
          NEXT_PUBLIC_KRNL_WS_URL: `ws://${host}:${port}/ws`,
          NEXT_PUBLIC_KRNL_HTTP_URL: `http://${host}:${port}`,
          ...this.options.env
        };
        const targetDesc = this.socketPath ? `Unix Socket: ${this.socketPath}` : `127.0.0.1:${this.appPort}`;
        console.log(`[FrontendAdapter] Spawning custom frontend '${this.entityName}' (${framework}) in background (${targetDesc})...`);
        this.status = "starting";
        this.statusMessage = "Spawning dev server process...";
        this.lastLogLine = "Spawning process...";
        const { spawn: spawn3 } = await import("child_process");
        this.childProcess = spawn3(command, args, {
          cwd: this.appPath,
          env,
          detached: false,
          shell: false,
          stdio: ["ignore", "pipe", "pipe"]
        });
        const handleLog = (data) => {
          const text = data.toString("utf8");
          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            this.lastLogLine = lines[lines.length - 1];
            this.statusMessage = this.lastLogLine;
          }
        };
        if (this.childProcess.stdout) {
          this.childProcess.stdout.on("data", handleLog);
        }
        if (this.childProcess.stderr) {
          this.childProcess.stderr.on("data", handleLog);
        }
        this.childProcess.on("exit", (code) => {
          console.log(`[FrontendAdapter] Process for '${this.entityName}' exited with code ${code}`);
          this.status = "stopped";
          this.statusMessage = `Process exited (code ${code})`;
          this.childProcess = null;
        });
        let ready = false;
        const timeout = this.options.startupTimeoutMs ?? 6e4;
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (this.status === "stopped") {
            throw new Error(`[FrontendAdapter] Custom frontend '${this.entityName}' process exited early: ${this.statusMessage}`);
          }
          ready = await new Promise((resolve) => {
            if (this.socketPath) {
              if (!import_fs7.default.existsSync(this.socketPath)) {
                resolve(false);
                return;
              }
              const socket = import_net.default.connect({ path: this.socketPath });
              socket.on("connect", () => {
                socket.destroy();
                resolve(true);
              });
              socket.on("error", () => resolve(false));
            } else {
              const socket = import_net.default.connect({ port: this.appPort, host: "127.0.0.1" });
              socket.on("connect", () => {
                socket.destroy();
                resolve(true);
              });
              socket.on("error", () => resolve(false));
            }
          });
          if (ready) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        if (!ready) {
          this.status = "failed";
          this.statusMessage = `Failed to boot within ${timeout / 1e3}s`;
          throw new Error(`[FrontendAdapter] Custom frontend '${this.entityName}' failed to boot on ${targetDesc} within ${timeout / 1e3}s.`);
        }
        this.status = "running";
        this.statusMessage = "Ready and serving";
        console.log(`[FrontendAdapter] Custom frontend '${this.entityName}' successfully booted.`);
      }
      async _patchNextConfig(basePath, isEsm) {
        const configTs = import_path6.default.join(this.appPath, "next.config.ts");
        const configMjs = import_path6.default.join(this.appPath, "next.config.mjs");
        const configJs = import_path6.default.join(this.appPath, "next.config.js");
        this._restoreNextConfig();
        const targetConfig = import_fs7.default.existsSync(configTs) ? configTs : import_fs7.default.existsSync(configMjs) ? configMjs : import_fs7.default.existsSync(configJs) ? configJs : null;
        if (targetConfig) {
          const content = import_fs7.default.readFileSync(targetConfig, "utf8");
          if (content.includes("NEXT_PUBLIC_KRNL_BASE_PATH")) {
            return;
          }
          this.originalConfigName = import_path6.default.basename(targetConfig) + ".bak";
          this.patchedConfigName = import_path6.default.basename(targetConfig);
          import_fs7.default.copyFileSync(targetConfig, import_path6.default.join(this.appPath, this.originalConfigName));
          let updated = content;
          if (content.includes("const nextConfig") || content.includes("let nextConfig")) {
            updated = content.replace(/(const|let)\s+nextConfig\s*:\s*NextConfig\s*=\s*\{/, `$1 nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',`);
          } else if (content.includes("module.exports = {")) {
            updated = content.replace("module.exports = {", `module.exports = {
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',`);
          } else if (content.includes("export default {")) {
            updated = content.replace("export default {", `export default {
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',`);
          } else {
            updated = content + `
// KrnlTS injected basePath
if (typeof module !== 'undefined' && module.exports) { module.exports.basePath = process.env.NEXT_PUBLIC_KRNL_BASE_PATH || ''; }
`;
          }
          import_fs7.default.writeFileSync(targetConfig, updated, "utf8");
        } else {
          this.patchedConfigName = "next.config.ts";
          const newConfigContent = `import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',
};
export default nextConfig;
`;
          import_fs7.default.writeFileSync(import_path6.default.join(this.appPath, this.patchedConfigName), newConfigContent, "utf8");
        }
      }
      _restoreNextConfig() {
        const checkAndRestore = (origName, patchedName) => {
          const origPath = import_path6.default.join(this.appPath, origName);
          const patchedPath = import_path6.default.join(this.appPath, patchedName);
          if (import_fs7.default.existsSync(origPath)) {
            if (import_fs7.default.existsSync(patchedPath)) {
              import_fs7.default.unlinkSync(patchedPath);
            }
            import_fs7.default.renameSync(origPath, patchedPath);
          }
        };
        checkAndRestore("next.config.original.ts", "next.config.ts");
        checkAndRestore("next.config.original.mjs", "next.config.mjs");
        checkAndRestore("next.config.original.js", "next.config.js");
        this.originalConfigName = null;
        this.patchedConfigName = null;
      }
      async proxyRequest(req, res, subPath) {
        if (!this.socketPath && (this.appPort === -1 || !this.childProcess)) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: "Service Temporarily Unavailable: Frontend is starting up or not running." }));
          return;
        }
        const options = this.socketPath ? {
          socketPath: this.socketPath,
          path: subPath,
          method: req.method,
          headers: req.headers
        } : {
          hostname: "127.0.0.1",
          port: this.appPort,
          path: subPath,
          method: req.method,
          headers: req.headers
        };
        const proxyReq = import_http2.default.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on("error", (err) => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: `Bad Gateway: ${err.message}` }));
        });
        req.pipe(proxyReq);
      }
      dispose() {
        this.status = "stopped";
        this.statusMessage = "Stopped";
        if (this.routeWatcher) {
          this.routeWatcher.close();
          this.routeWatcher = null;
        }
        if (this.childProcess) {
          console.log(`[FrontendAdapter] Killing child process (PID: ${this.childProcess.pid}) for '${this.entityName}'`);
          try {
            this.childProcess.kill("SIGTERM");
          } catch (_) {
          }
          this.childProcess = null;
        }
        if (this.socketPath && import_fs7.default.existsSync(this.socketPath)) {
          try {
            import_fs7.default.unlinkSync(this.socketPath);
          } catch (_) {
          }
        }
        this._restoreNextConfig();
        super.dispose();
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_App_Adapter.ts
var K_LIB_Krnl_System_App_Adapter_exports = {};
__export(K_LIB_Krnl_System_App_Adapter_exports, {
  KrnlNonKrnlAppAdapter: () => KrnlNonKrnlAppAdapter
});
var import_fs8, import_path7, import_http3, import_net2, KrnlNonKrnlAppAdapter;
var init_K_LIB_Krnl_System_App_Adapter = __esm({
  "src/krnl/core/K_LIB_Krnl_System_App_Adapter.ts"() {
    "use strict";
    import_fs8 = __toESM(require("fs"), 1);
    import_path7 = __toESM(require("path"), 1);
    import_http3 = __toESM(require("http"), 1);
    import_net2 = __toESM(require("net"), 1);
    init_K_ENT_Krnl_System_Entity_Base();
    init_KrnlShell();
    KrnlNonKrnlAppAdapter = class extends krnlSystemEntityBase {
      childProcess = null;
      appPort = -1;
      appPath;
      constructor(name, appPath) {
        super(name, null, -1, "127.0.0.1", { Singleton: true, _skipMagneticLoading: true });
        this.appPath = appPath;
        this._isIngressNetworkMember = true;
        this.unifiedHttpAdapter._handleRequest = async (req, res) => {
          await this.proxyRequest(req, res, req.url || "/");
        };
      }
      async startApp() {
        this.appPort = await this._probeAvailablePort(11e3, "127.0.0.1");
        let command = "node";
        let args = ["."];
        try {
          const pkgPath = import_path7.default.join(this.appPath, "package.json");
          if (import_fs8.default.existsSync(pkgPath)) {
            const packageJson = JSON.parse(import_fs8.default.readFileSync(pkgPath, "utf8"));
            if (packageJson.scripts?.start) {
              command = "npm";
              args = ["run", "start"];
            } else if (packageJson.main) {
              args = [packageJson.main];
            }
          }
        } catch (_) {
        }
        const env = {
          ...process.env,
          PORT: this.appPort.toString()
        };
        console.log(`[AppAdapter] Spawning non-Krnl app '${this.entityName}' in background (Port: ${this.appPort})...`);
        this.childProcess = KrnlShell.spawn(command, args, {
          cwd: this.appPath,
          env,
          stdio: "inherit"
        });
        let ready = false;
        const timeout = 15e3;
        const start = Date.now();
        while (Date.now() - start < timeout) {
          ready = await new Promise((resolve) => {
            const socket = import_net2.default.connect(this.appPort, "127.0.0.1");
            socket.on("connect", () => {
              socket.destroy();
              resolve(true);
            });
            socket.on("error", () => resolve(false));
          });
          if (ready) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        if (!ready) {
          throw new Error(`[AppAdapter] Non-Krnl app '${this.entityName}' failed to boot on port ${this.appPort} within 15s.`);
        }
        console.log(`[AppAdapter] Non-Krnl app '${this.entityName}' successfully booted.`);
      }
      async proxyRequest(req, res, subPath) {
        if (this.appPort === -1) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: "Service Temporarily Unavailable: Sub-app not running." }));
          return;
        }
        const options = {
          hostname: "127.0.0.1",
          port: this.appPort,
          path: subPath,
          method: req.method,
          headers: req.headers
        };
        const proxyReq = import_http3.default.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on("error", (err) => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: `Bad Gateway: ${err.message}` }));
        });
        req.pipe(proxyReq);
      }
      dispose() {
        if (this.childProcess) {
          console.log(`[AppAdapter] Killing child process (PID: ${this.childProcess.pid}) for '${this.entityName}'`);
          this.childProcess.kill("SIGTERM");
          this.childProcess = null;
        }
        super.dispose();
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_Magnetic_Loader.ts
var K_LIB_Krnl_System_Magnetic_Loader_exports = {};
__export(K_LIB_Krnl_System_Magnetic_Loader_exports, {
  KrnlMagneticLoader: () => KrnlMagneticLoader,
  magneticStorage: () => magneticStorage,
  subappLocalStorage: () => subappLocalStorage
});
var import_fs9, import_path8, import_url2, import_async_hooks, magneticStorage, subappLocalStorage, KrnlMagneticLoader;
var init_K_LIB_Krnl_System_Magnetic_Loader = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Magnetic_Loader.ts"() {
    "use strict";
    import_fs9 = __toESM(require("fs"), 1);
    import_path8 = __toESM(require("path"), 1);
    import_url2 = require("url");
    import_async_hooks = require("async_hooks");
    init_K_ENT_Krnl_System_Entity_Base();
    magneticStorage = new import_async_hooks.AsyncLocalStorage();
    if (!globalThis.__krnlSubAppLocalStorage) {
      globalThis.__krnlSubAppLocalStorage = new import_async_hooks.AsyncLocalStorage();
    }
    subappLocalStorage = globalThis.__krnlSubAppLocalStorage;
    KrnlMagneticLoader = class {
      /**
       * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
       */
      static async loadAll(entity, baseDir) {
        console.log(`[MagneticLoader] loadAll called for entity '${entity.entityName}' with baseDir '${baseDir}'`);
        const functionalitiesDir = import_path8.default.join(baseDir, "functionalities");
        if (import_fs9.default.existsSync(functionalitiesDir)) {
          const funcDirs = await import_fs9.default.promises.readdir(functionalitiesDir, { withFileTypes: true });
          for (const dirent of funcDirs) {
            if (dirent.isDirectory()) {
              await this.loadFunctionality(entity, import_path8.default.join(functionalitiesDir, dirent.name), dirent.name);
            }
          }
        }
        const entitiesDir = import_path8.default.join(baseDir, "entities");
        if (import_fs9.default.existsSync(entitiesDir)) {
          const entDirs = await import_fs9.default.promises.readdir(entitiesDir, { withFileTypes: true });
          for (const dirent of entDirs) {
            if (dirent.isDirectory()) {
              await this.loadEntity(entity, import_path8.default.join(entitiesDir, dirent.name), dirent.name);
            }
          }
        }
        const subappsDir = import_path8.default.join(baseDir, "subapps");
        const isSubApp = subappLocalStorage.getStore() || entity._isSubApp || entity._isIngressNetworkMember;
        if (import_fs9.default.existsSync(subappsDir) && !isSubApp) {
          const apps = await import_fs9.default.promises.readdir(subappsDir, { withFileTypes: true });
          const subappConfigs = [];
          for (const dirent of apps) {
            if (dirent.isDirectory()) {
              const appPath = import_path8.default.join(subappsDir, dirent.name);
              const buildOk = await this.ensureSubAppBuilt(appPath, dirent.name, entity);
              if (!buildOk) {
                continue;
              }
              const config = await this.detectSubApp(appPath, dirent.name);
              if (config) {
                subappConfigs.push(config);
              }
            }
          }
          if (subappConfigs.length > 0) {
            console.log(`[MagneticLoader] Automatically enabling Ingress Network on '${entity.entityName}' with ${subappConfigs.length} sub-apps.`);
            await entity.startIngressNetwork(subappConfigs);
          }
        }
        const frontendDir = import_path8.default.join(baseDir, "frontend", "default");
        if (import_fs9.default.existsSync(frontendDir) && !isSubApp) {
          const configPath = import_path8.default.join(frontendDir, "krnl-frontend.json");
          let frontendOptions = { title: entity.entityName, theme: "dark" };
          if (import_fs9.default.existsSync(configPath)) {
            try {
              const content = import_fs9.default.readFileSync(configPath, "utf-8");
              frontendOptions = { ...frontendOptions, ...JSON.parse(content) };
            } catch (_) {
            }
          }
          entity.enableFrontend(frontendOptions);
          console.log(`[MagneticLoader] Auto-enabled default frontend for '${entity.entityName}' (found frontend/default folder).`);
        }
        let generalFrontendDir = import_path8.default.join(baseDir, "frontend");
        if (!import_fs9.default.existsSync(generalFrontendDir)) {
          generalFrontendDir = import_path8.default.join(baseDir, "frontends");
        }
        if (import_fs9.default.existsSync(generalFrontendDir) && !isSubApp) {
          const entries = await import_fs9.default.promises.readdir(generalFrontendDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== "default") {
              const appPath = import_path8.default.join(generalFrontendDir, entry.name);
              if (import_fs9.default.existsSync(import_path8.default.join(appPath, "package.json")) || import_fs9.default.existsSync(import_path8.default.join(appPath, "krnl-frontend.json"))) {
                let options = {};
                const configPath = import_path8.default.join(appPath, "krnl-frontend.json");
                if (import_fs9.default.existsSync(configPath)) {
                  try {
                    options = JSON.parse(import_fs9.default.readFileSync(configPath, "utf-8"));
                  } catch (_) {
                  }
                }
                console.log(`[MagneticLoader] Detected custom frontend '${entry.name}' at '${appPath}'. Registering...`);
                entity.startCustomFrontend(entry.name, appPath, options).catch((err) => {
                  console.error(`[MagneticLoader] Custom frontend '${entry.name}' startup error:`, err.message || err);
                });
              }
            }
          }
        }
        const hasAiConfig = [...entity.localFunctionalities.values()].some((f) => f.ai?.enabled);
        let hasAiStore = false;
        const storePath = import_path8.default.join(baseDir, "krnl_runtime_state.db");
        if (import_fs9.default.existsSync(storePath)) {
          try {
            const storeContent = JSON.parse(import_fs9.default.readFileSync(storePath, "utf-8"));
            if (storeContent?.endpointAgentProfiles && Object.keys(storeContent.endpointAgentProfiles).length > 0) {
              hasAiStore = true;
            }
          } catch (e) {
          }
        }
        if (hasAiConfig || hasAiStore) {
          console.log(`[MagneticLoader] Automatically initializing AI Layer on '${entity.entityName}'...`);
          await entity.initializeAiLayer(baseDir);
        }
      }
      static async loadFunctionality(entity, funcDir, funcName) {
        const descriptorPath = import_path8.default.join(funcDir, `${funcName}.js`);
        let atom = null;
        if (import_fs9.default.existsSync(descriptorPath)) {
          const mod = await import((0, import_url2.pathToFileURL)(descriptorPath).href);
          atom = mod[`${funcName}Atom`] || mod.default || mod.Atom;
        }
        if (!atom) {
          atom = {
            id: funcName,
            visibility: "public",
            emitters: {}
          };
          const statePath = import_path8.default.join(funcDir, "state_data", "state.js");
          if (import_fs9.default.existsSync(statePath)) {
            const mod = await import((0, import_url2.pathToFileURL)(statePath).href);
            atom.initialState = mod[`${funcName.toLowerCase()}InitialState`] || mod.initialState || mod.default;
          }
          const logicPath = import_path8.default.join(funcDir, "main_function", "logic.js");
          if (import_fs9.default.existsSync(logicPath)) {
            const mod = await import((0, import_url2.pathToFileURL)(logicPath).href);
            atom.api = mod.main || mod.default;
          }
          const lifecyclePath = import_path8.default.join(funcDir, "main_function", "lifecycle.js");
          if (import_fs9.default.existsSync(lifecyclePath)) {
            const mod = await import((0, import_url2.pathToFileURL)(lifecyclePath).href);
            atom.onMount = mod.onMount;
            atom.onTeardown = mod.onTeardown;
          }
          const eventsDir2 = import_path8.default.join(funcDir, "events");
          if (import_fs9.default.existsSync(eventsDir2)) {
            const eventFiles = await import_fs9.default.promises.readdir(eventsDir2);
            for (const file of eventFiles) {
              if (file.endsWith(".js")) {
                const name = import_path8.default.basename(file, ".js");
                atom.emitters[name] = {};
              }
            }
          }
        }
        const helpers = {};
        const helpersDir = import_path8.default.join(funcDir, "helper_functions");
        if (import_fs9.default.existsSync(helpersDir)) {
          const files = await import_fs9.default.promises.readdir(helpersDir);
          for (const file of files) {
            if (file.endsWith(".js")) {
              const name = import_path8.default.basename(file, ".js");
              const mod = await import((0, import_url2.pathToFileURL)(import_path8.default.join(helpersDir, file)).href);
              helpers[name] = mod[name] || mod.default || mod;
              this.registerGlobalWrapper(name);
            }
          }
        }
        const events = {};
        const eventsDir = import_path8.default.join(funcDir, "events");
        if (import_fs9.default.existsSync(eventsDir)) {
          const files = await import_fs9.default.promises.readdir(eventsDir);
          for (const file of files) {
            if (file.endsWith(".js")) {
              const name = import_path8.default.basename(file, ".js");
              const mod = await import((0, import_url2.pathToFileURL)(import_path8.default.join(eventsDir, file)).href);
              events[name] = mod[name] || mod.default || mod;
              this.registerGlobalWrapper(name);
            }
          }
        }
        const originalApi = atom.api;
        if (originalApi) {
          atom.api = async (input, context) => {
            return await magneticStorage.run({ helpers, events }, async () => {
              return await originalApi(input, context);
            });
          };
        }
        entity.addLocal(atom);
      }
      static async loadEntity(parent, entDir, entName) {
        const fileToImport = import_path8.default.join(entDir, `${entName}.js`);
        if (import_fs9.default.existsSync(fileToImport)) {
          const mod = await import((0, import_url2.pathToFileURL)(fileToImport).href);
          const ClassToUse = mod[entName] || mod.default;
          if (ClassToUse) {
            parent.hierarchyManager.createComponentEntity(entName, ClassToUse);
            console.log(`[MagneticLoader] Magnetically instantiated child entity: ${entName} under ${parent.entityName}`);
          }
        }
      }
      static async ensureSubAppBuilt(appPath, appName, entity) {
        const packageJsonPath = import_path8.default.join(appPath, "package.json");
        if (!import_fs9.default.existsSync(packageJsonPath)) {
          return true;
        }
        const assemblerPath = import_path8.default.join(appPath, "assembler.js");
        let distPath = import_path8.default.join(appPath, "dist", `${appName}.js`);
        if (import_fs9.default.existsSync(packageJsonPath)) {
          try {
            const pkgJson = JSON.parse(import_fs9.default.readFileSync(packageJsonPath, "utf-8"));
            if (pkgJson.main) {
              distPath = import_path8.default.resolve(appPath, pkgJson.main);
            }
          } catch (_) {
          }
        }
        let gitUpdated = false;
        const gitDir = import_path8.default.join(appPath, ".git");
        if (import_fs9.default.existsSync(gitDir)) {
          console.log(`[MagneticLoader] Checking for git remote updates for sub-app '${appName}'...`);
          try {
            const { exec: exec3 } = await import("child_process");
            const { promisify: promisify2 } = await import("util");
            const execPromise = promisify2(exec3);
            await execPromise("git fetch", { cwd: appPath, timeout: 3e3 });
            const { stdout } = await execPromise("git status -uno", { cwd: appPath, timeout: 3e3 });
            if (stdout.includes("Your branch is behind") || stdout.includes("can be fast-forwarded")) {
              console.log(`[MagneticLoader] Remote updates found for sub-app '${appName}'. Pulling changes...`);
              const pullResult = await execPromise("git pull", { cwd: appPath, timeout: 5e3 });
              console.log(`[MagneticLoader] Git pull result for '${appName}':`, pullResult.stdout);
              gitUpdated = true;
            } else {
              console.log(`[MagneticLoader] Sub-app '${appName}' git repository is up to date.`);
            }
          } catch (err) {
            console.warn(`[MagneticLoader] Warning: git update check failed for '${appName}':`, err.message || err);
          }
        }
        if (!import_fs9.default.existsSync(assemblerPath) || !import_fs9.default.existsSync(distPath) || !import_fs9.default.existsSync(import_path8.default.join(appPath, "node_modules")) || gitUpdated) {
          console.log(`[MagneticLoader] Sub-app '${appName}' ${gitUpdated ? "was updated via git" : "is missing build artifacts"}. Initiating auto-build...`);
          try {
            const pkgJson = JSON.parse(import_fs9.default.readFileSync(packageJsonPath, "utf-8"));
            const hasBuildScript = pkgJson.scripts && pkgJson.scripts.build;
            if (!hasBuildScript) {
              throw new Error(`package.json is missing a 'build' script.`);
            }
            const nodeModulesPath = import_path8.default.join(appPath, "node_modules");
            if (!import_fs9.default.existsSync(nodeModulesPath)) {
              let installCmd = "npm install --no-audit --no-fund";
              if (import_fs9.default.existsSync(import_path8.default.join(appPath, "pnpm-lock.yaml"))) {
                installCmd = "pnpm install";
              } else if (import_fs9.default.existsSync(import_path8.default.join(appPath, "yarn.lock"))) {
                installCmd = "yarn install";
              }
              console.log(`[MagneticLoader] Installing dependencies for '${appName}' using '${installCmd}'...`);
              const { exec: exec4 } = await import("child_process");
              const { promisify: promisify3 } = await import("util");
              const execPromise2 = promisify3(exec4);
              await execPromise2(installCmd, { cwd: appPath });
            } else {
              const pkgJson2 = JSON.parse(import_fs9.default.readFileSync(packageJsonPath, "utf-8"));
              const hasKrnlts = pkgJson2.dependencies && pkgJson2.dependencies.krnlts || pkgJson2.devDependencies && pkgJson2.devDependencies.krnlts;
              if (hasKrnlts) {
                let updateCmd = "npm update krnlts";
                if (import_fs9.default.existsSync(import_path8.default.join(appPath, "pnpm-lock.yaml"))) {
                  updateCmd = "pnpm update krnlts";
                } else if (import_fs9.default.existsSync(import_path8.default.join(appPath, "yarn.lock"))) {
                  updateCmd = "yarn upgrade krnlts";
                }
                console.log(`[MagneticLoader] Automatically updating krnlts dependency for '${appName}' using '${updateCmd}'...`);
                try {
                  const { exec: exec4 } = await import("child_process");
                  const { promisify: promisify3 } = await import("util");
                  const execPromise2 = promisify3(exec4);
                  await execPromise2(updateCmd, { cwd: appPath });
                } catch (err) {
                  console.warn(`[MagneticLoader] Warning: auto-updating krnlts for '${appName}' failed:`, err.message || err);
                }
              }
            }
            let buildCmd = "npm run build";
            if (import_fs9.default.existsSync(import_path8.default.join(appPath, "pnpm-lock.yaml"))) {
              buildCmd = "pnpm run build";
            } else if (import_fs9.default.existsSync(import_path8.default.join(appPath, "yarn.lock"))) {
              buildCmd = "yarn build";
            }
            console.log(`[MagneticLoader] Building '${appName}' using '${buildCmd}'...`);
            const { exec: exec3 } = await import("child_process");
            const { promisify: promisify2 } = await import("util");
            const execPromise = promisify2(exec3);
            await execPromise(buildCmd, { cwd: appPath });
            if (!import_fs9.default.existsSync(assemblerPath)) {
              console.log(`[MagneticLoader] Automatically generating assembler.js for '${appName}'...`);
              const code = `export { ${appName} as default } from "./dist/${appName}.js";
`;
              import_fs9.default.writeFileSync(assemblerPath, code, "utf-8");
            }
            console.log(`[MagneticLoader] Sub-app '${appName}' successfully built and prepared.`);
          } catch (err) {
            const errMsg = err.message || String(err);
            console.error(`[MagneticLoader] Failed to build sub-app '${appName}':`, errMsg);
            entity._subappErrors = entity._subappErrors || [];
            entity._subappErrors.push({
              subapp: appName,
              error: errMsg
            });
            return false;
          }
        }
        return true;
      }
      static async detectSubApp(appPath, appName) {
        const assemblerPath = import_path8.default.join(appPath, "assembler.js");
        if (import_fs9.default.existsSync(assemblerPath)) {
          const mod = await import((0, import_url2.pathToFileURL)(assemblerPath).href);
          const ServiceClass = mod[appName] || mod.default;
          if (ServiceClass) {
            const isKrnlSubclass = ServiceClass.prototype && (ServiceClass.prototype instanceof krnlSystemEntityBase || typeof ServiceClass.prototype.boot === "function");
            return {
              ServiceClass,
              prefix: appName.toLowerCase(),
              isKrnl: !!isKrnlSubclass,
              entryPath: isKrnlSubclass ? assemblerPath : appPath
            };
          }
        }
        const packageJsonPath = import_path8.default.join(appPath, "package.json");
        if (import_fs9.default.existsSync(packageJsonPath)) {
          if (import_fs9.default.existsSync(import_path8.default.join(appPath, "KrnlFrontendModule.ts"))) {
            return null;
          }
          return {
            prefix: appName.toLowerCase(),
            isKrnl: false,
            entryPath: appPath
          };
        }
        return null;
      }
      static registerGlobalWrapper(name) {
        if (!globalThis[name]) {
          Object.defineProperty(globalThis, name, {
            value: (...args) => {
              const store = magneticStorage.getStore();
              const fn = store?.helpers?.[name] || store?.events?.[name];
              if (!fn) {
                throw new Error(`[MagneticSystem] Dynamic asset '${name}' called outside active functionality context.`);
              }
              return fn(...args);
            },
            configurable: true,
            writable: true
          });
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_Ingress_Network.ts
var import_path9, KrnlIngressNetwork;
var init_K_LIB_Krnl_System_Ingress_Network = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Ingress_Network.ts"() {
    "use strict";
    init_K_LIB_Krnl_System_Frontend_Adapter();
    import_path9 = __toESM(require("path"), 1);
    KrnlIngressNetwork = class {
      members = /* @__PURE__ */ new Map();
      async addMember(admin, config) {
        const prefix = config.prefix.toLowerCase();
        if (this.members.has(prefix)) {
          console.log(`[IngressNetwork] Member prefix '${prefix}' already registered. Returning existing entity.`);
          return this.members.get(prefix).entity;
        }
        let entity;
        if (config.isKrnl === false || !config.ServiceClass) {
          const { KrnlNonKrnlAppAdapter: KrnlNonKrnlAppAdapter2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_System_App_Adapter(), K_LIB_Krnl_System_App_Adapter_exports));
          const adapter = new KrnlNonKrnlAppAdapter2(config.prefix, config.entryPath || "");
          await adapter.startApp();
          entity = adapter;
        } else {
          const ServiceClass = config.ServiceClass;
          const memberPort = config.port ?? -1;
          const args = config.constructorArgs ?? [];
          const { subappLocalStorage: subappLocalStorage2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_System_Magnetic_Loader(), K_LIB_Krnl_System_Magnetic_Loader_exports));
          const appDir = config.entryPath ? import_path9.default.dirname(config.entryPath) : "";
          entity = await subappLocalStorage2.run({ appPath: appDir }, async () => {
            const ent = new ServiceClass(memberPort, ...args);
            if (ent._magneticLoadPromise) {
              await ent._magneticLoadPromise;
            }
            return ent;
          });
        }
        entity._isIngressNetworkMember = true;
        if (typeof entity._resolveReady === "function") {
          entity._resolveReady();
        }
        admin.hierarchyManager.addComponentEntityInstance(entity);
        await admin.registerPort(prefix, -1);
        this.members.set(prefix, {
          entity,
          config,
          addedAt: Date.now(),
          memberType: "subapp"
        });
        return entity;
      }
      async addFrontendMember(admin, config) {
        const prefix = config.options?.frontendPrefix || "frontend";
        const key = `${prefix}/${config.name.toLowerCase()}`;
        if (this.members.has(key)) {
          console.log(`[IngressNetwork] Frontend member '${key}' already registered. Returning existing entity.`);
          return this.members.get(key).entity;
        }
        const options = { ...config.options };
        if (!options.backendPort || options.backendPort <= 0) {
          options.backendPort = admin.commPort > 0 ? admin.commPort : admin.options?.commPort || 10099;
        }
        if (!options.backendHost) {
          const rawHost = admin.host;
          options.backendHost = rawHost === "::" || rawHost === "0.0.0.0" || rawHost === "" ? "localhost" : rawHost;
        }
        const adapter = new KrnlFrontendAdapter(config.name, config.appPath, options);
        adapter._isIngressNetworkMember = true;
        if (typeof adapter._resolveReady === "function") {
          adapter._resolveReady();
        }
        admin.hierarchyManager.addComponentEntityInstance(adapter);
        await admin.registerPort(key, -1);
        this.members.set(key, {
          entity: adapter,
          config,
          addedAt: Date.now(),
          memberType: "frontend"
        });
        adapter.startApp().catch((err) => {
          console.error(`[IngressNetwork] Frontend '${config.name}' startApp failed:`, err.message || err);
        });
        return adapter;
      }
      async removeMember(admin, prefix) {
        const key = prefix.toLowerCase();
        const entry = this.members.get(key);
        if (!entry) return false;
        await admin.unregisterPort(key);
        admin.hierarchyManager.disposeComponentEntity(entry.entity.id);
        this.members.delete(key);
        return true;
      }
      getGrossManifest(adminBaseUrl) {
        const list = Array.from(this.members.entries()).map(([prefix, entry]) => {
          return {
            prefix,
            entityName: entry.entity.entityName,
            manifestEndpoint: `${adminBaseUrl}/${prefix}/manifest`
          };
        });
        return {
          type: "IngressNetworkManifest",
          members: list
        };
      }
      getAggregatedMcpTools() {
        const allTools = [];
        for (const [prefix, entry] of this.members.entries()) {
          const manifest = entry.entity.getManifest();
          const apis = manifest?.inputs?.api || {};
          for (const fid of Object.keys(apis)) {
            const api = apis[fid];
            if (api.visibility === "public") {
              const namespacedName = `${prefix}.${fid}`;
              allTools.push({
                name: namespacedName,
                description: api.description || `MCP Tool for ${entry.entity.entityName} functionality: ${fid}`,
                inputSchema: api.schema?.input || { type: "object" }
              });
            }
          }
        }
        return allTools;
      }
      async routeHttpRequest(prefix, req, res, subPath) {
        const entry = this.members.get(prefix.toLowerCase());
        if (!entry) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: `Ingress member prefix '${prefix}' not found.` }));
          return;
        }
        const originalUrl = req.url;
        req.url = subPath;
        try {
          await entry.entity.unifiedHttpAdapter._handleRequest(req, res);
        } finally {
          req.url = originalUrl;
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_System_Frontend.ts
var KrnlFrontend;
var init_K_LIB_Krnl_System_Frontend = __esm({
  "src/krnl/core/K_LIB_Krnl_System_Frontend.ts"() {
    "use strict";
    KrnlFrontend = class {
      system;
      options;
      interactionsHistory = [];
      constructor(system, options = {}) {
        this.system = system;
        this.options = {
          title: system.entityName,
          theme: "dark",
          enableMonitoringApi: true,
          ...options
        };
      }
      async handleRequest(req, res, subpath) {
        const normalized = subpath.replace(/\/$/, "") || "/";
        if (normalized === "/" && req.method === "GET") {
          const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
          if (!url.pathname.endsWith("/")) {
            res.writeHead(302, { "Location": url.pathname + "/" + url.search });
            res.end();
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(this._generatePageHtml());
          return;
        }
        if (normalized.startsWith("/api/")) {
          const parts = normalized.split("/");
          const fid = parts[2];
          if (!fid) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: "Missing functionality ID" }));
            return;
          }
          const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
          if (!functionality) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: `Functionality ${fid} not found` }));
            return;
          }
          let body = {};
          if (req.method === "POST") {
            body = await this._readJsonBody(req);
          } else if (req.method === "GET") {
            const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
            body = Object.fromEntries(url.searchParams.entries());
          }
          try {
            const result = await this.system.call(fid, body, {
              unwrap: false,
              callerPort: req.socket?.remotePort,
              accessKey: req.headers["x-krnl-access-key"]
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
          } catch (e) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              status: "error",
              message: e.message,
              errorDocumentation: e.errorDocumentation || null
            }));
          }
          return;
        }
        if (normalized.startsWith("/sse/")) {
          const parts = normalized.split("/");
          const fid = parts[2];
          if (!fid) {
            res.writeHead(400);
            res.end("Missing functionality ID");
            return;
          }
          const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
          if (!functionality) {
            res.writeHead(404);
            res.end("Functionality not found");
            return;
          }
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
          });
          const stateEmitter = functionality.emitters?.get("state:changed");
          const unsubscribe = stateEmitter?.subscribe((msg) => {
            res.write(`data: ${JSON.stringify(msg.data || msg)}

`);
          });
          const interval = setInterval(() => {
            if (res.writable) {
              res.write(": keepalive\n\n");
            }
          }, 15e3);
          req.on("close", () => {
            if (unsubscribe) unsubscribe();
            clearInterval(interval);
            res.end();
          });
          return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "Route not found" }));
      }
      _readJsonBody(req) {
        return new Promise((resolve, reject) => {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            if (!body) return resolve({});
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error("Invalid JSON body"));
            }
          });
        });
      }
      _generatePageHtml() {
        const title = this.options.title || this.system.entityName;
        const theme = this.options.theme || "dark";
        const customCss = this.options.customCss || "";
        return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} Control Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-sans: 'Outfit', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --bg-base: #0a0e17;
      --bg-surface: rgba(22, 28, 45, 0.6);
      --bg-surface-hover: rgba(30, 38, 58, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-color-focus: rgba(59, 130, 246, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      --accent: #10b981;
      --accent-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
      --card-blur: blur(12px);
    }
    [data-theme="light"] {
      --bg-base: #f1f5f9;
      --bg-surface: rgba(255, 255, 255, 0.8);
      --bg-surface-hover: rgba(241, 245, 249, 0.9);
      --border-color: rgba(0, 0, 0, 0.08);
      --border-color-focus: rgba(59, 130, 246, 0.5);
      --text-main: #0f172a;
      --text-muted: #64748b;
      --primary: #2563eb;
      --primary-gradient: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      --accent: #059669;
      --accent-gradient: linear-gradient(135deg, #059669 0%, #047857 100%);
      --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
      --card-blur: blur(8px);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-image: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.5);
      backdrop-filter: blur(10px);
      z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 1rem; }
    .brand-logo {
      width: 36px; height: 36px;
      background: var(--primary-gradient);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; color: white;
    }
    .brand-title {
      font-size: 1.25rem; font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .theme-toggle {
      background: none; border: 1px solid var(--border-color);
      color: var(--text-main); padding: 0.5rem;
      border-radius: 8px; cursor: pointer;
    }
    .theme-toggle:hover { background: var(--border-color); }
    .app-container { display: flex; flex: 1; height: calc(100vh - 65px); overflow: hidden; }
    aside.left-sidebar {
      width: 280px; border-right: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.25);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
    }
    aside.right-sidebar {
      width: 340px; border-left: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.25);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
      padding: 1.25rem; gap: 1.25rem;
    }
    .sidebar-section { padding: 1.25rem; border-bottom: 1px solid var(--border-color); }
    .sidebar-section-title {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      color: var(--text-muted); letter-spacing: 0.08em;
      margin-bottom: 0.75rem; display: flex; justify-content: space-between;
      align-items: center; cursor: pointer;
    }
    .nav-list { list-style: none; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-item button {
      width: 100%; text-align: left; background: none; border: none;
      padding: 0.6rem 0.8rem; border-radius: 8px; color: var(--text-muted);
      font-family: var(--font-sans); font-size: 0.95rem; font-weight: 500;
      cursor: pointer; display: flex; align-items: center; justify-content: space-between;
    }
    .nav-item button:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .nav-item.active button { color: white; background: var(--primary-gradient); }
    .nav-item .method-badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem;
      border-radius: 4px; background: rgba(0, 0, 0, 0.2); color: #93c5fd;
    }
    .nav-item.active .method-badge { background: rgba(255, 255, 255, 0.2); color: white; }
    main { flex: 1; padding: 2rem; overflow-y: auto; background-color: rgba(10, 14, 23, 0.1); }
    .main-grid { display: flex; flex-direction: column; gap: 2rem; max-width: 1000px; margin: 0 auto; }
    .detail-card {
      background: var(--bg-surface); backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color); border-radius: 16px;
      padding: 2rem; box-shadow: var(--glass-shadow);
    }
    .endpoint-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 1px solid var(--border-color); padding-bottom: 1.25rem; margin-bottom: 1.5rem;
    }
    .endpoint-title h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
    .category-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 6px; text-transform: uppercase; font-weight: bold; }
    .badge-app { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .badge-system { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.4); }
    .tab-bar { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; }
    .tab-btn {
      background: none; border: none; color: var(--text-muted);
      font-family: var(--font-sans); font-size: 1rem; font-weight: 600;
      padding: 0.6rem 1.2rem; cursor: pointer; border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--text-main); }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .form-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { font-size: 0.85rem; font-weight: 600; color: var(--text-main); }
    .form-input {
      background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color);
      color: var(--text-main); padding: 0.75rem; border-radius: 8px;
      font-family: var(--font-sans); font-size: 0.95rem; width: 100%;
    }
    .form-textarea { font-family: var(--font-mono); min-height: 100px; resize: vertical; }
    .btn {
      background: var(--primary-gradient); color: white; border: none;
      padding: 0.75rem 1.5rem; border-radius: 8px; font-family: var(--font-sans);
      font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text-main); border: 1px solid var(--border-color); }
    .response-box { margin-top: 1.5rem; background: #040711; border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; }
    .response-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; font-size: 0.8rem; font-weight: bold; color: var(--text-muted); }
    .response-content { font-family: var(--font-mono); font-size: 0.9rem; white-space: pre-wrap; overflow-x: auto; max-height: 400px; }
    .slider-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 1rem; }
    .slider-item { display: flex; flex-direction: column; gap: 0.35rem; background: rgba(255, 255, 255, 0.02); padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; }
    .slider-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: bold; }
    .sse-panel { margin-top: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
    .sse-header { background: rgba(16, 185, 129, 0.1); border-bottom: 1px solid var(--border-color); padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; align-items: center; }
    .sse-log { background: #040711; padding: 1rem; font-family: var(--font-mono); font-size: 0.85rem; height: 200px; overflow-y: auto; white-space: pre-wrap; }
    .telemetry-log-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
    .telemetry-log-table th, .telemetry-log-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .telemetry-log-table th { color: var(--text-muted); font-weight: 600; }

    /* Access Policy Card */
    .policy-card { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
    .policy-tag { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; margin-right: 0.4rem; font-size: 0.75rem; }
    .tag-allow { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .tag-forbid { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .tag-key { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    /* Right Sidebar / Orchestrator Box */
    .orch-box { display: flex; flex-direction: column; height: 100%; gap: 1rem; }
    .orch-chat-history { flex: 1; min-height: 250px; max-height: 380px; background: #040711; border: 1px solid var(--border-color); border-radius: 12px; padding: 0.75rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem; }
    .orch-msg { padding: 0.6rem 0.8rem; border-radius: 8px; max-width: 90%; word-break: break-word; }
    .orch-msg-user { background: var(--primary-gradient); color: white; align-self: flex-end; }
    .orch-msg-agent { background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-color); color: var(--text-main); align-self: flex-start; }
    .task-runner-panel { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.75rem; font-size: 0.8rem; }
    .task-item { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); }
    .task-status { font-weight: bold; text-transform: uppercase; font-size: 0.7rem; padding: 0.1rem 0.3rem; border-radius: 3px; }
    .status-running { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-done { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    ${customCss}
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">\u{1F537}</div>
      <div><h1 class="brand-title">${title} Control Panel</h1></div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button class="btn btn-secondary" onclick="loadTelemetryLog()">\u{1F4CA} Telemetry Logs</button>
      <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle Theme">\u{1F313}</button>
    </div>
  </header>
  <div class="app-container">
    <aside class="left-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-section-title">\u{1F50C} App Endpoints</div>
        <ul class="nav-list" id="app-endpoints-list"><li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">Loading endpoints...</li></ul>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title" onclick="toggleSystemSection()"><span>\u2699\uFE0F System Endpoints</span><span id="system-toggle-arrow">\u25BC</span></div>
        <ul class="nav-list" id="system-endpoints-list" style="display: block;"></ul>
      </div>
    </aside>
    <main>
      <div class="main-grid" id="main-content">
        <div id="welcome-panel" class="detail-card" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-size: 2.25rem; margin-bottom: 1rem;">Welcome to ${title}</h2>
          <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">Select an endpoint in the sidebar to call it, view schemas, listen to event streams, or talk to the application orchestrator.</p>
          <button class="btn" onclick="refreshDefinitions()">\u{1F504} Refresh Endpoints</button>
        </div>
        <div id="telemetry-panel" class="detail-card" style="display: none;">
          <div class="endpoint-header"><div class="endpoint-title"><h2>Historical Telemetry logs</h2></div><button class="btn btn-secondary" onclick="closeTelemetryPanel()">Close</button></div>
          <div style="overflow-x: auto;"><table class="telemetry-log-table"><thead><tr><th>Time</th><th>Type</th><th>Endpoint</th><th>Latency</th><th>Success</th></tr></thead><tbody id="telemetry-log-body"><tr><td colspan="5" style="color: var(--text-muted); text-align: center;">No logs fetched yet.</td></tr></tbody></table></div>
        </div>
        <div id="endpoint-panel" class="detail-card" style="display: none;"></div>
      </div>
    </main>
    <aside class="right-sidebar">
      <div class="sidebar-section-title">\u{1F916} Application Orchestrator</div>
      <div class="orch-box">
        <div class="orch-chat-history" id="orch-chat-box">
          <div class="orch-msg orch-msg-agent">Hello! I am the Application Orchestrator. Type a natural language request to run workflows across system endpoints.</div>
        </div>
        <form onsubmit="handleOrchestratorSubmit(event)" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <textarea class="form-input" id="orch-prompt-input" placeholder="e.g. Process order #123 and notify user" style="height: 70px; resize: none; font-size: 0.85rem;"></textarea>
          <button type="submit" class="btn" style="justify-content: center; padding: 0.5rem; font-size: 0.85rem;">\u{1F4AC} Prompt Orchestrator</button>
        </form>
        <div class="task-runner-panel">
          <div class="sidebar-section-title" style="margin-bottom: 0.5rem;">\u{1F4CB} Autonomous Task Runner</div>
          <div id="task-list-box" style="color: var(--text-muted); font-size: 0.75rem;">No tasks running.</div>
        </div>
      </div>
    </aside>
  </div>
  <script>
    let definitions = [];
    let activeFid = null;
    let activeTab = 'call';
    let sseSource = null;

    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    });

    function toggleSystemSection() {
      const list = document.getElementById('system-endpoints-list');
      const arrow = document.getElementById('system-toggle-arrow');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
      arrow.innerText = list.style.display === 'none' ? '\u25BA' : '\u25BC';
    }

    async function refreshDefinitions() {
      try {
        const res = await fetch('api/getEndpointDefinitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await res.json();
        definitions = data.payload || data;
        renderSidebar();
        if (activeFid) {
          const updated = definitions.find(d => d.id === activeFid);
          if (updated) renderEndpoint(updated);
        }
      } catch (err) { console.error("Failed to load endpoint definitions:", err); }
    }

    async function pollTaskList() {
      try {
        const res = await fetch('api/getTaskList', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await res.json();
        const payload = data.payload || data;
        const box = document.getElementById('task-list-box');
        if (!payload || !payload.tasks || payload.tasks.length === 0) {
          box.innerHTML = '<div style="color: var(--text-muted);">No active task list.</div>';
          return;
        }
        let html = '';
        payload.tasks.forEach(t => {
          const sClass = t.status === 'running' ? 'status-running' : (t.status === 'done' ? 'status-done' : 'status-pending');
          html += \`<div class="task-item"><span>\${t.endpointId || t.prompt.slice(0, 20)}</span><span class="task-status \${sClass}">\${t.status}</span></div>\`;
        });
        box.innerHTML = html;
      } catch(e) {}
    }

    function renderSidebar() {
      const appList = document.getElementById('app-endpoints-list');
      const sysList = document.getElementById('system-endpoints-list');
      appList.innerHTML = ''; sysList.innerHTML = '';
      let appCount = 0;
      definitions.sort((a, b) => a.id.localeCompare(b.id)).forEach(def => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.id = 'nav-item-' + def.id;
        if (activeFid === def.id) li.classList.add('active');
        li.innerHTML = \`<button onclick="selectEndpoint('\${def.id}')"><span>\${def.id}</span><span class="method-badge">\${def.method}</span></button>\`;
        if (def.category === 'krnl_system') sysList.appendChild(li); else { appList.appendChild(li); appCount++; }
      });
      if (appCount === 0) appList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">No app endpoints</li>';
    }

    function selectEndpoint(fid) {
      document.getElementById('welcome-panel').style.display = 'none';
      document.getElementById('telemetry-panel').style.display = 'none';
      document.getElementById('endpoint-panel').style.display = 'block';
      if (activeFid) {
        const prevLi = document.getElementById('nav-item-' + activeFid);
        if (prevLi) prevLi.classList.remove('active');
      }
      activeFid = fid;
      const activeLi = document.getElementById('nav-item-' + fid);
      if (activeLi) activeLi.classList.add('active');
      const def = definitions.find(d => d.id === fid);
      if (def) renderEndpoint(def);
    }

    function switchTab(tab) {
      activeTab = tab;
      const def = definitions.find(d => d.id === activeFid);
      if (def) renderEndpoint(def);
    }

    function renderEndpoint(def) {
      const panel = document.getElementById('endpoint-panel');
      const badgeClass = def.category === 'krnl_system' ? 'badge-system' : 'badge-app';
      const isApp = def.category === 'app';
      let tabsHtml = isApp ? \`<div class="tab-bar">
        <button class="tab-btn \${activeTab === 'call' ? 'active' : ''}" onclick="switchTab('call')">Call Endpoint</button>
        <button class="tab-btn \${activeTab === 'schema' ? 'active' : ''}" onclick="switchTab('schema')">Schema</button>
        <button class="tab-btn \${activeTab === 'edit' ? 'active' : ''}" onclick="switchTab('edit')">Edit Definition</button>
      </div>\` : '';
      if (!isApp && activeTab !== 'call') activeTab = 'call';
      let contentHtml = '';
      if (activeTab === 'call') contentHtml = renderCallTab(def);
      else if (activeTab === 'schema') contentHtml = renderSchemaTab(def);
      else contentHtml = renderEditTab(def);

      panel.innerHTML = \`<div class="endpoint-header"><div class="endpoint-title"><h2>\${def.id} <span class="category-badge \${badgeClass}">\${def.category}</span></h2><div style="color: var(--text-muted); font-size: 0.95rem;">\${def.description || ''}</div></div></div>\${tabsHtml}\${contentHtml}\`;
      if (activeTab === 'call' && def.examplePayload) loadExamplePayload(def.examplePayload);
    }

    function renderSchemaTab(def) {
      const inSchema = JSON.stringify(def.inputSchema || {}, null, 2);
      const outSchema = JSON.stringify(def.outputSchema || {}, null, 2);
      return \`
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--primary);">Input Schema</h3>
            <pre class="response-content" style="background: #040711; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">\${inSchema}</pre>
          </div>
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: #10b981;">Output Schema</h3>
            <pre class="response-content" style="background: #040711; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">\${outSchema}</pre>
          </div>
        </div>
      \`;
    }

    function renderCallTab(def) {
      let policyHtml = '';
      if (def.accessPolicy) {
        const p = def.accessPolicy;
        const allows = (p.allow || []).map(port => \`<span class="policy-tag tag-allow">Allow:\${port}</span>\`).join(' ');
        const forbids = (p.forbid || []).map(port => \`<span class="policy-tag tag-forbid">Forbid:\${port}</span>\`).join(' ');
        const keys = (p.allow_with_key || []).map(port => \`<span class="policy-tag tag-key">KeyReq:\${port}</span>\`).join(' ');
        policyHtml = \`<div class="policy-card">
          <div style="font-weight: bold; margin-bottom: 0.4rem;">Access Policy Control</div>
          <div>Default: <strong>\${p.default_connection_behaviour || 'allow_unlisted'}</strong></div>
          <div style="margin-top: 0.4rem;">\${allows} \${forbids} \${keys}</div>
        </div>\`;
      }

      let inputsHtml = '';
      if (def.method === 'POST') {
        if (def.inputSchema?.properties) {
          inputsHtml = '<div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">';
          for (const [key, prop] of Object.entries(def.inputSchema.properties)) {
            const desc = prop.description || '';
            const req = (def.inputSchema.required || []).includes(key) ? 'required' : '';
            inputsHtml += \`<div class="form-group"><label class="form-label" for="call-input-\${key}">\${key}</label>\`;
            if (prop.type === 'boolean') inputsHtml += \`<div style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="call-input-\${key}"> <span>\${desc}</span></div>\`;
            else if (['number', 'integer'].includes(prop.type)) inputsHtml += \`<input type="number" class="form-input" id="call-input-\${key}" placeholder="\${desc}" \${req}>\`;
            else if (prop.type === 'string') inputsHtml += \`<input type="text" class="form-input" id="call-input-\${key}" placeholder="\${desc}" \${req}>\`;
            else inputsHtml += \`<textarea class="form-input form-textarea" id="call-input-\${key}" placeholder="\${desc}" \${req}></textarea>\`;
            inputsHtml += '</div>';
          }
          inputsHtml += '</div>';
        } else {
          inputsHtml = '<div class="form-group"><label class="form-label" for="call-raw-json">Payload (JSON)</label><textarea class="form-input form-textarea" id="call-raw-json" placeholder="{\\n}"></textarea></div>';
        }
      } else {
        inputsHtml = '<p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">GET requests take query parameters via URL, or no parameters.</p>';
      }

      const sseHtml = (def.emitters && def.emitters.length > 0) ? \`
        <div class="sse-panel">
          <div class="sse-header"><span style="font-weight: bold; color:#10b981;">Live Event Stream</span><button class="btn btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.75rem;" id="sse-btn" onclick="toggleSse('\${def.id}')">\u{1F534} Listen</button></div>
          <div class="sse-log" id="sse-log-box">Not listening.</div>
        </div>\` : '';

      return \`
        \${policyHtml}
        <form onsubmit="handleCallSubmit(event)">
          \${def.examplePayload ? \`<button type="button" class="btn btn-secondary" style="margin-bottom: 1.5rem; padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="fillExamplePayload()">\u{1F4CB} Load Example Payload</button>\` : ''}
          \${inputsHtml}
          <button type="submit" class="btn">\u{1F680} Call Endpoint</button>
        </form>
        <div class="response-box" id="response-box" style="display: none;"><div class="response-header"><span>RESPONSE</span><button class="btn btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="copyResponse()">Copy</button></div><pre class="response-content" id="response-text"></pre></div>
        \${sseHtml}
      \`;
    }

    function fillExamplePayload() {
      const def = definitions.find(d => d.id === activeFid);
      if (def && def.examplePayload) loadExamplePayload(def.examplePayload);
    }

    function loadExamplePayload(payload) {
      const def = definitions.find(d => d.id === activeFid);
      if (!def) return;
      const hasProps = def.inputSchema && def.inputSchema.properties;
      if (def.method === 'POST') {
        if (hasProps) {
          for (const key of Object.keys(def.inputSchema.properties)) {
            const el = document.getElementById('call-input-' + key);
            if (!el) continue;
            const val = payload[key];
            if (val === undefined) { if (el.type === 'checkbox') el.checked = false; else el.value = ''; }
            else if (el.type === 'checkbox') el.checked = !!val;
            else el.value = typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
          }
        } else {
          const el = document.getElementById('call-raw-json');
          if (el) el.value = JSON.stringify(payload, null, 2);
        }
      }
    }

    async function handleCallSubmit(event) {
      event.preventDefault();
      const def = definitions.find(d => d.id === activeFid);
      if (!def) return;
      let body = {};
      const hasProps = def.inputSchema && def.inputSchema.properties;
      if (def.method === 'POST') {
        if (hasProps) {
          for (const key of Object.keys(def.inputSchema.properties)) {
            const el = document.getElementById('call-input-' + key);
            if (!el) continue;
            if (el.type === 'checkbox') body[key] = el.checked;
            else {
              const val = el.value.trim();
              if (val.startsWith('{') || val.startsWith('[')) { try { body[key] = JSON.parse(val); } catch(e) { body[key] = val; } }
              else body[key] = isNaN(Number(val)) || val === '' ? val : Number(val);
            }
          }
        } else {
          const el = document.getElementById('call-raw-json');
          if (el && el.value.trim() !== '') { try { body = JSON.parse(el.value); } catch(e) { alert("Invalid JSON"); return; } }
        }
      }
      const resBox = document.getElementById('response-box');
      const resText = document.getElementById('response-text');
      resText.innerText = "Calling..."; resBox.style.display = 'block';
      try {
        const res = await fetch('api/' + def.id, { method: def.method, headers: { 'Content-Type': 'application/json' }, body: def.method === 'POST' ? JSON.stringify(body) : undefined });
        const data = await res.json();
        resText.innerText = JSON.stringify(data, null, 2);
      } catch (err) { resText.innerText = "Error: " + err.message; }
    }

    async function handleOrchestratorSubmit(event) {
      event.preventDefault();
      const inputEl = document.getElementById('orch-prompt-input');
      const promptText = inputEl.value.trim();
      if (!promptText) return;
      inputEl.value = '';

      const chatBox = document.getElementById('orch-chat-box');
      const userMsg = document.createElement('div');
      userMsg.className = 'orch-msg orch-msg-user';
      userMsg.innerText = promptText;
      chatBox.appendChild(userMsg);

      const agentMsg = document.createElement('div');
      agentMsg.className = 'orch-msg orch-msg-agent';
      agentMsg.innerText = 'Orchestrating request...';
      chatBox.appendChild(agentMsg);
      chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const res = await fetch('api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: promptText })
        });
        const data = await res.json();
        agentMsg.innerText = JSON.stringify(data, null, 2);
      } catch(err) {
        agentMsg.innerText = 'Error: ' + err.message;
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    function toggleSse(fid) {
      const log = document.getElementById('sse-log-box');
      const btn = document.getElementById('sse-btn');
      if (sseSource) {
        sseSource.close(); sseSource = null;
        btn.innerText = '\u{1F534} Listen'; btn.style.background = '';
        log.innerText = 'Disconnected.'; return;
      }
      btn.innerText = '\u{1F7E2} Active'; btn.style.background = '#10b981';
      log.innerText = 'Listening...\\n';
      sseSource = new EventSource('sse/' + fid);
      sseSource.onmessage = (e) => { log.innerText += \`[\${new Date().toLocaleTimeString()}] \${e.data}\\n\`; log.scrollTop = log.scrollHeight; };
      sseSource.onerror = () => { log.innerText += 'Error.\\n'; sseSource.close(); sseSource = null; btn.innerText = '\u{1F534} Listen'; btn.style.background = ''; };
    }

    function renderEditTab(def) {
      const toolsVal = (def.agentTools || []).join(', ');
      const dynVal = (def.dynamicWatchVars || []).join(', ');
      const statVal = (def.staticWatchVars || []).join(', ');
      const spec = def.intelligenceSpec || {};
      const specNames = ['reasoning', 'planning', 'toolUsage', 'structuredOutput', 'jsonStrictness', 'coding', 'extraction', 'classification', 'summarization', 'creativity', 'determinism', 'context', 'vision', 'multimodal', 'outputComplexity'];
      let slidersHtml = '<div class="slider-container">';
      specNames.forEach(name => {
        const val = spec[name] !== undefined ? spec[name] : 3;
        slidersHtml += \`<div class="slider-item"><div class="slider-header"><span>\${name}</span><span id="spec-val-\${name}">\${val}</span></div><input type="range" class="slider-input" min="0" max="10" value="\${val}" id="edit-spec-\${name}" oninput="document.getElementById('spec-val-\${name}').innerText = this.value"></div>\`;
      });
      slidersHtml += '</div>';

      return \`
        <form onsubmit="handleEditSubmit(event)">
          <div class="form-group"><label class="form-label">Description</label><input type="text" class="form-input" id="edit-desc" value="\${def.description || ''}"></div>
          <div class="form-group"><label class="form-label">System Instructions Prompt</label><textarea class="form-input form-textarea" id="edit-system-inst">\${def.systemInstructions || ''}</textarea></div>
          <div class="form-group"><label class="form-label">Example Payload (JSON)</label><textarea class="form-input form-textarea" id="edit-example-payload">\${def.examplePayload ? JSON.stringify(def.examplePayload, null, 2) : ''}</textarea></div>
          <div class="form-group"><label class="form-label">Agent Tools</label><input type="text" class="form-input" id="edit-agent-tools" value="\${toolsVal}"></div>
          <div class="form-group"><label class="form-label">Dynamic Watch Variables</label><input type="text" class="form-input" id="edit-dynamic-vars" value="\${dynVal}"></div>
          <div class="form-group"><label class="form-label">Static Watch Variables</label><input type="text" class="form-input" id="edit-static-vars" value="\${statVal}"></div>
          <div class="form-group"><label class="form-label">Intelligence Specification Requirement Levels</label>\${slidersHtml}</div>
          <div class="form-group"><label class="form-label">Endpoint Persistent Memory (Learnings)</label><textarea class="form-input form-textarea" style="background: rgba(0,0,0,0.3);" readonly>\${def.memory || 'No learnings recorded yet.'}</textarea></div>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;"><button type="submit" class="btn">\u{1F4BE} Save Definition</button><span id="save-status-msg" style="align-self: center; font-weight: bold;"></span></div>
        </form>
      \`;
    }

    async function handleEditSubmit(event) {
      event.preventDefault();
      const statusSpan = document.getElementById('save-status-msg');
      statusSpan.innerText = 'Saving...'; statusSpan.style.color = 'var(--text-muted)';
      const specNames = ['reasoning', 'planning', 'toolUsage', 'structuredOutput', 'jsonStrictness', 'coding', 'extraction', 'classification', 'summarization', 'creativity', 'determinism', 'context', 'vision', 'multimodal', 'outputComplexity'];
      const intelligenceSpec = {};
      specNames.forEach(name => { intelligenceSpec[name] = Number(document.getElementById('edit-spec-' + name).value); });
      let examplePayload = null;
      const rawEx = document.getElementById('edit-example-payload').value.trim();
      if (rawEx !== '') { try { examplePayload = JSON.parse(rawEx); } catch(e) { alert("Invalid JSON"); return; } }
      const override = {
        description: document.getElementById('edit-desc').value.trim(),
        systemInstructions: document.getElementById('edit-system-inst').value.trim(),
        examplePayload,
        agentTools: document.getElementById('edit-agent-tools').value.split(',').map(s => s.trim()).filter(Boolean),
        dynamicWatchVars: document.getElementById('edit-dynamic-vars').value.split(',').map(s => s.trim()).filter(Boolean),
        staticWatchVars: document.getElementById('edit-static-vars').value.split(',').map(s => s.trim()).filter(Boolean),
        intelligenceSpec
      };
      try {
        const res = await fetch('api/setEndpointDefinition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeFid, override }) });
        const data = await res.json();
        if (data.status === 'success' || data.payload) { statusSpan.innerText = '\u2713 Spec Saved!'; statusSpan.style.color = '#10b981'; await refreshDefinitions(); }
        else { statusSpan.innerText = 'Error: ' + data.message; statusSpan.style.color = '#ef4444'; }
      } catch (err) { statusSpan.innerText = 'Save failed.'; statusSpan.style.color = '#ef4444'; }
      setTimeout(() => { statusSpan.innerText = ''; }, 3000);
    }

    async function loadTelemetryLog() {
      document.getElementById('welcome-panel').style.display = 'none';
      document.getElementById('endpoint-panel').style.display = 'none';
      document.getElementById('telemetry-panel').style.display = 'block';
      const tbody = document.getElementById('telemetry-log-body');
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Fetching...</td></tr>';
      try {
        const res = await fetch('api/getTelemetryLog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 100 }) });
        const data = await res.json();
        const logs = data.payload || data || [];
        tbody.innerHTML = '';
        if (logs.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);text-align:center;">No logs.</td></tr>'; return; }
        logs.forEach(log => {
          const row = document.createElement('tr');
          const time = new Date(log.timestamp).toLocaleTimeString();
          const latencyVal = log.latencyMs || log.durationMs || 0;
          row.innerHTML = \`<td>\${time}</td><td>\${log.type === 'ai_trace' ? '\u{1F916} AI' : '\u{1F4DE} Call'}</td><td style="font-family:var(--font-mono);font-weight:bold;">\${log.endpointId}</td><td>\${latencyVal.toFixed(1)} ms</td><td style="color:\${log.success ? '#10b981' : '#ef4444'};font-weight:bold;">\${log.success ? 'Success' : 'Failed'}</td>\`;
          tbody.appendChild(row);
        });
      } catch (err) { tbody.innerHTML = \`<tr><td colspan="5" style="color:#ef4444;text-align:center;">Error: \${err.message}</td></tr>\`; }
    }

    function closeTelemetryPanel() { document.getElementById('telemetry-panel').style.display = 'none'; document.getElementById('welcome-panel').style.display = 'block'; }
    function copyResponse() { navigator.clipboard.writeText(document.getElementById('response-text').innerText).then(() => { alert("Copied."); }); }
    function disconnectSse() { if (sseSource) { sseSource.close(); sseSource = null; } }

    window.addEventListener('DOMContentLoaded', async () => {
      await refreshDefinitions();
      setInterval(refreshDefinitions, 5000);
      await pollTaskList();
      setInterval(pollTaskList, 3000);
    });
  </script>
</body>
</html>`;
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Watch_Variables_Tracker.ts
var KrnlWatchVariablesTracker;
var init_K_LIB_Krnl_Watch_Variables_Tracker = __esm({
  "src/krnl/core/K_LIB_Krnl_Watch_Variables_Tracker.ts"() {
    "use strict";
    KrnlWatchVariablesTracker = class {
      registeredFunctionalities = /* @__PURE__ */ new Map();
      endpointConfigs = /* @__PURE__ */ new Map();
      register(functionalityId, config, functionality) {
        this.registeredFunctionalities.set(functionalityId, functionality);
        this.endpointConfigs.set(functionalityId, config);
      }
      readLiveVars(endpointId) {
        const config = this.endpointConfigs.get(endpointId);
        const functionality = this.registeredFunctionalities.get(endpointId);
        if (!config || !functionality) return {};
        const liveVars = {};
        const keysToRead = [
          ...config.staticWatchVars || [],
          ...config.dynamicWatchVars || []
        ];
        const state = functionality.state || {};
        for (const key of keysToRead) {
          if (key in state) {
            liveVars[key] = state[key];
          }
        }
        return liveVars;
      }
      sharedDynamicVars(endpointA, endpointB) {
        const configA = this.endpointConfigs.get(endpointA);
        const configB = this.endpointConfigs.get(endpointB);
        if (!configA || !configB) return [];
        const dynA = configA.dynamicWatchVars || [];
        const dynB = configB.dynamicWatchVars || [];
        return dynA.filter((v) => dynB.includes(v));
      }
      endpointsForVar(varKey) {
        const matched = [];
        for (const [fid, config] of this.endpointConfigs.entries()) {
          if (config.dynamicWatchVars?.includes(varKey)) {
            matched.push(fid);
          }
        }
        return matched;
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Endpoint_Scheduler.ts
var KrnlEndpointScheduler;
var init_K_LIB_Krnl_Endpoint_Scheduler = __esm({
  "src/krnl/core/K_LIB_Krnl_Endpoint_Scheduler.ts"() {
    "use strict";
    KrnlEndpointScheduler = class {
      tracker;
      executing = /* @__PURE__ */ new Set();
      queue = [];
      constructor(tracker) {
        this.tracker = tracker;
      }
      async dispatch(endpointId, task) {
        return new Promise((resolve, reject) => {
          this.queue.push({ endpointId, task, resolve, reject });
          this.drainQueue();
        });
      }
      hasConflict(endpointId) {
        for (const activeEndpoint of this.executing) {
          const shared = this.tracker.sharedDynamicVars(endpointId, activeEndpoint);
          if (shared.length > 0) {
            return true;
          }
        }
        return false;
      }
      release(endpointId) {
        this.executing.delete(endpointId);
        this.drainQueue();
      }
      drainQueue() {
        for (let i = 0; i < this.queue.length; i++) {
          const item = this.queue[i];
          if (!this.hasConflict(item.endpointId)) {
            this.queue.splice(i, 1);
            i--;
            this.executing.add(item.endpointId);
            item.task().then((res) => {
              item.resolve(res);
              this.release(item.endpointId);
            }).catch((err) => {
              item.reject(err);
              this.release(item.endpointId);
            });
          }
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Task_Runner.ts
function createTaskListTool(runner) {
  return {
    id: "taskListTool",
    description: "create_list(tasks) \u2192 ok | read_list() \u2192 list. use-when: plan/mutate task sequence.",
    schema: {
      input: {
        action: "str: 'create' | 'append' | 'read'",
        tasks: "array?: [{ endpointId: string, prompt: string }] (required for 'create'/'append')"
      },
      output: "obj"
    },
    examples: [
      { input: { action: "create", tasks: [{ endpointId: "StoreKey", prompt: "store api key" }] }, output: { status: "ok", count: 1 } },
      { input: { action: "read" }, output: { tasks: [] } }
    ],
    execute: async (payload) => {
      if (payload.action === "create" && payload.tasks) {
        const list = KrnlTaskList.create(payload.tasks);
        runner.setTaskList(list);
        return { status: "ok", count: payload.tasks.length };
      } else if (payload.action === "append" && payload.tasks) {
        const list = runner.getTaskList() || new KrnlTaskList();
        const newList = KrnlTaskList.create(payload.tasks);
        list.tasks.push(...newList.tasks);
        runner.setTaskList(list);
        return { status: "ok", count: list.tasks.length };
      } else if (payload.action === "read") {
        const list = runner.getTaskList();
        return { tasks: list ? list.tasks : [] };
      }
      throw new Error(`Invalid action: ${payload.action}`);
    }
  };
}
var KrnlTaskList, KrnlTaskRunner;
var init_K_LIB_Krnl_Task_Runner = __esm({
  "src/krnl/core/K_LIB_Krnl_Task_Runner.ts"() {
    "use strict";
    KrnlTaskList = class _KrnlTaskList {
      tasks = [];
      cursor = 0;
      constructor(tasks = [], cursor = 0) {
        this.tasks = tasks;
        this.cursor = cursor;
      }
      static create(items, parentTaskId, nestingDepth = 0) {
        const tasks = items.map((item, idx) => ({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${idx}`,
          endpointId: item.endpointId,
          prompt: item.prompt,
          status: "pending",
          parentTaskId,
          nestingDepth
        }));
        return new _KrnlTaskList(tasks);
      }
      getCurrentTask() {
        if (this.cursor >= this.tasks.length) return null;
        return this.tasks[this.cursor];
      }
      markDone(taskId, result) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
          task.status = "done";
          task.result = result;
          if (this.getCurrentTask()?.id === taskId) {
            this.cursor++;
          }
          return true;
        }
        return false;
      }
      markSkipped(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
          task.status = "skipped";
          if (this.getCurrentTask()?.id === taskId) {
            this.cursor++;
          }
          return true;
        }
        return false;
      }
      nest(nestedItems, parentTaskId) {
        const parentTask = this.tasks.find((t) => t.id === parentTaskId);
        const depth = parentTask ? parentTask.nestingDepth + 1 : 1;
        const nestedList = _KrnlTaskList.create(nestedItems, parentTaskId, depth);
        const parentIdx = this.tasks.findIndex((t) => t.id === parentTaskId);
        if (parentIdx !== -1) {
          this.tasks.splice(parentIdx + 1, 0, ...nestedList.tasks);
        } else {
          this.tasks.push(...nestedList.tasks);
        }
        return this;
      }
      async persist(store) {
        if (typeof store.saveTaskList === "function") {
          await store.saveTaskList({
            tasks: this.tasks,
            cursor: this.cursor
          });
        }
      }
      static async load(store) {
        if (typeof store.loadTaskList === "function") {
          const data = await store.loadTaskList();
          if (data) {
            return new _KrnlTaskList(data.tasks, data.cursor);
          }
        }
        return null;
      }
    };
    KrnlTaskRunner = class {
      system;
      currentList = null;
      isExecuting = false;
      constructor(system) {
        this.system = system;
      }
      setTaskList(list) {
        this.currentList = list;
      }
      getTaskList() {
        return this.currentList;
      }
      async run(list) {
        this.currentList = list;
        await this.executeNext();
      }
      async onSuccess(taskId, result) {
        if (!this.currentList) return;
        this.currentList.markDone(taskId, result);
        if (this.system._aiProfilesStore) {
          await this.currentList.persist(this.system._aiProfilesStore);
        }
        setTimeout(() => {
          this.executeNext().catch((err) => console.error("[TaskRunner] executeNext error:", err));
        }, 0);
      }
      async receiveSkip(taskId) {
        if (!this.currentList) return;
        this.currentList.markSkipped(taskId);
        if (this.system._aiProfilesStore) {
          await this.currentList.persist(this.system._aiProfilesStore);
        }
        setTimeout(() => {
          this.executeNext().catch((err) => console.error("[TaskRunner] executeNext error:", err));
        }, 0);
      }
      async receiveNest(nestedItems, parentTaskId) {
        if (!this.currentList) return;
        this.currentList.nest(nestedItems, parentTaskId);
        if (this.system._aiProfilesStore) {
          await this.currentList.persist(this.system._aiProfilesStore);
        }
        setTimeout(() => {
          this.executeNext().catch((err) => console.error("[TaskRunner] executeNext error:", err));
        }, 0);
      }
      getStatus() {
        if (!this.currentList) return { status: "idle", currentTask: null, tasks: [] };
        const current = this.currentList.getCurrentTask();
        return {
          status: current ? "running" : "complete",
          currentTask: current,
          tasks: this.currentList.tasks,
          cursor: this.currentList.cursor
        };
      }
      async executeNext() {
        if (!this.currentList) return;
        const task = this.currentList.getCurrentTask();
        if (!task) {
          console.log("[TaskRunner] All tasks completed successfully.");
          return;
        }
        task.status = "running";
        if (this.system._aiProfilesStore) {
          await this.currentList.persist(this.system._aiProfilesStore);
        }
        console.log(`[TaskRunner] Event trigger: Executing task ${task.id} (${task.endpointId}) with prompt: "${task.prompt}"`);
        try {
          const orchestrator = this.system._aiOrchestrator;
          if (!orchestrator) {
            throw new Error("Orchestrator not initialized");
          }
          const agent = orchestrator.endpointAgents.get(task.endpointId);
          if (!agent) {
            throw new Error(`Endpoint agent ${task.endpointId} not registered`);
          }
          const scheduler = this.system._aiScheduler || orchestrator.scheduler;
          if (!scheduler) {
            throw new Error("Scheduler not found on system or orchestrator");
          }
          const { result, trace } = await scheduler.dispatch(task.endpointId, async () => {
            return await agent.executeFromNaturalLanguage(task.prompt);
          });
          if (this.system.telemetry && typeof this.system.telemetry.recordAiTrace === "function") {
            this.system.telemetry.recordAiTrace(trace);
          }
          if (result && typeof result === "object" && result._krnlSignal === "QUERY_ORCHESTRATOR") {
            console.log(`[TaskRunner] Detected signal QUERY_ORCHESTRATOR: ${result.query}`);
            await orchestrator.handleQuery(result.query, { taskId: task.id, endpointId: task.endpointId });
            return;
          }
          await this.onSuccess(task.id, result);
        } catch (error) {
          console.error(`[TaskRunner] Task ${task.id} failed:`, error.message || error);
          const orchestrator = this.system._aiOrchestrator;
          if (orchestrator) {
            await orchestrator.escalateTaskFailure(task.id, error.message || String(error));
          }
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Ai_Concepts.ts
var KrnlPlannerSpec;
var init_K_LIB_Krnl_Ai_Concepts = __esm({
  "src/krnl/core/K_LIB_Krnl_Ai_Concepts.ts"() {
    "use strict";
    KrnlPlannerSpec = {
      reasoning: 9,
      planning: 10,
      toolUsage: 8,
      structuredOutput: 9,
      jsonStrictness: 8,
      coding: 2,
      extraction: 6,
      classification: 5,
      summarization: 5,
      creativity: 3,
      determinism: 7,
      context: 8,
      vision: 1,
      multimodal: 1,
      outputComplexity: 6
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Planner_Agent.ts
var KrnlPlannerAgent;
var init_K_LIB_Krnl_Planner_Agent = __esm({
  "src/krnl/core/K_LIB_Krnl_Planner_Agent.ts"() {
    "use strict";
    init_K_LIB_Krnl_Ai_Concepts();
    init_K_LIB_Krnl_Task_Runner();
    KrnlPlannerAgent = class {
      aikoClient;
      system;
      runner;
      tool;
      constructor(aikoClient, system, runner) {
        this.aikoClient = aikoClient;
        this.system = system;
        this.runner = runner;
        this.tool = createTaskListTool(runner);
      }
      async plan(naturalLanguageRequest, contextData = "") {
        const endpoints = this.system._aiOrchestrator.getAgentSummaries().map((s) => {
          return `- ${s.endpointId}: ${s.description}`;
        }).join("\n");
        const systemPrompt = `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (\u2192,\u2229,\u2265,|). output=json unless signal.
You are a task planner agent. Your spec: reasoning=9, planning=10.
Goal: produce a sequential list of steps/tasks needed to fulfill the request.

Available endpoints:
${endpoints}

Available tools:
- ${this.tool.id}: ${this.tool.description}
  Schema: ${JSON.stringify(this.tool.schema)}
  Examples: ${JSON.stringify(this.tool.examples)}

Rules:
1. Output ONLY tool calls or structured plans.
2. If you need more information or context from the host entity/orchestrator before planning, emit:
   {"_krnlSignal": "QUERY_ORCHESTRATOR", "query": "caveman query for info"}
3. Otherwise, use taskListTool to create the task list. Call it via a JSON payload.

Current Context:
${contextData || "None"}
`;
        const userPrompt = `Request: "${naturalLanguageRequest}"
Generate the plan or query context.`;
        const response = await this.aikoClient.infer(KrnlPlannerSpec, systemPrompt, userPrompt);
        let parsed = response.trim();
        if (parsed.startsWith("```")) {
          parsed = parsed.replace(/^```(json)?\n/, "").replace(/\n```$/, "").trim();
        }
        try {
          const data = JSON.parse(parsed);
          if (data && typeof data === "object" && data._krnlSignal === "QUERY_ORCHESTRATOR") {
            return data;
          }
          if (data && data.action === "create" && data.tasks) {
            await this.tool.execute(data);
            const list = this.runner.getTaskList();
            if (list) return list;
          }
        } catch (e) {
          console.warn("[PlannerAgent] Failed to parse response as JSON tool call. Parsing list manually from string.");
        }
        try {
          const data = JSON.parse(parsed);
          if (Array.isArray(data)) {
            await this.tool.execute({ action: "create", tasks: data });
            const list = this.runner.getTaskList();
            if (list) return list;
          }
        } catch (e) {
        }
        throw new Error(`Planner Agent failed to generate a valid plan. Raw output: ${response}`);
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Application_Orchestrator.ts
var KrnlApplicationOrchestrator;
var init_K_LIB_Krnl_Application_Orchestrator = __esm({
  "src/krnl/core/K_LIB_Krnl_Application_Orchestrator.ts"() {
    "use strict";
    init_K_LIB_Krnl_Task_Runner();
    init_K_LIB_Krnl_Planner_Agent();
    KrnlApplicationOrchestrator = class {
      system;
      aikoClient;
      tracker;
      scheduler;
      routingSpec;
      escalationSpec;
      endpointAgents = /* @__PURE__ */ new Map();
      store;
      taskRunner;
      plannerAgent;
      constructor(system, aikoClient, tracker, scheduler, routingSpec, escalationSpec, store) {
        this.system = system;
        this.aikoClient = aikoClient;
        this.tracker = tracker;
        this.scheduler = scheduler;
        this.routingSpec = routingSpec;
        this.escalationSpec = escalationSpec;
        this.store = store;
        this.taskRunner = new KrnlTaskRunner(system);
        this.plannerAgent = new KrnlPlannerAgent(aikoClient, system, this.taskRunner);
      }
      registerAgent(endpointId, agent) {
        this.endpointAgents.set(endpointId, agent);
      }
      getAgentSummaries() {
        const list = [];
        for (const [fid, agent] of this.endpointAgents.entries()) {
          list.push({
            endpointId: fid,
            intelligenceSpec: agent.definition.intelligenceSpec,
            description: agent.definition.description,
            dynamicWatchVars: agent.definition.dynamicWatchVars,
            staticWatchVars: agent.definition.staticWatchVars,
            systemInstructions: agent.definition.systemInstructions
          });
        }
        return list;
      }
      async handle(naturalLanguageRequest) {
        const endpointId = await this.selectEndpoint(naturalLanguageRequest);
        if (!endpointId) {
          throw new Error(`Orchestrator failed to route request: "${naturalLanguageRequest}"`);
        }
        const agent = this.endpointAgents.get(endpointId);
        if (!agent) {
          throw new Error(`Orchestrator routed request to endpoint "${endpointId}", but no endpoint agent is registered.`);
        }
        try {
          const { result, trace } = await this.scheduler.dispatch(endpointId, async () => {
            return await agent.executeFromNaturalLanguage(naturalLanguageRequest);
          });
          if (this.system.telemetry && this.system.telemetry.recordAiTrace) {
            this.system.telemetry.recordAiTrace(trace);
          }
          return {
            status: "success",
            result,
            endpointId,
            trace
          };
        } catch (escalationObj) {
          if (escalationObj.trace && escalationObj.error) {
            console.warn(`[Orchestrator] Endpoint agent "${endpointId}" failed execution. Initiating orchestrator escalation...`);
            const badModelId = this.aikoClient.lastUsedModelId;
            if (badModelId) {
              console.log(`[Orchestrator] Model ${badModelId} failed to satisfy requirements. Submitting downrank report to Aiko...`);
              await this.aikoClient.downrankModel(badModelId);
            }
            return await this.escalate(endpointId, naturalLanguageRequest, escalationObj.error.message, escalationObj.trace);
          }
          throw escalationObj;
        }
      }
      async selectEndpoint(request) {
        const orchMem = await this.store.getOrchestratorMemory();
        const systemPrompt = this.buildRoutingPrompt(orchMem.memory);
        const userPrompt = `User Request: "${request}"

Which endpoint matches?`;
        try {
          const response = await this.aikoClient.infer(this.routingSpec, systemPrompt, userPrompt);
          const selected = response.trim();
          const logMsg = `Routed request "${request}" to "${selected}" at ${(/* @__PURE__ */ new Date()).toISOString()}`;
          const updatedMem = orchMem.memory ? orchMem.memory + "\n" + logMsg : logMsg;
          const memLines = updatedMem.split("\n").slice(-20).join("\n");
          await this.store.setOrchestratorMemory(memLines);
          if (this.endpointAgents.has(selected)) {
            return selected;
          }
          for (const key of this.endpointAgents.keys()) {
            if (selected.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(selected.toLowerCase())) {
              return key;
            }
          }
        } catch (e) {
          console.error("[Orchestrator] Aiko routing call failed:", e);
        }
        return null;
      }
      buildRoutingPrompt(orchestratorMemory) {
        const summaries = this.getAgentSummaries().map((s) => {
          return `- ${s.endpointId}: ${s.description}`;
        }).join("\n");
        return `You are a request router for an application. Your job is to analyze the user's natural language request and select the correct API endpoint name.

Available endpoints:
${summaries}

Orchestrator Memory (recent routing history & learnings):
${orchestratorMemory || "No routing decisions recorded yet."}

Response Rules:
Reply with ONLY the exact endpoint name from the list above. Write nothing else. No punctuation, no wrapping.`;
      }
      async escalate(failedEndpointId, request, reason, failedTrace) {
        console.log(`[Orchestrator Escalation] Escalating to escalationSpec model to bypass endpoint failure...`);
        const agent = this.endpointAgents.get(failedEndpointId);
        if (!agent) throw new Error("Agent not found for escalation");
        const liveVars = this.tracker.readLiveVars(failedEndpointId);
        const inferredTags = this._inferTagsFromError(reason);
        const priorLearnings = await this.store.searchLearnings(failedEndpointId, inferredTags);
        const learningsPrompt = priorLearnings.map(
          (l) => `prior-learning: prob="${l.problemDescription}" tags=${l.tags.join(",")} sol="${l.solution}"`
        ).join("\n");
        const systemPrompt = `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (\u2192,\u2229,\u2265,|). output=json unless signal.
You are the system orchestrator resolving a failure.
Endpoint: ${failedEndpointId}
Purpose: ${agent.definition.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.definition.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

Prior learnings on failures:
${learningsPrompt || "none"}

The previous attempt failed with reason: "${reason}".
Your job is to override this, inspect the error, and generate a valid JSON payload matching the input schema.
Output ONLY raw JSON.`;
        const userPrompt = `User Request: "${request}"

Generate the corrected JSON payload.`;
        try {
          const startTime = Date.now();
          const response = await this.aikoClient.infer(this.escalationSpec, systemPrompt, userPrompt);
          let parsedPayload = response.trim();
          if (parsedPayload.startsWith("```")) {
            parsedPayload = parsedPayload.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
          }
          const payload = JSON.parse(parsedPayload);
          const result = await this.system.call(failedEndpointId, payload, { unwrap: false });
          const learning = {
            id: `learn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            concernedEndpoint: failedEndpointId,
            problemDescription: this._compressToLearningField(reason),
            tags: inferredTags,
            solution: this._compressToLearningField(`corrected payload: ${JSON.stringify(payload)}`),
            createdAt: Date.now()
          };
          await this.store.appendLearning(learning);
          const currentSpec = agent.definition.intelligenceSpec;
          const upgradedSpec = { ...currentSpec };
          if (upgradedSpec.reasoning < 10) upgradedSpec.reasoning += 1;
          if (upgradedSpec.planning < 10) upgradedSpec.planning += 1;
          if (upgradedSpec.jsonStrictness < 10) upgradedSpec.jsonStrictness += 1;
          console.log(`[Orchestrator Self-Optimization] Upgrading endpoint "${failedEndpointId}" intelligence requirements to prevent regression.`);
          const defOverride = await this.store.getEndpointDefinition(failedEndpointId) || {};
          defOverride.intelligenceSpec = upgradedSpec;
          await this.store.setEndpointDefinition(failedEndpointId, defOverride);
          if (typeof this.system.initializeAiLayer === "function") {
            await this.system.initializeAiLayer(this.system._entityDataDir);
          }
          const totalLatency = Date.now() - startTime;
          const upgradedTrace = {
            ...failedTrace,
            traceId: `esc_${failedTrace.traceId}`,
            retryCount: failedTrace.retryCount + 1,
            payload,
            executionResult: result,
            latencyMs: totalLatency,
            intelligenceSpec: upgradedSpec,
            failureReason: void 0
          };
          if (this.system.telemetry && this.system.telemetry.recordAiTrace) {
            this.system.telemetry.recordAiTrace(upgradedTrace);
          }
          return {
            status: "success",
            result,
            endpointId: failedEndpointId,
            trace: upgradedTrace
          };
        } catch (e) {
          console.error("[Orchestrator Escalation] Escalation failed:", e.message);
          throw e;
        }
      }
      // Feature 1: Orchestration Entrypoints
      async orchestrate(naturalLanguageRequest) {
        console.log(`[Orchestrator] Planning autonomous task execution for: "${naturalLanguageRequest}"`);
        const taskList = await this.plannerAgent.plan(naturalLanguageRequest);
        if (this.store) {
          await taskList.persist(this.store);
        }
        await this.taskRunner.run(taskList);
      }
      async handleQuery(query, context) {
        console.log(`[Orchestrator] Endpoint agent requested data query: "${query}"`);
        const nestedList = await this.plannerAgent.plan(query, `Context: Parent task ${context.taskId} (${context.endpointId})`);
        await this.taskRunner.receiveNest(nestedList.tasks.map((t) => ({ endpointId: t.endpointId, prompt: t.prompt })), context.taskId);
      }
      _inferTagsFromError(reason) {
        const clean = reason.toLowerCase();
        const tags = [];
        if (clean.includes("validation") || clean.includes("zod")) tags.push("validation");
        if (clean.includes("json") || clean.includes("parse")) tags.push("json-parse");
        if (clean.includes("missing") || clean.includes("required")) tags.push("missing-field");
        if (clean.includes("type")) tags.push("type-mismatch");
        if (clean.includes("network") || clean.includes("fetch") || clean.includes("http")) tags.push("network");
        return tags;
      }
      _compressToLearningField(text) {
        return text.toLowerCase().replace(/\b(the|a|an|and|or|but|is|are|was|were|be|been|being|to|from|by|for|with|about|against|between|into|through|during|before|after|above|below|to|of|at|by|under|over|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|s|t|can|will|just|don|should|now)\b/g, "").replace(/\s+/g, " ").trim();
      }
      async escalateTaskFailure(taskId, errorReason) {
        const list = this.taskRunner.getTaskList();
        if (!list) return;
        const task = list.tasks.find((t) => t.id === taskId);
        if (!task) return;
        console.warn(`[Orchestrator] Task ${taskId} failed. Attempting automated resolution...`);
        const agent = this.endpointAgents.get(task.endpointId);
        if (!agent) {
          this.escalateToHuman(taskId, `Agent not found for ${task.endpointId}`);
          return;
        }
        const inferredTags = this._inferTagsFromError(errorReason);
        const priorLearnings = await this.store.searchLearnings(task.endpointId, inferredTags);
        const liveVars = this.tracker.readLiveVars(task.endpointId);
        const learningsPrompt = priorLearnings.map(
          (l) => `prior-learning: prob="${l.problemDescription}" tags=${l.tags.join(",")} sol="${l.solution}"`
        ).join("\n");
        const systemPrompt = `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (\u2192,\u2229,\u2265,|). output=json unless signal.
You are the system orchestrator resolving a failure.
Endpoint: ${task.endpointId}
Purpose: ${agent.definition.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.definition.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

Prior learnings on failures:
${learningsPrompt || "none"}

The previous attempt failed with reason: "${errorReason}".
Your job is to override this, inspect the error, and generate a valid JSON payload matching the input schema.
Output ONLY raw JSON.`;
        const userPrompt = `Task Prompt: "${task.prompt}"

Generate corrected JSON payload.`;
        try {
          const response = await this.aikoClient.infer(this.escalationSpec, systemPrompt, userPrompt);
          let parsedPayload = response.trim();
          if (parsedPayload.startsWith("```")) {
            parsedPayload = parsedPayload.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
          }
          const payload = JSON.parse(parsedPayload);
          const result = await this.system.call(task.endpointId, payload, { unwrap: false });
          const learning = {
            id: `learn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            concernedEndpoint: task.endpointId,
            problemDescription: this._compressToLearningField(errorReason),
            tags: inferredTags,
            solution: this._compressToLearningField(`corrected payload: ${JSON.stringify(payload)}`),
            createdAt: Date.now()
          };
          await this.store.appendLearning(learning);
          const currentSpec = agent.definition.intelligenceSpec;
          const upgradedSpec = { ...currentSpec };
          if (upgradedSpec.reasoning < 10) upgradedSpec.reasoning += 1;
          if (upgradedSpec.planning < 10) upgradedSpec.planning += 1;
          if (upgradedSpec.jsonStrictness < 10) upgradedSpec.jsonStrictness += 1;
          const defOverride = await this.store.getEndpointDefinition(task.endpointId) || {};
          defOverride.intelligenceSpec = upgradedSpec;
          await this.store.setEndpointDefinition(task.endpointId, defOverride);
          if (typeof this.system.initializeAiLayer === "function") {
            await this.system.initializeAiLayer(this.system._entityDataDir);
          }
          console.log(`[Orchestrator] Automated resolution succeeded for task ${taskId}.`);
          await this.taskRunner.onSuccess(taskId, result);
        } catch (e) {
          console.error(`[Orchestrator] Automated resolution failed: ${e.message}. Escalating to human...`);
          await this.escalateToHuman(taskId, errorReason);
        }
      }
      async escalateToHuman(taskId, errorReason) {
        console.warn(`[HUMAN_ESCALATION] Task ${taskId} cannot be resolved automatically. Reason: ${errorReason}`);
        this.system.interface.getEmitter("system-events")?.pushDataStreamToEmitter({
          type: "needs-human",
          taskId,
          error: errorReason
        });
      }
      async handleHumanResolution(taskId, resolution) {
        console.log(`[Orchestrator] Human resolution received for task ${taskId}: ${resolution.action}`);
        if (resolution.action === "skip") {
          await this.taskRunner.receiveSkip(taskId);
        } else if (resolution.action === "nest" && resolution.tasks) {
          await this.taskRunner.receiveNest(resolution.tasks, taskId);
        } else {
          const list = this.taskRunner.getTaskList();
          if (list) {
            await this.taskRunner.run(list);
          }
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Runtime_Store.ts
var import_fs10, import_path10, KrnlRuntimeStore;
var init_K_LIB_Krnl_Runtime_Store = __esm({
  "src/krnl/core/K_LIB_Krnl_Runtime_Store.ts"() {
    "use strict";
    import_fs10 = __toESM(require("fs"), 1);
    import_path10 = __toESM(require("path"), 1);
    KrnlRuntimeStore = class {
      filePath;
      data = {
        endpointDefinitions: {},
        endpointMemories: {},
        orchestratorMemory: { memory: "", lastUpdated: 0 },
        telemetryLog: [],
        learnings: [],
        activeTasks: null
      };
      constructor(appRoot) {
        this.filePath = import_path10.default.join(appRoot, "krnl_runtime_state.db");
      }
      async load() {
        try {
          if (import_fs10.default.existsSync(this.filePath)) {
            const raw = import_fs10.default.readFileSync(this.filePath, "utf-8");
            this.data = JSON.parse(raw);
            if (!this.data.endpointDefinitions) this.data.endpointDefinitions = {};
            if (!this.data.endpointMemories) this.data.endpointMemories = {};
            if (!this.data.orchestratorMemory) this.data.orchestratorMemory = { memory: "", lastUpdated: 0 };
            if (!this.data.telemetryLog) this.data.telemetryLog = [];
            if (!this.data.learnings) this.data.learnings = [];
            if (this.data.activeTasks === void 0) this.data.activeTasks = null;
          } else {
            await this.save();
          }
        } catch (e) {
          console.error("[KrnlRuntimeStore] Failed to load store, initializing empty:", e);
          this.data = {
            endpointDefinitions: {},
            endpointMemories: {},
            orchestratorMemory: { memory: "", lastUpdated: 0 },
            telemetryLog: [],
            learnings: [],
            activeTasks: null
          };
        }
      }
      async getEndpointDefinition(endpointId) {
        return this.data.endpointDefinitions[endpointId] || null;
      }
      async setEndpointDefinition(endpointId, config) {
        this.data.endpointDefinitions[endpointId] = config;
        await this.save();
      }
      async getAllEndpointDefinitions() {
        return this.data.endpointDefinitions;
      }
      async getEndpointMemory(endpointId) {
        return this.data.endpointMemories[endpointId] || "";
      }
      async appendEndpointMemory(endpointId, learning) {
        const existing = this.data.endpointMemories[endpointId] || "";
        const prefix = existing ? existing + "\n" : "";
        this.data.endpointMemories[endpointId] = prefix + `[${(/* @__PURE__ */ new Date()).toISOString()}] ${learning}`;
        await this.save();
      }
      async getOrchestratorMemory() {
        return this.data.orchestratorMemory;
      }
      async setOrchestratorMemory(memory) {
        this.data.orchestratorMemory = {
          memory,
          lastUpdated: Date.now()
        };
        await this.save();
      }
      async appendTelemetry(record) {
        this.data.telemetryLog.push(record);
        if (this.data.telemetryLog.length > 1e3) {
          this.data.telemetryLog.shift();
        }
        await this.save();
      }
      async getTelemetryLog(limit) {
        if (limit && limit > 0) {
          return this.data.telemetryLog.slice(-limit);
        }
        return this.data.telemetryLog;
      }
      async appendLearning(learning) {
        if (!this.data.learnings) this.data.learnings = [];
        this.data.learnings.push(learning);
        await this.appendEndpointMemory(
          learning.concernedEndpoint,
          `Problem: ${learning.problemDescription} | Solution: ${learning.solution}`
        );
        await this.save();
      }
      async searchLearnings(endpointId, tags) {
        const pool = (this.data.learnings || []).filter((l) => l.concernedEndpoint === endpointId);
        if (tags.length === 0) return pool;
        const matched = pool.filter((l) => {
          const intersect = l.tags.filter((t) => tags.includes(t));
          return intersect.length > 0;
        }).sort((a, b) => {
          const intersectA = a.tags.filter((t) => tags.includes(t)).length;
          const intersectB = b.tags.filter((t) => tags.includes(t)).length;
          return intersectB - intersectA;
        });
        return matched.length > 0 ? matched : pool;
      }
      async saveTaskList(listData) {
        this.data.activeTasks = listData;
        await this.save();
      }
      async loadTaskList() {
        return this.data.activeTasks || null;
      }
      async save() {
        try {
          import_fs10.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
        } catch (e) {
          console.error("[KrnlRuntimeStore] Failed to save store:", e);
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Endpoint_Agent.ts
var KrnlEndpointAgent;
var init_K_LIB_Krnl_Endpoint_Agent = __esm({
  "src/krnl/core/K_LIB_Krnl_Endpoint_Agent.ts"() {
    "use strict";
    KrnlEndpointAgent = class {
      definition;
      aikoClient;
      tracker;
      system;
      tools;
      constructor(definition, aikoClient, tracker, system, tools = {}) {
        this.definition = definition;
        this.aikoClient = aikoClient;
        this.tracker = tracker;
        this.system = system;
        this.tools = tools;
      }
      async executeFromNaturalLanguage(naturalLanguageRequest) {
        const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const timestamp = Date.now();
        const liveVars = this.tracker.readLiveVars(this.definition.id);
        const startTime = Date.now();
        let aiStartTime = Date.now();
        let aiEndTime = Date.now();
        try {
          const { payload, retryCount, failures, aiTimeMs } = await this.repairLoop(
            naturalLanguageRequest,
            liveVars
          );
          aiEndTime = Date.now();
          const executionStart = Date.now();
          const result = await this.system.call(this.definition.id, payload, {
            unwrap: false
          });
          const totalLatency = Date.now() - startTime;
          const trace = {
            traceId,
            timestamp,
            appName: this.system.entityName,
            endpointId: this.definition.id,
            intelligenceSpec: this.definition.intelligenceSpec,
            promptHash: this.getPromptHash(this.buildSystemPrompt(liveVars), naturalLanguageRequest),
            retryCount,
            validationFailures: failures,
            payload,
            executionResult: result,
            latencyMs: totalLatency,
            aiLatencyMs: aiTimeMs
          };
          return { result, trace };
        } catch (error) {
          const totalLatency = Date.now() - startTime;
          const trace = {
            traceId,
            timestamp,
            appName: this.system.entityName,
            endpointId: this.definition.id,
            intelligenceSpec: this.definition.intelligenceSpec,
            promptHash: this.getPromptHash(this.buildSystemPrompt(liveVars), naturalLanguageRequest),
            retryCount: this.definition.retryConfig?.maxRetries || 4,
            validationFailures: [error.message],
            payload: null,
            executionResult: null,
            latencyMs: totalLatency,
            aiLatencyMs: aiEndTime - aiStartTime,
            failureReason: error.message
          };
          throw { error, trace };
        }
      }
      buildSystemPrompt(liveVars) {
        const toolsDesc = Object.entries(this.tools).map(([name, tool]) => {
          const schemaStr = tool.schema ? `
  Schema: ${JSON.stringify(tool.schema)}` : "";
          const examplesStr = tool.examples ? `
  Examples: ${JSON.stringify(tool.examples)}` : "";
          return `- ${name}: ${tool.description || "Agent helper tool"}${schemaStr}${examplesStr}`;
        }).join("\n");
        return `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (\u2192,\u2229,\u2265,|). output=json unless signal.
You are an endpoint agent representing the raw endpoint "${this.definition.id}".
Purpose: ${this.definition.description}
Instructions: ${this.definition.systemInstructions}
Intelligence Capability Spec: ${JSON.stringify(this.definition.intelligenceSpec)}

Input Schema (JSON Schema format):
${JSON.stringify(this.definition.inputSchema, null, 2)}

Examples:
${JSON.stringify(this.definition.examples, null, 2)}

Current live state variables:
${JSON.stringify(liveVars, null, 2)}

Endpoint Memory (learned experiences from prior executions):
${this.definition.memory || "No prior memories recorded yet."}

Available Tools (you can call these internally if needed):
${toolsDesc}

Your primary job is to extract, convert, or infer parameters from user requests to produce a valid JSON payload matching the input schema.
Output ONLY raw, pure JSON. Do not write explanations, markdown blocks, formatting or wrapping.`;
      }
      parsePayload(aiResponse) {
        let cleaned = aiResponse.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
        }
        cleaned = cleaned.trim();
        try {
          return JSON.parse(cleaned);
        } catch (err) {
          const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            try {
              return JSON.parse(match[0].trim());
            } catch (e) {
            }
          }
          throw err;
        }
      }
      validatePayload(payload) {
        const functionality = this.system.localFunctionalities.get(this.definition.id);
        if (!functionality || !functionality.schema || !functionality.schema.input) {
          return { valid: true };
        }
        try {
          const schemaInput = functionality.schema.input;
          if (typeof schemaInput.verify === "function") {
            const verifyError = schemaInput.verify(payload);
            if (verifyError) {
              throw new Error(`Protobuf verification failed: ${verifyError}`);
            }
          } else if (typeof schemaInput.parse === "function") {
            schemaInput.parse(payload);
          } else if (typeof schemaInput === "function") {
            if (!schemaInput(payload)) throw new Error("Input validation check returned false.");
          }
          return { valid: true };
        } catch (e) {
          return { valid: false, error: e.message };
        }
      }
      async repairLoop(request, liveVars) {
        const maxRetries = this.definition.retryConfig?.maxRetries || 4;
        const failures = [];
        let systemPrompt = this.buildSystemPrompt(liveVars);
        let userPrompt = request;
        let aiTimeAccumulator = 0;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          const aiCallStart = Date.now();
          let aiResponse = "";
          try {
            aiResponse = await this.aikoClient.infer(this.definition.intelligenceSpec, systemPrompt, userPrompt);
          } catch (err) {
            aiTimeAccumulator += Date.now() - aiCallStart;
            failures.push(`Aiko connection failure: ${err.message}`);
            if (attempt === maxRetries) {
              throw new Error(`Endpoint agent execution failed after connection errors. Last: ${err.message}`);
            }
            continue;
          }
          aiTimeAccumulator += Date.now() - aiCallStart;
          try {
            const payload = this.parsePayload(aiResponse);
            const valResult = this.validatePayload(payload);
            if (valResult.valid) {
              return { payload, retryCount: attempt, failures, aiTimeMs: aiTimeAccumulator };
            } else {
              failures.push(`Validation attempt ${attempt} failed: ${valResult.error}`);
              userPrompt = `${request}

Validation error from previous output:
${valResult.error}

Please generate a corrected payload.`;
            }
          } catch (e) {
            failures.push(`JSON Parse attempt ${attempt} failed: ${e.message}`);
            userPrompt = `${request}

Invalid JSON from previous output:
${e.message}

Please output clean, valid JSON matching the schema.`;
          }
          if (attempt === maxRetries) {
            throw new Error(`Endpoint agent validation failed after ${maxRetries} retries: ${failures.join(" | ")}`);
          }
        }
        throw new Error("Validation retries exhausted");
      }
      getPromptHash(system, user) {
        let hash = 0;
        const combined = system + user;
        for (let i = 0; i < combined.length; i++) {
          const char = combined.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return `hash_${Math.abs(hash)}`;
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Registry_Client.ts
var K_LIB_Krnl_Registry_Client_exports = {};
__export(K_LIB_Krnl_Registry_Client_exports, {
  KrnlRegistryClient: () => KrnlRegistryClient
});
var KrnlRegistryClient;
var init_K_LIB_Krnl_Registry_Client = __esm({
  "src/krnl/core/K_LIB_Krnl_Registry_Client.ts"() {
    "use strict";
    init_K_LIB_Krnl_Base_Concepts();
    KrnlRegistryClient = class {
      constructor(registryPort = 10099) {
        this.registryPort = registryPort;
      }
      registryPort;
      getUrl(action) {
        return `http://127.0.0.1:${this.registryPort}/call/${action}`;
      }
      async isRegistryAlive() {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 800);
          const res = await fetch(this.getUrl("heartbeat"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            signal: controller.signal
          });
          clearTimeout(id);
          return res.ok;
        } catch (_) {
          return false;
        }
      }
      async register(name, port, pid) {
        try {
          const res = await fetch(this.getUrl("registerApp"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, port, pid })
          });
          if (res.ok) {
            const body = await res.json();
            return body?.status === "success" || body?.success === true;
          }
          return false;
        } catch (err) {
          Logger.error(`[KrnlRegistryClient] Register error:`, err.message);
          return false;
        }
      }
      async deregister(name) {
        try {
          const res = await fetch(this.getUrl("deregisterApp"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
          });
          if (res.ok) {
            const body = await res.json();
            return body?.status === "success" || body?.success === true;
          }
          return false;
        } catch (err) {
          Logger.error(`[KrnlRegistryClient] Deregister error:`, err.message);
          return false;
        }
      }
      async heartbeat(name) {
        try {
          const res = await fetch(this.getUrl("heartbeatApp"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
          });
          if (res.ok) {
            const body = await res.json();
            return body?.status === "success" || body?.success === true;
          }
          return false;
        } catch (err) {
          Logger.error(`[KrnlRegistryClient] Heartbeat error:`, err.message);
          return false;
        }
      }
      async lookup(name) {
        try {
          const res = await fetch(this.getUrl("lookupApp"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
          });
          if (res.ok) {
            const body = await res.json();
            const payload = body?.payload || body?.data || body;
            if (payload && payload.port) {
              return payload;
            }
          }
          return null;
        } catch (_) {
          return null;
        }
      }
    };
  }
});

// src/krnl/core/K_LIB_Krnl_Ep_Tools.ts
var K_LIB_Krnl_Ep_Tools_exports = {};
__export(K_LIB_Krnl_Ep_Tools_exports, {
  KrnlEpTools: () => KrnlEpTools
});
var KrnlEpTools;
var init_K_LIB_Krnl_Ep_Tools = __esm({
  "src/krnl/core/K_LIB_Krnl_Ep_Tools.ts"() {
    "use strict";
    KrnlEpTools = {
      calculator: {
        id: "calculator",
        description: "eval arith-expr(str) \u2192 num. use-when: derive numeric val from schema fields.",
        schema: {
          input: { expression: "str: arith expr. ops: +,-,*,/,(). e.g. '(a+b)*c'" },
          output: "num"
        },
        examples: [
          { input: { expression: "10 + 5 * 2" }, output: 20 },
          { input: { expression: "(100-30)/7" }, output: 10 }
        ],
        execute: (expression) => {
          const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
          try {
            const result = new Function(`return (${sanitized});`)();
            if (typeof result === "number") return result;
            throw new Error("Result is not a number");
          } catch (e) {
            throw new Error(`Math evaluation failed: ${e.message}`);
          }
        }
      },
      jsonCreator: {
        id: "jsonCreator",
        description: "parse(jsonStr) \u2192 obj | merge(obj,base) \u2192 merged. use-when: validate/build payload.",
        schema: {
          input: { jsonStr: "str: valid JSON", mergeWith: "obj? base to merge into" },
          output: "obj"
        },
        examples: [
          { input: { jsonStr: '{"a":1}' }, output: { a: 1 } },
          { input: { jsonStr: '{"b":2}', mergeWith: { a: 1 } }, output: { a: 1, b: 2 } }
        ],
        execute: (jsonStr, mergeWith) => {
          try {
            const parsed = JSON.parse(jsonStr);
            if (mergeWith && typeof mergeWith === "object") {
              return { ...mergeWith, ...parsed };
            }
            return parsed;
          } catch (e) {
            throw new Error(`JSON validation/parsing failed: ${e.message}`);
          }
        }
      },
      textFormatter: {
        id: "textFormatter",
        description: "render(template,vars) \u2192 str. use-when: replace placeholders in templates.",
        schema: {
          input: { template: "str w/ {{key}} placeholders", variables: "obj mapping keys \u2192 values" },
          output: "str"
        },
        examples: [
          { input: { template: "hello {{name}}", variables: { name: "alice" } }, output: "hello alice" }
        ],
        execute: (template, variables) => {
          let result = template;
          for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value));
          }
          return result;
        }
      },
      endpointCaller: {
        id: "endpointCaller",
        description: "call(endpointId,payload) \u2192 res. use-when: invoke sibling endpoint in same system.",
        schema: {
          input: { endpointId: "str: target endpoint", payload: "obj: input matching target schema" },
          output: "any"
        },
        examples: [
          { input: { endpointId: "StoreKey", payload: { name: "test", value: "val" } }, output: { status: "success" } }
        ],
        execute: async (system, endpointId, payload) => {
          if (!system || typeof system.call !== "function") {
            throw new Error("System host entity not available or invalid.");
          }
          return await system.call(endpointId, payload, { unwrap: true });
        }
      },
      healthChecker: {
        id: "healthChecker",
        description: "ping(peerId) \u2192 status. use-when: verify component/sibling system is alive.",
        schema: {
          input: { peerId: "str: peer system identifier" },
          output: "obj"
        },
        examples: [
          { input: { peerId: "Aiko" }, output: { status: "alive" } }
        ],
        execute: async (system, peerId) => {
          if (!system) throw new Error("System host entity not available.");
          const peer = system.getRemoteEntity ? system.getRemoteEntity(peerId) : null;
          if (peer) {
            return await peer.call("heartbeat", {});
          }
          if (system.localFunctionalities?.has("heartbeat")) {
            return await system.call("heartbeat", {});
          }
          throw new Error(`Peer or heartbeat endpoint not found for: ${peerId}`);
        }
      }
    };
  }
});

// src/krnl/core/K_ENT_Krnl_System_Entity_Base.ts
var import_http4, import_net3, import_fs11, import_path11, import_url3, import_zod_to_json_schema2, krnlSystemEntityBase;
var init_K_ENT_Krnl_System_Entity_Base = __esm({
  "src/krnl/core/K_ENT_Krnl_System_Entity_Base.ts"() {
    "use strict";
    init_K_ENT_Krnl_Entity_Base();
    init_K_LIB_Krnl_System_Comm_Component();
    init_K_LIB_Krnl_System_Base_Functionality_APIs();
    init_K_LIB_Krnl_Base_Concepts();
    init_K_LIB_Krnl_System_Unified_Http_Adapter();
    init_KrnlShell();
    init_K_LIB_Krnl_System_Ingress_Network();
    init_K_LIB_Krnl_System_Frontend();
    init_K_LIB_Krnl_Aiko_Client();
    init_K_LIB_Krnl_Watch_Variables_Tracker();
    init_K_LIB_Krnl_Endpoint_Scheduler();
    init_K_LIB_Krnl_Application_Orchestrator();
    init_K_LIB_Krnl_Runtime_Store();
    init_K_LIB_Krnl_Endpoint_Agent();
    import_http4 = __toESM(require("http"), 1);
    import_net3 = __toESM(require("net"), 1);
    import_fs11 = __toESM(require("fs"), 1);
    import_path11 = __toESM(require("path"), 1);
    import_url3 = require("url");
    import_zod_to_json_schema2 = require("zod-to-json-schema");
    krnlSystemEntityBase = class extends krnlEntityBase {
      _isIngressNetworkMember = false;
      _ingressNetwork = null;
      _frontendEnabled = false;
      _frontend = null;
      _isSubApp = false;
      peers;
      discoverable;
      // AI Properties
      _aiOrchestrator = null;
      _aiTracker = null;
      _aiScheduler = null;
      _aikoClient = null;
      _aiProfilesStore = null;
      _aikoCatalog = {};
      _krnlSystemEndpointIds = /* @__PURE__ */ new Set([
        "heartbeat",
        "getTelemetry",
        "adminCommand",
        "discoverPeers",
        "getManifest",
        "getLastActionDocs",
        "getFullDocumentation",
        "getUsedPorts",
        "findFreePorts",
        "shutdown",
        "getIngressNetworkTopology",
        "getAikoCatalog",
        "getTaskList",
        "ai"
      ]);
      reservation;
      peerTtlMs;
      commPort;
      host;
      commComponent;
      _sharedServer;
      serviceSuites;
      unifiedHttpAdapter;
      _documentationProvider;
      _lastPreemptiveDoc = null;
      _lastErrorDoc = null;
      discoverySocket;
      beaconInterval;
      /** portRegistry: serviceName → port  (P_local ⊆ ℕ) */
      portRegistry;
      /** Registered service configurations for external processes. */
      _serviceConfigs = [];
      /** Active handles for managed services. */
      _managedServices = /* @__PURE__ */ new Map();
      /**
       * _preferredPort — the port hint supplied at construction.
       * Write-once. Never published externally. The actual bound port is commPort
       * (set by finalizeCommPort after a successful server.listen()).
       */
      _preferredPort;
      /** Directory where {entityName}.ports.json is written. */
      _entityDataDir;
      /** True once gracefulShutdown has been triggered — prevents re-entry. */
      _shuttingDown = false;
      /** 
       * Internal readiness signaling. 
       * Resolves after _startSharedServer successfully binds and finalizeCommPort is called.
       */
      _readyPromise;
      _resolveReady;
      _magneticLoadPromise = null;
      _registryClient;
      _registryHeartbeatInterval = null;
      _registryEvictionInterval = null;
      _registryApps = /* @__PURE__ */ new Map();
      /**
       * @param name
       * @param owner
       * @param commPort - WS listen port for the commComponent.
       * @param host - Interface to bind to.
       * @param options - Entity options.
       */
      constructor(name, owner = null, commPort = 10099, host = "0.0.0.0", options = {}) {
        super(name, owner, { ...options, Singleton: true });
        this.systemType = "SystemOrchestrator";
        this.peers = /* @__PURE__ */ new Map();
        this.discoverable = true;
        this.reservation = {
          busy: false,
          reservedBy: null,
          reservedAt: null
        };
        this.peerTtlMs = 6e4;
        Promise.resolve().then(() => (init_K_LIB_Krnl_Registry_Client(), K_LIB_Krnl_Registry_Client_exports)).then(({ KrnlRegistryClient: KrnlRegistryClient2 }) => {
          this._registryClient = new KrnlRegistryClient2(10099);
        }).catch(() => {
        });
        this._readyPromise = new Promise((resolve) => {
          this._resolveReady = resolve;
        });
        this.commPort = commPort;
        this.host = host;
        this.commComponent = new krnlSystemCommComponent(this, commPort, host);
        this._setupBaseFunctionalities();
        this._setupBaseInterface();
        this._setupRpcHandlers();
        this._sharedServer = null;
        this.serviceSuites = /* @__PURE__ */ new Map();
        this.unifiedHttpAdapter = new krnlUnifiedHttpAdapter(this, commPort, host);
        this.portRegistry = /* @__PURE__ */ new Map();
        this._preferredPort = commPort;
        let dataDir = process.cwd();
        const subappStore = globalThis.__krnlSubAppLocalStorage?.getStore();
        if (subappStore && typeof subappStore === "object" && subappStore.appPath) {
          dataDir = subappStore.appPath;
        } else if (options.sourcePath) {
          try {
            const resolved = options.sourcePath.startsWith("file:") ? (0, import_url3.fileURLToPath)(options.sourcePath) : options.sourcePath;
            dataDir = import_path11.default.dirname(resolved);
          } catch (_) {
          }
        }
        this._entityDataDir = dataDir;
        console.log(`[KRNL_DATA_DIR] Entity: ${this.entityName}, DataDir: ${this._entityDataDir}, subappStore: ${JSON.stringify(subappStore)}`);
        this._documentationProvider = null;
        this._emitStartupDiagnostics();
        this._isSubApp = !!subappStore;
        this._magneticLoadPromise = this._runMagneticLoader(options);
      }
      enableFrontend(options) {
        this._frontendEnabled = true;
        this._frontend = new KrnlFrontend(this, options);
      }
      async _runMagneticLoader(options = {}) {
        if (options._skipMagneticLoading) {
          return;
        }
        try {
          const { KrnlMagneticLoader: KrnlMagneticLoader2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_System_Magnetic_Loader(), K_LIB_Krnl_System_Magnetic_Loader_exports));
          await KrnlMagneticLoader2.loadAll(this, this._entityDataDir);
        } catch (err) {
          console.error(`[${this.entityName}] Magnetic loader error:`, err);
        }
      }
      /**
       * boot
       * Boot validation & startup entrypoint
       */
      async boot() {
        await this.whenReady();
      }
      /**
       * whenReady
       * Await this promise to ensure the system has bound to its final port,
       * written its snapshot file, and is fully operational.
       */
      async whenReady() {
        if (this._magneticLoadPromise) {
          await this._magneticLoadPromise;
        }
        await this._validateBootManifestDependencies();
        await this._readyPromise;
      }
      /**
       * Validates requiredRemotes manifest dependencies upon boot
       */
      async _validateBootManifestDependencies() {
        try {
          const manifestPath = import_path11.default.join(this._entityDataDir, "krnl.json");
          if (!import_fs11.default.existsSync(manifestPath)) return;
          const content = import_fs11.default.readFileSync(manifestPath, "utf-8");
          const manifest = JSON.parse(content);
          if (!manifest.dependencies?.requiredRemotes) return;
          const availableEntities = /* @__PURE__ */ new Set();
          availableEntities.add(this.entityName);
          if (this.entityClass) availableEntities.add(this.entityClass);
          if (this._ingressNetwork?.members) {
            for (const [prefix] of this._ingressNetwork.members.entries()) {
              availableEntities.add(prefix);
              if (prefix) {
                availableEntities.add(prefix.charAt(0).toUpperCase() + prefix.slice(1));
              }
            }
          }
          const ownedMap = this.ownedComponents || this.components;
          if (ownedMap && typeof ownedMap.values === "function") {
            for (const owned of ownedMap.values()) {
              if (owned?.entityName) availableEntities.add(owned.entityName);
            }
          }
          for (const remote of manifest.dependencies.requiredRemotes) {
            if (remote.targetEntity && !availableEntities.has(remote.targetEntity)) {
              const payload = {
                error: "ERR_KRNL_UNRESOLVED_REMOTE_TARGET",
                sourceEntity: this.entityName,
                missingTargetEntity: remote.targetEntity,
                requiredFid: remote.fid,
                availableEntities: Array.from(availableEntities)
              };
              throw new Error(`[ERR_KRNL_UNRESOLVED_REMOTE_TARGET] Boot validation failed for '${this.entityName}': Target entity '${remote.targetEntity}' required by fid '${remote.fid}' was not found in active system hierarchy. Details: ${JSON.stringify(payload)}`);
            }
          }
        } catch (err) {
          if (err.message?.includes("ERR_KRNL_UNRESOLVED_REMOTE_TARGET")) {
            throw err;
          }
          console.warn(`[BootValidation] Warning: could not parse krnl.json at ${this._entityDataDir}: ${err.message}`);
        }
      }
      async startIngressNetwork(members) {
        this._ingressNetwork = new KrnlIngressNetwork();
        for (const config of members) {
          try {
            await this._ingressNetwork.addMember(this, config);
          } catch (err) {
            const errMsg = err.message || String(err);
            console.error(`[IngressNetwork] Failed to add subapp '${config.prefix}':`, errMsg);
            this._subappErrors = this._subappErrors || [];
            this._subappErrors.push({
              subapp: config.prefix,
              error: errMsg
            });
          }
        }
        const discoveryPort = this.commPort > 0 ? this.commPort + 1e3 : 10101;
        await this.startDiscovery(discoveryPort);
      }
      async joinIngressNetwork(config) {
        if (!this._ingressNetwork) {
          this._ingressNetwork = new KrnlIngressNetwork();
        }
        return await this._ingressNetwork.addMember(this, config);
      }
      async startCustomFrontend(name, appPath, options) {
        try {
          if (!this._ingressNetwork) {
            this._ingressNetwork = new KrnlIngressNetwork();
            const discoveryPort = this.commPort > 0 ? this.commPort + 1e3 : 10101;
            await this.startDiscovery(discoveryPort);
          }
          return await this._ingressNetwork.addFrontendMember(this, { name, appPath, options });
        } catch (err) {
          console.error(`[startCustomFrontend] Error starting custom frontend '${name}':`, err);
          throw err;
        }
      }
      async stopCustomFrontend(name, prefix = "modules") {
        if (!this._ingressNetwork) return false;
        const key = `${prefix}/${name.toLowerCase()}`;
        return await this._ingressNetwork.removeMember(this, key);
      }
      getIngressNetworkTopology() {
        if (!this._ingressNetwork) return null;
        const members = Array.from(this._ingressNetwork.members.entries()).map(([prefix, entry]) => ({
          prefix,
          entityName: entry.entity.entityName,
          addedAt: entry.addedAt
        }));
        return {
          admin: this.entityName,
          port: this.commPort,
          members
        };
      }
      /**
       * port — stable public accessor for the active bound port.
       * Mirrors commPort. Resolves to the OS-assigned value after finalizeCommPort().
       * Use this instead of commPort or commComponent.listenPort.
       */
      get port() {
        return this.commPort;
      }
      /**
       * Registers a documentation provider to enable automatic result decoration across all protocols.
       */
      setDocumentationProvider(provider) {
        this._documentationProvider = provider;
      }
      async _decorateResult(result, fid, input) {
        let finalResult = result && typeof result === "object" && result.status ? result : { status: "success", payload: result };
        if (this._documentationProvider && finalResult.status === "success") {
          if (typeof this._documentationProvider.getNextStepsDoc === "function") {
            const nextSteps = this._documentationProvider.getNextStepsDoc(fid);
            if (nextSteps && nextSteps.length > 0) {
              this._lastPreemptiveDoc = {
                message: "Progressive Exploration: Recommended next steps.",
                nextSteps
              };
              this._lastErrorDoc = null;
              finalResult.preemptiveDocumentation = {
                message: "PREEMPTIVE_DOCS: call('getLastActionDocs'); FULL_DOCS: call('getFullDocumentation');",
                accessEndpoint: "getLastActionDocs"
              };
            }
          }
        }
        return finalResult;
      }
      async _decorateError(err, fid, input) {
        const response = {
          status: "error",
          message: err.message || String(err),
          payload: null,
          ...err.metadata || {}
        };
        if (this._documentationProvider && typeof this._documentationProvider.getDocForEndpoint === "function") {
          const usageDoc = this._documentationProvider.getDocForEndpoint(fid);
          if (usageDoc) {
            this._lastErrorDoc = usageDoc;
            this._lastPreemptiveDoc = null;
            response.errorDocumentation = {
              message: "ERROR_DOCS: call('getLastActionDocs'); FULL_DOCS: call('getFullDocumentation');",
              accessEndpoint: "getLastActionDocs"
            };
          }
        }
        return response;
      }
      getNotFoundResponse(path14) {
        const response = {
          status: "error",
          message: `Route '${path14}' not found.`
        };
        if (this._documentationProvider && typeof this._documentationProvider.getDocsForLayer === "function") {
          const entryPoints = this._documentationProvider.getDocsForLayer("LAYER_1_ENTRY");
          if (entryPoints && entryPoints.length > 0) {
            response.preemptiveDocumentation = {
              message: "Welcome! Here is the entry-level documentation.",
              entryPoints
            };
          }
        }
        return response;
      }
      isDiscoveryAvailable() {
        return typeof window === "undefined";
      }
      _emitStartupDiagnostics() {
        const diagnostics = {
          event: "KRNL_STARTUP",
          entity: this.entityName,
          timestamp: Date.now(),
          subsystems: {
            // preferredPort is the constructor hint; actual bound port is set later by finalizeCommPort
            comm: { status: "pending", preferredPort: this._preferredPort },
            discovery: { status: this.isDiscoveryAvailable() ? "available" : "unavailable" }
          },
          flags: this.getSystemFlags(),
          environment: typeof window === "undefined" ? "node" : "browser"
        };
        console.log(`[KRNL_DIAGNOSTICS] ${JSON.stringify(diagnostics)}`);
        Logger.log(`System ${this.entityName} starting diagnostics emitted.`);
      }
      getSystemFlags() {
        return {
          discoverable: this.discoverable,
          busy: this.reservation.busy,
          reservedBy: this.reservation.reservedBy,
          reservedAt: this.reservation.reservedAt
        };
      }
      setDiscoverable(value) {
        this.discoverable = Boolean(value);
        return this.getSystemFlags();
      }
      // ── Port Registry Methods ────────────────────────────────────────────────
      /**
       * Register a named service port.
       * registerPort(name, p) → portRegistry[name] = p
       * Throws if the port is already claimed by a different service.
       */
      async registerPort(serviceName, port) {
        for (const [existingName, existingPort] of this.portRegistry.entries()) {
          if (existingPort === port && port > 0 && existingName !== serviceName) {
            throw new Error(
              `[${this.entityName}] Port ${port} is already registered to '${existingName}'.`
            );
          }
        }
        this.portRegistry.set(serviceName, port);
        await this._writePortsFile();
      }
      /** Remove a service port registration. */
      async unregisterPort(serviceName) {
        if (serviceName === "_krnl_system") {
          throw new Error(`[${this.entityName}] Cannot unregister the system port '_krnl_system'.`);
        }
        this.portRegistry.delete(serviceName);
        await this._writePortsFile();
      }
      /** Return a plain-object snapshot of portRegistry: Record<serviceName, port>. */
      getRegisteredPorts() {
        return Object.fromEntries(this.portRegistry.entries());
      }
      // ── Port Snapshot File ────────────────────────────────────────────────────
      /** Absolute path of the JSON port snapshot co-located with the assembler. */
      _getPortsFilePath() {
        return import_path11.default.join(this._entityDataDir, `${this.entityName}.ports.json`);
      }
      /**
       * _writePortsFile — persists portRegistry to disk.
       *
       * Only called by finalizeCommPort() — never from constructor state.
       */
      async _writePortsFile() {
        const filePath = this._getPortsFilePath();
        const snapshot = JSON.stringify({
          entity: this.entityName,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          ports: this.getRegisteredPorts()
        }, null, 2);
        try {
          const dir = import_path11.default.dirname(filePath);
          if (!import_fs11.default.existsSync(dir)) {
            await import_fs11.default.promises.mkdir(dir, { recursive: true });
          }
          await import_fs11.default.promises.writeFile(filePath, snapshot);
        } catch (err) {
          Logger.error(`[${this.entityName}] Ports file write failed:`, err);
        }
      }
      /** Remove the ports snapshot file on shutdown. */
      _deletePortsFile() {
        const filePath = this._getPortsFilePath();
        try {
          if (import_fs11.default.existsSync(filePath)) {
            import_fs11.default.unlinkSync(filePath);
          }
        } catch (_) {
        }
      }
      // ── Port Probe ────────────────────────────────────────────────────────────
      /**
       * _probeAvailablePort — find the first bindable port starting from preferred.
       *
       * Algorithm:
       *   for p in [preferred, preferred+100] ∩ [1, 65535]:
       *     try net.createServer().listen(p, host)
       *     if success  → close probe, return p
       *     if EADDRINUSE → continue
       *   throw if none found
       *
       * The probe server is closed before returning so the actual server can bind.
       * There is an inherent TOCTOU (time-of-check/time-of-use) window between
       * probe close and real listen, but this is unavoidable without SO_REUSEPORT
       * and is acceptable for the port-drift bug class we are eliminating.
       */
      async _probeAvailablePort(preferred, host) {
        const cap = Math.min(preferred + 100, 65535);
        for (let port = preferred; port <= cap; port++) {
          const available = await new Promise((resolve) => {
            const probe = import_net3.default.createServer();
            probe.once("error", () => resolve(false));
            probe.listen(port, host, () => probe.close(() => setTimeout(() => resolve(true), 50)));
          });
          if (available) return port;
        }
        throw new Error(
          `[${this.entityName}] No available port in [${preferred}, ${cap}]. Cannot start server.`
        );
      }
      // ── Single Source of Truth for Port Assignment ────────────────────────────
      /**
       * finalizeCommPort — the only method that writes port state.
       *
       * Called once, from _startSharedServer, after server.listen() succeeds.
       * Never called from the constructor.
       *
       * Updates (atomically from caller's perspective):
       *   this.commPort                    ← actualPort
       *   this.commComponent.listenPort    ← actualPort
       *   this.unifiedHttpAdapter.port     ← actualPort
       *   portRegistry['_krnl_system']     ← actualPort
       *   ports snapshot file              ← written atomically
       *   _readyPromise                    ← resolved
       */
      async finalizeCommPort(actualPort) {
        this.commPort = actualPort;
        this.commComponent.listenPort = actualPort;
        this.unifiedHttpAdapter.port = actualPort;
        this.portRegistry.set("_krnl_system", actualPort);
        await this._writePortsFile();
        await this._registerWithRegistry(actualPort);
        this._resolveReady();
        Logger.log(`[${this.entityName}] commPort finalized \u2192 ${actualPort}`);
      }
      async _registerWithRegistry(actualPort) {
        if (this._isIngressNetworkMember) return;
        if (!this._registryClient) {
          const { KrnlRegistryClient: KrnlRegistryClient2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_Registry_Client(), K_LIB_Krnl_Registry_Client_exports));
          this._registryClient = new KrnlRegistryClient2(10099);
        }
        if (actualPort === 10099) {
          console.log(`[${this.entityName}] Self-promoting to central registry host.`);
          this._registryApps = /* @__PURE__ */ new Map();
          const { registerAppApi: registerAppApi2, deregisterAppApi: deregisterAppApi2, heartbeatAppApi: heartbeatAppApi2, lookupAppApi: lookupAppApi2, listAppsApi: listAppsApi2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_System_Base_Functionality_APIs(), K_LIB_Krnl_System_Base_Functionality_APIs_exports));
          this.addLocal({ id: "registerApp", api: registerAppApi2(this) });
          this.addLocal({ id: "deregisterApp", api: deregisterAppApi2(this) });
          this.addLocal({ id: "heartbeatApp", api: heartbeatAppApi2(this) });
          this.addLocal({ id: "lookupApp", api: lookupAppApi2(this) });
          this.addLocal({ id: "listApps", api: listAppsApi2(this) });
          this._registryEvictionInterval = setInterval(() => {
            const now = Date.now();
            for (const [name, app] of this._registryApps.entries()) {
              if (now - app.lastHeartbeat > 3e4) {
                console.log(`[Registry] Evicting dead app "${name}" (no heartbeat for 30s)`);
                this._registryApps.delete(name);
              }
            }
          }, 5e3);
          return;
        }
        const registered = await this._registryClient.register(this.entityName, actualPort, typeof process !== "undefined" ? process.pid : 0);
        if (registered) {
          if (this._registryHeartbeatInterval) clearInterval(this._registryHeartbeatInterval);
          this._registryHeartbeatInterval = setInterval(async () => {
            await this._registryClient.heartbeat(this.entityName);
          }, 1e4);
        }
        this._startReRegistrationSafetyLoop(actualPort);
      }
      _startReRegistrationSafetyLoop(actualPort) {
        setInterval(async () => {
          const alive = await this._registryClient.isRegistryAlive();
          if (alive) {
            await this._registryClient.register(this.entityName, actualPort, typeof process !== "undefined" ? process.pid : 0);
          }
        }, 6e4);
      }
      async _deregisterFromRegistry() {
        if (this._registryHeartbeatInterval) clearInterval(this._registryHeartbeatInterval);
        if (this._registryEvictionInterval) clearInterval(this._registryEvictionInterval);
        if (this.commPort === 10099) return;
        if (this._registryClient) {
          try {
            await this._registryClient.deregister(this.entityName);
          } catch (_) {
          }
        }
      }
      // ── Graceful Shutdown ─────────────────────────────────────────────────────
      /**
       * gracefulShutdown
       *
       * Sequence:
       *   1. Signal all owned entities (microservices).
       *      - Calls gracefulShutdown() if available, else dispose().
       *   2. Stop managed external processes.
       *   3. Await all shutdowns (parallel, bounded by timeoutMs).
       *   4. Delete ports snapshot file.
       *   5. Dispose self (server, sockets, intervals).
       *   6. Exit process.
       *
       * @param opts.timeoutMs  Max wait for owned services (default 10 000 ms).
       */
      async gracefulShutdown({ timeoutMs = 1e4 } = {}) {
        if (this._shuttingDown) return;
        this._shuttingDown = true;
        console.log(`
[${this.entityName}] \u2500\u2500 Graceful shutdown initiated \u2500\u2500`);
        try {
          await this._deregisterFromRegistry();
        } catch (_) {
        }
        const owned = this.hierarchyManager.getAllOwnedComponentEntities?.() ?? [];
        const shutdownOne = async (child) => {
          const label = child.entityName ?? "(unknown)";
          try {
            if (typeof child.gracefulShutdown === "function") {
              await child.gracefulShutdown({ timeoutMs });
            } else {
              child.dispose();
            }
            console.log(`[${this.entityName}] \u2713 '${label}' stopped.`);
          } catch (err) {
            console.error(`[${this.entityName}] \u2717 '${label}' shutdown error: ${err?.message ?? err}`);
          }
        };
        const stopManaged = async () => {
          const stopPromises = [];
          for (const [name, handle] of this._managedServices) {
            if (handle.processHandle && handle.status !== "stopped") {
              Logger.log(`[${this.entityName}] Stopping managed service '${name}' (PID: ${handle.pid})...`);
              handle.processHandle.kill("SIGTERM");
              handle.status = "stopped";
              if (handle.processHandle.promise) {
                stopPromises.push(handle.processHandle.promise.catch(() => {
                }));
              }
            }
          }
          await Promise.all(stopPromises);
        };
        await Promise.race([
          Promise.allSettled([...owned.map(shutdownOne), stopManaged()]),
          new Promise((res) => setTimeout(res, timeoutMs))
        ]);
        this._deletePortsFile();
        this.dispose();
        console.log(`[${this.entityName}] \u2500\u2500 Shutdown complete \u2500\u2500`);
        if (typeof process !== "undefined" && process.exit) {
          setTimeout(() => process.exit(0), 100);
        }
      }
      /**
       * shutdown — public alias for gracefulShutdown().
       * Enables clean consumer code: await system.shutdown()
       * No type-casting or feature detection required.
       */
      async shutdown(opts = {}) {
        return this.gracefulShutdown(opts);
      }
      // ── Endpoint Category Helpers ─────────────────────────────────────────────
      /**
       * addInternalEndpoint
       *
       * Registers a functionality accessible ONLY to services whose ports are in
       * the portRegistry (internal microservices). All external ports are forbidden.
       *
       *   policy: allow = [...portRegistry values], default = forbid_unlisted
       */
      addInternalEndpoint(config) {
        const internalPorts = Object.values(this.getRegisteredPorts());
        config.accessPolicy = {
          allow: internalPorts,
          allow_with_key: [],
          forbid: [],
          default_connection_behaviour: "forbid_unlisted"
        };
        this.addLocal(config);
      }
      /**
       * addExternalEndpoint
       *
       * Registers a functionality for external consumers.
       *   access = 'free'  → no key required  (default_connection_behaviour = allow_unlisted)
       *   access = 'keyed' → accessKey must be supplied in x-krnl-access-key header
       *                       (default_connection_behaviour = ask_key_unlisted)
       *
       * @param config    - Standard functionality config.
       * @param access    - 'free' | 'keyed'
       * @param accessKey - Required when access = 'keyed'.
       */
      addExternalEndpoint(config, access = "free", accessKey) {
        if (access === "keyed" && !accessKey) {
          throw new Error(`[${this.entityName}] addExternalEndpoint: accessKey is required for 'keyed' endpoints.`);
        }
        config.accessPolicy = {
          allow: [],
          allow_with_key: [],
          forbid: [],
          default_connection_behaviour: access === "free" ? "allow_unlisted" : "ask_key_unlisted"
        };
        if (accessKey) config.accessKey = accessKey;
        this.addLocal(config);
      }
      // ── Managed Services ──────────────────────────────────────────────────────
      /**
       * registerManagedService
       * Adds an external process configuration to the system's startup sequence.
       * Services are started in the order they are registered.
       */
      registerManagedService(config) {
        if (this._serviceConfigs.some((c) => c.name === config.name)) {
          throw new Error(`[${this.entityName}] Managed service '${config.name}' is already registered.`);
        }
        this._serviceConfigs.push(config);
      }
      /**
       * startManagedServices
       * Sequentially launches all registered external processes.
       * Assigns dynamic ports, injects them into process environment, and updates the port registry.
       */
      async startManagedServices() {
        for (const config of this._serviceConfigs) {
          if (this._managedServices.has(config.name)) continue;
          const preferred = config.env?.PORT ? parseInt(config.env.PORT) : 1e4;
          const assignedPort = await this._probeAvailablePort(preferred, "0.0.0.0");
          const env = {
            ...process.env,
            ...config.env || {},
            [config.portEnvVar || "PORT"]: assignedPort.toString()
          };
          Logger.log(`[${this.entityName}] Starting managed service '${config.name}' on port ${assignedPort}...`);
          const handle = KrnlShell.spawn(config.command, config.args || [], {
            cwd: config.cwd,
            env,
            stdio: "inherit"
          });
          const serviceHandle = {
            config,
            port: assignedPort,
            processHandle: handle,
            pid: handle.pid,
            status: "starting"
          };
          this._managedServices.set(config.name, serviceHandle);
          await this.registerPort(config.name, assignedPort);
          if (config.waitForStartup) {
            const timeout = config.startupTimeoutMs || 3e4;
            const start = Date.now();
            let ready = false;
            while (Date.now() - start < timeout) {
              ready = await new Promise((resolve) => {
                const probe = import_net3.default.connect(assignedPort, "127.0.0.1");
                probe.on("connect", () => {
                  probe.destroy();
                  resolve(true);
                });
                probe.on("error", () => {
                  resolve(false);
                });
              });
              if (ready) break;
              if (serviceHandle.status === "failed") break;
              await new Promise((r) => setTimeout(r, 500));
            }
            if (ready) {
              serviceHandle.status = "running";
              Logger.log(`[${this.entityName}] Managed service '${config.name}' is READY.`);
            } else {
              serviceHandle.status = "failed";
              Logger.error(`[${this.entityName}] Managed service '${config.name}' FAILED to start within ${timeout}ms.`);
            }
          } else {
            serviceHandle.status = "running";
          }
          handle.promise.then(({ code, signal }) => {
            if (serviceHandle.status !== "stopped") {
              serviceHandle.status = "failed";
              Logger.error(`[${this.entityName}] Managed service '${config.name}' exited unexpectedly (code: ${code}, signal: ${signal})`);
            }
          });
        }
      }
      reserveFor(serviceName = "unknown") {
        this.reservation = {
          busy: true,
          reservedBy: serviceName,
          reservedAt: Date.now()
        };
        return this.getSystemFlags();
      }
      releaseReservation(serviceName = null) {
        if (serviceName && this.reservation.reservedBy && this.reservation.reservedBy !== serviceName) {
          throw new Error(
            `[${this.entityName}] Reservation owned by ${this.reservation.reservedBy}; cannot release as ${serviceName}.`
          );
        }
        this.reservation = {
          busy: false,
          reservedBy: null,
          reservedAt: null
        };
        return this.getSystemFlags();
      }
      _assertAvailableForRemoteAccess(requester = null) {
        if (!this.reservation.busy) return;
        if (requester && requester === this.reservation.reservedBy) return;
        const by = this.reservation.reservedBy || "another service";
        throw new Error(`[${this.entityName}] Entity is busy/reserved by ${by}.`);
      }
      getManifest() {
        const apiNames = [];
        const eventsNames = [];
        const api = {};
        const serializeSchema = (schema) => {
          if (!schema) return void 0;
          try {
            return (0, import_zod_to_json_schema2.zodToJsonSchema)(schema);
          } catch (e) {
            return { type: "custom", message: "Non-Zod or complex schema" };
          }
        };
        const buildFManifest = (f, type, resolved) => {
          const fManifest = {
            id: f.id,
            type,
            method: resolved.method || "POST",
            visibility: resolved.visibility,
            sourcePath: resolved.sourcePath,
            examples: resolved.examples || f.examples || null,
            example: resolved.example || f.example || null,
            events: []
          };
          if (resolved.intelligenceSpec) {
            fManifest.intelligenceSpec = resolved.intelligenceSpec;
          }
          resolved.emitters.forEach((_, eid) => {
            const eventId = `${f.id}:${eid}`;
            fManifest.events.push(eventId);
            eventsNames.push(eventId);
          });
          if (resolved.schema) {
            fManifest.schema = {};
            if (resolved.schema.input) {
              fManifest.schema.input = serializeSchema(resolved.schema.input);
            }
            if (resolved.schema.output) {
              fManifest.schema.output = serializeSchema(resolved.schema.output);
            }
          }
          return fManifest;
        };
        this.localFunctionalities.forEach((f) => {
          api[f.id] = buildFManifest(f, "local", f);
          apiNames.push(f.id);
        });
        this.remoteFunctionalities.forEach((f) => {
          if (!api[f.id]) {
            const resolved = this.resolveLocalFunctionality(f.id);
            if (resolved) {
              api[f.id] = buildFManifest(f, "remote", resolved);
            } else {
              api[f.id] = { id: f.id, type: "remote" };
            }
            apiNames.push(f.id);
          }
        });
        return {
          entityName: this.entityName,
          systemType: this.systemType,
          flags: this.getSystemFlags(),
          telemetry: this.telemetryEnabled,
          inputs: {
            collectors: this.interface.collectorNames,
            api
          },
          outputs: {
            emitters: this.interface.emitterNames,
            events: eventsNames
          }
        };
      }
      async startDiscovery(discoveryPort = 10101, discoveryHost = "255.255.255.255") {
        if (this._isIngressNetworkMember || this._isSubApp) return;
        if (this.discoverySocket) return;
        if (!this.isDiscoveryAvailable()) {
          console.warn(`[${this.entityName}] Discovery: UDP not supported in current environment.`);
          return;
        }
        const dgram = await import("dgram").then((m) => m.default || m);
        this.discoverySocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
        this.discoverySocket.on("error", (err) => {
          console.warn(`[${this.entityName}] Discovery socket error:`, err.message);
          try {
            if (this.discoverySocket) {
              this.discoverySocket.close();
            }
          } catch (e) {
          }
          this.discoverySocket = null;
        });
        this.discoverySocket.on("message", (msg, rinfo) => {
          try {
            const data = JSON.parse(msg.toString());
            if (data.type === "KRNL_REGISTRY_RESTART" && this.commPort !== 10099) {
              console.log(`[${this.entityName}] Registry restart beacon received. Triggering immediate re-registration.`);
              this._registerWithRegistry(this.commPort).catch(() => {
              });
              return;
            }
            if (data.type === "KRNL_BEACON" && data.id !== this.entityName) {
              if (data.discoverable === false) {
                this.peers.delete(data.id);
                return;
              }
              this.peers.set(data.id, {
                id: data.id,
                name: data.id,
                address: `${rinfo.address}:${data.port}`,
                busy: Boolean(data.busy),
                reservedBy: data.reservedBy || null,
                discoverable: data.discoverable !== false,
                lastSeen: Date.now()
              });
            }
          } catch (e) {
          }
        });
        const broadcastTarget = this.host === "127.0.0.1" ? "127.0.0.1" : discoveryHost;
        const bindHost = this.host === "::" || !this.host ? "0.0.0.0" : this.host;
        try {
          this.discoverySocket.bind(discoveryPort, bindHost, () => {
            try {
              if (this.discoverySocket) {
                this.discoverySocket.setBroadcast(true);
                console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${broadcastTarget})`);
              }
            } catch (err) {
              console.warn(`[${this.entityName}] Discovery setBroadcast failed:`, err.message);
            }
          });
        } catch (err) {
          console.warn(`[${this.entityName}] Discovery bind failed:`, err.message);
          this.discoverySocket = null;
        }
        this.beaconInterval = setInterval(async () => {
          if (!this.discoverable) return;
          await this.whenReady();
          const beacon = JSON.stringify({
            type: "KRNL_BEACON",
            id: this.entityName,
            port: this.commPort,
            discoverable: this.discoverable,
            busy: this.reservation.busy,
            reservedBy: this.reservation.reservedBy
          });
          if (this.discoverySocket) {
            this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, broadcastTarget);
          }
        }, 5e3);
        if (this.commPort === 10099) {
          await this.whenReady();
          const restartBeacon = JSON.stringify({ type: "KRNL_REGISTRY_RESTART", port: 10099 });
          if (this.discoverySocket) {
            this.discoverySocket.send(restartBeacon, 0, restartBeacon.length, discoveryPort, broadcastTarget);
          }
        }
        await this._startSharedServer();
      }
      async _startSharedServer() {
        if (this._isIngressNetworkMember) return;
        if (this._sharedServer) return;
        const resolvedPort = await this._probeAvailablePort(this._preferredPort, this.host);
        this._sharedServer = import_http4.default.createServer();
        if (!this.unifiedHttpAdapter) {
          const { krnlUnifiedHttpAdapter: krnlUnifiedHttpAdapter2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_System_Unified_Http_Adapter(), K_LIB_Krnl_System_Unified_Http_Adapter_exports));
          this.unifiedHttpAdapter = new krnlUnifiedHttpAdapter2(this, resolvedPort, this.host);
        }
        await this.unifiedHttpAdapter.start(this._sharedServer);
        this.serviceSuites.set("UNIFIED_HTTP", this.unifiedHttpAdapter);
        await this.commComponent.startWsServer(this._sharedServer);
        return new Promise((resolve, reject) => {
          this._sharedServer.listen(resolvedPort, this.host, async () => {
            const bound = this._sharedServer.address().port;
            await this.finalizeCommPort(bound);
            console.log(`[${this.entityName}] Unified port active on http://${this.host}:${bound} (WS + REST + MCP + ACP)`);
            resolve();
          });
          this._sharedServer.on("error", (err) => {
            console.error(`[${this.entityName}] Failed to start unified server:`, err.message);
            reject(err);
          });
        });
      }
      async activateServiceSuite(suiteName = "UNIFIED_HTTP") {
        return this._startSharedServer();
      }
      listPeers() {
        const now = Date.now();
        for (const [id, peer] of this.peers.entries()) {
          if (now - peer.lastSeen > this.peerTtlMs) this.peers.delete(id);
        }
        return Array.from(this.peers.values()).filter((peer) => peer.discoverable !== false);
      }
      getRemoteEntity(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return null;
        return {
          call: async (fid, data) => {
            return await this.commComponent.callWsRpc(peer.address, "call", { fid, data });
          }
        };
      }
      async wire(peerId, options) {
        const peer = this.peers.get(peerId);
        if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
        if (peer.busy) throw new Error(`Peer ${peerId} is reserved by ${peer.reservedBy || "another service"}.`);
        const { localOutput, remoteInput, remoteOutput, localInput, connectionPolicy = {} } = options;
        if (localOutput && remoteInput) {
          await this.commComponent.wireViaWs(localOutput, peer.address, remoteInput, peer.name, {
            managedBy: connectionPolicy.managedBy || this.entityName,
            externallyMutable: connectionPolicy.externallyMutable !== false,
            metadata: connectionPolicy.metadata || {}
          });
        }
        if (remoteOutput && localInput) {
          await this.commComponent.callWsRpc(peer.address, "wire-output-to-me", {
            remoteOutput,
            localInput,
            myAddress: `${this.host}:${this.commPort}`,
            myName: this.entityName,
            connectionPolicy
          });
        }
      }
      _setupRpcHandlers() {
        this.commComponent.defineRpc("get-manifest", async () => {
          return this.getManifest();
        });
        this.commComponent.defineRpc("wire-output-to-me", async (params) => {
          const { remoteOutput, localInput, myAddress, myName, connectionPolicy = {} } = params;
          this._assertAvailableForRemoteAccess(myName);
          return await this.commComponent.wireViaWs(remoteOutput, myAddress, localInput, myName, {
            managedBy: connectionPolicy.managedBy || myName,
            externallyMutable: connectionPolicy.externallyMutable !== false,
            metadata: connectionPolicy.metadata || {}
          });
        });
        this.commComponent.defineRpc("call", async ({ fid, data }, { callerPort } = {}) => {
          this._assertAvailableForRemoteAccess(data?.meta?.requester || null);
          return await this.call(fid, data, { callerPort, accessKey: data?.meta?.accessKey });
        });
        this.commComponent.defineRpc("set-entity-flags", async ({ discoverable, busy, reservedBy, requester }) => {
          this._assertAvailableForRemoteAccess(requester || null);
          if (typeof discoverable === "boolean") this.setDiscoverable(discoverable);
          if (typeof busy === "boolean") {
            if (busy) this.reserveFor(reservedBy || requester || "unknown");
            else this.releaseReservation(requester || null);
          }
          return this.getSystemFlags();
        });
        this.commComponent.defineRpc("list-routes", async () => {
          return this.commComponent.listRoutes();
        });
        this.commComponent.defineRpc("disconnect-route", async ({ routeId, requester, force = false }) => {
          this._assertAvailableForRemoteAccess(requester || null);
          this.commComponent.disconnectRoute(routeId, { requester, force });
          return { ok: true, routeId };
        });
        this.commComponent.defineRpc("connect-to-target", async ({ sourceEmitter, targetAddress, targetCollector, targetName, requester, connectionPolicy = {} }) => {
          this._assertAvailableForRemoteAccess(requester || null);
          return await this.commComponent.wireViaWs(sourceEmitter, targetAddress, targetCollector, targetName, {
            managedBy: connectionPolicy.managedBy || requester || this.entityName,
            externallyMutable: connectionPolicy.externallyMutable !== false,
            metadata: connectionPolicy.metadata || {}
          });
        });
      }
      _setupBaseFunctionalities() {
        this.addLocal({
          id: "heartbeat",
          api: heartbeatApi(this),
          emitters: { status: {} }
        });
        this.addLocal({
          id: "getTelemetry",
          api: telemetryApi(this)
        });
        this.addLocal({
          id: "adminCommand",
          api: adminCommandApi(this)
        });
        this.addLocal({
          id: "discoverPeers",
          api: discoverPeersApi(this)
        });
        this.addLocal({
          id: "getManifest",
          api: getManifestApi(this)
        });
        this.addLocal({
          id: "getLastActionDocs",
          api: getLastActionDocsApi(this)
        });
        this.addLocal({
          id: "getFullDocumentation",
          api: getFullDocumentationApi(this)
        });
        this.addLocal({
          id: "getUsedPorts",
          api: getUsedPortsApi(this)
        });
        this.addLocal({
          id: "findFreePorts",
          api: findFreePortsApi(this)
        });
        this.addLocal({
          id: "shutdown",
          description: "Gracefully shut down all owned microservices then self. Responds immediately; shutdown runs async.",
          api: shutdownApi(this)
        });
        this.addLocal({
          id: "getIngressNetworkTopology",
          api: getIngressNetworkTopologyApi(this)
        });
        this.addLocal({
          id: "getEndpointDefinitions",
          description: "Aggregates and returns the full definitions of all endpoints in the system.",
          api: getEndpointDefinitionsApi(this)
        });
        this.addLocal({
          id: "setEndpointDefinition",
          description: "Sets and persists runtime config overrides for an endpoint.",
          api: setEndpointDefinitionApi(this)
        });
        this.addLocal({
          id: "getTelemetryLog",
          description: "Retrieves historical telemetry traces from the persistent store.",
          api: getTelemetryLogApi(this)
        });
        this.addLocal({
          id: "getAikoCatalog",
          description: "Retrieves the cached or live agent profiles catalog from Aiko.",
          api: getAikoCatalogApi(this)
        });
        this.addLocal({
          id: "ai",
          description: "Natural language gateway \u2014 routes to correct endpoint agent via Aiko.",
          api: aiOrchestrationApi(this)
        });
        this.addLocal({
          id: "getTaskList",
          description: "Retrieves current task list and status from the orchestrator.",
          api: getTaskListApi(this)
        });
      }
      isAikoAlive() {
        const aikoPeer = this.peers.get("Aiko");
        if (!aikoPeer) return false;
        const TTL = 35e3;
        return Date.now() - aikoPeer.lastSeen < TTL;
      }
      async initializeAiLayer(appRoot) {
        try {
          this._aiProfilesStore = new KrnlRuntimeStore(appRoot);
          await this._aiProfilesStore.load();
          Promise.resolve().then(() => (init_K_LIB_Krnl_Telemetry(), K_LIB_Krnl_Telemetry_exports)).then(({ telemetry: telemetry3 }) => {
            if (typeof telemetry3.setRuntimeStore === "function") {
              telemetry3.setRuntimeStore(this._aiProfilesStore);
            }
          }).catch(() => {
          });
          this._aikoClient = KrnlAikoClient.discover(this) || new KrnlAikoClient(10095);
          const aikoActive = this.isAikoAlive() || await this._aikoClient.isAlive();
          if (!aikoActive) {
            console.warn(`[KrnlTS AI] ${KrnlAikoClient.getNotRunningMessage()}`);
          } else {
            try {
              this._aikoCatalog = await this._aikoClient.fetchCatalog();
            } catch (e) {
              console.warn("[KrnlTS AI] Failed to fetch profile catalog from Aiko:", e);
            }
          }
          this._aiTracker = new KrnlWatchVariablesTracker();
          this._aiScheduler = new KrnlEndpointScheduler(this._aiTracker);
          const overrides = await this._aiProfilesStore.getAllEndpointDefinitions();
          const aiEndpoints = /* @__PURE__ */ new Map();
          const { buildEndpointDefinition: buildEndpointDefinition2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_System_Base_Functionality_APIs(), K_LIB_Krnl_System_Base_Functionality_APIs_exports));
          const { KrnlEpTools: KrnlEpTools2 } = await Promise.resolve().then(() => (init_K_LIB_Krnl_Ep_Tools(), K_LIB_Krnl_Ep_Tools_exports));
          for (const [fid, fn] of this.localFunctionalities.entries()) {
            if (fid === "ai" || fid === "setEndpointDefinition" || fid === "getEndpointDefinitions" || fid === "getTelemetryLog" || fid === "getAikoCatalog") continue;
            const override = overrides[fid] || null;
            const isEnabled = override?.intelligenceSpec || fn.ai?.enabled || fn.ai;
            if (!isEnabled) continue;
            const mem = await this._aiProfilesStore.getEndpointMemory(fid);
            const definition = buildEndpointDefinition2(fn, this, override, mem);
            this._aiTracker.register(fid, definition, fn);
            const mergedTools = {};
            if (definition.agentTools && Array.isArray(definition.agentTools)) {
              const addAllBuiltins = definition.agentTools.includes("*");
              if (addAllBuiltins) {
                Object.assign(mergedTools, KrnlEpTools2);
              }
              for (const toolId of definition.agentTools) {
                if (toolId === "*") continue;
                if (KrnlEpTools2[toolId]) {
                  mergedTools[toolId] = KrnlEpTools2[toolId];
                } else if (this.localFunctionalities.has(toolId) || this.remoteFunctionalities.has(toolId)) {
                  mergedTools[toolId] = {
                    id: toolId,
                    description: `Calls the sibling endpoint '${toolId}'.`,
                    execute: async (payload) => {
                      return await this.call(toolId, payload, { unwrap: true });
                    }
                  };
                }
              }
            }
            const agent = new KrnlEndpointAgent(definition, this._aikoClient, this._aiTracker, this, mergedTools);
            aiEndpoints.set(fid, agent);
          }
          const defaultRoutingSpec = {
            reasoning: 5,
            planning: 3,
            toolUsage: 1,
            structuredOutput: 5,
            jsonStrictness: 5,
            coding: 1,
            extraction: 3,
            classification: 8,
            summarization: 2,
            creativity: 1,
            determinism: 7,
            context: 4,
            vision: 1,
            multimodal: 1,
            outputComplexity: 2
          };
          const defaultEscalationSpec = {
            reasoning: 8,
            planning: 6,
            toolUsage: 2,
            structuredOutput: 8,
            jsonStrictness: 8,
            coding: 2,
            extraction: 5,
            classification: 6,
            summarization: 4,
            creativity: 2,
            determinism: 8,
            context: 6,
            vision: 2,
            multimodal: 2,
            outputComplexity: 6
          };
          const routingSpec = this._aiRoutingSpec || defaultRoutingSpec;
          const escalationSpec = this._aiEscalationSpec || defaultEscalationSpec;
          this._aiOrchestrator = new KrnlApplicationOrchestrator(
            this,
            this._aikoClient,
            this._aiTracker,
            this._aiScheduler,
            routingSpec,
            escalationSpec,
            this._aiProfilesStore
          );
          for (const [fid, agent] of aiEndpoints.entries()) {
            this._aiOrchestrator.registerAgent(fid, agent);
          }
          console.log(`[KrnlTS AI] Initialized: ${aiEndpoints.size} endpoint agents connected.`);
        } catch (e) {
          console.error("[KrnlTS AI] Failed to initialize AI Layer:", e.message);
        }
      }
      _setupBaseInterface() {
        this.interface.createEmitter("system-events");
        this.interface.createCollector("system-commands");
        this._attachCollectorHandler("system-commands", systemCommandsCollectorHandler(this));
      }
      _attachCollectorHandler(collectorName, handler) {
        const collector = this.interface.getCollector(collectorName);
        collector._directHandler = handler;
      }
      bindProcessSignals() {
        if (typeof process === "undefined" || !process.on) return;
        process.on("SIGINT", () => {
          console.log(`
[${this.entityName}] SIGINT received.`);
          this.gracefulShutdown().catch(() => process.exit(1));
        });
        process.on("SIGTERM", () => {
          console.log(`
[${this.entityName}] SIGTERM received.`);
          this.gracefulShutdown().catch(() => process.exit(1));
        });
        process.on("SIGHUP", () => {
          console.log(`[${this.entityName}] SIGHUP received. Ignoring to maintain background persistence.`);
        });
        process.on("uncaughtException", (err) => {
          Logger.error(`UNCAUGHT EXCEPTION in ${this.entityName}:`, err);
          this.gracefulShutdown({ timeoutMs: 3e3 }).catch(() => process.exit(1));
        });
        process.on("unhandledRejection", (reason) => {
          Logger.error(`UNHANDLED REJECTION in ${this.entityName}:`, reason);
          this.gracefulShutdown({ timeoutMs: 3e3 }).catch(() => process.exit(1));
        });
        process.on("exit", (code) => {
          console.log(`[${this.entityName}] Process exiting with code: ${code}`);
        });
      }
      dispose() {
        this._deletePortsFile();
        if (this.beaconInterval) clearInterval(this.beaconInterval);
        if (this.discoverySocket) this.discoverySocket.close();
        for (const [name, handle] of this._managedServices) {
          if (handle.processHandle && handle.status !== "stopped") {
            Logger.log(`[${this.entityName}] Force killing managed service '${name}' (PID: ${handle.pid})...`);
            handle.processHandle.kill("SIGKILL");
          }
        }
        this._managedServices.clear();
        for (const [name, suite] of this.serviceSuites) {
          suite.stop();
        }
        this.serviceSuites.clear();
        if (this._sharedServer) {
          this._sharedServer.close();
          this._sharedServer = null;
        }
        this.commComponent.dispose();
        super.dispose();
      }
    };
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AsyncKit: () => AsyncKit,
  CUSTOM_ERROR_CODE: () => CUSTOM_ERROR_CODE,
  CacheKit: () => CacheKit,
  DasyJS: () => DasyJS,
  FileCache: () => FileCache,
  FileLock: () => FileLock,
  GitManager: () => GitManager,
  KrnlAcpProtocol: () => KrnlAcpProtocol,
  KrnlAikoClient: () => KrnlAikoClient,
  KrnlApplicationOrchestrator: () => KrnlApplicationOrchestrator,
  KrnlBlockContainerAdapter: () => KrnlBlockContainerAdapter,
  KrnlEndpointAgent: () => KrnlEndpointAgent,
  KrnlEndpointScheduler: () => KrnlEndpointScheduler,
  KrnlEnv: () => KrnlEnv,
  KrnlFS: () => KrnlFS,
  KrnlFrontend: () => KrnlFrontend,
  KrnlFrontendAdapter: () => KrnlFrontendAdapter,
  KrnlHTTP: () => KrnlHTTP,
  KrnlIngressNetwork: () => KrnlIngressNetwork,
  KrnlMagneticLoader: () => KrnlMagneticLoader,
  KrnlMcpProtocol: () => KrnlMcpProtocol,
  KrnlNonKrnlAppAdapter: () => KrnlNonKrnlAppAdapter,
  KrnlPlannerAgent: () => KrnlPlannerAgent,
  KrnlPolicy: () => KrnlPolicy,
  KrnlRegistryClient: () => KrnlRegistryClient,
  KrnlRuntimeStore: () => KrnlRuntimeStore,
  KrnlShell: () => KrnlShell,
  KrnlTaskList: () => KrnlTaskList,
  KrnlTaskRunner: () => KrnlTaskRunner,
  KrnlWatchVariablesTracker: () => KrnlWatchVariablesTracker,
  LRUCache: () => LRUCache,
  Logger: () => Logger,
  MemoryTransportAdapter: () => MemoryTransportAdapter,
  ObjectKit: () => ObjectKit,
  PocerBlock: () => PocerBlock,
  StringKit: () => StringKit,
  TTLCache: () => TTLCache,
  WebSocketTransportAdapter: () => WebSocketTransportAdapter,
  buildEntityIntention: () => buildEntityIntention,
  createEnum: () => createEnum,
  defaultConnectionBehaviour: () => defaultConnectionBehaviour,
  krnlBackendVisualEntityBase: () => krnlBackendVisualEntityBase,
  krnlCollector: () => krnlCollector,
  krnlData: () => krnlData,
  krnlDataFactory: () => krnlDataFactory,
  krnlEmitter: () => krnlEmitter,
  krnlEntityBase: () => krnlEntityBase,
  krnlEntityCompositionalHierarchyManager: () => krnlEntityCompositionalHierarchyManager,
  krnlError: () => krnlError,
  krnlErrorCodes: () => krnlErrorCodes,
  krnlErrorMessages: () => krnlErrorMessages,
  krnlGlobalEmitterAddress: () => krnlGlobalEmitterAddress,
  krnlInterface: () => krnlInterface,
  krnlLocalEmitterAddress: () => krnlLocalEmitterAddress,
  krnlLocalFunctionality: () => krnlLocalFunctionality,
  krnlMessage: () => krnlMessage,
  krnlNetworkOrchestratorEntityBase: () => krnlNetworkOrchestratorEntityBase,
  krnlPrimitiveDataTypes: () => krnlPrimitiveDataTypes,
  krnlProto: () => krnl,
  krnlRemoteFunctionality: () => krnlRemoteFunctionality,
  krnlServiceSuitePorts: () => krnlServiceSuitePorts,
  krnlServiceSuites: () => krnlServiceSuites,
  krnlSubSystemOrchestratorBase: () => krnlSubSystemOrchestratorBase,
  krnlSystemCommComponent: () => krnlSystemCommComponent,
  krnlSystemEntityBase: () => krnlSystemEntityBase,
  krnlSystemTypes: () => krnlSystemTypes,
  krnlTransportAdapter: () => krnlTransportAdapter,
  krnlUnifiedHttpAdapter: () => krnlUnifiedHttpAdapter,
  magneticStorage: () => magneticStorage,
  subappLocalStorage: () => subappLocalStorage,
  telemetry: () => telemetry
});
module.exports = __toCommonJS(index_exports);

// src/krnl/core/index.ts
init_K_ENT_Krnl_Entity_Base();

// src/krnl/core/K_ENT_Krnl_Sub_System_Orchestrator_Base.ts
init_K_ENT_Krnl_Entity_Base();
var krnlSubSystemOrchestratorBase = class extends krnlEntityBase {
  constructor(name, owner) {
    if (!owner) {
      throw new Error("A sub-system orchestrator must be owned by a parent entity.");
    }
    super(name, owner);
    this.systemType = "SubSystemOrchestrator";
  }
};

// src/krnl/core/index.ts
init_K_ENT_Krnl_System_Entity_Base();

// src/krnl/core/K_ENT_Krnl_Network_Orchestrator_Entity_Base.ts
init_K_ENT_Krnl_System_Entity_Base();
var krnlNetworkOrchestratorEntityBase = class extends krnlSystemEntityBase {
  constructor(name = "KrnlNetworkOrchestrator", owner = null, commPort = 10110, host = "0.0.0.0") {
    super(name, owner, commPort, host);
    this.systemType = "NetworkOrchestrator";
  }
  async getPeerManifest(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    return await this.commComponent.callWsRpc(peer.address, "get-manifest", {});
  }
  async listPeerRoutes(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    return await this.commComponent.callWsRpc(peer.address, "list-routes", {});
  }
  /**
   * Connects source system emitter -> target system collector.
   */
  async connectSystems(sourcePeerId, targetPeerId, options) {
    const source = this.peers.get(sourcePeerId);
    const target = this.peers.get(targetPeerId);
    if (!source) throw new Error(`Source peer ${sourcePeerId} not discovered.`);
    if (!target) throw new Error(`Target peer ${targetPeerId} not discovered.`);
    if (source.busy && source.reservedBy !== this.entityName) {
      throw new Error(`Source peer ${sourcePeerId} is reserved by ${source.reservedBy || "another service"}.`);
    }
    if (target.busy && target.reservedBy !== this.entityName) {
      throw new Error(`Target peer ${targetPeerId} is reserved by ${target.reservedBy || "another service"}.`);
    }
    const {
      sourceEmitter,
      targetCollector,
      externallyMutable = true,
      metadata = {}
    } = options;
    return await this.commComponent.callWsRpc(source.address, "connect-to-target", {
      sourceEmitter,
      targetAddress: target.address,
      targetCollector,
      targetName: target.name,
      requester: this.entityName,
      connectionPolicy: {
        managedBy: this.entityName,
        externallyMutable,
        metadata
      }
    });
  }
  async disconnectPeerRoute(peerId, routeId, options = {}) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    const { force = false } = options;
    return await this.commComponent.callWsRpc(peer.address, "disconnect-route", {
      routeId,
      force,
      requester: this.entityName
    });
  }
};

// src/krnl/core/index.ts
init_K_LIB_Krnl_Base_Concepts();
init_K_LIB_Krnl_Entity_Compositional_Hierarchy();
init_K_LIB_Krnl_Error_Concepts();
init_K_LIB_Krnl_Messaging_Concepts();
init_K_LIB_Krnl_System_Comm_Component();
init_K_LIB_Krnl_Functionality_Types();
init_K_LIB_Krnl_System_Unified_Http_Adapter();
init_K_LIB_Krnl_Protocol_MCP();
init_K_LIB_Krnl_Protocol_ACP();
init_K_LIB_Krnl_System_Ingress_Network();
init_K_LIB_Krnl_System_Magnetic_Loader();
init_K_LIB_Krnl_System_App_Adapter();
init_K_LIB_Krnl_System_Frontend();
init_K_LIB_Krnl_System_Frontend_Adapter();

// src/krnl/core/K_LIB_Krnl_Block_Container_Adapter.ts
var import_fs12 = __toESM(require("fs"), 1);
var import_path12 = __toESM(require("path"), 1);
init_K_LIB_Krnl_System_Frontend_Adapter();
var KrnlBlockContainerAdapter = class extends KrnlFrontendAdapter {
  blocksDir;
  discoveredBlocks = /* @__PURE__ */ new Map();
  blockWatcher = null;
  constructor(name, containerRoot, options = {}) {
    const appPath = import_fs12.default.existsSync(import_path12.default.join(containerRoot, "app")) ? import_path12.default.join(containerRoot, "app") : containerRoot;
    super(name, appPath, options);
    this.blocksDir = import_path12.default.join(containerRoot, "nextjs-blocks");
    const parentHandleRequest = this.unifiedHttpAdapter._handleRequest.bind(this.unifiedHttpAdapter);
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;
      if (pathname === "/api/blocks" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(this.getBlocksManifest()));
        return;
      }
      if (pathname.startsWith("/api/blocks/") && req.method === "GET") {
        const parts = pathname.split("/");
        const blockId = parts[3];
        const block = this.discoveredBlocks.get(blockId);
        if (!block) {
          res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ status: "error", message: `Block ${blockId} not found` }));
          return;
        }
        if (parts[4] === "routes") {
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(block.routes));
          return;
        }
        if (parts[4] === "apis") {
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(block.apis));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(block));
        return;
      }
      if (pathname === "/api/routes" && req.method === "GET") {
        const allRoutes = this.getBlocksManifest().flatMap((b) => b.routes.map((r) => ({ ...r, blockId: b.id })));
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(allRoutes));
        return;
      }
      if (pathname === "/api/apis" && req.method === "GET") {
        const allApis = this.getBlocksManifest().flatMap((b) => b.apis.map((a) => ({ ...a, blockId: b.id })));
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(allApis));
        return;
      }
      if (pathname === "/api/manifests" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({
          containerName: this.entityName,
          blocks: this.getBlocksManifest()
        }));
        return;
      }
      await parentHandleRequest(req, res);
    };
  }
  async startApp() {
    await this.loadBlocks();
    this.setupBlockWatcher();
    await super.startApp();
  }
  async loadBlocks() {
    if (!import_fs12.default.existsSync(this.blocksDir)) {
      import_fs12.default.mkdirSync(this.blocksDir, { recursive: true });
    }
    const entries = import_fs12.default.readdirSync(this.blocksDir, { withFileTypes: true });
    const newDiscovered = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const blockId = entry.name;
        const blockPath = import_path12.default.join(this.blocksDir, blockId);
        try {
          const desc = await this.scanBlock(blockId, blockPath);
          newDiscovered.set(blockId, desc);
        } catch (err) {
          console.error(`[KrnlBlockContainerAdapter:${this.entityName}] Failed to scan block ${blockId}:`, err.message);
        }
      }
    }
    this.discoveredBlocks = newDiscovered;
    console.log(`[KrnlBlockContainerAdapter:${this.entityName}] Discovered ${this.discoveredBlocks.size} blocks.`);
  }
  setupBlockWatcher() {
    if (this.options.mode === "prod") return;
    try {
      this.blockWatcher = import_fs12.default.watch(this.blocksDir, { recursive: false }, () => {
        this.loadBlocks().catch(console.error);
      });
    } catch (err) {
      console.warn(`[KrnlBlockContainerAdapter:${this.entityName}] Failed to start block directory watcher:`, err.message);
    }
  }
  async scanBlock(blockId, blockPath) {
    let name = blockId;
    let version = "1.0.0";
    const pkgPath = import_path12.default.join(blockPath, "package.json");
    if (import_fs12.default.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(import_fs12.default.readFileSync(pkgPath, "utf8"));
        name = pkg.displayName || pkg.name || blockId;
        version = pkg.version || "1.0.0";
      } catch (_) {
      }
    }
    const blockTsPath = import_path12.default.join(blockPath, "block.ts");
    const blockJsPath = import_path12.default.join(blockPath, "block.js");
    if (import_fs12.default.existsSync(blockTsPath) || import_fs12.default.existsSync(blockJsPath)) {
      try {
        const imported = await (import_fs12.default.existsSync(blockTsPath) ? import(blockTsPath) : import(blockJsPath));
        if (imported.block) {
          name = imported.block.name || name;
          version = imported.block.version || version;
        }
      } catch (_) {
      }
    }
    const routes = [];
    const apis = [];
    const pagesDir = import_path12.default.join(blockPath, "pages");
    const appDir = import_path12.default.join(blockPath, "app");
    if (import_fs12.default.existsSync(pagesDir)) {
      this._findPagesRoutesRecursive(pagesDir, pagesDir, routes, apis);
    }
    if (import_fs12.default.existsSync(appDir)) {
      this._findAppRoutesRecursive(appDir, appDir, routes, apis);
    }
    return {
      id: blockId,
      name,
      version,
      routes,
      apis
    };
  }
  _findPagesRoutesRecursive(dir, baseDir, routes, apis) {
    const files = import_fs12.default.readdirSync(dir);
    for (const file of files) {
      const fullPath = import_path12.default.join(dir, file);
      const stat = import_fs12.default.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findPagesRoutesRecursive(fullPath, baseDir, routes, apis);
      } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
        const rel = import_path12.default.relative(baseDir, fullPath);
        const withoutExt = rel.substring(0, rel.lastIndexOf("."));
        const routePath = withoutExt.replace(/\\/g, "/");
        if (file.startsWith("_app.") || file.startsWith("_document.") || file.startsWith("_error.")) {
          continue;
        }
        if (routePath.startsWith("api/")) {
          apis.push({
            path: `/${routePath}`,
            methods: ["GET", "POST", "PUT", "DELETE"]
          });
          routes.push({
            path: `/${routePath}`,
            type: "api"
          });
        } else {
          routes.push({
            path: routePath === "index" ? "/" : `/${routePath}`,
            type: "page"
          });
        }
      }
    }
  }
  _findAppRoutesRecursive(dir, baseDir, routes, apis) {
    const files = import_fs12.default.readdirSync(dir);
    for (const file of files) {
      const fullPath = import_path12.default.join(dir, file);
      const stat = import_fs12.default.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findAppRoutesRecursive(fullPath, baseDir, routes, apis);
      } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
        const isRouteFile = file === "route.ts" || file === "route.js";
        const isPageFile = file === "page.tsx" || file === "page.ts" || file === "page.js";
        const isLayoutFile = file === "layout.tsx" || file === "layout.ts" || file === "layout.js";
        if (isRouteFile || isPageFile || isLayoutFile) {
          const dirIndex = dir.indexOf("app");
          let routePath = dir.substring(dirIndex + 3).replace(/\\/g, "/");
          if (!routePath.startsWith("/")) {
            routePath = "/" + routePath;
          }
          if (routePath === "") routePath = "/";
          if (isRouteFile) {
            apis.push({
              path: routePath,
              methods: ["GET", "POST", "PUT", "DELETE"]
            });
            routes.push({
              path: routePath,
              type: "api"
            });
          } else if (isPageFile) {
            routes.push({
              path: routePath,
              type: "page"
            });
          } else if (isLayoutFile) {
            routes.push({
              path: routePath,
              type: "layout"
            });
          }
        }
      }
    }
  }
  getBlocksManifest() {
    return Array.from(this.discoveredBlocks.values());
  }
  dispose() {
    if (this.blockWatcher) {
      this.blockWatcher.close();
      this.blockWatcher = null;
    }
    super.dispose();
  }
};

// src/krnl/core/index.ts
init_K_LIB_Krnl_Registry_Client();
init_K_LIB_Krnl_Telemetry();

// src/krnl/core/K_LIB_Krnl_Intention_Types.ts
function buildEntityIntention(entity) {
  const functionalities = [];
  if (entity.localFunctionalities) {
    for (const func of entity.localFunctionalities.values()) {
      if (func.intention) {
        functionalities.push(func.intention);
      }
    }
  }
  const componentEntities = [];
  if (entity.hierarchyManager && entity.hierarchyManager.ownedComponents) {
    for (const child of entity.hierarchyManager.ownedComponents.values()) {
      componentEntities.push(buildEntityIntention(child));
    }
  }
  return {
    purpose: entity.intention?.purpose || entity.description || "",
    functionalities,
    componentEntities
  };
}

// src/krnl/core/index.ts
init_K_LIB_Krnl_Aiko_Client();
init_K_LIB_Krnl_Watch_Variables_Tracker();
init_K_LIB_Krnl_Endpoint_Scheduler();
init_K_LIB_Krnl_Endpoint_Agent();
init_K_LIB_Krnl_Application_Orchestrator();
init_K_LIB_Krnl_Runtime_Store();
init_K_LIB_Krnl_Task_Runner();
init_K_LIB_Krnl_Planner_Agent();
init_krnl_pb();

// src/krnl/extensions/K_ENT_Krnl_Backend_Visual_Entity_Base.js
init_K_ENT_Krnl_Entity_Base();

// src/krnl/extensions/K_LIB_Krnl_Backend_Visual_Functionality_APIs.js
function setBrndaComponentApi(entity) {
  return (config = {}) => {
    entity.brndaConfig = { ...entity.brndaConfig, ...config };
    console.log(`[${entity.entityName}] Brnda config updated:`, entity.brndaConfig);
    return entity.brndaConfig;
  };
}
function setWeprComponentApi(entity) {
  return (config = {}) => {
    entity.weprConfig = { ...entity.weprConfig, ...config };
    console.log(`[${entity.entityName}] Wepr config updated:`, entity.weprConfig);
    return entity.weprConfig;
  };
}
function setVisualCoreApi(entity) {
  return (patch = {}) => {
    entity.visualCore = {
      ...entity.visualCore,
      ...patch,
      position: { ...entity.visualCore.position, ...patch.position },
      rotation: { ...entity.visualCore.rotation, ...patch.rotation },
      scale: { ...entity.visualCore.scale, ...patch.scale }
    };
    return entity.visualCore;
  };
}
function getVisualSnapshotApi(entity) {
  return () => entity.visualCore;
}
function syncAllFrontendsApi(entity) {
  return async () => {
    console.log(`[${entity.entityName}] Syncing all frontends...`);
    return { status: "synced", timestamp: Date.now() };
  };
}

// src/krnl/extensions/K_ENT_Krnl_Backend_Visual_Entity_Base.js
var krnlBackendVisualEntityBase = class extends krnlEntityBase {
  constructor(name, owner = null) {
    super(name, owner);
    this.visualCore = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      color: "#ffffff"
    };
    this._setupVisualFunctionalities();
  }
  _setupVisualFunctionalities() {
    this.addLocal({
      id: "setBrndaComponent",
      api: setBrndaComponentApi(this)
    });
    this.addLocal({
      id: "setWeprComponent",
      api: setWeprComponentApi(this)
    });
    this.addLocal({
      id: "setVisualCore",
      api: setVisualCoreApi(this)
    });
    this.addLocal({
      id: "getVisualSnapshot",
      api: getVisualSnapshotApi(this)
    });
    this.addLocal({
      id: "syncAllFrontends",
      api: syncAllFrontendsApi(this)
    });
  }
  getVisualSnapshot() {
    return { ...this.visualCore };
  }
};

// src/krnl/extensions/K_LIB_Dasy_JS.js
var DasyJS = class {
  constructor(rootName = "dasy-root") {
    this.rootName = rootName;
    this.rootDir = null;
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INITIALIZATION AND PATH RESOLUTION ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**
   * Initializes the file system access.
   */
  async init() {
    const storageRoot = await navigator.storage.getDirectory();
    this.rootDir = await storageRoot.getDirectoryHandle(this.rootName, {
      create: true
    });
  }
  /**
   * Resolves a user path into normalized parts.
   * @param {string} userPath 
   * @returns {string[]}
   */
  resolve(userPath) {
    const trimmed = (userPath || "").trim();
    if (!trimmed) throw new Error("invalid path");
    const relative = trimmed.replace(/^\/+/, "");
    const normalized = relative.replace(/\\/g, "/");
    if (normalized.includes("..")) {
      throw new Error("invalid path");
    }
    return normalized.split("/").filter(Boolean);
  }
  /**
   * Internal helper to get a file handle.
   */
  async getFileHandle(pathParts, create = false) {
    let current = this.rootDir;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = await current.getDirectoryHandle(pathParts[i], { create });
    }
    return current.getFileHandle(pathParts.at(-1), { create });
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// FILE OPERATIONS //////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  async createFile(filePath) {
    const parts = this.resolve(filePath);
    await this.getFileHandle(parts, true);
  }
  async deleteFile(filePath) {
    const parts = this.resolve(filePath);
    let current = this.rootDir;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    try {
      await current.removeEntry(parts.at(-1));
    } catch (err) {
      if (err.name !== "NotFoundError") throw err;
    }
  }
  async duplicateFile(source, destination) {
    const data = await this.readBytes(source);
    await this.writeBytes(destination, data);
  }
  async writeText(filePath, data) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts, true);
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
  async readText(filePath) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts);
    const file = await handle.getFile();
    return file.text();
  }
  async writeBytes(filePath, data) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts, true);
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
  async readBytes(filePath) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts);
    const file = await handle.getFile();
    return file.arrayBuffer();
  }
};

// src/index.ts
init_tools();
init_K_ENT_Krnl_Entity_Base();
init_K_ENT_Krnl_System_Entity_Base();

// src/krnl/core/K_LIB_Pocer_Block.ts
var import_node_http = __toESM(require("http"), 1);
var import_node_net = __toESM(require("net"), 1);
var import_node_child_process = require("child_process");
var import_node_util = require("util");
var import_node_fs = __toESM(require("fs"), 1);
var import_node_path = __toESM(require("path"), 1);
init_K_ENT_Krnl_System_Entity_Base();
var execAsync = (0, import_node_util.promisify)(import_node_child_process.exec);
var PocerBlock = class extends krnlSystemEntityBase {
  blockConfig;
  _containerReady = false;
  _startedByUs = false;
  _dockerProvider = null;
  constructor(name, blockConfig) {
    super(name, null, -1, "127.0.0.1", { Singleton: true, _skipMagneticLoading: true });
    this.blockConfig = blockConfig;
    this._isIngressNetworkMember = true;
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      await this.proxyRequest(req, res, req.url || "/");
    };
  }
  async startApp() {
    const { containerName, image, hostPort, containerPort, environment } = this.blockConfig;
    console.log(`[PocerBlock:${this.entityName}] Booting container '${containerName}'...`);
    await this.ensureDockerEngine();
    await this.loadLocalImageArchive(image);
    const isAlreadyRunning = await this._isContainerRunning(containerName);
    if (isAlreadyRunning) {
      console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' is already running.`);
    } else {
      const exists = await this._containerExists(containerName);
      if (exists) {
        console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' exists but is stopped. Starting...`);
        await execAsync(`docker start ${containerName}`);
      } else {
        console.log(`[PocerBlock:${this.entityName}] Creating and starting container '${containerName}'...`);
        const envArgs = Object.entries(environment ?? {}).map(([k, v]) => `-e "${k}=${v}"`).join(" ");
        const cmd = [
          "docker run -d",
          `--name ${containerName}`,
          `-p ${hostPort}:${containerPort}`,
          envArgs,
          image
        ].filter(Boolean).join(" ");
        await execAsync(cmd);
      }
    }
    await this._waitForPort(hostPort, 2e4);
    this._containerReady = true;
    console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' is ready on host port ${hostPort}.`);
  }
  async proxyRequest(req, res, subPath) {
    if (!this._containerReady || this.blockConfig.hostPort === -1) {
      res.writeHead(533, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `[PocerBlock:${this.entityName}] Container not ready.` }));
      return;
    }
    const options = {
      hostname: "127.0.0.1",
      port: this.blockConfig.hostPort,
      path: subPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${this.blockConfig.hostPort}`
      }
    };
    const proxyReq = import_node_http.default.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `[PocerBlock:${this.entityName}] Bad Gateway: ${err.message}` }));
    });
    req.pipe(proxyReq, { end: true });
  }
  getManifest() {
    const base = super.getManifest();
    return {
      ...base,
      pocerBlock: {
        image: this.blockConfig.image,
        containerName: this.blockConfig.containerName,
        hostPort: this.blockConfig.hostPort,
        containerPort: this.blockConfig.containerPort,
        protocol: this.blockConfig.protocol,
        ready: this._containerReady
      }
    };
  }
  dispose() {
    if (this.blockConfig.stopOnDispose) {
      try {
        console.log(`[PocerBlock:${this.entityName}] Stopping container '${this.blockConfig.containerName}'...`);
        (0, import_node_child_process.execSync)(`docker stop ${this.blockConfig.containerName}`, { stdio: "ignore" });
      } catch (_) {
      }
    }
    if (this._startedByUs) {
      try {
        if (this._dockerProvider === "colima") {
          console.log(`[PocerBlock:${this.entityName}] Stopping block-initiated Colima VM...`);
          (0, import_node_child_process.execSync)("colima stop", { stdio: "ignore" });
        } else if (this._dockerProvider === "docker-desktop") {
          console.log(`[PocerBlock:${this.entityName}] Stopping block-initiated Docker Desktop...`);
          (0, import_node_child_process.execSync)(`osascript -e 'quit app "Docker"'`, { stdio: "ignore" });
        }
      } catch (_) {
      }
    }
    super.dispose();
  }
  // ─── Self-Containing Infrastructure (VM & Docker Engine Setup) ─────────────
  async ensureDockerEngine() {
    try {
      await execAsync("docker ps");
      return;
    } catch (_) {
    }
    console.log(`[PocerBlock:${this.entityName}] Docker not running. Attempting to start virtualization engine...`);
    const colimaPath = await this._locateBinary("colima");
    if (colimaPath) {
      console.log(`[PocerBlock:${this.entityName}] Found Colima binary. Starting VM...`);
      const proc = (0, import_node_child_process.spawn)("colima", ["start", "--runtime", "docker"], { stdio: "ignore", detached: true });
      proc.unref();
      this._dockerProvider = "colima";
      this._startedByUs = true;
    } else {
      console.log(`[PocerBlock:${this.entityName}] Colima not found. Attempting to launch Docker Desktop...`);
      const proc = (0, import_node_child_process.spawn)("open", ["-g", "-a", "Docker"], { stdio: "ignore", detached: true });
      proc.unref();
      this._dockerProvider = "docker-desktop";
      this._startedByUs = true;
    }
    const deadline = Date.now() + 6e4;
    while (Date.now() < deadline) {
      try {
        const { stdout } = await execAsync("docker ps");
        if (stdout.includes("CONTAINER ID")) {
          console.log(`[PocerBlock:${this.entityName}] Virtualization engine online.`);
          return;
        }
      } catch (_) {
      }
      await new Promise((r) => setTimeout(r, 2e3));
    }
    throw new Error(`[PocerBlock:${this.entityName}] Failed to start or connect to virtualization engine.`);
  }
  async loadLocalImageArchive(image) {
    const localImagesDir = import_node_path.default.join(process.cwd(), "subapps", this.entityName, "images");
    const safeImageName = image.replace(/[^a-zA-Z0-9]/g, "_");
    const archivePath = import_node_path.default.join(localImagesDir, `${safeImageName}.tar`);
    if (import_node_fs.default.existsSync(archivePath)) {
      try {
        const { stdout } = await execAsync(`docker images -q ${image}`);
        if (stdout.trim().length > 0) {
          console.log(`[PocerBlock:${this.entityName}] Image '${image}' already cached in Docker daemon.`);
          return;
        }
      } catch (_) {
      }
      console.log(`[PocerBlock:${this.entityName}] Loading image archive from local block repository: ${archivePath}`);
      await execAsync(`docker load -i "${archivePath}"`);
    } else {
      console.log(`[PocerBlock:${this.entityName}] No local image archive found at: ${archivePath}. Pulling from remote registry...`);
      await execAsync(`docker pull ${image}`);
    }
  }
  // ─── Private Helpers ───────────────────────────────────────────────────────
  async _locateBinary(name) {
    try {
      const { stdout } = await execAsync(`which ${name}`);
      return stdout.trim();
    } catch {
      return null;
    }
  }
  async _isContainerRunning(name) {
    try {
      const { stdout } = await execAsync(`docker inspect --format "{{.State.Running}}" ${name} 2>/dev/null`);
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  }
  async _containerExists(name) {
    try {
      await execAsync(`docker inspect --format "{{.State.Status}}" ${name} 2>/dev/null`);
      return true;
    } catch {
      return false;
    }
  }
  async _waitForPort(port, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const open = await new Promise((resolve) => {
        const socket = import_node_net.default.connect(port, "127.0.0.1");
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("error", () => resolve(false));
      });
      if (open) return;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`[PocerBlock:${this.entityName}] Timed out waiting for container port ${port} after ${timeoutMs}ms.`);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AsyncKit,
  CUSTOM_ERROR_CODE,
  CacheKit,
  DasyJS,
  FileCache,
  FileLock,
  GitManager,
  KrnlAcpProtocol,
  KrnlAikoClient,
  KrnlApplicationOrchestrator,
  KrnlBlockContainerAdapter,
  KrnlEndpointAgent,
  KrnlEndpointScheduler,
  KrnlEnv,
  KrnlFS,
  KrnlFrontend,
  KrnlFrontendAdapter,
  KrnlHTTP,
  KrnlIngressNetwork,
  KrnlMagneticLoader,
  KrnlMcpProtocol,
  KrnlNonKrnlAppAdapter,
  KrnlPlannerAgent,
  KrnlPolicy,
  KrnlRegistryClient,
  KrnlRuntimeStore,
  KrnlShell,
  KrnlTaskList,
  KrnlTaskRunner,
  KrnlWatchVariablesTracker,
  LRUCache,
  Logger,
  MemoryTransportAdapter,
  ObjectKit,
  PocerBlock,
  StringKit,
  TTLCache,
  WebSocketTransportAdapter,
  buildEntityIntention,
  createEnum,
  defaultConnectionBehaviour,
  krnlBackendVisualEntityBase,
  krnlCollector,
  krnlData,
  krnlDataFactory,
  krnlEmitter,
  krnlEntityBase,
  krnlEntityCompositionalHierarchyManager,
  krnlError,
  krnlErrorCodes,
  krnlErrorMessages,
  krnlGlobalEmitterAddress,
  krnlInterface,
  krnlLocalEmitterAddress,
  krnlLocalFunctionality,
  krnlMessage,
  krnlNetworkOrchestratorEntityBase,
  krnlPrimitiveDataTypes,
  krnlProto,
  krnlRemoteFunctionality,
  krnlServiceSuitePorts,
  krnlServiceSuites,
  krnlSubSystemOrchestratorBase,
  krnlSystemCommComponent,
  krnlSystemEntityBase,
  krnlSystemTypes,
  krnlTransportAdapter,
  krnlUnifiedHttpAdapter,
  magneticStorage,
  subappLocalStorage,
  telemetry
});
