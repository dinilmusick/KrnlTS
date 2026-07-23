//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Messaging_Concepts.ts
 * @description Core classes for messaging and communication between entities in the Krnl system.
 */
import { krnlError, krnlErrorCodes, } from "./K_LIB_Krnl_Error_Concepts.js";
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// KRNL GLOBAL EMITTER ADDRESS ////////////////////////////////////////
export class krnlGlobalEmitterAddress {
    systemID = 0; // ["qwnsr", "brnda", "symba", "mosy"]
    subSystemID = 0; // ["qwnsrControl", "qwnsrBlocks"]
    entityAddress = []; // nesting of type
    emitterID = 0;
}
//////////////////////////////////////// KRNL LOCAL EMITTER ADDRESS ////////////////////////////////////////
export class krnlLocalEmitterAddress {
    isOwnerEntity = true;
    siblingID = 0;
    emitterID = 0;
}
//////////////////////////////////////// KRNL MESSAGE ////////////////////////////////////////
export class krnlMessage {
    data = null;
    timestamp = 0;
    // Tracing metadata aligned with core lingo
    sourceEmitterAddress = null;
    targetCollectorAddress = null;
    traceCorrelationId = null;
    originSystemAddress = null;
}
//////////////////////////////////////// KRNL EMITTER ////////////////////////////////////////
export class krnlEmitter {
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
        msg.timestamp = typeof time === 'number' ? time : (time?.timestamp || Date.now());
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
            if (idx >= 0)
                this.subscribers.splice(idx, 1);
        };
    }
    /**
     * Subscribes once and auto-unsubscribes after first message.
     */
    subscribeOnce(handler) {
        let unsubscribe = null;
        const wrapped = (msg) => {
            if (unsubscribe)
                unsubscribe();
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
}
//////////////////////////////////////// KRNL COLLECTOR ////////////////////////////////////////
export class krnlCollector {
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
        const resolvedHandler = typeof handler === "function"
            ? handler
            : (msg) => {
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
    collectNext(emitter, timeoutMs = null) {
        return new Promise((resolve, reject) => {
            let timeout = null;
            const cleanup = () => {
                if (timeout)
                    clearTimeout(timeout);
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
}
//////////////////////////////////////// KRNL INTERFACE ////////////////////////////////////////
export class krnlInterface {
    ownerEntity;
    emitters;
    collectors;
    constructor(ownerEntity) {
        this.ownerEntity = ownerEntity;
        this.emitters = new Map();
        this.collectors = new Map();
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
            emitterID: this.emitters.size - 1,
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
        if (!emitter)
            throw new krnlError(krnlErrorCodes.EMITTER_NOT_FOUND);
        return emitter;
    }
    /**
     * Gets a collector by name.
     */
    getCollector(name) {
        const collector = this.collectors.get(name);
        if (!collector)
            throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_FOUND);
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
        const owner = this.ownerEntity.hierarchyManager
            ? this.ownerEntity.hierarchyManager.getOwnerEntity()
            : null;
        if (!owner)
            return [this];
        const scopes = [this];
        if (owner.interface)
            scopes.push(owner.interface);
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
//# sourceMappingURL=K_LIB_Krnl_Messaging_Concepts.js.map