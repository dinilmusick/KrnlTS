import * as ___core_types from '../../contracts/dist/index.js';
import { ExecutionMetrics as ExecutionMetrics$1, BuildArtifact as BuildArtifact$1, Project as Project$1, BuildResult as BuildResult$1, WorkerProgress, RunConfig as RunConfig$1, RunResult as RunResult$1, InteractiveRunConfig, InteractiveRunResult as InteractiveRunResult$1, DeterminismConfig as DeterminismConfig$1, ResourcePolicy as ResourcePolicy$1, WASM_OJ_CONTRACT_VERSION as WASM_OJ_CONTRACT_VERSION$1, InteractiveProgramConfig, Language as Language$1, TargetAbi as TargetAbi$1, OptimizationLevel as OptimizationLevel$1, WasmOjErrorRecord, BuiltinLanguage as BuiltinLanguage$1 } from '../../contracts/dist/index.js';
export { ArtifactMetadata, BrowserRuntimeDriverPlugin, BrowserToolchainSource, BuildArtifact, BuildConfig, BuildResult, BuiltinLanguage, CompilerRequest, CompilerResponse, CompilerTraceEvent, DeterminismConfig, Diagnostic, DiagnosticSeverity, ExecutionMetrics, ExecutionTermination, InteractiveProcessResult, InteractiveProgramConfig, InteractiveRunConfig, InteractiveRunResult, LANGUAGES, Language, OptimizationLevel, Project, ProjectConfig, ProjectFile, ResourcePolicy, RunConfig, RunResult, RunnerRequest, RunnerResponse, RuntimeBundleArtifact, ServerToolchainSource, TargetAbi, ToolchainAssetDescriptor, ToolchainDescriptor, ToolchainProfile, WASM_OJ_CONTRACT_ID, WASM_OJ_CONTRACT_VERSION, WASM_OJ_ERROR_CODES, WASM_OJ_ERROR_STAGES, WASM_OJ_SCHEMAS, WASM_OJ_STORAGE, WasmArtifact, WasmOjError, WasmOjErrorCode, WasmOjErrorOptions, WasmOjErrorRecord, WasmOjErrorStage, WorkerProgress, asWasmOjError, assertLanguageIdentifier, isBuiltinLanguage } from '../../contracts/dist/index.js';

/**
 * The single compatibility boundary shared by WASM-OJ compilers, runners,
 * artifacts, judge specifications, caches, and conformance evidence.
 *
 * Package and upstream toolchain versions remain independent release metadata;
 * they do not define WASM-OJ protocol compatibility.
 */
declare const WASM_OJ_CONTRACT_VERSION: 2;
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

declare const LANGUAGES: readonly ["c", "cpp", "rust", "python", "javascript", "typescript", "go"];
type BuiltinLanguage = (typeof LANGUAGES)[number];
/**
 * Stable language identity carried by projects and artifacts.
 *
 * WASM-OJ ships the values in `LANGUAGES`; downstream compiler implementations
 * may use their own non-empty identifier without forking the contract.
 */
type Language = BuiltinLanguage | (string & {});
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

declare const DEFAULT_DETERMINISM: Readonly<DeterminismConfig>;
declare function resolveDeterminism(value: Partial<DeterminismConfig> | undefined): DeterminismConfig;

type CanonicalJsonValue = null | boolean | number | string | readonly CanonicalJsonValue[] | {
    readonly [key: string]: CanonicalJsonValue;
};
/** WASM-OJ canonical JSON: sorted object keys, safe integers, UTF-8, and one trailing newline. */
declare function canonicalJsonBytes(value: unknown): Uint8Array;
declare function parseCanonicalJsonBytes(bytes: Uint8Array, label?: string): CanonicalJsonValue;

/** The weighted meter defined by the active WASM-OJ contract. */
declare const WEIGHTED_METER_MODEL = "weighted";
declare const DEFAULT_RESOURCE_POLICY: Readonly<ResourcePolicy>;
declare function resolveResourcePolicy(value: Partial<ResourcePolicy> | undefined): ResourcePolicy;

interface RawExecutionMetrics {
    cost: number;
    costModel: string;
    operations: Readonly<Record<string, number>>;
    memoryBytes: number;
    logicalTimeNs: number;
    filesystemBytes: number;
    filesystemEntries: number;
    stdoutBytes: number;
    stderrBytes: number;
}
interface CostBudget {
    profile: string;
    baselineCost: number;
    netInstructionBudget: number;
    rawInstructionBudget: number;
}
declare class CostBaselineRegistry {
    private readonly baselines;
    private sealed;
    constructor(entries?: Readonly<Record<string, number>>);
    register(profile: string, baseline: number): void;
    baseline(profile: string): number;
}
declare function createDefaultCostBaselineRegistry(): CostBaselineRegistry;
declare function createExtendedCostBaselineRegistry(additional?: Readonly<Record<string, number>>): CostBaselineRegistry;
declare function resolveCostBudget(profile: string, netInstructionBudget: number, registry?: CostBaselineRegistry): CostBudget;
declare function resolveArtifactCostBudget(artifact: BuildArtifact$1, netInstructionBudget: number, registry?: CostBaselineRegistry): CostBudget;
declare function normalizeExecutionMetrics(raw: RawExecutionMetrics, budget: CostBudget): ExecutionMetrics$1;
declare function unavailableExecutionMetrics(budget: CostBudget, costModel: string): ExecutionMetrics$1;

/** Stable identity for one calibrated compiler/runtime overhead profile. */
declare function costProfileId(language: Language, target: TargetAbi, optimization: OptimizationLevel, downstreamToolchainContent?: string): string;
declare function isCostProfileFor(profile: string, language: Language, target: TargetAbi, optimization: OptimizationLevel): boolean;

/** Executable runtime components covered by deterministic cost calibration. */
declare const WASM_OJ_RUNTIME_COMPONENTS: Readonly<{
    readonly runtimeCoreWasmSha256: "077aa936a3382a242eee7222fc17369769cb5ad265303d730ffc45ee192367e9";
    readonly runtimeSourceRootSha256: "c65b3bbcad41359f86b8f1d1315af8f079b44f0e9084ace0d6d50c0ec418415b";
    readonly wasmerNativeVersion: "7.2.1";
    readonly wasmerSdkVersion: "0.10.0";
    readonly wasmerSdkWasmSha256: "49a6646209f5ab5e7c737eac33407d87d9a9959ac83e5ecaaab9261b2323589e";
    readonly wasmerWasixVersion: "0.702.1";
}>;
/**
 * SHA-256 of `runtimeIdentityBytes()`.
 * Release verification independently checks the component bytes before this
 * identity is admitted into a calibrated release.
 */
declare const WASM_OJ_RUNTIME_IDENTITY_SHA256 = "47684bee57aafd163b18a787fa16eed33cab3ec3c0005c3c46bb4f1803ffc835";
/** Exact canonical serialization hashed by `WASM_OJ_RUNTIME_IDENTITY_SHA256`. */
declare function runtimeIdentityBytes(): Uint8Array;
declare function verifyRuntimeIdentity(): Promise<void>;

/**
 * Fail-closed validation boundary for projects crossing persistence or
 * transport boundaries. The candidate is checked without mutation, defaults,
 * type coercion, or shape recovery.
 */
declare function assertValidProject(candidate: unknown): asserts candidate is Project;

declare const PROJECT_SOURCE_LIMITS: Readonly<{
    files: 256;
    bytesPerFile: number;
    totalBytes: number;
}>;

interface ArtifactBuildExpectation {
    readonly project: Project;
    readonly cacheKey: string;
}
/** Canonical WASM-OJ manifest constructor for built-in and downstream runtime bundles. */
declare function createRuntimeBundleManifest(project: Project, runtimePackage: string, command: string, entry: string): string;
/**
 * Fail-closed compatibility boundary for cache, compiler, and runner inputs.
 * Built-in languages are bound to WASM-OJ's exact artifact/runtime/toolchain
 * profile; downstream languages retain their own toolchain and runtime driver.
 */
declare function assertValidBuildArtifact(candidate: unknown, expectation?: ArtifactBuildExpectation): asserts candidate is BuildArtifact;

interface ToolchainAssetSource<Source extends ToolchainSource = ToolchainSource> {
    source: Source;
    asset: ToolchainAssetDescriptor;
}
interface ToolchainProfileSource<Source extends ToolchainSource = ToolchainSource> {
    source: Source;
    profile: ToolchainProfile;
}
/**
 * Validates a complete, homogeneous toolchain-source set at the host boundary.
 * No source is inferred and no duplicate language, profile, or asset ownership
 * is accepted.
 */
declare function validateToolchainDescriptors<Source extends ToolchainSource>(sources: readonly Source[], expectedKind?: Source["kind"]): readonly Source[];
declare function validateBrowserToolchainSources(sources: readonly BrowserToolchainSource[]): readonly BrowserToolchainSource[];
declare function validateServerToolchainSources(sources: readonly ServerToolchainSource[]): readonly ServerToolchainSource[];
/** Returns an immutable, structured-clone-safe browser source snapshot. */
declare function snapshotBrowserToolchainSources(sources: readonly BrowserToolchainSource[]): readonly BrowserToolchainSource[];
declare function toolchainAssetSource<Source extends ToolchainSource>(sources: readonly Source[], path: string): ToolchainAssetSource<Source>;
declare function toolchainProfileSource<Source extends ToolchainSource>(sources: readonly Source[], language: string, target: TargetAbi, optimization: OptimizationLevel): ToolchainProfileSource<Source>;
declare function browserToolchainAssetBaseUrl(sources: readonly BrowserToolchainSource[], path: string, resolutionBaseUrl: string | URL): URL;
declare function browserToolchainAssetUrl(sources: readonly BrowserToolchainSource[], path: string, resolutionBaseUrl: string | URL): URL;

declare function assertCompilerCacheKey(cacheKey: unknown): asserts cacheKey is string;

declare const CLANG_VERSION = "22.0.0-git20542-10";
/** SHA-256 after browser-side gzip decompression. */
declare const CLANG_PACKAGE_SHA256 = "21ded33b9c6d4e1aaad5528c940bdaf6c3e84be77ea8f522f018ca7289a2a224";
/** SHA-256 of the pinned cc1/wasm-ld argv manifest; regenerated by scripts/pin-clang-cc1-argv.mjs. */
declare const CLANG_CC1_PINS_SHA256 = "895eee17c63b1112c84adcc4ddbcb38e0c18e53bff15f50a8689b9b82d87b1ff";
declare function toolchainCacheIdentity(language: Language): {
    wasmOjContract: 2;
    version: string;
    compilerPackages: string[];
    contentSha256: string[];
    runtimePackage?: undefined;
} | {
    wasmOjContract: 2;
    version: string;
    compilerPackages: string[];
    runtimePackage: string | undefined;
    contentSha256: string[];
};
interface BrowserToolchainAssetSelection {
    readonly language: Language;
    readonly optimization: OptimizationLevel;
    /** C++ only: include the admitted libc++ PCH that projects with `wasm-oj.pch.hpp` load. */
    readonly libcxxPrecompiledHeader?: boolean;
}
/** Pinned toolchain assets a browser host fetches to compile and run one project. */
declare function browserToolchainAssetPaths(selection: BrowserToolchainAssetSelection): readonly string[];

/** Environment-neutral compiler contract implemented by browser and server hosts. */
interface Compiler {
    /**
     * Stable, content-addressed identity for the compiler inputs used by this
     * project. WASM-OJ incorporates it into artifact cache keys before building.
     */
    cacheIdentity(project: Project$1): string;
    ready(): Promise<void>;
    build(project: Project$1, cacheKey: string): Promise<BuildResult$1>;
    onProgress(listener: (progress: WorkerProgress) => void): () => void;
    clearToolchainCache(): Promise<void>;
    cancel(): void;
    restart(): void;
    dispose(): void;
}

interface ArtifactStore {
    load(cacheKey: string): Promise<BuildArtifact$1 | undefined>;
    save(artifact: BuildArtifact$1): Promise<void>;
    delete(cacheKey: string): Promise<void>;
    clear(): Promise<void>;
}
type PrecompileStatus = "ready" | "compile-error" | "superseded" | "failed";
interface PrecompileOutcome {
    cacheKey: string;
    status: PrecompileStatus;
    result?: BuildResult$1;
    error?: Error;
}

declare const TRUSTED_JUDGE_WASM_MAX_BYTES: number;
/** Exact deterministic WASI Preview 1 surface admitted for trusted judge commands. */
declare const TRUSTED_JUDGE_WASIP1_IMPORTS: Readonly<Set<string>>;
type TrustedJudgeRuntimeProfile = "c-wasip1-release" | "cpp-wasip1-release" | "rust-wasip1-release" | "go-wasip1-release";
declare const TRUSTED_JUDGE_RUNTIME_PROFILES: Readonly<Set<TrustedJudgeRuntimeProfile>>;
/** Runtime-owned executable identity. This is deliberately not a compiler BuildArtifact. */
interface TrustedJudgeProgram {
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly wasm: Uint8Array;
}
interface TrustedJudgeWasmInfo {
    readonly bytes: number;
    readonly initialMemoryPages: number;
    readonly maximumMemoryPages?: number;
    readonly imports: readonly string[];
}
interface TrustedJudgeWasmValidationOptions {
    /** Problem-level memory ceiling used to reject an impossible initial memory. */
    readonly memoryLimitBytes?: number;
}
/**
 * Pure static admission for prebuilt checker/interactor modules. It validates
 * structure and ABI only; it never compiles, instantiates, or executes guest code.
 */
declare function validateTrustedJudgeWasm(bytes: Uint8Array, options?: TrustedJudgeWasmValidationOptions): TrustedJudgeWasmInfo;

/** Environment-neutral runner contract implemented by browser and native hosts. */
interface Runner {
    ready(): Promise<void>;
    run(artifact: BuildArtifact$1, config: RunConfig$1): Promise<RunResult$1>;
    interact(contestant: BuildArtifact$1, interactor: BuildArtifact$1, config: InteractiveRunConfig): Promise<InteractiveRunResult$1>;
    /** Server-side immutable judge command path; browser hosts intentionally omit it. */
    runTrusted?(program: TrustedJudgeProgram, config: RunConfig$1): Promise<RunResult$1>;
    interactTrusted?(contestant: BuildArtifact$1, interactor: TrustedJudgeProgram, config: InteractiveRunConfig): Promise<InteractiveRunResult$1>;
    onProgress(listener: (progress: WorkerProgress) => void): () => void;
    onStream(listener: (stream: "stdout" | "stderr", chunk: string) => void): () => void;
    clearRuntimeCache(): Promise<void>;
    cancel(): void;
    /** Cancel accepted execution work and wait until it can no longer mutate caches. */
    cancelAndWait(): Promise<void>;
    restart(): void;
    dispose(): void;
}

type OutputNormalization = "exact" | "lines" | "trimmed-lines";
declare function normalizeOutput(value: string, mode: OutputNormalization): string;

type JudgeInputSpec = {
    kind: "inline";
    value: string;
} | {
    kind: "provider";
    provider: string;
    key: string;
    sha256?: string;
};
/** Binary-safe materialized input accepted only for mounted guest files. */
type JudgeFileInputSpec = JudgeInputSpec | {
    kind: "inline-bytes";
    value: Uint8Array;
};
/** Serializable matcher descriptor. Libraries may register additional matcher IDs. */
interface JudgeMatcherSpec {
    id: string;
    config: Readonly<Record<string, unknown>>;
}
interface JudgeProgramSpec {
    args?: readonly string[];
    env?: Readonly<Record<string, string>>;
    cwd?: string;
    resources?: Partial<ResourcePolicy$1>;
}
interface JudgeCaseBase {
    id: string;
    input: JudgeInputSpec;
    /** Additional secret inputs resolved with the same provider contract as stdin. */
    files?: Readonly<Record<string, JudgeFileInputSpec>>;
    determinism?: Partial<DeterminismConfig$1>;
}
interface BatchJudgeCaseSpec extends JudgeCaseBase, JudgeProgramSpec {
    kind: "batch";
    /** Guest files collected for file-output matchers and custom checkers. */
    outputPaths?: readonly string[];
    matcher: JudgeMatcherSpec;
}
interface InteractiveJudgeCaseSpec extends JudgeCaseBase {
    kind: "interactive";
    /** Contestant execution policy. Secret case files are never mounted here. */
    contestant?: JudgeProgramSpec;
    interactor: JudgeProgramSpec & {
        program: TrustedJudgeProgram;
        /** Absolute guest path receiving the resolved primary case input. */
        inputPath: string;
    };
}
type JudgeCaseSpec = BatchJudgeCaseSpec | InteractiveJudgeCaseSpec;
interface JudgeSpec {
    version: typeof WASM_OJ_CONTRACT_VERSION$1;
    cases: readonly JudgeCaseSpec[];
    /** Stop after the first non-accepted case. Defaults to true. */
    failFast?: boolean;
}
declare function textMatcher(expected: string, normalization?: OutputNormalization): JudgeMatcherSpec;
declare function sha256Matcher(digest: string, normalization?: OutputNormalization): JudgeMatcherSpec;
declare function fileMatcher(expected: Readonly<Record<string, string>>, normalization?: OutputNormalization): JudgeMatcherSpec;
declare function tokenMatcher(expected: string): JudgeMatcherSpec;
declare function floatMatcher(expected: string, absoluteTolerance?: number, relativeTolerance?: number): JudgeMatcherSpec;
declare function setMatcher(expected: string, multiplicity?: boolean): JudgeMatcherSpec;
declare function wasmCheckerMatcher(checker: TrustedJudgeProgram, expected: string, args?: readonly string[], files?: Readonly<Record<string, Uint8Array>>): JudgeMatcherSpec;
declare function validateJudgeSpec(spec: JudgeSpec): void;
/** Shared strict guest-path boundary for trusted judge assets. */
declare function assertJudgeGuestFilePath(value: unknown, label?: string): string;

type JudgeCaseVerdict = "accepted" | "wrong-answer" | "runtime-error" | "instruction-limit" | "memory-limit" | "output-limit" | "filesystem-limit" | "logical-time-limit" | "wall-time-limit" | "judge-error";
interface JudgeMatchResult {
    accepted: boolean;
    message?: string;
    /** Output produced by a trusted matcher subprocess while deciding this case. */
    auxiliaryOutputBytes?: number;
}
interface JudgeMatcherContext {
    case: BatchJudgeCaseSpec;
    artifact: BuildArtifact$1;
    stdin: string;
    run: RunResult$1;
    stdout: string;
    stderr: string;
    files: Readonly<Record<string, Uint8Array>>;
}
interface JudgeMatcher {
    readonly id: string;
    match(spec: JudgeMatcherSpec, context: JudgeMatcherContext): Promise<JudgeMatchResult>;
}
interface JudgeInputProvider {
    readonly id: string;
    resolve(input: Extract<JudgeInputSpec, {
        kind: "provider";
    }>, caseSpec: JudgeCaseSpec): Promise<string>;
}
interface JudgeCaseResult {
    id: string;
    verdict: JudgeCaseVerdict;
    message?: string;
    run?: RunResult$1;
    interaction?: InteractiveRunResult$1;
}
interface JudgeResult {
    verdict: JudgeCaseVerdict | "accepted";
    completed: number;
    total: number;
    cases: JudgeCaseResult[];
    metrics: {
        cost: number | null;
        rawCost: number | null;
        baselineCost: number;
        logicalTimeNs: number | null;
        maxMemoryBytes: number | null;
        maxFilesystemBytes: number | null;
        maxFilesystemEntries: number | null;
        stdoutBytes: number | null;
        stderrBytes: number | null;
    };
}
interface JudgeExecutor {
    run(artifact: BuildArtifact$1, caseSpec: BatchJudgeCaseSpec, input: JudgeResolvedInput): Promise<RunResult$1>;
    runTrusted(program: TrustedJudgeProgram, caseSpec: BatchJudgeCaseSpec, input: JudgeResolvedInput): Promise<RunResult$1>;
    interact(contestant: BuildArtifact$1, caseSpec: InteractiveJudgeCaseSpec, input: JudgeResolvedInput): Promise<InteractiveRunResult$1>;
}
interface JudgeResolvedInput {
    stdin: string;
    files: Readonly<Record<string, Uint8Array>>;
}
interface JudgeEngineOptions {
    inputProviders?: readonly JudgeInputProvider[];
    matchers?: readonly JudgeMatcher[];
}
interface JudgeRunOptions {
    onCase?(result: JudgeCaseResult, completed: number, total: number): void | Promise<void>;
    /**
     * Receives the exact retained-output byte count before `metrics-only`
     * redaction. Server orchestration uses this to enforce one budget across
     * several compile/judge invocations without retaining contestant bytes.
     */
    onOutputBytes?(caseBytes: number, aggregateBytes: number): void | Promise<void>;
    /**
     * Controls whether per-case stdout, stderr, output files, and interactive
     * transcripts remain attached to the returned result. Formal server judging
     * should use `metrics-only`; browser/local callers default to `full`.
     */
    retention?: "full" | "metrics-only";
    /**
     * Hard cumulative byte budget for contestant-visible output across the job.
     * Crossing it adjudicates the current and remaining cases as output-limit and
     * stops executing more cases. Each individual process remains subject to its
     * own ResourcePolicy output limit.
     */
    aggregateOutputLimitBytes?: number;
}
declare class JudgeEngine {
    private readonly executor;
    private readonly inputs;
    private readonly matchers;
    constructor(executor: JudgeExecutor, options?: JudgeEngineOptions);
    registerInputProvider(provider: JudgeInputProvider): void;
    registerMatcher(matcher: JudgeMatcher): void;
    judge(artifact: BuildArtifact$1, spec: JudgeSpec, options?: JudgeRunOptions): Promise<JudgeResult>;
    private runCase;
    private resolveInput;
    private resolveInputSpec;
}
interface JudgeExecutionAdapter {
    run(artifact: BuildArtifact$1, options: {
        args: readonly string[];
        stdin: string;
        env: Readonly<Record<string, string>>;
        files: Record<string, Uint8Array>;
        outputPaths: string[];
        cwd?: string;
        determinism: ReturnType<typeof resolveDeterminism>;
        resources: ReturnType<typeof resolveResourcePolicy>;
    }): Promise<RunResult$1>;
    interact(contestant: BuildArtifact$1, interactor: BuildArtifact$1, options: {
        contestant: InteractiveProgramConfig;
        interactor: InteractiveProgramConfig;
        determinism: DeterminismConfig$1;
    }): Promise<InteractiveRunResult$1>;
    runTrusted?(program: TrustedJudgeProgram, options: {
        args: readonly string[];
        stdin: string;
        env: Readonly<Record<string, string>>;
        files: Record<string, Uint8Array>;
        outputPaths: string[];
        cwd?: string;
        determinism: ReturnType<typeof resolveDeterminism>;
        resources: ReturnType<typeof resolveResourcePolicy>;
    }): Promise<RunResult$1>;
    interactTrusted?(contestant: BuildArtifact$1, interactor: TrustedJudgeProgram, options: {
        contestant: InteractiveProgramConfig;
        interactor: InteractiveProgramConfig;
        determinism: DeterminismConfig$1;
    }): Promise<InteractiveRunResult$1>;
}
declare function createJudgeExecutor(adapter: JudgeExecutionAdapter): JudgeExecutor;

declare const DEPENDENCY_BUILD_LIMITS: Readonly<{
    packages: 512;
    filesPerPackage: 16384;
    bytesPerFile: number;
    totalBytes: number;
}>;
declare function createDependencyLock(manifestSha256: string, roots: readonly string[], packages: readonly LockedDependencyPackage[]): DependencyLock;
declare function assertValidDependencyLock(value: unknown): asserts value is DependencyLock;
declare function dependencyLockSha256(lock: DependencyLock): Promise<string>;
declare function dependencyManifestSha256(manifest: DependencyManifest): Promise<string>;
declare function assertValidDependencyBuildBundle(value: unknown): asserts value is DependencyBuildBundle;
declare function verifyDependencyBuildBundle(bundle: DependencyBuildBundle): Promise<void>;
declare function dependencyFileTreeSha256(files: Readonly<Record<string, Uint8Array>>): Promise<string>;

interface DependencyBuildAdapter {
    readonly ecosystem: DependencyEcosystem;
    materialize(packageRecord: LockedDependencyPackage, payload: Uint8Array): Promise<Readonly<Record<string, Uint8Array>>>;
}
declare function createDefaultDependencyBuildAdapters(): readonly DependencyBuildAdapter[];
declare function createDependencyBuildBundle(lock: DependencyLock, payloads: ReadonlyMap<string, Uint8Array>, adapters?: readonly DependencyBuildAdapter[]): Promise<DependencyBuildBundle>;

interface CompileInput {
    language: Language$1;
    entry: string;
    files: Readonly<Record<string, string>>;
    target?: TargetAbi$1;
    optimization?: OptimizationLevel$1;
    /** C/C++ stack reservation, in bytes and aligned to 16; omitted uses the toolchain default. */
    stackSizeBytes?: number;
    name?: string;
    projectId?: string;
    dependencies?: DependencyBuildBundle;
}
declare function createSdkProject(input: CompileInput): Project$1;

interface CompileOptions {
    /** Read and write the configured artifact store for this build. Defaults to true. */
    cache?: boolean;
}
interface RunOptions {
    args?: readonly string[];
    stdin?: string;
    env?: Readonly<Record<string, string>>;
    files?: Readonly<Record<string, string | Uint8Array>>;
    outputPaths?: readonly string[];
    cwd?: string;
    determinism?: Partial<DeterminismConfig$1>;
    resources?: Partial<ResourcePolicy$1>;
}
interface InteractiveProgramOptions {
    args?: readonly string[];
    env?: Readonly<Record<string, string>>;
    files?: Readonly<Record<string, string | Uint8Array>>;
    cwd?: string;
    resources?: Partial<ResourcePolicy$1>;
}
interface InteractiveOptions {
    contestant?: InteractiveProgramOptions;
    interactor?: InteractiveProgramOptions;
    determinism?: Partial<DeterminismConfig$1>;
}
interface InteractiveExecuteResult {
    contestantBuild: BuildResult$1;
    interactorBuild: BuildResult$1;
    run?: InteractiveRunResult$1;
}
interface ExecuteResult {
    build: BuildResult$1;
    run?: RunResult$1;
}

interface ConformanceHost {
    readonly id: string;
    compile(input: CompileInput, options?: CompileOptions): Promise<BuildResult>;
    run(artifact: BuildArtifact, options?: RunOptions): Promise<RunResult>;
}
interface ConformanceCase {
    id: string;
    label: string;
    input: CompileInput & {
        target: TargetAbi;
    };
    run?: RunOptions;
    expect: ConformanceRunExpectation;
}
interface ConformanceRunExpectation {
    code: number;
    stdout: string;
    stderr?: string;
    termination: RunResult["termination"];
    logicalTimeNs?: number;
    trapMessageIncludes?: string;
    files?: Readonly<Record<string, string>>;
}
interface ConformanceSample {
    host: string;
    caseId: string;
    caseLabel: string;
    success: boolean;
    artifactDigest?: string;
    artifactBytes?: number;
    firstUncachedCompileMs: number;
    repeatUncachedCompileMs?: number;
    runMedianMs?: number;
    transcript?: DeterministicTranscript;
    diagnostics: BuildResult["diagnostics"];
    error?: string;
}
interface DeterministicTranscript {
    code: number;
    stdout: string;
    stderr: string;
    /** Collected guest output files encoded as lowercase hexadecimal bytes. */
    files: Readonly<Record<string, string>>;
    termination: RunResult["termination"];
    trapMessage?: string;
    determinism: RunResult["determinism"];
    resources: RunResult["resources"];
    metrics: RunResult["metrics"];
}
interface ConformanceMismatch {
    caseId: string;
    baselineHost: string;
    comparedHost: string;
    fields: string[];
}
interface ConformanceReport {
    compatible: boolean;
    repetitions: number;
    samples: ConformanceSample[];
    mismatches: ConformanceMismatch[];
    efficiency: Array<{
        caseId: string;
        host: string;
        firstUncachedCompileMs: number;
        repeatUncachedCompileMs?: number;
        runMedianMs?: number;
        artifactBytes?: number;
        netWeightedCost?: number | null;
        rawWeightedCost?: number | null;
        baselineWeightedCost?: number;
        logicalTimeNs?: number | null;
    }>;
}
interface ConformanceSnapshot {
    schema: typeof WASM_OJ_SCHEMAS.conformance;
    host: string;
    repetitions: number;
    caseIds: string[];
    samples: ConformanceSample[];
}
interface ConformanceOptions {
    repetitions?: number;
    repeatCompile?: boolean;
    onSample?(sample: ConformanceSample, completed: number, total: number): void | Promise<void>;
}
declare function runConformanceMatrix(hosts: readonly ConformanceHost[], cases: readonly ConformanceCase[], options?: ConformanceOptions): Promise<ConformanceReport>;
/** Run one host independently so browser and server snapshots can be produced in different processes. */
declare function runConformanceHost(host: ConformanceHost, cases: readonly ConformanceCase[], options?: ConformanceOptions): Promise<ConformanceSnapshot>;
/** Compare independently serialized snapshots and produce the efficiency matrix. */
declare function compareConformanceSnapshots(snapshots: readonly ConformanceSnapshot[]): ConformanceReport;
declare function deterministicTranscript(run: RunResult): DeterministicTranscript;

interface ResolvedDependencyGraph {
    roots: readonly string[];
    packages: readonly LockedDependencyPackage[];
    /** One canonical archive/blob per package ID. */
    payloads: Readonly<Record<string, Uint8Array>>;
}
/** @internal Shared by all adapters participating in one bounded resolution. */
interface DependencyDownloadBudget {
    readonly limitBytes: number;
    readonly usedBytes: number;
    reserve(bytes: number): void;
    consume(bytes: number): void;
    release(bytes: number): void;
}
interface DependencyResolutionContext {
    previousLock?: DependencyLock;
    /** Explicit browser/network consent scope. Omit only for offline resolution. */
    networkAccess?: DependencyNetworkAccess;
    /** @internal WASM-OJ-owned aggregate budget; custom resolvers must pass it through to network transports. */
    downloadBudget?: DependencyDownloadBudget;
}
/** Repository and immutable problem-bundle identity used to isolate cached locks. */
interface DependencyNetworkScope {
    sourceKey: string;
    bundleDigest: string;
}
/** Complete host set approved for one repository source and immutable problem bundle. */
interface DependencyNetworkAccess extends DependencyNetworkScope {
    hosts: readonly string[];
}
/** Performs the user- or host-owned authorization step before any dependency request. */
interface DependencyNetworkAuthorizer {
    authorize(access: DependencyNetworkAccess): Promise<void>;
}
interface DependencyResolver {
    readonly ecosystem: DependencyEcosystem;
    resolve(manifest: DependencyManifest, context: DependencyResolutionContext): Promise<ResolvedDependencyGraph>;
}
interface DependencyCache {
    load(integritySha256: string): Promise<Uint8Array | undefined>;
    save(integritySha256: string, payload: Uint8Array): Promise<void>;
    delete(integritySha256: string): Promise<void>;
    clear(): Promise<void>;
}
interface DependencyOfflineBundle {
    schema: typeof WASM_OJ_SCHEMAS.dependencyOfflineBundle;
    wasmOjContract: typeof WASM_OJ_CONTRACT_VERSION;
    lock: DependencyLock;
    payloads: Readonly<Record<string, Uint8Array>>;
}
interface ResolveDependencyOptions {
    offline?: boolean;
    previousLock?: DependencyLock;
    /** Required to use `previousLock` after a genuine network transport failure. */
    previousLockNetworkScope?: DependencyNetworkScope;
    networkAccess?: DependencyNetworkAccess;
}

interface ReplayRunOperation {
    kind: "run";
    config: RunConfig;
    expected: DeterministicTranscript;
    expectedSha256: string;
}
interface ReplayJudgeCaseTranscript {
    id: string;
    verdict: JudgeResult["cases"][number]["verdict"];
    message?: string;
    run?: DeterministicTranscript;
    interaction?: Omit<InteractiveRunResult, "durationMs">;
}
interface ReplayJudgeTranscript {
    verdict: JudgeResult["verdict"];
    completed: number;
    total: number;
    cases: ReplayJudgeCaseTranscript[];
    metrics: JudgeResult["metrics"];
}
interface ReplayJudgeOperation {
    kind: "judge";
    spec: JudgeSpec;
    expected: ReplayJudgeTranscript;
    expectedSha256: string;
}
type ReplayOperation = ReplayRunOperation | ReplayJudgeOperation;
interface ReplayBundle {
    schema: typeof WASM_OJ_SCHEMAS.replayBundle;
    wasmOjContract: typeof WASM_OJ_CONTRACT_VERSION;
    projectSha256: string;
    artifactSha256: string;
    project: Project;
    artifact: BuildArtifact;
    dependencies?: DependencyOfflineBundle;
    operation: ReplayOperation;
}
type ReplayBundleInput = {
    project: Project;
    artifact: BuildArtifact;
    dependencies?: DependencyOfflineBundle;
} & ({
    operation: {
        kind: "run";
        config: RunConfig;
        result: RunResult;
    };
} | {
    operation: {
        kind: "judge";
        spec: JudgeSpec;
        result: JudgeResult;
    };
});
interface ReplayHost {
    compileProject(project: Project, options?: {
        cache?: boolean;
    }): Promise<BuildResult>;
    run(artifact: BuildArtifact, config: RunConfig): Promise<RunResult>;
    judge(artifact: BuildArtifact, spec: JudgeSpec): Promise<JudgeResult>;
}
interface ReplayOptions {
    /** Rebuild sources and compare the stable artifact digest before execution. Defaults to true. */
    recompile?: boolean;
}
interface ReplayResult {
    compatible: boolean;
    mismatches: readonly string[];
    build?: BuildResult;
    run?: RunResult;
    judge?: JudgeResult;
}
interface ReplayDecodeOptions {
    maxBundleBytes?: number;
    maxManifestBytes?: number;
    maxBlobs?: number;
}
declare function createReplayBundle(input: ReplayBundleInput): Promise<ReplayBundle>;
declare function assertValidReplayBundle(value: unknown): Promise<void>;
declare function encodeReplayBundle(bundle: ReplayBundle): Promise<Uint8Array>;
declare function decodeReplayBundle(encoded: Uint8Array, options?: ReplayDecodeOptions): Promise<ReplayBundle>;
declare function replayBundleSha256(bundle: ReplayBundle): Promise<string>;
declare function replayBundle(host: ReplayHost, bundle: ReplayBundle, options?: ReplayOptions): Promise<ReplayResult>;
declare function judgeTranscript(result: JudgeResult): ReplayJudgeTranscript;

type OperationKind = "submission";
type OperationState = "queued" | "running" | "succeeded" | "failed" | "cancelled";
type OperationEventPayload = {
    type: "state";
    state: OperationState;
} | {
    type: "progress";
    progress: WorkerProgress;
} | {
    type: "stream";
    stream: "stdout" | "stderr";
    chunk: string;
} | {
    type: "build";
    success: boolean;
    cacheHit: boolean;
    diagnosticCount: number;
    artifact?: {
        id: string;
        kind: "wasm" | "runtime-bundle";
        size: number;
    };
} | {
    type: "case";
    caseId: string;
    verdict: JudgeCaseVerdict;
    message?: string;
    completed: number;
    total: number;
} | {
    type: "error";
    error: WasmOjErrorRecord;
};
type OperationEvent = OperationEventPayload & {
    operationId: string;
    sequence: number;
};
interface SubmissionRequest {
    id?: string;
    input: CompileInput;
    spec: JudgeSpec;
    compile?: CompileOptions;
    judge?: Omit<JudgeRunOptions, "onCase">;
    signal?: AbortSignal;
}
interface Operation<T> {
    readonly id: string;
    readonly kind: OperationKind;
    readonly signal: AbortSignal;
    readonly result: Promise<T>;
    state(): OperationState;
    cancel(reason?: string): void;
    onEvent(listener: (event: OperationEvent) => void): () => void;
}
type SubmissionOperation = Operation<JudgeProjectResult>;

type DependencyFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
/** A transport failure before an HTTP response exists; the only cache-fallback trigger. */
declare class DependencyNetworkError extends Error {
    constructor(hostname: string, options?: ErrorOptions);
}
interface DependencyResolverOptions {
    fetch?: DependencyFetch;
    networkAuthorizer?: DependencyNetworkAuthorizer;
    maxMetadataBytes?: number;
    maxPackageBytes?: number;
    maxUnpackedBytes?: number;
    concurrency?: number;
    cargoCrateBaseUrl?: string;
    pypiApiUrl?: string;
    goProxyUrl?: string;
}
interface ResolvedOptions {
    fetch: DependencyFetch;
    /** Only the platform Fetch contract may translate its specified TypeError network rejection. */
    classifyPlatformFetchRejections: boolean;
    networkAuthorizer?: DependencyNetworkAuthorizer;
    maxMetadataBytes: number;
    maxPackageBytes: number;
    maxUnpackedBytes: number;
    concurrency: number;
    cargoCrateBaseUrl: string;
    pypiApiUrl: string;
    goProxyUrl: string;
}
/**
 * Creates WASM-OJ's native-lockfile adapters. They consume exact versions and
 * ecosystem integrity data; they deliberately do not act as a second package solver.
 */
declare function createDefaultDependencyResolvers(options?: DependencyResolverOptions): readonly DependencyResolver[];
declare class CargoLockDependencyResolver implements DependencyResolver {
    readonly ecosystem: "cargo";
    private readonly options;
    constructor(options?: DependencyResolverOptions | ResolvedOptions);
    resolve(manifest: DependencyManifest, context: DependencyResolutionContext): Promise<ResolvedDependencyGraph>;
}
declare class NpmLockDependencyResolver implements DependencyResolver {
    readonly ecosystem: "npm";
    private readonly options;
    constructor(options?: DependencyResolverOptions | ResolvedOptions);
    resolve(manifest: DependencyManifest, context: DependencyResolutionContext): Promise<ResolvedDependencyGraph>;
}
declare class PyPiLockDependencyResolver implements DependencyResolver {
    readonly ecosystem: "pypi";
    private readonly options;
    constructor(options?: DependencyResolverOptions | ResolvedOptions);
    resolve(manifest: DependencyManifest, context: DependencyResolutionContext): Promise<ResolvedDependencyGraph>;
}
declare class GoLockDependencyResolver implements DependencyResolver {
    readonly ecosystem: "go";
    private readonly options;
    constructor(options?: DependencyResolverOptions | ResolvedOptions);
    resolve(manifest: DependencyManifest, context: DependencyResolutionContext): Promise<ResolvedDependencyGraph>;
}
interface CppDependencyLockSource {
    schema: typeof WASM_OJ_SCHEMAS.cppDependencyLock;
    roots: readonly string[];
    packages: readonly {
        name: string;
        version: string;
        url: string;
        sha256: string;
        dependencies?: readonly string[];
    }[];
}
declare class CppLockDependencyResolver implements DependencyResolver {
    readonly ecosystem: "cpp";
    private readonly options;
    constructor(options?: DependencyResolverOptions | ResolvedOptions);
    resolve(manifest: DependencyManifest, context: DependencyResolutionContext): Promise<ResolvedDependencyGraph>;
}
/** Implements Go's official `dirhash.HashZip` h1 checksum over module ZIP entries. */
declare function goModuleZipHash(payload: Uint8Array, maxUnpackedBytes?: number, maxFiles?: number): Promise<string>;

declare class MemoryDependencyCache implements DependencyCache {
    private readonly payloads;
    load(integritySha256: string): Promise<Uint8Array | undefined>;
    save(integritySha256: string, payload: Uint8Array): Promise<void>;
    delete(integritySha256: string): Promise<void>;
    clear(): Promise<void>;
}
/** Host-neutral dependency resolution, locking, cache, and offline transport. */
declare class DependencyManager {
    private readonly cache;
    private readonly resolvers;
    constructor(cache: DependencyCache, resolvers?: readonly DependencyResolver[]);
    registerResolver(resolver: DependencyResolver): void;
    resolve(manifest: DependencyManifest, options?: ResolveDependencyOptions): Promise<DependencyLock>;
    private resolveOnline;
    verifyCached(lock: DependencyLock): Promise<void>;
    clearCache(): Promise<void>;
    /** Returns package-ID keyed payloads after re-verifying the content-addressed cache. */
    materialize(lock: DependencyLock): Promise<ReadonlyMap<string, Uint8Array>>;
    /** Resolve cached archives into the verified, compiler-facing file-tree contract. */
    prepareBuild(lock: DependencyLock, adapters?: readonly DependencyBuildAdapter[]): Promise<DependencyBuildBundle>;
    exportOffline(lock: DependencyLock): Promise<DependencyOfflineBundle>;
    importOffline(bundle: DependencyOfflineBundle): Promise<DependencyLock>;
}
declare function createDefaultDependencyManager(cache: DependencyCache, options?: DependencyResolverOptions): DependencyManager;

interface EngineOptions {
    compiler: Compiler;
    runner: Runner;
    artifactStore?: ArtifactStore;
    judge?: JudgeEngineOptions;
    dependencyManager?: DependencyManager;
}
interface JudgeProjectResult {
    build: BuildResult$1;
    judge?: JudgeResult;
}
/** High-level compile/run API shared by browser and server hosts. */
declare class Engine {
    protected readonly compiler: Compiler;
    protected readonly runner: Runner;
    private readonly artifactStore?;
    private readonly dependencyManager?;
    private readonly compilation;
    private readonly operationScheduler;
    private readonly observationListeners;
    private disposed;
    private cacheClearActive;
    private cacheClearOperation?;
    /** Extensible judge registry for custom input providers and output matchers. */
    readonly judging: JudgeEngine;
    constructor(options: EngineOptions);
    ready(): Promise<void>;
    onProgress(listener: (progress: WorkerProgress) => void): () => void;
    onStream(listener: (stream: "stdout" | "stderr", chunk: string) => void): () => void;
    /** Subscribe to operation-scoped, structured host observations. */
    onObservation(listener: (event: OperationEvent) => void): () => void;
    /** Enqueue one independently observable and cancellable compile-and-judge submission. */
    submit(request: SubmissionRequest): SubmissionOperation;
    /** Resolve and cache one canonical dependency graph using this host's adapters. */
    resolveDependencies(manifest: DependencyManifest, options?: ResolveDependencyOptions): Promise<DependencyLock>;
    /** Materialize a lock into the archive-independent compiler input contract. */
    prepareDependencies(lock: DependencyLock, adapters?: readonly DependencyBuildAdapter[]): Promise<DependencyBuildBundle>;
    compile(input: CompileInput, options?: CompileOptions): Promise<BuildResult$1>;
    /** Compile an already-normalized Project without reconstructing its library identity. */
    compileProject(project: Project$1, options?: CompileOptions): Promise<BuildResult$1>;
    replay(bundle: ReplayBundle, options?: ReplayOptions): Promise<ReplayResult>;
    /** Compile during idle time; a matching foreground compile joins this exact request. */
    precompile(input: CompileInput): Promise<PrecompileOutcome>;
    /** Supersede only speculative work; a foreground build is never cancelled here. */
    supersedePrecompile(): void;
    run(artifact: BuildArtifact$1, options?: RunOptions): Promise<RunResult$1>;
    interact(contestant: BuildArtifact$1, interactor: BuildArtifact$1, options?: InteractiveOptions): Promise<InteractiveRunResult$1>;
    judge(artifact: BuildArtifact$1, spec: JudgeSpec, options?: JudgeRunOptions): Promise<JudgeResult>;
    judgeProject(input: CompileInput, spec: JudgeSpec, compile?: CompileOptions, judge?: JudgeRunOptions): Promise<JudgeProjectResult>;
    execute(input: CompileInput, run?: RunOptions, compile?: CompileOptions): Promise<ExecuteResult>;
    cancel(): void;
    restart(): void;
    clearCache(): Promise<void>;
    private clearCacheOperationInternal;
    dispose(): void;
    private assertActive;
    private assertAvailable;
    private cancelExecution;
    private executeSubmission;
    private notifyObservation;
}
declare function createEngine(options: EngineOptions): Promise<Engine>;

declare const WASM_OJ_LIBCXX_PCH_HEADER = "#pragma once\n#include <algorithm>\n#include <array>\n#include <bitset>\n#include <cassert>\n#include <cctype>\n#include <cerrno>\n#include <cfloat>\n#include <charconv>\n#include <chrono>\n#include <climits>\n#include <cmath>\n#include <compare>\n#include <concepts>\n#include <cstddef>\n#include <cstdint>\n#include <cstdio>\n#include <cstdlib>\n#include <cstring>\n#include <deque>\n#include <exception>\n#include <functional>\n#include <iomanip>\n#include <ios>\n#include <iostream>\n#include <iterator>\n#include <limits>\n#include <map>\n#include <memory>\n#include <numeric>\n#include <optional>\n#include <queue>\n#include <random>\n#include <ranges>\n#include <set>\n#include <span>\n#include <sstream>\n#include <stack>\n#include <string>\n#include <string_view>\n#include <tuple>\n#include <type_traits>\n#include <unordered_map>\n#include <unordered_set>\n#include <utility>\n#include <variant>\n#include <vector>\n";
type LibcxxPchProfile = "cpp-debug" | "cpp-release";
interface LibcxxPchAsset {
    path: string;
    byteLength: number;
    sha256: string;
    compressedByteLength: number;
    compressedSha256: string;
}
interface LibcxxPchManifest {
    schema: typeof WASM_OJ_SCHEMAS.clangLibcxxPch;
    version: typeof CLANG_VERSION;
    clangPackageSha256: typeof CLANG_PACKAGE_SHA256;
    clangPinsSha256: typeof CLANG_CC1_PINS_SHA256;
    header: typeof WASM_OJ_LIBCXX_PCH_HEADER;
    headerSha256: string;
    profiles: Readonly<Record<LibcxxPchProfile, LibcxxPchAsset>>;
}
declare function decodeLibcxxPchManifest(bytes: Uint8Array): Promise<LibcxxPchManifest>;
declare function isToolchainLibcxxPchHeader(contents: string): boolean;

interface CompilerRegistration {
    readonly languages: readonly Language$1[];
    readonly compiler: Compiler;
}
/**
 * Environment-neutral router for composing built-in and downstream compilers.
 *
 * Registration is frozen by the first lifecycle operation, keeping routing
 * deterministic for the lifetime of an engine and making each language owned
 * by exactly one compiler.
 */
declare class CompilerRegistry implements Compiler {
    private readonly routes;
    private readonly compilers;
    private readonly progressListeners;
    private readonly removeCompilerListeners;
    private initialization;
    private sealed;
    private disposed;
    private generation;
    constructor(registrations?: readonly CompilerRegistration[]);
    register(languages: readonly Language$1[], compiler: Compiler): this;
    languages(): Language$1[];
    cacheIdentity(project: Project$1): string;
    ready(): Promise<void>;
    build(project: Project$1, cacheKey: string): Promise<___core_types.BuildResult>;
    onProgress(listener: (progress: WorkerProgress) => void): () => void;
    clearToolchainCache(): Promise<void>;
    cancel(): void;
    restart(): void;
    dispose(): void;
    private assertActive;
    private compilerFor;
    private invalidateInitialization;
    private invokeCompilers;
}

interface RuntimeResolver {
    quickJs(): Promise<Uint8Array>;
    packageCommand(packageSpecifier: string, command: string): Promise<Uint8Array>;
    packageFileSystem(request: PackageFileSystemRequest): Promise<Record<string, Uint8Array>>;
}
interface PackageFileSystemRequest {
    packageSpecifier: string;
    command: string;
    args: string[];
    cacheKey: string;
    expectedSha256: string;
}
interface PreparedRunRequest {
    wasm: Uint8Array;
    args: string[];
    env: Record<string, string>;
    stdin: Uint8Array;
    files: Record<string, Uint8Array>;
    outputPaths: string[];
    cwd?: string;
    /** Fixed runtime-internal entropy prefix; it does not consume the caller-seeded stream. */
    startupEntropyBytes: number;
    cost: CostBudget;
    determinism: {
        randomSeed: number;
        realtimeEpochMs: number;
        clockStepNs: number;
    };
    resources: {
        instructionBudget: number;
        logicalTimeLimitMs: number;
        memoryLimitBytes: number;
        outputLimitBytes: number;
        filesystemWriteLimitBytes: number;
        filesystemEntryLimit: number;
    };
}
interface RuntimeDriver {
    readonly id: string;
    /** Declares that the prepared process consumes protocol input from fd 0 incrementally. */
    readonly interactive?: "streaming";
    supports(artifact: BuildArtifact$1): boolean;
    prepare(artifact: BuildArtifact$1, config: RunConfig$1, resolver: RuntimeResolver): Promise<PreparedRunRequest>;
}
declare class RuntimeDriverRegistry {
    private readonly drivers;
    private sealed;
    register(driver: RuntimeDriver): void;
    driver(artifact: BuildArtifact$1): RuntimeDriver;
}
declare function createDefaultRuntimeDrivers(costBaselines?: CostBaselineRegistry): RuntimeDriverRegistry;
declare function prepareArtifactRun(artifact: BuildArtifact$1, config: RunConfig$1, resolver: RuntimeResolver, registry?: RuntimeDriverRegistry): Promise<PreparedRunRequest>;
declare function prepareArtifactInteraction(artifact: BuildArtifact$1, config: RunConfig$1, resolver: RuntimeResolver, registry?: RuntimeDriverRegistry): Promise<PreparedRunRequest>;
/** Prepare a statically admitted judge command without fabricating compiler artifact metadata. */
declare function prepareTrustedJudgeRun(program: TrustedJudgeProgram, config: RunConfig$1, costBaselines?: CostBaselineRegistry): PreparedRunRequest;

declare const PROBLEM_LOCALES: readonly ["zh-TW", "en"];
type ProblemLocale = typeof PROBLEM_LOCALES[number];
type ProblemDifficulty = "easy" | "medium" | "hard";
type ProblemCaseKind = "sample" | "adversarial" | "regression";
type LocalizedText = Readonly<Record<ProblemLocale, string>>;
interface JudgeCase {
    readonly id: string;
    readonly kind: ProblemCaseKind;
    readonly input: string;
    readonly output: string;
}
interface ProblemPolicyLimits {
    readonly instructionBudget: number;
    readonly memoryLimitBytes: number;
    readonly logicalTimeLimitMs?: number;
}
interface ProblemScoringPolicy {
    readonly id: string;
    readonly title: LocalizedText;
    readonly points: number;
    readonly limits: ProblemPolicyLimits;
}
interface ProblemScoring {
    readonly maximumPoints: 100;
    readonly calibration: {
        readonly method: "wasm-oj-v2/compiled-average-optimal-rounded/v1";
        readonly profiles: Readonly<Record<string, string>>;
    };
    readonly policies: readonly ProblemScoringPolicy[];
    readonly safetyLimits: {
        readonly wallTimeLimitMs: number;
    };
}
interface ProblemComplexity {
    readonly name: LocalizedText;
    readonly time: string;
    readonly space: string;
    readonly accepted: boolean;
}
/**
 * Author-supplied source tree used to create a fresh draft. The entry must be
 * one of the exact file-map keys; consumers copy these bytes and never invent
 * source for a missing language.
 */
interface JudgeStarterTemplate {
    readonly entry: string;
    readonly files: Readonly<Record<string, string>>;
}
type JudgeStarterTemplates = Readonly<Record<BuiltinLanguage$1, JudgeStarterTemplate>>;
interface JudgeProblem {
    readonly id: string;
    readonly number: number;
    readonly title: LocalizedText;
    readonly trackId: string;
    readonly track: LocalizedText;
    readonly difficulty: ProblemDifficulty;
    readonly tags: readonly string[];
    readonly statement: LocalizedText;
    readonly editorial: LocalizedText;
    readonly starterTemplates: JudgeStarterTemplates;
    readonly judgeCases: readonly JudgeCase[];
    readonly scoring: ProblemScoring;
    readonly complexities: readonly ProblemComplexity[];
}
interface JudgeProblemSummary {
    readonly id: string;
    readonly number: number;
    readonly title: LocalizedText;
    readonly trackId: string;
    readonly track: LocalizedText;
    readonly difficulty: ProblemDifficulty;
    readonly tags: readonly string[];
    readonly caseCount: number;
}

declare const BROWSER_COLLECTION_SCHEMA = "wasm-oj-browser-collection-v5";
declare const BROWSER_PROBLEM_SCHEMA = "wasm-oj-browser-problem-v4";
declare const PROBLEM_STARTER_LIMITS: Readonly<{
    filesPerLanguage: 128;
    bytesPerFile: number;
    totalBytesPerLanguage: number;
}>;
interface ProblemBundleDescriptor {
    readonly path: string;
    readonly sha256: string;
    readonly bytes: number;
}
interface ProblemCollectionEntry extends JudgeProblemSummary {
    readonly statementPaths: LocalizedText;
    readonly bundle: ProblemBundleDescriptor;
}
interface ProblemCollectionIndex {
    readonly schema: typeof BROWSER_COLLECTION_SCHEMA;
    readonly problemSchema: typeof BROWSER_PROBLEM_SCHEMA;
    readonly revision: string;
    readonly localization: {
        readonly defaultLocale: "zh-TW";
        readonly supportedLocales: readonly ["zh-TW", "en"];
    };
    readonly problems: readonly ProblemCollectionEntry[];
}
declare function parseProblemCollectionIndex(value: unknown): ProblemCollectionIndex;
declare function parseProblemBundle(value: unknown, expected: ProblemCollectionEntry): JudgeProblem;
declare function parseStandaloneProblemBundle(value: unknown): JudgeProblem;
declare function verifyProblemBundleBytes(bytes: Uint8Array, entry: ProblemCollectionEntry): Promise<JudgeProblem>;
declare function problemCollectionRevision(index: Pick<ProblemCollectionIndex, "problems">): Promise<string>;
declare function verifyProblemCollectionRevision(index: ProblemCollectionIndex): Promise<void>;

declare const WASM_OJ_JUDGE_DATA_SCHEMA = "wasm-oj-v2/judge-data";
declare const POLICY_IDS: readonly ["baseline", "efficient", "optimal"];
declare const CALIBRATION_METHOD = "wasm-oj-v2/compiled-average-optimal-rounded/v1";
interface JudgeDataCase {
    readonly id: string;
    readonly input: string;
    readonly output: string;
}
interface JudgePolicy {
    readonly id: typeof POLICY_IDS[number];
    readonly points: number;
    readonly limits: ProblemPolicyLimits;
}
interface JudgeData {
    readonly schema: typeof WASM_OJ_JUDGE_DATA_SCHEMA;
    readonly cases: readonly JudgeDataCase[];
    readonly scoring: {
        readonly maximumPoints: 100;
        readonly calibration: {
            readonly method: typeof CALIBRATION_METHOD;
            readonly profiles: Readonly<Partial<Record<BuiltinLanguage, string>>>;
        };
        readonly policies: readonly JudgePolicy[];
        readonly safetyLimits: {
            readonly wallTimeLimitMs: number;
        };
    };
}
/** Derive only execution-significant data; statement, editorial, titles, and slug never enter the package digest. */
declare function deriveJudgeData(practice: JudgeProblem, allowedLanguages: readonly BuiltinLanguage[]): JudgeData;
/**
 * Bind an execution package to the public contract without requiring hidden
 * data to appear in the public bundle. Scoring/resources must match exactly,
 * and every published sample must be an exact case in the private package.
 */
declare function assertJudgeDataMatchesPracticePublic(judgeData: JudgeData, practice: JudgeProblem, allowedLanguages: readonly BuiltinLanguage[]): void;
declare function parseJudgeData(value: unknown, allowedLanguages: readonly BuiltinLanguage[]): JudgeData;

interface ScoredProblemCase {
    id: string;
    outputAccepted: boolean;
    metrics: ObservedCaseMetrics | null;
    policyEvaluations: readonly PolicyEvaluation[];
    passedPolicyIds: readonly string[];
    points: number;
}
interface ObservedCaseMetrics {
    cost: number | null;
    rawCost: number | null;
    baselineCost: number;
    memoryBytes: number | null;
    logicalTimeNs: number | null;
}
interface PolicyEvaluation {
    id: string;
    points: number;
    costPassed: boolean;
    memoryPassed: boolean;
    logicalTimePassed: boolean | null;
    resourcePassed: boolean;
    earned: boolean;
}
interface ProblemScore {
    numerator: number;
    denominator: number;
    points: number;
    maximumPoints: number;
    cases: readonly ScoredProblemCase[];
    passedByPolicy: Readonly<Record<string, number>>;
}
declare const PERFORMANCE_POLICY_IDS: readonly ["baseline", "efficient", "optimal"];
type PerformancePolicyId = (typeof PERFORMANCE_POLICY_IDS)[number];
interface PolicyPerformanceAggregate {
    readonly id: PerformancePolicyId;
    readonly earnedCases: number;
    readonly costExceededCases: number;
    readonly memoryExceededCases: number;
    readonly logicalTimeExceededCases: number;
}
interface SubmissionPolicySummary {
    readonly totalCases: number;
    readonly outputAcceptedCases: number;
    readonly policies: readonly PolicyPerformanceAggregate[];
}
/**
 * Collapse case-level judge details into the only policy data allowed to cross
 * the container boundary. Resource failures are counted only after output
 * acceptance, so an output error is never mislabeled as an efficiency error.
 */
declare function summarizeProblemPolicies(score: ProblemScore): SubmissionPolicySummary;
declare function assertProblemCostProfile(problem: JudgeProblem, language: BuiltinLanguage$1, costProfile: string): void;
declare function assertJudgeDataCostProfile(data: JudgeData, language: BuiltinLanguage$1, costProfile: string): void;
declare function scoreProblemResults(problem: JudgeProblem, language: BuiltinLanguage$1, results: readonly JudgeCaseResult[]): ProblemScore;
/** Score immutable execution-only judge data without reconstructing a public problem bundle. */
declare function scoreJudgeDataResults(data: JudgeData, language: BuiltinLanguage$1, results: readonly JudgeCaseResult[]): ProblemScore;

declare const CONTEST_PUBLIC_PROJECTION_SCHEMA = "wasm-oj-platform/contest-public-problem-projection/v1";
interface ContestPublicProjection {
    readonly schema: typeof CONTEST_PUBLIC_PROJECTION_SCHEMA;
    readonly problem: JudgeProblem;
}
/**
 * The repository practice bundle is safe to fetch for every practice visitor.
 * Hidden cases and their expected answers exist only in the immutable judge
 * package built from the authoring source.
 */
declare function derivePracticePublic(authored: JudgeProblem): JudgeProblem;
/** The single deterministic hidden-data redaction used by author CI and platform validation. */
declare function deriveContestPublic(practice: JudgeProblem): JudgeProblem;
declare function createContestPublicProjection(practice: JudgeProblem): ContestPublicProjection;
declare function contestPublicProjectionBytes(practice: JudgeProblem): Uint8Array;

interface JudgeAllowedProfile {
    readonly target: "wasip1" | "wasix";
    readonly optimization: "debug" | "release";
}
type JudgeAllowedProfiles = Readonly<Partial<Record<BuiltinLanguage, JudgeAllowedProfile>>>;
declare function parseJudgeAllowedProfiles(value: unknown, label?: string): JudgeAllowedProfiles;

declare const WASM_OJ_JUDGE_PACKAGE_SCHEMA = "wasm-oj-v2/judge-package";
declare const WASM_OJ_JUDGE_PACKAGE_MAGIC = "WOJJDG02";
declare const WASM_OJ_JUDGE_PACKAGE_MAX_BYTES: number;
interface JudgePackageBlobReference {
    readonly bytes: number;
    readonly sha256: string;
}
interface JudgePackageAssetReference extends JudgePackageBlobReference {
    readonly guestPath: string;
}
type JudgePackageAllowedProfile = JudgeAllowedProfile;
type JudgePackageManifestJudge = {
    readonly kind: "text";
} | {
    readonly kind: "checker";
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly artifact: JudgePackageBlobReference;
    readonly assets: readonly JudgePackageAssetReference[];
    readonly args: readonly string[];
} | {
    readonly kind: "interactive";
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly artifact: JudgePackageBlobReference;
    readonly assets: readonly JudgePackageAssetReference[];
    readonly args: readonly string[];
    readonly inputPath: string;
};
interface JudgePackageManifest {
    readonly schema: typeof WASM_OJ_JUDGE_PACKAGE_SCHEMA;
    readonly wasmOjContract: typeof WASM_OJ_CONTRACT_VERSION;
    readonly judgeData: JudgePackageBlobReference;
    readonly allowedProfiles: JudgeAllowedProfiles;
    readonly judge: JudgePackageManifestJudge;
}
interface JudgePackageAssetInput {
    readonly guestPath: string;
    readonly contents: Uint8Array;
}
type JudgePackageInputJudge = {
    readonly kind: "text";
} | {
    readonly kind: "checker";
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly artifact: Uint8Array;
    readonly assets: readonly JudgePackageAssetInput[];
    readonly args: readonly string[];
} | {
    readonly kind: "interactive";
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly artifact: Uint8Array;
    readonly assets: readonly JudgePackageAssetInput[];
    readonly args: readonly string[];
    readonly inputPath: string;
};
interface JudgePackageInput {
    readonly judgeData: JudgeData;
    readonly allowedProfiles: JudgeAllowedProfiles;
    readonly judge: JudgePackageInputJudge;
}
interface EncodedJudgePackage {
    readonly bytes: Uint8Array;
    readonly manifest: JudgePackageManifest;
    readonly executionSemanticSha256: string;
}
type JudgePackageByteSource = Uint8Array | ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>;
interface ValidateJudgePackageOptions {
    readonly expectedBytes?: number;
    readonly expectedSha256?: string;
    readonly memoryLimitBytes?: number;
}
interface ValidatedJudgePackage {
    readonly manifest: JudgePackageManifest;
    readonly judgeData: JudgeData;
    readonly bytes: number;
    readonly executionSemanticSha256: string;
}
interface TrustedJudgeAsset {
    readonly guestPath: string;
    readonly bytes: Uint8Array;
}
type TrustedJudgeExecutable = {
    readonly kind: "text";
} | {
    readonly kind: "checker";
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly artifact: Uint8Array;
    readonly assets: readonly TrustedJudgeAsset[];
    readonly args: readonly string[];
} | {
    readonly kind: "interactive";
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
    readonly artifact: Uint8Array;
    readonly assets: readonly TrustedJudgeAsset[];
    readonly args: readonly string[];
    readonly inputPath: string;
};
interface DecodedJudgePackageForExecution extends ValidatedJudgePackage {
    readonly allowedProfiles: JudgePackageManifest["allowedProfiles"];
    readonly judge: TrustedJudgeExecutable;
}
declare function parseJudgePackageManifest(value: unknown): JudgePackageManifest;
/** Author-side deterministic package builder. It never executes the trusted module. */
declare function encodeJudgePackage(input: JudgePackageInput): Promise<EncodedJudgePackage>;
/** Read only the bounded canonical manifest from complete package bytes. */
declare function readJudgePackageManifest(bytes: Uint8Array): JudgePackageManifest;
/**
 * Stream-validates one package while retaining at most the manifest and one
 * bounded blob. This is the Worker-facing admission API used before R2 publish.
 */
declare function validateJudgePackage(source: JudgePackageByteSource, options?: ValidateJudgePackageOptions): Promise<ValidatedJudgePackage>;
/** Decode a fully verified package into the exact trusted executable contract consumed by the container runtime. */
declare function decodeJudgePackageForExecution(bytes: Uint8Array): Promise<DecodedJudgePackageForExecution>;
/** Execution identity is the digest of the exact canonical WOJJDG02 bytes. */
declare function judgePackageSemanticDigest(bytes: Uint8Array): Promise<string>;

declare const REPOSITORY_AUTHORING_JUDGES_SCHEMA = "wasm-oj-platform/repository-authoring-judges/v1";
interface RepositorySourceObject {
    readonly path: string;
    readonly bytes: number;
    readonly sha256: string;
}
interface RepositorySourceArtifact extends RepositorySourceObject {
    readonly runtimeProfile: TrustedJudgeRuntimeProfile;
}
interface RepositorySourceAsset extends RepositorySourceObject {
    readonly guestPath: string;
}
type RepositorySourceJudge = {
    readonly kind: "text";
} | {
    readonly kind: "checker";
    readonly artifact: RepositorySourceArtifact;
    readonly assets: readonly RepositorySourceAsset[];
    readonly args: readonly string[];
} | {
    readonly kind: "interactive";
    readonly artifact: RepositorySourceArtifact;
    readonly assets: readonly RepositorySourceAsset[];
    readonly args: readonly string[];
    readonly inputPath: string;
};
interface RepositoryAuthoringJudgeProblem {
    readonly slug: string;
    readonly allowedProfiles: JudgeAllowedProfiles;
    readonly judge: RepositorySourceJudge;
}
interface RepositoryAuthoringJudges {
    readonly schema: typeof REPOSITORY_AUTHORING_JUDGES_SCHEMA;
    readonly problems: readonly RepositoryAuthoringJudgeProblem[];
}
/** Author-only input used by collection build; never accepted by the platform sync boundary. */
declare function parseRepositoryAuthoringJudges(value: unknown): RepositoryAuthoringJudges;

/** Build the runtime judge spec directly from verified WOJJDG02 execution data. */
declare function trustedJudgeSpec(data: JudgeData, executable: TrustedJudgeExecutable): JudgeSpec;

interface DependencyNetworkConsentPrompt {
    (access: DependencyNetworkAccess): Promise<boolean>;
}
interface DependencyConsentStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/**
 * Browser consent authorizer isolated by repository source, immutable bundle,
 * and the complete requested host set. A newly introduced host always prompts.
 */
declare class BrowserDependencyNetworkConsent implements DependencyNetworkAuthorizer {
    #private;
    constructor(storage: DependencyConsentStorage, prompt: DependencyNetworkConsentPrompt, now?: () => Date);
    authorize(rawAccess: DependencyNetworkAccess): Promise<void>;
    revoke(sourceKey: string, bundleDigest: string): Promise<void>;
}
declare function normalizeDependencyNetworkAccess(access: DependencyNetworkAccess): DependencyNetworkAccess;
declare function normalizeDependencyNetworkScope(scope: DependencyNetworkScope): DependencyNetworkScope;

declare const DEFAULT_CONFORMANCE_CASES: readonly ConformanceCase[];
/**
 * Slower header-heavy case that verifies the bundled libc++ headers and libraries.
 * It is opt-in because parsing libc++ inside the WebAssembly Clang frontend is a
 * materially different efficiency benchmark from basic language conformance.
 */
declare const CPP_STDLIB_CONFORMANCE_CASE: ConformanceCase;
declare const FULL_CONFORMANCE_CASES: readonly ConformanceCase[];

export { BROWSER_COLLECTION_SCHEMA, BROWSER_PROBLEM_SCHEMA, BrowserDependencyNetworkConsent, CONTEST_PUBLIC_PROJECTION_SCHEMA, CPP_STDLIB_CONFORMANCE_CASE, CargoLockDependencyResolver, CompilerRegistry, CostBaselineRegistry, CppLockDependencyResolver, DEFAULT_CONFORMANCE_CASES, DEFAULT_DETERMINISM, DEFAULT_RESOURCE_POLICY, DEPENDENCY_BUILD_LIMITS, DependencyManager, DependencyNetworkError, Engine, FULL_CONFORMANCE_CASES, GoLockDependencyResolver, JudgeEngine, MemoryDependencyCache, NpmLockDependencyResolver, PROBLEM_STARTER_LIMITS, PROJECT_SOURCE_LIMITS, PyPiLockDependencyResolver, REPOSITORY_AUTHORING_JUDGES_SCHEMA, RuntimeDriverRegistry, TRUSTED_JUDGE_RUNTIME_PROFILES, TRUSTED_JUDGE_WASIP1_IMPORTS, TRUSTED_JUDGE_WASM_MAX_BYTES, WASM_OJ_JUDGE_DATA_SCHEMA, WASM_OJ_JUDGE_PACKAGE_MAGIC, WASM_OJ_JUDGE_PACKAGE_MAX_BYTES, WASM_OJ_JUDGE_PACKAGE_SCHEMA, WASM_OJ_LIBCXX_PCH_HEADER, WASM_OJ_RUNTIME_COMPONENTS, WASM_OJ_RUNTIME_IDENTITY_SHA256, WEIGHTED_METER_MODEL, assertCompilerCacheKey, assertJudgeDataCostProfile, assertJudgeDataMatchesPracticePublic, assertJudgeGuestFilePath, assertProblemCostProfile, assertValidBuildArtifact, assertValidDependencyBuildBundle, assertValidDependencyLock, assertValidProject, assertValidReplayBundle, browserToolchainAssetBaseUrl, browserToolchainAssetPaths, browserToolchainAssetUrl, canonicalJsonBytes, compareConformanceSnapshots, contestPublicProjectionBytes, costProfileId, createContestPublicProjection, createDefaultCostBaselineRegistry, createDefaultDependencyBuildAdapters, createDefaultDependencyManager, createDefaultDependencyResolvers, createDefaultRuntimeDrivers, createDependencyBuildBundle, createDependencyLock, createEngine, createExtendedCostBaselineRegistry, createJudgeExecutor, createReplayBundle, createRuntimeBundleManifest, createSdkProject, decodeJudgePackageForExecution, decodeLibcxxPchManifest, decodeReplayBundle, dependencyFileTreeSha256, dependencyLockSha256, dependencyManifestSha256, deriveContestPublic, deriveJudgeData, derivePracticePublic, deterministicTranscript, encodeJudgePackage, encodeReplayBundle, fileMatcher, floatMatcher, goModuleZipHash, isCostProfileFor, isToolchainLibcxxPchHeader, judgePackageSemanticDigest, judgeTranscript, normalizeDependencyNetworkAccess, normalizeDependencyNetworkScope, normalizeExecutionMetrics, normalizeOutput, parseCanonicalJsonBytes, parseJudgeAllowedProfiles, parseJudgeData, parseJudgePackageManifest, parseProblemBundle, parseProblemCollectionIndex, parseRepositoryAuthoringJudges, parseStandaloneProblemBundle, prepareArtifactInteraction, prepareArtifactRun, prepareTrustedJudgeRun, problemCollectionRevision, readJudgePackageManifest, replayBundle, replayBundleSha256, resolveArtifactCostBudget, resolveCostBudget, resolveDeterminism, resolveResourcePolicy, runConformanceHost, runConformanceMatrix, runtimeIdentityBytes, scoreJudgeDataResults, scoreProblemResults, setMatcher, sha256Matcher, snapshotBrowserToolchainSources, summarizeProblemPolicies, textMatcher, tokenMatcher, toolchainAssetSource, toolchainCacheIdentity, toolchainProfileSource, trustedJudgeSpec, unavailableExecutionMetrics, validateBrowserToolchainSources, validateJudgePackage, validateJudgeSpec, validateServerToolchainSources, validateToolchainDescriptors, validateTrustedJudgeWasm, verifyDependencyBuildBundle, verifyProblemBundleBytes, verifyProblemCollectionRevision, verifyRuntimeIdentity, wasmCheckerMatcher };
export type { ArtifactBuildExpectation, ArtifactStore, BatchJudgeCaseSpec, BrowserToolchainAssetSelection, CanonicalJsonValue, CompileInput, CompileOptions, Compiler, CompilerRegistration, ConformanceCase, ConformanceHost, ConformanceMismatch, ConformanceOptions, ConformanceReport, ConformanceRunExpectation, ConformanceSample, ConformanceSnapshot, ContestPublicProjection, CostBudget, CppDependencyLockSource, DecodedJudgePackageForExecution, DependencyBuildAdapter, DependencyBuildBundle, DependencyCache, DependencyConsentStorage, DependencyEcosystem, DependencyFetch, DependencyLock, DependencyManifest, DependencyNetworkAccess, DependencyNetworkAuthorizer, DependencyNetworkConsentPrompt, DependencyNetworkScope, DependencyOfflineBundle, DependencyRequirement, DependencyResolutionContext, DependencyResolver, DependencyResolverOptions, DependencySourceFile, DeterministicTranscript, EncodedJudgePackage, EngineOptions, ExecuteResult, InteractiveExecuteResult, InteractiveJudgeCaseSpec, InteractiveOptions, InteractiveProgramOptions, JudgeAllowedProfile, JudgeAllowedProfiles, JudgeCaseResult, JudgeCaseSpec, JudgeCaseVerdict, JudgeData, JudgeDataCase, JudgeEngineOptions, JudgeExecutionAdapter, JudgeExecutor, JudgeFileInputSpec, JudgeInputProvider, JudgeInputSpec, JudgeMatchResult, JudgeMatcher, JudgeMatcherContext, JudgeMatcherSpec, JudgePackageAllowedProfile, JudgePackageAssetInput, JudgePackageAssetReference, JudgePackageBlobReference, JudgePackageByteSource, JudgePackageInput, JudgePackageInputJudge, JudgePackageManifest, JudgePackageManifestJudge, JudgePolicy, JudgeProblem, JudgeProgramSpec, JudgeProjectResult, JudgeResolvedInput, JudgeResult, JudgeRunOptions, JudgeSpec, JudgeStarterTemplate, JudgeStarterTemplates, LibcxxPchAsset, LibcxxPchManifest, LibcxxPchProfile, LockedDependencyPackage, MaterializedDependencyPackage, Operation, OperationEvent, OperationEventPayload, OperationKind, OperationState, OutputNormalization, PackageFileSystemRequest, PolicyPerformanceAggregate, PrecompileOutcome, PrecompileStatus, PreparedRunRequest, ProblemBundleDescriptor, ProblemCollectionEntry, ProblemCollectionIndex, ProblemScore, RawExecutionMetrics, ReplayBundle, ReplayBundleInput, ReplayDecodeOptions, ReplayHost, ReplayJudgeCaseTranscript, ReplayJudgeOperation, ReplayJudgeTranscript, ReplayOperation, ReplayOptions, ReplayResult, ReplayRunOperation, RepositoryAuthoringJudgeProblem, RepositoryAuthoringJudges, RepositorySourceArtifact, RepositorySourceAsset, RepositorySourceJudge, RepositorySourceObject, ResolveDependencyOptions, ResolvedDependencyGraph, RunOptions, Runner, RuntimeDriver, RuntimeResolver, ScoredProblemCase, SubmissionOperation, SubmissionPolicySummary, SubmissionRequest, TrustedJudgeAsset, TrustedJudgeExecutable, TrustedJudgeProgram, TrustedJudgeRuntimeProfile, TrustedJudgeWasmInfo, TrustedJudgeWasmValidationOptions, ValidateJudgePackageOptions, ValidatedJudgePackage };
