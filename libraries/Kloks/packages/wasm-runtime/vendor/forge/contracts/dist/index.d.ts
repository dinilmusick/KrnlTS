/**
 * The single compatibility boundary shared by WASM-OJ compilers, runners,
 * artifacts, judge specifications, caches, and conformance evidence.
 *
 * Package and upstream toolchain versions remain independent release metadata;
 * they do not define WASM-OJ protocol compatibility.
 */
declare const WASM_OJ_CONTRACT_VERSION: 2;
declare const WASM_OJ_CONTRACT_ID: "wasm-oj-v2";
declare const WASM_OJ_SCHEMAS: Readonly<{
    readonly clangPins: "wasm-oj-v2/clang-pins";
    readonly clangLibcxxPch: "wasm-oj-v2/clang-libcxx-pch";
    readonly clangToolchain: "wasm-oj-v2/clang-toolchain";
    readonly compileBatch: "wasm-oj-v2/compile-batch";
    readonly compileTrace: "wasm-oj-v2/compile-trace";
    readonly conformance: "wasm-oj-v2/conformance";
    readonly conformanceEvidence: "wasm-oj-v2/conformance-evidence";
    readonly conformanceMatrix: "wasm-oj-v2/conformance-matrix";
    readonly cppDependencyLock: "wasm-oj-v2/cpp-dependency-lock";
    readonly dependencyLock: "wasm-oj-v2/dependency-lock";
    readonly dependencyOfflineBundle: "wasm-oj-v2/dependency-offline-bundle";
    readonly incrementalBuildGraph: "wasm-oj-v2/incremental-build-graph";
    readonly interactiveRequest: "wasm-oj-v2/interactive-request";
    readonly goToolchain: "wasm-oj-v2/go-toolchain";
    readonly objectCache: "wasm-oj-v2/object-cache";
    readonly pythonToolchain: "wasm-oj-v2/python-toolchain";
    readonly replayBundle: "wasm-oj-v2/replay-bundle";
    readonly rustToolchain: "wasm-oj-v2/rust-toolchain";
    readonly runRequest: "wasm-oj-v2/run-request";
    readonly runtimeBundle: "wasm-oj-v2/runtime-bundle";
    readonly runtimeCoreLicenses: "wasm-oj-v2/runtime-core-licenses";
    readonly thirdPartyComponents: "wasm-oj-v2/third-party-components";
    readonly wasmerSdkLicenses: "wasm-oj-v2/wasmer-sdk-licenses";
    readonly toolchainPackage: "wasm-oj-v2/toolchain-package";
}>;
declare const WASM_OJ_STORAGE: Readonly<{
    readonly database: "wasm-oj-v2:storage";
    readonly databaseVersion: 2;
    readonly dependencyCache: "wasm-oj-v2:dependencies";
    readonly incrementalBuildCache: "wasm-oj-v2:incremental-build-cache";
    readonly runtimeFilesCache: "wasm-oj-v2:runtime-files";
    readonly toolchainCache: "wasm-oj-v2:toolchains";
}>;

declare const LANGUAGES: readonly ["c", "cpp", "rust", "python", "javascript", "typescript", "go"];
type BuiltinLanguage = (typeof LANGUAGES)[number];
/**
 * Stable language identity carried by projects and artifacts.
 *
 * WASM-OJ ships the values in `LANGUAGES`; downstream compiler implementations
 * may use their own non-empty identifier without forking the contract.
 */
type Language = BuiltinLanguage | (string & {});
declare function assertLanguageIdentifier(language: unknown): asserts language is Language;
declare function isBuiltinLanguage(language: string): language is BuiltinLanguage;
type TargetAbi = "wasip1" | "wasix";
type OptimizationLevel = "debug" | "release";
declare const DEPENDENCY_ECOSYSTEMS: readonly ["cargo", "npm", "pypi", "go", "cpp"];
type DependencyEcosystem = (typeof DEPENDENCY_ECOSYSTEMS)[number];
interface DependencyRequirement {
    ecosystem: DependencyEcosystem;
    name: string;
    requirement: string;
    features?: readonly string[];
}
interface DependencySourceFile {
    ecosystem: DependencyEcosystem;
    role: "manifest" | "lockfile" | "source";
    path: string;
    contents: string;
}
interface DependencyManifest {
    requirements: readonly DependencyRequirement[];
    sourceFiles?: readonly DependencySourceFile[];
}
interface LockedDependencyPackage {
    id: string;
    ecosystem: DependencyEcosystem;
    name: string;
    version: string;
    source: string;
    integritySha256: string;
    dependencies: readonly string[];
    features?: readonly string[];
}
interface DependencyLock {
    schema: typeof WASM_OJ_SCHEMAS.dependencyLock;
    wasmOjContract: typeof WASM_OJ_CONTRACT_VERSION;
    manifestSha256: string;
    roots: readonly string[];
    packages: readonly LockedDependencyPackage[];
}
interface MaterializedDependencyPackage {
    package: LockedDependencyPackage;
    filesSha256: string;
    files: Readonly<Record<string, Uint8Array>>;
}
/** Archive-independent, fully verified dependency input admitted by compilers. */
interface DependencyBuildBundle {
    lock: DependencyLock;
    lockSha256: string;
    packages: readonly MaterializedDependencyPackage[];
}
interface ProjectFile {
    path: string;
    language: Language;
    content: string;
}
interface BuildConfig {
    /** C/C++ linear-memory stack reservation in bytes; omitted uses the toolchain default. */
    stackSizeBytes?: number;
    language: Language;
    target: TargetAbi;
    optimization: OptimizationLevel;
    entry: string;
}
interface DeterminismConfig {
    /** Unsigned 32-bit seed used by every guest entropy source. */
    randomSeed: number;
    /** Unix epoch exposed by the first realtime-clock observation. */
    realtimeEpochMs: number;
    /** Virtual clock advancement after each clock observation. */
    clockStepNs: number;
}
interface ResourcePolicy {
    /** Versioned baseline-normalized weighted Wasm instruction budget. */
    instructionBudget: number;
    /** Deterministic virtual elapsed-time budget, including sleeps and clock observations. */
    logicalTimeLimitMs: number;
    /** Hard upper bound for guest linear memory. */
    memoryLimitBytes: number;
    /** Combined stdout and stderr upper bound. */
    outputLimitBytes: number;
    /** Additional live VFS file bytes permitted above the mounted baseline. */
    filesystemWriteLimitBytes: number;
    /** Additional live VFS entries permitted above the mounted baseline. */
    filesystemEntryLimit: number;
    /** Host safety deadline; excluded from the deterministic transcript. */
    wallTimeLimitMs: number;
}
type ExecutionTermination = "exited" | "instruction-limit" | "logical-time-limit" | "memory-limit" | "output-limit" | "filesystem-limit" | "wall-time-limit" | "trap";
interface ExecutionMetrics {
    /** Baseline-normalized weighted deterministic cost used for judging. */
    cost: number | null;
    /** Unadjusted weighted cost observed by the runtime core. */
    rawCost: number | null;
    /** Empty-program cost subtracted from rawCost. */
    baselineCost: number;
    /** Versioned compiler/runtime baseline identity. */
    costProfile: string;
    /** Meter policy used to interpret cost. */
    costModel: string;
    /** WARK-compatible static counts of original Wasm operators. */
    operations: Readonly<Record<string, number>> | null;
    /** Peak linear-memory allocation observed by the runner. */
    memoryBytes: number | null;
    /** Deterministic virtual time elapsed during execution. */
    logicalTimeNs: number | null;
    /** Peak live VFS file bytes, including the mounted baseline. */
    filesystemBytes: number | null;
    /** Peak live VFS inode count, excluding the root inode. */
    filesystemEntries: number | null;
    stdoutBytes: number | null;
    stderrBytes: number | null;
}
interface RunConfig {
    args: string[];
    stdin: string;
    env: Record<string, string>;
    /** Absolute, normalized guest files mounted before execution. */
    files?: Record<string, Uint8Array>;
    /** Absolute, normalized guest files collected after execution. */
    outputPaths?: string[];
    /** Absolute, normalized initial working directory. */
    cwd?: string;
    determinism: DeterminismConfig;
    resources: ResourcePolicy;
}
interface ProjectConfig extends BuildConfig, RunConfig {
}
interface Project {
    id: string;
    name: string;
    files: ProjectFile[];
    config: ProjectConfig;
    activeFile: string;
    updatedAt: number;
    /** Verified archive-independent dependency input, if this project uses packages. */
    dependencies?: DependencyBuildBundle;
}
type DiagnosticSeverity = "error" | "warning" | "info";
interface Diagnostic {
    severity: DiagnosticSeverity;
    message: string;
    file: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    source: string;
    code?: string;
}
interface ArtifactMetadata {
    /** WASM-OJ compatibility contract required to consume this artifact. */
    wasmOjContract: typeof WASM_OJ_CONTRACT_VERSION;
    id: string;
    projectId: string;
    cacheKey: string;
    name: string;
    language: Language;
    target: TargetAbi;
    optimization: OptimizationLevel;
    createdAt: number;
    durationMs: number;
    size: number;
    toolchains: string[];
    /** Trusted empty-program cost profile selected by the compiler contract. */
    costProfile: string;
    /** Canonical dependency lock used for this build. */
    dependencyLockSha256?: string;
}
interface WasmArtifact extends ArtifactMetadata {
    kind: "wasm";
    bytes: Uint8Array;
}
interface RuntimeBundleArtifact extends ArtifactMetadata {
    kind: "runtime-bundle";
    runtimePackage: string;
    command: string;
    entry: string;
    files: Record<string, string | Uint8Array>;
    manifest: string;
}
type BuildArtifact = WasmArtifact | RuntimeBundleArtifact;
interface BuildResult {
    success: boolean;
    diagnostics: Diagnostic[];
    artifact?: BuildArtifact;
    stdout: string;
    stderr: string;
    cacheHit: boolean;
    buildGraph?: {
        hits: Partial<Record<"pch" | "object" | "link-result", number>>;
        misses: Partial<Record<"pch" | "object" | "link-result", number>>;
        stores: Partial<Record<"pch" | "object" | "link-result", number>>;
    };
}
interface RunResult {
    code: number;
    stdout: string;
    stderr: string;
    /** Requested output files that existed when the process terminated. */
    files: Record<string, Uint8Array>;
    durationMs: number;
    /** Browser guest wall time, excluding runtime preparation and output collection. */
    executionDurationMs?: number;
    determinism: DeterminismConfig;
    resources: ResourcePolicy;
    termination: ExecutionTermination;
    /** Runtime trap text when termination is `trap`; absent for normal guest exits. */
    trapMessage?: string;
    metrics: ExecutionMetrics;
}
interface InteractiveProgramConfig {
    args: string[];
    env: Record<string, string>;
    files?: Record<string, Uint8Array>;
    cwd?: string;
    resources: ResourcePolicy;
}
interface InteractiveRunConfig {
    contestant: InteractiveProgramConfig;
    interactor: InteractiveProgramConfig;
    determinism: DeterminismConfig;
}
interface InteractiveProcessResult {
    code: number;
    stderr: string;
    termination: ExecutionTermination;
    metrics: ExecutionMetrics;
}
interface InteractiveRunResult {
    contestant: InteractiveProcessResult;
    interactor: InteractiveProcessResult;
    contestantToInteractor: string;
    interactorToContestant: string;
    durationMs: number;
    determinism: DeterminismConfig;
}
type WorkerPhase = "initializing" | "restoring-cache" | "loading-toolchain" | "checking" | "compiling" | "linking" | "packaging" | "running";
interface WorkerProgress {
    phase: WorkerPhase;
    label: string;
    progress?: number;
}
/** Content-pinned host extension loaded inside the browser runner Worker. */
interface BrowserRuntimeDriverPlugin {
    /** Stable host-selected identity; the constructed RuntimeDriver must use the same ID. */
    id: string;
    /** Same-origin URL of one self-contained ESM module. */
    moduleUrl: string;
    /** Lowercase SHA-256 of the exact ESM source bytes. */
    sha256: string;
    /** Named factory export. Defaults to `createRuntimeDriver`. */
    exportName?: string;
}
interface ToolchainProfile {
    language: Language;
    target: TargetAbi;
    optimization: OptimizationLevel;
}
interface ToolchainAssetDescriptor {
    /** Logical filename expected by the compiler/runtime implementation. */
    path: string;
    bytes: number;
    sha256: string;
    /** Exact package export used by deployment tooling. */
    exportPath: string;
}
interface ToolchainDescriptor {
    schema: typeof WASM_OJ_SCHEMAS.toolchainPackage;
    id: string;
    version: string;
    wasmOjContract: typeof WASM_OJ_CONTRACT_VERSION;
    languages: readonly Language[];
    profiles: readonly ToolchainProfile[];
    assets: readonly ToolchainAssetDescriptor[];
}
interface BrowserToolchainSource {
    kind: "browser";
    descriptor: ToolchainDescriptor;
    baseUrl: string;
}
interface ServerToolchainSource {
    kind: "server";
    descriptor: ToolchainDescriptor;
    directory: URL;
}
type ToolchainSource = BrowserToolchainSource | ServerToolchainSource;
type CompilerTraceOperation = "workerInitialize" | "toolchainFetch" | "toolchainDecode" | "toolchainLoad" | "filesystemPrepare" | "commandStart" | "commandWait" | "projectCompile" | "runtimeShimCompile" | "link" | "projectSpawn" | "projectWait" | "runtimeShimSpawn" | "runtimeShimWait" | "linkSpawn" | "linkWait" | "projectOutputReady" | "runtimeShimOutputReady" | "linkOutputReady" | "artifactReadback";
/** Host-observed compiler timing mark; excluded from deterministic contracts and cache keys. */
interface CompilerTraceEvent {
    schema: typeof WASM_OJ_SCHEMAS.compileTrace;
    operation: CompilerTraceOperation;
    state: "start" | "end";
    monotonicMs: number;
}
type CompilerRequest = {
    type: "initialize";
    requestId: string;
    toolchains: readonly BrowserToolchainSource[];
} | {
    type: "build";
    requestId: string;
    project: Project;
    cacheKey: string;
} | {
    type: "quiesce";
    requestId: string;
};
type RunnerRequest = {
    type: "initialize";
    requestId: string;
    toolchains: readonly BrowserToolchainSource[];
    additionalCostBaselines?: Readonly<Record<string, number>>;
    runtimeDriverPlugins?: readonly BrowserRuntimeDriverPlugin[];
} | {
    type: "run";
    requestId: string;
    artifact: BuildArtifact;
    config: RunConfig;
} | {
    type: "interact";
    requestId: string;
    contestant: BuildArtifact;
    interactor: BuildArtifact;
    config: InteractiveRunConfig;
} | {
    type: "clear-runtime-cache";
    requestId: string;
};
type CompilerResponse = {
    type: "ready";
    requestId: string;
} | {
    type: "quiesced";
    requestId: string;
} | {
    type: "progress";
    requestId: string;
    progress: WorkerProgress;
} | {
    type: "compile-trace";
    requestId: string;
    event: CompilerTraceEvent;
} | {
    type: "build-result";
    requestId: string;
    result: BuildResult;
} | {
    type: "error";
    requestId: string;
    code: string;
    message: string;
    stack?: string;
};
type RunnerResponse = {
    type: "ready";
    requestId: string;
} | {
    type: "progress";
    requestId: string;
    progress: WorkerProgress;
} | {
    type: "stream";
    requestId: string;
    stream: "stdout" | "stderr";
    chunk: string;
} | {
    type: "run-result";
    requestId: string;
    result: RunResult;
} | {
    type: "interactive-result";
    requestId: string;
    result: InteractiveRunResult;
} | {
    type: "runtime-cache-cleared";
    requestId: string;
} | {
    type: "error";
    requestId: string;
    code: string;
    message: string;
    stack?: string;
};

declare const WASM_OJ_ERROR_CODES: readonly ["operation-cancelled", "operation-conflict", "invalid-input", "unsupported", "integrity-failure", "compiler-failure", "runner-failure", "judge-failure", "replay-failure", "dependency-failure", "storage-failure", "initialization-failure", "disposed", "internal-failure"];
type WasmOjErrorCode = (typeof WASM_OJ_ERROR_CODES)[number];
declare const WASM_OJ_ERROR_STAGES: readonly ["operation", "compile", "prepare", "run", "judge", "replay", "dependency", "storage", "initialize"];
type WasmOjErrorStage = (typeof WASM_OJ_ERROR_STAGES)[number];
interface WasmOjErrorOptions extends ErrorOptions {
    code: WasmOjErrorCode;
    stage: WasmOjErrorStage;
    retryable?: boolean;
    operationId?: string;
    details?: Readonly<Record<string, string | number | boolean | null>>;
}
interface WasmOjErrorRecord {
    name: "WasmOjError";
    message: string;
    code: WasmOjErrorCode;
    stage: WasmOjErrorStage;
    retryable: boolean;
    operationId?: string;
    details?: Readonly<Record<string, string | number | boolean | null>>;
}
/** Stable infrastructure failure exposed at public asynchronous boundaries. */
declare class WasmOjError extends Error {
    readonly code: WasmOjErrorCode;
    readonly stage: WasmOjErrorStage;
    readonly retryable: boolean;
    readonly operationId?: string;
    readonly details?: Readonly<Record<string, string | number | boolean | null>>;
    constructor(message: string, options: WasmOjErrorOptions);
    toJSON(): WasmOjErrorRecord;
}
declare function asWasmOjError(error: unknown, options: Omit<WasmOjErrorOptions, "cause">): WasmOjError;

export { DEPENDENCY_ECOSYSTEMS, LANGUAGES, WASM_OJ_CONTRACT_ID, WASM_OJ_CONTRACT_VERSION, WASM_OJ_ERROR_CODES, WASM_OJ_ERROR_STAGES, WASM_OJ_SCHEMAS, WASM_OJ_STORAGE, WasmOjError, asWasmOjError, assertLanguageIdentifier, isBuiltinLanguage };
export type { ArtifactMetadata, BrowserRuntimeDriverPlugin, BrowserToolchainSource, BuildArtifact, BuildConfig, BuildResult, BuiltinLanguage, CompilerRequest, CompilerResponse, CompilerTraceEvent, CompilerTraceOperation, DependencyBuildBundle, DependencyEcosystem, DependencyLock, DependencyManifest, DependencyRequirement, DependencySourceFile, DeterminismConfig, Diagnostic, DiagnosticSeverity, ExecutionMetrics, ExecutionTermination, InteractiveProcessResult, InteractiveProgramConfig, InteractiveRunConfig, InteractiveRunResult, Language, LockedDependencyPackage, MaterializedDependencyPackage, OptimizationLevel, Project, ProjectConfig, ProjectFile, ResourcePolicy, RunConfig, RunResult, RunnerRequest, RunnerResponse, RuntimeBundleArtifact, ServerToolchainSource, TargetAbi, ToolchainAssetDescriptor, ToolchainDescriptor, ToolchainProfile, ToolchainSource, WasmArtifact, WasmOjErrorCode, WasmOjErrorOptions, WasmOjErrorRecord, WasmOjErrorStage, WorkerPhase, WorkerProgress };
