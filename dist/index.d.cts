import { z } from 'zod';
import http from 'http';
import fs from 'fs';
import { ExecOptions, SpawnOptions } from 'child_process';

/**
 * K_LIB_Krnl_Telemetry
 * A lightweight, high-precision telemetry engine for KrnlJS.
 * Tracks latency, frequency, and resource usage per functionality ID.
 */
interface TelemetryStats {
    calls: number;
    errors: number;
    totalLatencyNs: number;
    avgLatencyMs: number;
    peakLatencyMs: number;
    totalMemoryDelta: number;
    avgMemoryDelta: number;
    lastUpdated: number;
}
interface TelemetryTrace {
    startTime: bigint;
    startMemory: number;
}
declare class KrnlTelemetry {
    metrics: Map<string, TelemetryStats>;
    enabled: boolean;
    constructor();
    /**
     * Starts a telemetry trace for a specific functionality.
     * @param fid
     * @returns Trace data
     */
    startTrace(fid: string): TelemetryTrace;
    /**
     * Ends a telemetry trace and updates aggregated metrics.
     * @param fid
     * @param trace
     */
    endTrace(fid: string, trace: TelemetryTrace, success?: boolean): void;
    /**
     * Returns a snapshot of all metrics.
     */
    getSummary(): Record<string, TelemetryStats>;
    /**
     * Clears all collected metrics.
     */
    reset(): void;
}
declare const telemetry: KrnlTelemetry;

/**
 * @file K_LIB_Krnl_Messaging_Concepts.ts
 * @description Core classes for messaging and communication between entities in the Krnl system.
 */
declare class krnlGlobalEmitterAddress {
    systemID: number;
    subSystemID: number;
    entityAddress: number[];
    emitterID: number;
}
declare class krnlLocalEmitterAddress {
    isOwnerEntity: boolean;
    siblingID: number;
    emitterID: number;
}
declare class krnlMessage {
    data: any;
    time: {
        day: number;
        hour: number;
        minute: number;
        seconds: number;
        millisecond: number;
    };
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
declare class krnlMessageStream {
    #private;
    push(message: krnlMessage): void;
    next(): Promise<krnlMessage>;
    [Symbol.asyncIterator](): AsyncGenerator<krnlMessage>;
}
declare class krnlEmitter {
    stream: krnlMessageStream;
    subscribers: ((msg: krnlMessage) => void)[];
    localAddress: krnlLocalEmitterAddress | null;
    constructor();
    /**
     * Pushes data into the emitter's stream and notifies all subscribers.
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
     * Resets the stream and removes all subscribers.
     */
    disconnectEmitter(): void;
}
declare class krnlCollector {
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
declare class krnlInterface {
    ownerEntity: any;
    emitters: krnlEmitter[];
    collectors: krnlCollector[];
    emitterNames: string[];
    collectorNames: string[];
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

/**
 * @file K_LIB_Krnl_Entity_Compositional_Hierarchy.ts
 * @description Manages parent-child relationships and component unique instantiation.
 */
/**
 * KRNL ENTITY COMPOSITIONAL HIERARCHY MANAGER
 * Responsible for the "skeleton" of the system.
 */
declare class krnlEntityCompositionalHierarchyManager {
    self: any;
    owner: any | null;
    EntityClass: any;
    ownedComponents: Map<string, any>;
    componentBaseNames: Map<string, any[]>;
    componentInstanceCounters: Map<string, number>;
    /**
     * @param self - The entity this manager belongs to.
     * @param owner - The parent entity (if any).
     * @param EntityClass - Reference to the Entity base class for instantiation.
     */
    constructor(self: any, owner: any | null, EntityClass: any);
    /**
     * Spawns a unique component entity within this host.
     */
    createComponentEntity(name: string, CustomClass?: any, options?: any): any;
    /**
     * Registers a pre-existing entity instance as a component of this host.
     */
    addComponentEntityInstance(instance: any): void;
    /**
     * Returns a list of all component entities owned by this host.
     */
    getAllOwnedComponentEntities(): any[];
    /**
     * Returns all component entity instances created from the same base component name.
     */
    getOwnedComponentEntitiesByName(name: string): any[];
    /**
     * Returns the parent entity.
     */
    getOwnerEntity(): any | null;
    /**
     * Recursively disposes of all owned components.
     */
    dispose(): void;
    /**
     * Disposes a specific component instance by ID/name.
     */
    disposeComponentEntity(entityId: string): boolean;
}

interface KrnlFunctionality<I = any, O = any> {
    id: string;
    api: (input: I, context: {
        entity: any;
        state: any;
    }) => Promise<O>;
    schema?: z.ZodType<I>;
    visibility?: "public" | "private" | "protected";
    description?: string;
}
interface KrnlPeer {
    id: string;
    address: string;
    lastSeen: number;
    tags?: string[];
    capabilities?: string[];
}
interface TelemetrySnapshot {
    calls: number;
    errors: number;
    avgLatencyMs: number;
    peakLatencyMs: number;
    avgMemoryDelta: number;
}
/**
 * DefaultConnectionBehaviour
 * Governs treatment of ports not listed in allow / allow_with_key / forbid.
 *
 *   allow_unlisted    → unlisted ports pass through   (open endpoints)
 *   ask_key_unlisted  → unlisted ports must supply key (keyed external endpoints)
 *   forbid_unlisted   → unlisted ports are rejected    (internal endpoints)
 */
type DefaultConnectionBehaviour = 'allow_unlisted' | 'ask_key_unlisted' | 'forbid_unlisted';
/**
 * KrnlEndpointAccessPolicy
 *
 * Port-based access control attached to any krnlLocalFunctionality.
 *
 *   P_allow   = allow          — unconditional access
 *   P_key     = allow_with_key — access conditional on valid key
 *   P_forbid  = forbid         — hard block
 *
 * Decision function:
 *   f(p, k) = FORBID  if p ∈ P_forbid
 *             PASS    if p ∈ P_allow
 *             KEY(k)  if p ∈ P_key
 *             default_connection_behaviour(p, k)   otherwise
 */
interface KrnlEndpointAccessPolicy {
    allow: number[];
    allow_with_key: number[];
    forbid: number[];
    default_connection_behaviour: DefaultConnectionBehaviour;
}
/**
 * EndpointCategory — semantic labels for pre-configured access policies.
 *
 *   internal_endpoint          → allow = [registered service ports], default = forbid_unlisted
 *   external_endpoint / free   → default = allow_unlisted
 *   external_endpoint / keyed  → default = ask_key_unlisted  (requires accessKey)
 */
type EndpointCategory = {
    kind: 'internal_endpoint';
} | {
    kind: 'external_endpoint';
    access: 'free' | 'keyed';
    accessKey?: string;
};

/**
 * @file K_LIB_Krnl_Functionality_Types.ts
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
 */

/**
 * TRANSPORT ADAPTER INTERFACE
 */
declare abstract class krnlTransportAdapter {
    abstract call(targetFunction: string, input: any, opts: any): Promise<any>;
}
/**
 * MEMORY TRANSPORT ADAPTER
 * Default adapter for in-memory entity communication.
 */
declare class MemoryTransportAdapter extends krnlTransportAdapter {
    targetEntity: any;
    constructor(targetEntity: any);
    call(targetFunction: string, input: any, opts: any): Promise<any>;
}
/**
 * KRNL LOCAL FUNCTIONALITY
 * The fundamental unit of logic.
 */
declare class krnlLocalFunctionality {
    id: string;
    visibility: string;
    initialState: any;
    api: Function;
    isLocal: boolean;
    sourcePath: string | null;
    helpers: Map<string, any>;
    emitters: Map<string, krnlEmitter>;
    schema: any;
    description?: string;
    method?: string;
    /** Port-based access control policy. Absent = unrestricted. */
    accessPolicy?: KrnlEndpointAccessPolicy;
    /** Shared secret for allow_with_key / ask_key_unlisted gates. */
    accessKey?: string;
    lifecycle: {
        beginning?: Function;
        during?: Function;
        end?: Function;
        failure?: Function;
        teardown?: Function;
    };
    state: any;
    hostEntity: any;
    constructor(config?: any);
    _createObservedState(initialState: any): any;
    _notifyStateChanged(prop: string, value: any): void;
    /**
     * Updates the visibility and handles interface registration/deregistration.
     * This is the mechanism used to STOP bubbling at a certain level.
     */
    setVisibility(v: string): void;
    _unregisterFromInterface(): void;
    _registerInInterface(): void;
    /**
     * checkAccess — port-based access gate.
     *
     * f(p, k) ∈ { PASS, REJECT }
     *   FORBID  if p ∈ P_forbid
     *   PASS    if p ∈ P_allow
     *   KEY(k)  if p ∈ P_allow_with_key
     *   default_connection_behaviour(p, k)   otherwise (unlisted)
     */
    checkAccess(callerPort: number, key?: string): {
        allowed: boolean;
        reason?: string;
    };
    bindToEntity(entity: any): this;
    teardown(): void;
    execute(input: any, opts?: any): Promise<any>;
}
/**
 * KRNL REMOTE FUNCTIONALITY
 * Proxy for recursive bubbling.
 */
declare class krnlRemoteFunctionality {
    id: string;
    targetFunction: string;
    targetEntity: any;
    visibility: string;
    isLocal: boolean;
    transport: krnlTransportAdapter;
    hostEntity: any;
    constructor(config?: any);
    setVisibility(v: string): void;
    _unregisterFromInterface(): void;
    _registerInInterface(): void;
    bindToEntity(entity: any): void;
    execute(input: any, opts?: any): Promise<any>;
}

/**
 * KRNL ENTITY BASE
 * The building block of the Krnl ecosystem.
 */
declare class krnlEntityBase {
    __krnlEntityInstance: boolean;
    id: string;
    entityName: string;
    Singleton: boolean;
    baseName: string;
    instanceNumber: number;
    _telemetryEnabled: boolean;
    get telemetryEnabled(): boolean;
    set telemetryEnabled(val: boolean);
    systemType: string;
    interface: krnlInterface;
    localFunctionalities: Map<string, krnlLocalFunctionality>;
    remoteFunctionalities: Map<string, krnlRemoteFunctionality>;
    collectors: Set<any>;
    hierarchyManager: krnlEntityCompositionalHierarchyManager;
    _decorateResult(result: any, fid: string, input: any): Promise<any>;
    _decorateError(error: any, fid: string, input: any): Promise<any>;
    /**
     * @param name - The unique identity of the entity.
     * @param owner - The parent entity (if any).
     */
    constructor(name: string, owner?: krnlEntityBase | null, options?: any);
    /**
     * Registers a local logic block.
     * If the functionality is 'public', it is automatically promoted to the owner.
     */
    addLocal(localFunctionality: any): krnlLocalFunctionality;
    /**
     * Registers a proxy for a functionality on another entity.
     * If the proxy is 'public', it is promoted to the owner (Recursive Bubbling).
     */
    addRemote(remoteFunctionality: any): krnlRemoteFunctionality;
    /**
     * INTERFACE PROMOTION
     * Handles the automatic bubbling of component logic to the owner.
     */
    _onComponentFunctionalityAdded(component: krnlEntityBase, functionality: any): void;
    /**
     * Removes a promoted remote functionality and recursively propagates removal upward.
     */
    _onComponentFunctionalityRemoved(component: krnlEntityBase, functionalityId: string): void;
    /**
     * Internal helper to trigger promotion of all existing functionalities.
     */
    _promoteAllExistingFunctionalities(): void;
    /**
     * Executes a functionality by ID.
     */
    call(fid: string, input: any, opts?: any): Promise<any>;
    getLocal(fid: string): krnlLocalFunctionality | undefined;
    getRemote(fid: string): krnlRemoteFunctionality | undefined;
    resolveLocalFunctionality(fid: string): any;
    addChild(instance: krnlEntityBase): void;
    getTelemetry(): {
        entity: string;
        timestamp: number;
        metrics: Record<string, TelemetryStats>;
    };
    disposeOwnedComponent(entityId: string): boolean;
    dispose(): void;
}

/**
 * @file K_ENT_Krnl_Sub_System_Orchestrator_Base.ts
 * @description Defines the base class for all sub-system orchestrator entities in the Krnl ecosystem.
 */

declare class krnlSubSystemOrchestratorBase extends krnlEntityBase {
    constructor(name: string, owner: krnlEntityBase);
}

/**
 * @file K_LIB_Krnl_Base_Concepts.ts
 * @description These are building blocks for the basic structures that define the Krnl system.
 */
/**
 * Unified logger with support for synchronous flushing.
 */
declare class Logger {
    static log(...args: any[]): void;
    static error(...args: any[]): void;
    static flush(): void;
}
/**
 * Enum Template Object
 */
declare const EnumTemplate: {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
};
/**
 * Creates an immutable enum object from a list of type names.
 * @param typeNames - An array of strings representing the enum type names.
 */
declare function createEnum<T extends string>(typeNames: T[]): Readonly<Record<T, number> & typeof EnumTemplate>;
declare const krnlSystemTypes: Readonly<Record<"qwnsr" | "brnda" | "symba" | "mosy", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
declare const krnlServiceSuites: Readonly<Record<"UNIFIED_HTTP", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
/**
 * defaultConnectionBehaviour
 * Enum governing unlisted-port policy on an endpoint's access policy.
 *   0 = allow_unlisted   (open)
 *   1 = ask_key_unlisted (keyed)
 *   2 = forbid_unlisted  (restricted)
 */
declare const defaultConnectionBehaviour: Readonly<Record<"allow_unlisted" | "ask_key_unlisted" | "forbid_unlisted", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
declare const krnlServiceSuitePorts: Readonly<{
    readonly UNIFIED_HTTP: 1;
}>;
declare const krnlPrimitiveDataTypes: Readonly<Record<"audio" | "control-signal" | "video" | "MIDI" | "OSC" | "text" | "trigger", number> & {
    types: string[];
    listTypes(): readonly string[];
    getTypeID(typeName: string): number;
}>;
declare class krnlData {
    isSignal: boolean;
    dataType: number;
    transportKind: "single" | "blob" | "stream";
    timestamp: number;
    correlationId: string | number | null;
    sourceId: string | number | null;
    tags: string[] | null;
    data: any;
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
declare class krnlDataFactory {
    static audio(opts: {
        isSignal?: boolean;
        transportKind?: "single" | "blob" | "stream";
        codec?: string;
        sampleRate?: number;
        channels?: number;
        frameIndex?: number;
        buffer?: any;
        extra?: object;
    }): krnlData;
    static control(opts: {
        name: string;
        value: any;
        unit?: string | null;
        curve?: string;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
    static midi(opts: {
        status: number;
        data1: number;
        data2: number;
        channel?: number;
        raw?: any;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
    static text(opts: {
        text: string;
        encoding?: string;
        language?: string;
        contentType?: string;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
    static trigger(opts: {
        name: string;
        value?: number;
        transportKind?: "single" | "blob" | "stream";
        isSignal?: boolean;
        extra?: object;
    }): krnlData;
}
/**
 * A minimalist policy structure for resilience (retries, timeouts).
 * Designed for cross-language portability.
 */
declare class KrnlPolicy {
    maxRetries: number;
    timeoutMs: number;
    retryDelayMs: number;
    backoffStrategy: "LINEAR" | "EXPONENTIAL";
    constructor(opts?: Partial<KrnlPolicy>);
    static default(): KrnlPolicy;
    static resilient(): KrnlPolicy;
}

/**
 * @file K_LIB_Krnl_System_Comm_Component.ts
 *
 * @description The uniform P2P communication bridge for all Krnl system orchestrators.
 */

/**
 * WEBSOCKET TRANSPORT ADAPTER
 * For remote inter-system communication.
 */
declare class WebSocketTransportAdapter extends krnlTransportAdapter {
    commComponent: krnlSystemCommComponent;
    remoteAddress: string;
    /**
     * @param commComponent - The local system's comm component.
     * @param remoteAddress - "host:port" of the remote system.
     */
    constructor(commComponent: krnlSystemCommComponent, remoteAddress: string);
    call(targetFunction: string, input: any, opts?: any): Promise<any>;
}
declare class krnlSystemCommComponent {
    ownerEntity: any;
    listenPort: number;
    host: string;
    routes: Map<string, any>;
    _routeSeq: number;
    _wsServer: any | null;
    _wsClients: Map<string, any>;
    _wsIngress: Map<string, (data: any) => void>;
    _wsPendingRpc: Map<string, any>;
    _wsRpcHandlers: Map<string, Function>;
    _introspectionProvider: (() => Promise<any>) | null;
    /**
     * @param ownerEntity
     * @param listenPort - WS server port (only used in "ws" mode).
     * @param host - Interface to bind to.
     */
    constructor(ownerEntity: any, listenPort?: number, host?: string);
    /**
     * Binds a local emitter directly to another in-process system's collector.
     */
    wireDirectly(localEmitterName: string, remoteCommComponent: krnlSystemCommComponent, remoteCollectorName: string): any;
    /**
     * Starts a WebSocket server so that remote systems can push data into local collectors.
     */
    startWsServer(externalServer?: any): Promise<void>;
    /**
     * Connects to a remote system's CommComponent WS server.
     */
    wireViaWs(localEmitterName: string, remoteAddress: string, remoteCollectorName: string, remoteSystemName: string, options?: any): Promise<any>;
    /**
     * Registers a WS ingress handler.
     */
    registerWsIngress(routeId: string, localCollectorName: string): void;
    defineRpc(methodName: string, handler: Function): void;
    setIntrospectionProvider(providerFn: () => Promise<any>): void;
    callWsRpc(remoteAddress: string, method: string, params?: any, policy?: KrnlPolicy): Promise<any>;
    _handleRpcRequest(ws: any, msg: any, callerPort?: number): Promise<void>;
    _handleIntrospect(ws: any, msg: any): Promise<void>;
    _handleRpcResponse(msg: any): void;
    listRoutes(): any[];
    disconnectRoute(routeId: string, options?: any): void;
    dispose(): void;
}

/**
 * @file K_LIB_Krnl_Protocol_MCP.ts
 * @description Helper for Model Context Protocol (MCP) integration.
 */
declare class KrnlMcpProtocol {
    system: any;
    /**
     * @param system
     */
    constructor(system: any);
    /**
     * Returns the MCP Tools list based on system functionalities.
     */
    listTools(): Promise<any>;
    /**
     * Handles an MCP JSON-RPC request.
     */
    handleRequest(rpc: any, opts?: any): Promise<any>;
}

/**
 * @file K_LIB_Krnl_Protocol_ACP.ts
 * @description Helper for Agent Communication Protocol (ACP) integration.
 */
declare class KrnlAcpProtocol {
    system: any;
    /**
     * @param system
     */
    constructor(system: any);
    /**
     * ACP Information endpoint.
     */
    getInfo(): any;
    /**
     * ACP Capabilities endpoint.
     */
    getCapabilities(): any;
    /**
     * ACP Message endpoint handler.
     */
    handleMessage(payload: any, opts?: any): Promise<any>;
}

/**
 * @file K_LIB_Krnl_System_Unified_Http_Adapter.ts
 * @description Unified HTTP adapter that exposes REST, SSE, MCP, and ACP protocols.
 */

declare class krnlUnifiedHttpAdapter {
    system: any;
    port: number;
    host: string;
    server: http.Server | null;
    _isExternalServer: boolean;
    mcp: KrnlMcpProtocol;
    acp: KrnlAcpProtocol;
    enableFriendlyRouting: boolean;
    /**
     * @param system
     * @param port
     * @param host
     */
    constructor(system: any, port: number, host?: string);
    /**
     * Starts the adapter.
     */
    start(externalServer?: http.Server | null): Promise<void>;
    stop(): void;
    _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
    _handleSse(req: http.IncomingMessage, res: http.ServerResponse, fid: string): void;
    _sendJson(res: http.ServerResponse, status: number, data: any): void;
    _readJsonBody(req: http.IncomingMessage): Promise<any>;
}

/**
 * @file K_ENT_System_Entity_Base.ts
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */

declare class krnlSystemEntityBase extends krnlEntityBase {
    systemType: string;
    peers: Map<string, any>;
    discoverable: boolean;
    reservation: {
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    peerTtlMs: number;
    commPort: number;
    host: string;
    commComponent: krnlSystemCommComponent;
    _sharedServer: http.Server | null;
    serviceSuites: Map<string, any>;
    unifiedHttpAdapter: krnlUnifiedHttpAdapter;
    _documentationProvider: any | null;
    _lastPreemptiveDoc: any | null;
    _lastErrorDoc: any | null;
    discoverySocket: any | null;
    beaconInterval: any | null;
    /** portRegistry: serviceName → port  (P_local ⊆ ℕ) */
    portRegistry: Map<string, number>;
    /**
     * @param name
     * @param owner
     * @param commPort - WS listen port for the commComponent.
     * @param host - Interface to bind to.
     * @param options - Entity options.
     */
    constructor(name: string, owner?: krnlEntityBase | null, commPort?: number, host?: string, options?: any);
    /**
     * Registers a documentation provider to enable automatic result decoration across all protocols.
     */
    setDocumentationProvider(provider: any): void;
    _decorateResult(result: any, fid: string, input: any): Promise<any>;
    _decorateError(err: any, fid: string, input: any): Promise<any>;
    getNotFoundResponse(path: string): any;
    isDiscoveryAvailable(): boolean;
    _emitStartupDiagnostics(): void;
    getSystemFlags(): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    setDiscoverable(value: boolean): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    /**
     * Register a named service port.
     * registerPort(name, p) → portRegistry[name] = p
     * Throws if the port is already claimed by a different service.
     */
    registerPort(serviceName: string, port: number): void;
    /** Remove a service port registration. */
    unregisterPort(serviceName: string): void;
    /** Return a plain-object snapshot of portRegistry: Record<serviceName, port>. */
    getRegisteredPorts(): Record<string, number>;
    /**
     * addInternalEndpoint
     *
     * Registers a functionality accessible ONLY to services whose ports are in
     * the portRegistry (internal microservices). All external ports are forbidden.
     *
     *   policy: allow = [...portRegistry values], default = forbid_unlisted
     */
    addInternalEndpoint(config: any): void;
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
    addExternalEndpoint(config: any, access?: 'free' | 'keyed', accessKey?: string): void;
    reserveFor(serviceName?: string): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    releaseReservation(serviceName?: string | null): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    _assertAvailableForRemoteAccess(requester?: string | null): void;
    getManifest(): {
        entityName: string;
        systemType: string;
        flags: {
            discoverable: boolean;
            busy: boolean;
            reservedBy: string | null;
            reservedAt: number | null;
        };
        telemetry: boolean;
        inputs: {
            collectors: any;
            api: any;
        };
        outputs: {
            emitters: any;
            events: string[];
        };
    };
    startDiscovery(discoveryPort?: number, discoveryHost?: string): Promise<void>;
    _startSharedServer(): Promise<void>;
    activateServiceSuite(suiteName?: string): Promise<void>;
    listPeers(): any[];
    getRemoteEntity(peerId: string): any;
    wire(peerId: string, options: any): Promise<void>;
    _setupRpcHandlers(): void;
    _setupBaseFunctionalities(): void;
    _setupBaseInterface(): void;
    _attachCollectorHandler(collectorName: string, handler: any): void;
    bindProcessSignals(): void;
    dispose(): void;
}

/**
 * @file K_ENT_Krnl_Network_Orchestrator_Entity_Base.ts
 * @description Network-level orchestrator for discovering systems and managing inter-system routes.
 */

declare class krnlNetworkOrchestratorEntityBase extends krnlSystemEntityBase {
    constructor(name?: string, owner?: any, commPort?: number, host?: string);
    getPeerManifest(peerId: string): Promise<any>;
    listPeerRoutes(peerId: string): Promise<any>;
    /**
     * Connects source system emitter -> target system collector.
     */
    connectSystems(sourcePeerId: string, targetPeerId: string, options: any): Promise<any>;
    disconnectPeerRoute(peerId: string, routeId: string, options?: any): Promise<any>;
}

/**
 * @file K_LIB_Krnl_Error_Concepts.ts
 * @description Defines the system-wide error codes, messages, and typed error class for the Krnl ecosystem.
 */
/**
 * Krnl System Error Codes.
 * Integer-based for cross-platform portability (Go, C++, Rust).
 */
declare const krnlErrorCodes: Readonly<{
    readonly ENUM_ID_NOT_FOUND: -1;
    readonly STATE_NOT_FOUND: 100;
    readonly STATE_DUPLICATE_NAME: 101;
    readonly STATE_INDEX_OUT_OF_RANGE: 102;
    readonly FUNCTIONALITY_NOT_DEFINED: 200;
    readonly FUNCTIONALITY_ALREADY_DEFINED: 201;
    readonly FUNCTIONALITY_INSTANCE_NOT_FOUND: 202;
    readonly REMOTE_EXECUTION_FAILED: 203;
    readonly EMITTER_NOT_FOUND: 300;
    readonly COLLECTOR_NOT_FOUND: 301;
    readonly COLLECTOR_NOT_SUBSCRIBED: 302;
    readonly ENTITY_NOT_FOUND: 400;
    readonly ERR_NET_RPC_TIMEOUT_EXCEEDED: 500;
    readonly ERR_NET_RPC_NETWORK_ERROR: 501;
    readonly ERR_NET_RPC_INTERNAL_SERVER_ERROR: 502;
    readonly ERR_SYS_ENTITY_BUSY_RESERVED: 503;
    readonly ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504;
}>;
/**
 * Map of Error Codes to human-readable messages.
 */
declare const krnlErrorMessages: Record<number, string>;
/**
 * Typed error class for the Krnl system.
 */
declare class krnlError extends Error {
    code: number;
    errorMessage: string;
    constructor(code: number | string);
}

declare class krnlBackendVisualEntityBase extends krnlEntityBase {
    constructor(name: any, owner?: null);
    visualCore: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        visible: boolean;
        color: string;
    };
    _setupVisualFunctionalities(): void;
    getVisualSnapshot(): {
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        visible: boolean;
        color: string;
    };
}

/**
 * @file K_LIB_Dasy_JS.js
 * @description The library that provides file operations for reading and writing data with a uniform API using the Browser Origin Private File System (OPFS).
 */
/**
 * DasyJS Class
 * Provides a uniform API for file operations on the JS platform using OPFS.
 */
declare class DasyJS {
    constructor(rootName?: string);
    rootName: string;
    rootDir: FileSystemDirectoryHandle | null;
    /**
     * Initializes the file system access.
     */
    init(): Promise<void>;
    /**
     * Resolves a user path into normalized parts.
     * @param {string} userPath
     * @returns {string[]}
     */
    resolve(userPath: string): string[];
    /**
     * Internal helper to get a file handle.
     */
    getFileHandle(pathParts: any, create?: boolean): Promise<FileSystemFileHandle>;
    createFile(filePath: any): Promise<void>;
    deleteFile(filePath: any): Promise<void>;
    duplicateFile(source: any, destination: any): Promise<void>;
    writeText(filePath: any, data: any): Promise<void>;
    readText(filePath: any): Promise<string>;
    writeBytes(filePath: any, data: any): Promise<void>;
    readBytes(filePath: any): Promise<ArrayBuffer>;
}

/**
 * @file KrnlResult.ts
 * @description Generic, standard typed operation result envelope.
 */
interface KrnlResultEnvelope<T> {
    status: "success" | "error";
    message?: string;
    data?: T;
    code?: string | number;
}
declare class KrnlResult<T> implements KrnlResultEnvelope<T> {
    status: "success" | "error";
    message?: string;
    data?: T;
    code?: string | number;
    private constructor();
    static ok<T>(data?: T, message?: string): KrnlResult<T>;
    static fail<T = any>(message: string, code?: string | number): KrnlResult<T>;
    isSuccess(): boolean;
    isError(): boolean;
}

/**
 * @file ObjectKit.ts
 * @description Deep clone, deep merge, deep equal, object diffing, and dot-notation in-memory path accessor tools.
 */
declare class ObjectKit {
    /**
     * Structurally deep clones an object with circular dependency check.
     */
    static deepClone<T>(obj: T, seen?: Map<any, any>): T;
    /**
     * Recursively deep merges override objects into a base.
     */
    static deepMerge(base: any, ...overrides: any[]): any;
    /**
     * Performs a strict structural equality check.
     */
    static deepEqual(a: any, b: any): boolean;
    /**
     * Performs an object diff between before and after states.
     */
    static objectDiff(before: any, after: any): {
        added: any;
        removed: any;
        changed: any;
    };
    /**
     * Accesses an in-memory object by dot-notation.
     */
    static getPath(obj: any, path: string, defaultValue?: any): any;
    /**
     * Mutates or sets an in-memory object by dot-notation.
     */
    static setPath(obj: any, path: string, value: any): any;
}

/**
 * @file AsyncKit.ts
 * @description sleep, withTimeout, retry, pLimit, debounce, throttle, once, and memoize primitives.
 */
declare class AsyncKit {
    /**
     * Classic sleep/delay.
     */
    static sleep(ms: number): Promise<void>;
    /**
     * Rejects if the task does not finish within ms.
     */
    static withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T>;
    /**
     * Retries an async execution up to maxAttempts times.
     */
    static retry<T>(fn: () => Promise<T>, maxAttempts: number, delayMs?: number): Promise<T>;
    static pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]>;
    /**
     * Debounces a function.
     */
    static debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void;
    /**
     * Throttles a function.
     */
    static throttle<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void;
    /**
     * Wraps a function to run only once and cache its outcome.
     */
    static once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T>;
    /**
     * computational memoization cache helper.
     */
    static memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: Parameters<T>) => string): (...args: Parameters<T>) => ReturnType<T>;
}

/**
 * @file StringKit.ts
 * @description String case conversions, UUID & ShortID generators, and minimal template interpolation.
 */
declare class StringKit {
    static toCamelCase(str: string): string;
    static toPascalCase(str: string): string;
    static toSnakeCase(str: string): string;
    static toKebabCase(str: string): string;
    static toScreamingSnake(str: string): string;
    static toSlug(str: string): string;
    static generateUUID(): string;
    static generateShortId(length?: number): string;
    static generatePrefixedId(prefix: string, length?: number): string;
    static interpolate(tmpl: string, data: Record<string, any>): string;
}

/**
 * @file CacheKit.ts
 * @description LRU cache, TTL cache, Stale-While-Revalidate, and File-system persistent caching.
 */
declare class LRUCache<K, V> {
    private maxSize;
    private cache;
    constructor(maxSize: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    clear(): void;
    size(): number;
}
declare class TTLCache<K, V> {
    private ttlMs;
    private cache;
    constructor(ttlMs: number);
    get(key: K): V | null;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    clear(): void;
}
declare class CacheKit {
    /**
     * Stale-While-Revalidate utility.
     */
    static swr<K, V>(cache: TTLCache<K, V>, key: K, fetchFn: () => Promise<V>): Promise<V>;
}
declare class FileCache<T> {
    private cacheDir;
    constructor(cacheDir: string);
    private getFilePath;
    get(key: string): T | null;
    set(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
}

/**
 * @file KrnlFS.ts
 * @description Robust cross-platform filesystem abstraction layer for KrnlTS.
 */

type ReleaseFn = () => void;
declare class FileLock {
    private static locks;
    static acquire(filePath: string): Promise<ReleaseFn>;
}
declare class KrnlFS {
    static readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    static writeFile(filePath: string, content: string | Buffer): Promise<void>;
    /**
     * Atomic file writing via temp files.
     */
    static writeFileAtomic(filePath: string, content: string | Buffer): Promise<void>;
    static appendFile(filePath: string, content: string | Buffer): Promise<void>;
    static deleteFile(filePath: string): Promise<void>;
    static fileExists(filePath: string): Promise<boolean>;
    static getFileStat(filePath: string): Promise<{
        size: number;
        createdAt: Date;
        modifiedAt: Date;
        isDir: boolean;
    }>;
    static readJSON<T>(filePath: string): Promise<T | null>;
    static writeJSON(filePath: string, data: unknown, indent?: number): Promise<void>;
    static updateJSON<T>(filePath: string, patch: Partial<T>): Promise<T>;
    static ensureDir(dirPath: string): Promise<void>;
    static deleteDir(dirPath: string, recursive?: boolean): Promise<void>;
    static listDir(dirPath: string): Promise<string[]>;
    static walkDir(dirPath: string, filter?: (file: string) => boolean): AsyncIterable<string>;
    static dirExists(dirPath: string): Promise<boolean>;
    static copyDir(src: string, dest: string): Promise<void>;
    static join(...parts: string[]): string;
    static resolve(...parts: string[]): string;
    static relative(from: string, to: string): string;
    static basename(filePath: string, ext?: string): string;
    static dirname(filePath: string): string;
    static extname(filePath: string): string;
    static normalize(filePath: string): string;
    static isSafe(filePath: string, root: string): boolean;
    static firstExisting(candidates: string[]): Promise<string | null>;
    static watchFile(filePath: string, handler: (event: string) => void, debounceMs?: number): fs.FSWatcher;
    static watchDir(dirPath: string, handler: (event: string, filename: string | null) => void, debounceMs?: number): fs.FSWatcher;
    static createTempFile(prefix?: string): string;
    static createTempDir(prefix?: string): string;
    static withTempDir<T>(fn: (tempDir: string) => Promise<T>, prefix?: string): Promise<T>;
}

/**
 * @file KrnlEnv.ts
 * @description Type-safe environment loading and Zod schema config validation tool.
 */

declare class KrnlEnv {
    /**
     * Reads a process environment variable with type coercion and defaults.
     */
    static get<T>(key: string, defaultValue?: T): T;
    /**
     * Asserts environment variable is set and returns its string value.
     */
    static require(key: string): string;
    /**
     * Loads a .env file and injects variables into process.env.
     */
    static load(filePath?: string): void;
    /**
     * Validates the entire config using a Zod schema.
     */
    static schema<T extends z.ZodTypeAny>(zodSchema: T): z.infer<T>;
}

/**
 * @file KrnlShell.ts
 * @description Safe promise-based exec and spawn wrappers with cross-platform command routing.
 */

interface SpawnHandle {
    pid?: number;
    kill: (signal?: NodeJS.Signals | number) => boolean;
    promise: Promise<{
        code: number | null;
        signal: NodeJS.Signals | null;
    }>;
}
declare class KrnlShell {
    /**
     * Promisified command execution.
     */
    static exec(cmd: string, opts?: ExecOptions & {
        timeout?: number;
    }): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Streaming command execution.
     */
    static spawn(cmd: string, args: string[], opts?: SpawnOptions): SpawnHandle;
    /**
     * Defines posix vs win32 specific commands.
     */
    static platform<T>(routing: {
        posix: T;
        win32: T;
    }): T;
    /**
     * Resolves the full path of a binary.
     */
    static which(cmd: string): string | null;
}

/**
 * @file KrnlHTTP.ts
 * @description Safe, type-safe HTTP client wrapper.
 */

interface KrnlHTTPOptions extends RequestInit {
    timeout?: number;
    retries?: number;
}
declare class KrnlHTTP {
    /**
     * Helper to perform fetch with timeout and retries.
     */
    private static requestRaw;
    static request<T>(url: string, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static get<T>(url: string, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static post<T>(url: string, body: any, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static put<T>(url: string, body: any, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static del<T>(url: string, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    /**
     * Creates a client instance.
     */
    static createClient(baseUrl: string, defaultHeaders?: Record<string, string>): {
        get: <T>(path: string, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
        post: <T>(path: string, body: any, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
        put: <T>(path: string, body: any, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
        del: <T>(path: string, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
    };
    /**
     * Streaming SSE / Chunk response.
     */
    static streamResponse(url: string, opts?: KrnlHTTPOptions): AsyncIterable<string>;
}

/**
 * @file GitManager.ts
 * @description Safe project-scoped Git operations.
 */
declare class GitManager {
    static isRepo(dirPath: string): boolean;
    static init(dirPath: string): Promise<void>;
    static clone(repoUrl: string, destPath: string): Promise<void>;
    static commit(dirPath: string, message: string): Promise<boolean>;
    static push(dirPath: string, remote?: string, branch?: string): Promise<void>;
}

export { AsyncKit, CacheKit, DasyJS, type DefaultConnectionBehaviour, type EndpointCategory, FileCache, FileLock, GitManager, KrnlAcpProtocol, type KrnlEndpointAccessPolicy, KrnlEnv, KrnlFS, type KrnlFunctionality, KrnlHTTP, type KrnlHTTPOptions, KrnlMcpProtocol, type KrnlPeer, KrnlPolicy, KrnlResult, type KrnlResultEnvelope, KrnlShell, LRUCache, Logger, MemoryTransportAdapter, ObjectKit, type ReleaseFn, type SpawnHandle, StringKit, TTLCache, type TelemetrySnapshot, WebSocketTransportAdapter, createEnum, defaultConnectionBehaviour, krnlBackendVisualEntityBase, krnlCollector, krnlData, krnlDataFactory, krnlEmitter, krnlEntityBase, krnlEntityCompositionalHierarchyManager, krnlError, krnlErrorCodes, krnlErrorMessages, krnlGlobalEmitterAddress, krnlInterface, krnlLocalEmitterAddress, krnlLocalFunctionality, krnlMessage, krnlMessageStream, krnlNetworkOrchestratorEntityBase, krnlPrimitiveDataTypes, krnlRemoteFunctionality, krnlServiceSuitePorts, krnlServiceSuites, krnlSubSystemOrchestratorBase, krnlSystemCommComponent, krnlSystemEntityBase, krnlSystemTypes, krnlTransportAdapter, krnlUnifiedHttpAdapter, telemetry };
