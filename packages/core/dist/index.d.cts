/**
 * @file ServiceContract.ts
 * @description Canonical service contracts for the KrnlTS Service Kernel.
 * Invariant: KrnlTS.Service = Skipo.Service = RemoteService.Contract
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
    start(): Promise<void>;
    stop(): Promise<void>;
    getDefinition(): ServiceDefinition<TState, TEvents>;
}

/**
 * @file ServiceInstance.ts
 * @description Concrete service implementation in KrnlTS.
 */

declare class ServiceInstance<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> implements IService<TState, TEvents> {
    private definition;
    readonly id: string;
    readonly name: string;
    readonly version: string;
    private stateStore?;
    private eventBus;
    private lifecycle;
    constructor(definition: ServiceDefinition<TState, TEvents>);
    getDefinition(): ServiceDefinition<TState, TEvents>;
    start(): Promise<void>;
    stop(): Promise<void>;
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
 * @description Transparent client proxy invoking a remote or mediated service.
 * Invariant: LOCAL SERVICE = REMOTE SERVICE CONTRACT.
 */

declare class ServiceProxy<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>> implements IService<TState, TEvents> {
    private definition;
    private adapter;
    private endpoint;
    readonly id: string;
    readonly name: string;
    readonly version: string;
    private stateCache;
    private eventHandlers;
    constructor(definition: ServiceDefinition<TState, TEvents>, adapter: ProtocolAdapter, endpoint: EndpointDescriptor);
    getDefinition(): ServiceDefinition<TState, TEvents>;
    start(): Promise<void>;
    stop(): Promise<void>;
    call<TIn = unknown, TOut = unknown>(op: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    getState(): Readonly<TState>;
    setState(mutation: Partial<TState>): void;
    on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): () => void;
    emit<K extends keyof TEvents & string>(event: K, payload: TEvents[K]): void;
}

/**
 * @file ServiceGenerators.ts
 * @description Factory generators for services and definitions.
 */

declare function createServiceDefinition<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>): ServiceDefinition<TState, TEvents>;
declare function createService<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>): ServiceInstance<TState, TEvents>;
declare function createServiceProxy<TState extends Record<string, unknown> = Record<string, unknown>, TEvents extends Record<string, unknown> = Record<string, unknown>>(definition: ServiceDefinition<TState, TEvents>, adapter: ProtocolAdapter, endpoint: EndpointDescriptor): IService<TState, TEvents>;

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
 * @description WebSocket full-duplex protocol adapter for services.
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
declare class ServiceRegistry {
    private services;
    register(definition: ServiceDefinition, endpoints?: EndpointDescriptor[]): void;
    unregister(serviceId: string): void;
    get(serviceId: string): RegisteredServiceRecord | undefined;
    list(): RegisteredServiceRecord[];
    findByCapability(capabilityName: string): RegisteredServiceRecord[];
}

/**
 * @file ServiceRuntime.ts
 * @description Isolated runtime managing service instances and execution boundaries.
 */

declare class ServiceRuntime {
    private instances;
    readonly registry: ServiceRegistry;
    constructor(registry?: ServiceRegistry);
    register(service: IService): this;
    get(serviceId: string): IService | undefined;
    execute<TIn = unknown, TOut = unknown>(target: string, operation: string, input?: TIn, ctx?: OperationContext): Promise<TOut>;
    startAll(): Promise<void>;
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
 * @file LifecycleManager.ts
 * @description Standard lifecycle transitions for services.
 */
type ServiceStatus = 'uninitialized' | 'initializing' | 'ready' | 'starting' | 'running' | 'stopping' | 'stopped';
declare class LifecycleManager {
    private status;
    getStatus(): ServiceStatus;
    setStatus(next: ServiceStatus): void;
    assertRunning(serviceName: string): void;
}

/**
 * @file ProtocolResolver.ts
 * @description Protocol selection resolving matching adapters from capabilities.
 */

declare class ProtocolResolver {
    static selectProtocol(requiredCapabilities: string[], availableEndpoints: EndpointDescriptor[]): EndpointDescriptor | undefined;
    static getSupportedProtocols(definition: ServiceDefinition): ProtocolType[];
}

export { type Connection, type DependencyContract, type EndpointDescriptor, type EventContract, HttpProtocolAdapter, type IService, type LifecycleContract, LifecycleManager, MemoryTransport, type OperationContext, type OperationContract, P2PProtocolAdapter, type PeerRecord, type ProtocolAdapter, type ProtocolCapabilities, type ProtocolEnvelope, ProtocolResolver, type ProtocolType, type RegisteredServiceRecord, type ServiceCapability, type ServiceDefinition, ServiceDiscovery, ServiceEventBus, ServiceInstance, ServiceProxy, ServiceRegistry, ServiceRuntime, ServiceStateStore, type ServiceStatus, type StateContract, UdpProtocolAdapter, WebSocketProtocolAdapter, createService, createServiceDefinition, createServiceProxy };
