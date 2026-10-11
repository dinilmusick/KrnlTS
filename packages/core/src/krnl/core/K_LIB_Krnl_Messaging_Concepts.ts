//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Messaging_Concepts.ts
 * @description Core classes for messaging and communication between entities in the Krnl system.
 */

import {
  krnlData,
  KrnlTraceContext,
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
  systemID: number = 0; // ["qwnsr", "brnda", "symba", "mosy"]
  subSystemID: number = 0; // ["qwnsrControl", "qwnsrBlocks"]
  entityAddress: number[] = []; // nesting of type
  emitterID: number = 0;
}

//////////////////////////////////////// KRNL LOCAL EMITTER ADDRESS ////////////////////////////////////////
export class krnlLocalEmitterAddress {
  isOwnerEntity: boolean = true; 
  siblingID: number = 0;
  emitterID: number = 0;
}

//////////////////////////////////////// KRNL MESSAGE ////////////////////////////////////////
export class krnlMessage implements KrnlTraceContext {
  data: any = null;
  timestamp: number = 0;
  
  // Tracing metadata aligned with core lingo
  sourceEmitterAddress: string | null = null;
  targetCollectorAddress: string | null = null;
  traceCorrelationId: string | null = null;
  originSystemAddress: string | null = null;
}

//////////////////////////////////////// KRNL EMITTER ////////////////////////////////////////
export class krnlEmitter {
  subscribers: ((msg: krnlMessage) => void)[];
  localAddress: krnlLocalEmitterAddress | null;

  constructor() {
    this.subscribers = [];
    this.localAddress = null;
  }

  /**
   * Pushes data into the emitter and notifies all subscribers.
   */
  pushDataStreamToEmitter(data: any, time: any = {}, transform: (msg: krnlMessage) => krnlMessage = (msg) => msg): void {
    const msg = new krnlMessage();
    msg.data = data;
    msg.timestamp = typeof time === 'number' ? time : (time?.timestamp || Date.now());
    const transformed = transform(msg);
    
    for (let i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i](transformed);
    }
  }

  /**
   * Subscribes a handler to this emitter. Handler is called on every push.
   */
  subscribe(handler: (msg: krnlMessage) => void): () => void {
    this.subscribers.push(handler);
    return () => {
      const idx = this.subscribers.indexOf(handler);
      if (idx >= 0) this.subscribers.splice(idx, 1);
    };
  }

  /**
   * Subscribes once and auto-unsubscribes after first message.
   */
  subscribeOnce(handler: (msg: krnlMessage) => void): () => void {
    let unsubscribe: (() => void) | null = null;
    const wrapped = (msg: krnlMessage) => {
      if (unsubscribe) unsubscribe();
      handler(msg);
    };
    unsubscribe = this.subscribe(wrapped);
    return unsubscribe;
  }

  /**
   * Resets the emitter and removes all subscribers.
   */
  disconnectEmitter(): void {
    this.subscribers = [];
  }
}

//////////////////////////////////////// KRNL COLLECTOR ////////////////////////////////////////
export class krnlCollector {
  emitter: krnlEmitter | null;
  unsubscribe: (() => void) | null;
  _directHandler?: (msg: krnlMessage) => any;

  constructor() {
    this.emitter = null;
    this.unsubscribe = null;
  }

  /**
   * Subscribes this collector to an emitter. Messages are forwarded to the handler.
   */
  subscribeTo(emitter: krnlEmitter, handler: ((msg: krnlMessage) => void) | null = null, options: any = {}): () => void {
    const { mode = "stream" } = options;
    const resolvedHandler = typeof handler === "function"
      ? handler
      : (msg: krnlMessage) => {
          if (typeof this._directHandler === "function") {
            return this._directHandler(msg);
          }
          return msg;
        };

    this.disconnectCollector();
    this.emitter = emitter;
    this.unsubscribe = mode === "once"
      ? emitter.subscribeOnce(resolvedHandler)
      : emitter.subscribe(resolvedHandler);
    return this.unsubscribe;
  }

  /**
   * Collects a single message from the emitter and auto-disconnects.
   */
  collectNext(emitter: krnlEmitter, timeoutMs: number | null = null): Promise<krnlMessage> {
    return new Promise((resolve, reject) => {
      let timeout: any = null;
      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        this.disconnectCollector();
      };

      this.subscribeTo(emitter, (msg: krnlMessage) => {
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
  pipeTo(target: any, fn: (msg: krnlMessage) => void): () => void {
    const pipeEmitter = new krnlEmitter();
    this.emitter = pipeEmitter;

    const unsub = pipeEmitter.subscribe((msg: krnlMessage) => {
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
  pushDataStreamToEmitter(data: any): void {
    if (this.emitter === null) {
      throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED);
    }
    this.emitter.pushDataStreamToEmitter(data);
  }

  /**
   * Disconnects from the current emitter.
   */
  disconnectCollector(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.emitter = null;
    }
  }
}

//////////////////////////////////////// KRNL INTERFACE ////////////////////////////////////////
export class krnlInterface {
  ownerEntity: any;
  emitters: Map<string, krnlEmitter>;
  collectors: Map<string, krnlCollector>;

  constructor(ownerEntity: any) {
    this.ownerEntity = ownerEntity;
    this.emitters = new Map();    
    this.collectors = new Map();  
  }

  /**
   * Creates and registers a new emitter.
   */
  createEmitter(name: string): krnlEmitter {
    const emitter = new krnlEmitter();
    this.emitters.set(name, emitter);
    emitter.localAddress = {
      isOwnerEntity: false,
      siblingID: 0,
      emitterID: this.emitters.size - 1,
    };
    return emitter;
  }

  /**
   * Creates and registers a new collector.
   */
  createCollector(name: string): krnlCollector {
    const collector = new krnlCollector();
    this.collectors.set(name, collector);
    return collector;
  }

  /**
   * Gets an emitter by name.
   */
  getEmitter(name: string): krnlEmitter {
    const emitter = this.emitters.get(name);
    if (!emitter) throw new krnlError(krnlErrorCodes.EMITTER_NOT_FOUND);
    return emitter;
  }

  /**
   * Gets a collector by name.
   */
  getCollector(name: string): krnlCollector {
    const collector = this.collectors.get(name);
    if (!collector) throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_FOUND);
    return collector;
  }

  /**
   * Removes an emitter by name.
   */
  removeEmitter(name: string): void {
    const emitter = this.emitters.get(name);
    if (emitter) {
      emitter.disconnectEmitter();
      this.emitters.delete(name);
    }
  }

  /**
   * Removes a collector by name.
   */
  removeCollector(name: string): void {
    const collector = this.collectors.get(name);
    if (collector) {
      collector.disconnectCollector();
      this.collectors.delete(name);
    }
  }

  /**
   * Gets all emitters in scope (self + owner + siblings).
   */
  getEmittersInScope(): krnlEmitter[] {
    const interfaces = this.getInterfacesInScope();
    const result: krnlEmitter[] = [];
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
  getInterfacesInScope(): krnlInterface[] {
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
  dispose(): void {
    for (const emitter of this.emitters.values()) {
      emitter.disconnectEmitter();
    }
    for (const collector of this.collectors.values()) {
      collector.disconnectCollector();
    }
    this.emitters.clear();
    this.collectors.clear();
  }
}
