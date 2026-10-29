import * as gutts from '@dinilmusick/gutts';
export { gutts };

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
 * @file EventTypes.ts
 * @description Canonical event contracts for functionality and orchestration events.
 */
type EventHandler<TPayload> = (payload: TPayload) => void;
interface EventSubscription {
    readonly unsubscribe: () => void;
}
interface EventChannel<TPayload> {
    readonly name: string;
    subscribe(handler: EventHandler<TPayload>): EventSubscription;
    on(handler: EventHandler<TPayload>): () => void;
}
interface EventDefinition<TPayload = unknown> {
    readonly name: string;
    readonly description?: string;
    readonly payloadSchema?: Record<string, unknown>;
    readonly marker?: TPayload;
}
interface FunctionalityLifecyclePayload {
    readonly serviceId: string;
    readonly functionalityId: string;
    readonly functionalityName: string;
    readonly correlationId?: string;
    readonly timestamp: number;
    readonly input?: unknown;
    readonly output?: unknown;
    readonly error?: string;
}
type FunctionalityLifecycleEvent = 'triggered' | 'completed' | 'failed';
interface OrchestrationLifecyclePayload {
    readonly serviceId: string;
    readonly orchestrationId: string;
    readonly orchestrationName: string;
    readonly correlationId: string;
    readonly executionId?: string;
    readonly timestamp: number;
    readonly status?: string;
    readonly output?: unknown;
    readonly error?: string;
}

/**
 * @file FunctionalityContract.ts
 * @description Canonical functionality contracts and event surface.
 */

type FunctionalityCustomEvents = Record<string, unknown>;
type FunctionalityEvents<TEvents extends FunctionalityCustomEvents = {}> = Omit<TEvents, 'triggered' | 'completed' | 'failed'> & {
    triggered: FunctionalityLifecyclePayload;
    completed: FunctionalityLifecyclePayload;
    failed: FunctionalityLifecyclePayload;
};
interface FunctionalityExecutionContext<TState = Record<string, unknown>, TEvents extends FunctionalityCustomEvents = {}> {
    readonly serviceId: string;
    readonly functionalityId: string;
    readonly correlationId?: string;
    readonly state: Readonly<TState>;
    readonly metadata?: Record<string, unknown>;
    readonly emit: <K extends keyof FunctionalityEvents<TEvents> & string>(event: K, payload: FunctionalityEvents<TEvents>[K]) => void;
}
interface FunctionalityDefinition<TInput = unknown, TOutput = unknown, TState = Record<string, unknown>, TEvents extends FunctionalityCustomEvents = {}> {
    readonly id?: string;
    readonly name?: string;
    readonly description?: string;
    readonly events?: Record<keyof TEvents & string, EventDefinition<any>>;
    readonly bubbleEvents?: boolean;
    readonly execute: (input: TInput, context: FunctionalityExecutionContext<TState, TEvents>) => Promise<TOutput> | TOutput;
}
type FunctionalityEventNamespace<TEvents extends FunctionalityCustomEvents = {}> = {
    readonly [K in keyof FunctionalityEvents<TEvents>]: EventChannel<FunctionalityEvents<TEvents>[K]>;
};

/**
 * @file FunctionalityFacade.ts
 * @description First-class functionality boundary with lifecycle and custom events.
 */

declare class FunctionalityFacade<TInput = unknown, TOutput = unknown, TState = Record<string, unknown>, TEvents extends Record<string, unknown> = {}> {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly bubbleEvents: boolean;
    readonly definition: FunctionalityDefinition<TInput, TOutput, TState, TEvents>;
    private readonly eventBus;
    readonly events: FunctionalityEventNamespace<TEvents>;
    constructor(id: string, definition: FunctionalityDefinition<TInput, TOutput, TState, TEvents>, options?: {
        bubbleEvents?: boolean;
    });
    getEventDefinitions(): Record<string, EventDefinition<any>>;
    subscribe<K extends keyof FunctionalityEvents<TEvents> & string>(event: K, handler: (payload: FunctionalityEvents<TEvents>[K]) => void): () => void;
    emit<K extends keyof FunctionalityEvents<TEvents> & string>(event: K, payload: FunctionalityEvents<TEvents>[K]): void;
    execute(input: TInput, context: Omit<FunctionalityExecutionContext<TState, TEvents>, 'emit'>): Promise<TOutput>;
    clearEventSubscriptions(): void;
}

/**
 * @file ServiceContract.ts
 * @description Canonical service contracts for the KrnlTS Service Kernel.
 * Services are execution and namespace boundaries; application events belong to
 * functionalities and orchestration lifecycle, never to the service itself.
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
interface ServiceNamespace<TLibraries extends Record<string, unknown> = Record<string, unknown>, TFunctionalities extends Record<string, FunctionalityFacade<any, any, any, any>> = Record<string, FunctionalityFacade<any, any, any, any>>, TOrchestrations extends Record<string, unknown> = Record<string, unknown>> {
    readonly serviceId: string;
    readonly serviceName: string;
    readonly version: string;
    readonly description?: string;
    readonly libraries: TLibraries;
    readonly functionalities: TFunctionalities;
    readonly functionalityOrchestrations: TOrchestrations;
    readonly capabilities: readonly ServiceCapability[];
    readonly dependencies: readonly DependencyContract[];
}
interface EndpointDescriptor {
    protocol: ProtocolType;
    address: string;
    port?: number;
    path?: string;
    channel?: string;
    capabilities: string[];
}
interface ServiceDefinition<TState extends Record<string, unknown> = Record<string, unknown>, 
/** @deprecated Service-owned events are no longer part of the KrnlTS event model. */
TLegacyEvents extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    name: string;
    version: string;
    inputs?: Record<string, Record<string, unknown>>;
    outputs?: Record<string, Record<string, unknown>>;
    operations: Record<string, OperationContract<any, any>>;
    state?: StateContract<TState>;
    lifecycle?: LifecycleContract;
    dependencies?: DependencyContract[];
    capabilities?: ServiceCapability[];
    protocols?: ProtocolType[];
}
interface IService<TState extends Record<string, unknown> = Record<string, unknown>, 
/** @deprecated Service-owned events are no longer part of the KrnlTS event model. */
TLegacyEvents extends Record<string, unknown> = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    getStatus(): ServiceStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    getDefinition(): ServiceDefinition<TState, TLegacyEvents>;
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
 * Provides unified schema, serializable definition contracts, and invariants for
 * FunctionalityOrchestration (KrnlTS) and ServiceOrchestration (Skipo).
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
    readonly retryOnErrors?: readonly string[];
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
/**
 * Pure serializable definition of a step (Distributable through Kloks).
 * Free from arbitrary runtime closures.
 */
interface OrchestrationFrontendReference {
    readonly component: string;
    readonly package?: string;
    readonly export?: string;
    readonly relationship?: 'recommended' | 'required';
}
interface StepDefinition {
    readonly id: string;
    readonly name: string;
    readonly type: StepType;
    readonly target?: string;
    readonly operation?: string;
    readonly dependsOn?: readonly string[];
    readonly conditionExpression?: string;
    readonly retryPolicy?: StepRetryPolicy;
    readonly timeoutPolicy?: StepTimeoutPolicy;
    readonly compensationTarget?: string;
    readonly compensationOperation?: string;
    readonly concurrency?: number;
    readonly nestedOrchestrationId?: string;
    readonly metadata?: Record<string, unknown>;
}
/**
 * Pure serializable definition of an orchestration workflow (Distributable through Kloks).
 * Zero execution machinery, zero runtime closures.
 */
interface OrchestrationDefinition<TInput = unknown, TOutput = unknown> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description?: string;
    readonly scope: 'functionality' | 'service';
    readonly bubbleEvents?: boolean;
    readonly dependencies: readonly string[];
    readonly defaultFrontend?: OrchestrationFrontendReference;
    readonly timeoutMs?: number;
    readonly concurrency?: number;
    readonly steps: readonly StepDefinition[];
    readonly metadata?: Record<string, unknown>;
}
/**
 * Runtime execution step representation with bound handlers.
 */
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
    readonly bubbleEvents?: boolean;
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
 * Validates DAG structure & semantic policies:
 * - Duplicate step IDs
 * - Missing dependencies
 * - Cycles / circular dependencies (topological sort via Kahn's algorithm)
 * - Negative or invalid timeouts
 * - Invalid retry policies (attempts < 1, negative backoff)
 * - Empty step targets
 * - Concurrency bounds
 */
declare function validateOrchestrationDAG(steps: readonly OrchestrationStep[]): DAGValidationResult;

/**
 * @file OrchestrationEventFacade.ts
 * @description Default lifecycle event surface for functionality orchestrations.
 */

interface OrchestrationEventNamespace {
    readonly triggered: EventChannel<OrchestrationLifecyclePayload>;
    readonly completed: EventChannel<OrchestrationLifecyclePayload>;
    readonly failed: EventChannel<OrchestrationLifecyclePayload>;
}
declare class OrchestrationEventFacade {
    private readonly eventBus;
    readonly events: OrchestrationEventNamespace;
    constructor();
    get triggered(): EventChannel<OrchestrationLifecyclePayload>;
    get completed(): EventChannel<OrchestrationLifecyclePayload>;
    get failed(): EventChannel<OrchestrationLifecyclePayload>;
    emit(event: 'triggered' | 'completed' | 'failed', payload: OrchestrationLifecyclePayload): void;
    clear(): void;
}

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
    readonly bubbleEvents: boolean;
    readonly events: OrchestrationEventFacade;
    private readonly steps;
    private readonly flows;
    constructor(descriptor: OrchestrationDescriptor);
    /**
     * Adds a sequential functionality step to the DAG.
     */
    thenFunctionality(funcName: any, options?: FunctionalityStepOptions): this;
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
     * Converts this FunctionalityOrchestration to a pure serializable OrchestrationDefinition.
     */
    toDefinition(): OrchestrationDefinition;
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
 * @description Worker Execution Boundary mediating all job execution from Krnl workers
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
 * @file KrnlWorkerPool.ts
 * @description Worker lifecycle management and context factory for KrnlTS services.
 * Tracks worker state transitions: created -> started -> running -> draining -> stopped.
 * Ensures all job executions happen with valid ExecutionContext.
 */

type KrnlWorkerState = 'created' | 'started' | 'running' | 'draining' | 'stopped';
interface KrnlWorkerInfo {
    readonly id: string;
    readonly queueName: string;
    readonly state: KrnlWorkerState;
    readonly startedAt: number;
    readonly activeJobs: number;
}
declare class KrnlWorkerPool {
    readonly queueName: string;
    readonly workerId: string;
    private state;
    private activeJobsCount;
    private readonly startedAt;
    private readonly workerBoundary;
    constructor(queueName: string, workerId?: string);
    getState(): KrnlWorkerState;
    getActiveJobs(): number;
    getWorkerBoundary(): WorkerExecutionBoundary;
    getInfo(): KrnlWorkerInfo;
    start(): void;
    createContext(correlationId?: string, metadata?: Record<string, unknown>): ExecutionContext;
    runWithContext<T>(correlationId: string | undefined, metadata: Record<string, unknown> | undefined, fn: (ctx: ExecutionContext) => Promise<T>): Promise<T>;
    drain(): Promise<void>;
    stop(): Promise<void>;
}

/**
 * @file KrnlQ.ts
 * @description In-process execution queue for a single KrnlTS service.
 * Uses p-queue internally as the low-level scheduling and concurrency primitive.
 * Zero Redis, zero Docker, zero BullMQ, 100% portable TypeScript.
 */

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'cancelled';
interface KrnlJobOptions {
    priority?: number;
    timeoutMs?: number;
    retries?: number;
    backoffMs?: number;
    backoffPolicy?: 'fixed' | 'exponential';
    idempotencyKey?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
    abortSignal?: AbortSignal;
}
interface KrnlJobDefinition<TInput = unknown, TOutput = unknown> {
    id?: string;
    name: string;
    payload: TInput;
    handler: (payload: TInput, context: ExecutionContext) => Promise<TOutput>;
    options?: KrnlJobOptions;
}
interface KrnlJobHandle<TOutput = unknown> {
    readonly id: string;
    readonly name: string;
    getStatus(): JobStatus;
    result(): Promise<TOutput>;
    cancel(): boolean;
}
interface KrnlQueueOptions {
    queueName?: string;
    concurrency?: number;
    autoStart?: boolean;
    maxRetainedJobs?: number;
}
interface InternalJobRecord<TOutput = unknown> {
    id: string;
    name: string;
    status: JobStatus;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    result?: TOutput;
    error?: string;
    abortController: AbortController;
    resolvePromise: (val: TOutput) => void;
    rejectPromise: (err: any) => void;
    promise: Promise<TOutput>;
}
declare class KrnlQueue {
    readonly queueName: string;
    private readonly queue;
    private readonly workerPool;
    private readonly jobs;
    private readonly idempotencyStore;
    private readonly activeOrchestrations;
    private readonly maxRetainedJobs;
    constructor(options?: KrnlQueueOptions);
    get concurrency(): number;
    set concurrency(value: number);
    get size(): number;
    get pending(): number;
    get isPaused(): boolean;
    getWorkerBoundary(): WorkerExecutionBoundary;
    getWorkerPool(): KrnlWorkerPool;
    pause(): void;
    resume(): void;
    clear(): void;
    private pruneJobs;
    drain(): Promise<void>;
    shutdown(options?: {
        drain?: boolean;
    }): Promise<void>;
    close(): Promise<void>;
    dispose(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * Enqueues a job returning a strong handle.
     */
    enqueue<TInput = unknown, TOutput = unknown>(jobDef: KrnlJobDefinition<TInput, TOutput>): KrnlJobHandle<TOutput>;
    cancel(jobId: string): boolean;
    getJob(jobId: string): InternalJobRecord | undefined;
    /**
     * Dispatches a single command through the KrnlQ worker boundary.
     */
    executeCommand<TIn = unknown, TOut = unknown>(command: BackendCommand<TIn>, handler: (payload: TIn, context: ExecutionContext) => Promise<TOut>): Promise<NormalizedResult<TOut>>;
    /**
     * Executes a full Canonical Orchestration DAG through KrnlQ and worker boundary.
     * This is a first-class queued job scheduled via this.enqueue() to respect concurrency and worker limits.
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
 * All external invocations strictly route through KrnlQ and worker execution boundary.
 */

interface DefaultFrontendReference {
    component: string;
    package?: string;
    export?: string;
    relationship?: 'recommended' | 'required';
}
interface ServiceFacadeConfig<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>, TLibraries extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    name?: string;
    version?: string;
    description?: string;
    functionalities?: Record<string, unknown>;
    functionalityOrchestrations?: Record<string, FunctionalityOrchestration>;
    /** @deprecated Use functionalityOrchestrations */
    orchestrations?: Record<string, FunctionalityOrchestration>;
    libraries?: TLibraries;
    definition?: ServiceDefinition<TState, TEvents>;
    instance?: IService<TState, TEvents>;
    dependencies?: DependencyContract[];
    capabilities?: ServiceCapability[];
    queueOptions?: KrnlQueueOptions;
    concurrency?: number;
    /** Canonical FLOKS frontend component recommended for this service. */
    defaultFrontend?: DefaultFrontendReference;
}
type IServiceFacade = ServiceFacade<any, any, any>;
declare class ServiceFacade<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>, TLibraries extends Record<string, unknown> = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly functionalities: Record<string, FunctionalityFacade<any, any, any, any>>;
    readonly functionalityOrchestrations: Record<string, FunctionalityOrchestration>;
    readonly libraries: TLibraries;
    readonly dependencies: readonly DependencyContract[];
    readonly capabilities: readonly ServiceCapability[];
    readonly defaultFrontend?: DefaultFrontendReference;
    private readonly instance;
    private readonly queue;
    constructor(config: ServiceFacadeConfig<TState, TEvents, TLibraries>);
    get orchestrations(): Record<string, FunctionalityOrchestration>;
    getInstance(): IService<TState, TEvents>;
    getQueue(): KrnlQueue;
    getExecutionEngine(): KrnlQueue;
    getWorkerBoundary(): WorkerExecutionBoundary;
    getStatus(): ServiceStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    /**
     * External caller callable boundary for single functionality / operation execution.
     * Path: External Caller -> Service Facade -> KrnlQ Job -> Worker -> Functionality -> Result.
     * Strictly avoids synchronous unmediated execution outside the queue.
     */
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    /**
     * External caller callable boundary for functionality orchestration execution.
     * Path: External Caller -> Service Facade -> KrnlQ Command -> Worker -> FunctionalityOrchestration -> Result.
     */
    orchestrate<TIn = unknown, TOut = unknown>(orchestrationName: string, input?: TIn, options?: {
        correlationId?: string;
        idempotencyKey?: string;
        timeoutMs?: number;
        metadata?: Record<string, unknown>;
        abortSignal?: AbortSignal;
    }): Promise<OrchestrationResult<TOut>>;
    /**
     * Executes a callable operation or orchestration through KrnlQ and worker boundary.
     * Path: External Caller -> Service Facade -> KrnlQ Command -> Worker -> Functionality / Orchestration -> Result.
     * Strictly queue-mediated; zero unmediated bypasses.
     */
    execute<TIn = unknown, TOut = unknown>(target: string, input?: TIn, options?: {
        correlationId?: string;
        idempotencyKey?: string;
        timeoutMs?: number;
        metadata?: Record<string, unknown>;
        abortSignal?: AbortSignal;
    }): Promise<any>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    getFunctionality(name: string): FunctionalityFacade<any, any, any, any>;
    registerFunctionality(name: string, functionality: unknown, options?: {
        bubbleEvents?: boolean;
    }): this;
    registerFunctionalityOrchestration(name: string, orchestration: FunctionalityOrchestration): this;
    /** @deprecated Use registerFunctionalityOrchestration */
    registerOrchestration(name: string, orchestration: FunctionalityOrchestration): this;
    registerLibrary<TLib = unknown>(name: string, library: TLib): this;
    getLibrary<TLib = unknown>(name: string): TLib;
    get namespace(): ServiceNamespace<TLibraries, Record<string, FunctionalityFacade<any, any, any, any>>, Record<string, FunctionalityOrchestration>>;
    getNamespace(): ServiceNamespace<TLibraries, Record<string, FunctionalityFacade<any, any, any, any>>, Record<string, FunctionalityOrchestration>>;
    getServiceFacadeMetadata(): ServiceNamespace<TLibraries, Record<string, FunctionalityFacade<any, any, any, any>>, Record<string, FunctionalityOrchestration>>;
}
declare function createServiceFacade<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>, TLibraries extends Record<string, unknown> = Record<string, unknown>>(config: ServiceFacadeConfig<TState, TEvents, TLibraries>): ServiceFacade<TState, TEvents, TLibraries>;

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
 * Registration Semantics:
 * 1. register():
 *    Strict uniqueness enforced. If a service with the same ID is already registered
 *    (whether same version or different version), an Error is thrown.
 * 2. replace():
 *    Explicit replacement method. Overwrites existing service registration while
 *    preserving the original registration timestamp (`registeredAt`).
 */
declare class ServiceRegistry {
    private readonly services;
    /**
     * Registers a service definition and its endpoints into the registry.
     *
     * @param definition Validated service definition.
     * @param endpoints Optional list of active endpoint descriptors.
     * @throws Error if definition or endpoints fail validation.
     * @throws Error if service is already registered under the same ID.
     */
    register(definition: ServiceDefinition, endpoints?: EndpointDescriptor[]): void;
    /**
     * Explicitly replaces or updates a service definition and its endpoints in the registry.
     * Preserves original registeredAt timestamp if the service was previously registered.
     *
     * @param definition Validated service definition.
     * @param endpoints Optional list of active endpoint descriptors.
     */
    replace(definition: ServiceDefinition, endpoints?: EndpointDescriptor[]): void;
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
 * @file EventBus.ts
 * @description Generic in-process event bus used by functionality and orchestration event surfaces.
 */

declare class EventBus<TEvents extends Record<string, unknown> = Record<string, unknown>> {
    private readonly handlers;
    subscribe<K extends keyof TEvents & string>(event: K, handler: EventHandler<TEvents[K]>): EventSubscription;
    on<K extends keyof TEvents & string>(event: K, handler: EventHandler<TEvents[K]>): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
    clear(): void;
}
declare function createEventChannels<TEvents extends Record<string, unknown>>(bus: EventBus<TEvents>, names: readonly (keyof TEvents & string)[]): {
    [K in keyof TEvents]: EventChannel<TEvents[K]>;
};

/**
 * @file ServiceEventBus.ts
 * @description Backward-compatible generic event bus.
 *
 * KrnlTS no longer defines service-owned application events. First-class
 * application events are owned by functionalities and orchestration lifecycle.
 */

declare class ServiceEventBus<TEvents extends Record<string, unknown> = Record<string, unknown>> extends EventBus<TEvents> {
}

/**
 * @file ProtocolResolver.ts
 * @description Protocol selection resolving matching adapters from capabilities.
 */

declare class ProtocolResolver {
    static selectProtocol(requiredCapabilities: string[], availableEndpoints: EndpointDescriptor[]): EndpointDescriptor | undefined;
    static getSupportedProtocols(definition: ServiceDefinition): ProtocolType[];
}

export { type BackendCommand, type Connection, type DAGValidationResult, type DefaultFrontendReference, type DependencyContract, type EndpointDescriptor, EventBus, type EventChannel, type EventContract, type EventDefinition, type EventHandler, type EventSubscription, type ExecutionContext, type FunctionalityCustomEvents, type FunctionalityDefinition, type FunctionalityEventNamespace, type FunctionalityEvents, type FunctionalityExecutionContext, FunctionalityFacade, type FunctionalityFlow, type FunctionalityFlowStep, type FunctionalityLifecycleEvent, type FunctionalityLifecyclePayload, FunctionalityOrchestration, type FunctionalityStepOptions, HttpProtocolAdapter, type IService, type IServiceFacade, type JobStatus, type KrnlJobDefinition, type KrnlJobHandle, type KrnlJobOptions, KrnlPackageReconciler, KrnlQueue, type KrnlQueueOptions, type KrnlWorkerInfo, KrnlWorkerPool, type KrnlWorkerState, type LifecycleContract, LifecycleManager, MemoryTransport, type NormalizedResult, type OperationContext, type OperationContract, type OrchestrationContext, type OrchestrationDefinition, type OrchestrationDescriptor, OrchestrationEventFacade, type OrchestrationEventNamespace, type OrchestrationFrontendReference, type OrchestrationLifecyclePayload, type OrchestrationResult, type OrchestrationStatus, type OrchestrationStep, P2PProtocolAdapter, type PeerRecord, type ProtocolAdapter, type ProtocolCapabilities, type ProtocolEnvelope, ProtocolResolver, type ProtocolType, type ReconcileResult, type RegisteredServiceRecord, type SagaCompensationHandler, type ServiceCapability, type ServiceDefinition, ServiceDiscovery, ServiceEventBus, ServiceFacade, type ServiceFacadeConfig, ServiceInstance, type ServiceNamespace, ServiceProxy, ServiceRegistry, ServiceRuntime, ServiceStateStore, type ServiceStatus, type StateContract, type StepCompensation, type StepCondition, type StepDefinition, type StepExecutionResult, type StepExecutionStatus, type StepRetryPolicy, type StepStatus, type StepTimeoutPolicy, type StepType, UdpProtocolAdapter, WebSocketProtocolAdapter, WorkerExecutionBoundary, createEventChannels, createService, createServiceDefinition, createServiceFacade, createServiceProxy, validateOrchestrationDAG, validateServiceDefinition };
