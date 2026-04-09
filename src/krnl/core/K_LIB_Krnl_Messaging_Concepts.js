//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Messaging_Concepts.js
 * @description Core classes for messaging and communication between entities in the Krnl system.
 */

import {
  krnlSystemTypes,
  krnlData,
} from "./K_LIB_Krnl_Base_Concepts.js";

import {
  krnlError,
  krnlErrorCodes,
} from "./K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL GLOBAL EMITTER ADDRESS ////////////////////////////////////////
export class krnlGlobalEmitterAddress {
  systemID = 0; // ["qwnsr", "brnda", "symba", "mosy"]
  subSystemID = 0; // ["qwnsrControl", "qwnsrBlocks"], other options for other systems.
  entityAddress = []; // nesting of type => entity36{entity45{entity67}} = [36,45,67]
  emitterID = 0;
}

//////////////////////////////////////// KRNL LOCAL EMITTER ADDRESS ////////////////////////////////////////
export class krnlLocalEmitterAddress {
  isOwnerEntity = true; // simply an address to the owner of the current entity if true. else address directed to sibling
  siblingID = 0;
  emitterID = 0;
}

//////////////////////////////////////// KRNL MESSAGE ////////////////////////////////////////
export class krnlMessage {
  data = null;
  time = { day: 0, hour: 0, minute: 0, seconds: 0, millisecond: 0 };
}

//////////////////////////////////////// KRNL MESSAGE STREAM ////////////////////////////////////////
export class krnlMessageStream {
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
export class krnlEmitter {
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
export class krnlCollector {
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
export class krnlInterface {
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
