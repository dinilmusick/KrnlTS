import { BrowserToolchainSource, BrowserRuntimeDriverPlugin, DependencyNetworkAuthorizer, Engine, Compiler, Project, WorkerProgress, CompilerTraceEvent, BuildResult, Runner, BuildArtifact, RunConfig, RunResult, InteractiveRunConfig, InteractiveRunResult, Language, TargetAbi, OptimizationLevel } from '../../core/dist/index.js';
export * from '../../core/dist/index.js';
import { BrowserRuntimeDriverPlugin as BrowserRuntimeDriverPlugin$1 } from '../../contracts/dist/index.js';
export { BrowserRuntimeDriverPlugin } from '../../contracts/dist/index.js';

interface BrowserEngineOptions {
    /** Explicit browser toolchain packages; no implicit asset location exists. */
    toolchains: readonly BrowserToolchainSource[];
    /** Content-addressed artifact persistence in IndexedDB. Defaults to true. */
    artifactCache?: boolean;
    /** Calibrated cost profiles for downstream compiler registrations. */
    additionalCostBaselines?: Readonly<Record<string, number>>;
    /** Trusted same-origin, content-pinned RuntimeDriver modules loaded inside the runner Worker. */
    runtimeDriverPlugins?: readonly BrowserRuntimeDriverPlugin[];
    /** Required authorizer for any online dependency resolution. No implicit network access exists. */
    dependencyNetworkAuthorizer?: DependencyNetworkAuthorizer;
}
/** Creates a browser-hosted engine from explicit, contract-v2 toolchain sources. */
declare function createBrowserEngine(options: BrowserEngineOptions): Promise<Engine>;

type ProgressListener$1 = (progress: WorkerProgress) => void;
type TraceListener = (requestId: string, event: CompilerTraceEvent) => void;
interface BrowserCompilerOptions {
    /** Explicit, contract-validated browser toolchain packages. */
    toolchains: readonly BrowserToolchainSource[];
}
declare class BrowserCompiler implements Compiler {
    private worker;
    private readonly pending;
    private readonly progressListeners;
    private readonly traceListeners;
    private readyPromise;
    private readonly toolchains;
    private activeOperation;
    private disposed;
    private generation;
    private workerDormant;
    private workerInitialized;
    private outputReadyClangStages;
    private outputReadyRustStages;
    private retainedGoStage;
    private readonly acquiredToolchains;
    private acquisition;
    constructor(options: BrowserCompilerOptions);
    cacheIdentity(project: Project): string;
    private initializeWorker;
    onProgress(listener: ProgressListener$1): () => void;
    onTrace(listener: TraceListener): () => void;
    ready(): Promise<void>;
    build(project: Project, cacheKey: string): Promise<BuildResult>;
    clearToolchainCache(): Promise<void>;
    cancel(): void;
    restart(): void;
    dispose(): void;
    private createWorker;
    private replaceWorker;
    private quiesceAndReplaceWorker;
    /**
     * Downloads the build's pinned toolchain assets into the HTTP or toolchain
     * cache before the build boundary starts, so a slow network cannot spend the
     * compiler request timeout, and a recycled Worker reuses completed downloads.
     */
    private acquireToolchain;
    private stopWorker;
    private installWorker;
    private assertActive;
    private request;
    private handleMessage;
}

type ProgressListener = (progress: WorkerProgress) => void;
type StreamListener = (stream: "stdout" | "stderr", chunk: string) => void;
interface BrowserRunnerOptions {
    /** Explicit, contract-validated browser toolchain packages. */
    toolchains: readonly BrowserToolchainSource[];
    /** Calibrated profiles for downstream languages; canonical WASM-OJ profiles cannot be replaced. */
    additionalCostBaselines?: Readonly<Record<string, number>>;
    /** Trusted same-origin, content-pinned RuntimeDriver modules loaded inside the runner Worker. */
    runtimeDriverPlugins?: readonly BrowserRuntimeDriverPlugin[];
}
declare class BrowserRunner implements Runner {
    private worker;
    private readonly pending;
    private readonly progressListeners;
    private readonly streamListeners;
    private readyPromise;
    private readonly toolchains;
    private readonly additionalCostBaselines;
    private readonly runtimeDriverPlugins;
    private readonly costBaselines;
    private disposed;
    private activeOperation;
    private readonly inFlightOperations;
    private generation;
    private workerInitialized;
    constructor(options: BrowserRunnerOptions);
    private initializeWorker;
    onProgress(listener: ProgressListener): () => void;
    onStream(listener: StreamListener): () => void;
    ready(): Promise<void>;
    run(artifact: BuildArtifact, config: RunConfig): Promise<RunResult>;
    interact(contestant: BuildArtifact, interactor: BuildArtifact, config: InteractiveRunConfig): Promise<InteractiveRunResult>;
    private interactOperation;
    private runOperation;
    clearRuntimeCache(): Promise<void>;
    private clearRuntimeCacheOperation;
    cancel(): void;
    cancelAndWait(): Promise<void>;
    restart(): void;
    dispose(): void;
    private createWorker;
    private rejectAll;
    private replaceWorker;
    private stopWorker;
    private installWorker;
    private assertActive;
    private track;
    private request;
    private handleMessage;
    private finishWallTimer;
    private startWallTimer;
}

declare const BROWSER_RUNTIME_PLUGIN_LIMITS: Readonly<{
    count: 16;
    sourceBytes: number;
}>;
declare function validateBrowserRuntimeDriverPlugins(plugins: readonly BrowserRuntimeDriverPlugin$1[], baseUrl: string): BrowserRuntimeDriverPlugin$1[];

interface BrowserToolchainPrefetchProgress {
    readonly loadedBytes: number;
    readonly totalBytes: number;
}
interface BrowserToolchainPrefetchOptions {
    readonly language: Language;
    readonly target?: TargetAbi;
    readonly optimization?: OptimizationLevel;
    /** C++ only: also fetch the admitted libc++ PCH used by projects that contain `wasm-oj.pch.hpp`. */
    readonly libcxxPrecompiledHeader?: boolean;
    readonly signal?: AbortSignal;
    readonly onProgress?: (progress: BrowserToolchainPrefetchProgress) => void;
}
/**
 * Downloads the pinned toolchain assets for one language through the same
 * digest-addressed URLs the compiler and runner Workers request, so a later
 * build reads them from the HTTP cache (or the registered toolchain cache)
 * instead of spending its build boundary on the network. Byte counts are
 * checked here; Workers still verify digests before use.
 */
declare function prefetchBrowserToolchain(sources: readonly BrowserToolchainSource[], options: BrowserToolchainPrefetchOptions): Promise<void>;

interface ToolchainCacheRegistrationOptions {
    /** Same-origin URL where the package's exported service-worker asset is served. */
    scriptUrl?: string | URL;
    /** Service-worker scope covering the configured WASM-OJ toolchain asset base URL. */
    scope?: string;
    /** Build-generated, same-origin chunk manifest used only by size-limited static deployments. */
    chunkManifestUrl?: string | URL;
}
declare function registerToolchainCache(options?: ToolchainCacheRegistrationOptions): Promise<ServiceWorkerRegistration | undefined>;

interface DependencyCache {
    load(integritySha256: string): Promise<Uint8Array | undefined>;
    save(integritySha256: string, payload: Uint8Array): Promise<void>;
    delete(integritySha256: string): Promise<void>;
    clear(): Promise<void>;
}

interface StorageEntry {
    key: string;
    byteLength: number;
    lastAccessedAt: number;
}
interface StorageParticipant {
    /** Stable identifier used in reports and policy overrides. */
    readonly id: string;
    /** Lower values are evicted first. */
    readonly retentionPriority: number;
    list(): Promise<readonly StorageEntry[]>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
interface StorageParticipantReport {
    id: string;
    byteLength: number;
    entryCount: number;
    retentionPriority: number;
}
interface StorageReport {
    usage: number;
    quota: number;
    logicalCacheBytes: number;
    logicalCacheBudget: number;
    minimumFreeBytes: number;
    participants: readonly StorageParticipantReport[];
}
interface StorageMaintenanceResult {
    before: StorageReport;
    after: StorageReport;
    evicted: readonly {
        participantId: string;
        key: string;
        byteLength: number;
    }[];
}

/** Persistent browser content-addressed dependency cache. */
declare class IndexedDbDependencyCache implements DependencyCache {
    private database;
    load(integritySha256: string): Promise<Uint8Array | undefined>;
    save(integritySha256: string, payload: Uint8Array): Promise<void>;
    delete(integritySha256: string): Promise<void>;
    clear(): Promise<void>;
    listStorageEntries(): Promise<StorageEntry[]>;
    storageParticipant(): StorageParticipant;
    close(): void;
    private open;
    private touch;
}

interface StorageCoordinatorOptions {
    storageManager?: StorageManager;
    lockManager?: LockManager;
    cacheStorage?: CacheStorage;
    participants?: readonly StorageParticipant[];
    maxCacheBytes?: number;
    minimumFreeBytes?: number;
    quotaFraction?: number;
}
/**
 * One browser-wide admission and LRU eviction policy for WASM-OJ's independent
 * IndexedDB and Cache Storage backends. Web Locks serialize policy decisions
 * across tabs; cache payload integrity remains the responsibility of each store.
 */
declare class StorageCoordinator {
    private readonly storageManager;
    private readonly lockManager;
    private readonly participants;
    private readonly maxCacheBytes;
    private readonly minimumFreeBytes;
    private readonly quotaFraction;
    constructor(options?: StorageCoordinatorOptions);
    estimate(): Promise<StorageReport>;
    /**
     * Evicts the least valuable, least recently used entries until both the
     * logical WASM-OJ budget and the browser quota headroom admit `incomingBytes`.
     */
    maintain(incomingBytes?: number): Promise<StorageMaintenanceResult>;
    /** Fails before a write when all coordinated caches cannot free enough room. */
    admit(incomingBytes: number): Promise<StorageMaintenanceResult>;
    clear(): Promise<void>;
    requestPersistence(): Promise<boolean>;
    private estimateUnlocked;
    private snapshotParticipants;
    private exclusive;
}
declare function createDefaultBrowserStorageCoordinator(options?: Omit<StorageCoordinatorOptions, "participants">): StorageCoordinator;
declare function cacheStorageParticipant(storage: CacheStorage, cacheName: string, id: string, retentionPriority: number): StorageParticipant;

export { BROWSER_RUNTIME_PLUGIN_LIMITS, BrowserCompiler, BrowserRunner, IndexedDbDependencyCache, StorageCoordinator, cacheStorageParticipant, createBrowserEngine, createDefaultBrowserStorageCoordinator, prefetchBrowserToolchain, registerToolchainCache, validateBrowserRuntimeDriverPlugins };
export type { BrowserCompilerOptions, BrowserEngineOptions, BrowserRunnerOptions, BrowserToolchainPrefetchOptions, BrowserToolchainPrefetchProgress, StorageCoordinatorOptions, StorageEntry, StorageMaintenanceResult, StorageParticipant, StorageParticipantReport, StorageReport, ToolchainCacheRegistrationOptions };
