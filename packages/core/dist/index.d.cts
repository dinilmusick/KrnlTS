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
 * @file Orchestration.ts
 * @description Canonical declarative Orchestration compositor for KrnlTS services.
 * Aligned with Skipo Orchestration architecture.
 */
interface OrchestrationDescriptor {
    id: string;
    name?: string;
    version?: string;
    description?: string;
}
interface OrchestrationFlowStep {
    type: 'functionality' | 'orchestration';
    target: string;
    flow?: string;
}
interface OrchestrationFlow {
    name: string;
    steps: OrchestrationFlowStep[];
    visibility: 'public' | 'private' | 'internal';
    thenFunctionality(funcName: string): OrchestrationFlow;
    thenOrchestration(orchestrationName: string, flowName?: string): OrchestrationFlow;
    register(options?: {
        visibility?: 'public' | 'private' | 'internal';
    }): OrchestrationFlow;
}
/**
 * Declarative Orchestration compositor.
 * Focused strictly on composing functionalities and other orchestrations into named flows.
 * Does not contain procedural algorithms, loops, or application-level configuration.
 */
declare class Orchestration {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    private readonly flows;
    constructor(descriptor: OrchestrationDescriptor);
    flow(name: string): OrchestrationFlow;
    getFlow(name: string): OrchestrationFlow | undefined;
    listFlows(): OrchestrationFlow[];
    clearFlows(): void;
}

/**
 * @file ServiceFacade.ts
 * @description Canonical ServiceFacade for KrnlTS services.
 * Structurally analogous to Skipo's BackendFacade, representing a single service's
 * public semantic boundary, composing functionalities, orchestrations, operations,
 * state, events, dependencies, capabilities, and lifecycle.
 */

interface ServiceFacadeConfig<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    name?: string;
    version?: string;
    description?: string;
    functionalities?: Record<string, unknown>;
    orchestrations?: Record<string, Orchestration>;
    definition?: ServiceDefinition<TState, TEvents>;
    instance?: IService<TState, TEvents>;
    dependencies?: DependencyContract[];
    capabilities?: ServiceCapability[];
}
declare class ServiceFacade<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly functionalities: Record<string, unknown>;
    readonly orchestrations: Record<string, Orchestration>;
    readonly dependencies: readonly DependencyContract[];
    readonly capabilities: readonly ServiceCapability[];
    private readonly instance;
    constructor(config: ServiceFacadeConfig<TState, TEvents>);
    getInstance(): IService<TState, TEvents>;
    getStatus(): ServiceStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
    registerFunctionality(name: string, functionality: unknown): this;
    registerOrchestration(name: string, orchestration: Orchestration): this;
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

export { type Connection, type DependencyContract, type EndpointDescriptor, type EventContract, HttpProtocolAdapter, type IService, KrnlPackageReconciler, type LifecycleContract, LifecycleManager, MemoryTransport, type OperationContext, type OperationContract, Orchestration, type OrchestrationDescriptor, type OrchestrationFlow, type OrchestrationFlowStep, P2PProtocolAdapter, type PeerRecord, type ProtocolAdapter, type ProtocolCapabilities, type ProtocolEnvelope, ProtocolResolver, type ProtocolType, type ReconcileResult, type RegisteredServiceRecord, type ServiceCapability, type ServiceDefinition, ServiceDiscovery, ServiceEventBus, ServiceFacade, type ServiceFacadeConfig, ServiceInstance, ServiceProxy, ServiceRegistry, ServiceRuntime, ServiceStateStore, type ServiceStatus, type StateContract, UdpProtocolAdapter, WebSocketProtocolAdapter, createService, createServiceDefinition, createServiceFacade, createServiceProxy, validateServiceDefinition };
