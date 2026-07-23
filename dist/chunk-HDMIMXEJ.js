import {
  KrnlPolicy,
  Logger
} from "./chunk-43SQEXFM.js";
import {
  KrnlAikoClient,
  KrnlShell,
  ObjectKit
} from "./chunk-6IAIWNHQ.js";
import {
  adminCommandApi,
  aiOrchestrationApi,
  discoverPeersApi,
  findFreePortsApi,
  getAikoCatalogApi,
  getEndpointDefinitionsApi,
  getFullDocumentationApi,
  getIngressNetworkTopologyApi,
  getLastActionDocsApi,
  getManifestApi,
  getTelemetryLogApi,
  getUsedPortsApi,
  heartbeatApi,
  setEndpointDefinitionApi,
  shutdownApi,
  systemCommandsCollectorHandler,
  telemetryApi
} from "./chunk-7AB5TI5C.js";
import {
  KrnlTelemetry,
  telemetry
} from "./chunk-AHWZBXWV.js";

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
    const path4 = url.pathname;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (this.system._ingressNetwork) {
      const segments = path4.split("/").filter(Boolean);
      const prefix = segments[0]?.toLowerCase();
      if (prefix && this.system._ingressNetwork.members.has(prefix)) {
        if (segments.length === 3 && segments[1] === "frontend" && segments[2] === "default" && !path4.endsWith("/")) {
          res.writeHead(302, { "Location": path4 + "/" + url.search });
          res.end();
          return;
        }
        let subPath = "/" + segments.slice(1).join("/") + url.search;
        if (path4.endsWith("/") && !subPath.endsWith("/")) {
          subPath += "/";
        }
        await this.system._ingressNetwork.routeHttpRequest(prefix, req, res, subPath);
        return;
      }
    }
    if (this.system._ingressNetwork) {
      const segments = path4.split("/").filter(Boolean);
      if (segments[0] && segments[1] && segments[0].toLowerCase() !== "default") {
        const key = `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
        if (this.system._ingressNetwork.members.has(key)) {
          await this.system._ingressNetwork.routeHttpRequest(key, req, res, req.url || "/");
          return;
        }
      }
    }
    if (path4.startsWith("/frontend/default")) {
      if (this.system._frontend) {
        const subPath = path4.slice("/frontend/default".length) || "/";
        await this.system._frontend.handleRequest(req, res, subPath);
      } else {
        this._sendJson(res, 404, { status: "error", message: "Frontend not enabled." });
      }
      return;
    }
    const isKrnlRoute = path4.startsWith("/call/") || path4.startsWith("/sse/") || path4.startsWith("/mcp") || path4.startsWith("/acp") || path4 === "/manifest" || path4 === "/health";
    if (!isKrnlRoute) {
      if (this.enableFriendlyRouting) {
        let fid = path4.slice(1);
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
      this._sendJson(res, 404, this.system.getNotFoundResponse(path4));
      return;
    }
    try {
      if (path4.startsWith("/call/")) {
        const fid = path4.split("/")[2];
        const body = await this._readJsonBody(req);
        const result = await this.system.call(fid, body, {
          unwrap: false,
          callerPort: req.socket?.remotePort,
          accessKey: req.headers["x-krnl-access-key"]
        });
        this._sendJson(res, 200, result);
        return;
      }
      if (path4.startsWith("/sse/")) {
        const fid = path4.split("/")[2];
        this._handleSse(req, res, fid);
        return;
      }
      if (path4 === "/ai") {
        const { message } = await this._readJsonBody(req);
        if (!this.system._aiOrchestrator) {
          const { KrnlAikoClient: KrnlAikoClient2 } = await import("./K_LIB_Krnl_Aiko_Client-6SZYIG36.js");
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
      if (path4 === "/ai/manifest") {
        const agents = this.system._aiOrchestrator?.getAgentSummaries() ?? [];
        this._sendJson(res, 200, {
          aiEnabled: !!this.system._aiOrchestrator,
          aikoAlive: this.system.isAikoAlive(),
          endpoints: agents
        });
        return;
      }
      if (path4 === "/mcp") {
        const body = await this._readJsonBody(req);
        const result = await this.mcp.handleRequest(body, {
          callerPort: req.socket?.remotePort,
          accessKey: req.headers["x-krnl-access-key"]
        });
        this._sendJson(res, 200, result);
        return;
      }
      if (path4 === "/health") {
        const healthData = { status: "ok", entity: this.system.entityName };
        if (this.system._subappErrors && this.system._subappErrors.length > 0) {
          healthData.status = "issues";
          healthData.issues = this.system._subappErrors;
        }
        this._sendJson(res, 200, healthData);
        return;
      }
      if (path4.startsWith("/acp")) {
        if (path4 === "/acp/info" || path4 === "/acp") {
          this._sendJson(res, 200, this.acp.getInfo());
        } else if (path4 === "/acp/capabilities") {
          this._sendJson(res, 200, this.acp.getCapabilities());
        } else if (path4 === "/acp/messages" && req.method === "POST") {
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
      if (path4 === "/manifest") {
        if (this.system._ingressNetwork) {
          this._sendJson(res, 200, this.system._ingressNetwork.getGrossManifest(`http://${req.headers.host}`));
        } else {
          this._sendJson(res, 200, this.system.getManifest());
        }
        return;
      }
    } catch (error) {
      Logger.error(`[HttpAdapter] Fatal handler error ${path4}:`, error.message || error);
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

// src/krnl/core/K_LIB_Krnl_System_Ingress_Network.ts
import path from "path";
var KrnlIngressNetwork = class {
  members = /* @__PURE__ */ new Map();
  async addMember(admin, config) {
    const prefix = config.prefix.toLowerCase();
    if (this.members.has(prefix)) {
      throw new Error(`[IngressNetwork] Prefix '${config.prefix}' is already registered.`);
    }
    let entity;
    if (config.isKrnl === false || !config.ServiceClass) {
      const { KrnlNonKrnlAppAdapter } = await import("./K_LIB_Krnl_System_App_Adapter-N65GA7IY.js");
      const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || "");
      await adapter.startApp();
      entity = adapter;
    } else {
      const ServiceClass = config.ServiceClass;
      const memberPort = config.port ?? -1;
      const args = config.constructorArgs ?? [];
      const { subappLocalStorage } = await import("./K_LIB_Krnl_System_Magnetic_Loader-QDVXTAKS.js");
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
      memberType: "subapp"
    });
    return entity;
  }
  async addFrontendMember(admin, config) {
    const prefix = config.options?.frontendPrefix || "frontend";
    const key = `${prefix}/${config.name.toLowerCase()}`;
    if (this.members.has(key)) {
      throw new Error(`[IngressNetwork] Frontend member '${config.name}' is already registered.`);
    }
    const options = { ...config.options };
    if (!options.backendPort) {
      options.backendPort = admin.commPort;
    }
    if (!options.backendHost) {
      const rawHost = admin.host;
      options.backendHost = rawHost === "::" || rawHost === "0.0.0.0" || rawHost === "" ? "localhost" : rawHost;
    }
    const { KrnlFrontendAdapter } = await import("./K_LIB_Krnl_System_Frontend_Adapter-YBURJCDI.js");
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
    aside {
      width: 300px; border-right: 1px solid var(--border-color);
      background-color: rgba(10, 14, 23, 0.25);
      display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
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
    .main-grid { display: flex; flex-direction: column; gap: 2rem; max-width: 1100px; margin: 0 auto; }
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
    .form-textarea { font-family: var(--font-mono); min-height: 120px; resize: vertical; }
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
    <aside>
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
          <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">Select an endpoint in the sidebar to call it, view details, listen to event streams, or edit runtime specifications.</p>
          <button class="btn" onclick="refreshDefinitions()">\u{1F504} Refresh Endpoints</button>
        </div>
        <div id="telemetry-panel" class="detail-card" style="display: none;">
          <div class="endpoint-header"><div class="endpoint-title"><h2>Historical Telemetry logs</h2></div><button class="btn btn-secondary" onclick="closeTelemetryPanel()">Close</button></div>
          <div style="overflow-x: auto;"><table class="telemetry-log-table"><thead><tr><th>Time</th><th>Type</th><th>Endpoint</th><th>Latency</th><th>Success</th></tr></thead><tbody id="telemetry-log-body"><tr><td colspan="5" style="color: var(--text-muted); text-align: center;">No logs fetched yet.</td></tr></tbody></table></div>
        </div>
        <div id="endpoint-panel" class="detail-card" style="display: none;"></div>
      </div>
    </main>
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
      let tabsHtml = isApp ? \`<div class="tab-bar"><button class="tab-btn \${activeTab === 'call' ? 'active' : ''}" onclick="switchTab('call')">Call Endpoint</button><button class="tab-btn \${activeTab === 'edit' ? 'active' : ''}" onclick="switchTab('edit')">Edit Definition</button></div>\` : '';
      if (!isApp) activeTab = 'call';
      const contentHtml = activeTab === 'call' ? renderCallTab(def) : renderEditTab(def);
      panel.innerHTML = \`<div class="endpoint-header"><div class="endpoint-title"><h2>\${def.id} <span class="category-badge \${badgeClass}">\${def.category}</span></h2><div style="color: var(--text-muted); font-size: 0.95rem;">\${def.description || ''}</div></div></div>\${tabsHtml}\${contentHtml}\`;
      if (activeTab === 'call' && def.examplePayload) loadExamplePayload(def.examplePayload);
    }

    function renderCallTab(def) {
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
    });
  </script>
</body>
</html>`;
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
  constructor(system, aikoClient, tracker, scheduler, routingSpec, escalationSpec, store) {
    this.system = system;
    this.aikoClient = aikoClient;
    this.tracker = tracker;
    this.scheduler = scheduler;
    this.routingSpec = routingSpec;
    this.escalationSpec = escalationSpec;
    this.store = store;
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
    const systemPrompt = `You are the system orchestrator resolving a failure.
Endpoint: ${failedEndpointId}
Purpose: ${agent.definition.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.definition.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

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
      const learning = `Request "${request}" failed due to "${reason}". Resolved with payload: ${JSON.stringify(payload)}`;
      await this.store.appendEndpointMemory(failedEndpointId, learning);
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
      const learning = `Request "${request}" failed due to "${reason}". Escalation also failed with "${e.message}".`;
      await this.store.appendEndpointMemory(failedEndpointId, learning);
      throw e;
    }
  }
};

// src/krnl/core/K_LIB_Krnl_Runtime_Store.ts
import fs from "fs";
import path2 from "path";
var KrnlRuntimeStore = class {
  filePath;
  data = {
    endpointDefinitions: {},
    endpointMemories: {},
    orchestratorMemory: { memory: "", lastUpdated: 0 },
    telemetryLog: []
  };
  constructor(appRoot) {
    this.filePath = path2.join(appRoot, "krnl_runtime_state.db");
  }
  async load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.endpointDefinitions) this.data.endpointDefinitions = {};
        if (!this.data.endpointMemories) this.data.endpointMemories = {};
        if (!this.data.orchestratorMemory) this.data.orchestratorMemory = { memory: "", lastUpdated: 0 };
        if (!this.data.telemetryLog) this.data.telemetryLog = [];
      } else {
        await this.save();
      }
    } catch (e) {
      console.error("[KrnlRuntimeStore] Failed to load store, initializing empty:", e);
      this.data = {
        endpointDefinitions: {},
        endpointMemories: {},
        orchestratorMemory: { memory: "", lastUpdated: 0 },
        telemetryLog: []
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
  async save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
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
    const toolsDesc = Object.entries(this.tools).map(([name, tool]) => `- ${name}: ${tool.description || "Agent helper tool"}`).join("\n");
    return `You are an endpoint agent representing the raw endpoint "${this.definition.id}".
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
    return JSON.parse(cleaned.trim());
  }
  validatePayload(payload) {
    const functionality = this.system.localFunctionalities.get(this.definition.id);
    if (!functionality || !functionality.schema || !functionality.schema.input) {
      return { valid: true };
    }
    try {
      const schemaInput = functionality.schema.input;
      if (typeof schemaInput.parse === "function") {
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
import http2 from "http";
import net from "net";
import fs2 from "fs";
import path3 from "path";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";
var krnlSystemEntityBase = class extends krnlEntityBase {
  _isIngressNetworkMember = false;
  _ingressNetwork = null;
  _frontendEnabled = false;
  _frontend = null;
  _isSubApp = false;
  systemType;
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
        const resolved = options.sourcePath.startsWith("file:") ? fileURLToPath(options.sourcePath) : options.sourcePath;
        dataDir = path3.dirname(resolved);
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
      const { KrnlMagneticLoader } = await import("./K_LIB_Krnl_System_Magnetic_Loader-QDVXTAKS.js");
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
  getNotFoundResponse(path4) {
    const response = {
      status: "error",
      message: `Route '${path4}' not found.`
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
    return path3.join(this._entityDataDir, `${this.entityName}.ports.json`);
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
      const dir = path3.dirname(filePath);
      if (!fs2.existsSync(dir)) {
        await fs2.promises.mkdir(dir, { recursive: true });
      }
      await fs2.promises.writeFile(filePath, snapshot);
    } catch (err) {
      Logger.error(`[${this.entityName}] Ports file write failed:`, err);
    }
  }
  /** Remove the ports snapshot file on shutdown. */
  _deletePortsFile() {
    const filePath = this._getPortsFilePath();
    try {
      if (fs2.existsSync(filePath)) {
        fs2.unlinkSync(filePath);
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
    await this._registerWithRegistry(actualPort);
    this._resolveReady();
    Logger.log(`[${this.entityName}] commPort finalized \u2192 ${actualPort}`);
  }
  async _registerWithRegistry(actualPort) {
    if (this._isIngressNetworkMember) return;
    if (!this._registryClient) {
      const { KrnlRegistryClient } = await import("./K_LIB_Krnl_Registry_Client-BEOUAE6N.js");
      this._registryClient = new KrnlRegistryClient(10099);
    }
    if (actualPort === 10099) {
      console.log(`[${this.entityName}] Self-promoting to central registry host.`);
      this._registryApps = /* @__PURE__ */ new Map();
      const { registerAppApi, deregisterAppApi, heartbeatAppApi, lookupAppApi, listAppsApi } = await import("./K_LIB_Krnl_System_Base_Functionality_APIs-Q4TQQOT2.js");
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
      const { buildEndpointDefinition } = await import("./K_LIB_Krnl_System_Base_Functionality_APIs-Q4TQQOT2.js");
      const { KrnlEpTools } = await import("./K_LIB_Krnl_Ep_Tools-P4Y66M2O.js");
      for (const [fid, fn] of this.localFunctionalities.entries()) {
        if (fid === "ai" || fid === "setEndpointDefinition" || fid === "getEndpointDefinitions" || fid === "getTelemetryLog" || fid === "getAikoCatalog") continue;
        const override = overrides[fid] || null;
        const isEnabled = override?.intelligenceSpec || fn.ai?.enabled || fn.ai;
        if (!isEnabled) continue;
        const mem = await this._aiProfilesStore.getEndpointMemory(fid);
        const definition = buildEndpointDefinition(fn, this, override, mem);
        this._aiTracker.register(fid, definition, fn);
        const mergedTools = { ...KrnlEpTools };
        if (definition.agentTools && Array.isArray(definition.agentTools)) {
          for (const toolId of definition.agentTools) {
            if (this.localFunctionalities.has(toolId) || this.remoteFunctionalities.has(toolId)) {
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
  WebSocketTransportAdapter,
  krnlSystemCommComponent,
  KrnlMcpProtocol,
  KrnlAcpProtocol,
  krnlUnifiedHttpAdapter,
  KrnlIngressNetwork,
  KrnlFrontend,
  KrnlWatchVariablesTracker,
  KrnlEndpointScheduler,
  KrnlApplicationOrchestrator,
  KrnlRuntimeStore,
  KrnlEndpointAgent,
  krnlSystemEntityBase
};
