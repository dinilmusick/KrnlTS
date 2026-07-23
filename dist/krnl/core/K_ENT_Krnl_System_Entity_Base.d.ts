/**
 * @file K_ENT_System_Entity_Base.ts
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */
import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import { krnlSystemCommComponent } from "./K_LIB_Krnl_System_Comm_Component.js";
import { krnlUnifiedHttpAdapter } from "./K_LIB_Krnl_System_Unified_Http_Adapter.js";
import { KrnlManagedServiceConfig, KrnlManagedServiceHandle, KrnlIngressNetworkMemberConfig, KrnlFrontendOptions, KrnlCustomFrontendOptions } from "./types.js";
import { KrnlIngressNetwork } from "./K_LIB_Krnl_System_Ingress_Network.js";
import { KrnlFrontend } from "./K_LIB_Krnl_System_Frontend.js";
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "./K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlApplicationOrchestrator } from "./K_LIB_Krnl_Application_Orchestrator.js";
import { KrnlRuntimeStore } from "./K_LIB_Krnl_Runtime_Store.js";
import http from 'http';
export declare class krnlSystemEntityBase extends krnlEntityBase {
    _isIngressNetworkMember: boolean;
    _ingressNetwork: KrnlIngressNetwork | null;
    _frontendEnabled: boolean;
    _frontend: KrnlFrontend | null;
    _isSubApp: boolean;
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
    startIngressNetwork(members: KrnlIngressNetworkMemberConfig[]): Promise<void>;
    joinIngressNetwork(config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase>;
    startCustomFrontend(name: string, appPath: string, options?: KrnlCustomFrontendOptions): Promise<krnlSystemEntityBase>;
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
//# sourceMappingURL=K_ENT_Krnl_System_Entity_Base.d.ts.map