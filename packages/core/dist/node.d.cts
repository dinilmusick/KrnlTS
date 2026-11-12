import { ProtocolAdapter, ProtocolCapabilities, EndpointDescriptor, IService, ProtocolEnvelope } from './index.cjs';
export { BackendCommand, CanonicalAuthProvider, CanonicalAuthRegistration, CanonicalAuthServiceContract, CanonicalAuthSession, CanonicalAuthSessionResult, CanonicalAuthUser, Connection, DAGValidationResult, DefaultExecutionController, DefaultFrontendReference, DependencyContract, EventBus, EventChannel, EventContract, EventDefinition, EventHandler, EventSubscription, ExecutionContext, ExecutionController, ExecutionProvider, ExecutionRequest, ExecutionResult, ExecutionStatus, FetchProtocolAdapter, FetchProtocolAdapterOptions, FunctionalityCustomEvents, FunctionalityDefinition, FunctionalityEventNamespace, FunctionalityEvents, FunctionalityExecutionContext, FunctionalityFacade, FunctionalityLifecycleEvent, FunctionalityLifecyclePayload, FunctionalityOrchestration, FunctionalityStepOptions, IServiceFacade, JobStatus, KrnlJobDefinition, KrnlJobHandle, KrnlJobOptions, KrnlQueue, KrnlQueueOptions, KrnlWorkerInfo, KrnlWorkerPool, KrnlWorkerState, LifecycleContract, LifecycleManager, MemoryTransport, NormalizedResult, OperationContext, OperationContract, OrchestrationContext, OrchestrationDefinition, OrchestrationDescriptor, OrchestrationEventFacade, OrchestrationEventNamespace, OrchestrationFrontendReference, OrchestrationLifecyclePayload, OrchestrationResult, OrchestrationStatus, OrchestrationStep, P2PProtocolAdapter, PeerRecord, ProtocolResolver, ProtocolType, RegisteredServiceRecord, SagaCompensationHandler, ServiceCapability, ServiceDefinition, ServiceDiscovery, ServiceEventBus, ServiceFacade, ServiceFacadeConfig, ServiceInstance, ServiceNamespace, ServiceProxy, ServiceRegistry, ServiceRuntime, ServiceStateStore, ServiceStatus, StateContract, StepCompensation, StepCondition, StepDefinition, StepExecutionResult, StepExecutionStatus, StepRetryPolicy, StepStatus, StepTimeoutPolicy, StepType, TelemetryController, TelemetryHandle, TelemetryInvocation, TelemetryMode, TelemetryOptions, TelemetryPercentiles, TelemetryResourceSample, TelemetrySnapshot, TelemetryStatus, TelemetryTargetStats, WorkerExecutionBoundary, createEventChannels, createService, createServiceDefinition, createServiceFacade, createServiceProxy, deltaResources, sampleResources, telemetryNow, validateOrchestrationDAG, validateServiceDefinition } from './index.cjs';
import * as gutts from '@dinilmusick/gutts';
export { gutts };
import '@dinilmusick/gutts/auth';

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

export { EndpointDescriptor, HttpProtocolAdapter, IService, KrnlPackageReconciler, ProtocolAdapter, ProtocolCapabilities, ProtocolEnvelope, type ReconcileResult, UdpProtocolAdapter, WebSocketProtocolAdapter };
