"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AsyncKit: () => AsyncKit,
  CacheKit: () => CacheKit,
  DasyJS: () => DasyJS,
  FileCache: () => FileCache,
  FileLock: () => FileLock,
  GitManager: () => GitManager,
  KrnlAcpProtocol: () => KrnlAcpProtocol,
  KrnlEnv: () => KrnlEnv,
  KrnlFS: () => KrnlFS,
  KrnlHTTP: () => KrnlHTTP,
  KrnlMcpProtocol: () => KrnlMcpProtocol,
  KrnlPolicy: () => KrnlPolicy,
  KrnlResult: () => KrnlResult,
  KrnlShell: () => KrnlShell,
  LRUCache: () => LRUCache,
  Logger: () => Logger,
  MemoryTransportAdapter: () => MemoryTransportAdapter,
  ObjectKit: () => ObjectKit,
  StringKit: () => StringKit,
  TTLCache: () => TTLCache,
  WebSocketTransportAdapter: () => WebSocketTransportAdapter,
  createEnum: () => createEnum,
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
  krnlMessageStream: () => krnlMessageStream,
  krnlNetworkOrchestratorEntityBase: () => krnlNetworkOrchestratorEntityBase,
  krnlPrimitiveDataTypes: () => krnlPrimitiveDataTypes,
  krnlRemoteFunctionality: () => krnlRemoteFunctionality,
  krnlServiceSuitePorts: () => krnlServiceSuitePorts,
  krnlServiceSuites: () => krnlServiceSuites,
  krnlSubSystemOrchestratorBase: () => krnlSubSystemOrchestratorBase,
  krnlSystemCommComponent: () => krnlSystemCommComponent,
  krnlSystemEntityBase: () => krnlSystemEntityBase,
  krnlSystemTypes: () => krnlSystemTypes,
  krnlTransportAdapter: () => krnlTransportAdapter,
  krnlUnifiedHttpAdapter: () => krnlUnifiedHttpAdapter,
  telemetry: () => telemetry
});
module.exports = __toCommonJS(index_exports);

// src/krnl/core/K_LIB_Krnl_Error_Concepts.ts
var krnlErrorCodes = Object.freeze({
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
  ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504
});
var krnlErrorMessages = Object.freeze({
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
  [krnlErrorCodes.ERR_COM_INGRESS_ROUTE_NOT_FOUND]: "ERR_COM_INGRESS_ROUTE_NOT_FOUND"
});
var krnlError = class extends Error {
  code;
  errorMessage;
  constructor(code) {
    const isNumeric = typeof code === "number";
    const numericCode = isNumeric ? code : -1;
    const message = isNumeric ? krnlErrorMessages[numericCode] ?? `Error: ${code}` : code;
    super(message);
    this.code = numericCode;
    this.errorMessage = this.message;
  }
};

// src/krnl/core/K_LIB_Krnl_Messaging_Concepts.ts
var krnlGlobalEmitterAddress = class {
  systemID = 0;
  // ["qwnsr", "brnda", "symba", "mosy"]
  subSystemID = 0;
  // ["qwnsrControl", "qwnsrBlocks"]
  entityAddress = [];
  // nesting of type
  emitterID = 0;
};
var krnlLocalEmitterAddress = class {
  isOwnerEntity = true;
  siblingID = 0;
  emitterID = 0;
};
var krnlMessage = class {
  data = null;
  time = { day: 0, hour: 0, minute: 0, seconds: 0, millisecond: 0 };
  // Tracing metadata aligned with core lingo
  sourceEmitterAddress = null;
  targetCollectorAddress = null;
  traceCorrelationId = null;
  originSystemAddress = null;
};
var krnlMessageStream = class {
  #queue = [];
  #waiters = [];
  push(message) {
    if (this.#waiters.length > 0) {
      const resolve = this.#waiters.shift();
      if (resolve) resolve(message);
    } else {
      this.#queue.push(message);
    }
  }
  async next() {
    if (this.#queue.length > 0) {
      return this.#queue.shift();
    }
    return new Promise((resolve) => this.#waiters.push(resolve));
  }
  async *[Symbol.asyncIterator]() {
    while (true) {
      yield await this.next();
    }
  }
};
var krnlEmitter = class {
  stream;
  subscribers;
  localAddress;
  constructor() {
    this.stream = new krnlMessageStream();
    this.subscribers = [];
    this.localAddress = null;
  }
  /**
   * Pushes data into the emitter's stream and notifies all subscribers.
   */
  pushDataStreamToEmitter(data, time = {}, transform = (msg) => msg) {
    const msg = new krnlMessage();
    msg.data = data;
    Object.assign(msg.time, time);
    const transformed = transform(msg);
    this.stream.push(transformed);
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
   * Resets the stream and removes all subscribers.
   */
  disconnectEmitter() {
    this.stream = new krnlMessageStream();
    this.subscribers = [];
  }
};
var krnlCollector = class {
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
var krnlInterface = class {
  ownerEntity;
  emitters;
  collectors;
  emitterNames;
  collectorNames;
  constructor(ownerEntity) {
    this.ownerEntity = ownerEntity;
    this.emitters = [];
    this.collectors = [];
    this.emitterNames = [];
    this.collectorNames = [];
  }
  /**
   * Creates and registers a new emitter.
   */
  createEmitter(name) {
    const emitter = new krnlEmitter();
    this.emitters.push(emitter);
    this.emitterNames.push(name);
    emitter.localAddress = {
      isOwnerEntity: false,
      siblingID: 0,
      emitterID: this.emitters.length - 1
    };
    return emitter;
  }
  /**
   * Creates and registers a new collector.
   */
  createCollector(name) {
    const collector = new krnlCollector();
    this.collectors.push(collector);
    this.collectorNames.push(name);
    return collector;
  }
  /**
   * Gets an emitter by name.
   */
  getEmitter(name) {
    for (let i = 0; i < this.emitterNames.length; i++) {
      if (this.emitterNames[i] === name) return this.emitters[i];
    }
    throw new krnlError(krnlErrorCodes.EMITTER_NOT_FOUND);
  }
  /**
   * Gets a collector by name.
   */
  getCollector(name) {
    for (let i = 0; i < this.collectorNames.length; i++) {
      if (this.collectorNames[i] === name) return this.collectors[i];
    }
    throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_FOUND);
  }
  /**
   * Removes an emitter by name.
   */
  removeEmitter(name) {
    const idx = this.emitterNames.indexOf(name);
    if (idx >= 0) {
      this.emitters[idx].disconnectEmitter();
      this.emitters.splice(idx, 1);
      this.emitterNames.splice(idx, 1);
    }
  }
  /**
   * Removes a collector by name.
   */
  removeCollector(name) {
    const idx = this.collectorNames.indexOf(name);
    if (idx >= 0) {
      this.collectors[idx].disconnectCollector();
      this.collectors.splice(idx, 1);
      this.collectorNames.splice(idx, 1);
    }
  }
  /**
   * Gets all emitters in scope (self + owner + siblings).
   */
  getEmittersInScope() {
    const interfaces = this.getInterfacesInScope();
    const result = [];
    for (let i = 0; i < interfaces.length; i++) {
      for (let j = 0; j < interfaces[i].emitters.length; j++) {
        result.push(interfaces[i].emitters[j]);
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
    for (let i = 0; i < this.emitters.length; i++) {
      this.emitters[i].disconnectEmitter();
    }
    for (let i = 0; i < this.collectors.length; i++) {
      this.collectors[i].disconnectCollector();
    }
    this.emitters = [];
    this.collectors = [];
    this.emitterNames = [];
    this.collectorNames = [];
  }
};

// src/krnl/core/K_LIB_Krnl_Entity_Compositional_Hierarchy.ts
var krnlEntityCompositionalHierarchyManager = class {
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

// src/krnl/core/K_LIB_Krnl_Telemetry.ts
var KrnlTelemetry = class {
  metrics;
  enabled;
  constructor() {
    this.metrics = /* @__PURE__ */ new Map();
    this.enabled = false;
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
    const latencyMs = latencyNs / 1e6;
    stats.avgLatencyMs = stats.totalLatencyNs / stats.calls / 1e6;
    stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
    if (latencyMs > stats.peakLatencyMs) stats.peakLatencyMs = latencyMs;
    stats.lastUpdated = Date.now();
  }
  /**
   * Returns a snapshot of all metrics.
   */
  getSummary() {
    return Object.fromEntries(this.metrics);
  }
  /**
   * Clears all collected metrics.
   */
  reset() {
    this.metrics.clear();
  }
};
var telemetry = new KrnlTelemetry();

// src/krnl/core/K_LIB_Krnl_Functionality_Types.ts
function cloneState(source) {
  return JSON.parse(JSON.stringify(source));
}
var krnlTransportAdapter = class {
};
var MemoryTransportAdapter = class extends krnlTransportAdapter {
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
var krnlLocalFunctionality = class {
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
  lifecycle;
  state;
  hostEntity;
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
      sourcePath = null
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
    const handler = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "object" && value !== null) {
          return new Proxy(value, handler);
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
    const trace = telemetry.enabled ? telemetry.startTrace(this.id) : null;
    if (this.schema && this.schema.input) {
      try {
        if (typeof this.schema.input.parse === "function") {
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
          if (typeof this.schema.output.parse === "function") {
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
      if (trace) telemetry.endTrace(this.id, trace, true);
      return {
        status: "success",
        payload: result
      };
    } catch (err) {
      if (trace) telemetry.endTrace(this.id, trace, false);
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
var krnlRemoteFunctionality = class {
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

// src/krnl/core/K_ENT_Krnl_Entity_Base.ts
var krnlEntityBase = class _krnlEntityBase {
  __krnlEntityInstance;
  id;
  entityName;
  Singleton;
  baseName;
  instanceNumber;
  _telemetryEnabled = false;
  get telemetryEnabled() {
    return this._telemetryEnabled;
  }
  set telemetryEnabled(val) {
    this._telemetryEnabled = val;
    telemetry.enabled = val;
  }
  systemType = "BaseEntity";
  interface;
  localFunctionalities;
  remoteFunctionalities;
  collectors;
  hierarchyManager;
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
    this.telemetryEnabled = options.telemetryEnabled || false;
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
      if (unwrap && result && typeof result === "object" && result.status === "success" && "payload" in result && !result.preemptiveDocumentation) {
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
    while (current) {
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
    return {
      entity: this.entityName,
      timestamp: Date.now(),
      metrics: telemetry.getSummary()
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

// src/krnl/core/K_ENT_Krnl_Sub_System_Orchestrator_Base.ts
var krnlSubSystemOrchestratorBase = class extends krnlEntityBase {
  constructor(name, owner) {
    if (!owner) {
      throw new Error("A sub-system orchestrator must be owned by a parent entity.");
    }
    super(name, owner);
    this.systemType = "SubSystemOrchestrator";
  }
};

// src/krnl/core/K_LIB_Krnl_Base_Concepts.ts
var import_fs = __toESM(require("fs"), 1);
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
        if (process.stdout && typeof process.stdout.fd === "number") import_fs.default.fsyncSync(process.stdout.fd);
        if (process.stderr && typeof process.stderr.fd === "number") import_fs.default.fsyncSync(process.stderr.fd);
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
var KrnlPolicy = class _KrnlPolicy {
  maxRetries = 0;
  timeoutMs = 5e3;
  retryDelayMs = 1e3;
  backoffStrategy = "LINEAR";
  constructor(opts = {}) {
    Object.assign(this, opts);
  }
  static default() {
    return new _KrnlPolicy();
  }
  static resilient() {
    return new _KrnlPolicy({ maxRetries: 3, timeoutMs: 1e4, retryDelayMs: 1e3, backoffStrategy: "EXPONENTIAL" });
  }
};

// src/krnl/core/K_LIB_Krnl_System_Comm_Component.ts
var WebSocketTransportAdapter = class extends krnlTransportAdapter {
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
    return await this.commComponent.callWsRpc(this.remoteAddress, "call", { fid: targetFunction, data: input }, policy);
  }
};
var _WS;
var _WSServer;
async function _loadWs() {
  if (!_WS) {
    const mod = await import("ws");
    _WS = mod.WebSocket;
    _WSServer = mod.WebSocketServer;
  }
  return { WebSocket: _WS, WebSocketServer: _WSServer };
}
var krnlSystemCommComponent = class {
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
        this._wsServer = new WebSocketServer({ server: externalServer });
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
            const msg = JSON.parse(raw.toString());
            if (msg.routeId && Object.prototype.hasOwnProperty.call(msg, "data") && !msg.kind) {
              const handler = this._wsIngress.get(msg.routeId);
              if (handler) handler(msg.data);
              return;
            }
            if (msg.kind === "register-ingress") {
              this.registerWsIngress(msg.routeId, msg.collectorName);
              return;
            }
            if (msg.kind === "route-data") {
              const handler = this._wsIngress.get(msg.routeId);
              if (handler) handler(msg.data);
              return;
            }
            if (msg.kind === "rpc-request") {
              this._handleRpcRequest(ws, msg);
              return;
            }
            if (msg.kind === "rpc-response") {
              this._handleRpcResponse(msg);
              return;
            }
            if (msg.kind === "introspect") {
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
    ws.send(JSON.stringify({
      kind: "register-ingress",
      routeId,
      collectorName: remoteCollectorName
    }));
    const unsubscribe = emitter.subscribe((msg) => {
      if (ws.readyState === _WS.OPEN) {
        ws.send(JSON.stringify({
          kind: "route-data",
          routeId,
          data: msg.data
        }));
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
  async callWsRpc(remoteAddress, method, params = {}, policy = KrnlPolicy.default()) {
    const { WebSocket } = await _loadWs();
    let lastError = null;
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        const requestId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const ws = new WebSocket(`ws://${remoteAddress}`);
        await new Promise((resolve, reject) => {
          const connTimeout = setTimeout(() => {
            ws.close();
            reject(new Error("ERR_NET_CONNECTION_TIMEOUT"));
          }, policy.timeoutMs);
          ws.once("open", () => {
            clearTimeout(connTimeout);
            resolve(true);
          });
          ws.once("error", (err) => {
            clearTimeout(connTimeout);
            reject(err);
          });
        });
        const result = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            this._wsPendingRpc.delete(requestId);
            ws.close();
            reject({ code: krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED, message: "ERR_NET_RPC_TIMEOUT_EXCEEDED" });
          }, policy.timeoutMs);
          this._wsPendingRpc.set(requestId, { resolve, reject, timeoutId, ws });
          ws.on("message", (raw) => {
            try {
              const msg = JSON.parse(raw.toString());
              if (msg.kind === "rpc-response") this._handleRpcResponse(msg);
            } catch (_) {
            }
          });
          ws.send(JSON.stringify({
            kind: "rpc-request",
            requestId,
            traceCorrelationId: requestId,
            // Trace ID matches Request ID for initial hop
            originSystemAddress: this.ownerEntity.entityName,
            timestamp: Date.now(),
            method,
            params
          }));
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
  async _handleRpcRequest(ws, msg) {
    const { requestId, method, params } = msg;
    const handler = this._wsRpcHandlers.get(method);
    if (!handler) {
      ws.send(JSON.stringify({
        kind: "rpc-response",
        requestId,
        ok: false,
        error: `Unknown RPC method: ${method}`
      }));
      return;
    }
    try {
      const result = await handler(params);
      ws.send(JSON.stringify({
        kind: "rpc-response",
        requestId,
        ok: true,
        result
      }));
    } catch (e) {
      let errorMsg = e.message || String(e);
      ws.send(JSON.stringify({
        kind: "rpc-response",
        requestId,
        ok: false,
        status: "error",
        message: errorMsg,
        error: errorMsg,
        errorDocumentation: e.errorDocumentation || null,
        payload: null,
        ...e && typeof e === "object" ? e.metadata || {} : {}
      }));
    }
  }
  async _handleIntrospect(ws, msg) {
    const baseInfo = {
      entity: this.ownerEntity.entityName,
      kind: "introspect-response",
      methods: Array.from(this._wsRpcHandlers.keys())
    };
    if (this._introspectionProvider) {
      try {
        const extra = await this._introspectionProvider();
        ws.send(JSON.stringify({ ...baseInfo, ...extra }));
      } catch (e) {
        ws.send(JSON.stringify({ ...baseInfo, error: `Introspection provider failed: ${e.message}` }));
      }
    } else {
      ws.send(JSON.stringify(baseInfo));
    }
  }
  _handleRpcResponse(msg) {
    const pending = this._wsPendingRpc.get(msg.requestId);
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    this._wsPendingRpc.delete(msg.requestId);
    pending.ws?.close();
    if (msg.ok) pending.resolve(msg.result);
    else pending.reject(new Error(msg.error || "RPC error"));
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

// src/krnl/core/K_LIB_Krnl_System_Base_Functionality_APIs.ts
function heartbeatApi(entity) {
  return () => ({
    name: entity.entityName,
    type: entity.systemType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function telemetryApi(entity) {
  return () => ({
    entityName: entity.entityName,
    systemType: entity.systemType,
    flags: entity.getSystemFlags(),
    owner: entity.hierarchyManager.getOwnerEntity()?.entityName || null,
    ownedEntities: entity.hierarchyManager.getAllOwnedComponentEntities().map((e) => e.entityName),
    activeRoutes: entity.commComponent.listRoutes(),
    uptime: typeof process !== "undefined" && process.uptime ? process.uptime() : null,
    performance: telemetry.getSummary()
  });
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

// src/krnl/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts
var import_http = __toESM(require("http"), 1);

// src/krnl/core/K_LIB_Krnl_Protocol_MCP.ts
var KrnlMcpProtocol = class {
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
  async handleRequest(rpc) {
    const { method, params, id } = rpc;
    if (method === "tools/list") {
      const result = await this.listTools();
      return { jsonrpc: "2.0", id, result };
    }
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      try {
        const result = await this.system.call(name, args);
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

// src/krnl/core/K_LIB_Krnl_Protocol_ACP.ts
var KrnlAcpProtocol = class {
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
  async handleMessage(payload) {
    const { action, data } = payload;
    try {
      const result = await this.system.call(action, data);
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

// src/krnl/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts
var krnlUnifiedHttpAdapter = class {
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
    const path6 = url.pathname;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const isKrnlRoute = path6.startsWith("/call/") || path6.startsWith("/sse/") || path6.startsWith("/mcp") || path6.startsWith("/acp") || path6 === "/manifest" || path6 === "/health";
    if (!isKrnlRoute) {
      if (this.enableFriendlyRouting) {
        let fid = path6.slice(1);
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
            const result = await this.system.call(fid, data.data || data, { unwrap: false });
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
      this._sendJson(res, 404, this.system.getNotFoundResponse(path6));
      return;
    }
    try {
      if (path6.startsWith("/call/")) {
        const fid = path6.split("/")[2];
        const body = await this._readJsonBody(req);
        const result = await this.system.call(fid, body, { unwrap: false });
        this._sendJson(res, 200, result);
        return;
      }
      if (path6.startsWith("/sse/")) {
        const fid = path6.split("/")[2];
        this._handleSse(req, res, fid);
        return;
      }
      if (path6 === "/mcp") {
        const body = await this._readJsonBody(req);
        const result = await this.mcp.handleRequest(body);
        this._sendJson(res, 200, result);
        return;
      }
      if (path6 === "/health") {
        this._sendJson(res, 200, { status: "ok", entity: this.system.entityName });
        return;
      }
      if (path6.startsWith("/acp")) {
        if (path6 === "/acp/info" || path6 === "/acp") {
          this._sendJson(res, 200, this.acp.getInfo());
        } else if (path6 === "/acp/capabilities") {
          this._sendJson(res, 200, this.acp.getCapabilities());
        } else if (path6 === "/acp/messages" && req.method === "POST") {
          const body = await this._readJsonBody(req);
          const result = await this.acp.handleMessage(body);
          this._sendJson(res, 200, result);
        } else {
          this._sendJson(res, 404, { error: "ACP route not found" });
        }
        return;
      }
      if (path6 === "/manifest") {
        this._sendJson(res, 200, this.system.getManifest());
        return;
      }
    } catch (error) {
      Logger.error(`[HttpAdapter] Fatal handler error ${path6}:`, error.message || error);
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
    req.on("close", () => {
      if (unsubscribe) unsubscribe();
      res.end();
    });
    const interval = setInterval(() => {
      if (res.writable) {
        res.write(": keepalive\n\n");
      }
    }, 15e3);
    req.on("close", () => clearInterval(interval));
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

// src/krnl/core/K_ENT_Krnl_System_Entity_Base.ts
var import_http2 = __toESM(require("http"), 1);
var import_zod_to_json_schema = require("zod-to-json-schema");
var krnlSystemEntityBase = class extends krnlEntityBase {
  systemType;
  peers;
  discoverable;
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
    this.commPort = commPort;
    this.host = host;
    this.commComponent = new krnlSystemCommComponent(this, commPort, host);
    this._setupBaseFunctionalities();
    this._setupBaseInterface();
    this._setupRpcHandlers();
    this._sharedServer = null;
    this.serviceSuites = /* @__PURE__ */ new Map();
    this.unifiedHttpAdapter = new krnlUnifiedHttpAdapter(this, commPort, host);
    this._documentationProvider = null;
    this._emitStartupDiagnostics();
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
  getNotFoundResponse(path6) {
    const response = {
      status: "error",
      message: `Route '${path6}' not found.`
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
        comm: { status: "active", port: this.commPort },
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
    this.localFunctionalities.forEach((f) => {
      const fManifest = {
        id: f.id,
        type: "local",
        visibility: f.visibility,
        sourcePath: f.sourcePath,
        events: []
      };
      f.emitters.forEach((_, eid) => {
        const eventId = `${f.id}:${eid}`;
        fManifest.events.push(eventId);
        eventsNames.push(eventId);
      });
      if (f.schema) {
        fManifest.schema = {};
        if (f.schema.input) {
          try {
            fManifest.schema.input = (0, import_zod_to_json_schema.zodToJsonSchema)(f.schema.input);
          } catch (e) {
            fManifest.schema.input = { type: "custom", message: "Non-Zod or complex schema" };
          }
        }
        if (f.schema.output) {
          try {
            fManifest.schema.output = (0, import_zod_to_json_schema.zodToJsonSchema)(f.schema.output);
          } catch (e) {
            fManifest.schema.output = { type: "custom", message: "Non-Zod or complex schema" };
          }
        }
      }
      api[f.id] = fManifest;
      apiNames.push(f.id);
    });
    this.remoteFunctionalities.forEach((f) => {
      if (!api[f.id]) {
        const resolved = this.resolveLocalFunctionality(f.id);
        if (resolved) {
          const fManifest = {
            id: f.id,
            type: "remote",
            visibility: resolved.visibility,
            sourcePath: resolved.sourcePath,
            events: []
          };
          resolved.emitters.forEach((_, eid) => {
            const eventId = `${f.id}:${eid}`;
            fManifest.events.push(eventId);
            eventsNames.push(eventId);
          });
          if (resolved.schema) {
            fManifest.schema = {};
            if (resolved.schema.input) {
              try {
                fManifest.schema.input = (0, import_zod_to_json_schema.zodToJsonSchema)(resolved.schema.input);
              } catch (e) {
                fManifest.schema.input = { type: "custom", message: "Non-Zod or complex schema" };
              }
            }
            if (resolved.schema.output) {
              try {
                fManifest.schema.output = (0, import_zod_to_json_schema.zodToJsonSchema)(resolved.schema.output);
              } catch (e) {
                fManifest.schema.output = { type: "custom", message: "Non-Zod or complex schema" };
              }
            }
          }
          api[f.id] = fManifest;
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
    if (this.discoverySocket) return;
    if (!this.isDiscoveryAvailable()) {
      console.warn(`[${this.entityName}] Discovery: UDP not supported in current environment.`);
      return;
    }
    const dgram = await import("dgram").then((m) => m.default || m);
    this.discoverySocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    this.discoverySocket.on("message", (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
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
    this.discoverySocket.bind(discoveryPort, this.host, () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${discoveryHost})`);
    });
    this.beaconInterval = setInterval(() => {
      if (!this.discoverable) return;
      const beacon = JSON.stringify({
        type: "KRNL_BEACON",
        id: this.entityName,
        port: this.commPort,
        discoverable: this.discoverable,
        busy: this.reservation.busy,
        reservedBy: this.reservation.reservedBy
      });
      this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, discoveryHost);
    }, 5e3);
    await this._startSharedServer();
  }
  async _startSharedServer() {
    if (this._sharedServer) return;
    this._sharedServer = import_http2.default.createServer();
    await this.unifiedHttpAdapter.start(this._sharedServer);
    this.serviceSuites.set("UNIFIED_HTTP", this.unifiedHttpAdapter);
    await this.commComponent.startWsServer(this._sharedServer);
    return new Promise((resolve, reject) => {
      this._sharedServer.listen(this.commPort, this.host, () => {
        console.log(`[${this.entityName}] Unified port active on http://${this.host}:${this.commPort} (WS + REST + MCP + ACP)`);
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
    this.commComponent.defineRpc("call", async ({ fid, data }) => {
      this._assertAvailableForRemoteAccess(data?.meta?.requester || null);
      return await this.call(fid, data);
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
    const handleSignal = (signal) => {
      console.log(`
[${this.entityName}] OS Signal ${signal} received. Cleaning up...`);
      this.dispose();
      process.exit(0);
    };
    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
    process.on("SIGHUP", () => {
      console.log(`[${this.entityName}] SIGHUP received. Ignoring to maintain background persistence.`);
    });
    process.on("uncaughtException", (err) => {
      Logger.error(`UNCAUGHT EXCEPTION in ${this.entityName}:`, err);
      this.dispose();
      process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
      Logger.error(`UNHANDLED REJECTION in ${this.entityName}:`, reason);
      this.dispose();
      process.exit(1);
    });
    process.on("exit", (code) => {
      console.log(`[${this.entityName}] Process exiting with code: ${code}`);
    });
  }
  dispose() {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.discoverySocket) this.discoverySocket.close();
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

// src/krnl/core/K_ENT_Krnl_Network_Orchestrator_Entity_Base.ts
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

// src/krnl/tools/KrnlResult.ts
var KrnlResult = class _KrnlResult {
  status;
  message;
  data;
  code;
  constructor(status, message, data, code) {
    this.status = status;
    if (message !== void 0) this.message = message;
    if (data !== void 0) this.data = data;
    if (code !== void 0) this.code = code;
  }
  static ok(data, message) {
    return new _KrnlResult("success", message, data);
  }
  static fail(message, code) {
    return new _KrnlResult("error", message, void 0, code);
  }
  isSuccess() {
    return this.status === "success";
  }
  isError() {
    return this.status === "error";
  }
};

// src/krnl/tools/ObjectKit.ts
var ObjectKit = class _ObjectKit {
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
    if (Object.is(a, b)) return true;
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
    if (keysA.length !== keysB.length) return false;
    const setB = new Set(keysB);
    for (const key of keysA) {
      if (!setB.has(key)) return false;
      if (!_ObjectKit.deepEqual(a[key], b[key])) return false;
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
  static getPath(obj, path6, defaultValue) {
    if (!path6) return obj;
    const parts = path6.split(".");
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
  static setPath(obj, path6, value) {
    if (!path6) return obj;
    const parts = path6.split(".");
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

// src/krnl/tools/AsyncKit.ts
var AsyncKit = class _AsyncKit {
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
      if (timer) clearTimeout(timer);
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

// src/krnl/tools/StringKit.ts
var StringKit = class _StringKit {
  static toCamelCase(str) {
    return str.replace(/[-_]+/g, " ").replace(/[^\w\s]/g, "").replace(
      /(?:^\w|[A-Z]|\b\w)/g,
      (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, "");
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

// src/krnl/tools/CacheKit.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var LRUCache = class {
  maxSize;
  cache;
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return void 0;
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
      if (firstKey !== void 0) this.cache.delete(firstKey);
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
var TTLCache = class {
  ttlMs;
  cache;
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
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
var CacheKit = class {
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
var FileCache = class {
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
    if (!import_fs2.default.existsSync(file)) return null;
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

// src/krnl/tools/KrnlFS.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_os = __toESM(require("os"), 1);
var FileLock = class _FileLock {
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
var KrnlFS = class _KrnlFS {
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
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handler(event), debounceMs);
    });
  }
  static watchDir(dirPath, handler, debounceMs = 100) {
    let timer = null;
    return import_fs3.default.watch(dirPath, (event, filename) => {
      if (timer) clearTimeout(timer);
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

// src/krnl/tools/KrnlEnv.ts
var import_fs4 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var KrnlEnv = class {
  /**
   * Reads a process environment variable with type coercion and defaults.
   */
  static get(key, defaultValue) {
    const val = process.env[key];
    if (val === void 0) {
      if (defaultValue !== void 0) return defaultValue;
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
    if (!import_fs4.default.existsSync(file)) return;
    try {
      const content = import_fs4.default.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex === -1) continue;
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

// src/krnl/tools/KrnlShell.ts
var import_child_process = require("child_process");
var import_path4 = __toESM(require("path"), 1);
var import_fs5 = __toESM(require("fs"), 1);
var KrnlShell = class {
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

// src/krnl/tools/KrnlHTTP.ts
var KrnlHTTP = class _KrnlHTTP {
  /**
   * Helper to perform fetch with timeout and retries.
   */
  static async requestRaw(url, opts = {}) {
    const timeout = opts.timeout || 15e3;
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
        return KrnlResult.fail(`HTTP Error ${res.status}: ${res.statusText}`, res.status);
      }
      const data = await res.json();
      return KrnlResult.ok(data);
    } catch (e) {
      return KrnlResult.fail(e.message || String(e));
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
      get: (path6, opts = {}) => _KrnlHTTP.get(`${baseUrl}${path6}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      post: (path6, body, opts = {}) => _KrnlHTTP.post(`${baseUrl}${path6}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      put: (path6, body, opts = {}) => _KrnlHTTP.put(`${baseUrl}${path6}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      del: (path6, opts = {}) => _KrnlHTTP.del(`${baseUrl}${path6}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
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
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
};

// src/krnl/tools/GitManager.ts
var import_fs6 = __toESM(require("fs"), 1);
var import_path5 = __toESM(require("path"), 1);
var GitManager = class _GitManager {
  static isRepo(dirPath) {
    return import_fs6.default.existsSync(import_path5.default.join(dirPath, ".git"));
  }
  static async init(dirPath) {
    if (_GitManager.isRepo(dirPath)) return;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AsyncKit,
  CacheKit,
  DasyJS,
  FileCache,
  FileLock,
  GitManager,
  KrnlAcpProtocol,
  KrnlEnv,
  KrnlFS,
  KrnlHTTP,
  KrnlMcpProtocol,
  KrnlPolicy,
  KrnlResult,
  KrnlShell,
  LRUCache,
  Logger,
  MemoryTransportAdapter,
  ObjectKit,
  StringKit,
  TTLCache,
  WebSocketTransportAdapter,
  createEnum,
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
  krnlMessageStream,
  krnlNetworkOrchestratorEntityBase,
  krnlPrimitiveDataTypes,
  krnlRemoteFunctionality,
  krnlServiceSuitePorts,
  krnlServiceSuites,
  krnlSubSystemOrchestratorBase,
  krnlSystemCommComponent,
  krnlSystemEntityBase,
  krnlSystemTypes,
  krnlTransportAdapter,
  krnlUnifiedHttpAdapter,
  telemetry
});
