import { z } from 'zod';
import http from 'http';
import { Worker } from 'worker_threads';
import { AsyncLocalStorage } from 'async_hooks';
import * as $protobuf from 'protobufjs';
import Long from 'long';
import fs from 'fs';
import { ExecOptions, SpawnOptions } from 'child_process';
import http$1 from 'node:http';

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
interface KrnlTraceContext {
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
declare class krnlData implements KrnlTraceContext {
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
declare class krnlMessage implements KrnlTraceContext {
    data: any;
    timestamp: number;
    sourceEmitterAddress: string | null;
    targetCollectorAddress: string | null;
    traceCorrelationId: string | null;
    originSystemAddress: string | null;
}
declare class krnlEmitter {
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

interface KrnlIntelligenceSpec {
    reasoning: number;
    planning: number;
    toolUsage: number;
    structuredOutput: number;
    jsonStrictness: number;
    coding: number;
    extraction: number;
    classification: number;
    summarization: number;
    creativity: number;
    determinism: number;
    context: number;
    vision: number;
    multimodal: number;
    outputComplexity: number;
}
interface KrnlEndpointDefinition {
    id: string;
    category: 'krnl_system' | 'app';
    method: 'GET' | 'POST';
    visibility: 'public' | 'private';
    inputSchema: any;
    outputSchema: any;
    description: string;
    systemInstructions: string;
    examples: Array<{
        label?: string;
        input: any;
        output?: any;
    }>;
    examplePayload: any;
    intelligenceSpec: KrnlIntelligenceSpec;
    agentTools: string[];
    retryConfig: KrnlPolicy;
    staticWatchVars: string[];
    dynamicWatchVars: string[];
    accessPolicy: KrnlEndpointAccessPolicy | null;
    emitters: string[];
    sourcePath: string | null;
    memory: string;
    uiSpec?: KrnlUiSpec;
    runtimeEdited: boolean;
}
interface KrnlOrchestratorMemory {
    memory: string;
    lastUpdated: number;
}
interface KrnlAiExecutionTrace {
    traceId: string;
    parentTraceId?: string;
    timestamp: number;
    appName: string;
    endpointId: string;
    intelligenceSpec: KrnlIntelligenceSpec;
    promptHash: string;
    retryCount: number;
    validationFailures: string[];
    payload: any;
    executionResult: any;
    latencyMs: number;
    aiLatencyMs: number;
    failureReason?: string;
}
interface KrnlWatchVariable {
    key: string;
    functionalityId: string;
    isStatic: boolean;
    currentValue: any;
}
type KrnlTaskStatus = 'pending' | 'running' | 'done' | 'skipped';
interface KrnlTask {
    id: string;
    endpointId: string;
    prompt: string;
    status: KrnlTaskStatus;
    parentTaskId?: string;
    nestingDepth: number;
    result?: any;
}
interface KrnlLearning {
    id: string;
    concernedEndpoint: string;
    problemDescription: string;
    tags: string[];
    solution: string;
    createdAt: number;
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
    example?: any;
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
 * KrnlManagedServiceConfig
 * Configuration for an external process (micro-server) managed by the system.
 */
interface KrnlManagedServiceConfig {
    /** Unique name for the service. */
    name: string;
    /** Working directory for the process. */
    cwd: string;
    /** Command to execute (e.g., 'node', 'npm'). */
    command: string;
    /** Arguments for the command. */
    args?: string[];
    /** Environment variables to inject. */
    env?: Record<string, string>;
    /** The environment variable name used to pass the assigned port (default: 'PORT'). */
    portEnvVar?: string;
    /** If true, the system waits for the service to start (port check) before proceeding. */
    waitForStartup?: boolean;
    /** Maximum time to wait for startup in milliseconds (default: 30000). */
    startupTimeoutMs?: number;
}
/**
 * KrnlManagedServiceHandle
 * Runtime handle for a managed service instance.
 */
interface KrnlManagedServiceHandle {
    config: KrnlManagedServiceConfig;
    port: number;
    status: 'starting' | 'running' | 'failed' | 'stopped';
    processHandle?: any;
    pid?: number;
}
/**
 * KrnlIngressNetworkMemberConfig
 *
 * ⚠ SIBLING NETWORK ONLY — do NOT use this for embedding sub-apps inside a parent.
 *
 * This config is used exclusively by KrnlSiblingNetwork (formerly KrnlIngressNetwork)
 * to connect independent, standalone KrnlTS applications that each run with their own
 * networking stack (HTTP / WebSocket).
 *
 * For embedded sub-apps use KrnlSubAppConfig + entity.loadSubApps() instead.
 */
interface KrnlIngressNetworkMemberConfig {
    ServiceClass?: any;
    prefix: string;
    /** Port for the standalone sibling app's HTTP/WS server. Not used for sub-apps. */
    port?: number;
    constructorArgs?: any[];
    isKrnl?: boolean;
    entryPath?: string;
}
/**
 * KrnlSubAppExecutionMode
 *
 * Determines how a sub-app is hosted by the parent application.
 * This is a RUNTIME/KERNEL decision set in the parent's krnl.json — the sub-app
 * code never changes regardless of which mode is chosen.
 *
 *   'local'  → sub-app entity lives in the parent process; communication is a
 *               direct in-process method call. Zero networking overhead.
 *
 *   'worker' → sub-app entity lives in a worker_thread managed by the parent;
 *               communication is via MessagePort IPC. No HTTP · No TCP · No WebSocket.
 */
type KrnlSubAppExecutionMode = 'local' | 'worker';
/**
 * KrnlSubAppConfig
 *
 * Configuration passed to entity.loadSubApps() when embedding a KrnlTS app as a
 * sub-app inside a parent. The executionMode is read from the parent's krnl.json
 * and injected here by the MagneticLoader; sub-apps do not declare it themselves.
 */
interface KrnlSubAppConfig {
    /** Directory name of the sub-app under subapps/ */
    prefix: string;
    /** The sub-app class (must extend krnlSystemEntityBase). */
    ServiceClass?: any;
    /** Absolute path to the sub-app's compiled entry module. */
    entryPath?: string;
    /** Execution mode as read from the parent's krnl.json. Defaults to 'local'. */
    executionMode?: KrnlSubAppExecutionMode;
    /** Extra constructor arguments forwarded to the sub-app class. */
    constructorArgs?: any[];
    /** Whether the sub-app is a KrnlTS app (true) or a non-KrnlTS adapter (false). */
    isKrnl?: boolean;
}
/**
 * KrnlSubAppEntry
 *
 * Live registry entry stored in entity._subAppRegistry after a sub-app is loaded.
 */
interface KrnlSubAppEntry {
    prefix: string;
    executionMode: KrnlSubAppExecutionMode;
    /** Local entity instance (local mode) or KrnlSubAppWorkerHost proxy (worker mode). */
    entity: any;
    addedAt: number;
}
interface KrnlUiFieldSpec {
    field: string;
    component: 'KrnlTextInput' | 'KrnlNumberInput' | 'KrnlToggle' | 'KrnlDropdown' | 'KrnlTextArea' | 'KrnlJsonInput' | 'KrnlJsonViewer' | 'KrnlCarousel' | 'KrnlTile' | 'KrnlSSELog';
    label?: string;
    options?: string[];
    placeholder?: string;
    /** Names a globally shared UI component instance across endpoints. */
    sharedComponentId?: string;
    /** Dot-path into response to extract data array (e.g. 'names' or 'data.items'). */
    dataPath?: string;
    /** For object array responses: key for option value (e.g. 'id'). */
    valueKey?: string;
    /** For object array responses: key for option label (e.g. 'name'). */
    labelKey?: string;
    /** Input bind mode: 'selected' sends single item, 'all' sends full array. Defaults to 'selected'. */
    bindMode?: 'selected' | 'all';
    /** If true, output source endpoint is auto-called on mount to pre-populate shared component. */
    autoFetch?: boolean;
}
interface KrnlUiSpec {
    ui_component_enabled: boolean;
    ui_component_type?: 'form' | 'dashboard_tile' | 'monitor' | 'carousel';
    inputs?: KrnlUiFieldSpec[];
    outputs?: KrnlUiFieldSpec[];
}
interface KrnlFrontendOptions {
    title?: string;
    theme?: 'dark' | 'light';
    logoUrl?: string;
    enableMonitoringApi?: boolean;
    customCss?: string;
    frontendDir?: string;
}

interface KrnlEventIntention {
    name: string;
    description: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
}
interface KrnlIntentionFunctionality {
    purpose: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
    state: Record<string, string>;
    events: KrnlEventIntention[];
}
interface KrnlIntentionLibraryCategory {
    name: string;
    purpose: string;
    data: Record<string, string>;
    functions: Record<string, string>;
}
interface KrnlIntentionLibrary {
    purpose: string;
    categories: KrnlIntentionLibraryCategory[];
}
interface KrnlIntentionEntity {
    purpose: string;
    functionalities: KrnlIntentionFunctionality[];
    componentEntities: KrnlIntentionEntity[];
}
declare function buildEntityIntention(entity: any): KrnlIntentionEntity;

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
    uiSpec?: any;
    description?: string;
    method?: string;
    tests?: any[];
    examples?: any[];
    intelligenceSpec?: KrnlIntelligenceSpec;
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
    intention?: KrnlIntentionFunctionality;
    ai?: any;
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
    uiSpec?: any;
    schema?: any;
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
interface CallLogEntry {
    timestamp: number;
    durationMs: number;
    success: boolean;
}
interface LibraryUsageStats {
    calls: number;
    totalDurationMs: number;
    avgDurationMs: number;
}
interface DataUsageStats {
    reads: number;
    writes: number;
}
declare class KrnlTelemetry {
    metrics: Map<string, TelemetryStats>;
    callLogs: Map<string, CallLogEntry[]>;
    libraryUsage: Map<string, LibraryUsageStats>;
    dataUsage: Map<string, DataUsageStats>;
    enabled: boolean;
    ringBufferSize: number;
    aiTraces: any[];
    totalAiCalls: number;
    totalAiRetries: number;
    avgAiLatencyMs: number;
    private runtimeStore;
    constructor();
    setRuntimeStore(store: any): void;
    recordAiTrace(trace: any): void;
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
     * Record library usage (functions/helpers).
     */
    recordLibraryCall(libraryId: string, durationMs: number): void;
    /**
     * Record library data access.
     */
    recordDataAccess(dataKey: string, type?: 'read' | 'write'): void;
    /**
     * Returns a snapshot of all metrics.
     */
    getSummary(): any;
    /**
     * Clears all collected metrics.
     */
    reset(): void;
}
declare const telemetry: KrnlTelemetry;

/**
 * @file K_ENT_Krnl_Entity_Base.ts
 * @description The core Entity class, supporting recursive interface promotion and visibility control.
 */

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
    telemetry: KrnlTelemetry;
    _telemetryEnabled: boolean;
    get telemetryEnabled(): boolean;
    set telemetryEnabled(val: boolean);
    systemType: string;
    interface: krnlInterface;
    localFunctionalities: Map<string, krnlLocalFunctionality>;
    remoteFunctionalities: Map<string, krnlRemoteFunctionality>;
    collectors: Set<any>;
    hierarchyManager: krnlEntityCompositionalHierarchyManager;
    intention?: KrnlIntentionEntity;
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
    _onComponentFunctionalityAdded(component: any, functionality: any): void;
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
        metrics: any;
        callLogs: any;
        libraryUsage: any;
        dataUsage: any;
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
 * @file K_LIB_Krnl_System_Comm_Component.ts
 *
 * @description External P2P communication bridge for STANDALONE KrnlTS applications.
 *
 * This component manages the WebSocket server and WebSocket-RPC protocol used for
 * peer-to-peer communication BETWEEN independent KrnlTS applications (e.g. two separate
 * running processes that need to call each other's functionalities).
 *
 * ⚠ NOT used for sub-app communication.
 * Sub-apps embedded inside a parent entity communicate exclusively via:
 *   - Direct in-process method call (local mode)
 *   - worker_threads MessagePort IPC (worker mode)
 *
 * If you see startWsServer() called on a sub-app entity, that is a bug.
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
    _getWsRpcClient(remoteAddress: string): Promise<any>;
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
 * @file K_LIB_Krnl_System_Ingress_Network.ts
 *
 * SIBLING NETWORK — for connecting INDEPENDENT, STANDALONE KrnlTS applications that each
 * run with their own networking stack (HTTP / WebSocket / WebSocket-RPC).
 *
 * ⚠ DO NOT USE FOR SUB-APPS.
 *
 * Sub-apps embedded inside a parent application are managed entirely by:
 *   - entity.loadSubApps()           → loads sub-apps into _subAppRegistry
 *   - entity.callInternal()          → dispatches calls without any networking
 *   - K_LIB_Krnl_SubApp_Registry.ts → KrnlSubAppLoader (local mode)
 *   - K_LIB_Krnl_SubApp_Worker_Host.ts → KrnlSubAppWorkerHost (worker mode)
 *
 * Sub-apps communicate via:
 *   - Local mode:  direct in-process method call (zero networking overhead)
 *   - Worker mode: worker_threads MessagePort IPC (no HTTP · no TCP · no WebSocket)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The SIBLING NETWORK is for a FUTURE use-case (not currently used by default):
 * multiple independent KrnlTS application instances that form a peer/gateway cluster,
 * each exposing its own HTTP/WS server. For example, a load balancer or API gateway
 * that routes requests across independently deployed KrnlTS services.
 *
 * When you need this, call:
 *   await entity.startSiblingNetwork(siblingConfigs);
 *   // or the deprecated alias:
 *   await entity.startIngressNetwork(siblingConfigs);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * SiblingMemberEntry
 *
 * A single entry in the KrnlSiblingNetwork members map.
 * All members are standalone KrnlTS apps or frontend adapters — NOT embedded sub-apps.
 */
interface SiblingMemberEntry {
    entity: any;
    config: KrnlIngressNetworkMemberConfig;
    addedAt: number;
    memberType?: 'sibling';
}
/** @deprecated Use SiblingMemberEntry. Alias for backward compatibility. */
type IngressMemberEntry = SiblingMemberEntry;
/**
 * KrnlSiblingNetwork
 *
 * Manages a set of independent standalone KrnlTS applications (siblings) behind a
 * shared HTTP/WS gateway. Each sibling has its own networking stack.
 *
 * ⚠ This class is NOT for embedding sub-apps inside a parent entity.
 *   Use entity.loadSubApps() + entity.callInternal() for that purpose.
 */
declare class KrnlSiblingNetwork {
    members: Map<string, SiblingMemberEntry>;
    /**
     * addMember — adds a standalone sibling KrnlTS application to the peer network.
     *
     * The sibling is instantiated and its port is registered in the admin's port registry.
     * Unlike sub-apps, siblings start their own networking and are independently addressable.
     *
     * ⚠ Do not call this for sub-apps. Use entity.loadSubApps() instead.
     */
    addMember(admin: krnlSystemEntityBase, config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase>;
    /**
     * removeMember — removes a sibling from the peer network.
     */
    removeMember(admin: krnlSystemEntityBase, prefix: string): Promise<boolean>;
    /**
     * getGrossManifest — returns a listing of all siblings and their manifest endpoints.
     */
    getGrossManifest(adminBaseUrl: string): any;
    /**
     * getAggregatedMcpTools — collects public MCP tool definitions from all siblings.
     */
    getAggregatedMcpTools(): any[];
    /**
     * routeHttpRequest — routes an incoming HTTP request to the correct sibling's handler.
     * The sibling's own unifiedHttpAdapter handles the request in-process.
     */
    routeHttpRequest(prefix: string, req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void>;
}
/**
 * @deprecated Use KrnlSiblingNetwork. Alias for backward compatibility.
 */
declare const KrnlIngressNetwork: typeof KrnlSiblingNetwork;
type KrnlIngressNetwork = KrnlSiblingNetwork;

interface LogEntry {
    level: 'log' | 'warn' | 'error';
    msg: string;
    ts: string;
}
interface InteractionRecord {
    method: string;
    url: string;
    body: any;
    responseStatus: number;
    responseBody: any;
    durationMs: number;
    ts: string;
    callerIp?: string;
}
declare class KrnlFrontendInspector {
    static manifest(system: any, frontendDir: string): {
        status: string;
        data: {
            appName: any;
            frontendUrl: string;
            theme: string;
            cssFile: string;
            bundleBuilt: boolean;
            bundleFile: string;
            generatedAt: string;
            totalEndpoints: number;
            totalSubApps: number;
            tabLayout: any[];
        };
        summary: string;
    };
    static source(frontendDir: string): {
        status: string;
        message: string;
        data?: undefined;
        summary?: undefined;
    } | {
        status: string;
        data: {
            html: string;
            sizeBytes: number;
            scriptTags: number;
            stylesheetLinks: number;
            hasReactRoot: boolean;
        };
        summary: string;
        message?: undefined;
    };
    static domSnapshot(system: any, frontendDir: string): {
        status: string;
        data: {
            tag: string;
            attrs: {
                lang: string;
                'data-theme': string;
            };
            children: {
                tag: string;
                children: {
                    tag: string;
                    class: string;
                    children: ({
                        tag: string;
                        class: string;
                        text: any;
                        children?: undefined;
                    } | {
                        tag: string;
                        class: string;
                        children: {
                            tag: string;
                            class: string;
                            title: any;
                            text: any;
                            label: any;
                        }[];
                        text?: undefined;
                    })[];
                }[];
            }[];
        };
        summary: string;
    };
    static a11yTree(system: any, frontendDir: string): {
        status: string;
        data: {
            ariaSnapshot: string;
            tree: any[];
        };
        wcagViolations: never[];
        summary: string;
    };
    static components(system: any, frontendDir: string): {
        status: string;
        data: {
            atoms: string[];
            components: {
                id: any;
                file: string;
                inputs: any;
                outputs: any;
                sharedSlots: any[];
                hasPhantomMirroring: boolean;
                sseUrl: any;
                apiUrl: any;
            }[];
        };
        summary: string;
    };
    static endpoints(system: any): {
        status: string;
        data: {
            fid: any;
            uiEnabled: boolean;
            schema: any;
            uiSpec: any;
            apiUrl: string;
            sseUrl: string;
            uiSpecValid: boolean;
            uiSpecErrors: never[];
        }[];
        summary: string;
    };
    static elements(system: any, frontendDir: string): {
        status: string;
        data: {
            buttons: any[];
            inputs: any[];
            selects: any[];
            toggles: any[];
            textareas: any[];
            total: number;
        };
        summary: string;
    };
    static forms(system: any): {
        status: string;
        data: {
            endpointId: any;
            fields: any;
            submitTarget: string;
            method: string;
            hasSharedSlotInputs: any;
        }[];
        summary: string;
    };
    static sharedSlots(system: any): {
        status: string;
        data: any[];
        summary: string;
    };
    static consoleLog(capturedLogs: LogEntry[]): {
        status: string;
        data: {
            logs: LogEntry[];
            warns: LogEntry[];
            errors: LogEntry[];
            total: number;
        };
        summary: string;
    };
    static network(interactions: InteractionRecord[]): {
        status: string;
        data: {
            requests: InteractionRecord[];
            totalRequests: number;
            totalErrors: number;
        };
        summary: string;
    };
    static har(interactions: InteractionRecord[], system: any): {
        log: {
            version: string;
            creator: {
                name: string;
                version: string;
            };
            pages: {
                id: string;
                startedDateTime: string;
                title: any;
                pageTimings: {};
            }[];
            entries: {
                pageref: string;
                startedDateTime: string;
                time: number;
                request: {
                    method: string;
                    url: string;
                    httpVersion: string;
                    headers: {
                        name: string;
                        value: string;
                    }[];
                    queryString: never[];
                    cookies: never[];
                    headersSize: number;
                    bodySize: number;
                    postData: {
                        mimeType: string;
                        text: string;
                    };
                };
                response: {
                    status: number;
                    statusText: string;
                    httpVersion: string;
                    headers: {
                        name: string;
                        value: string;
                    }[];
                    cookies: never[];
                    content: {
                        size: number;
                        mimeType: string;
                        text: string;
                    };
                    redirectURL: string;
                    headersSize: number;
                    bodySize: number;
                };
                cache: {};
                timings: {
                    send: number;
                    wait: number;
                    receive: number;
                };
            }[];
        };
    };
    static audit(system: any, frontendDir: string, capturedLogs: LogEntry[]): {
        status: string;
        data: {
            score: number;
            categories: {
                accessibility: {
                    score: number;
                    title: string;
                };
                bestPractices: {
                    score: number;
                    title: string;
                };
                uiSpec: {
                    score: number;
                    title: string;
                };
            };
            passed: any[];
            warnings: any[];
            failures: any[];
            auditRules: number;
            passingRules: number;
            failingRules: number;
        };
        summary: string;
    };
    static telemetry(system: any, interactions: InteractionRecord[]): {
        status: string;
        data: {
            sseActiveStreams: never[];
            apiCallHistory: any[];
            phantomExecutions: never[];
            totalApiCalls: number;
        };
        summary: string;
    };
    static health(system: any, frontendDir: string, capturedLogs: LogEntry[], interactions: InteractionRecord[]): {
        status: string;
        data: {
            healthy: boolean;
            appName: any;
            endpointsCount: number;
            uiComponentsCount: number;
            sharedSlotsCount: number;
            consoleErrors: number;
            auditScore: number;
            issues: any[];
        };
        summary: string;
    };
}

declare class KrnlFrontend {
    system: any;
    options: KrnlFrontendOptions;
    frontendDir: string;
    subAppFrontendDirs: Map<string, string>;
    interactionsHistory: InteractionRecord[];
    capturedLogs: LogEntry[];
    constructor(system: any, options?: KrnlFrontendOptions);
    private _interceptConsole;
    registerSubAppFrontend(prefix: string, subFrontendDir: string): void;
    handleRequest(req: http.IncomingMessage, res: http.ServerResponse, subpath: string): Promise<void>;
    private _readJsonBody;
}

declare class KrnlAikoClient {
    private baseUrl;
    lastUsedModelId: string | null;
    constructor(aikoPort: number, aikoHost?: string);
    static discover(system: any): KrnlAikoClient | null;
    infer(intelligenceSpec: KrnlIntelligenceSpec, systemPrompt: string, userPrompt: string): Promise<string>;
    downrankModel(modelId: string): Promise<void>;
    fetchCatalog(): Promise<Record<string, any>>;
    isAlive(): Promise<boolean>;
    static getNotRunningMessage(): string;
}

declare class KrnlWatchVariablesTracker {
    private registeredFunctionalities;
    private endpointConfigs;
    register(functionalityId: string, config: KrnlEndpointDefinition, functionality: any): void;
    readLiveVars(endpointId: string): Record<string, any>;
    sharedDynamicVars(endpointA: string, endpointB: string): string[];
    endpointsForVar(varKey: string): string[];
}

declare class KrnlEndpointScheduler {
    private tracker;
    private executing;
    private queue;
    constructor(tracker: KrnlWatchVariablesTracker);
    dispatch(endpointId: string, task: () => Promise<any>): Promise<any>;
    private hasConflict;
    private release;
    private drainQueue;
}

declare class KrnlEndpointAgent {
    readonly definition: KrnlEndpointDefinition;
    private aikoClient;
    private tracker;
    private system;
    private tools;
    constructor(definition: KrnlEndpointDefinition, aikoClient: KrnlAikoClient, tracker: KrnlWatchVariablesTracker, system: krnlSystemEntityBase, tools?: Record<string, any>);
    executeFromNaturalLanguage(naturalLanguageRequest: string): Promise<{
        result: any;
        trace: KrnlAiExecutionTrace;
    }>;
    private buildSystemPrompt;
    private parsePayload;
    private validatePayload;
    private repairLoop;
    private getPromptHash;
}

declare class KrnlRuntimeStore {
    private filePath;
    private data;
    constructor(appRoot: string);
    load(): Promise<void>;
    getEndpointDefinition(endpointId: string): Promise<Partial<KrnlEndpointDefinition> | null>;
    setEndpointDefinition(endpointId: string, config: Partial<KrnlEndpointDefinition>): Promise<void>;
    getAllEndpointDefinitions(): Promise<Record<string, Partial<KrnlEndpointDefinition>>>;
    getEndpointMemory(endpointId: string): Promise<string>;
    appendEndpointMemory(endpointId: string, learning: string): Promise<void>;
    getOrchestratorMemory(): Promise<KrnlOrchestratorMemory>;
    setOrchestratorMemory(memory: string): Promise<void>;
    appendTelemetry(record: any): Promise<void>;
    getTelemetryLog(limit?: number): Promise<any[]>;
    appendLearning(learning: KrnlLearning): Promise<void>;
    searchLearnings(endpointId: string, tags: string[]): Promise<KrnlLearning[]>;
    saveTaskList(listData: {
        tasks: any[];
        cursor: number;
    }): Promise<void>;
    loadTaskList(): Promise<{
        tasks: any[];
        cursor: number;
    } | null>;
    private save;
}

declare class KrnlTaskList {
    tasks: KrnlTask[];
    cursor: number;
    constructor(tasks?: KrnlTask[], cursor?: number);
    static create(items: Array<{
        endpointId: string;
        prompt: string;
    }>, parentTaskId?: string, nestingDepth?: number): KrnlTaskList;
    getCurrentTask(): KrnlTask | null;
    markDone(taskId: string, result: any): boolean;
    markSkipped(taskId: string): boolean;
    nest(nestedItems: Array<{
        endpointId: string;
        prompt: string;
    }>, parentTaskId: string): KrnlTaskList;
    persist(store: KrnlRuntimeStore): Promise<void>;
    static load(store: KrnlRuntimeStore): Promise<KrnlTaskList | null>;
}
declare class KrnlTaskRunner {
    private system;
    private currentList;
    private isExecuting;
    constructor(system: any);
    setTaskList(list: KrnlTaskList): void;
    getTaskList(): KrnlTaskList | null;
    run(list: KrnlTaskList): Promise<void>;
    onSuccess(taskId: string, result: any): Promise<void>;
    receiveSkip(taskId: string): Promise<void>;
    receiveNest(nestedItems: Array<{
        endpointId: string;
        prompt: string;
    }>, parentTaskId: string): Promise<void>;
    getStatus(): any;
    private executeNext;
}

declare class KrnlPlannerAgent {
    private aikoClient;
    private system;
    private runner;
    private tool;
    constructor(aikoClient: KrnlAikoClient, system: any, runner: KrnlTaskRunner);
    plan(naturalLanguageRequest: string, contextData?: string): Promise<KrnlTaskList>;
}

declare class KrnlApplicationOrchestrator {
    private system;
    private aikoClient;
    tracker: KrnlWatchVariablesTracker;
    scheduler: KrnlEndpointScheduler;
    private routingSpec;
    private escalationSpec;
    endpointAgents: Map<string, KrnlEndpointAgent>;
    private store;
    taskRunner: KrnlTaskRunner;
    plannerAgent: KrnlPlannerAgent;
    constructor(system: krnlSystemEntityBase, aikoClient: KrnlAikoClient, tracker: KrnlWatchVariablesTracker, scheduler: KrnlEndpointScheduler, routingSpec: KrnlIntelligenceSpec, escalationSpec: KrnlIntelligenceSpec, store: KrnlRuntimeStore);
    registerAgent(endpointId: string, agent: KrnlEndpointAgent): void;
    getAgentSummaries(): any[];
    handle(naturalLanguageRequest: string): Promise<{
        status: string;
        result: any;
        endpointId: string;
        trace: KrnlAiExecutionTrace;
    }>;
    private selectEndpoint;
    private buildRoutingPrompt;
    private escalate;
    orchestrate(naturalLanguageRequest: string): Promise<void>;
    handleQuery(query: string, context: {
        taskId: string;
        endpointId: string;
    }): Promise<void>;
    _inferTagsFromError(reason: string): string[];
    _compressToLearningField(text: string): string;
    escalateTaskFailure(taskId: string, errorReason: string): Promise<void>;
    private escalateToHuman;
    handleHumanResolution(taskId: string, resolution: {
        action: 'skip' | 'retry' | 'nest';
        tasks?: Array<{
            endpointId: string;
            prompt: string;
        }>;
    }): Promise<void>;
}

/**
 * @file K_ENT_System_Entity_Base.ts
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */

declare class krnlSystemEntityBase extends krnlEntityBase {
    /**
     * _isIngressNetworkMember — true when this entity is a SIBLING of another standalone app
     * inside a KrnlSiblingNetwork (formerly IngressNetwork).
     * NOT set for embedded sub-apps; those use _isSubApp instead.
     */
    _isIngressNetworkMember: boolean;
    /**
     * _siblingNetwork — the sibling-app peer network this entity administers (if any).
     * Used exclusively for connecting independent standalone KrnlTS apps.
     * NEVER used for sub-apps embedded inside this entity.
     */
    _siblingNetwork: KrnlSiblingNetwork | null;
    /** @deprecated Use _siblingNetwork. Alias kept for backward compatibility. */
    get _ingressNetwork(): KrnlSiblingNetwork | null;
    set _ingressNetwork(v: KrnlSiblingNetwork | null);
    _frontendEnabled: boolean;
    _frontend: KrnlFrontend | null;
    /**
     * _isSubApp — true when this entity is embedded inside a parent KrnlTS application.
     * When true:
     *   - Networking (HTTP / WebSocket) is suppressed; _startSharedServer() returns early.
     *   - Registry registration is skipped.
     *   - All communication goes through the parent's callInternal() or MessagePort transport.
     */
    _isSubApp: boolean;
    /**
     * _subAppRegistry — registry of sub-apps embedded in this entity.
     * Populated by loadSubApps(). Keys are lowercase prefix strings.
     */
    _subAppRegistry: Map<string, KrnlSubAppEntry>;
    systemType: string;
    peers: Map<string, any>;
    discoverable: boolean;
    _aiOrchestrator: KrnlApplicationOrchestrator | null;
    _aiTracker: KrnlWatchVariablesTracker | null;
    _aiScheduler: KrnlEndpointScheduler | null;
    _aikoClient: KrnlAikoClient | null;
    _aiProfilesStore: KrnlRuntimeStore | null;
    _aikoCatalog: Record<string, any>;
    _krnlSystemEndpointIds: Set<string>;
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
    /** Registered service configurations for external processes. */
    _serviceConfigs: KrnlManagedServiceConfig[];
    /** Active handles for managed services. */
    _managedServices: Map<string, KrnlManagedServiceHandle>;
    /**
     * _preferredPort — the port hint supplied at construction.
     * Write-once. Never published externally. The actual bound port is commPort
     * (set by finalizeCommPort after a successful server.listen()).
     */
    _preferredPort: number;
    /** Directory where {entityName}.ports.json is written. */
    _entityDataDir: string;
    /** True once gracefulShutdown has been triggered — prevents re-entry. */
    _shuttingDown: boolean;
    /**
     * Internal readiness signaling.
     * Resolves after _startSharedServer successfully binds and finalizeCommPort is called.
     */
    _readyPromise: Promise<void>;
    _resolveReady: () => void;
    _magneticLoadPromise: Promise<void> | null;
    _registryClient: any;
    _registryHeartbeatInterval: any;
    _registryEvictionInterval: any;
    _registryApps: Map<string, any>;
    /**
     * @param name
     * @param owner
     * @param commPort - WS listen port for the commComponent.
     * @param host - Interface to bind to.
     * @param options - Entity options.
     */
    constructor(name: string, owner?: krnlEntityBase | null, commPort?: number, host?: string, options?: any);
    enableFrontend(options?: KrnlFrontendOptions): void;
    _runMagneticLoader(options?: any): Promise<void>;
    /**
     * boot
     * Boot validation & startup entrypoint
     */
    boot(): Promise<void>;
    /**
     * whenReady
     * Await this promise to ensure the system has bound to its final port,
     * written its snapshot file, and is fully operational.
     */
    whenReady(): Promise<void>;
    /**
     * Validates requiredRemotes manifest dependencies upon boot
     */
    private _validateBootManifestDependencies;
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
    loadSubApps(configs: KrnlSubAppConfig[]): Promise<void>;
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
    callInternal(prefix: string, fid: string, input?: any): Promise<any>;
    /**
     * getSubAppTopology
     *
     * Returns a snapshot of all embedded sub-apps registered in this entity,
     * including their execution mode and registration time.
     */
    getSubAppTopology(): any;
    /**
     * startSiblingNetwork (formerly startIngressNetwork)
     *
     * Configures a sibling peer network of independent standalone KrnlTS applications.
     * Each sibling is a full KrnlTS app with its own HTTP/WS server.
     *
     * ⚠ Do NOT call this to host sub-apps. Use loadSubApps() for embedded components.
     */
    startSiblingNetwork(members: KrnlIngressNetworkMemberConfig[]): Promise<void>;
    /**
     * startIngressNetwork — preserved as alias for backward compatibility.
     * @deprecated Use startSiblingNetwork() for connecting standalone sibling apps.
     *             Use loadSubApps() for embedding sub-apps inside this entity.
     */
    startIngressNetwork(members: KrnlIngressNetworkMemberConfig[]): Promise<void>;
    /**
     * joinSiblingNetwork (formerly joinIngressNetwork)
     * Adds a single sibling to the peer network.
     */
    joinSiblingNetwork(config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase>;
    /** @deprecated Use joinSiblingNetwork(). */
    joinIngressNetwork(config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase>;
    /**
     * getSiblingNetworkTopology (formerly getIngressNetworkTopology)
     *
     * Returns the topology of the sibling peer network (standalone apps only).
     * This is NOT related to embedded sub-apps — use getSubAppTopology() for those.
     */
    getSiblingNetworkTopology(): any;
    /** @deprecated Use getSiblingNetworkTopology(). Alias kept for backward compatibility. */
    getIngressNetworkTopology(): any;
    /**
     * port — stable public accessor for the active bound port.
     * Mirrors commPort. Resolves to the OS-assigned value after finalizeCommPort().
     * Use this instead of commPort or commComponent.listenPort.
     */
    get port(): number;
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
    registerPort(serviceName: string, port: number): Promise<void>;
    /** Remove a service port registration. */
    unregisterPort(serviceName: string): Promise<void>;
    /** Return a plain-object snapshot of portRegistry: Record<serviceName, port>. */
    getRegisteredPorts(): Record<string, number>;
    /** Absolute path of the JSON port snapshot co-located with the assembler. */
    _getPortsFilePath(): string;
    /**
     * _writePortsFile — persists portRegistry to disk.
     *
     * Only called by finalizeCommPort() — never from constructor state.
     */
    _writePortsFile(): Promise<void>;
    /** Remove the ports snapshot file on shutdown. */
    _deletePortsFile(): void;
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
    _probeAvailablePort(preferred: number, host: string): Promise<number>;
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
    finalizeCommPort(actualPort: number): Promise<void>;
    _registerWithRegistry(actualPort: number): Promise<void>;
    _startReRegistrationSafetyLoop(actualPort: number): void;
    _deregisterFromRegistry(): Promise<void>;
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
    gracefulShutdown({ timeoutMs }?: {
        timeoutMs?: number;
    }): Promise<void>;
    /**
     * shutdown — public alias for gracefulShutdown().
     * Enables clean consumer code: await system.shutdown()
     * No type-casting or feature detection required.
     */
    shutdown(opts?: {
        timeoutMs?: number;
    }): Promise<void>;
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
    /**
     * registerManagedService
     * Adds an external process configuration to the system's startup sequence.
     * Services are started in the order they are registered.
     */
    registerManagedService(config: KrnlManagedServiceConfig): void;
    /**
     * startManagedServices
     * Sequentially launches all registered external processes.
     * Assigns dynamic ports, injects them into process environment, and updates the port registry.
     */
    startManagedServices(): Promise<void>;
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
    isAikoAlive(): boolean;
    initializeAiLayer(appRoot: string): Promise<void>;
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
    readonly ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505;
}>;
/**
 * Map of Error Codes to human-readable messages.
 */
declare const krnlErrorMessages: Record<number, string>;
declare const CUSTOM_ERROR_CODE = -999;
/**
 * Typed error class for the Krnl system.
 */
declare class krnlError extends Error {
    code: number;
    errorMessage: string;
    constructor(code: number | string);
}

/**
 * @file K_LIB_Krnl_SubApp_Registry.ts
 *
 * @description Sub-app registry and loader for the KrnlTS internal sub-app execution model.
 *
 * Sub-apps are normal KrnlTS applications that can run either standalone (with full networking)
 * or embedded inside a parent application (with no networking). The parent's krnl.json declares
 * the execution mode for each sub-app; the sub-app code itself never changes.
 *
 * Two execution modes:
 *   'local'  — sub-app entity lives in the parent process; calls are direct method invocations.
 *   'worker' — sub-app entity lives in a worker_thread; calls transit via MessagePort IPC.
 *
 * NO networking (HTTP / WebSocket / TCP) is used in either mode.
 *
 * @see K_LIB_Krnl_SubApp_Worker_Host.ts  — Worker-mode parent-side proxy.
 * @see K_LIB_Krnl_SubApp_Worker_Runtime.ts — Worker-side bootstrap loaded inside the thread.
 */

declare class KrnlSubAppLoader {
    /**
     * Loads a single sub-app into the parent entity's _subAppRegistry.
     *
     * For 'local' mode the sub-app class is instantiated directly in the parent process.
     * Networking is suppressed automatically because the entity is constructed inside the
     * subappLocalStorage async context (sets _isSubApp = true) and _startSharedServer()
     * returns early for sub-app entities.
     *
     * For 'worker' mode a worker_thread is spawned and a KrnlSubAppWorkerHost proxy is
     * registered in its place. All calls transit via MessagePort — no TCP/HTTP involved.
     */
    static load(parent: krnlSystemEntityBase, config: KrnlSubAppConfig): Promise<void>;
}

/**
 * @file K_LIB_Krnl_SubApp_Worker_Host.ts
 *
 * @description Parent-process proxy for a sub-app running in an isolated worker_thread.
 *
 * KrnlSubAppWorkerHost wraps a Node.js worker_thread and exposes the same call interface
 * as a local sub-app entity, so the parent's routing code works transparently regardless
 * of which execution mode was chosen.
 *
 * Communication uses worker_threads MessagePort exclusively.
 * No HTTP · No WebSocket · No TCP · No port binding.
 *
 * Wire protocol (MessagePort messages):
 *
 *   Parent → Worker:
 *     { type: 'call',     requestId: string, fid: string, input: any }
 *     { type: 'shutdown'                                              }
 *
 *   Worker → Parent:
 *     { type: 'result',   requestId: string, ok: boolean, result?: any, error?: string }
 *     { type: 'manifest', manifest: any }   // sent once at startup
 */

declare class KrnlSubAppWorkerHost {
    prefix: string;
    _worker: Worker;
    _manifest: any;
    _pending: Map<string, {
        resolve: Function;
        reject: Function;
        timeoutId: ReturnType<typeof setTimeout>;
    }>;
    _ready: Promise<void>;
    _resolveReady: () => void;
    _rejectReady: (err: Error) => void;
    private constructor();
    /**
     * Spawn a worker_thread for the given sub-app config and wait for the manifest.
     */
    static create(config: KrnlSubAppConfig, timeoutMs?: number): Promise<KrnlSubAppWorkerHost>;
    /**
     * Call a functionality on the worker-hosted sub-app.
     * This is the primary dispatch path for worker-mode sub-apps.
     * Uses MessagePort IPC — no networking.
     */
    callInternal(fid: string, input?: any, timeoutMs?: number): Promise<any>;
    /**
     * Alias so both local entities and worker hosts expose the same dispatch surface.
     */
    call(fid: string, input?: any): Promise<any>;
    /**
     * Returns the sub-app manifest obtained from the worker at startup.
     */
    getManifest(): any;
    /**
     * Terminate the worker thread gracefully.
     */
    gracefulShutdown(): Promise<void>;
}

declare const magneticStorage: AsyncLocalStorage<{
    helpers: Record<string, any>;
    events: Record<string, any>;
}>;
declare const subappLocalStorage: any;
declare class KrnlMagneticLoader {
    /**
     * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
     */
    static loadAll(entity: krnlSystemEntityBase, baseDir: string): Promise<void>;
    static loadFunctionality(entity: krnlSystemEntityBase, funcDir: string, funcName: string): Promise<void>;
    static loadEntity(parent: krnlSystemEntityBase, entDir: string, entName: string): Promise<void>;
    static ensureSubAppBuilt(appPath: string, appName: string, entity: any): Promise<boolean>;
    static detectSubApp(appPath: string, appName: string): Promise<any | null>;
    private static registerGlobalWrapper;
}

declare class KrnlNonKrnlAppAdapter extends krnlSystemEntityBase {
    childProcess: any;
    appPort: number;
    appPath: string;
    constructor(name: string, appPath: string);
    startApp(): Promise<void>;
    proxyRequest(req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void>;
    dispose(): void;
}

declare class KrnlFrontendGenerator {
    /**
     * Main entrypoint: ensures skeleton exists, generates React components & index.tsx
     */
    static generate(entity: any, frontendDir: string): Promise<void>;
    /**
     * Ensures essential files (package.json, index.html, index.css, atoms/) exist in frontendDir
     */
    static ensureFrontendSkeleton(entity: any, frontendDir: string): void;
    /**
     * Verifies React dependencies are installed in frontend/
     */
    static checkReactDependencies(frontendDir: string): void;
    /**
     * Validates uiSpec definitions at build time to enforce protocol constraints and catch errors early
     */
    static validateUiSpec(fid: string, uiSpec: KrnlUiSpec): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Generates TSX source code for a single endpoint UI component
     */
    static generateComponentSource(fid: string, uiSpec: KrnlUiSpec, schema: any): string;
    private static renderInputAtom;
    private static renderOutputAtom;
    /**
     * Generates the root index.tsx aggregator with tabs for App components + Sub-Apps
     */
    static generateIndexSource(appName: string, uiEndpoints: {
        id: string;
    }[], subAppPrefixes: string[]): string;
    static generateAtoms(frontendDir: string): void;
}

declare class KrnlFrontendBuilder {
    private static activeContexts;
    /**
     * Bundles frontend/src/index.tsx -> frontend/dist/bundle.js
     */
    static build(frontendDir: string): Promise<boolean>;
    /**
     * Starts esbuild watch mode for live updates during development
     */
    static watch(frontendDir: string): Promise<void>;
    static stop(frontendDir: string): void;
}

interface KrnlRegistryApp {
    name: string;
    port: number;
    pid: number;
    registeredAt: string;
}
declare class KrnlRegistryClient {
    registryPort: number;
    constructor(registryPort?: number);
    private getUrl;
    isRegistryAlive(): Promise<boolean>;
    register(name: string, port: number, pid: number): Promise<boolean>;
    deregister(name: string): Promise<boolean>;
    heartbeat(name: string): Promise<boolean>;
    lookup(name: string): Promise<KrnlRegistryApp | null>;
}

/** Namespace krnl. */
declare namespace krnl {

    /** MessageKind enum. */
    enum MessageKind {

        /** UNKNOWN value */
        UNKNOWN = 0,

        /** REGISTER_INGRESS value */
        REGISTER_INGRESS = 1,

        /** ROUTE_DATA value */
        ROUTE_DATA = 2,

        /** RPC_REQUEST value */
        RPC_REQUEST = 3,

        /** RPC_RESPONSE value */
        RPC_RESPONSE = 4,

        /** INTROSPECT value */
        INTROSPECT = 5,

        /** INTROSPECT_RESPONSE value */
        INTROSPECT_RESPONSE = 6
    }

    /**
     * Properties of a KrnlMessage.
     * @deprecated Use krnl.KrnlMessage.$Properties instead.
     */
    interface IKrnlMessage extends krnl.KrnlMessage.$Properties {
    }

    /** Represents a KrnlMessage. */
    class KrnlMessage {

        /**
         * Constructs a new KrnlMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: krnl.KrnlMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** KrnlMessage kind. */
        kind: krnl.MessageKind;

        /** KrnlMessage routeId. */
        routeId: string;

        /** KrnlMessage requestId. */
        requestId: string;

        /** KrnlMessage traceCorrelationId. */
        traceCorrelationId: string;

        /** KrnlMessage originSystemAddress. */
        originSystemAddress: string;

        /** KrnlMessage timestamp. */
        timestamp: (number|Long);

        /** KrnlMessage method. */
        method: string;

        /** KrnlMessage collectorName. */
        collectorName: string;

        /** KrnlMessage jsonPayload. */
        jsonPayload: string;

        /** KrnlMessage binaryPayload. */
        binaryPayload: Uint8Array;

        /**
         * Creates a new KrnlMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns KrnlMessage instance
         */
        static create(properties: krnl.KrnlMessage.$Shape): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;
        static create(properties?: krnl.KrnlMessage.$Properties): krnl.KrnlMessage;

        /**
         * Encodes the specified KrnlMessage message. Does not implicitly {@link krnl.KrnlMessage.verify|verify} messages.
         * @param message KrnlMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: krnl.KrnlMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified KrnlMessage message, length delimited. Does not implicitly {@link krnl.KrnlMessage.verify|verify} messages.
         * @param message KrnlMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: krnl.KrnlMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a KrnlMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {krnl.KrnlMessage & krnl.KrnlMessage.$Shape} KrnlMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;

        /**
         * Decodes a KrnlMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {krnl.KrnlMessage & krnl.KrnlMessage.$Shape} KrnlMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): krnl.KrnlMessage & krnl.KrnlMessage.$Shape;

        /**
         * Verifies a KrnlMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a KrnlMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns KrnlMessage
         */
        static fromObject(object: { [k: string]: any }): krnl.KrnlMessage;

        /**
         * Creates a plain object from a KrnlMessage message. Also converts values to other types if specified.
         * @param message KrnlMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: krnl.KrnlMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this KrnlMessage to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for KrnlMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace KrnlMessage {

        /** Properties of a KrnlMessage. */
        interface $Properties {

            /** KrnlMessage kind */
            kind?: (krnl.MessageKind|null);

            /** KrnlMessage routeId */
            routeId?: (string|null);

            /** KrnlMessage requestId */
            requestId?: (string|null);

            /** KrnlMessage traceCorrelationId */
            traceCorrelationId?: (string|null);

            /** KrnlMessage originSystemAddress */
            originSystemAddress?: (string|null);

            /** KrnlMessage timestamp */
            timestamp?: (number|Long|null);

            /** KrnlMessage method */
            method?: (string|null);

            /** KrnlMessage collectorName */
            collectorName?: (string|null);

            /** KrnlMessage jsonPayload */
            jsonPayload?: (string|null);

            /** KrnlMessage binaryPayload */
            binaryPayload?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a KrnlMessage. */
        type $Shape = krnl.KrnlMessage.$Properties;
    }

    /**
     * Properties of a RpcResponse.
     * @deprecated Use krnl.RpcResponse.$Properties instead.
     */
    interface IRpcResponse extends krnl.RpcResponse.$Properties {
    }

    /** Represents a RpcResponse. */
    class RpcResponse {

        /**
         * Constructs a new RpcResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: krnl.RpcResponse.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** RpcResponse requestId. */
        requestId: string;

        /** RpcResponse ok. */
        ok: boolean;

        /** RpcResponse error. */
        error: string;

        /** RpcResponse jsonResult. */
        jsonResult: string;

        /** RpcResponse errorDocumentation. */
        errorDocumentation: string;

        /**
         * Creates a new RpcResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RpcResponse instance
         */
        static create(properties: krnl.RpcResponse.$Shape): krnl.RpcResponse & krnl.RpcResponse.$Shape;
        static create(properties?: krnl.RpcResponse.$Properties): krnl.RpcResponse;

        /**
         * Encodes the specified RpcResponse message. Does not implicitly {@link krnl.RpcResponse.verify|verify} messages.
         * @param message RpcResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: krnl.RpcResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RpcResponse message, length delimited. Does not implicitly {@link krnl.RpcResponse.verify|verify} messages.
         * @param message RpcResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: krnl.RpcResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RpcResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {krnl.RpcResponse & krnl.RpcResponse.$Shape} RpcResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): krnl.RpcResponse & krnl.RpcResponse.$Shape;

        /**
         * Decodes a RpcResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {krnl.RpcResponse & krnl.RpcResponse.$Shape} RpcResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): krnl.RpcResponse & krnl.RpcResponse.$Shape;

        /**
         * Verifies a RpcResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RpcResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RpcResponse
         */
        static fromObject(object: { [k: string]: any }): krnl.RpcResponse;

        /**
         * Creates a plain object from a RpcResponse message. Also converts values to other types if specified.
         * @param message RpcResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: krnl.RpcResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RpcResponse to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for RpcResponse
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace RpcResponse {

        /** Properties of a RpcResponse. */
        interface $Properties {

            /** RpcResponse requestId */
            requestId?: (string|null);

            /** RpcResponse ok */
            ok?: (boolean|null);

            /** RpcResponse error */
            error?: (string|null);

            /** RpcResponse jsonResult */
            jsonResult?: (string|null);

            /** RpcResponse errorDocumentation */
            errorDocumentation?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a RpcResponse. */
        type $Shape = krnl.RpcResponse.$Properties;
    }
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
interface KrnlResult<T> {
    status: "success" | "error";
    data?: T;
    message?: string;
    code?: number;
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

interface KrnlSubAppDependency {
    name: string;
    required?: boolean;
}
interface KrnlRequiredRemote {
    fid: string;
    targetEntity: string;
}
interface KrnlManifestDependencies {
    subapps?: KrnlSubAppDependency[];
    requiredRemotes?: KrnlRequiredRemote[];
}
interface KrnlManifestExports {
    publicFunctionalities?: string[];
}
interface KrnlManifest {
    appName: string;
    version?: string;
    entityClass?: string;
    dependencies?: KrnlManifestDependencies;
    exports?: KrnlManifestExports;
}
declare class KrnlBuildValidator {
    /**
     * Reads and parses krnl.json from specified directory
     */
    static readManifest(dirPath: string): KrnlManifest | null;
    /**
     * Validates project dependencies statically at build time.
     * Scans project root krnl.json and checks if required subapps and required remotes can be satisfied.
     */
    static validateProject(projectRoot: string): {
        valid: boolean;
        errors: string[];
    };
}

interface PocerBlockConfig {
    image: string;
    containerName: string;
    hostPort: number;
    containerPort: number;
    protocol: "http" | "https";
    environment?: Record<string, string>;
    stopOnDispose?: boolean;
}
declare class PocerBlock extends krnlSystemEntityBase {
    readonly blockConfig: PocerBlockConfig;
    private _containerReady;
    private _startedByUs;
    private _dockerProvider;
    constructor(name: string, blockConfig: PocerBlockConfig);
    startApp(): Promise<void>;
    proxyRequest(req: http$1.IncomingMessage, res: http$1.ServerResponse, subPath: string): Promise<void>;
    getManifest(): any;
    dispose(): void;
    private ensureDockerEngine;
    private loadLocalImageArchive;
    private _locateBinary;
    private _isContainerRunning;
    private _containerExists;
    private _waitForPort;
}

export { AsyncKit, CUSTOM_ERROR_CODE, CacheKit, type DefaultConnectionBehaviour, type EndpointCategory, FileCache, FileLock, GitManager, type IngressMemberEntry, type InteractionRecord, KrnlAcpProtocol, type KrnlAiExecutionTrace, KrnlAikoClient, KrnlApplicationOrchestrator, KrnlBuildValidator, type KrnlEndpointAccessPolicy, KrnlEndpointAgent, type KrnlEndpointDefinition, KrnlEndpointScheduler, KrnlEnv, type KrnlEventIntention, KrnlFS, KrnlFrontend, KrnlFrontendBuilder, KrnlFrontendGenerator, KrnlFrontendInspector, type KrnlFrontendOptions, type KrnlFunctionality, KrnlHTTP, type KrnlHTTPOptions, KrnlIngressNetwork, type KrnlIngressNetworkMemberConfig, type KrnlIntelligenceSpec, type KrnlIntentionEntity, type KrnlIntentionFunctionality, type KrnlIntentionLibrary, type KrnlIntentionLibraryCategory, KrnlMagneticLoader, type KrnlManagedServiceConfig, type KrnlManagedServiceHandle, type KrnlManifest, type KrnlManifestDependencies, type KrnlManifestExports, KrnlMcpProtocol, KrnlNonKrnlAppAdapter, type KrnlOrchestratorMemory, type KrnlPeer, KrnlPlannerAgent, KrnlPolicy, type KrnlRegistryApp, KrnlRegistryClient, type KrnlRequiredRemote, type KrnlResult, KrnlRuntimeStore, KrnlShell, KrnlSiblingNetwork, type KrnlSubAppConfig, type KrnlSubAppDependency, type KrnlSubAppEntry, type KrnlSubAppExecutionMode, KrnlSubAppLoader, KrnlSubAppWorkerHost, KrnlTaskList, KrnlTaskRunner, type KrnlTraceContext, type KrnlUiFieldSpec, type KrnlUiSpec, type KrnlWatchVariable, KrnlWatchVariablesTracker, LRUCache, type LogEntry, Logger, MemoryTransportAdapter, ObjectKit, PocerBlock, type ReleaseFn, type SiblingMemberEntry, type SpawnHandle, StringKit, TTLCache, type TelemetrySnapshot, WebSocketTransportAdapter, buildEntityIntention, createEnum, defaultConnectionBehaviour, krnlCollector, krnlData, krnlDataFactory, krnlEmitter, krnlEntityBase, krnlEntityCompositionalHierarchyManager, krnlError, krnlErrorCodes, krnlErrorMessages, krnlGlobalEmitterAddress, krnlInterface, krnlLocalEmitterAddress, krnlLocalFunctionality, krnlMessage, krnlNetworkOrchestratorEntityBase, krnlPrimitiveDataTypes, krnl as krnlProto, krnlRemoteFunctionality, krnlServiceSuitePorts, krnlServiceSuites, krnlSubSystemOrchestratorBase, krnlSystemCommComponent, krnlSystemEntityBase, krnlSystemTypes, krnlTransportAdapter, krnlUnifiedHttpAdapter, magneticStorage, subappLocalStorage, telemetry };
