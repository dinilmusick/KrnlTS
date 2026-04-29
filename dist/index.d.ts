import http from 'http';

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
    _handleRpcRequest(ws: any, msg: any): Promise<void>;
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
    handleRequest(rpc: any): Promise<any>;
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
    handleMessage(payload: any): Promise<any>;
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
    discoverySocket: any | null;
    beaconInterval: any | null;
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

export { DasyJS, KrnlAcpProtocol, KrnlMcpProtocol, KrnlPolicy, Logger, MemoryTransportAdapter, WebSocketTransportAdapter, createEnum, krnlBackendVisualEntityBase, krnlCollector, krnlData, krnlDataFactory, krnlEmitter, krnlEntityBase, krnlEntityCompositionalHierarchyManager, krnlError, krnlErrorCodes, krnlErrorMessages, krnlGlobalEmitterAddress, krnlInterface, krnlLocalEmitterAddress, krnlLocalFunctionality, krnlMessage, krnlMessageStream, krnlNetworkOrchestratorEntityBase, krnlPrimitiveDataTypes, krnlRemoteFunctionality, krnlServiceSuitePorts, krnlServiceSuites, krnlSubSystemOrchestratorBase, krnlSystemCommComponent, krnlSystemEntityBase, krnlSystemTypes, krnlTransportAdapter, krnlUnifiedHttpAdapter, telemetry };
