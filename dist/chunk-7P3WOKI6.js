import {
  KrnlAikoClient,
  KrnlShell,
  ObjectKit
} from "./chunk-7Q2FYUWU.js";
import {
  adminCommandApi,
  aiOrchestrationApi,
  discoverPeersApi,
  findFreePortsApi,
  getAikoCatalogApi,
  getEndpointDefinitionsApi,
  getFullDocumentationApi,
  getLastActionDocsApi,
  getManifestApi,
  getSiblingNetworkTopologyApi,
  getSubAppTopologyApi,
  getTaskListApi,
  getTelemetryLogApi,
  getUsedPortsApi,
  heartbeatApi,
  setEndpointDefinitionApi,
  shutdownApi,
  systemCommandsCollectorHandler,
  telemetryApi
} from "./chunk-SFVDKJHO.js";
import {
  KrnlTelemetry,
  telemetry
} from "./chunk-AHWZBXWV.js";
import {
  krnlUnifiedHttpAdapter
} from "./chunk-HYQVHWBJ.js";
import {
  KrnlPolicy,
  Logger
} from "./chunk-43SQEXFM.js";

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
  ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504,
  ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505
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
  [krnlErrorCodes.ERR_COM_INGRESS_ROUTE_NOT_FOUND]: "ERR_COM_INGRESS_ROUTE_NOT_FOUND",
  [krnlErrorCodes.ERR_KRNL_UNRESOLVED_REMOTE_TARGET]: "ERR_KRNL_UNRESOLVED_REMOTE_TARGET"
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

// src/krnl/core/krnl_pb.js
import $protobuf from "protobufjs/minimal.js";
var $Reader = $protobuf.Reader;
var $Writer = $protobuf.Writer;
var $util = $protobuf.util;
var $Object = $util.global.Object;
var $undefined = $util.global.undefined;
var $Error = $util.global.Error;
var $TypeError = $util.global.TypeError;
var $String = $util.global.String;
var $Number = $util.global.Number;
var $parseInt = $util.global.parseInt;
var $BigInt = $util.global.BigInt;
var $Array = $util.global.Array;
var $Boolean = $util.global.Boolean;
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
var krnl = $root.krnl = (() => {
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
      return KrnlMessage.toObject(this, $protobuf.util.toJSONOptions);
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
      return RpcResponse.toObject(this, $protobuf.util.toJSONOptions);
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
            let msg;
            const rawStr = raw.toString().trim();
            if (rawStr.startsWith("{") && rawStr.endsWith("}")) {
              const parsed = JSON.parse(rawStr);
              msg = {
                isJson: true,
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
    const sendResp = (ok, resultOrErr) => {
      if (msg.isJson) {
        const resp = {
          kind: "rpc-response",
          requestId,
          ok,
          ...ok ? { result: resultOrErr } : { error: typeof resultOrErr === "string" ? resultOrErr : resultOrErr.message }
        };
        ws.send(JSON.stringify(resp));
      } else {
        const rpcResp = krnl.RpcResponse.encode({
          requestId,
          ok,
          ...ok ? { jsonResult: JSON.stringify(resultOrErr) } : { error: typeof resultOrErr === "string" ? resultOrErr : resultOrErr.message, errorDocumentation: resultOrErr.errorDocumentation || "" }
        }).finish();
        const envelope = krnl.KrnlMessage.encode({
          kind: krnl.MessageKind.RPC_RESPONSE,
          requestId,
          binaryPayload: rpcResp
        }).finish();
        ws.send(envelope);
      }
    };
    const handler = this._wsRpcHandlers.get(method);
    if (!handler) {
      sendResp(false, `Unknown RPC method: ${method}`);
      return;
    }
    try {
      const result = await handler(params, { callerPort });
      sendResp(true, result);
    } catch (e) {
      sendResp(false, e);
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

// src/krnl/core/K_LIB_Krnl_System_Ingress_Network.ts
import path from "path";
var KrnlSiblingNetwork = class {
  members = /* @__PURE__ */ new Map();
  /**
   * addMember — adds a standalone sibling KrnlTS application to the peer network.
   *
   * The sibling is instantiated and its port is registered in the admin's port registry.
   * Unlike sub-apps, siblings start their own networking and are independently addressable.
   *
   * ⚠ Do not call this for sub-apps. Use entity.loadSubApps() instead.
   */
  async addMember(admin, config) {
    const prefix = config.prefix.toLowerCase();
    if (this.members.has(prefix)) {
      console.log(`[SiblingNetwork] Member prefix '${prefix}' already registered. Returning existing entity.`);
      return this.members.get(prefix).entity;
    }
    let entity;
    if (config.isKrnl === false || !config.ServiceClass) {
      const { KrnlNonKrnlAppAdapter } = await import("./K_LIB_Krnl_System_App_Adapter-DJWOGS65.js");
      const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || "");
      await adapter.startApp();
      entity = adapter;
    } else {
      const ServiceClass = config.ServiceClass;
      const memberPort = config.port ?? -1;
      const args = config.constructorArgs ?? [];
      const { subappLocalStorage } = await import("./K_LIB_Krnl_System_Magnetic_Loader-5WIM4XDC.js");
      const appDir = config.entryPath ? path.dirname(config.entryPath) : "";
      entity = await subappLocalStorage.run({ appPath: appDir }, async () => {
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
      memberType: "sibling"
    });
    return entity;
  }
  /**
   * removeMember — removes a sibling from the peer network.
   */
  async removeMember(admin, prefix) {
    const key = prefix.toLowerCase();
    const entry = this.members.get(key);
    if (!entry) return false;
    await admin.unregisterPort(key);
    admin.hierarchyManager.disposeComponentEntity(entry.entity.id);
    this.members.delete(key);
    return true;
  }
  /**
   * getGrossManifest — returns a listing of all siblings and their manifest endpoints.
   */
  getGrossManifest(adminBaseUrl) {
    const list = Array.from(this.members.entries()).map(([prefix, entry]) => ({
      prefix,
      entityName: entry.entity.entityName,
      manifestEndpoint: `${adminBaseUrl}/${prefix}/manifest`
    }));
    return {
      type: "SiblingNetworkManifest",
      members: list
    };
  }
  /**
   * getAggregatedMcpTools — collects public MCP tool definitions from all siblings.
   */
  getAggregatedMcpTools() {
    const allTools = [];
    for (const [prefix, entry] of this.members.entries()) {
      const manifest = entry.entity.getManifest();
      const apis = manifest?.inputs?.api || {};
      for (const fid of Object.keys(apis)) {
        const api = apis[fid];
        if (api.visibility === "public") {
          allTools.push({
            name: `${prefix}.${fid}`,
            description: api.description || `MCP Tool for ${entry.entity.entityName} functionality: ${fid}`,
            inputSchema: api.schema?.input || { type: "object" }
          });
        }
      }
    }
    return allTools;
  }
  /**
   * routeHttpRequest — routes an incoming HTTP request to the correct sibling's handler.
   * The sibling's own unifiedHttpAdapter handles the request in-process.
   */
  async routeHttpRequest(prefix, req, res, subPath) {
    const entry = this.members.get(prefix.toLowerCase());
    if (!entry) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `Sibling network member '${prefix}' not found.` }));
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
var KrnlIngressNetwork = KrnlSiblingNetwork;

// src/krnl/core/K_LIB_Krnl_System_Frontend.ts
import fs from "fs";
import path2 from "path";
var KrnlFrontend = class {
  system;
  options;
  frontendDir;
  subAppFrontendDirs = /* @__PURE__ */ new Map();
  interactionsHistory = [];
  constructor(system, options = {}) {
    this.system = system;
    this.options = {
      title: system.entityName,
      theme: "dark",
      enableMonitoringApi: true,
      ...options
    };
    this.frontendDir = options.frontendDir || path2.join(system._entityDataDir, "frontend");
  }
  registerSubAppFrontend(prefix, subFrontendDir) {
    this.subAppFrontendDirs.set(prefix.toLowerCase(), subFrontendDir);
    console.log(`[KrnlFrontend] Registered sub-app frontend '${prefix}' -> ${subFrontendDir}`);
  }
  async handleRequest(req, res, subpath) {
    const rawPath = subpath.split("?")[0];
    const normalized = rawPath.replace(/\/$/, "") || "/";
    if ((normalized === "/" || normalized === "/index.html") && req.method === "GET") {
      const htmlPath = path2.join(this.frontendDir, "index.html");
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(htmlPath));
        return;
      }
    }
    if (normalized === "/bundle.js" && req.method === "GET") {
      const bundlePath = path2.join(this.frontendDir, "dist", "bundle.js");
      if (fs.existsSync(bundlePath)) {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(fs.readFileSync(bundlePath));
        return;
      }
      res.writeHead(404, { "Content-Type": "application/javascript" });
      res.end("/* bundle.js not found. Ensure frontend component generation & build completed. */");
      return;
    }
    if (normalized === "/styles.css" && req.method === "GET") {
      const cssPath = path2.join(this.frontendDir, "index.css");
      if (fs.existsSync(cssPath)) {
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(fs.readFileSync(cssPath));
        return;
      }
      res.writeHead(404, { "Content-Type": "text/css" });
      res.end("/* styles.css not found */");
      return;
    }
    if (normalized.startsWith("/subapps/")) {
      const parts = normalized.split("/").filter(Boolean);
      const prefix = parts[1]?.toLowerCase();
      const subDir = this.subAppFrontendDirs.get(prefix);
      if (subDir && fs.existsSync(subDir)) {
        const fileRel = parts.slice(2).join("/");
        if (fileRel === "styles.css") {
          const cssPath = path2.join(this.frontendDir, "index.css");
          if (fs.existsSync(cssPath)) {
            res.writeHead(200, { "Content-Type": "text/css" });
            res.end(fs.readFileSync(cssPath));
            return;
          }
        }
        if (!fileRel || fileRel === "index.html") {
          const subHtml = path2.join(subDir, "index.html");
          if (fs.existsSync(subHtml)) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(fs.readFileSync(subHtml));
            return;
          }
        }
        if (fileRel === "bundle.js") {
          const subBundle = path2.join(subDir, "dist", "bundle.js");
          if (fs.existsSync(subBundle)) {
            res.writeHead(200, { "Content-Type": "application/javascript" });
            res.end(fs.readFileSync(subBundle));
            return;
          }
        }
        const assetPath = path2.join(subDir, fileRel);
        if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
          res.writeHead(200);
          res.end(fs.readFileSync(assetPath));
          return;
        }
      }
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `Sub-app frontend asset '${normalized}' not found.` }));
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
    res.end(JSON.stringify({ status: "error", message: `Frontend route '${subpath}' not found` }));
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

// src/krnl/core/K_LIB_Krnl_Watch_Variables_Tracker.ts
var KrnlWatchVariablesTracker = class {
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

// src/krnl/core/K_LIB_Krnl_Endpoint_Scheduler.ts
var KrnlEndpointScheduler = class {
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

// src/krnl/core/K_LIB_Krnl_Task_Runner.ts
var KrnlTaskList = class _KrnlTaskList {
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
var KrnlTaskRunner = class {
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

// src/krnl/core/K_LIB_Krnl_Ai_Concepts.ts
var KrnlPlannerSpec = {
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

// src/krnl/core/K_LIB_Krnl_Planner_Agent.ts
var KrnlPlannerAgent = class {
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

// src/krnl/core/K_LIB_Krnl_Application_Orchestrator.ts
var KrnlApplicationOrchestrator = class {
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

// src/krnl/core/K_LIB_Krnl_Runtime_Store.ts
import fs2 from "fs";
import path3 from "path";
var KrnlRuntimeStore = class {
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
    this.filePath = path3.join(appRoot, "krnl_runtime_state.db");
  }
  async load() {
    try {
      if (fs2.existsSync(this.filePath)) {
        const raw = fs2.readFileSync(this.filePath, "utf-8");
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
      fs2.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("[KrnlRuntimeStore] Failed to save store:", e);
    }
  }
};

// src/krnl/core/K_LIB_Krnl_Endpoint_Agent.ts
var KrnlEndpointAgent = class {
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

// src/krnl/core/K_ENT_Krnl_System_Entity_Base.ts
import http from "http";
import net from "net";
import fs3 from "fs";
import path4 from "path";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";
var krnlSystemEntityBase = class extends krnlEntityBase {
  /**
   * _isIngressNetworkMember — true when this entity is a SIBLING of another standalone app
   * inside a KrnlSiblingNetwork (formerly IngressNetwork).
   * NOT set for embedded sub-apps; those use _isSubApp instead.
   */
  _isIngressNetworkMember = false;
  /**
   * _siblingNetwork — the sibling-app peer network this entity administers (if any).
   * Used exclusively for connecting independent standalone KrnlTS apps.
   * NEVER used for sub-apps embedded inside this entity.
   */
  _siblingNetwork = null;
  /** @deprecated Use _siblingNetwork. Alias kept for backward compatibility. */
  get _ingressNetwork() {
    return this._siblingNetwork;
  }
  set _ingressNetwork(v) {
    this._siblingNetwork = v;
  }
  _frontendEnabled = false;
  _frontend = null;
  /**
   * _isSubApp — true when this entity is embedded inside a parent KrnlTS application.
   * When true:
   *   - Networking (HTTP / WebSocket) is suppressed; _startSharedServer() returns early.
   *   - Registry registration is skipped.
   *   - All communication goes through the parent's callInternal() or MessagePort transport.
   */
  _isSubApp = false;
  /**
   * _subAppRegistry — registry of sub-apps embedded in this entity.
   * Populated by loadSubApps(). Keys are lowercase prefix strings.
   */
  _subAppRegistry = /* @__PURE__ */ new Map();
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
    "getSiblingNetworkTopology",
    "getSubAppTopology",
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
    import("./K_LIB_Krnl_Registry_Client-BEOUAE6N.js").then(({ KrnlRegistryClient }) => {
      this._registryClient = new KrnlRegistryClient(10099);
    }).catch(() => {
    });
    this._readyPromise = new Promise(async (resolve) => {
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
        const resolved = options.sourcePath.startsWith("file:") ? fileURLToPath(options.sourcePath) : options.sourcePath;
        dataDir = path4.dirname(resolved);
      } catch (_) {
      }
    }
    this._entityDataDir = dataDir;
    console.log(`[KRNL_DATA_DIR] Entity: ${this.entityName}, DataDir: ${this._entityDataDir}, subappStore: ${JSON.stringify(subappStore)}`);
    this._documentationProvider = null;
    this._emitStartupDiagnostics();
    this._isSubApp = !!subappStore;
    if (this._isSubApp) {
      this._resolveReady();
    }
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
      const { KrnlMagneticLoader } = await import("./K_LIB_Krnl_System_Magnetic_Loader-5WIM4XDC.js");
      await KrnlMagneticLoader.loadAll(this, this._entityDataDir);
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
    if (this._magneticLoadPromise) {
      await this._magneticLoadPromise;
    }
    await this._readyPromise;
  }
  /**
   * Validates requiredRemotes manifest dependencies upon boot
   */
  async _validateBootManifestDependencies() {
    try {
      const manifestPath = path4.join(this._entityDataDir, "krnl.json");
      if (!fs3.existsSync(manifestPath)) return;
      const content = fs3.readFileSync(manifestPath, "utf-8");
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
  // ── Sub-App Loading (Internal Embedded Components) ─────────────────────────
  /**
   * loadSubApps
   *
   * Embeds one or more KrnlTS applications as internal sub-apps of this entity.
   * Sub-apps run without any networking stack — they communicate exclusively via
   * direct in-process method calls (local mode) or worker_threads MessagePort (worker mode).
   *
   * The execution mode for each sub-app is determined by the parent's krnl.json
   * and should already be set on each config object before calling this method.
   * MagneticLoader populates this automatically.
   *
   * Sub-apps are registered in _subAppRegistry and can be called via callInternal().
   *
   * ⚠ Do NOT use startIngressNetwork() for sub-apps. That method is for connecting
   *   independent standalone applications in a sibling peer network.
   */
  async loadSubApps(configs) {
    const { KrnlSubAppLoader } = await import("./K_LIB_Krnl_SubApp_Registry-5LEKPTDW.js");
    for (const config of configs) {
      try {
        await KrnlSubAppLoader.load(this, config);
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error(`[SubAppRegistry] Failed to load sub-app '${config.prefix}':`, errMsg);
        this._subappErrors = this._subappErrors || [];
        this._subappErrors.push({ subapp: config.prefix, error: errMsg });
      }
    }
  }
  /**
   * callInternal
   *
   * Dispatch a functionality call to an embedded sub-app (or self) with zero network overhead.
   *
   * For local-mode sub-apps: direct in-process method call.
   * For worker-mode sub-apps: MessagePort IPC — no HTTP, no TCP.
   *
   * Usage from a functionality:
   *   const result = await entity.callInternal('subAppPrefix', 'functionalityId', inputData);
   */
  async callInternal(prefix, fid, input = {}) {
    if (prefix.toLowerCase() === this.entityName.toLowerCase()) {
      return await this.call(fid, input);
    }
    const entry = this._subAppRegistry.get(prefix.toLowerCase());
    if (!entry) {
      throw new Error(
        `[${this.entityName}] callInternal: sub-app '${prefix}' is not registered. Available: [${Array.from(this._subAppRegistry.keys()).join(", ")}]`
      );
    }
    return await entry.entity.call(fid, input);
  }
  /**
   * getSubAppTopology
   *
   * Returns a snapshot of all embedded sub-apps registered in this entity,
   * including their execution mode and registration time.
   */
  getSubAppTopology() {
    if (this._subAppRegistry.size === 0) return null;
    return {
      parent: this.entityName,
      subApps: Array.from(this._subAppRegistry.entries()).map(([prefix, entry]) => ({
        prefix,
        executionMode: entry.executionMode,
        addedAt: entry.addedAt,
        entityName: entry.entity.entityName ?? prefix
      }))
    };
  }
  // ── Sibling Network (formerly Ingress Network) ───────────────────────────────
  //
  // The sibling network connects INDEPENDENT standalone KrnlTS applications that each
  // have their own networking stack. It is NOT for embedding sub-apps.
  // Use loadSubApps() + callInternal() for internal components instead.
  /**
   * startSiblingNetwork (formerly startIngressNetwork)
   *
   * Configures a sibling peer network of independent standalone KrnlTS applications.
   * Each sibling is a full KrnlTS app with its own HTTP/WS server.
   *
   * ⚠ Do NOT call this to host sub-apps. Use loadSubApps() for embedded components.
   */
  async startSiblingNetwork(members) {
    this._siblingNetwork = new KrnlSiblingNetwork();
    for (const config of members) {
      try {
        await this._siblingNetwork.addMember(this, config);
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error(`[SiblingNetwork] Failed to add sibling '${config.prefix}':`, errMsg);
      }
    }
  }
  /**
   * startIngressNetwork — preserved as alias for backward compatibility.
   * @deprecated Use startSiblingNetwork() for connecting standalone sibling apps.
   *             Use loadSubApps() for embedding sub-apps inside this entity.
   */
  async startIngressNetwork(members) {
    return this.startSiblingNetwork(members);
  }
  /**
   * joinSiblingNetwork (formerly joinIngressNetwork)
   * Adds a single sibling to the peer network.
   */
  async joinSiblingNetwork(config) {
    if (!this._siblingNetwork) {
      this._siblingNetwork = new KrnlSiblingNetwork();
    }
    return await this._siblingNetwork.addMember(this, config);
  }
  /** @deprecated Use joinSiblingNetwork(). */
  async joinIngressNetwork(config) {
    return this.joinSiblingNetwork(config);
  }
  /**
   * getSiblingNetworkTopology (formerly getIngressNetworkTopology)
   *
   * Returns the topology of the sibling peer network (standalone apps only).
   * This is NOT related to embedded sub-apps — use getSubAppTopology() for those.
   */
  getSiblingNetworkTopology() {
    if (!this._siblingNetwork) return null;
    const members = Array.from(this._siblingNetwork.members.entries()).map(([prefix, entry]) => ({
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
  /** @deprecated Use getSiblingNetworkTopology(). Alias kept for backward compatibility. */
  getIngressNetworkTopology() {
    return this.getSiblingNetworkTopology();
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
  getNotFoundResponse(path5) {
    const response = {
      status: "error",
      message: `Route '${path5}' not found.`
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
    return path4.join(this._entityDataDir, `${this.entityName}.ports.json`);
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
      const dir = path4.dirname(filePath);
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
    if (this._isSubApp || this._isIngressNetworkMember) return;
    if (!this._registryClient) {
      const { KrnlRegistryClient } = await import("./K_LIB_Krnl_Registry_Client-BEOUAE6N.js");
      this._registryClient = new KrnlRegistryClient(10099);
    }
    if (actualPort === 10099) {
      console.log(`[${this.entityName}] Self-promoting to central registry host.`);
      this._registryApps = /* @__PURE__ */ new Map();
      const { registerAppApi, deregisterAppApi, heartbeatAppApi, lookupAppApi, listAppsApi } = await import("./K_LIB_Krnl_System_Base_Functionality_APIs-LS3IJGB4.js");
      this.addLocal({ id: "registerApp", api: registerAppApi(this) });
      this.addLocal({ id: "deregisterApp", api: deregisterAppApi(this) });
      this.addLocal({ id: "heartbeatApp", api: heartbeatAppApi(this) });
      this.addLocal({ id: "lookupApp", api: lookupAppApi(this) });
      this.addLocal({ id: "listApps", api: listAppsApi(this) });
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
    if (this._isSubApp || this._isIngressNetworkMember) return;
    if (this._sharedServer) return;
    const resolvedPort = await this._probeAvailablePort(this._preferredPort, this.host);
    this._sharedServer = http.createServer();
    if (!this.unifiedHttpAdapter) {
      const { krnlUnifiedHttpAdapter: krnlUnifiedHttpAdapter2 } = await import("./K_LIB_Krnl_System_Unified_Http_Adapter-4BU3GOHO.js");
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
      id: "getSiblingNetworkTopology",
      description: "Returns the topology of the sibling peer network (for standalone KrnlTS apps only). Not related to sub-apps.",
      api: getSiblingNetworkTopologyApi(this)
    });
    this.addLocal({
      id: "getSubAppTopology",
      description: "Returns a snapshot of all embedded sub-apps and their execution modes (local or worker).",
      api: getSubAppTopologyApi(this)
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
      import("./K_LIB_Krnl_Telemetry-56UYKJIB.js").then(({ telemetry: telemetry3 }) => {
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
      const { buildEndpointDefinition } = await import("./K_LIB_Krnl_System_Base_Functionality_APIs-LS3IJGB4.js");
      const { KrnlEpTools } = await import("./K_LIB_Krnl_Ep_Tools-BETNQF2L.js");
      for (const [fid, fn] of this.localFunctionalities.entries()) {
        if (fid === "ai" || fid === "setEndpointDefinition" || fid === "getEndpointDefinitions" || fid === "getTelemetryLog" || fid === "getAikoCatalog") continue;
        const override = overrides[fid] || null;
        const isEnabled = override?.intelligenceSpec || fn.ai?.enabled || fn.ai;
        if (!isEnabled) continue;
        const mem = await this._aiProfilesStore.getEndpointMemory(fid);
        const definition = buildEndpointDefinition(fn, this, override, mem);
        this._aiTracker.register(fid, definition, fn);
        const mergedTools = {};
        if (definition.agentTools && Array.isArray(definition.agentTools)) {
          const addAllBuiltins = definition.agentTools.includes("*");
          if (addAllBuiltins) {
            Object.assign(mergedTools, KrnlEpTools);
          }
          for (const toolId of definition.agentTools) {
            if (toolId === "*") continue;
            if (KrnlEpTools[toolId]) {
              mergedTools[toolId] = KrnlEpTools[toolId];
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
  krnlTransportAdapter,
  MemoryTransportAdapter,
  krnlLocalFunctionality,
  krnlRemoteFunctionality,
  krnlEntityBase,
  krnl,
  WebSocketTransportAdapter,
  krnlSystemCommComponent,
  KrnlSiblingNetwork,
  KrnlIngressNetwork,
  KrnlFrontend,
  KrnlWatchVariablesTracker,
  KrnlEndpointScheduler,
  KrnlTaskList,
  KrnlTaskRunner,
  KrnlPlannerAgent,
  KrnlApplicationOrchestrator,
  KrnlRuntimeStore,
  KrnlEndpointAgent,
  krnlSystemEntityBase
};
