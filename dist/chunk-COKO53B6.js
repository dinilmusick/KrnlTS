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
var CUSTOM_ERROR_CODE = -999;
var krnlError = class extends Error {
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
  timestamp = 0;
  // Tracing metadata aligned with core lingo
  sourceEmitterAddress = null;
  targetCollectorAddress = null;
  traceCorrelationId = null;
  originSystemAddress = null;
};
var krnlEmitter = class {
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
  static getPath(obj, path3, defaultValue) {
    if (!path3) return obj;
    const parts = path3.split(".");
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
  static setPath(obj, path3, value) {
    if (!path3) return obj;
    const parts = path3.split(".");
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

// src/krnl/core/K_LIB_Krnl_Functionality_Types.ts
function cloneState(source) {
  return ObjectKit.deepClone(source);
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
  tests;
  /** Port-based access control policy. Absent = unrestricted. */
  accessPolicy;
  /** Shared secret for allow_with_key / ask_key_unlisted gates. */
  accessKey;
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
      if (trace) activeTelemetry.endTrace(this.id, trace, true);
      return {
        status: "success",
        payload: result
      };
    } catch (err) {
      if (trace) activeTelemetry.endTrace(this.id, trace, false);
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
    return {
      entity: this.entityName,
      timestamp: Date.now(),
      metrics: this.telemetry.getSummary()
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

// src/krnl/core/K_LIB_Krnl_Base_Concepts.ts
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
              const callerPort = ws._socket?.remotePort;
              this._handleRpcRequest(ws, msg, callerPort);
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
        const msg = JSON.parse(raw.toString());
        if (msg.kind === "rpc-response") {
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
  async _handleRpcRequest(ws, msg, callerPort) {
    const { requestId, method, params } = msg;
    if (params?.target && this.ownerEntity._ingressNetwork) {
      const member = this.ownerEntity._ingressNetwork.members.get(params.target.toLowerCase());
      if (member) {
        const { target, ...memberParams } = params;
        const memberMsg = { ...msg, params: memberParams };
        await member.entity.commComponent._handleRpcRequest(ws, memberMsg, callerPort);
        return;
      }
    }
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
      const result = await handler(params, { callerPort });
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

// src/krnl/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts
import http from "http";
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
      this.server = http.createServer((req, res) => {
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
    const path3 = url.pathname;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (this.system._ingressNetwork) {
      const segments = path3.split("/").filter(Boolean);
      const prefix = segments[0]?.toLowerCase();
      if (prefix && this.system._ingressNetwork.members.has(prefix)) {
        const subPath = "/" + segments.slice(1).join("/") + url.search;
        await this.system._ingressNetwork.routeHttpRequest(prefix, req, res, subPath);
        return;
      }
    }
    if (this.system._ingressNetwork && path3.startsWith("/frontend/")) {
      const segments = path3.split("/").filter(Boolean);
      if (segments[0]?.toLowerCase() === "frontend" && segments[1] && segments[1].toLowerCase() !== "default") {
        const frontendName = segments[1].toLowerCase();
        const key = `frontend/${frontendName}`;
        if (this.system._ingressNetwork.members.has(key)) {
          await this.system._ingressNetwork.routeHttpRequest(key, req, res, req.url || "/");
          return;
        }
      }
    }
    if (path3.startsWith("/frontend/default")) {
      if (this.system._frontend) {
        const subPath = path3.slice("/frontend/default".length) || "/";
        await this.system._frontend.handleRequest(req, res, subPath);
      } else {
        this._sendJson(res, 404, { status: "error", message: "Frontend not enabled." });
      }
      return;
    }
    const isKrnlRoute = path3.startsWith("/call/") || path3.startsWith("/sse/") || path3.startsWith("/mcp") || path3.startsWith("/acp") || path3 === "/manifest" || path3 === "/health";
    if (!isKrnlRoute) {
      if (this.enableFriendlyRouting) {
        let fid = path3.slice(1);
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
      this._sendJson(res, 404, this.system.getNotFoundResponse(path3));
      return;
    }
    try {
      if (path3.startsWith("/call/")) {
        const fid = path3.split("/")[2];
        const body = await this._readJsonBody(req);
        const result = await this.system.call(fid, body, {
          unwrap: false,
          callerPort: req.socket?.remotePort,
          accessKey: req.headers["x-krnl-access-key"]
        });
        this._sendJson(res, 200, result);
        return;
      }
      if (path3.startsWith("/sse/")) {
        const fid = path3.split("/")[2];
        this._handleSse(req, res, fid);
        return;
      }
      if (path3 === "/mcp") {
        const body = await this._readJsonBody(req);
        const result = await this.mcp.handleRequest(body, {
          callerPort: req.socket?.remotePort,
          accessKey: req.headers["x-krnl-access-key"]
        });
        this._sendJson(res, 200, result);
        return;
      }
      if (path3 === "/health") {
        this._sendJson(res, 200, { status: "ok", entity: this.system.entityName });
        return;
      }
      if (path3.startsWith("/acp")) {
        if (path3 === "/acp/info" || path3 === "/acp") {
          this._sendJson(res, 200, this.acp.getInfo());
        } else if (path3 === "/acp/capabilities") {
          this._sendJson(res, 200, this.acp.getCapabilities());
        } else if (path3 === "/acp/messages" && req.method === "POST") {
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
      if (path3 === "/manifest") {
        if (this.system._ingressNetwork) {
          this._sendJson(res, 200, this.system._ingressNetwork.getGrossManifest(`http://${req.headers.host}`));
        } else {
          this._sendJson(res, 200, this.system.getManifest());
        }
        return;
      }
    } catch (error) {
      Logger.error(`[HttpAdapter] Fatal handler error ${path3}:`, error.message || error);
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

// src/krnl/tools/KrnlShell.ts
import { exec, spawn } from "child_process";
import path from "path";
import fs2 from "fs";
var KrnlShell = class {
  /**
   * Promisified command execution.
   */
  static exec(cmd, opts = {}) {
    const timeout = opts.timeout || 3e4;
    return new Promise((resolve, reject) => {
      exec(cmd, { ...opts, timeout }, (error, stdout, stderr) => {
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
    const child = spawn(cmd, args, opts);
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
    const paths = envPath.split(path.delimiter);
    const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
    for (const p of paths) {
      for (const ext of extensions) {
        const fullPath = path.join(p, `${cmd}${ext}`);
        try {
          if (fs2.existsSync(fullPath) && fs2.statSync(fullPath).isFile()) {
            return fullPath;
          }
        } catch (e) {
        }
      }
    }
    return null;
  }
};

// src/krnl/core/K_LIB_Krnl_System_Ingress_Network.ts
var KrnlIngressNetwork = class {
  members = /* @__PURE__ */ new Map();
  async addMember(admin, config) {
    const prefix = config.prefix.toLowerCase();
    if (this.members.has(prefix)) {
      throw new Error(`[IngressNetwork] Prefix '${config.prefix}' is already registered.`);
    }
    let entity;
    if (config.isKrnl === false || !config.ServiceClass) {
      const { KrnlNonKrnlAppAdapter } = await import("./K_LIB_Krnl_System_App_Adapter-QVGMKSCZ.js");
      const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || "");
      await adapter.startApp();
      entity = adapter;
    } else {
      const ServiceClass = config.ServiceClass;
      const memberPort = config.port ?? -1;
      const args = config.constructorArgs ?? [];
      entity = new ServiceClass(memberPort, ...args);
      if (entity._magneticLoadPromise) {
        await entity._magneticLoadPromise;
      }
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
    const key = `frontend/${config.name.toLowerCase()}`;
    if (this.members.has(key)) {
      throw new Error(`[IngressNetwork] Frontend member '${config.name}' is already registered.`);
    }
    const options = { ...config.options };
    if (!options.backendPort) {
      options.backendPort = admin.commPort;
    }
    if (!options.backendHost) {
      options.backendHost = admin.host;
    }
    const { KrnlFrontendAdapter } = await import("./K_LIB_Krnl_System_Frontend_Adapter-3LYRST54.js");
    const adapter = new KrnlFrontendAdapter(config.name, config.appPath, options);
    await adapter.startApp();
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

// src/krnl/core/K_LIB_Krnl_System_Frontend.ts
var KrnlFrontend = class {
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
    if (normalized === "/manifest.json" && req.method === "GET") {
      const manifest = this.system.getManifest();
      const payload = {
        ...manifest,
        ingressMembers: this.system._ingressNetwork ? Array.from(this.system._ingressNetwork.members.keys()) : [],
        interactionsHistory: this.interactionsHistory
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
      return;
    }
    if (normalized === "/history" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(this.interactionsHistory));
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
        const stateEmitter = functionality.emitters?.get("state:changed");
        const interactionEvent = {
          type: "frontend:interaction",
          fid,
          timestamp: Date.now(),
          input: body,
          output: result
        };
        stateEmitter?.pushDataStreamToEmitter(interactionEvent);
        this.interactionsHistory.push(interactionEvent);
        if (this.interactionsHistory.length > 50) {
          this.interactionsHistory.shift();
        }
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
    const logoUrl = this.options.logoUrl || "";
    const customCss = this.options.customCss || "";
    return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} \u2014 KrnlTS Control Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-sans: 'Outfit', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      
      /* Dark Theme Default */
      --bg-base: #090d16;
      --bg-surface: rgba(22, 28, 45, 0.6);
      --bg-surface-hover: rgba(22, 28, 45, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-color-focus: rgba(59, 130, 246, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      --accent: #10b981;
      --accent-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      --card-blur: blur(12px);
    }

    [data-theme="light"] {
      --bg-base: #f1f5f9;
      --bg-surface: rgba(255, 255, 255, 0.7);
      --bg-surface-hover: rgba(255, 255, 255, 0.9);
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

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      background-image: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 40%);
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border-color);
      background-color: rgba(9, 13, 22, 0.4);
      backdrop-filter: blur(10px);
      z-index: 50;
      position: sticky;
      top: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      background: var(--primary-gradient);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 1.2rem;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .meta-badges {
      display: flex;
      gap: 0.5rem;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 600;
      text-transform: uppercase;
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.04);
    }

    .badge-primary {
      background: var(--primary-gradient);
      color: white;
      border: none;
    }

    .theme-toggle {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .theme-toggle:hover {
      background: var(--border-color);
    }

    /* Layout */
    .app-container {
      display: flex;
      flex: 1;
      height: calc(100vh - 65px);
      overflow: hidden;
    }

    aside {
      width: 280px;
      border-right: 1px solid var(--border-color);
      background-color: rgba(9, 13, 22, 0.2);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
    }

    .sidebar-section {
      padding: 1.5rem;
    }

    .sidebar-section-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item button {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }

    .nav-item button:hover {
      color: var(--text-main);
      background-color: var(--bg-surface-hover);
    }

    .nav-item.active button {
      color: white;
      background: var(--primary-gradient);
    }

    .nav-item .method-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.2);
      color: #93c5fd;
    }

    .nav-item.active .method-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background-color: rgba(9, 13, 22, 0.1);
    }

    .main-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Sub-Apps Ingress topology */
    .ingress-topology {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .ingress-card {
      background: var(--bg-surface);
      backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text-main);
      transition: all 0.2s;
    }

    .ingress-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
      background: var(--bg-surface-hover);
    }

    .ingress-card-title {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .ingress-card-link {
      font-size: 0.8rem;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Card Details */
    .detail-card {
      background: var(--bg-surface);
      backdrop-filter: var(--card-blur);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: var(--glass-shadow);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }

    .card-title-area h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .card-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--border-color-focus);
    }

    .form-textarea {
      min-height: 120px;
      resize: vertical;
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    }

    .btn-primary {
      background: var(--primary-gradient);
    }

    .btn-primary:hover {
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Response / Output */
    .output-section {
      margin-top: 2rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
    }

    .output-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .output-container {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
      max-height: 450px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.5;
      position: relative;
    }

    .response-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .response-status-ok {
      color: #10b981;
      font-weight: bold;
    }

    .response-status-error {
      color: #ef4444;
      font-weight: bold;
    }

    /* SSE Monitor Panel */
    .sse-panel {
      margin-top: 2rem;
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .sse-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .sse-log {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      max-height: 250px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sse-event-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 0.5rem;
    }

    .sse-event-time {
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    /* Tables in Output */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
      font-family: var(--font-sans);
    }

    .data-table th, .data-table td {
      padding: 0.6rem 0.8rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      background: rgba(255, 255, 255, 0.04);
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
    }

    .data-table td {
      font-size: 0.9rem;
    }

    /* Images */
    .image-preview {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-top: 0.5rem;
    }

    ${customCss}
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-logo">\u{1F537}</div>
      <div>
        <h1 class="brand-title">${title}</h1>
        <div style="font-size: 0.75rem; color: var(--text-muted);">KrnlTS Self-Hosted Control Panel</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div class="meta-badges">
        <span class="badge badge-primary" id="system-type-badge">System</span>
        <span class="badge" id="port-badge">Port: ...</span>
      </div>
      <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle Theme">\u{1F313}</button>
    </div>
  </header>

  <div class="app-container">
    <aside>
      <div class="sidebar-section">
        <div class="sidebar-section-title">Local Endpoints</div>
        <ul class="nav-list" id="local-endpoints-list">
          <li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">Loading...</li>
        </ul>
      </div>
      
      <div class="sidebar-section" id="remote-section" style="display: none;">
        <div class="sidebar-section-title">Remote Endpoints</div>
        <ul class="nav-list" id="remote-endpoints-list"></ul>
      </div>
    </aside>

    <main>
      <div class="main-grid" id="main-content">
        <!-- Sub-Apps (Ingress network) Section if any -->
        <div id="ingress-section" style="display: none; margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Sub-App Network Topology</h3>
          <div class="ingress-topology" id="ingress-container"></div>
        </div>

        <div id="welcome-panel" class="detail-card" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-size: 2.25rem; margin-bottom: 1rem;">Welcome to the Control Panel</h2>
          <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">
            This dynamic user interface is served on-the-fly and reflects the configuration of your KrnlTS System Entity in real time. Select an endpoint in the sidebar to call it or monitor its events.
          </p>
          <div class="meta-badges" style="justify-content: center;">
            <span class="badge" id="welcome-details">Initialising...</span>
          </div>
        </div>

        <div id="endpoint-panel" class="detail-card" style="display: none;">
          <!-- Loaded dynamically -->
        </div>
      </div>
    </main>
  </div>

  <script>
    let manifestData = null;
    let activeFid = null;
    let sseSource = null;

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
    });

    // On Load
    window.addEventListener('DOMContentLoaded', async () => {
      try {
        const res = await fetch('manifest.json');
        manifestData = await res.json();
        renderSidebar();
        renderIngressTopology();
        updateHeaderBadges();
      } catch (err) {
        console.error("Failed to fetch manifest:", err);
        document.getElementById('welcome-details').innerText = "Failed to load manifest.json";
      }

      // Check for dynamic updates of endpoints (live code reload)
      setInterval(async () => {
        try {
          const res = await fetch('manifest.json');
          const newManifest = await res.json();
          
          const oldStr = JSON.stringify(manifestData ? manifestData.inputs.api : {});
          const newStr = JSON.stringify(newManifest.inputs.api);
          
          const oldIngress = JSON.stringify(manifestData ? manifestData.ingressMembers : []);
          const newIngress = JSON.stringify(newManifest.ingressMembers);

          if (oldStr !== newStr || oldIngress !== newIngress) {
            console.log("[ControlPanel] Manifest changed, dynamically updating UI...");
            manifestData = newManifest;
            renderSidebar();
            renderIngressTopology();
            updateHeaderBadges();
            
            if (activeFid && !manifestData.inputs.api[activeFid]) {
              activeFid = null;
              disconnectSse();
              document.getElementById('endpoint-panel').style.display = 'none';
              document.getElementById('welcome-panel').style.display = 'block';
            } else if (activeFid) {
              selectEndpoint(activeFid);
            }
          }
        } catch (err) {
          console.warn("Failed to check manifest updates:", err);
        }
      }, 3000);
    });

    function updateHeaderBadges() {
      if (!manifestData) return;
      document.getElementById('system-type-badge').innerText = manifestData.systemType || 'SystemOrchestrator';
      const port = window.location.port || 'default';
      document.getElementById('port-badge').innerText = 'Port: ' + port;
      document.getElementById('welcome-details').innerText = 'Entity: ' + manifestData.entityName + ' | Type: ' + (manifestData.systemType || 'System');
    }

    function renderSidebar() {
      const localList = document.getElementById('local-endpoints-list');
      const remoteList = document.getElementById('remote-endpoints-list');
      const remoteSection = document.getElementById('remote-section');

      localList.innerHTML = '';
      remoteList.innerHTML = '';

      let hasLocal = false;
      let hasRemote = false;

      if (manifestData && manifestData.inputs && manifestData.inputs.api) {
        const apis = Object.values(manifestData.inputs.api);
        
        // Sort by ID
        apis.sort((a, b) => a.id.localeCompare(b.id));

        apis.forEach(api => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          li.id = 'nav-item-' + api.id;
          
          const method = api.method || 'POST';
          li.innerHTML = '<button onclick="selectEndpoint(\\'' + api.id + '\\')">' +
            '<span>' + api.id + '</span>' +
            '<span class="method-badge">' + method + '</span>' +
            '</button>';

          if (api.type === 'local') {
            localList.appendChild(li);
            hasLocal = true;
          } else {
            remoteList.appendChild(li);
            hasRemote = true;
          }
        });
      }

      if (!hasLocal) {
        localList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">No local endpoints</li>';
      }
      if (hasRemote) {
        remoteSection.style.display = 'block';
      }
    }

    function renderIngressTopology() {
      const ingressSection = document.getElementById('ingress-section');
      const container = document.getElementById('ingress-container');
      container.innerHTML = '';

      if (manifestData && manifestData.ingressMembers && manifestData.ingressMembers.length > 0) {
        ingressSection.style.display = 'block';
        manifestData.ingressMembers.forEach(member => {
          const card = document.createElement('a');
          card.className = 'ingress-card';
          // Navigate to target subapp's frontend
          card.href = '../../' + member + '/frontend/default/';
          card.innerHTML = '<div class="ingress-card-title">\u{1F537} ' + member.toUpperCase() + '</div>' +
            '<div class="ingress-card-link">Open Sub-App Panel \u2192</div>';
          container.appendChild(card);
        });
      } else {
        ingressSection.style.display = 'none';
      }
    }

    function selectEndpoint(fid) {
      if (activeFid) {
        const prevItem = document.getElementById('nav-item-' + activeFid);
        if (prevItem) prevItem.classList.remove('active');
      }

      activeFid = fid;
      const nextItem = document.getElementById('nav-item-' + fid);
      if (nextItem) nextItem.classList.add('active');

      document.getElementById('welcome-panel').style.display = 'none';
      
      const panel = document.getElementById('endpoint-panel');
      panel.style.display = 'block';

      // Disconnect previous SSE stream
      disconnectSse();

      const api = manifestData.inputs.api[fid];
      const method = api.method || 'POST';
      const inputSchema = api.schema && api.schema.input;
      
      let inputsHtml = '';
      if (method === 'POST') {
        if (inputSchema && inputSchema.properties) {
          inputsHtml = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
          for (const [key, value] of Object.entries(inputSchema.properties)) {
            const description = value.description || '';
            const required = (inputSchema.required || []).includes(key) ? 'required' : '';
            
            inputsHtml += '<div class="form-group">' +
              '<label class="form-label" for="input-' + key + '">' + key + (required ? ' *' : '') + '</label>';
            
            if (value.type === 'string') {
              inputsHtml += '<input type="text" class="form-input" id="input-' + key + '" placeholder="' + description + '" ' + required + '>';
            } else if (value.type === 'number' || value.type === 'integer') {
              inputsHtml += '<input type="number" class="form-input" id="input-' + key + '" placeholder="' + description + '" ' + required + '>';
            } else if (value.type === 'boolean') {
              inputsHtml += '<div class="checkbox-container"><input type="checkbox" id="input-' + key + '"> <span>' + description + '</span></div>';
            } else {
              // complex schema - object / array
              const hint = JSON.stringify(value, null, 2);
              inputsHtml += '<textarea class="form-input form-textarea" id="input-' + key + '" placeholder="Enter JSON here...\\nSchema hint:\\n' + hint.replace(/"/g, '&quot;') + '" ' + required + '></textarea>';
            }
            inputsHtml += '</div>';
          }
          inputsHtml += '</div>';
        } else {
          // POST but no structured schema
          inputsHtml = '<div class="form-group">' +
            '<label class="form-label" for="raw-json-input">Payload (JSON)</label>' +
            '<textarea class="form-input form-textarea" id="raw-json-input" placeholder="{\\n  \\n}"></textarea>' +
            '</div>';
        }
      } else {
        // GET endpoint
        if (inputSchema && inputSchema.properties) {
          inputsHtml = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
          for (const [key, value] of Object.entries(inputSchema.properties)) {
            inputsHtml += '<div class="form-group">' +
              '<label class="form-label" for="input-' + key + '">' + key + '</label>' +
              '<input type="text" class="form-input" id="input-' + key + '" placeholder="' + (value.description || '') + '">' +
              '</div>';
          }
          inputsHtml += '</div>';
        } else {
          inputsHtml = '<p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">This GET endpoint takes no parameters.</p>';
        }
      }

      const hasEvents = api.events && api.events.length > 0;
      let sseHtml = '';
      if (hasEvents) {
        sseHtml = '<div class="sse-panel">' +
          '<div class="sse-header">' +
          '<div>' +
          '<h4 style="font-weight: 600; color: #10b981;">Live Event Stream Bridge</h4>' +
          '<div style="font-size: 0.75rem; color: var(--text-muted);">Listen to server state changes in real-time</div>' +
          '</div>' +
          '<button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" id="sse-toggle-btn" onclick="toggleSse(\\'' + fid + '\\')">\u{1F534} Subscribe</button>' +
          '</div>' +
          '<div class="sse-log" id="sse-log-container"><div style="color: var(--text-muted); font-style: italic;">Not subscribed. Click subscribe to listen.</div></div>' +
          '</div>';
      }

      panel.innerHTML = '<div class="card-header">' +
        '<div class="card-title-area">' +
        '<h2>' + fid + '</h2>' +
        '<div class="card-desc">' + (api.sourcePath || 'KrnlTS Built-in Functionality') + '</div>' +
        '</div>' +
        '<span class="badge badge-primary">' + method + '</span>' +
        '</div>' +
        '<form id="endpoint-call-form" onsubmit="handleCall(event, \\'' + fid + '\\', \\'' + method + '\\')">' +
        inputsHtml +
        '<div style="margin-top: 1.5rem; display: flex; gap: 1rem;">' +
        '<button type="submit" class="btn btn-primary">\u26A1 Send Request</button>' +
        '</div>' +
        '</form>' +
        '<div class="output-section" id="output-wrapper" style="display: none;">' +
        '<div class="output-title">' +
        '<span>Response Details</span>' +
        '<button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="copyOutput()">\u{1F4CB} Copy</button>' +
        '</div>' +
        '<div class="response-meta" id="response-meta-area"></div>' +
        '<div class="output-container" id="response-output-pre"></div>' +
        '</div>' +
        sseHtml;
    }

    async function handleCall(event, fid, method) {
      event.preventDefault();
      const outputWrapper = document.getElementById('output-wrapper');
      const responseMeta = document.getElementById('response-meta-area');
      const outputPre = document.getElementById('response-output-pre');

      outputWrapper.style.display = 'block';
      responseMeta.innerHTML = 'Sending request...';
      outputPre.innerHTML = '';

      const api = manifestData.inputs.api[fid];
      let payload = {};
      
      const startTime = Date.now();

      if (method === 'POST') {
        if (api.schema && api.schema.input && api.schema.input.properties) {
          for (const key of Object.keys(api.schema.input.properties)) {
            const el = document.getElementById('input-' + key);
            if (el) {
              if (el.type === 'checkbox') {
                payload[key] = el.checked;
              } else if (el.type === 'number') {
                payload[key] = Number(el.value);
              } else if (el.tagName === 'TEXTAREA') {
                try {
                  payload[key] = el.value ? JSON.parse(el.value) : undefined;
                } catch (e) {
                  responseMeta.innerHTML = '<span class="response-status-error">Error: Invalid JSON input for key ' + key + '</span>';
                  return;
                }
              } else {
                payload[key] = el.value;
              }
            }
          }
        } else {
          const rawEl = document.getElementById('raw-json-input');
          if (rawEl && rawEl.value) {
            try {
              payload = JSON.parse(rawEl.value);
            } catch (e) {
              responseMeta.innerHTML = '<span class="response-status-error">Error: Invalid input JSON</span>';
              return;
            }
          }
        }
      } else {
        // GET params
        if (api.schema && api.schema.input && api.schema.input.properties) {
          for (const key of Object.keys(api.schema.input.properties)) {
            const el = document.getElementById('input-' + key);
            if (el && el.value) {
              payload[key] = el.value;
            }
          }
        }
      }

      try {
        let fetchUrl = 'api/' + fid;
        let fetchOpts = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        if (method === 'POST') {
          fetchOpts.method = 'POST';
          fetchOpts.body = JSON.stringify(payload);
        } else {
          fetchOpts.method = 'GET';
          const params = new URLSearchParams(payload).toString();
          if (params) fetchUrl += '?' + params;
        }

        const res = await fetch(fetchUrl, fetchOpts);
        const data = await res.json();
        const latency = Date.now() - startTime;

        const isOk = data.status !== 'error';
        responseMeta.innerHTML = '<span class="' + (isOk ? 'response-status-ok' : 'response-status-error') + '">' +
          (isOk ? 'SUCCESS' : 'FAILED') + '</span> | Latency: ' + latency + 'ms | Time: ' + new Date().toLocaleTimeString();

        renderResult(data, outputPre);
      } catch (err) {
        responseMeta.innerHTML = '<span class="response-status-error">CONNECTION ERROR</span>';
        outputPre.innerText = err.message;
      }
    }

    function renderResult(data, container) {
      container.innerHTML = '';
      
      // If error status, display the error message explicitly
      if (data && data.status === 'error' && data.message) {
        const errDiv = document.createElement('div');
        errDiv.className = 'response-status-error';
        errDiv.style.fontSize = '1.1rem';
        errDiv.style.marginBottom = '1rem';
        errDiv.innerText = '\u274C Error: ' + data.message;
        container.appendChild(errDiv);
        
        if (data.errorDocumentation) {
          const docDiv = document.createElement('div');
          docDiv.style.color = 'var(--text-muted)';
          docDiv.style.fontSize = '0.9rem';
          docDiv.style.marginTop = '0.5rem';
          docDiv.innerText = 'Documentation: ' + data.errorDocumentation;
          container.appendChild(docDiv);
        }
      } else if (data && data.status === 'success' && data.message) {
        // If success status has a success message
        const msgDiv = document.createElement('div');
        msgDiv.className = 'response-status-ok';
        msgDiv.style.fontSize = '1.1rem';
        msgDiv.style.marginBottom = '1rem';
        msgDiv.innerText = '\u2713 ' + data.message;
        container.appendChild(msgDiv);
      }

      // Resolve actual payload
      let unwrap = data;
      if (data && typeof data === 'object') {
        if (data.payload !== undefined) {
          unwrap = data.payload;
        } else if (data.unwrap !== undefined) {
          unwrap = data.unwrap;
        } else if (data.data !== undefined) {
          unwrap = data.data;
        }
      }
      
      // If it looks like an image URL, show image preview
      if (typeof unwrap === 'string' && (unwrap.startsWith('http://') || unwrap.startsWith('https://') || unwrap.startsWith('data:image/')) && /\\.(jpeg|jpg|gif|png|svg)$/i.test(unwrap.split('?')[0])) {
        const img = document.createElement('img');
        img.src = unwrap;
        img.className = 'image-preview';
        container.appendChild(img);
        
        const link = document.createElement('div');
        link.style.marginTop = '0.5rem';
        link.innerHTML = '<a href="' + unwrap + '" target="_blank" style="color: var(--primary);">Open image in new tab</a>';
        container.appendChild(link);
        return;
      }

      // If it is an array of objects, show a table
      if (Array.isArray(unwrap) && unwrap.length > 0 && typeof unwrap[0] === 'object') {
        const table = document.createElement('table');
        table.className = 'data-table';
        
        const keys = Object.keys(unwrap[0]);
        const trHead = document.createElement('tr');
        keys.forEach(k => {
          const th = document.createElement('th');
          th.innerText = k;
          trHead.appendChild(th);
        });
        table.appendChild(trHead);

        unwrap.forEach(row => {
          const tr = document.createElement('tr');
          keys.forEach(k => {
            const td = document.createElement('td');
            const cellVal = row[k];
            td.innerText = typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal);
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });

        container.appendChild(table);
        return;
      }

      // If it's a string, render clean text
      if (typeof unwrap === 'string') {
        const textWrapper = document.createElement('div');
        textWrapper.style.whiteSpace = 'pre-wrap';
        textWrapper.innerText = unwrap;
        container.appendChild(textWrapper);
        return;
      }

      // Default JSON formatting
      const code = document.createElement('pre');
      code.innerText = JSON.stringify(unwrap !== undefined ? unwrap : data, null, 2);
      container.appendChild(code);
    }

    function copyOutput() {
      const container = document.getElementById('response-output-pre');
      const text = container.innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied response to clipboard!');
      });
    }

    function disconnectSse() {
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
    }

    function toggleSse(fid) {
      const btn = document.getElementById('sse-toggle-btn');
      const log = document.getElementById('sse-log-container');

      if (sseSource) {
        disconnectSse();
        btn.innerText = '\u{1F534} Subscribe';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        log.innerHTML = '<div style="color: var(--text-muted); font-style: italic;">Unsubscribed.</div>';
      } else {
        log.innerHTML = '<div style="color: #10b981;">Subscribing to stream...</div>';
        btn.innerText = '\u{1F7E2} Active';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');

        sseSource = new EventSource('sse/' + fid);
        
        sseSource.onmessage = (event) => {
          let content = event.data;
          try {
            const parsed = JSON.parse(event.data);
            content = JSON.stringify(parsed, null, 2);
          } catch(e) {}

          const time = new Date().toLocaleTimeString();
          const item = document.createElement('div');
          item.className = 'sse-event-item';
          item.innerHTML = '<div class="sse-event-time">' + time + '</div><pre style="margin-top:0.25rem;">' + content + '</pre>';
          
          if (log.firstChild && log.firstChild.style && log.firstChild.style.fontStyle === 'italic') {
            log.innerHTML = '';
          }
          log.insertBefore(item, log.firstChild);
        };

        sseSource.onerror = (err) => {
          console.error("SSE Connection error:", err);
          const item = document.createElement('div');
          item.style.color = '#ef4444';
          item.innerText = 'SSE connection connection error or disconnected.';
          log.insertBefore(item, log.firstChild);
          disconnectSse();
          btn.innerText = '\u{1F534} Subscribe';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-secondary');
        };
      }
    }
  </script>

</body>
</html>
`;
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

// src/krnl/core/K_ENT_Krnl_System_Entity_Base.ts
import http2 from "http";
import net from "net";
import fs3 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";
var krnlSystemEntityBase = class extends krnlEntityBase {
  _isIngressNetworkMember = false;
  _ingressNetwork = null;
  _frontendEnabled = false;
  _frontend = null;
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
    if (options.sourcePath) {
      try {
        const resolved = options.sourcePath.startsWith("file:") ? fileURLToPath(options.sourcePath) : options.sourcePath;
        dataDir = path2.dirname(resolved);
      } catch (_) {
      }
    }
    this._entityDataDir = dataDir;
    this._documentationProvider = null;
    this._emitStartupDiagnostics();
    this._magneticLoadPromise = this._runMagneticLoader(options);
  }
  enableFrontend(options) {
    this._frontendEnabled = true;
    this._frontend = new KrnlFrontend(this, options);
  }
  async _runMagneticLoader(options = {}) {
    if (options.disableMagneticLoading) {
      return;
    }
    try {
      const { KrnlMagneticLoader } = await import("./K_LIB_Krnl_System_Magnetic_Loader-K6PV27XY.js");
      await KrnlMagneticLoader.loadAll(this, this._entityDataDir);
    } catch (err) {
      console.error(`[${this.entityName}] Magnetic loader error:`, err);
    }
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
    await this._readyPromise;
  }
  async startIngressNetwork(members) {
    this._ingressNetwork = new KrnlIngressNetwork();
    for (const config of members) {
      await this._ingressNetwork.addMember(this, config);
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
    if (!this._ingressNetwork) {
      this._ingressNetwork = new KrnlIngressNetwork();
      const discoveryPort = this.commPort > 0 ? this.commPort + 1e3 : 10101;
      await this.startDiscovery(discoveryPort);
    }
    return await this._ingressNetwork.addFrontendMember(this, { name, appPath, options });
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
  getNotFoundResponse(path3) {
    const response = {
      status: "error",
      message: `Route '${path3}' not found.`
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
    return path2.join(this._entityDataDir, `${this.entityName}.ports.json`);
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
      const dir = path2.dirname(filePath);
      if (!fs3.existsSync(dir)) {
        await fs3.promises.mkdir(dir, { recursive: true });
      }
      await fs3.promises.writeFile(filePath, snapshot);
    } catch (err) {
      Logger.error(`[${this.entityName}] Ports file write failed:`, err);
    }
  }
  /** Remove the ports snapshot file on shutdown. */
  _deletePortsFile() {
    const filePath = this._getPortsFilePath();
    try {
      if (fs3.existsSync(filePath)) {
        fs3.unlinkSync(filePath);
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
        const probe = net.createServer();
        probe.once("error", () => resolve(false));
        probe.listen(port, host, () => probe.close(() => resolve(true)));
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
    this._resolveReady();
    Logger.log(`[${this.entityName}] commPort finalized \u2192 ${actualPort}`);
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
            const probe = net.connect(assignedPort, "127.0.0.1");
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
    if (this._ingressNetwork) {
      const hostVal = this.host === "0.0.0.0" ? "localhost" : this.host;
      return this._ingressNetwork.getGrossManifest(`http://${hostVal}:${this.commPort}`);
    }
    const apiNames = [];
    const eventsNames = [];
    const api = {};
    const serializeSchema = (schema) => {
      if (!schema) return void 0;
      try {
        return zodToJsonSchema(schema);
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
    if (this._isIngressNetworkMember) return;
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
    const broadcastTarget = this.host === "127.0.0.1" ? "127.0.0.1" : discoveryHost;
    this.discoverySocket.bind(discoveryPort, this.host, () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${broadcastTarget})`);
    });
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
    await this._startSharedServer();
  }
  async _startSharedServer() {
    if (this._isIngressNetworkMember) return;
    if (this._sharedServer) return;
    const resolvedPort = await this._probeAvailablePort(this._preferredPort, this.host);
    this._sharedServer = http2.createServer();
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

export {
  krnlErrorCodes,
  krnlErrorMessages,
  CUSTOM_ERROR_CODE,
  krnlError,
  krnlGlobalEmitterAddress,
  krnlLocalEmitterAddress,
  krnlMessage,
  krnlEmitter,
  krnlCollector,
  krnlInterface,
  krnlEntityCompositionalHierarchyManager,
  telemetry,
  ObjectKit,
  krnlTransportAdapter,
  MemoryTransportAdapter,
  krnlLocalFunctionality,
  krnlRemoteFunctionality,
  krnlEntityBase,
  Logger,
  createEnum,
  krnlSystemTypes,
  krnlServiceSuites,
  defaultConnectionBehaviour,
  krnlServiceSuitePorts,
  krnlPrimitiveDataTypes,
  krnlData,
  krnlDataFactory,
  KrnlPolicy,
  WebSocketTransportAdapter,
  krnlSystemCommComponent,
  KrnlMcpProtocol,
  KrnlAcpProtocol,
  krnlUnifiedHttpAdapter,
  KrnlShell,
  KrnlIngressNetwork,
  KrnlFrontend,
  krnlSystemEntityBase
};
