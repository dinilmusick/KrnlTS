import { z } from 'zod';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
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
interface KrnlRequiresSpec {
    /** IDs of functionalities that must have been executed at least once. */
    functionalitiesExecuted?: string[];
    /** Arbitrary named flags that must be set to true on the host entity. */
    flags?: string[];
    /** Custom async check function — returns null if OK, error string if blocked. */
    check?: (entity: any) => Promise<string | null> | string | null;
}
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
    /**
     * SELECTION-SOURCE PATTERN (mandatory for finite-choice inputs):
     * The endpoint ID in this same app whose response supplies the options for this field.
     * When set, the UI generator will:
     *   1. Auto-call that endpoint on component mount.
     *   2. Populate this field's dropdown from the response.
     *   3. Eliminate manual text-entry for finite-choice fields.
     *
     * MUST be paired with a KrnlDropdown component.
     * Example: { field: 'provider', component: 'KrnlDropdown', sourceEndpointId: 'ListProviders', dataPath: 'providers' }
     */
    sourceEndpointId?: string;
    /** Dot-path into response to extract data array (e.g. 'providers' or 'data.items'). */
    dataPath?: string;
    /** For object array responses: key for option value (e.g. 'id', 'name'). */
    valueKey?: string;
    /** For object array responses: key for option label (e.g. 'displayName', 'name'). */
    labelKey?: string;
    /** Input bind mode: 'selected' sends single item, 'all' sends full array. Defaults to 'selected'. */
    bindMode?: 'selected' | 'all';
    /** If true, output source endpoint is auto-called on mount to pre-populate shared component. */
    autoFetch?: boolean;
    /**
     * DEPENDENT DROPDOWN: field name in this same form whose value should filter this dropdown.
     * When the upstream field changes, this dropdown re-fetches its options filtered by the new value.
     * Example: modelName dropdown filters by the selected provider.
     */
    filterBy?: string;
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
    /**
     * UI Endpoint Allowlist — EXCLUSIVE filter.
     *
     * When provided, ONLY the endpoint IDs listed here will have UI components
     * generated and rendered. All other endpoints (including built-in system
     * endpoints like heartbeat, getTelemetry, etc.) are suppressed from the UI.
     *
     * When omitted, all endpoints with `ui_component_enabled: true` in their
     * uiSpec are included (legacy behaviour).
     *
     * Example:
     *   uiEndpoints: ['ListKeys', 'StoreKey', 'RetrieveKey', 'DeleteKey']
     */
    uiEndpoints?: string[];
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
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS: KrnlTS Universal Backend Architecture & Workspace Storage Spec
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Complete type contracts for Control Plane (RBAC, Audit Logging, Multi-App User Context,
 *          Database Clusters), Workspace Storage Architecture (Decoupled Storage Adapters,
 *          Provider-Independent WorkspaceFS, Multi-Cloud Sync Engine, Conflict Resolution).
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
type StorageMode = "local" | "local_hosted" | "remote";
type BackendServiceType = "sqlite" | "postgres" | "supabase" | "pocketbase" | "firebase" | "turso" | "mongodb" | "custom_api" | "filesystem" | "s3" | "vercel_blob" | "google_drive" | "onedrive" | "custom";
type StorageProviderType = "local" | "google_drive" | "onedrive" | "supabase_storage" | "firebase_storage" | "s3" | "vercel_blob" | "custom";
type UserRole = "USER" | "MODERATOR" | "ADMIN" | "user" | "moderator" | "admin";
type ClusterDatabaseRole = "primary" | "redundant_clone" | "read_replica";
type SyncMode = "on_write" | "interval" | "manual";
type ConflictStrategy = "primary_wins" | "newest_wins" | "manual";
type StorageEndpointStatus = "CONNECTED" | "DISCONNECTED" | "SYNCING" | "ERROR";
type StorageEndpointSyncState = "SYNCED" | "OUT_OF_SYNC" | "PENDING" | "ERROR";
type Unsubscribe = () => void;
interface DatabaseProviderConfig {
    type: "sqlite" | "postgres" | "supabase" | "pocketbase" | "firebase" | "turso" | "mongodb" | "custom_api" | "custom";
    filePath?: string;
    enableWAL?: boolean;
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
    poolSize?: number;
    endpoint?: string;
    apiKey?: string;
    authToken?: string;
    projectId?: string;
    collectionName?: string;
    headers?: Record<string, string>;
}
interface StorageProviderConfig {
    type: "filesystem" | "s3" | "supabase_storage" | "pocketbase_storage" | "firebase_storage" | "vercel_blob" | "google_drive" | "onedrive" | "custom";
    basePath?: string;
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    endpoint?: string;
    apiKey?: string;
    token?: string;
    projectId?: string;
    accountId?: string;
    rootFolderId?: string;
}
interface AuthConfig {
    jwtSecret?: string;
    apiKey?: string;
    token?: string;
    endpoint?: string;
}
interface BackendConnectionConfig {
    id: string;
    name?: string;
    provider: BackendServiceType;
    mode: StorageMode;
    endpoint?: string;
    database?: DatabaseProviderConfig;
    storage?: StorageProviderConfig;
    auth?: AuthConfig;
}
interface SecretReference {
    vaultKey: string;
    envVar?: string;
}
interface LocalStorageConfiguration {
    provider: "local";
    directoryHandle?: any;
    basePath?: string;
    displayPath?: string;
}
interface GoogleDriveConfiguration {
    provider: "google_drive";
    accountId: string;
    rootFolderId: string;
    authenticationReference?: SecretReference;
    accessToken?: string;
}
interface OneDriveConfiguration {
    provider: "onedrive";
    accountId: string;
    rootFolderId: string;
    authenticationReference?: SecretReference;
    accessToken?: string;
}
interface SupabaseStorageConfiguration {
    provider: "supabase_storage";
    projectUrl: string;
    bucket: string;
    authenticationReference?: SecretReference;
    apiKey?: string;
}
interface FirebaseStorageConfiguration {
    provider: "firebase_storage";
    projectId: string;
    bucket: string;
    authenticationReference?: SecretReference;
    apiKey?: string;
}
interface S3StorageConfiguration {
    provider: "s3";
    bucket: string;
    region?: string;
    endpoint?: string;
    accessKey?: string;
    secretKey?: string;
}
interface CustomStorageConfiguration {
    provider: "custom";
    [key: string]: any;
}
type ProviderConfiguration = LocalStorageConfiguration | GoogleDriveConfiguration | OneDriveConfiguration | SupabaseStorageConfiguration | FirebaseStorageConfiguration | S3StorageConfiguration | CustomStorageConfiguration;
interface StorageEndpoint {
    id: string;
    provider: StorageProviderType;
    configuration: ProviderConfiguration;
    enabled: boolean;
    status: StorageEndpointStatus;
    lastSyncAt?: number;
    syncState?: StorageEndpointSyncState;
    errorMessage?: string;
}
interface FileMetadata {
    path: string;
    type: "file" | "directory";
    size: number;
    modifiedAt: number;
    contentHash?: string;
    revision?: string;
    mimeType?: string;
}
interface FileEntry {
    path: string;
    name: string;
    type: "file" | "directory";
    size: number;
    modifiedAt: number;
}
type FileChangeCallback = (event: {
    type: "create" | "update" | "delete";
    path: string;
    metadata?: FileMetadata;
}) => void;
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * INTERFACE: WorkspaceStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provider-independent contract implemented by Local, Google Drive, OneDrive,
 *          Supabase, and Firebase storage providers.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
interface WorkspaceStorageAdapter {
    readonly provider: StorageProviderType;
    readonly endpointId: string;
    initialize(): Promise<void>;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
    watch?(pathStr: string, callback: FileChangeCallback): Unsubscribe;
    disconnect(): Promise<void>;
}
interface RetryConfiguration {
    maxAttempts: number;
    backoffMs: number;
}
interface VerificationConfiguration {
    verifyChecksums: boolean;
    intervalMs?: number;
}
interface SyncConfiguration {
    enabled: boolean;
    mode: SyncMode;
    intervalMs?: number;
    conflictStrategy: ConflictStrategy;
    deletePropagation: boolean;
    retry: RetryConfiguration;
    verification: VerificationConfiguration;
}
interface SyncResult {
    ok: boolean;
    syncedFiles: string[];
    failedEndpoints: Array<{
        endpointId: string;
        error: string;
    }>;
    timestamp: number;
    durationMs: number;
}
interface RestoreResult {
    ok: boolean;
    restoredFromEndpointId: string;
    filesRestoredCount: number;
    timestamp: number;
    errorMessage?: string;
}
interface VerificationResult {
    ok: boolean;
    totalFiles: number;
    matchedFiles: number;
    divergentFiles: Array<{
        path: string;
        primaryHash?: string;
        backupHashes: Record<string, string>;
    }>;
    timestamp: number;
}
interface ISyncEngine {
    initialize(workspace: Workspace, primary: WorkspaceStorageAdapter, backups: WorkspaceStorageAdapter[]): Promise<void>;
    sync(workspace: Workspace): Promise<SyncResult>;
    syncFile(pathStr: string): Promise<SyncResult>;
    restore(backup: StorageEndpoint): Promise<RestoreResult>;
    verify(workspace: Workspace): Promise<VerificationResult>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    shutdown(): Promise<void>;
}
interface WorkspacePreferences {
    theme?: string;
    autoSave?: boolean;
    defaultView?: string;
    customSettings?: Record<string, any>;
}
interface Workspace {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    primaryStorage: StorageEndpoint;
    backupStorages: StorageEndpoint[];
    sync: SyncConfiguration;
    preferences: WorkspacePreferences;
    metadata: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
interface AppPreferences {
    workspaceOrder?: string[];
    defaultWorkspaceId?: string;
    customTheme?: string;
    [key: string]: any;
}
interface AppUserContext {
    appId: string;
    enabled: boolean;
    preferences: AppPreferences;
    workspaces: Workspace[];
    createdAt: number;
    updatedAt: number;
}
interface GlobalUserIdentity {
    displayName?: string;
    avatarUrl?: string;
    locale?: string;
    timezone?: string;
}
interface User {
    id: string;
    credentials: AuthCredentials;
    identity: GlobalUserIdentity;
    role: UserRole;
    apps: Record<string, AppUserContext>;
    createdAt: number;
    updatedAt: number;
}
interface IWorkspaceFS {
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    readText(pathStr: string): Promise<string>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}
interface IWorkspaceRuntime {
    readonly workspace: Workspace;
    readonly primary: WorkspaceStorageAdapter;
    readonly backups: WorkspaceStorageAdapter[];
    readonly filesystem: IWorkspaceFS;
    readonly syncEngine: ISyncEngine;
    initialize(): Promise<void>;
    changePrimary(newPrimaryEndpointId: string): Promise<void>;
    addBackup(endpoint: StorageEndpoint): Promise<void>;
    detachStorage(endpointId: string): Promise<void>;
    dispose(): Promise<void>;
}
interface ApplicationRuntimeState {
    currentUser: User;
    currentApp: AppUserContext;
    currentWorkspace?: Workspace;
    workspaceRuntime?: IWorkspaceRuntime;
}
interface DatabaseClusterEntry {
    id: string;
    name: string;
    role: ClusterDatabaseRole;
    enabled: boolean;
    config: DatabaseProviderConfig;
    lastSyncTimestamp?: number;
    lastHealthCheckLatencyMs?: number;
    healthStatus?: "HEALTHY" | "DEGRADED" | "OFFLINE";
    errorDetails?: string;
}
interface DatabaseClusterVault {
    version: string;
    primaryDatabaseId: string;
    clusters: DatabaseClusterEntry[];
    updatedAt: number;
}
interface AuditLogEntry {
    id: string;
    timestamp: number;
    actorUserId: string;
    actorRole: UserRole;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    status: "SUCCESS" | "FAILURE" | "SECURITY_DENIED";
}
interface WorkspaceDescriptor {
    id: string;
    ownerId: string;
    name: string;
    backendConfig?: BackendConnectionConfig;
    workspaceSpec?: Workspace;
    createdAt: number;
    updatedAt: number;
}
interface AuthCredentials {
    email?: string;
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    [key: string]: any;
}
interface UserProfile {
    id: string;
    email?: string;
    username?: string;
    role: UserRole;
    metadata?: Record<string, any>;
    apps?: Record<string, AppUserContext>;
    createdAt: number;
}
interface AuthSession {
    userId: string;
    role: UserRole;
    token: string;
    expiresAt: number;
    user?: UserProfile;
}
interface IAccountProvider {
    getUser(userId: string): Promise<UserProfile | null>;
    getFullUser?(userId: string): Promise<User | null>;
    authenticate(credentials: AuthCredentials): Promise<AuthSession>;
    verifySession(token: string | null): Promise<AuthSession | null>;
    listWorkspaces(userId: string, appId?: string): Promise<WorkspaceDescriptor[]>;
    createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>, appId?: string): Promise<WorkspaceDescriptor>;
    deleteWorkspace(userId: string, workspaceId: string, appId?: string): Promise<boolean>;
    getAppUserContext?(userId: string, appId: string): Promise<AppUserContext | null>;
    updateAppPreferences?(userId: string, appId: string, preferences: Partial<AppPreferences>): Promise<AppPreferences>;
}
interface IWorkspaceDataProvider {
    readonly engine: BackendServiceType;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(tableName: string, schema?: Record<string, any>): Promise<void>;
    query<T = any>(queryStr: string, params?: any[]): Promise<T[]>;
    execute(commandStr: string, params?: any[]): Promise<{
        affectedRows: number;
        lastInsertId?: string | number;
    }>;
    find<T = any>(table: string, filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string, filter?: Record<string, any>): Promise<number>;
    clear(table: string): Promise<void>;
}
interface IStorageProvider {
    readonly driver: string;
    uploadFile(pathStr: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(pathStr: string): Promise<Buffer>;
    deleteFile(pathStr: string): Promise<boolean>;
    getPublicUrl(pathStr: string): string;
    listFiles(prefix?: string): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
}
interface IWorkspaceBackend {
    readonly id: string;
    readonly mode: StorageMode;
    readonly data: IWorkspaceDataProvider;
    readonly storage: IStorageProvider;
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
interface IFunctionalityTable<T = any> {
    readonly tableName: string;
    readonly service: BackendServiceType;
    readonly provider: IWorkspaceDataProvider;
    find(filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    findOne(filter: Record<string, any> | string): Promise<T | null>;
    create(record: T): Promise<T>;
    insert(record: T | T[]): Promise<T | T[]>;
    update(filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    upsert(record: T, keyField?: string): Promise<T>;
    count(filter?: Record<string, any>): Promise<number>;
    query(rawQueryOrFilter: any, params?: any[]): Promise<any>;
    clear(): Promise<void>;
}
type FunctionalityBackendFlag = boolean | BackendServiceType | FunctionalityBackendConfig;
interface FunctionalityBackendConfig {
    enabled?: boolean;
    service?: BackendServiceType;
    table?: string;
    schema?: Record<string, any>;
    credentials?: DatabaseProviderConfig;
}
interface EntityBackendSettings {
    defaultService?: BackendServiceType;
    sqlite?: DatabaseProviderConfig;
    postgres?: DatabaseProviderConfig;
    supabase?: DatabaseProviderConfig;
    pocketbase?: DatabaseProviderConfig;
    firebase?: DatabaseProviderConfig;
    turso?: DatabaseProviderConfig;
    mongodb?: DatabaseProviderConfig;
    custom_api?: DatabaseProviderConfig;
    filesystem?: StorageProviderConfig;
    s3?: StorageProviderConfig;
    vercel_blob?: StorageProviderConfig;
    google_drive?: StorageProviderConfig;
    onedrive?: StorageProviderConfig;
    custom?: Record<string, any>;
}

/**
 * @file FunctionalityTable.ts
 * @description Built-in CRUD table engine for krnlLocalFunctionality instances.
 */

declare class FunctionalityTable<T = any> implements IFunctionalityTable<T> {
    readonly tableName: string;
    readonly service: BackendServiceType;
    readonly provider: IWorkspaceDataProvider;
    private isTableInitialized;
    constructor(tableName: string, provider: IWorkspaceDataProvider);
    private ensureInitialized;
    find(filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    findOne(filter: Record<string, any> | string): Promise<T | null>;
    create(record: T): Promise<T>;
    insert(record: T | T[]): Promise<T | T[]>;
    update(filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    upsert(record: T, keyField?: string): Promise<T>;
    count(filter?: Record<string, any>): Promise<number>;
    query(rawQueryOrFilter: any, params?: any[]): Promise<any>;
    clear(): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: WorkspaceBackendFactory
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Resolves decoupled data and storage engine providers, performs live connection
 *          latency probes, and resolves hierarchical credential cascades with local fallback.
 *
 * Cascade Resolution Flow Chart:
 *   [Functionality Execution]
 *              │
 *              ▼
 *   [1. Feature-Level Custom Credentials?] ──(Yes)──► [Use Feature Credentials]
 *              │ (No)
 *              ▼
 *   [2. Host Entity Configured Backend?]   ──(Yes)──► [Use Entity Service Config]
 *              │ (No / Fail)
 *              ▼
 *   [3. Fallback to Local SQLite/POSIX]    ─────────► [Use Safe Offline Engine]
 *
 * Example:
 *   const backend = WorkspaceBackendFactory.createLocal("./workspace.sqlite", "./storage");
 *   const credentials = WorkspaceBackendFactory.resolveCredentialsCascade(featureConfig, entitySettings);
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class WorkspaceBackendFactory {
    static create(config: BackendConnectionConfig): IWorkspaceBackend;
    static createLocal(filePath?: string, storagePath?: string): IWorkspaceBackend;
    /**
     * Resolves the credential cascade hierarchy:
     * 1. Feature-level explicit credentials
     * 2. Host entity configured credentials
     * 3. Fallback to local SQLite
     */
    static resolveCredentialsCascade(functionalityConfig?: FunctionalityBackendConfig | boolean | string, entitySettings?: EntityBackendSettings, defaultFallback?: DatabaseProviderConfig): DatabaseProviderConfig;
    static resolveDataProvider(config: BackendConnectionConfig): IWorkspaceDataProvider;
    static resolveStorageProvider(config: BackendConnectionConfig): IStorageProvider;
}

/**
 * @file LocalSQLiteAccountProvider.ts
 * @description Local SQLite/JSON-backed Control Plane Account Provider for user accounts,
 *              AppUserContext, and Workspace Storage specifications.
 */

declare class LocalSQLiteAccountProvider implements IAccountProvider {
    private filePath;
    private isLoaded;
    private db;
    constructor(filePath?: string);
    private load;
    private persist;
    getUser(userId: string): Promise<UserProfile | null>;
    getFullUser(userId: string): Promise<User | null>;
    registerUser(credentials: AuthCredentials & {
        role?: UserRole;
    }): Promise<UserProfile>;
    authenticate(credentials: AuthCredentials): Promise<AuthSession>;
    verifySession(token: string | null): Promise<AuthSession | null>;
    getAppUserContext(userId: string, appId: string): Promise<AppUserContext | null>;
    updateAppPreferences(userId: string, appId: string, preferences: Partial<AppPreferences>): Promise<AppPreferences>;
    listWorkspaces(userId: string, appId?: string): Promise<WorkspaceDescriptor[]>;
    createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>, appId?: string): Promise<WorkspaceDescriptor>;
    deleteWorkspace(userId: string, workspaceId: string, appId?: string): Promise<boolean>;
}

/**
 * @file HostedAccountProvider.ts
 * @description Hosted Control Plane Account Provider for cloud authentication services.
 */

declare class HostedAccountProvider implements IAccountProvider {
    private endpoint;
    private apiKey?;
    constructor(config: AuthConfig);
    private getHeaders;
    getUser(userId: string): Promise<UserProfile | null>;
    authenticate(credentials: AuthCredentials): Promise<AuthSession>;
    verifySession(token: string | null): Promise<AuthSession | null>;
    listWorkspaces(userId: string): Promise<WorkspaceDescriptor[]>;
    createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor>;
    deleteWorkspace(_userId: string, workspaceId: string): Promise<boolean>;
}

/**
 * @file ControlPlaneManager.ts
 * @description High-level manager coordinating user accounts, workspace registry, and session resolution.
 */

declare class ControlPlaneManager {
    readonly accountProvider: IAccountProvider;
    constructor(providerOrPath?: IAccountProvider | string);
    static createLocal(filePath?: string): ControlPlaneManager;
    static createHosted(endpoint: string, apiKey?: string): ControlPlaneManager;
    login(credentials: AuthCredentials): Promise<AuthSession>;
    verifyToken(token: string | null): Promise<AuthSession | null>;
    getUser(userId: string): Promise<UserProfile | null>;
    getUserWorkspaces(userId: string): Promise<WorkspaceDescriptor[]>;
    registerWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: AdminGuard
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Strict API boundary authorization guard enforcing role-based access control
 *          (RBAC: ADMIN / MODERATOR / USER) on administrative and sensitive operations.
 *
 * Flow Chart:
 *   [Protected Action] ───► [Extract Bearer Token] ───► [Verify Session]
 *                                                               │
 *                                                               ▼
 *                                                    [Check Allowed Roles]
 *                                                    ├── (Match) ──► [Grant Access]
 *                                                    └── (Fail)  ──► [Throw AccessDenied]
 *
 * Example Usage:
 *   const session = await AdminGuard.verify(authHeader, accountProvider);
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class AdminGuard {
    /**
     * Verifies that the session token is valid and belongs to an ADMIN.
     */
    static verify(authHeaderOrToken: string | null | undefined, accountProvider: IAccountProvider): Promise<AuthSession>;
    /**
     * Verifies that the session token is valid and belongs to either a MODERATOR or ADMIN.
     */
    static verifyModeratorOrAdmin(authHeaderOrToken: string | null | undefined, accountProvider: IAccountProvider): Promise<AuthSession>;
    /**
     * Generalized RBAC verification against a list of allowed roles.
     */
    static verifyRole(authHeaderOrToken: string | null | undefined, accountProvider: IAccountProvider, allowedRoles?: UserRole[]): Promise<AuthSession>;
    /**
     * Synchronous assertion on pre-resolved session.
     */
    static enforce(session: AuthSession | null | undefined, allowedRoles?: UserRole[]): void;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: AuditLogger
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Records immutable audit trails for all administrative mutations, user status changes,
 *          backend connection switches, and cluster failover events.
 *
 * Flow Chart:
 *   [Admin Mutation / State Change] ───► [Construct AuditLogEntry]
 *                                                    │
 *                                                    ▼
 *                                          [Append to Audit Vault] ───► [.krnl/audit_trail.jsonl]
 *
 * Example Usage:
 *   const auditLogger = new AuditLogger("./.krnl/control_plane/audit_trail.jsonl");
 *   await auditLogger.log({
 *     actorUserId: "admin_01",
 *     actorRole: "ADMIN",
 *     action: "PROMOTE_DATABASE_PRIMARY",
 *     resource: "cluster_db_turso",
 *     status: "SUCCESS"
 *   });
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class AuditLogger {
    private filePath;
    constructor(filePath?: string);
    /**
     * Records an immutable audit log entry.
     */
    log(params: {
        actorUserId: string;
        actorRole: UserRole;
        action: string;
        resource: string;
        details?: Record<string, any>;
        ipAddress?: string;
        status?: "SUCCESS" | "FAILURE" | "SECURITY_DENIED";
    }): Promise<AuditLogEntry>;
    /**
     * Retrieves historical audit entries with optional filtering.
     */
    query(filter?: {
        actorUserId?: string;
        action?: string;
        status?: string;
        actorRole?: UserRole;
        limit?: number;
    }): Promise<AuditLogEntry[]>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: DatabaseClusterManager
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Manages multi-backend redundancy clusters, real-time connection latency testing,
 *          snapshot synchronization, dynamic primary promotion, and automatic failover.
 *
 * Topology Flow Chart:
 *   [Admin / Health Monitor] ───► [Test Latencies] ───► [Detect Primary Spike / Failure]
 *                                                               │
 *                                                               ▼
 *                                                    [Promote Redundant Clone]
 *                                                               │
 *                                                               ▼
 *                                                    [Demote Old Primary] ───► [Audit Trail]
 *
 * Example Usage:
 *   const clusterManager = new DatabaseClusterManager("./.krnl/control_plane/database_cluster.json");
 *   await clusterManager.promoteToPrimary("cluster_turso_edge", "admin_01");
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class DatabaseClusterManager {
    private vaultPath;
    private auditLogger;
    private inMemoryVault;
    constructor(vaultPath?: string, auditLogger?: AuditLogger);
    private init;
    getVault(): DatabaseClusterVault;
    private saveVault;
    /**
     * Tests a database connection and measures real-time round-trip latency in milliseconds.
     */
    testDatabaseConnection(config: DatabaseProviderConfig): Promise<{
        ok: boolean;
        latencyMs: number;
        errorDetails?: string;
    }>;
    /**
     * Promotes a redundant clone to the active primary role, auto-demoting the existing primary.
     */
    promoteToPrimary(targetDatabaseId: string, actorUserId?: string): Promise<DatabaseClusterVault>;
    /**
     * Adds or updates a database cluster entry.
     */
    upsertClusterEntry(entry: DatabaseClusterEntry, actorUserId?: string): Promise<DatabaseClusterVault>;
    /**
     * Synchronizes data snapshots across all enabled redundant backup clones.
     */
    syncRedundantDatabases(): Promise<{
        syncedCount: number;
        timestamp: number;
    }>;
}

declare function calculateContentHash(data: Uint8Array | Buffer | string): string;
declare function normalizeWorkspacePath(pathStr: string): string;
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: BaseWorkspaceStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Abstract base implementing common event subscription, validation, and metadata logic.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare abstract class BaseWorkspaceStorageAdapter implements WorkspaceStorageAdapter {
    abstract readonly provider: StorageProviderType;
    abstract readonly endpointId: string;
    protected watchers: Map<string, Set<FileChangeCallback>>;
    protected isInitialized: boolean;
    abstract initialize(): Promise<void>;
    abstract exists(pathStr: string): Promise<boolean>;
    abstract stat(pathStr: string): Promise<FileMetadata>;
    abstract list(pathStr?: string): Promise<FileEntry[]>;
    abstract read(pathStr: string): Promise<Uint8Array>;
    abstract write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    abstract mkdir(pathStr: string): Promise<void>;
    abstract delete(pathStr: string): Promise<void>;
    abstract move(source: string, destination: string): Promise<void>;
    abstract copy(source: string, destination: string): Promise<void>;
    watch(pathStr: string, callback: FileChangeCallback): Unsubscribe;
    protected notifyWatchers(event: {
        type: "create" | "update" | "delete";
        path: string;
        metadata?: FileMetadata;
    }): void;
    disconnect(): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: LocalStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Local filesystem storage adapter supporting POSIX filesystem (Node.js) and
 *          File System Access API abstraction (Browser).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class LocalStorageAdapter extends BaseWorkspaceStorageAdapter {
    readonly provider: StorageProviderType;
    readonly endpointId: string;
    private basePath;
    constructor(endpointId: string, config: LocalStorageConfiguration);
    private getFullPath;
    initialize(): Promise<void>;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: GoogleDriveStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Google Drive REST API, managing virtual hierarchical
 *          files and folders under a designated rootFolderId.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class GoogleDriveStorageAdapter extends BaseWorkspaceStorageAdapter {
    readonly provider: StorageProviderType;
    readonly endpointId: string;
    private rootFolderId;
    private accountId;
    private virtualDrive;
    constructor(endpointId: string, config: GoogleDriveConfiguration);
    initialize(): Promise<void>;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: OneDriveStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Microsoft OneDrive / Microsoft Graph REST API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class OneDriveStorageAdapter extends BaseWorkspaceStorageAdapter {
    readonly provider: StorageProviderType;
    readonly endpointId: string;
    private accountId;
    private rootFolderId;
    private items;
    constructor(endpointId: string, config: OneDriveConfiguration);
    initialize(): Promise<void>;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: SupabaseStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Supabase Storage buckets (S3 / PostgREST compatible).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class SupabaseStorageAdapter extends BaseWorkspaceStorageAdapter {
    readonly provider: StorageProviderType;
    readonly endpointId: string;
    private projectUrl;
    private bucket;
    private objects;
    constructor(endpointId: string, config: SupabaseStorageConfiguration);
    initialize(): Promise<void>;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: FirebaseStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Firebase Cloud Storage buckets (GCS REST API compatible).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class FirebaseStorageAdapter extends BaseWorkspaceStorageAdapter {
    readonly provider: StorageProviderType;
    readonly endpointId: string;
    private projectId;
    private bucket;
    private blobs;
    constructor(endpointId: string, config: FirebaseStorageConfiguration);
    initialize(): Promise<void>;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}

type AdapterConstructor = new (endpointId: string, configuration: any) => WorkspaceStorageAdapter;
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: StorageAdapterFactory
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Decoupled factory instantiating and caching WorkspaceStorageAdapter instances
 *          for Local, Google Drive, OneDrive, Supabase, and Firebase storage endpoints.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class StorageAdapterFactory {
    private static registry;
    private static instanceCache;
    static register(provider: string, adapterClass: AdapterConstructor): void;
    static create(endpoint: StorageEndpoint): WorkspaceStorageAdapter;
    static clearCache(): void;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: WorkspaceFS
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provider-independent filesystem operating strictly on the Primary Storage Adapter
 *          and coordinating with SyncEngine for asynchronous backup replication.
 *
 * Write Flow Chart:
 *   [Application Write] ──► [WorkspaceFS.write()] ──► [Primary Adapter Write]
 *                                                               │
 *                                                   (Success) ──┴── (Failure)
 *                                                       │               │
 *                                                       ▼               ▼
 *                                            [SyncEngine.syncFile()] [Throw Error]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class WorkspaceFS implements IWorkspaceFS {
    private primary;
    private syncEngine?;
    private workspace;
    constructor(primary: WorkspaceStorageAdapter, workspace: Workspace, syncEngine?: ISyncEngine);
    setPrimary(newPrimary: WorkspaceStorageAdapter): void;
    setSyncEngine(engine: ISyncEngine): void;
    exists(pathStr: string): Promise<boolean>;
    stat(pathStr: string): Promise<FileMetadata>;
    list(pathStr?: string): Promise<FileEntry[]>;
    read(pathStr: string): Promise<Uint8Array>;
    readText(pathStr: string): Promise<string>;
    write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
    mkdir(pathStr: string): Promise<void>;
    delete(pathStr: string): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    copy(source: string, destination: string): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: SyncEngine
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Replicates Primary Storage mutations to 0..N Backup Storage Adapters, executes
 *          hash/revision conflict resolution, automated retry queues, and explicit restore.
 *
 * Comparison Priority:
 *   contentHash (SHA-256) ──► revision ──► modifiedAt ──► size
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class SyncEngine implements ISyncEngine {
    private workspace;
    private primary;
    private backups;
    private intervalTimer;
    private isPaused;
    private retryQueue;
    initialize(workspace: Workspace, primary: WorkspaceStorageAdapter, backups: WorkspaceStorageAdapter[]): Promise<void>;
    updateAdapters(primary: WorkspaceStorageAdapter, backups: WorkspaceStorageAdapter[]): void;
    sync(workspace: Workspace): Promise<SyncResult>;
    syncFile(pathStr: string): Promise<SyncResult>;
    private enqueueRetry;
    private processRetryQueue;
    restore(backupEndpoint: StorageEndpoint): Promise<RestoreResult>;
    verify(workspace: Workspace): Promise<VerificationResult>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    shutdown(): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: WorkspaceRuntime
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Complete runtime container orchestrating a Workspace's Primary Storage Adapter,
 *          Replicated Backup Adapters, WorkspaceFS abstraction, and SyncEngine lifecycle.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class WorkspaceRuntime implements IWorkspaceRuntime {
    workspace: Workspace;
    primary: WorkspaceStorageAdapter;
    backups: WorkspaceStorageAdapter[];
    filesystem: WorkspaceFS;
    syncEngine: SyncEngine;
    private isInitialized;
    constructor(workspace: Workspace);
    static create(workspace: Workspace): Promise<WorkspaceRuntime>;
    initialize(): Promise<void>;
    changePrimary(newPrimaryEndpointId: string): Promise<void>;
    addBackup(endpoint: StorageEndpoint): Promise<void>;
    detachStorage(endpointId: string): Promise<void>;
    dispose(): Promise<void>;
}

/**
 * @file SQLiteDataProvider.ts
 * @description SQLite Data Provider supporting WAL mode, automatic table schemas, and ACID operations.
 */

declare class SQLiteDataProvider implements IWorkspaceDataProvider {
    readonly engine: "sqlite";
    private filePath;
    private enableWAL;
    private isConnected;
    private tables;
    constructor(config?: DatabaseProviderConfig | string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(tableName: string, _schema?: Record<string, any>): Promise<void>;
    private persist;
    private getTableRows;
    private matchesFilter;
    find<T = any>(table: string, filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string, filter?: Record<string, any>): Promise<number>;
    clear(table: string): Promise<void>;
    query<T = any>(queryStr: string, _params?: any[]): Promise<T[]>;
    execute(commandStr: string, _params?: any[]): Promise<{
        affectedRows: number;
        lastInsertId?: string | number;
    }>;
}

/**
 * @file PostgresDataProvider.ts
 * @description PostgreSQL Data Provider supporting connection pools, SSL enforcement, and CRUD operations.
 */

declare class PostgresDataProvider implements IWorkspaceDataProvider {
    readonly engine: "postgres";
    private config;
    private isConnected;
    constructor(config: DatabaseProviderConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(_tableName: string, _schema?: Record<string, any>): Promise<void>;
    find<T = any>(_table: string, _filter?: Record<string, any>, _options?: any): Promise<T[]>;
    findOne<T = any>(_table: string, _filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(_table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(_table: string, _filter: Record<string, any> | string, _patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(_table: string, _filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(_table: string, _filter?: Record<string, any>): Promise<number>;
    clear(_table: string): Promise<void>;
    query<T = any>(_queryStr: string, _params?: any[]): Promise<T[]>;
    execute(_commandStr: string, _params?: any[]): Promise<{
        affectedRows: number;
    }>;
}

/**
 * @file SupabaseDataProvider.ts
 * @description Supabase PostgREST Data Provider with latency ping and REST CRUD operations.
 */

declare class SupabaseDataProvider implements IWorkspaceDataProvider {
    readonly engine: "supabase";
    private endpoint;
    private apiKey;
    private isConnected;
    constructor(config: DatabaseProviderConfig);
    private getHeaders;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(_tableName: string, _schema?: Record<string, any>): Promise<void>;
    private buildQueryString;
    find<T = any>(table: string, filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string, filter?: Record<string, any>): Promise<number>;
    clear(table: string): Promise<void>;
    query<T = any>(queryStr: string, _params?: any[]): Promise<T[]>;
    execute(_commandStr: string, _params?: any[]): Promise<{
        affectedRows: number;
    }>;
}

/**
 * @file PocketBaseDataProvider.ts
 * @description PocketBase REST Data Provider for collection records CRUD and filtering.
 */

declare class PocketBaseDataProvider implements IWorkspaceDataProvider {
    readonly engine: "pocketbase";
    private endpoint;
    private apiKey?;
    private isConnected;
    constructor(config: DatabaseProviderConfig);
    private getHeaders;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(_tableName: string, _schema?: Record<string, any>): Promise<void>;
    private buildFilterParam;
    find<T = any>(table: string, filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string, filter?: Record<string, any>): Promise<number>;
    clear(table: string): Promise<void>;
    query<T = any>(queryStr: string, _params?: any[]): Promise<T[]>;
    execute(_commandStr: string, _params?: any[]): Promise<{
        affectedRows: number;
    }>;
}

/**
 * @file FirebaseDataProvider.ts
 * @description Firebase Firestore REST Data Provider for document collections CRUD.
 */

declare class FirebaseDataProvider implements IWorkspaceDataProvider {
    readonly engine: "firebase";
    private projectId;
    private apiKey?;
    private isConnected;
    constructor(config: DatabaseProviderConfig);
    private get baseUrl();
    private get urlSuffix();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(_tableName: string, _schema?: Record<string, any>): Promise<void>;
    /**
     * Translates plain JavaScript object into Firestore document value structure
     */
    private toFirestoreFields;
    private toFirestoreValue;
    /**
     * Translates Firestore document into standard JavaScript object
     */
    private fromFirestoreDoc;
    private fromFirestoreValue;
    find<T = any>(table: string, filter?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
    }): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string, filter?: Record<string, any>): Promise<number>;
    clear(table: string): Promise<void>;
    query<T = any>(queryStr: string, _params?: any[]): Promise<T[]>;
    execute(_commandStr: string, _params?: any[]): Promise<{
        affectedRows: number;
    }>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: TursoLibSQLDataProvider
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provides high-speed, edge-distributed SQLite query execution over Turso LibSQL HTTP API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class TursoLibSQLDataProvider implements IWorkspaceDataProvider {
    readonly engine: BackendServiceType;
    private config;
    private isConnected;
    constructor(config: DatabaseProviderConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(tableName: string): Promise<void>;
    query<T = any>(queryStr: string, params?: any[]): Promise<T[]>;
    execute(commandStr: string, params?: any[]): Promise<{
        affectedRows: number;
    }>;
    find<T = any>(table: string, filter?: Record<string, any>): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string): Promise<number>;
    clear(table: string): Promise<void>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: MongoAtlasDataProvider
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provides serverless document querying and mutations against MongoDB Atlas Data API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class MongoAtlasDataProvider implements IWorkspaceDataProvider {
    readonly engine: BackendServiceType;
    private config;
    private isConnected;
    constructor(config: DatabaseProviderConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{
        ok: boolean;
        latencyMs: number;
        details?: any;
    }>;
    ensureTable(tableName: string): Promise<void>;
    private callAtlasAction;
    query<T = any>(queryStr: string): Promise<T[]>;
    execute(): Promise<{
        affectedRows: number;
    }>;
    find<T = any>(table: string, filter?: Record<string, any>): Promise<T[]>;
    findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
    insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
    update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{
        affectedRows: number;
    }>;
    delete(table: string, filter: Record<string, any> | string): Promise<{
        affectedRows: number;
    }>;
    count(table: string, filter?: Record<string, any>): Promise<number>;
    clear(table: string): Promise<void>;
}

/**
 * @file FilesystemStorageProvider.ts
 * @description Local Filesystem Storage Provider using KrnlFS for zero-cloud file persistence.
 */

declare class FilesystemStorageProvider implements IStorageProvider {
    readonly driver: "filesystem";
    private basePath;
    constructor(config?: StorageProviderConfig | string);
    uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, _mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(targetPath: string): Promise<Buffer>;
    deleteFile(targetPath: string): Promise<boolean>;
    getPublicUrl(targetPath: string): string;
    listFiles(prefix?: string): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
}

/**
 * @file SupabaseStorageProvider.ts
 * @description Supabase Storage Provider for bucket-based file uploads and asset URLs.
 */

declare class SupabaseStorageProvider implements IStorageProvider {
    readonly driver: "supabase_storage";
    private endpoint;
    private apiKey;
    private bucket;
    constructor(config: StorageProviderConfig);
    private getHeaders;
    uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(targetPath: string): Promise<Buffer>;
    deleteFile(targetPath: string): Promise<boolean>;
    getPublicUrl(targetPath: string): string;
    listFiles(prefix?: string): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
}

/**
 * @file S3StorageProvider.ts
 * @description S3-Compatible Storage Provider supporting AWS S3, MinIO, and Cloudflare R2.
 */

declare class S3StorageProvider implements IStorageProvider {
    readonly driver: "s3";
    private endpoint;
    private bucket;
    private region;
    private accessKey?;
    private secretKey?;
    constructor(config: StorageProviderConfig);
    private getBaseUrl;
    uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(targetPath: string): Promise<Buffer>;
    deleteFile(targetPath: string): Promise<boolean>;
    getPublicUrl(targetPath: string): string;
    listFiles(_prefix?: string): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
}

/**
 * @file PocketBaseStorageProvider.ts
 * @description PocketBase Storage Provider for file uploads and downloads.
 */

declare class PocketBaseStorageProvider implements IStorageProvider {
    readonly driver: "pocketbase_storage";
    private endpoint;
    private bucket;
    constructor(config: StorageProviderConfig);
    uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(targetPath: string): Promise<Buffer>;
    deleteFile(targetPath: string): Promise<boolean>;
    getPublicUrl(targetPath: string): string;
    listFiles(_prefix?: string): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
}

/**
 * @file FirebaseStorageProvider.ts
 * @description Firebase Cloud Storage REST Provider for binary assets and public download URLs.
 */

declare class FirebaseStorageProvider implements IStorageProvider {
    readonly driver: "firebase_storage";
    private bucket;
    private apiKey?;
    constructor(config: StorageProviderConfig);
    private get baseUrl();
    uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(targetPath: string): Promise<Buffer>;
    deleteFile(targetPath: string): Promise<boolean>;
    getPublicUrl(targetPath: string): string;
    listFiles(_prefix?: string): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: VercelBlobStorageProvider
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provides serverless blob storage uploading, downloading, and URL resolution
 *          via Vercel Blob REST API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class VercelBlobStorageProvider implements IStorageProvider {
    readonly driver = "vercel_blob";
    private config;
    constructor(config: StorageProviderConfig);
    uploadFile(path: string, content: Buffer | Uint8Array | string, mimeType?: string): Promise<{
        url: string;
        size: number;
    }>;
    downloadFile(path: string): Promise<Buffer>;
    deleteFile(path: string): Promise<boolean>;
    getPublicUrl(path: string): string;
    listFiles(): Promise<Array<{
        path: string;
        size: number;
        updatedAt: number;
    }>>;
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
interface KrnlFunctionalityManifest {
    version?: string;
    author?: string;
    tags?: string[];
    category?: string;
    /** Runtime npm dependencies this functionality requires: { "axios": "^1.0.0" } */
    dependencies?: Record<string, string>;
    /** Dev/build-only npm dependencies */
    devDependencies?: Record<string, string>;
    /** Build tool requirements, e.g. ['esbuild', 'typescript'] */
    buildRequirements?: string[];
    /** Declared AI capabilities */
    capabilities?: string[];
    /** External resources needed: env vars, files */
    resources?: {
        type: 'env' | 'file';
        name: string;
        required?: boolean;
    }[];
}
interface KrnlWorkspaceRequirements {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    buildRequirements: string[];
    resources: {
        type: 'env' | 'file';
        name: string;
        required?: boolean;
    }[];
    conflicts?: {
        package: string;
        versionA: string;
        versionB: string;
        sources: string[];
    }[];
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
    /** Optional Functionality Manifest declaring dependencies, capabilities, and resources */
    manifest?: KrnlFunctionalityManifest | null;
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
    requires?: KrnlRequiresSpec;
    _hasBeenExecuted: boolean;
    backend?: FunctionalityBackendFlag | null;
    table?: IFunctionalityTable | null;
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
    private _initializeBackendTable;
    teardown(): void;
    execute(input: any, opts?: any): Promise<any>;
    private _checkRequires;
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
    backendSettings?: EntityBackendSettings;
    /**
     * Configures backend services and credentials for this entity and cascading child functionalities.
     */
    configureBackend(settings: EntityBackendSettings): this;
    /**
     * Resolves backend credentials for a specific service, cascading from parent entities if necessary.
     */
    getBackendCredentials(service?: BackendServiceType): DatabaseProviderConfig | undefined;
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
 * @file K_LIB_Krnl_Protocol_Adapter.ts
 * @description Contract for protocol adapters attached to Entities.
 *
 * In the Gross Architecture model:
 * - Adapters are declarative capabilities attached to an Entity.
 * - They become operational ONLY while that entity occupies root position.
 * - When an entity is adopted by a parent, it relinquishes root position and stops its adapters.
 * - The entity tree and its bubbling system remain the canonical capability authority.
 */
interface KrnlCapabilityResolution {
    owner: any;
    fid: string;
}
interface KrnlProtocolAdapter {
    /** Unique name: 'https' | 'wss' | 'udp' | custom */
    readonly name: string;
    /**
     * Start serving on behalf of the entity.
     * Entity reference provided — adapter resolves capabilities through the entity.
     */
    start(entity: any, options?: any): Promise<void>;
    /**
     * Called whenever the entity's exposed capability surface changes
     * (e.g. child added, new functionality bubbled, visibility change).
     * MUST be idempotent.
     */
    onCapabilitySurfaceChanged(entity: any): void;
    /**
     * Gracefully stops the server. Called when entity is adopted by a parent.
     */
    stop(): Promise<void>;
    /**
     * Disposes of any resources held by the adapter.
     */
    dispose?(): void;
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
declare class krnlSystemCommComponent implements KrnlProtocolAdapter {
    readonly name: string;
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
    start(entity?: any, options?: any): Promise<void>;
    onCapabilitySurfaceChanged(entity: any): void;
    stop(): Promise<void>;
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

declare class krnlUnifiedHttpAdapter implements KrnlProtocolAdapter {
    readonly name: string;
    system: any;
    port: number;
    host: string;
    server: http.Server | null;
    _isExternalServer: boolean;
    mcp: KrnlMcpProtocol;
    acp: KrnlAcpProtocol;
    enableFriendlyRouting: boolean;
    wss: WebSocketServer | null;
    _latestUiSnapshot: Record<string, any>;
    _uiWsClients: Set<WebSocket>;
    _uiSseClients: Set<http.ServerResponse>;
    _uiReadyComponents: Set<string>;
    /**
     * @param system
     * @param port
     * @param host
     */
    constructor(system: any, port: number, host?: string);
    /**
     * Starts the adapter.
     */
    start(externalServerOrEntity?: any, options?: any): Promise<void>;
    _handleAgentWsClient(ws: WebSocket): void;
    _broadcastUiSse(data: any): void;
    sendWsTrigger(fid: string, input?: any, ticketId?: string): void;
    _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
    _handleSse(req: http.IncomingMessage, res: http.ServerResponse, fid: string): void;
    _sendJson(res: http.ServerResponse, status: number, data: any): void;
    _readJsonBody(req: http.IncomingMessage): Promise<any>;
    onCapabilitySurfaceChanged(entity: any): void;
    stop(): Promise<void>;
    dispose(): void;
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
            framework: string;
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

declare class KrnlBootBarrier {
    private _phase1Complete;
    private _resolve;
    readonly promise: Promise<void>;
    /**
     * Signals that Phase 1 (developer boot / addLocal registration) has completed.
     */
    signalPhase1Complete(): void;
    /**
     * Awaited by the magnetic loader before scanning and generating components.
     */
    waitForPhase1(): Promise<void>;
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
 * @file K_LIB_Krnl_Job_Scheduler.ts
 * @description Centralized Job Scheduler and Named Ticket Registry for KrnlTS applications.
 */
interface KrnlJobTicket {
    id: string;
    fid: string;
    type: 'boot' | 'endpoint' | 'ui_trigger';
    status: 'pending' | 'running' | 'done' | 'error';
    startedAt: number;
    completedAt?: number;
    result?: any;
    error?: string;
    promise: Promise<KrnlJobTicket>;
    resolve: (ticket: KrnlJobTicket) => void;
    reject: (err: any) => void;
}
declare class KrnlJobScheduler {
    private tickets;
    private ttlMs;
    constructor();
    /**
     * Create a new execution ticket
     */
    createTicket(fid: string, type: 'boot' | 'endpoint' | 'ui_trigger'): KrnlJobTicket;
    getTicket(id: string): KrnlJobTicket | null;
    markRunning(id: string): void;
    markDone(id: string, result?: any): void;
    markError(id: string, error: string): void;
    resolveTicket(id: string, status: 'done' | 'failed' | 'error', result?: any, error?: string): void;
    waitForTicket(id: string, timeoutMs?: number): Promise<KrnlJobTicket>;
    private cleanupExpiredTickets;
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
    _jobScheduler: KrnlJobScheduler;
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
    _bootBarrier: KrnlBootBarrier;
    _krnlFlags: Set<string>;
    /** Sets a named readiness flag on the entity. */
    setFlag(flag: string): void;
    /** Checks if a named readiness flag is set on the entity. */
    hasFlag(flag: string): boolean;
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
     * Scans and dynamically loads entities, functionalities, and subapps for the given entity or system.
     */
    static loadAll(entity: any, baseDir: string): Promise<void>;
    static loadFunctionality(entity: krnlSystemEntityBase, funcDir: string, funcName: string): Promise<void>;
    static loadEntity(parent: any, entDir: string, entName: string): Promise<void>;
    static ensureSubAppBuilt(appPath: string, appName: string, entity: any, parentBaseDir?: string): Promise<boolean>;
    static detectSubApp(appPath: string, appName: string): Promise<any | null>;
    /**
     * Automatically reconciles parent application package.json when sub-apps are added or removed.
     * - Packages needed by new sub-apps are added to parent package.json.
     * - Packages no longer needed by any sub-app are removed from parent package.json.
     */
    static syncParentSubAppDependencies(baseDir: string, subappsDir: string): Promise<void>;
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
     * Validates that all UI components reference real registered endpoints on the entity.
     */
    static validateExecutionContract(entity: any, uiEndpoints: {
        id: string;
        uiSpec: KrnlUiSpec;
    }[]): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Generates TS source code for a single endpoint UI component using VanJS
     */
    static generateComponentSource(fid: string, uiSpec: KrnlUiSpec, schema: any): string;
    private static renderVanInputAtom;
    private static renderVanOutputAtom;
    /**
     * Generates root index.ts aggregator using VanJS
     */
    static generateIndexSource(appName: string, uiEndpoints: {
        id: string;
    }[], subAppPrefixes: string[]): string;
    static generateAtoms(frontendDir: string): void;
}

declare class KrnlFrontendBuilder {
    private static activeContexts;
    /**
     * Bundles frontend/src/index.ts -> frontend/dist/bundle.js
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
 * @file K_LIB_Krnl_Flow.ts
 * @description In-Entity Flow Orchestration.
 *
 * A Flow IS a Functionality at the interface level:
 * - It has the same signature: input → execution → output + events + UI + state
 * - It is registered on an Entity via `entity.addLocal(...)`
 * - It bubbles, is exposed via protocol adapters, and participates in telemetry
 * - It composes existing functionalities within an entity boundary
 */

interface KrnlFlowStep {
    type: 'seq' | 'branch' | 'parallel';
    fid?: string;
    fids?: string[];
    pred?: (out: any) => boolean;
    trueFid?: string;
    falseFid?: string;
}
declare class KrnlFlowBuilder {
    private entity;
    private id;
    private steps;
    constructor(entity: krnlEntityBase, id: string);
    /** Sequential: output of previous step is passed as input to fid */
    then(fid: string): this;
    /** Branch: predicate on current output routes to trueFid or falseFid */
    branch(pred: (out: any) => boolean, trueFid: string, falseFid?: string): this;
    /** Parallel: run all fids concurrently with current input, collect results as array */
    parallel(...fids: string[]): this;
    /**
     * Register this flow as a krnlLocalFunctionality on the host entity.
     * The Flow becomes a first-class capability on the entity.
     */
    register(opts?: {
        visibility?: 'public' | 'private' | string;
        description?: string;
        uiSpec?: KrnlUiSpec;
        intelligenceSpec?: any;
        manifest?: KrnlFunctionalityManifest;
    }): krnlLocalFunctionality;
    /** Execute the flow directly without registering as a functionality */
    run(input: any): Promise<any>;
    /**
     * Internal step executor walking the entity's functionalities via `entity.call(fid, input)`.
     */
    private static _execute;
}

/**
 * @file K_LIB_Krnl_SubApp_Types.ts
 * @description Core types and contracts for Krnl Sub-App integration.
 *
 * Governing Principles:
 * - Sub-App owns: UI, business logic, internal backend, endpoint/operation implementations, app dependencies.
 * - Krnl owns: discovery, registration, lifecycle, ecosystem integration, transport exposure, shared services, and flow orchestration.
 * - Zero-Server Rule: Sub-apps NEVER start their own HTTP/WebSocket servers or bind listening ports.
 * - Functionality Wrapping: Sub-app operations wrap as first-class functionalities on the host Entity.
 */

/**
 * Sub-App Manifest declaring dependencies, required services, registration entry, and runtime metadata.
 */
interface SubAppManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    registrationEntry?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    buildRequirements?: string[];
    requiredServices?: string[];
    runtimeMetadata?: Record<string, unknown>;
    ui?: SubAppUIConfig | string;
}
/**
 * Sub-app filesystem descriptor.
 */
interface SubAppDescriptor {
    id: string;
    path: string;
    manifestPath?: string;
    registrationPath: string;
    manifest?: SubAppManifest;
}
/**
 * Execution context supplied to an operation handler when invoked.
 */
interface SubAppExecutionContext {
    caller?: string;
    callerPort?: number;
    accessKey?: string;
    entity?: any;
    services?: ServiceContainer;
    metadata?: Record<string, unknown>;
}
/**
 * Operation handler function signature.
 */
type OperationHandler<TInput = any, TOutput = any> = (input: TInput, context: SubAppExecutionContext) => Promise<TOutput> | TOutput;
/**
 * Declarative Operation definition exposing transport-independent capability.
 */
interface OperationDefinition {
    name: string;
    description?: string;
    input?: any;
    output?: any;
    handler: OperationHandler;
    metadata?: Record<string, unknown>;
    method?: string;
    visibility?: 'public' | 'protected' | 'private';
}
/**
 * UI configuration descriptor for sub-apps.
 */
interface SubAppUIConfig {
    entryPath?: string;
    title?: string;
    icon?: string;
    routePrefix?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Shared services container injected into sub-apps.
 */
interface ServiceContainer {
    get<T = any>(serviceName: string): T | undefined;
    has(serviceName: string): boolean;
    register<T = any>(serviceName: string, serviceInstance: T): void;
    list(): string[];
}
/**
 * Operation registrar interface injected into sub-apps during registration.
 */
interface OperationRegistrar {
    register(op: OperationDefinition): void;
    registerBatch(ops: OperationDefinition[]): void;
    get(opName: string): OperationDefinition | undefined;
    list(): OperationDefinition[];
}
/**
 * Event registrar interface injected into sub-apps during registration.
 */
interface EventRegistrar {
    emit(eventName: string, data: any): void;
    on(eventName: string, listener: (data: any) => void): () => void;
}
/**
 * Dependency-injected registration context passed to SubApp.register(context).
 */
interface SubAppRegistrationContext {
    entity: any;
    services: ServiceContainer;
    operations: OperationRegistrar;
    events: EventRegistrar;
    config: Record<string, unknown>;
    logger: Logger;
}
/**
 * Return contract from SubApp.register(context).
 */
interface SubAppRegistration {
    name?: string;
    operations: OperationDefinition[];
    ui?: SubAppUIConfig | string;
    metadata?: Record<string, unknown>;
    onInitialize?: (context: SubAppRegistrationContext) => Promise<void> | void;
    onDispose?: () => Promise<void> | void;
}
/**
 * Sub-App module contract.
 */
interface SubAppModule {
    manifest?: SubAppManifest;
    register: (context: SubAppRegistrationContext) => SubAppRegistration | Promise<SubAppRegistration>;
    default?: ((context: SubAppRegistrationContext) => SubAppRegistration | Promise<SubAppRegistration>) | {
        manifest?: SubAppManifest;
        register?: (context: SubAppRegistrationContext) => SubAppRegistration | Promise<SubAppRegistration>;
    };
}
/**
 * Lifecycle states of a sub-app instance.
 */
type SubAppLifecycleState = 'DISCOVERED' | 'VALIDATING' | 'VALIDATED' | 'LOADING' | 'REGISTERED' | 'INITIALIZING' | 'READY' | 'UNREGISTERING' | 'DISPOSED' | 'ERROR';
/**
 * Structured error details for sub-app validation and execution failures.
 */
interface SubAppErrorDetail {
    code: string;
    message: string;
    field?: string;
    subAppId?: string;
    operationName?: string;
}
/**
 * Runtime sub-app instance managed by an Entity.
 */
interface SubAppInstance {
    id: string;
    state: SubAppLifecycleState;
    manifest: SubAppManifest;
    descriptor: SubAppDescriptor;
    registration?: SubAppRegistration;
    operations: Map<string, OperationDefinition>;
    error?: Error | null;
    errorDetails?: SubAppErrorDetail[];
    loadedAt?: number;
    readyAt?: number;
    dispose?: () => Promise<void>;
}

/**
 * @file K_ENT_Entity.ts
 * @description The unified Entity class representing the core composition & orchestration primitive.
 *
 * Governing Principles:
 * 1. The entity tree IS the kernel. UI aggregation, capability exposure, manifests, protocols, and flows are projections or behaviors of that tree.
 * 2. Filesystem is composition: functionalities/, entities/, protocol_adapters/.
 * 3. Functionality is the atomic unit owning logic, state, helpers, events, UI spec, AI spec, and manifest.
 * 4. Entity is composition + orchestration.
 * 5. Root is a runtime position, not a class distinction:
 *    - No parent + attached protocol adapters → ROOT position (adapters active, self-hosts).
 *    - Has parent → CHILD position (adapters dormant, capabilities bubble up).
 */

declare class Entity<TState extends Record<string, any> = any, TEvents extends Record<string, any> = any> extends krnlEntityBase {
    /** Strongly-typed reactive entity state */
    protected state: TState;
    /** True while this entity occupies root position and actively self-hosts protocol adapters */
    _selfHosting: boolean;
    /** Protocol adapters attached to this entity. Operational only in root position. */
    _protocolAdapters: Map<string, KrnlProtocolAdapter>;
    /** Sub-Apps registered directly under this entity */
    _subApps: Map<string, SubAppInstance>;
    /** Reservation state for access control and mutual exclusion */
    reservation: {
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    /** Discoverability state for network beacons / registries */
    discoverable: boolean;
    constructor(name: string, owner?: krnlEntityBase | null, options?: any);
    /**
     * Get an immutable, read-only snapshot of current entity state.
     */
    getState(): Readonly<TState>;
    /**
     * Mutates the entity state via deep-merge and emits a reactive state:changed event.
     */
    setState(mutation: Partial<TState>): void;
    /**
     * Resets entity state to a new or initial baseline.
     */
    resetState(newState?: TState): void;
    /** Private cache mapping event names to krnlEmitters */
    private _eventEmitterMap;
    /**
     * Subscribes a listener to a domain event on this entity.
     */
    on(event: string, handler: (payload: any) => void): () => void;
    /**
     * Emits an event with a data payload to all subscribers.
     */
    emit(event: string, payload: any): void;
    /**
     * Dispatches a strongly-typed domain event.
     */
    emitEvent<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
    /**
     * System flags representing discoverability and reservation status.
     */
    getSystemFlags(): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    /**
     * Set discoverability status.
     */
    setDiscoverable(value: boolean): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    /**
     * Reserve this entity for exclusive access by serviceName.
     */
    reserveFor(serviceName?: string): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    /**
     * Release reservation held by serviceName.
     */
    releaseReservation(serviceName?: string | null): {
        discoverable: boolean;
        busy: boolean;
        reservedBy: string | null;
        reservedAt: number | null;
    };
    /**
     * Guard checking if entity is available for remote caller.
     */
    _assertAvailableForRemoteAccess(requester?: string | null): void;
    /**
     * Get dynamic manifest of all capabilities, flags, and endpoints.
     */
    getManifest(): any;
    /**
     * Generates a structured 404 response payload for unmatched routes.
     */
    getNotFoundResponse(reqPath: string): {
        status: string;
        message: string;
        entity: string;
        availableRoutes: string[];
    };
    /**
     * Attach a protocol adapter to this entity (declarative step during discovery/construction).
     * Does NOT start the server. Servers are started only during `finalize()` if this entity is root.
     */
    attachAdapter(adapter: KrnlProtocolAdapter): void;
    /**
     * Return all attached protocol adapters.
     */
    getAdapters(): KrnlProtocolAdapter[];
    /**
     * Get a specific protocol adapter by name (e.g. 'https', 'wss').
     */
    getAdapter<T = KrnlProtocolAdapter>(name: string): T | undefined;
    /**
     * Access the WebSocket commComponent adapter if attached.
     */
    get commComponent(): any | undefined;
    /**
     * Access the Unified HTTP adapter if attached.
     */
    get unifiedHttpAdapter(): any | undefined;
    /**
     * Port of active listening adapter.
     */
    get commPort(): number;
    /**
     * Finalizes construction and activates the entity if it occupies root position.
     * Called after tree construction and Shell materialization.
     */
    finalize(options?: any): Promise<void>;
    /**
     * Starts all attached protocol adapters.
     */
    _startHosting(options?: any): Promise<void>;
    /**
     * Stops all self-hosted protocol adapters gracefully.
     */
    stopHosting(): Promise<void>;
    /**
     * Lifecycle hook: called when this entity is adopted as a child component by a parent entity.
     * Action: Relinquish root position duties by stopping any self-hosted servers.
     * Note: Capability bubbling is handled automatically by the hierarchy manager.
     */
    _onAdoptedByParent(): Promise<void>;
    /**
     * Lifecycle hook: called when this entity is detached or promoted to root position.
     * Action: If no parent and adapters exist, activate self-hosting.
     */
    _onPromotedToRoot(options?: any): Promise<void>;
    /**
     * Overrides component functionality addition to notify active protocol adapters.
     */
    _onComponentFunctionalityAdded(component: any, functionality: any): void;
    /**
     * Notifies all attached protocol adapters that the exposed capability surface has changed.
     * Idempotent: adapters diff and reconcile their route mappings.
     */
    _notifyAdaptersOfSurfaceChange(): void;
    /**
     * Computes the hierarchical qualified ID for a local functionality ID.
     * e.g. "Root.OrderService.settings"
     */
    getQualifiedId(fid: string): string;
    /**
     * Resolves an external qualified capability ID to the owning Entity instance and local fid.
     * The caller/adapter invokes:
     *   const res = root.resolveCapability("Root.OrderService.settings");
     *   return await res.owner.call(res.fid, input);
     */
    resolveCapability(qualifiedId: string): KrnlCapabilityResolution | undefined;
    private _resolveCapabilityRecursive;
    /**
     * Discovers sub-apps in the specified directory (or default 'subapps/').
     */
    discoverSubApps(searchPath?: string): Promise<SubAppDescriptor[]>;
    /**
     * Loads, validates, registers, and initializes a sub-app onto this entity.
     */
    loadSubApp(descriptorOrPath: string | SubAppDescriptor, config?: Record<string, unknown>): Promise<SubAppInstance>;
    /**
     * Programmatically registers a sub-app registration object.
     */
    registerSubApp(registration: SubAppRegistration, descriptor?: SubAppDescriptor): Promise<SubAppInstance>;
    /**
     * Internal helper: wraps sub-app operations into first-class Entity functionalities.
     */
    private _registerSubAppInstance;
    /**
     * Wraps a single operation definition into a krnlLocalFunctionality and binds to this Entity.
     */
    private _wrapAndAddSubAppOperation;
    /**
     * Registers additional operations under an existing sub-app.
     */
    registerSubAppOperations(subAppId: string, operations: OperationDefinition[]): void;
    /**
     * Unregisters and disposes a sub-app from this entity.
     */
    unregisterSubApp(subAppId: string): Promise<void>;
    /**
     * Retrieve a registered sub-app instance by ID.
     */
    getSubApp(subAppId: string): SubAppInstance | undefined;
    /**
     * Returns all sub-app instances registered under this entity.
     */
    getSubApps(): SubAppInstance[];
    /**
     * Aggregates dependency manifests from all local functionalities, sub-apps, and descendant entities.
     * Returns a consolidated workspace requirements document.
     */
    getWorkspaceRequirements(): KrnlWorkspaceRequirements;
    private _aggregateManifestInto;
    private static _mergeManifestRequirements;
    /**
     * Aggregates UI specifications from all functionalities and sub-apps across the entity tree.
     * Qualified IDs ensure namespace stability and avoid collisions.
     */
    aggregateUI(): Array<{
        qualifiedId: string;
        uiSpec: any;
        source: Entity;
    }>;
    /**
     * Create a FlowBuilder instance bound to this entity.
     */
    flow(id: string): KrnlFlowBuilder;
    /**
     * Clean disposal of all entity resources, sub-apps, child components, and adapters.
     */
    dispose(): void;
}

/**
 * @file K_LIB_Krnl_SubApp_Engine.ts
 * @description Sub-App Discovery, Validation, Lifecycle Execution, and HTTPS Adapter Engine for Krnl.
 */

/**
 * Default in-memory service container for dependency injection.
 */
declare class DefaultServiceContainer implements ServiceContainer {
    private services;
    constructor(initialServices?: Record<string, any>);
    get<T = any>(serviceName: string): T | undefined;
    has(serviceName: string): boolean;
    register<T = any>(serviceName: string, serviceInstance: T): void;
    list(): string[];
}
/**
 * Default Operation registrar collector used during sub-app registration.
 */
declare class DefaultOperationRegistrar implements OperationRegistrar {
    private ops;
    register(op: OperationDefinition): void;
    registerBatch(ops: OperationDefinition[]): void;
    get(opName: string): OperationDefinition | undefined;
    list(): OperationDefinition[];
}
/**
 * Default Event registrar for sub-apps.
 */
declare class DefaultEventRegistrar implements EventRegistrar {
    private hostEntity;
    constructor(hostEntity: any);
    emit(eventName: string, data: any): void;
    on(eventName: string, listener: (data: any) => void): () => void;
}
/**
 * Sub-App Discovery Engine
 */
declare class KrnlSubAppDiscovery {
    /**
     * Deterministically scans searchDir for sub-apps and builds typed SubAppDescriptor instances.
     */
    static discoverSubApps(searchDir: string): Promise<SubAppDescriptor[]>;
    /**
     * Inspects a specific directory to see if it represents a valid sub-app.
     */
    static locateDescriptor(subAppDir: string, fallbackId?: string): Promise<SubAppDescriptor | null>;
}
/**
 * Sub-App Validator Engine
 */
declare class KrnlSubAppValidator {
    /**
     * Validates a sub-app manifest.
     */
    static validateManifest(manifest: any): {
        valid: boolean;
        errors: SubAppErrorDetail[];
    };
    /**
     * Validates operation definitions and checks for collisions.
     */
    static validateRegistration(registration: SubAppRegistration, existingOperations: Set<string>, subAppId: string): {
        valid: boolean;
        errors: SubAppErrorDetail[];
    };
}
/**
 * Sub-App Lifecycle Engine
 */
declare class KrnlSubAppLifecycle {
    /**
     * Loads, validates, registers, and initializes a sub-app onto an Entity.
     */
    static loadAndRegister(entity: any, descriptor: SubAppDescriptor, config?: Record<string, unknown>): Promise<SubAppInstance>;
    /**
     * Gracefully unregisters and disposes of a sub-app instance.
     */
    static dispose(instance: SubAppInstance): Promise<void>;
}
/**
 * HTTPS Compatibility Adapter: Helper for mapping existing full-stack React app endpoints into OperationDefinitions.
 */
declare function createHttpsAppAdapter(options: {
    name: string;
    endpoints: Array<{
        path: string;
        method?: string;
        description?: string;
        inputSchema?: any;
        outputSchema?: any;
        handler: (reqBodyOrParams: any, context?: any) => Promise<any> | any;
    }>;
}): SubAppRegistration;

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

/**
 * @file K_LIB_Krnl_Source_Analyzer.ts
 * @role skeleton
 * @description Master source analyzer enforcing boot order, UI specs, line limits, and 4-layer purity.
 */
interface ValidationReport {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
declare class KrnlSourceAnalyzer {
    static getAddLocalCalls(source: string): Array<{
        line: number;
        hasUiSpec: boolean;
        id: string;
    }>;
    static getMagneticLoaderLine(source: string): number;
    static validateEntitySource(filePath: string): ValidationReport;
    static validateProject(projectRoot: string): ValidationReport;
    private static scanSourceFiles;
}

/**
 * @file K_LIB_Krnl_Purity_Rules.ts
 * @role component
 * @description Static AST and rule validators for 4-layer function purity, delegation limits, and context traps.
 */
interface PurityValidationResult {
    errors: string[];
    warnings: string[];
}
declare class KrnlPurityRules {
    /**
     * Asserts file line limit is <= 200 lines.
     */
    static checkFileLineLimit(filePath: string, source: string): string | null;
    /**
     * Asserts all local relative imports end in .js suffix.
     */
    static checkImportSuffixes(filePath: string, source: string): string[];
    /**
     * Checks for the silent context destructuring trap ({ state, system } instead of { state, entity }).
     */
    static checkContextDestructuring(filePath: string, source: string): string | null;
    /**
     * Asserts that helper functions do not import state or perform I/O, and obey the 30-line threshold.
     */
    static checkHelperPurity(filePath: string, source: string): string[];
    /**
     * Checks main_function logic for excessive consecutive code without delegation (max 20 lines).
     */
    static checkMainDelegation(filePath: string, source: string): string[];
}

/**
 * @file DataConcepts.ts
 * @role component
 * @description Polymorphic generic templates for collections, object diffs, deep merge, and lenses.
 */
/**
 * Indexes an array of objects into a Map using a specified key property.
 */
declare function indexBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T>;
/**
 * Groups an array of objects by a key or discriminator function.
 */
declare function groupBy<T, K extends PropertyKey>(items: T[], keyFn: K | ((item: T) => K)): Record<K, T[]>;
/**
 * Computes a shallow or 1-level delta between original and modified objects.
 */
declare function computeDelta<T extends object>(original: T, modified: T): Partial<T>;
/**
 * Deeply merges source into target using ObjectKit.
 */
declare function deepMerge<T extends object>(target: T, source: Partial<T>): T;
/**
 * Creates a functional lens for focused property access and immutable updates.
 */
declare function lens<T, R>(getter: (obj: T) => R, setter: (obj: T, val: R) => T): {
    get: (obj: T) => R;
    set: (obj: T, val: R) => T;
};
/**
 * Partitions an array into two arrays [matches, nonMatches] based on a predicate.
 */
declare function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]];
/**
 * Deduplicates an array by value or key selector.
 */
declare function deduplicate<T, K extends keyof T>(items: T[], key?: K): T[];
/**
 * Paginates an array with page number and page size.
 */
declare function paginate<T>(items: T[], page?: number, pageSize?: number): {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

/**
 * @file ValidationConcepts.ts
 * @role component
 * @description Polymorphic generic templates for Zod schema validation and assertion contracts.
 */

interface ValidationSuccess<T> {
    success: true;
    data: T;
}
interface ValidationFailure {
    success: false;
    errors: string[];
    fieldErrors?: Record<string, string[]>;
}
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
/**
 * Formats a ZodError into a human-readable list of string error messages.
 */
declare function formatZodErrors(error: z.ZodError): string[];
/**
 * Validates data against any Zod schema and returns a structured ValidationResult.
 */
declare function validateSchema<TSchema extends z.ZodTypeAny>(schema: TSchema, data: unknown): ValidationResult<z.infer<TSchema>>;
/**
 * Asserts that data satisfies a given Zod schema, throwing an Error if invalid.
 */
declare function assertSchema<TSchema extends z.ZodTypeAny>(schema: TSchema, data: unknown, customErrorMessage?: string): asserts data is z.infer<TSchema>;

/**
 * @file MathConcepts.ts
 * @role component
 * @description Polymorphic generic templates for vector math, statistics, range mapping, and clamping.
 */
/**
 * Clamps a numeric value between min and max bounds.
 */
declare function clamp(val: number, min: number, max: number): number;
/**
 * Linear interpolation between start and end by factor t (0 <= t <= 1).
 */
declare function lerp(start: number, end: number, t: number): number;
/**
 * Maps a number from an input range [inMin, inMax] to an output range [outMin, outMax].
 */
declare function mapRange(val: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
/**
 * Rounds a number to a specified number of decimal places.
 */
declare function roundTo(val: number, decimals?: number): number;
/**
 * Applies an element-wise arithmetic operation between two numeric vectors.
 */
declare function vectorOp<T extends number[]>(a: T, b: T, op: (x: number, y: number) => number): T;
/**
 * Calculates summary statistics for an array of numbers.
 */
declare function stats(values: number[]): {
    count: number;
    min: number;
    max: number;
    sum: number;
    mean: number;
    median: number;
    stdDev: number;
};

/**
 * @file StringConcepts.ts
 * @role component
 * @description Polymorphic generic templates for string interpolation, slugification, casing, and sanitization.
 */
/**
 * Interpolates a template string containing {{variable}} placeholders with values from an object.
 */
declare function interpolate(template: string, vars: Record<string, any>): string;
/**
 * Converts a string into a URL-friendly slug.
 */
declare function toSlug(input: string): string;
/**
 * Transforms string casing between camelCase, PascalCase, kebab-case, and snake_case.
 */
declare function toCase(input: string, targetCase: "camel" | "pascal" | "kebab" | "snake"): string;
/**
 * Truncates a string to a max length, appending an ellipsis suffix if truncated.
 */
declare function truncate(input: string, maxLength: number, suffix?: string): string;
/**
 * Strips HTML tags and unsafe script characters from text.
 */
declare function sanitize(input: string): string;

/**
 * @file GraphConcepts.ts
 * @role component
 * @description Polymorphic generic templates for graph topology, BFS/DFS traversal, and topological sorting.
 */
interface IGraph<TNode, TEdge = any> {
    nodes: Map<string, TNode>;
    edges: Map<string, Array<{
        target: string;
        data?: TEdge;
    }>>;
}
/**
 * Traverses a graph using Breadth-First Search (BFS) or Depth-First Search (DFS).
 */
declare function traverseGraph<TNode, TEdge>(graph: IGraph<TNode, TEdge>, startId: string, mode: "bfs" | "dfs" | undefined, visitor: (nodeId: string, node: TNode, depth: number) => boolean | void): void;
/**
 * Performs topological sort on a directed acyclic graph (DAG) with cycle detection.
 */
declare function topologicalSort<TNode, TEdge>(graph: IGraph<TNode, TEdge>): {
    sorted: string[];
    hasCycle: boolean;
};

/**
 * @file StateConcepts.ts
 * @role component
 * @description Polymorphic generic templates for Finite State Machine transitions and action reducers.
 */
interface FsmTransitionResult<TState> {
    allowed: boolean;
    nextState?: TState;
    reason?: string;
}
/**
 * Validates and executes a state transition in a Finite State Machine.
 */
declare function transitionFSM<TState extends string, TEvent extends string>(matrix: Record<TState, Partial<Record<TEvent, TState>>>, currentState: TState, event: TEvent): FsmTransitionResult<TState>;
/**
 * Creates a type-safe action reducer mapping action types to handler functions.
 */
declare function createReducer<TState, TAction extends {
    type: string;
}>(handlers: {
    [K in TAction["type"]]?: (state: TState, action: Extract<TAction, {
        type: K;
    }>) => TState;
}, fallback?: (state: TState, action: TAction) => TState): (state: TState, action: TAction) => TState;

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

export { type AdapterConstructor, AdminGuard, type AppPreferences, type AppUserContext, type ApplicationRuntimeState, AsyncKit, type AuditLogEntry, AuditLogger, type AuthConfig, type AuthCredentials, type AuthSession, type BackendConnectionConfig, type BackendServiceType, BaseWorkspaceStorageAdapter, CUSTOM_ERROR_CODE, CacheKit, type ClusterDatabaseRole, type ConflictStrategy, ControlPlaneManager, type CustomStorageConfiguration, type DatabaseClusterEntry, DatabaseClusterManager, type DatabaseClusterVault, type DatabaseProviderConfig, type DefaultConnectionBehaviour, DefaultEventRegistrar, DefaultOperationRegistrar, DefaultServiceContainer, type EndpointCategory, Entity, type EntityBackendSettings, type EventRegistrar, FileCache, type FileChangeCallback, type FileEntry, FileLock, type FileMetadata, FilesystemStorageProvider, FirebaseDataProvider, FirebaseStorageAdapter, type FirebaseStorageConfiguration, FirebaseStorageProvider, type FsmTransitionResult, type FunctionalityBackendConfig, type FunctionalityBackendFlag, FunctionalityTable, GitManager, type GlobalUserIdentity, type GoogleDriveConfiguration, GoogleDriveStorageAdapter, HostedAccountProvider, type IAccountProvider, type IFunctionalityTable, type IGraph, type IStorageProvider, type ISyncEngine, type IWorkspaceBackend, type IWorkspaceDataProvider, type IWorkspaceFS, type IWorkspaceRuntime, type IngressMemberEntry, type InteractionRecord, KrnlAcpProtocol, type KrnlAiExecutionTrace, KrnlAikoClient, KrnlApplicationOrchestrator, KrnlBootBarrier, KrnlBuildValidator, type KrnlCapabilityResolution, type KrnlEndpointAccessPolicy, KrnlEndpointAgent, type KrnlEndpointDefinition, KrnlEndpointScheduler, KrnlEnv, type KrnlEventIntention, KrnlFS, KrnlFlowBuilder, type KrnlFlowStep, KrnlFrontend, KrnlFrontendBuilder, KrnlFrontendGenerator, KrnlFrontendInspector, type KrnlFrontendOptions, type KrnlFunctionality, type KrnlFunctionalityManifest, KrnlHTTP, type KrnlHTTPOptions, KrnlIngressNetwork, type KrnlIngressNetworkMemberConfig, type KrnlIntelligenceSpec, type KrnlIntentionEntity, type KrnlIntentionFunctionality, type KrnlIntentionLibrary, type KrnlIntentionLibraryCategory, KrnlJobScheduler, type KrnlJobTicket, KrnlMagneticLoader, type KrnlManagedServiceConfig, type KrnlManagedServiceHandle, type KrnlManifest, type KrnlManifestDependencies, type KrnlManifestExports, KrnlMcpProtocol, KrnlNonKrnlAppAdapter, type KrnlOrchestratorMemory, type KrnlPeer, KrnlPlannerAgent, KrnlPolicy, type KrnlProtocolAdapter, KrnlPurityRules, type KrnlRegistryApp, KrnlRegistryClient, type KrnlRequiredRemote, type KrnlRequiresSpec, type KrnlResult, KrnlRuntimeStore, KrnlShell, KrnlSiblingNetwork, KrnlSourceAnalyzer, type KrnlSubAppConfig, type KrnlSubAppDependency, KrnlSubAppDiscovery, type KrnlSubAppEntry, type KrnlSubAppExecutionMode, KrnlSubAppLifecycle, KrnlSubAppLoader, KrnlSubAppValidator, KrnlSubAppWorkerHost, KrnlTaskList, KrnlTaskRunner, type KrnlTraceContext, type KrnlUiFieldSpec, type KrnlUiSpec, type KrnlWatchVariable, KrnlWatchVariablesTracker, type KrnlWorkspaceRequirements, LRUCache, LocalSQLiteAccountProvider, LocalStorageAdapter, type LocalStorageConfiguration, type LogEntry, Logger, MemoryTransportAdapter, MongoAtlasDataProvider, ObjectKit, type OneDriveConfiguration, OneDriveStorageAdapter, type OperationDefinition, type OperationHandler, type OperationRegistrar, PocerBlock, PocketBaseDataProvider, PocketBaseStorageProvider, PostgresDataProvider, type ProviderConfiguration, type PurityValidationResult, type ReleaseFn, type RestoreResult, type RetryConfiguration, type S3StorageConfiguration, S3StorageProvider, SQLiteDataProvider, type SecretReference, type ServiceContainer, type SiblingMemberEntry, type SpawnHandle, StorageAdapterFactory, type StorageEndpoint, type StorageEndpointStatus, type StorageEndpointSyncState, type StorageMode, type StorageProviderConfig, type StorageProviderType, StringKit, type SubAppDescriptor, type SubAppErrorDetail, type SubAppExecutionContext, type SubAppInstance, type SubAppLifecycleState, type SubAppManifest, type SubAppModule, type SubAppRegistration, type SubAppRegistrationContext, type SubAppUIConfig, SupabaseDataProvider, SupabaseStorageAdapter, type SupabaseStorageConfiguration, SupabaseStorageProvider, type SyncConfiguration, SyncEngine, type SyncMode, type SyncResult, TTLCache, type TelemetrySnapshot, TursoLibSQLDataProvider, type Unsubscribe, type User, type UserProfile, type UserRole, type ValidationFailure, type ValidationReport, type ValidationResult, type ValidationSuccess, VercelBlobStorageProvider, type VerificationConfiguration, type VerificationResult, WebSocketTransportAdapter, type Workspace, WorkspaceBackendFactory, type WorkspaceDescriptor, WorkspaceFS, type WorkspacePreferences, WorkspaceRuntime, type WorkspaceStorageAdapter, assertSchema, buildEntityIntention, calculateContentHash, clamp, computeDelta, createEnum, createHttpsAppAdapter, createReducer, deduplicate, deepMerge, defaultConnectionBehaviour, formatZodErrors, groupBy, indexBy, interpolate, krnlCollector, krnlData, krnlDataFactory, krnlEmitter, krnlEntityBase, krnlEntityCompositionalHierarchyManager, krnlError, krnlErrorCodes, krnlErrorMessages, krnlGlobalEmitterAddress, krnlInterface, krnlLocalEmitterAddress, krnlLocalFunctionality, krnlMessage, krnlNetworkOrchestratorEntityBase, krnlPrimitiveDataTypes, krnl as krnlProto, krnlRemoteFunctionality, krnlServiceSuitePorts, krnlServiceSuites, krnlSubSystemOrchestratorBase, krnlSystemCommComponent, krnlSystemEntityBase, krnlSystemTypes, krnlTransportAdapter, krnlUnifiedHttpAdapter, lens, lerp, magneticStorage, mapRange, normalizeWorkspacePath, paginate, partition, roundTo, sanitize, stats, subappLocalStorage, telemetry, toCase, toSlug, topologicalSort, transitionFSM, traverseGraph, truncate, validateSchema, vectorOp };
