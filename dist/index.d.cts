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
function createEnum(typeNames) {
  const enumObj = Object.create(EnumTemplate);
  enumObj.types = typeNames;
  typeNames.forEach((name, index) => {
    enumObj[name] = index;
  });
  return Object.freeze(enumObj);
}

//////////////////////////////////////// KRNL SYSTEM TYPES ////////////////////////////////////////
const krnlSystemTypes = Object.freeze(
  createEnum(["qwnsr", "brnda", "symba", "mosy"])
);

//////////////////////////////////////// KRNL PRIMITIVE DATA TYPES ////////////////////////////////////////
const krnlPrimitiveDataTypes = Object.freeze(
  createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"])
);

//////////////////////////////////////// KRNL DATA ////////////////////////////////////////
class krnlData {
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
}
//////////////////////////////////////// KRNL DATA FACTORY ////////////////////////////////////////
class krnlDataFactory {
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

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Error_Concepts.js
 * @description Defines the system-wide error codes, messages, and typed error class for the Krnl ecosystem.
 * This file does not have dependencies.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// ERROR CODES ////////////////////////////////////////
/**
 * Krnl System Error Codes.
 * Integer-based for cross-platform portability (Go, C++, Rust).
 */
const krnlErrorCodes = Object.freeze({
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

  // Interface errors (300-399)
  EMITTER_NOT_FOUND: 300,
  COLLECTOR_NOT_FOUND: 301,
  COLLECTOR_NOT_SUBSCRIBED: 302,

  // Hierarchy errors (400-499)
  ENTITY_NOT_FOUND: 400,
});

//////////////////////////////////////// ERROR MESSAGES ////////////////////////////////////////
/**
 * Map of Error Codes to human-readable messages.
 */
const krnlErrorMessages = Object.freeze({
  // Enum
  [krnlErrorCodes.ENUM_ID_NOT_FOUND]:
    "Enum: ID not found. The requested enum type is not defined.",

  // State
  [krnlErrorCodes.STATE_NOT_FOUND]:
    "State: No state found with the given name.",
  [krnlErrorCodes.STATE_DUPLICATE_NAME]:
    "State: A state with this name already exists.",
  [krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE]:
    "State: Index is out of range of the states array.",

  // Functionality
  [krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED]:
    "Functionality: The requested functionality is not defined.",
  [krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED]:
    "Functionality: A functionality with this name is already defined.",
  [krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND]:
    "Functionality: The requested functionality instance was not found.",

  // Interface
  [krnlErrorCodes.EMITTER_NOT_FOUND]:
    "Interface: No emitter found with the given name.",
  [krnlErrorCodes.COLLECTOR_NOT_FOUND]:
    "Interface: No collector found with the given name.",
  [krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED]:
    "Interface: Collector is not subscribed to any emitter.",

  // Hierarchy
  [krnlErrorCodes.ENTITY_NOT_FOUND]:
    "Hierarchy: No entity found with the given name.",
});

//////////////////////////////////////// KRNL ERROR ////////////////////////////////////////
/**
 * Typed error class for the Krnl system.
 * Always carries an integer error code for programmatic handling.
 */
class krnlError extends Error {
  constructor(code) {
    super(krnlErrorMessages[code] ?? `Unknown error (code: ${code})`);
    this.code = code;
    this.errorMessage = this.message;
  }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Messaging_Concepts.js
 * @description Core classes for messaging and communication between entities in the Krnl system.
 */


///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL GLOBAL EMITTER ADDRESS ////////////////////////////////////////
class krnlGlobalEmitterAddress {
  systemID = 0; // ["qwnsr", "brnda", "symba", "mosy"]
  subSystemID = 0; // ["qwnsrControl", "qwnsrBlocks"], other options for other systems.
  entityAddress = []; // nesting of type => entity36{entity45{entity67}} = [36,45,67]
  emitterID = 0;
}

//////////////////////////////////////// KRNL LOCAL EMITTER ADDRESS ////////////////////////////////////////
class krnlLocalEmitterAddress {
  isOwnerEntity = true; // simply an address to the owner of the current entity if true. else address directed to sibling
  siblingID = 0;
  emitterID = 0;
}

//////////////////////////////////////// KRNL MESSAGE ////////////////////////////////////////
class krnlMessage {
  data = null;
  time = { day: 0, hour: 0, minute: 0, seconds: 0, millisecond: 0 };
}

//////////////////////////////////////// KRNL MESSAGE STREAM ////////////////////////////////////////
class krnlMessageStream {
  #queue = [];
  #waiters = [];

  push(message) {
    if (this.#waiters.length > 0) {
      const resolve = this.#waiters.shift();
      resolve(message);
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
}

//////////////////////////////////////// KRNL EMITTER ////////////////////////////////////////
class krnlEmitter {
  constructor() {
    this.stream = new krnlMessageStream();
    this.subscribers = [];
    this.localAddress = null;
  }

  /**
   * Pushes data into the emitter's stream and notifies all subscribers.
   * @param {*} data - The data payload.
   * @param {object} [time={}] - Optional time metadata.
   * @param {function} [transform=(msg)=>msg] - Optional message transform.
   */
  pushDataStreamToEmitter(data, time = {}, transform = (msg) => msg) {
    const msg = new krnlMessage();
    msg.data = data;
    Object.assign(msg.time, time);
    const transformed = transform(msg);
    this.stream.push(transformed);
    // Notify all direct subscribers
    for (let i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i](transformed);
    }
  }

  /**
   * Subscribes a handler to this emitter. Handler is called on every push.
   * @param {function(krnlMessage): void} handler - Callback for each message.
   * @returns {function(): void} Unsubscribe function.
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
   * @param {function(krnlMessage): void} handler
   * @returns {function(): void}
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
}

//////////////////////////////////////// KRNL COLLECTOR ////////////////////////////////////////
class krnlCollector {
  constructor() {
    this.emitter = null;
    this.unsubscribe = null;
  }

  /**
   * Subscribes this collector to an emitter. Messages are forwarded to the handler.
   * @param {krnlEmitter} emitter - The emitter to subscribe to.
   * @param {function(krnlMessage): void} handler - Callback for each message.
   * @returns {function(): void} Unsubscribe function.
   */
  subscribeTo(emitter, handler = null, options = {}) {
    const { mode = "stream" } = options;
    const resolvedHandler = typeof handler === "function"
      ? handler
      : (msg) => {
          if (typeof this._directHandler === "function") {
            return this._directHandler(msg);
          }
          return msg;
        };

    // Disconnect from any previous emitter
    this.disconnectCollector();
    this.emitter = emitter;
    this.unsubscribe = mode === "once"
      ? emitter.subscribeOnce(resolvedHandler)
      : emitter.subscribe(resolvedHandler);
    return this.unsubscribe;
  }

  /**
   * Collects a single message from the emitter and auto-disconnects.
   * @param {krnlEmitter} emitter
   * @param {number|null} timeoutMs
   * @returns {Promise<krnlMessage>}
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
   * Used internally by broadcast functionalities.
   * @param {object} target - The target entity (for context binding).
   * @param {function(krnlMessage): void} fn - Processing function for each message.
   * @returns {function(): void} Disconnect function.
   */
  pipeTo(target, fn) {
    // Create a self-contained emitter for this pipe
    const pipeEmitter = new krnlEmitter();
    this.emitter = pipeEmitter;

    const unsub = pipeEmitter.subscribe((msg) => {
      fn(msg);
    });

    this.unsubscribe = unsub;

    // Return a disconnect function
    return () => {
      this.disconnectCollector();
    };
  }

  /**
   * Pushes data directly into this collector's connected emitter.
   * Used by broadcast functionalities to inject data.
   * @param {*} data - Data to push.
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
}

//////////////////////////////////////// KRNL INTERFACE ////////////////////////////////////////
class krnlInterface {
  constructor(ownerEntity) {
    this.ownerEntity = ownerEntity;
    this.emitters = [];    // array — single source of truth
    this.collectors = [];  // array — single source of truth
    this.emitterNames = [];   // parallel name array for lookup
    this.collectorNames = []; // parallel name array for lookup
  }

  /**
   * Creates and registers a new emitter.
   * @param {string} name - Name for the emitter.
   * @returns {krnlEmitter} The created emitter.
   */
  createEmitter(name) {
    const emitter = new krnlEmitter();
    this.emitters.push(emitter);
    this.emitterNames.push(name);
    emitter.localAddress = {
      isOwnerEntity: false,
      siblingID: 0,
      emitterID: this.emitters.length - 1,
    };
    return emitter;
  }

  /**
   * Creates and registers a new collector.
   * @param {string} name - Name for the collector.
   * @returns {krnlCollector} The created collector.
   */
  createCollector(name) {
    const collector = new krnlCollector();
    this.collectors.push(collector);
    this.collectorNames.push(name);
    return collector;
  }

  /**
   * Gets an emitter by name.
   * @param {string} name - Name of the emitter.
   * @returns {krnlEmitter} The emitter.
   * @throws {krnlError} EMITTER_NOT_FOUND if not found.
   */
  getEmitter(name) {
    for (let i = 0; i < this.emitterNames.length; i++) {
      if (this.emitterNames[i] === name) return this.emitters[i];
    }
    throw new krnlError(krnlErrorCodes.EMITTER_NOT_FOUND);
  }

  /**
   * Gets a collector by name.
   * @param {string} name - Name of the collector.
   * @returns {krnlCollector} The collector.
   * @throws {krnlError} COLLECTOR_NOT_FOUND if not found.
   */
  getCollector(name) {
    for (let i = 0; i < this.collectorNames.length; i++) {
      if (this.collectorNames[i] === name) return this.collectors[i];
    }
    throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_FOUND);
  }

  /**
   * Removes an emitter by name.
   * @param {string} name 
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
   * @param {string} name 
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
   * @returns {krnlEmitter[]} Array of in-scope emitters.
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
   * @returns {krnlInterface[]} Array of interfaces.
   */
  getInterfacesInScope() {
    const owner = this.ownerEntity.hierarchyManager
      ? this.ownerEntity.hierarchyManager.getOwnerEntity()
      : null;
    if (!owner) return [this];

    const scopes = [this];
    if (owner.interface) scopes.push(owner.interface);

    const siblings = owner.hierarchyManager
      ? owner.hierarchyManager.getAllOwnedComponentEntities()
      : [];
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
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Entity_Compositional_Hierarchy.js
 * @description Manages parent-child relationships and component unique instantiation.
 */

/**
 * KRNL ENTITY COMPOSITIONAL HIERARCHY MANAGER
 * Responsible for the "skeleton" of the system.
 */
class krnlEntityCompositionalHierarchyManager {
  /**
   * @param {object} self - The entity this manager belongs to.
   * @param {object|null} owner - The parent entity (if any).
   * @param {function} EntityClass - Reference to the Entity base class for instantiation.
   */
  constructor(self, owner, EntityClass) {
    this.self = self;                  // The entity instance we are managing.
    this.owner = owner;                // The parent entity.
    this.EntityClass = EntityClass;    // Class used to spawn sub-entities.
    this.ownedComponents = new Map();  // Map of Name -> EntityInstance.
    this.componentBaseNames = new Map(); // Map of BaseName -> [EntityInstance]
    this.componentInstanceCounters = new Map(); // BaseName -> number of created instances
  }

  /**
   * Spawns a unique component entity within this host.
   * @param {string} name - The name of the component.
   * @param {function} [CustomClass=null] - Optional specific class to instantiate.
   */
  createComponentEntity(name, CustomClass = null, options = {}) {
    // 1. Determine which class to use (Default or Custom).
    const ClassToUse = CustomClass || this.EntityClass;
    const shouldBeSingleton = options.Singleton ?? ClassToUse.Singleton ?? true;

    // 2. Enforce unique instantiation for singleton components.
    if (shouldBeSingleton && this.ownedComponents.has(name)) {
      return this.ownedComponents.get(name);
    }

    // 3. Resolve instance identity.
    const currentCount = this.componentInstanceCounters.get(name) || 0;
    const nextCount = currentCount + 1;
    this.componentInstanceCounters.set(name, nextCount);
    const resolvedName = shouldBeSingleton ? name : `${name}#${nextCount}`;

    // 4. Create the new entity instance.
    const newEntity = new ClassToUse(resolvedName, this.self, {
      Singleton: shouldBeSingleton,
      baseName: name,
      instanceNumber: nextCount,
    });

    // 5. Register the component locally.
    this.ownedComponents.set(resolvedName, newEntity);
    const group = this.componentBaseNames.get(name) || [];
    group.push(newEntity);
    this.componentBaseNames.set(name, group);

    // 6. Notify the host entity that a new component has arrived.
    // This is crucial for the automatic interface promotion logic.
    if (this.self._onComponentAdded) {
      this.self._onComponentAdded(newEntity);
    }

    return newEntity;
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
    return [...(this.componentBaseNames.get(name) || [])];
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
      if (entity.dispose) entity.dispose(); // Kill children first.
    });
    this.ownedComponents.clear(); // Clear the registry.
    this.componentBaseNames.clear();
    this.componentInstanceCounters.clear();
  }

  /**
   * Disposes a specific component instance by ID/name.
   * @param {string} entityId
   * @returns {boolean}
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
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.js
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
 */


/**
 * Helper to ensure state isolation.
 */
function cloneState(source) {
  return JSON.parse(JSON.stringify(source));
}

/**
 * TRANSPORT ADAPTER INTERFACE
 */
class krnlTransportAdapter {
  async call(targetFunction, input, opts) {
    throw new Error("TransportAdapter.call() not implemented.");
  }
}

/**
 * MEMORY TRANSPORT ADAPTER
 * Default adapter for in-memory entity communication.
 */
class MemoryTransportAdapter extends krnlTransportAdapter {
  constructor(targetEntity) {
    super();
    this.targetEntity = targetEntity;
  }

  async call(targetFunction, input, opts) {
    if (!this.targetEntity || typeof this.targetEntity.call !== 'function') {
      throw new Error("MemoryTransportAdapter: Invalid target entity.");
    }
    return await this.targetEntity.call(targetFunction, input, opts);
  }
}

/**
 * KRNL LOCAL FUNCTIONALITY
 * The fundamental unit of logic.
 */
class krnlLocalFunctionality {
  constructor(config = {}) {
    const {
      id,
      visibility = 'public', // Default: public (bubbles up)
      initialState = {},
      api = (input) => input,
      helpers = {},
      emitters = {},
      events = {},
      schema = null,
      onMount = null,
      onTeardown = null,
    } = config;

    if (!id) throw new Error("LocalFunctionality requires an ID.");

    this.id = id;
    this.visibility = visibility;
    this.initialState = initialState;
    this.api = api;
    this.isLocal = true;
    this.helpers = new Map(Object.entries(helpers));
    this.emitters = new Map();
    this.schema = schema;

    this.lifecycle = {
      beginning: onMount || events.beginning,
      during: events.during,
      end: events.end,
      failure: events.failure,
      teardown: onTeardown || events.teardown
    };

    // Ensure state:changed emitter exists if not provided
    if (!emitters['state:changed']) {
      this.emitters.set('state:changed', new krnlEmitter());
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
        if (typeof value === 'object' && value !== null) {
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
          self._notifyStateChanged(prop, undefined);
        }
        return result;
      }
    };
    return new Proxy(initialState, handler);
  }

  _notifyStateChanged(prop, value) {
    const stateEmitter = this.emitters.get('state:changed');
    if (stateEmitter) {
      stateEmitter.pushDataStreamToEmitter({
        prop,
        value,
        state: this.state, // This is the proxied state
        functionalityId: this.id
      });
    }
  }

  /**
   * Updates the visibility and handles interface registration/deregistration.
   * This is the mechanism used to STOP bubbling at a certain level.
   * @param {'public'|'private'} v 
   */
  setVisibility(v) {
    const oldVisibility = this.visibility;
    this.visibility = v;

    if (!this.hostEntity) return;

    if (oldVisibility === 'private' && v === 'public') {
      // Transition to Public: Register in interface
      this._registerInInterface();
      // Notify owner to bubble it up
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (oldVisibility === 'public' && v === 'private') {
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
    // Register API as input
    const mainCollector = entity.interface.createCollector(this.id);
    mainCollector._directHandler = async (msg) => {
      const caller = msg.metadata?.caller || 'anonymous';
      return await this.execute(msg.data, { caller });
    };

    // Register Emitters as outputs
    this.emitters.forEach((emitter, eid) => {
      const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${eid}`);
      emitter.subscribe((msg) => interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time));
    });
  }

  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
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
    const caller = opts.caller || 'default';
    const activeState = this.state;

    // Schema Validation
    if (this.schema && this.schema.input) {
      if (typeof this.schema.input.parse === 'function') {
        // Zod-like
        input = this.schema.input.parse(input);
      } else if (typeof this.schema.input === 'function') {
        // Custom validator function
        if (!this.schema.input(input)) {
          throw new Error(`[KrnlSchemaError] Input validation failed for functionality: ${this.id}`);
        }
      }
    }

    try {
      if (typeof this.lifecycle.during === "function") {
        this.lifecycle.during({ input, opts, state: activeState, entity: this.hostEntity });
      }

      const result = await this.api(input, {
        state: activeState,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this, // Added
        caller: caller
      });

      if (typeof this.lifecycle.end === "function") {
        this.lifecycle.end({ input, output: result, caller });
      }

      return result;
    } catch (error) {
      if (typeof this.lifecycle.failure === "function") {
        this.lifecycle.failure({ error, input, caller });
      }
      throw error;
    }
  }
}

/**
 * KRNL REMOTE FUNCTIONALITY
 * Proxy for recursive bubbling.
 */
class krnlRemoteFunctionality {
  constructor(config = {}) {
    const { id, targetEntity, targetFunction, transport, visibility = 'public' } = config;
    this.id = id;
    this.targetFunction = targetFunction || id;
    this.targetEntity = targetEntity; // Store the target entity for identification
    this.visibility = visibility;
    this.isLocal = false;

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
    if (this.hostEntity && oldVisibility === 'private' && v === 'public') {
      this._registerInInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (this.hostEntity && oldVisibility === 'public' && v === 'private') {
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
      const caller = msg.metadata?.caller || 'anonymous';
      return await this.execute(msg.data, { caller });
    };
  }

  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      this._registerInInterface();
    }
  }

  async execute(input, opts = {}) {
    return await this.transport.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
  }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description The core Entity class, supporting recursive interface promotion and visibility control.
 */


/**
 * KRNL ENTITY BASE
 * The building block of the Krnl ecosystem.
 */
class krnlEntityBase {
  /**
   * @param {string} name - The unique identity of the entity.
   * @param {object|null} owner - The parent entity (if any).
   */
  constructor(name, owner = null, options = {}) {
    // 1. Core Identification.
    this.__krnlEntityInstance = true; // Marker for type checking.
    this.id = name || "UnnamedEntity"; // Unique ID.
    this.entityName = this.id;         // Alias for the name.
    this.Singleton = options.Singleton ?? this.constructor.Singleton ?? true;
    this.baseName = options.baseName || this.entityName;
    this.instanceNumber = options.instanceNumber || 1;

    // 2. Messaging Infrastructure (The IO Hub).
    this.interface = new krnlInterface(this);

    // 3. Logic Storage (The Brain).
    this.localFunctionalities = new Map();  // Logic that is MINE.
    this.remoteFunctionalities = new Map(); // Proxies for logic from components or external peers.
    this.collectors = new Set();            // Tracks listeners for cleanup.

    // 4. Hierarchy Management (The Skeleton).
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,          // Host.
      owner,         // Parent.
      krnlEntityBase // Base class for nesting.
    );
  }

  /**
   * Registers a local logic block.
   * If the functionality is 'public', it is automatically promoted to the owner.
   */
  addLocal(localFunctionality) {
    // 1. Ensure we have an instance of LocalFunctionality.
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    // 2. Bind it to THIS entity.
    functionality.bindToEntity(this);

    // 3. Save it to our local logic map.
    this.localFunctionalities.set(functionality.id, functionality);

    // 4. Notify our owner to promote this logic.
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
    // 1. Ensure we have an instance of RemoteFunctionality.
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality
      ? remoteFunctionality
      : new krnlRemoteFunctionality(remoteFunctionality);

    // 2. Bind it to THIS entity.
    functionality.bindToEntity(this);

    // 3. Store the proxy.
    this.remoteFunctionalities.set(functionality.id, functionality);

    // 4. BUBBLING: Notify our owner to promote this proxy if it is public.
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
    // 1. Only promote 'public' functionalities from the component.
    if (functionality.visibility !== 'public') return;

    console.log(`[${this.entityName}] Attempting to promote ${functionality.id} from ${component.entityName}`);

    const existing = this.remoteFunctionalities.get(functionality.id);
    if (existing) {
      existing.targetEntity = component;
      existing.targetFunction = functionality.id;
      return;
    }

    // 2. Register the component's functionality as a REMOTE proxy on this owner.
    // By default, promoted proxies are 'public' so they keep bubbling up,
    // but the owner can intercept this or re-configure the proxy to be 'private'.
    this.addRemote({
      id: functionality.id,
      targetEntity: component,
      targetFunction: functionality.id,
      visibility: 'public' // Bubbles up further by default.
    });

    console.log(`[${this.entityName}] Promoted component logic: ${functionality.id}`);
  }

  /**
   * Removes a promoted remote functionality and recursively propagates removal upward.
   * @param {object} component
   * @param {string} functionalityId
   */
  _onComponentFunctionalityRemoved(component, functionalityId) {
    console.log(`[${this.entityName}] Removing component logic: ${functionalityId} from ${component.entityName}`);
    const existing = this.remoteFunctionalities.get(functionalityId);
    if (!existing) {
      console.log(`[${this.entityName}] Logic ${functionalityId} not found in remoteFunctionalities.`);
      return;
    }
    if (existing.targetEntity !== component) {
      console.log(`[${this.entityName}] Logic ${functionalityId} targetEntity mismatch.`);
      return;
    }

    this.remoteFunctionalities.delete(functionalityId);

    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityRemoved) {
      owner._onComponentFunctionalityRemoved(this, functionalityId);
    }
  }

  /**
   * Executes a functionality by ID.
   */
  async call(fid, input, opts = {}) {
    if (this.localFunctionalities.has(fid)) {
      return this.localFunctionalities.get(fid).execute(input, opts);
    }
    if (this.remoteFunctionalities.has(fid)) {
      return this.remoteFunctionalities.get(fid).execute(input, opts);
    }
    throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
  }

  getLocal(fid) { return this.localFunctionalities.get(fid); }
  getRemote(fid) { return this.remoteFunctionalities.get(fid); }
  disposeOwnedComponent(entityId) {
    return this.hierarchyManager.disposeComponentEntity(entityId);
  }

  dispose() {
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    if (this.interface) this.interface.dispose();

    // 1. Teardown all local functionalities to release resources.
    this.localFunctionalities.forEach(func => {
      if (typeof func.teardown === 'function') {
        func.teardown();
      }
    });

    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Sub_System_Orchestrator_Base.js
 * @description Defines the base class for all sub-system orchestrator entities in the Krnl ecosystem.
 */


///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL SUB SYSTEM ORCHESTRATOR BASE ////////////////////////////////////////
class krnlSubSystemOrchestratorBase extends krnlEntityBase {
  constructor(name, owner) {
    // A sub-system orchestrator must have a system orchestrator as its owner.
    if (!owner) {
      throw new Error("A sub-system orchestrator must be owned by a parent entity.");
    }
    super(name, owner);
    this.systemType = 'SubSystemOrchestrator';
  }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Comm_Component.js
 *
 * @description The uniform P2P communication bridge for all Krnl system orchestrators.
 * Every system (Brnda, Qwnsr, Wepr, DummyA, etc.) owns one of these.
 *
 * Responsibilities:
 *  1. Accept "wire" instructions from the Hub: connect one of this system's emitters to a
 *     remote system's collector via a WebSocket channel (or in-process direct binding in tests).
 *  2. Maintain a table of active routes so the Hub can inspect them.
 *
 * Architecture:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │           SystemA                           │
 *   │  interface.emitter("A-Events")              │
 *   │          │                                  │
 *   │   CommComponent ──── ws ──► B.CommComponent │
 *   └─────────────────────────────────────────────┘
 *          ▼ injects into
 *   ┌──────────────────────────────────────────────┐
 *   │           SystemB                            │
 *   │  interface.collector("B-Commands")           │
 *   │          △                                  │
 *   │   CommComponent ─── receives & calls handler │
 *   └──────────────────────────────────────────────┘
 *
 * Two transport modes (both exposed via the same API):
 *   • "direct" — in-process reference wiring (testing / same-process demo).
 *   • "ws"     — WebSocket channel (multi-process / network).
 */


/**
 * WEBSOCKET TRANSPORT ADAPTER
 * For remote inter-system communication.
 */
class WebSocketTransportAdapter extends krnlTransportAdapter {
    /**
     * @param {krnlSystemCommComponent} commComponent - The local system's comm component.
     * @param {string} remoteAddress - "host:port" of the remote system.
     */
    constructor(commComponent, remoteAddress) {
        super();
        this.commComponent = commComponent;
        this.remoteAddress = remoteAddress;
    }

    async call(targetFunction, input, opts) {
        return await this.commComponent.callWsRpc(this.remoteAddress, 'call', { fid: targetFunction, data: input }, opts.timeout);
    }
}

// ws is loaded lazily so the CommComponent can be imported in environments where
// the `ws` package is not installed — as long as only 'direct' wiring is used.
let _WS, _WSServer;
async function _loadWs() {
    if (!_WS) {
        const mod = await import('ws');
        _WS = mod.WebSocket;
        _WSServer = mod.WebSocketServer;
    }
    return { WebSocket: _WS, WebSocketServer: _WSServer };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// ROUTE ENTRY ////////////////////////////////////////
/**
 * Describes one active route.
 * @typedef {Object} KrnlRoute
 * @property {string} id             - Unique route id.
 * @property {string} sourceEmitter  - Emitter name on the local interface.
 * @property {string} targetSystem   - Remote system name.
 * @property {string} targetCollector - Collector name on the remote interface.
 * @property {"direct"|"ws"} mode   - Transport mode.
 * @property {Function} [disconnect] - Call to tear down this route.
 */

//////////////////////////////////////// KRNL SYSTEM COMM COMPONENT ////////////////////////////////////////
class krnlSystemCommComponent {
    /**
     * @param {import("../../../entities/krnlEntityBase/K_ENT_Krnl_Entity_Base.js").krnlEntityBase} ownerEntity
     * @param {number} [listenPort=10099] - WS server port (only used in "ws" mode).
     * @param {string} [host='0.0.0.0'] - Interface to bind to.
     */
    constructor(ownerEntity, listenPort = 10099, host = '0.0.0.0') {
        this.ownerEntity = ownerEntity;
        this.listenPort = listenPort;
        this.host = host;
        this.routes = new Map();   // routeId → KrnlRoute
        this._routeSeq = 0;
        this._wsServer = null;        // WebSocketServer instance (if ws mode is active)
        this._wsClients = new Map();   // systemName → WebSocket (outgoing)
        this._wsIngress = new Map();   // routeId → unsubscribe fn
        this._wsPendingRpc = new Map(); // requestId → { resolve, reject, timeoutId }
        this._wsRpcHandlers = new Map(); // method → handler
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// DIRECT (IN-PROCESS) WIRING //////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Binds a local emitter directly to another in-process system's collector.
     * This is the primary method used in same-process tests.
     *
     * @param {string} localEmitterName - Name of the emitter on this entity's interface.
     * @param {object} remoteCommComponent - The target system's CommComponent instance.
     * @param {string} remoteCollectorName - The collector name on the target system's interface.
     * @returns {KrnlRoute} The created route.
     */
    wireDirectly(localEmitterName, remoteCommComponent, remoteCollectorName) {
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const remoteCollector = remoteCommComponent.ownerEntity.interface.getCollector(remoteCollectorName);

        // Subscribe the remote collector handler to this emitter
        const unsubscribe = emitter.subscribe((msg) => {
            // Inject the data stream into the remote collector via its internally piped emitter
            // If the collector has a subscriber registered by the remote system, it fires.
            if (remoteCollector.emitter) {
                remoteCollector.emitter.pushDataStreamToEmitter(msg.data);
            }
            // Also call any handlers registered via subscribeTo
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
            disconnect: unsubscribe,
        };
        this.routes.set(routeId, route);

        console.log(
            `[CommComponent:${this.ownerEntity.entityName}] DIRECT route created: ` +
            `${localEmitterName} → ${route.targetSystem}.${remoteCollectorName}`
        );
        return route;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// WEBSOCKET (NETWORK) WIRING ///////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Starts a WebSocket server so that remote systems can push data into local collectors.
     */
    async startWsServer() {
        if (this._wsServer) return; // Already running
        const { WebSocketServer } = await _loadWs();
        this._wsServer = new WebSocketServer({ port: this.listenPort, host: this.host });

        this._wsServer.on('connection', (ws) => {
            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());

                    // Backward-compatible payload support
                    if (msg.routeId && Object.prototype.hasOwnProperty.call(msg, 'data') && !msg.kind) {
                        const handler = this._wsIngress.get(msg.routeId);
                        if (handler) handler(msg.data);
                        return;
                    }

                    if (msg.kind === 'register-ingress') {
                        this.registerWsIngress(msg.routeId, msg.collectorName);
                        return;
                    }

                    if (msg.kind === 'route-data') {
                        const handler = this._wsIngress.get(msg.routeId);
                        if (handler) handler(msg.data);
                        return;
                    }

                    if (msg.kind === 'rpc-request') {
                        this._handleRpcRequest(ws, msg);
                        return;
                    }

                    if (msg.kind === 'rpc-response') {
                        this._handleRpcResponse(msg);
                    }
                } catch (e) {
                    console.error(`[CommComponent:${this.ownerEntity.entityName}] WS parse error:`, e.message);
                }
            });
        });

        console.log(
            `[CommComponent:${this.ownerEntity.entityName}] WS server listening on :${this.listenPort}`
        );
    }

    /**
     * Connects to a remote system's CommComponent WS server.
     *
     * @param {string} localEmitterName - Local emitter to bridge out.
     * @param {string} remoteAddress - "host:port" of the remote system.
     * @param {string} remoteCollectorName - Collector name at the remote end.
     * @param {string} remoteSystemName - Name of the remote system.
     * @returns {Promise<KrnlRoute>}
     */
    async wireViaWs(localEmitterName, remoteAddress, remoteCollectorName, remoteSystemName) {
        const { WebSocket } = await _loadWs();
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const ws = new WebSocket(`ws://${remoteAddress}`);

        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });

        this._wsClients.set(remoteSystemName, ws);
        const routeId = `ws_route_${this._routeSeq++}`;

        ws.send(JSON.stringify({
            kind: 'register-ingress',
            routeId,
            collectorName: remoteCollectorName,
        }));

        const unsubscribe = emitter.subscribe((msg) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    kind: 'route-data',
                    routeId,
                    data: msg.data,
                }));
            }
        });

        const route = {
            id: routeId,
            sourceEmitter: localEmitterName,
            targetSystem: remoteSystemName,
            targetCollector: remoteCollectorName,
            mode: "ws",
            disconnect: () => {
                unsubscribe();
                ws.close();
                this._wsClients.delete(remoteSystemName);
            },
        };
        this.routes.set(routeId, route);

        console.log(
            `[CommComponent:${this.ownerEntity.entityName}] WS route created: ` +
            `${localEmitterName} → ${remoteSystemName}.${remoteCollectorName} @ ${remoteAddress}`
        );
        return route;
    }

    /**
     * Registers a WS ingress handler: data arriving for a specific route is forwarded
     * to a local collector.
     *
     * @param {string} routeId - The route identifier the remote end will include.
     * @param {string} localCollectorName - Collector on this entity's interface.
     */
    registerWsIngress(routeId, localCollectorName) {
        this._wsIngress.set(routeId, (data) => {
            const collector = this.ownerEntity.interface.getCollector(localCollectorName);
            if (collector._directHandler) {
                collector._directHandler({ data });
            }
        });
    }

    /**
     * Wires a remote system's emitter to a local collector.
     * This is used when a remote system initiates the wiring.
     * 
     * @param {string} remoteAddress - "host:port" of the remote system.
     * @param {string} remoteEmitterName - Emitter name at the remote end.
     * @param {string} localCollectorName - Local collector name.
     * @param {string} remoteSystemName - Name of the remote system.
     */
    async wireRemoteEmitterToLocal(remoteAddress, remoteEmitterName, localCollectorName, remoteSystemName) {
        return this.wireViaWs(remoteEmitterName, remoteAddress, localCollectorName, remoteSystemName);
    }

    defineRpc(methodName, handler) {
        this._wsRpcHandlers.set(methodName, handler);
    }

    async callWsRpc(remoteAddress, method, params = {}, timeoutMs = 5000) {
        const { WebSocket } = await _loadWs();
        const requestId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const ws = new WebSocket(`ws://${remoteAddress}`);
        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this._wsPendingRpc.delete(requestId);
                ws.close();
                reject(new Error(`RPC timeout for method ${method}`));
            }, timeoutMs);

            this._wsPendingRpc.set(requestId, { resolve, reject, timeoutId, ws });

            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.kind === 'rpc-response') this._handleRpcResponse(msg);
                } catch (_) { }
            });

            ws.send(JSON.stringify({
                kind: 'rpc-request',
                requestId,
                method,
                params,
            }));
        });
    }

    async _handleRpcRequest(ws, msg) {
        const { requestId, method, params } = msg;
        const handler = this._wsRpcHandlers.get(method);
        if (!handler) {
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: false,
                error: `Unknown RPC method: ${method}`,
            }));
            return;
        }

        try {
            const result = await handler(params);
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: true,
                result,
            }));
        } catch (e) {
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: false,
                error: e?.message || String(e),
            }));
        }
    }

    _handleRpcResponse(msg) {
        const pending = this._wsPendingRpc.get(msg.requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this._wsPendingRpc.delete(msg.requestId);
        pending.ws?.close();

        if (msg.ok) pending.resolve(msg.result);
        else pending.reject(new Error(msg.error || 'RPC error'));
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// ROUTE MANAGEMENT ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Returns an array of all active routes (safe serializable snapshot).
     * @returns {KrnlRoute[]}
     */
    listRoutes() {
        return Array.from(this.routes.values()).map(r => ({
            id: r.id,
            sourceEmitter: r.sourceEmitter,
            targetSystem: r.targetSystem,
            targetCollector: r.targetCollector,
            mode: r.mode,
        }));
    }

    /**
     * Tears down a route by id.
     * @param {string} routeId
     */
    disconnectRoute(routeId) {
        const route = this.routes.get(routeId);
        if (!route) throw new Error(`[CommComponent] Route not found: ${routeId}`);
        if (route.disconnect) route.disconnect();
        this.routes.delete(routeId);
        console.log(`[CommComponent:${this.ownerEntity.entityName}] Route ${routeId} disconnected.`);
    }

    /**
     * Tears down all routes and closes any WS connections.
     */
    dispose() {
        for (const [id] of this.routes) {
            try { this.disconnectRoute(id); } catch (_) { }
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
            pending.reject(new Error('CommComponent disposed before RPC response'));
        }
        this._wsPendingRpc.clear();
        this._wsRpcHandlers.clear();
        console.log(`[CommComponent:${this.ownerEntity.entityName}] CommComponent disposed.`);
    }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Base_Functionality_APIs.js
 * @description Reusable API atoms for krnlSystemEntityBase default functionalities.
 */

function heartbeatApi(entity) {
  return () => ({
    name: entity.entityName,
    type: entity.systemType,
    timestamp: new Date().toISOString()
  });
}

function telemetryApi(entity) {
  return () => ({
    entityName: entity.entityName,
    systemType: entity.systemType,
    owner: entity.hierarchyManager.getOwnerEntity()?.entityName || null,
    ownedEntities: entity.hierarchyManager.getAllOwnedComponentEntities().map((e) => e.entityName),
    activeRoutes: entity.commComponent.listRoutes(),
    uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : null,
  });
}

function adminCommandApi(entity) {
  return async ({ command, args }) => {
    console.log(`[${entity.entityName}] Admin command: ${command}`, args);
    return { status: 'acknowledged', command };
  };
}

function discoverPeersApi(entity) {
  return () => entity.listPeers();
}

function manifestApi(entity) {
  return () => entity.getManifest();
}

function systemCommandsCollectorHandler(entity) {
  return (msg) => {
    console.log(`[${entity.entityName}] system-commands received:`, JSON.stringify(msg.data));
  };
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_System_Entity_Base.js
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */


///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL SYSTEM ENTITY BASE ////////////////////////////////////////
class krnlSystemEntityBase extends krnlEntityBase {
  /**
   * @param {string} name
   * @param {object|null} owner
   * @param {number} [commPort=10099] - WS listen port for the commComponent.
   * @param {string} [host='0.0.0.0'] - Interface to bind to.
   */
  constructor(name, owner = null, commPort = 10099, host = '0.0.0.0') {
    super(name, owner, { Singleton: true });
    this.systemType = 'SystemOrchestrator';
    this.peers = new Map(); // id -> { address, lastSeen }

    // ── Uniform P2P communication bridge ──────────────────────────────
    this.commPort = commPort;
    this.host = host;
    this.commComponent = new krnlSystemCommComponent(this, commPort, host);

    this._setupBaseFunctionalities();
    this._setupBaseInterface();
    this._setupRpcHandlers();

    // ── Startup Diagnostics ──────────────────────────────
    this._emitStartupDiagnostics();
  }

  /**
   * Returns true if UDP discovery is available in the current environment.
   */
  isDiscoveryAvailable() {
    return typeof window === 'undefined';
  }

  /**
   * Emits structured startup diagnostics.
   * Useful for wrapper services (like Wepr) to monitor active subsystems.
   */
  _emitStartupDiagnostics() {
    const diagnostics = {
      event: 'KRNL_STARTUP',
      entity: this.entityName,
      timestamp: Date.now(),
      subsystems: {
        comm: { status: 'active', port: this.commPort },
        discovery: { status: this.isDiscoveryAvailable() ? 'available' : 'unavailable' }
      },
      environment: typeof window === 'undefined' ? 'node' : 'browser'
    };
    console.log(`[KRNL_DIAGNOSTICS] ${JSON.stringify(diagnostics)}`);
  }

  /**
   * Returns a manifest of all available inputs and outputs.
   * Inputs = Collectors + Functionalities (API call)
   * Outputs = Emitters + Functionality Emitters (Events)
   */
  getManifest() {
    const apiNames = [];
    const eventsNames = [];

    this.localFunctionalities.forEach((f) => {
      apiNames.push(f.id);
      f.emitters.forEach((_, eid) => eventsNames.push(`${f.id}:${eid}`));
    });

    return {
      entityName: this.entityName,
      systemType: this.systemType,
      inputs: {
        collectors: this.interface.collectorNames,
        api: apiNames,
      },
      outputs: {
        emitters: this.interface.emitterNames,
        events: eventsNames,
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISCOVERY ////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts discovery: advertises presence and listens for other peers.
   * @param {number} [discoveryPort=10101]
   * @param {string} [discoveryHost='255.255.255.255'] - Broadcast address.
   */
  async startDiscovery(discoveryPort = 10101, discoveryHost = '255.255.255.255') {
    if (!this.isDiscoveryAvailable()) {
      console.warn(`[${this.entityName}] Discovery: UDP not supported in current environment.`);
      return;
    }

    const dgram = await import('dgram').then(m => m.default || m);
    this.discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.discoverySocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'KRNL_BEACON' && data.id !== this.entityName) {
          this.peers.set(data.id, {
            id: data.id,
            name: data.id,
            address: `${rinfo.address}:${data.port}`,
            lastSeen: Date.now()
          });
        }
      } catch (e) { }
    });

    this.discoverySocket.bind(discoveryPort, this.host, () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${discoveryHost})`);
      
      // Advertise presence periodically
      this.beaconInterval = setInterval(() => {
        const beacon = JSON.stringify({
          type: 'KRNL_BEACON',
          id: this.entityName,
          port: this.commPort
        });
        this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, discoveryHost);
      }, 5000);
    });

    // Start WS server for incoming connections
    await this.commComponent.startWsServer();
  }

  /**
   * Returns a list of all discovered peers.
   */
  listPeers() {
    return Array.from(this.peers.values());
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// WIRING ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Wires a local output to a remote input, or a remote output to a local input.
   * 
   * @param {string} peerId - The ID of the discovered peer.
   * @param {Object} options 
   * @param {string} [options.localOutput] - Name of local emitter.
   * @param {string} [options.remoteInput] - Name of remote collector.
   * @param {string} [options.remoteOutput] - Name of remote emitter.
   * @param {string} [options.localInput] - Name of local collector.
   */
  async wire(peerId, options) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);

    const { localOutput, remoteInput, remoteOutput, localInput } = options;

    // Case 1: Local Output -> Remote Input
    if (localOutput && remoteInput) {
      await this.commComponent.wireViaWs(localOutput, peer.address, remoteInput, peer.name);
    }

    // Case 2: Remote Output -> Local Input
    if (remoteOutput && localInput) {
      // We request the remote peer to wire its output to our local input
      await this.commComponent.callWsRpc(peer.address, 'wire-output-to-me', {
        remoteOutput: remoteOutput,
        localInput: localInput,
        myAddress: `${this.host}:${this.commPort}`,
        myName: this.entityName
      });
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// PRIVATE SETUP ////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _setupRpcHandlers() {
    // Allows others to see what we have
    this.commComponent.defineRpc('get-manifest', async () => {
      return this.getManifest();
    });

    // Allows others to request we wire an output to them
    this.commComponent.defineRpc('wire-output-to-me', async (params) => {
      const { remoteOutput, localInput, myAddress, myName } = params;
      console.log(`[${this.entityName}] Remote ${myName} requested wiring: ${remoteOutput} -> ${localInput}`);
      return await this.commComponent.wireViaWs(remoteOutput, myAddress, localInput, myName);
    });

    // Allows others to call functionalities on this system
    this.commComponent.defineRpc('call', async ({ fid, data }) => {
      return await this.call(fid, data);
    });
  }

  _setupBaseFunctionalities() {
    this.addLocal({
      id: 'heartbeat',
      api: heartbeatApi(this),
      emitters: { status: {} }
    });

    this.addLocal({
      id: 'getTelemetry',
      api: telemetryApi(this)
    });

    this.addLocal({
      id: 'adminCommand',
      api: adminCommandApi(this)
    });

    this.addLocal({
      id: 'discoverPeers',
      api: discoverPeersApi(this)
    });

    this.addLocal({
      id: 'getManifest',
      api: manifestApi(this)
    });
  }

  _setupBaseInterface() {
    this.interface.createEmitter('system-events');
    this.interface.createCollector('system-commands');
    this._attachCollectorHandler('system-commands', systemCommandsCollectorHandler(this));
  }

  _attachCollectorHandler(collectorName, handler) {
    const collector = this.interface.getCollector(collectorName);
    collector._directHandler = handler;
  }

  dispose() {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.discoverySocket) this.discoverySocket.close();
    this.commComponent.dispose();
    super.dispose();
  }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Backend_Visual_Functionality_APIs.js
 * @description Reusable API atoms for krnlBackendVisualEntityBase.
 */

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
      scale: { ...entity.visualCore.scale, ...patch.scale },
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
    return { status: 'synced', timestamp: Date.now() };
  };
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Backend_Visual_Entity_Base.js
 * @description A base class for entities that have a visual backend representation.
 */


class krnlBackendVisualEntityBase extends krnlEntityBase {
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
      id: 'setBrndaComponent',
      api: setBrndaComponentApi(this)
    });

    this.addLocal({
      id: 'setWeprComponent',
      api: setWeprComponentApi(this)
    });

    this.addLocal({
      id: 'setVisualCore',
      api: setVisualCoreApi(this)
    });

    this.addLocal({
      id: 'getVisualSnapshot',
      api: getVisualSnapshotApi(this)
    });

    this.addLocal({
      id: 'syncAllFrontends',
      api: syncAllFrontendsApi(this)
    });
  }

  getVisualSnapshot() {
    return { ...this.visualCore };
  }
}

//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Dasy_JS.js
 * @description The library that provides file operations for reading and writing data with a uniform API using the Browser Origin Private File System (OPFS).
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// DASY JS ////////////////////////////////////////
/**
 * DasyJS Class
 * Provides a uniform API for file operations on the JS platform using OPFS.
 */
class DasyJS {
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
}

export { DasyJS, MemoryTransportAdapter, WebSocketTransportAdapter, createEnum, krnlBackendVisualEntityBase, krnlCollector, krnlData, krnlDataFactory, krnlEmitter, krnlEntityBase, krnlEntityCompositionalHierarchyManager, krnlError, krnlErrorCodes, krnlErrorMessages, krnlGlobalEmitterAddress, krnlInterface, krnlLocalEmitterAddress, krnlLocalFunctionality, krnlMessage, krnlMessageStream, krnlPrimitiveDataTypes, krnlRemoteFunctionality, krnlSubSystemOrchestratorBase, krnlSystemCommComponent, krnlSystemEntityBase, krnlSystemTypes, krnlTransportAdapter };
