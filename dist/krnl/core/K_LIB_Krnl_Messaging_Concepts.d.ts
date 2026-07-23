/**
 * @file K_LIB_Krnl_Messaging_Concepts.ts
 * @description Core classes for messaging and communication between entities in the Krnl system.
 */
import { KrnlTraceContext } from "./K_LIB_Krnl_Base_Concepts.js";
export declare class krnlGlobalEmitterAddress {
    systemID: number;
    subSystemID: number;
    entityAddress: number[];
    emitterID: number;
}
export declare class krnlLocalEmitterAddress {
    isOwnerEntity: boolean;
    siblingID: number;
    emitterID: number;
}
export declare class krnlMessage implements KrnlTraceContext {
    data: any;
    timestamp: number;
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
export declare class krnlEmitter {
    subscribers: ((msg: krnlMessage) => void)[];
    localAddress: krnlLocalEmitterAddress | null;
    constructor();
    /**
     * Pushes data into the emitter and notifies all subscribers.
     */
    pushDataStreamToEmitter(data: any, time?: any, transform?: (msg: krnlMessage) => krnlMessage): void;
    /**
     * Subscribes a handler to this emitter. Handler is called on every push.
     */
    subscribe(handler: (msg: krnlMessage) => void): () => void;
    /**
     * Subscribes once and auto-unsubscribes after first message.
     */
    subscribeOnce(handler: (msg: krnlMessage) => void): () => void;
    /**
     * Resets the emitter and removes all subscribers.
     */
    disconnectEmitter(): void;
}
export declare class krnlCollector {
    emitter: krnlEmitter | null;
    unsubscribe: (() => void) | null;
    _directHandler?: (msg: krnlMessage) => any;
    constructor();
    /**
     * Subscribes this collector to an emitter. Messages are forwarded to the handler.
     */
    subscribeTo(emitter: krnlEmitter, handler?: ((msg: krnlMessage) => void) | null, options?: any): () => void;
    /**
     * Collects a single message from the emitter and auto-disconnects.
     */
    collectNext(emitter: krnlEmitter, timeoutMs?: number | null): Promise<krnlMessage>;
    /**
     * Pipes messages from a connected emitter through a transform function.
     */
    pipeTo(target: any, fn: (msg: krnlMessage) => void): () => void;
    /**
     * Pushes data directly into this collector's connected emitter.
     */
    pushDataStreamToEmitter(data: any): void;
    /**
     * Disconnects from the current emitter.
     */
    disconnectCollector(): void;
}
export declare class krnlInterface {
    ownerEntity: any;
    emitters: Map<string, krnlEmitter>;
    collectors: Map<string, krnlCollector>;
    constructor(ownerEntity: any);
    /**
     * Creates and registers a new emitter.
     */
    createEmitter(name: string): krnlEmitter;
    /**
     * Creates and registers a new collector.
     */
    createCollector(name: string): krnlCollector;
    /**
     * Gets an emitter by name.
     */
    getEmitter(name: string): krnlEmitter;
    /**
     * Gets a collector by name.
     */
    getCollector(name: string): krnlCollector;
    /**
     * Removes an emitter by name.
     */
    removeEmitter(name: string): void;
    /**
     * Removes a collector by name.
     */
    removeCollector(name: string): void;
    /**
     * Gets all emitters in scope (self + owner + siblings).
     */
    getEmittersInScope(): krnlEmitter[];
    /**
     * Gets all interfaces in scope (self, owner, and siblings).
     */
    getInterfacesInScope(): krnlInterface[];
    /**
     * Disconnects all emitters and collectors.
     */
    dispose(): void;
}
//# sourceMappingURL=K_LIB_Krnl_Messaging_Concepts.d.ts.map