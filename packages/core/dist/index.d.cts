/**
 * @file LifecycleManager.ts
 * @description Explicit, deterministic lifecycle state machine for services.
 */
type ServiceStatus = 'uninitialized' | 'initializing' | 'ready' | 'starting' | 'running' | 'stopping' | 'stopped';
declare class LifecycleManager {
    private status;
    getStatus(): ServiceStatus;
    canTransitionTo(next: ServiceStatus): boolean;
    transitionTo(next: ServiceStatus): void;
    setStatus(next: ServiceStatus): void;
    assertRunning(serviceName: string): void;
}

/**
 * @file ServiceContract.ts
 * @description Canonical service contracts for the KrnlTS Service Kernel.
 * Invariant: local and remote services share the same IService contract.
 */

type ProtocolType = 'http' | 'https' | 'ws' | 'wss' | 'udp' | 'p2p' | 'signaling' | 'memory';
interface OperationContext {
    caller?: string;
    callerPort?: number;
    accessKey?: string;
    metadata?: Record<string, unknown>;
    protocol?: ProtocolType;
    correlationId?: string;
    idempotencyKey?: string;
}
interface OperationContract<TInput = unknown, TOutput = unknown> {
    id: string;
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    capabilities?: string[];
    protocols?: ProtocolType[];
    handler: (input: TInput, context: OperationContext) => Promise<TOutput> | TOutput;
}
interface StateContract<TState = Record<string, unknown>> {
    initial: TState;
    schema?: Record<string, unknown>;
}
interface EventContract<TPayload = unknown> {
    name: string;
    description?: string;
    payloadSchema?: Record<string, unknown>;
    marker?: TPayload;
}
interface LifecycleContract {
    onInit?: () => Promise<void> | void;
    onStart?: () => Promise<void> | void;
    onStop?: () => Promise<void> | void;
    onDispose?: () => Promise<void> | void;
}
interface DependencyContract {
    serviceId: string;
    versionRange?: string;
    requiredCapabilities?: string[];
    preferredProtocols?: ProtocolType[];
    optional?: boolean;
}
interface ServiceCapability {
    id: string;
    name: string;
    protocols: ProtocolType[];
    metadata?: Record<string, unknown>;
}
interface EndpointDescriptor {
    protocol: ProtocolType;
    address: string;
    port?: number;
    path?: string;
    channel?: string;
    capabilities: string[];
}
interface ServiceDefinition<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    name: string;
    version: string;
    inputs?: Record<string, Record<string, unknown>>;
    outputs?: Record<string, Record<string, unknown>>;
    operations: Record<string, OperationContract<any, any>>;
    state?: StateContract<TState>;
    events?: Record<keyof TEvents & string, EventContract<any>>;
    lifecycle?: LifecycleContract;
    dependencies?: DependencyContract[];
    capabilities?: ServiceCapability[];
    protocols?: ProtocolType[];
}
interface IService<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
    getStatus(): ServiceStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    getDefinition(): ServiceDefinition<TState, TEvents>;
}

/**
 * @file ServiceInstance.ts
 * @description Concrete service implementation in KrnlTS.
 */

declare class ServiceInstance<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> implements IService<TState, TEvents> {
    private readonly definition;
    readonly id: string;
    readonly name: string;
    readonly version: string;
    private stateStore?;
    private readonly eventBus;
    private readonly lifecycle;
    private initialized;
    private disposed;
    constructor(definition: ServiceDefinition<TState, TEvents>);
    getDefinition(): ServiceDefinition<TState, TEvents>;
    getStatus(): ReturnType<LifecycleManager['getStatus']>;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
}

/**
 * @file ProtocolAdapter.ts
 * @description Standard ProtocolAdapter interface and envelope abstractions.
 */

interface ProtocolCapabilities {
    requestResponse: boolean;
    streaming: boolean;
    pubSub: boolean;
    datagram: boolean;
    peerToPeer: boolean;
    signaling: boolean;
    discovery: boolean;
}
interface ProtocolEnvelope<TPayload = unknown> {
    id: string;
    type: 'request' | 'response' | 'event' | 'signal' | 'heartbeat';
    operation?: string;
    payload?: TPayload;
    error?: string;
    correlationId?: string;
    timestamp: number;
}
interface Connection {
    readonly id: string;
    readonly protocol: ProtocolType;
    send(envelope: ProtocolEnvelope): Promise<void>;
    close(): Promise<void>;
}
interface ProtocolAdapter {
    readonly protocol: ProtocolType;
    readonly capabilities: ProtocolCapabilities;
    listen?(port: number, host?: string): Promise<EndpointDescriptor>;
    connect?(endpoint: EndpointDescriptor): Promise<Connection>;
    expose?(service: IService, port?: number): Promise<EndpointDescriptor>;
    stop?(): Promise<void>;
    send?(target: EndpointDescriptor | Connection, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
    receive?(handler: (envelope: ProtocolEnvelope, ctx?: OperationContext) => Promise<ProtocolEnvelope | void>): () => void;
}

/**
 * @file ServiceProxy.ts
 * @description Transparent client proxy for the remote service contract.
 *
 * Lifecycle is local client lifecycle. Remote execution remains transport-mediated.
 * State and event methods are local cache/subscription semantics.
 */

declare class ServiceProxy<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> implements IService<TState, TEvents> {
    private readonly definition;
    private readonly adapter;
    private readonly endpoint;
    readonly id: string;
    readonly name: string;
    readonly version: string;
    private stateCache;
    private readonly eventHandlers;
    private readonly lifecycle;
    private disposed;
    constructor(definition: ServiceDefinition<TState, TEvents>, adapter: ProtocolAdapter, endpoint: EndpointDescriptor);
    getDefinition(): ServiceDefinition<TState, TEvents>;
    getStatus(): ReturnType<LifecycleManager['getStatus']>;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
}

/**
 * @file ServiceGenerators.ts
 * @description Validated factory generators for services and definitions.
 */

declare function validateServiceDefinition<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>): ServiceDefinition<TState, TEvents>;
declare function createServiceDefinition<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>): ServiceDefinition<TState, TEvents>;
declare function createService<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>): ServiceInstance<TState, TEvents>;
declare function createServiceProxy<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>, adapter: ProtocolAdapter, endpoint: EndpointDescriptor): IService<TState, TEvents>;

/**
 * @file model.ts
 * @description Canonical Isomorphic Orchestration Model.
 * Provides unified schema and invariants for FunctionalityOrchestration (KrnlTS)
 * and ServiceOrchestration (Skipo).
 */
type StepType = 'task' | 'sequential' | 'parallel' | 'branch' | 'conditional' | 'fanOut' | 'fanIn' | 'diamond' | 'delay' | 'nested';
type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'SKIPPED' | 'TIMED_OUT';
type StepExecutionStatus = StepStatus;
type OrchestrationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';
interface StepRetryPolicy {
    readonly maxAttempts: number;
    readonly backoff?: 'linear' | 'exponential';
    readonly backoffMs?: number;
    readonly maxBackoffMs?: number;
    readonly jitter?: boolean;
    readonly retryOnErrors?: string[];
    readonly backoffMultiplier?: number;
    readonly initialDelayMs?: number;
}
interface StepTimeoutPolicy {
    readonly timeoutMs: number;
}
interface StepCompensation<TContext = OrchestrationContext> {
    readonly name?: string;
    readonly handler?: (context: TContext) => Promise<void>;
    readonly target?: string;
    readonly operation?: string;
}
type SagaCompensationHandler<TOutput = unknown> = (output: TOutput, context: OrchestrationContext) => Promise<void>;
type StepCondition<TContext = OrchestrationContext> = (context: TContext) => boolean | Promise<boolean>;
interface OrchestrationStep<TInput = unknown, TOutput = unknown> {
    readonly id: string;
    readonly name: string;
    readonly type: StepType;
    readonly target?: string;
    readonly operation?: string;
    readonly dependsOn?: readonly string[];
    readonly handler?: (input: TInput, context: OrchestrationContext) => Promise<TOutput>;
    readonly condition?: StepCondition;
    readonly thenStepId?: string;
    readonly elseStepId?: string;
    readonly parallelStepIds?: readonly string[];
    readonly getItems?: (context: OrchestrationContext) => unknown[] | Promise<unknown[]>;
    readonly concurrency?: number;
    readonly retryPolicy?: StepRetryPolicy;
    readonly timeoutPolicy?: StepTimeoutPolicy;
    readonly compensation?: StepCompensation;
    readonly catchHandler?: (error: Error, context: OrchestrationContext) => Promise<TOutput>;
    readonly nestedOrchestrationId?: string;
}
interface OrchestrationDescriptor {
    readonly id: string;
    readonly name?: string;
    readonly version?: string;
    readonly description?: string;
    readonly timeoutMs?: number;
    readonly concurrency?: number;
    readonly scope?: 'functionality' | 'service';
}
interface OrchestrationContext {
    readonly correlationId: string;
    readonly parentCorrelationId?: string;
    readonly orchestrationId: string;
    readonly executionId: string;
    readonly idempotencyKey?: string;
    readonly scope: 'functionality' | 'service';
    readonly serviceId?: string;
    readonly results: Record<string, unknown>;
    readonly metadata: Record<string, unknown>;
    readonly timestamp: number;
    isCancelled: boolean;
    abortSignal?: AbortSignal;
}
interface StepExecutionResult<T = unknown> {
    readonly stepId: string;
    readonly status: StepStatus;
    readonly attempts: number;
    readonly output?: T;
    readonly error?: string;
    readonly startedAt: number;
    readonly completedAt: number;
}
interface OrchestrationResult<T = unknown> {
    readonly orchestrationId: string;
    readonly correlationId: string;
    readonly status: OrchestrationStatus;
    readonly output?: T;
    readonly stepResults: Record<string, StepExecutionResult>;
    readonly error?: string;
    readonly startedAt: number;
    readonly completedAt: number;
    readonly executionMetadata: Record<string, unknown>;
}
interface DAGValidationResult {
    readonly valid: boolean;
    readonly order: readonly string[];
    readonly errors: readonly string[];
}
/**
 * Validates DAG structure: checks for existence, circular dependencies, and returns topological order.
 */
declare function validateOrchestrationDAG(steps: readonly OrchestrationStep[]): DAGValidationResult;

/**
 * @file FunctionalityOrchestration.ts
 * @description Canonical FunctionalityOrchestration for KrnlTS services.
 * Strictly scopes orchestration to functionalities belonging to ONE service.
 * Conforms to L1 (Plane Isolation) & Invariant: A service never orchestrates independent services.
 */

interface FunctionalityFlowStep {
    readonly id: string;
    readonly type: 'functionality' | 'functionalityOrchestration';
    readonly target: string;
    readonly flow?: string;
    readonly dependsOn?: readonly string[];
    readonly retryPolicy?: StepRetryPolicy;
    readonly timeoutPolicy?: StepTimeoutPolicy;
}
interface FunctionalityFlow {
    readonly name: string;
    readonly steps: FunctionalityFlowStep[];
    visibility: 'public' | 'private' | 'internal';
    thenFunctionality(funcName: string, options?: {
        retry?: StepRetryPolicy;
        timeoutMs?: number;
        dependsOn?: string[];
    }): FunctionalityFlow;
    thenFunctionalityOrchestration(childOrchestrationName: string, flowName?: string): FunctionalityFlow;
    register(options?: {
        visibility?: 'public' | 'private' | 'internal';
    }): FunctionalityFlow;
}
interface FunctionalityStepOptions {
    id?: string;
    dependsOn?: string[];
    retry?: StepRetryPolicy;
    timeoutMs?: number;
    compensation?: string;
    catchHandler?: (err: Error, ctx: OrchestrationContext) => Promise<any>;
}
/**
 * FunctionalityOrchestration
 * Composes functionalities belonging strictly to ONE service into a deterministic DAG workflow.
 */
declare class FunctionalityOrchestration {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly timeoutMs?: number;
    readonly scope: 'functionality';
    private readonly steps;
    private readonly flows;
    constructor(descriptor: OrchestrationDescriptor);
    /**
     * Adds a sequential functionality step to the DAG.
     */
    thenFunctionality(funcName: string, options?: FunctionalityStepOptions): this;
    /**
     * Adds parallel functionality steps to the DAG.
     */
    parallel(name: string, functionalityNames: readonly string[], options?: {
        dependsOn?: string[];
    }): this;
    /**
     * Adds conditional branching to the DAG.
     */
    branch(name: string, condition: StepCondition, thenFunc: string, elseFunc?: string, options?: {
        dependsOn?: string[];
    }): this;
    /**
     * Adds fan-out step processing items through a functionality.
     */
    fanOut(name: string, funcName: string, getItems: (ctx: OrchestrationContext) => unknown[] | Promise<unknown[]>, options?: {
        dependsOn?: string[];
        concurrency?: number;
    }): this;
    /**
     * Nested orchestration: Invokes a child FunctionalityOrchestration within the same service boundary.
     */
    thenFunctionalityOrchestration(childOrchId: string, options?: FunctionalityStepOptions): this;
    getSteps(): readonly OrchestrationStep[];
    /**
     * Named flow builder interface.
     */
    flow(name: string): FunctionalityFlow;
    getFlow(name: string): FunctionalityFlow | undefined;
    listFlows(): FunctionalityFlow[];
    clearFlows(): void;
    private assertServiceBoundary;
}

/**
 * @file WorkerExecutionBoundary.ts
 * @description Worker Execution Boundary mediating all job execution from BullMQ workers
 * to service functionalities and orchestrations.
 * Enforces worker context invariants (no synchronous/unmediated direct execution).
 */
interface ExecutionContext {
    readonly isWorkerContext: boolean;
    readonly workerId: string;
    readonly timestamp: number;
    readonly correlationId?: string;
    readonly metadata?: Record<string, unknown>;
}
interface BackendCommand<TPayload = unknown> {
    readonly id: string;
    readonly type: string;
    readonly payload: TPayload;
    readonly correlationId: string;
    readonly idempotencyKey?: string;
    readonly createdAt: number;
}
interface NormalizedResult<T = unknown> {
    readonly correlationId: string;
    readonly status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
    readonly data?: T;
    readonly error?: string;
    readonly executionTimestamp: number;
}
declare class WorkerExecutionBoundary {
    readonly workerId: string;
    private readonly handler?;
    constructor(workerId: string, handler?: ((command: BackendCommand<any>, context: ExecutionContext) => Promise<NormalizedResult<any>>) | undefined);
    processJob<T = unknown>(command: BackendCommand<any>, metadata?: Record<string, unknown>): Promise<NormalizedResult<T>>;
    static assertWorkerContext(context?: ExecutionContext): void;
}

/**
 * @file BullMQExecutionEngine.ts
 * @description Canonical BullMQ Execution Engine for both KrnlTS and Skipo.
 * Implements isomorphic DAG execution, sequential/parallel steps, retries with backoff,
 * timeouts, compensation/saga rollback, branching, fan-out/fan-in, and idempotency.
 */

interface BullMQConnectionOptions {
    host?: string;
    port?: number;
    url?: string;
    password?: string;
    tls?: unknown;
}
interface ExecutionEngineOptions {
    queueName?: string;
    connection?: BullMQConnectionOptions;
    concurrency?: number;
    useInMemory?: boolean;
}
type BullMQExecutionEngineOptions = ExecutionEngineOptions;
declare class BullMQExecutionEngine {
    readonly queueName: string;
    private readonly concurrency;
    private readonly idempotencyStore;
    private readonly activeExecutions;
    private readonly inMemoryJobs;
    private isRunning;
    private activeWorkerCount;
    private readonly workerBoundary;
    constructor(options?: Partial<ExecutionEngineOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    close(): Promise<void>;
    getWorkerBoundary(): WorkerExecutionBoundary;
    /**
     * Dispatches a single command through the BullMQ queue and worker execution boundary.
     */
    executeCommand<TIn = unknown, TOut = unknown>(command: BackendCommand<TIn>, handler: (payload: TIn, context: ExecutionContext) => Promise<TOut>): Promise<NormalizedResult<TOut>>;
    private dispatchInternalCommand;
    /**
     * Executes a full Canonical Orchestration DAG through the BullMQ worker boundary.
     */
    executeOrchestration<TInput = unknown, TOutput = unknown>(descriptor: OrchestrationDescriptor, steps: readonly OrchestrationStep[], input: TInput, options?: {
        correlationId?: string;
        parentCorrelationId?: string;
        idempotencyKey?: string;
        timeoutMs?: number;
        metadata?: Record<string, unknown>;
        nestedRunner?: (orchId: string, input: unknown, ctx: OrchestrationContext) => Promise<unknown>;
        abortSignal?: AbortSignal;
    }): Promise<OrchestrationResult<TOutput>>;
    private executeSingleStep;
    private computeBackoff;
    cancelExecution(executionId: string): boolean;
}

/**
 * @file ServiceFacade.ts
 * @description Canonical ServiceFacade for KrnlTS services.
 * Callable boundary of a service, composing functionalities, functionality orchestrations,
 * state, events, dependencies, capabilities, and lifecycle.
 * All external invocations strictly route through the BullMQ execution engine and worker boundary.
 */

interface ServiceFacadeConfig<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    name?: string;
    version?: string;
    description?: string;
    functionalities?: Record<string, unknown>;
    functionalityOrchestrations?: Record<string, FunctionalityOrchestration>;
    /** @deprecated Use functionalityOrchestrations */
    orchestrations?: Record<string, FunctionalityOrchestration>;
    definition?: ServiceDefinition<TState, TEvents>;
    instance?: IService<TState, TEvents>;
    dependencies?: DependencyContract[];
    capabilities?: ServiceCapability[];
    queueConnection?: BullMQConnectionOptions;
    concurrency?: number;
}
type IServiceFacade = ServiceFacade;
declare class ServiceFacade<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly functionalities: Record<string, unknown>;
    readonly functionalityOrchestrations: Record<string, FunctionalityOrchestration>;
    readonly dependencies: readonly DependencyContract[];
    readonly capabilities: readonly ServiceCapability[];
    private readonly instance;
    private readonly executionEngine;
    constructor(config: ServiceFacadeConfig<TState, TEvents>);
    get orchestrations(): Record<string, FunctionalityOrchestration>;
    getInstance(): IService<TState, TEvents>;
    getExecutionEngine(): BullMQExecutionEngine;
    getWorkerBoundary(): WorkerExecutionBoundary;
    getStatus(): ServiceStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    /**
     * External caller callable boundary for single functionality / operation execution.
     * Path: External Caller -> Service Facade -> BullMQ Command -> Worker -> Functionality -> Result.
     * Strictly avoids synchronous unmediated execution outside the queue.
     */
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    /**
     * External caller callable boundary for functionality orchestration execution.
     * Path: External Caller -> Service Facade -> BullMQ Command -> Worker -> FunctionalityOrchestration -> Result.
     */
    orchestrate<TIn = unknown, TOut = unknown>(orchestrationName: string, input?: TIn, options?: {
        correlationId?: string;
        idempotencyKey?: string;
        timeoutMs?: number;
        metadata?: Record<string, unknown>;
    }): Promise<OrchestrationResult<TOut>>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
    registerFunctionality(name: string, functionality: unknown): this;
    registerFunctionalityOrchestration(name: string, orchestration: FunctionalityOrchestration): this;
    /** @deprecated Use registerFunctionalityOrchestration */
    registerOrchestration(name: string, orchestration: FunctionalityOrchestration): this;
}
declare function createServiceFacade<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(config: ServiceFacadeConfig<TState, TEvents>): ServiceFacade<TState, TEvents>;

/**
 * @file HttpProtocolAdapter.ts
 * @description HTTP/HTTPS adapter for service exposition and remote consumption.
 */

declare class HttpProtocolAdapter implements ProtocolAdapter {
    readonly protocol: "http";
    readonly capabilities: ProtocolCapabilities;
    private server?;
    private listeningPort?;
    listen(port: number, host?: string): Promise<EndpointDescriptor>;
    expose(service: IService, port?: number): Promise<EndpointDescriptor>;
    send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
    stop(): Promise<void>;
}

/**
 * @file WebSocketProtocolAdapter.ts
 * @description WebSocket full-duplex protocol adapter for services (browser + Node safe).
 */

declare class WebSocketProtocolAdapter implements ProtocolAdapter {
    readonly protocol: "ws";
    readonly capabilities: ProtocolCapabilities;
    private server?;
    private wss?;
    private port?;
    expose(service: IService, port?: number): Promise<EndpointDescriptor>;
    send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
    stop(): Promise<void>;
}

/**
 * @file UdpProtocolAdapter.ts
 * @description UDP datagram adapter for services and beacon messaging.
 */

declare class UdpProtocolAdapter implements ProtocolAdapter {
    readonly protocol: "udp";
    readonly capabilities: ProtocolCapabilities;
    private socket?;
    private port?;
    expose(service: IService, port?: number): Promise<EndpointDescriptor>;
    send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
    stop(): Promise<void>;
}

/**
 * @file P2PProtocolAdapter.ts
 * @description Signaling & P2P virtual routing protocol adapter.
 */

declare class P2PProtocolAdapter implements ProtocolAdapter {
    readonly protocol: "p2p";
    readonly capabilities: ProtocolCapabilities;
    private static peerHub;
    expose(service: IService): Promise<EndpointDescriptor>;
    send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
    stop(): Promise<void>;
}

/**
 * @file MemoryTransport.ts
 * @description In-memory direct transport implementation.
 */

declare class MemoryTransport {
    private handlers;
    onMessage(handler: (envelope: ProtocolEnvelope) => Promise<ProtocolEnvelope | void>): () => void;
    send(envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
}

/**
 * @file ServiceRegistry.ts
 * @description Central service catalog and capabilities registry.
 */

interface RegisteredServiceRecord {
    definition: ServiceDefinition;
    endpoints: EndpointDescriptor[];
    registeredAt: number;
}
/**
 * Central service catalog and capabilities registry.
 *
 * Duplicate Registration Semantics:
 * 1. Same ID + Same Version:
 *    Idempotent re-registration. Refreshes service definition and active endpoints,
 *    while preserving the original registration timestamp (`registeredAt`).
 * 2. Same ID + Different Version:
 *    Refused with an Error. The catalog enforces a strict 1:1 mapping per service ID.
 *    To change versions, consumer must explicitly call `unregister(serviceId)` first.
 */
declare class ServiceRegistry {
    private readonly services;
    /**
     * Registers a service definition and its endpoints into the registry.
     *
     * @param definition Validated service definition.
     * @param endpoints Optional list of active endpoint descriptors.
     * @throws Error if definition or endpoints fail validation.
     * @throws Error if service is already registered under the same ID with a different version.
     */
    register(definition: ServiceDefinition, endpoints?: EndpointDescriptor[]): void;
    unregister(serviceId: string): boolean;
    get(serviceId: string): RegisteredServiceRecord | undefined;
    list(): RegisteredServiceRecord[];
    findByCapability(capabilityName: string): RegisteredServiceRecord[];
}

/**
 * @file ServiceRuntime.ts
 * @description Isolated runtime managing service instances and execution boundaries.
 */

declare class ServiceRuntime {
    private readonly instances;
    readonly registry: ServiceRegistry;
    constructor(registry?: ServiceRegistry);
    register(service: IService): this;
    unregister(serviceId: string): boolean;
    get(serviceId: string): IService | undefined;
    list(): IService[];
    execute<TIn = unknown, TOut = unknown>(target: string, operation: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    startAll(): Promise<void>;
    disposeAll(): Promise<void>;
    stopAll(): Promise<void>;
}

/**
 * @file ServiceDiscovery.ts
 * @description Discovery primitives for local and network services.
 */

interface PeerRecord {
    id: string;
    name: string;
    endpoints: EndpointDescriptor[];
    lastSeen: number;
}
declare class ServiceDiscovery {
    private peers;
    registerPeer(id: string, name: string, endpoints: EndpointDescriptor[]): void;
    getPeers(): PeerRecord[];
    findPeer(id: string): PeerRecord | undefined;
}

interface ReconcileResult {
    updated: boolean;
    totalManifests: number;
    addedDependencies: Record<string, string>;
    addedDevDependencies: Record<string, string>;
    conflicts: Array<{
        package: string;
        versions: string[];
    }>;
}
declare class KrnlPackageReconciler {
    /**
     * Scans all manifest.json files across backend and frontend and reconciles root package.json.
     */
    static reconcile(projectRoot?: string, writeChanges?: boolean): ReconcileResult;
    /**
     * Discovers all manifest.json files in krnl/ (or src/)
     */
    static findManifests(projectRoot: string): string[];
    private static scanRecursive;
}

/**
 * @file ServiceStateStore.ts
 * @description State management primitive for stateful services.
 */
declare class ServiceStateStore<TState extends Record<string, unknown> = Record<string, unknown>> {
    private state;
    private listeners;
    constructor(initialState: TState);
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    subscribe(listener: (state: Readonly<TState>, delta: Partial<TState>) => void): () => void;
    reset(newState?: TState): void;
}

/**
 * @file ServiceEventBus.ts
 * @description In-memory strongly-typed event bus for services.
 */
declare class ServiceEventBus<TEvents extends Record<string, unknown> = Record<string, unknown>> {
    private handlers;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
    clear(): void;
}

/**
 * @file ProtocolResolver.ts
 * @description Protocol selection resolving matching adapters from capabilities.
 */

declare class ProtocolResolver {
    static selectProtocol(requiredCapabilities: string[], availableEndpoints: EndpointDescriptor[]): EndpointDescriptor | undefined;
    static getSupportedProtocols(definition: ServiceDefinition): ProtocolType[];
}

export { type BackendCommand, type BullMQConnectionOptions, BullMQExecutionEngine, type BullMQExecutionEngineOptions, type Connection, type DAGValidationResult, type DependencyContract, type EndpointDescriptor, type EventContract, type ExecutionContext, type ExecutionEngineOptions, type FunctionalityFlow, type FunctionalityFlowStep, FunctionalityOrchestration, type FunctionalityStepOptions, HttpProtocolAdapter, type IService, type IServiceFacade, KrnlPackageReconciler, type LifecycleContract, LifecycleManager, MemoryTransport, type NormalizedResult, type OperationContext, type OperationContract, type OrchestrationContext, type OrchestrationDescriptor, type OrchestrationResult, type OrchestrationStatus, type OrchestrationStep, P2PProtocolAdapter, type PeerRecord, type ProtocolAdapter, type ProtocolCapabilities, type ProtocolEnvelope, ProtocolResolver, type ProtocolType, type ReconcileResult, type RegisteredServiceRecord, type SagaCompensationHandler, type ServiceCapability, type ServiceDefinition, ServiceDiscovery, ServiceEventBus, ServiceFacade, type ServiceFacadeConfig, ServiceInstance, ServiceProxy, ServiceRegistry, ServiceRuntime, ServiceStateStore, type ServiceStatus, type StateContract, type StepCompensation, type StepCondition, type StepExecutionResult, type StepExecutionStatus, type StepRetryPolicy, type StepStatus, type StepTimeoutPolicy, type StepType, UdpProtocolAdapter, WebSocketProtocolAdapter, WorkerExecutionBoundary, createService, createServiceDefinition, createServiceFacade, createServiceProxy, validateOrchestrationDAG, validateServiceDefinition };
