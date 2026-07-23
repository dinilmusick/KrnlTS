//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_System_Entity_Base.ts
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */
import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import { krnlSystemCommComponent } from "./K_LIB_Krnl_System_Comm_Component.js";
import { adminCommandApi, discoverPeersApi, heartbeatApi, getManifestApi as manifestApi, getLastActionDocsApi, getFullDocumentationApi, systemCommandsCollectorHandler, telemetryApi, getUsedPortsApi, findFreePortsApi, shutdownApi, getIngressNetworkTopologyApi, getEndpointDefinitionsApi, setEndpointDefinitionApi, getTelemetryLogApi, getAikoCatalogApi, aiOrchestrationApi, getTaskListApi, } from "./K_LIB_Krnl_System_Base_Functionality_APIs.js";
import { Logger } from "./K_LIB_Krnl_Base_Concepts.js";
import { krnlUnifiedHttpAdapter } from "./K_LIB_Krnl_System_Unified_Http_Adapter.js";
import { KrnlShell } from "../tools/KrnlShell.js";
import { KrnlIngressNetwork } from "./K_LIB_Krnl_System_Ingress_Network.js";
import { KrnlFrontend } from "./K_LIB_Krnl_System_Frontend.js";
// AI Imports
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "./K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlApplicationOrchestrator } from "./K_LIB_Krnl_Application_Orchestrator.js";
import { KrnlRuntimeStore } from "./K_LIB_Krnl_Runtime_Store.js";
import { KrnlEndpointAgent } from "./K_LIB_Krnl_Endpoint_Agent.js";
import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { zodToJsonSchema } from 'zod-to-json-schema';
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// KRNL SYSTEM ENTITY BASE ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
export class krnlSystemEntityBase extends krnlEntityBase {
    _isIngressNetworkMember = false;
    _ingressNetwork = null;
    _frontendEnabled = false;
    _frontend = null;
    _isSubApp = false;
    peers;
    discoverable;
    // AI Properties
    _aiOrchestrator = null;
    _aiTracker = null;
    _aiScheduler = null;
    _aikoClient = null;
    _aiProfilesStore = null;
    _aikoCatalog = {};
    _krnlSystemEndpointIds = new Set([
        'heartbeat',
        'getTelemetry',
        'adminCommand',
        'discoverPeers',
        'getManifest',
        'getLastActionDocs',
        'getFullDocumentation',
        'getUsedPorts',
        'findFreePorts',
        'shutdown',
        'getIngressNetworkTopology',
        'getAikoCatalog',
        'getTaskList',
        'ai'
    ]);
    reservation;
    peerTtlMs;
    commPort;
    host;
    commComponent;
    _sharedServer;
    serviceSuites;
    unifiedHttpAdapter;
    _documentationProvider;
    _lastPreemptiveDoc = null;
    _lastErrorDoc = null;
    discoverySocket;
    beaconInterval;
    /** portRegistry: serviceName → port  (P_local ⊆ ℕ) */
    portRegistry;
    /** Registered service configurations for external processes. */
    _serviceConfigs = [];
    /** Active handles for managed services. */
    _managedServices = new Map();
    /**
     * _preferredPort — the port hint supplied at construction.
     * Write-once. Never published externally. The actual bound port is commPort
     * (set by finalizeCommPort after a successful server.listen()).
     */
    _preferredPort;
    /** Directory where {entityName}.ports.json is written. */
    _entityDataDir;
    /** True once gracefulShutdown has been triggered — prevents re-entry. */
    _shuttingDown = false;
    /**
     * Internal readiness signaling.
     * Resolves after _startSharedServer successfully binds and finalizeCommPort is called.
     */
    _readyPromise;
    _resolveReady;
    _magneticLoadPromise = null;
    _registryClient;
    _registryHeartbeatInterval = null;
    _registryEvictionInterval = null;
    _registryApps = new Map();
    /**
     * @param name
     * @param owner
     * @param commPort - WS listen port for the commComponent.
     * @param host - Interface to bind to.
     * @param options - Entity options.
     */
    constructor(name, owner = null, commPort = 10099, host = '0.0.0.0', options = {}) {
        super(name, owner, { ...options, Singleton: true });
        this.systemType = 'SystemOrchestrator';
        this.peers = new Map(); // id -> { address, lastSeen }
        this.discoverable = true;
        this.reservation = {
            busy: false,
            reservedBy: null,
            reservedAt: null,
        };
        this.peerTtlMs = 60000;
        // Initialize registry client
        import('./K_LIB_Krnl_Registry_Client.js').then(({ KrnlRegistryClient }) => {
            this._registryClient = new KrnlRegistryClient(10099);
        }).catch(() => { });
        // ── Readiness State ───────────────────────────────────────────────
        this._readyPromise = new Promise((resolve) => {
            this._resolveReady = resolve;
        });
        // ── Uniform P2P communication bridge ──────────────────────────────
        this.commPort = commPort;
        this.host = host;
        this.commComponent = new krnlSystemCommComponent(this, commPort, host);
        this._setupBaseFunctionalities();
        this._setupBaseInterface();
        this._setupRpcHandlers();
        this._sharedServer = null;
        this.serviceSuites = new Map(); // suiteName -> adapterInstance
        // Pre-initialize the unified HTTP adapter (always-on)
        this.unifiedHttpAdapter = new krnlUnifiedHttpAdapter(this, commPort, host);
        // ── Port Registry ─────────────────────────────────────────────────
        // portRegistry is intentionally EMPTY at construction time.
        // _krnl_system is only added by finalizeCommPort() after the server
        // has successfully bound to an OS port.  This prevents snapshot drift.
        this.portRegistry = new Map();
        this._preferredPort = commPort; // hint — never written to portRegistry directly
        // ── Data directory for port snapshot file ─────────────────────────
        // Pass options.sourcePath = import.meta.url (ESM) or __filename (CJS)
        // from the assembler to co-locate {entityName}.ports.json with the app.
        let dataDir = process.cwd();
        const subappStore = globalThis.__krnlSubAppLocalStorage?.getStore();
        if (subappStore && typeof subappStore === 'object' && subappStore.appPath) {
            dataDir = subappStore.appPath;
        }
        else if (options.sourcePath) {
            try {
                const resolved = options.sourcePath.startsWith('file:')
                    ? fileURLToPath(options.sourcePath)
                    : options.sourcePath;
                dataDir = path.dirname(resolved);
            }
            catch (_) { /* fall back to cwd */ }
        }
        this._entityDataDir = dataDir;
        console.log(`[KRNL_DATA_DIR] Entity: ${this.entityName}, DataDir: ${this._entityDataDir}, subappStore: ${JSON.stringify(subappStore)}`);
        // ── Protocol Unification & Decoration ──────────────────────────────
        this._documentationProvider = null;
        // ── Startup Diagnostics ──────────────────────────────
        this._emitStartupDiagnostics();
        this._isSubApp = !!subappStore;
        // Start magnetic discovery of nested assets (Phase 1 & 2)
        this._magneticLoadPromise = this._runMagneticLoader(options);
    }
    enableFrontend(options) {
        this._frontendEnabled = true;
        this._frontend = new KrnlFrontend(this, options);
    }
    async _runMagneticLoader(options = {}) {
        if (options._skipMagneticLoading) {
            return;
        }
        try {
            const { KrnlMagneticLoader } = await import('./K_LIB_Krnl_System_Magnetic_Loader.js');
            await KrnlMagneticLoader.loadAll(this, this._entityDataDir);
        }
        catch (err) {
            console.error(`[${this.entityName}] Magnetic loader error:`, err);
        }
    }
    /**
     * boot
     * Boot validation & startup entrypoint
     */
    async boot() {
        await this.whenReady();
    }
    /**
     * whenReady
     * Await this promise to ensure the system has bound to its final port,
     * written its snapshot file, and is fully operational.
     */
    async whenReady() {
        if (this._magneticLoadPromise) {
            await this._magneticLoadPromise;
        }
        await this._validateBootManifestDependencies();
        await this._readyPromise;
    }
    /**
     * Validates requiredRemotes manifest dependencies upon boot
     */
    async _validateBootManifestDependencies() {
        try {
            const manifestPath = path.join(this._entityDataDir, 'krnl.json');
            if (!fs.existsSync(manifestPath))
                return;
            const content = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(content);
            if (!manifest.dependencies?.requiredRemotes)
                return;
            const availableEntities = new Set();
            availableEntities.add(this.entityName);
            if (this.entityClass)
                availableEntities.add(this.entityClass);
            if (this._ingressNetwork?.members) {
                for (const [prefix] of this._ingressNetwork.members.entries()) {
                    availableEntities.add(prefix);
                    if (prefix) {
                        availableEntities.add(prefix.charAt(0).toUpperCase() + prefix.slice(1));
                    }
                }
            }
            const ownedMap = this.ownedComponents || this.components;
            if (ownedMap && typeof ownedMap.values === 'function') {
                for (const owned of ownedMap.values()) {
                    if (owned?.entityName)
                        availableEntities.add(owned.entityName);
                }
            }
            for (const remote of manifest.dependencies.requiredRemotes) {
                if (remote.targetEntity && !availableEntities.has(remote.targetEntity)) {
                    const payload = {
                        error: 'ERR_KRNL_UNRESOLVED_REMOTE_TARGET',
                        sourceEntity: this.entityName,
                        missingTargetEntity: remote.targetEntity,
                        requiredFid: remote.fid,
                        availableEntities: Array.from(availableEntities)
                    };
                    throw new Error(`[ERR_KRNL_UNRESOLVED_REMOTE_TARGET] Boot validation failed for '${this.entityName}': Target entity '${remote.targetEntity}' required by fid '${remote.fid}' was not found in active system hierarchy. Details: ${JSON.stringify(payload)}`);
                }
            }
        }
        catch (err) {
            if (err.message?.includes('ERR_KRNL_UNRESOLVED_REMOTE_TARGET')) {
                throw err;
            }
            console.warn(`[BootValidation] Warning: could not parse krnl.json at ${this._entityDataDir}: ${err.message}`);
        }
    }
    async startIngressNetwork(members) {
        this._ingressNetwork = new KrnlIngressNetwork();
        for (const config of members) {
            try {
                await this._ingressNetwork.addMember(this, config);
            }
            catch (err) {
                const errMsg = err.message || String(err);
                console.error(`[IngressNetwork] Failed to add subapp '${config.prefix}':`, errMsg);
                this._subappErrors = this._subappErrors || [];
                this._subappErrors.push({
                    subapp: config.prefix,
                    error: errMsg
                });
            }
        }
        // Derive a unique discovery port per instance from commPort offset
        // so that multiple Forge instances on the same machine don't fight over UDP port 10101.
        const discoveryPort = this.commPort > 0 ? this.commPort + 1000 : 10101;
        await this.startDiscovery(discoveryPort);
    }
    async joinIngressNetwork(config) {
        if (!this._ingressNetwork) {
            this._ingressNetwork = new KrnlIngressNetwork();
        }
        return await this._ingressNetwork.addMember(this, config);
    }
    async startCustomFrontend(name, appPath, options) {
        if (!this._ingressNetwork) {
            this._ingressNetwork = new KrnlIngressNetwork();
            const discoveryPort = this.commPort > 0 ? this.commPort + 1000 : 10101;
            await this.startDiscovery(discoveryPort);
        }
        return await this._ingressNetwork.addFrontendMember(this, { name, appPath, options });
    }
    getIngressNetworkTopology() {
        if (!this._ingressNetwork)
            return null;
        const members = Array.from(this._ingressNetwork.members.entries()).map(([prefix, entry]) => ({
            prefix,
            entityName: entry.entity.entityName,
            addedAt: entry.addedAt
        }));
        return {
            admin: this.entityName,
            port: this.commPort,
            members
        };
    }
    /**
     * port — stable public accessor for the active bound port.
     * Mirrors commPort. Resolves to the OS-assigned value after finalizeCommPort().
     * Use this instead of commPort or commComponent.listenPort.
     */
    get port() {
        return this.commPort;
    }
    /**
     * Registers a documentation provider to enable automatic result decoration across all protocols.
     */
    setDocumentationProvider(provider) {
        this._documentationProvider = provider;
    }
    async _decorateResult(result, fid, input) {
        let finalResult = (result && typeof result === 'object' && result.status)
            ? result
            : { status: "success", payload: result };
        if (this._documentationProvider && finalResult.status === "success") {
            if (typeof this._documentationProvider.getNextStepsDoc === 'function') {
                const nextSteps = this._documentationProvider.getNextStepsDoc(fid);
                if (nextSteps && nextSteps.length > 0) {
                    // Store the full doc
                    this._lastPreemptiveDoc = {
                        message: "Progressive Exploration: Recommended next steps.",
                        nextSteps
                    };
                    this._lastErrorDoc = null; // Clear error doc on success
                    // Return concise message
                    finalResult.preemptiveDocumentation = {
                        message: "PREEMPTIVE_DOCS: call('getLastActionDocs'); FULL_DOCS: call('getFullDocumentation');",
                        accessEndpoint: "getLastActionDocs"
                    };
                }
            }
        }
        return finalResult;
    }
    async _decorateError(err, fid, input) {
        const response = {
            status: "error",
            message: err.message || String(err),
            payload: null,
            ...(err.metadata || {})
        };
        if (this._documentationProvider && typeof this._documentationProvider.getDocForEndpoint === 'function') {
            const usageDoc = this._documentationProvider.getDocForEndpoint(fid);
            if (usageDoc) {
                // Store full error doc
                this._lastErrorDoc = usageDoc;
                this._lastPreemptiveDoc = null; // Clear preemptive doc on error
                // Return concise message
                response.errorDocumentation = {
                    message: "ERROR_DOCS: call('getLastActionDocs'); FULL_DOCS: call('getFullDocumentation');",
                    accessEndpoint: "getLastActionDocs"
                };
            }
        }
        return response;
    }
    getNotFoundResponse(path) {
        const response = {
            status: "error",
            message: `Route '${path}' not found.`
        };
        if (this._documentationProvider && typeof this._documentationProvider.getDocsForLayer === 'function') {
            const entryPoints = this._documentationProvider.getDocsForLayer("LAYER_1_ENTRY");
            if (entryPoints && entryPoints.length > 0) {
                response.preemptiveDocumentation = {
                    message: "Welcome! Here is the entry-level documentation.",
                    entryPoints
                };
            }
        }
        return response;
    }
    isDiscoveryAvailable() {
        return typeof window === 'undefined';
    }
    _emitStartupDiagnostics() {
        const diagnostics = {
            event: 'KRNL_STARTUP',
            entity: this.entityName,
            timestamp: Date.now(),
            subsystems: {
                // preferredPort is the constructor hint; actual bound port is set later by finalizeCommPort
                comm: { status: 'pending', preferredPort: this._preferredPort },
                discovery: { status: this.isDiscoveryAvailable() ? 'available' : 'unavailable' }
            },
            flags: this.getSystemFlags(),
            environment: typeof window === 'undefined' ? 'node' : 'browser'
        };
        console.log(`[KRNL_DIAGNOSTICS] ${JSON.stringify(diagnostics)}`);
        Logger.log(`System ${this.entityName} starting diagnostics emitted.`);
    }
    getSystemFlags() {
        return {
            discoverable: this.discoverable,
            busy: this.reservation.busy,
            reservedBy: this.reservation.reservedBy,
            reservedAt: this.reservation.reservedAt,
        };
    }
    setDiscoverable(value) {
        this.discoverable = Boolean(value);
        return this.getSystemFlags();
    }
    // ── Port Registry Methods ────────────────────────────────────────────────
    /**
     * Register a named service port.
     * registerPort(name, p) → portRegistry[name] = p
     * Throws if the port is already claimed by a different service.
     */
    async registerPort(serviceName, port) {
        for (const [existingName, existingPort] of this.portRegistry.entries()) {
            if (existingPort === port && port > 0 && existingName !== serviceName) {
                throw new Error(`[${this.entityName}] Port ${port} is already registered to '${existingName}'.`);
            }
        }
        this.portRegistry.set(serviceName, port);
        await this._writePortsFile();
    }
    /** Remove a service port registration. */
    async unregisterPort(serviceName) {
        if (serviceName === '_krnl_system') {
            throw new Error(`[${this.entityName}] Cannot unregister the system port '_krnl_system'.`);
        }
        this.portRegistry.delete(serviceName);
        await this._writePortsFile();
    }
    /** Return a plain-object snapshot of portRegistry: Record<serviceName, port>. */
    getRegisteredPorts() {
        return Object.fromEntries(this.portRegistry.entries());
    }
    // ── Port Snapshot File ────────────────────────────────────────────────────
    /** Absolute path of the JSON port snapshot co-located with the assembler. */
    _getPortsFilePath() {
        return path.join(this._entityDataDir, `${this.entityName}.ports.json`);
    }
    /**
     * _writePortsFile — persists portRegistry to disk.
     *
     * Only called by finalizeCommPort() — never from constructor state.
     */
    async _writePortsFile() {
        const filePath = this._getPortsFilePath();
        const snapshot = JSON.stringify({
            entity: this.entityName,
            timestamp: new Date().toISOString(),
            ports: this.getRegisteredPorts(),
        }, null, 2);
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }
            // Direct write ensures we don't try to rename a file that was never written
            await fs.promises.writeFile(filePath, snapshot);
        }
        catch (err) {
            Logger.error(`[${this.entityName}] Ports file write failed:`, err);
        }
    }
    /** Remove the ports snapshot file on shutdown. */
    _deletePortsFile() {
        const filePath = this._getPortsFilePath();
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (_) { }
    }
    // ── Port Probe ────────────────────────────────────────────────────────────
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
    async _probeAvailablePort(preferred, host) {
        const cap = Math.min(preferred + 100, 65535);
        for (let port = preferred; port <= cap; port++) {
            const available = await new Promise(resolve => {
                const probe = net.createServer();
                probe.once('error', () => resolve(false));
                probe.listen(port, host, () => probe.close(() => resolve(true)));
            });
            if (available)
                return port;
        }
        throw new Error(`[${this.entityName}] No available port in [${preferred}, ${cap}]. ` +
            `Cannot start server.`);
    }
    // ── Single Source of Truth for Port Assignment ────────────────────────────
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
    async finalizeCommPort(actualPort) {
        this.commPort = actualPort;
        this.commComponent.listenPort = actualPort;
        this.unifiedHttpAdapter.port = actualPort;
        this.portRegistry.set('_krnl_system', actualPort);
        // Write snapshot file and wait for completion before signaling readiness
        await this._writePortsFile();
        // Register with Central Registry (or self-boot if we are on 10099)
        await this._registerWithRegistry(actualPort);
        this._resolveReady();
        Logger.log(`[${this.entityName}] commPort finalized → ${actualPort}`);
    }
    async _registerWithRegistry(actualPort) {
        if (this._isIngressNetworkMember)
            return;
        if (!this._registryClient) {
            const { KrnlRegistryClient } = await import('./K_LIB_Krnl_Registry_Client.js');
            this._registryClient = new KrnlRegistryClient(10099);
        }
        if (actualPort === 10099) {
            // We are the registry server! Enable registry APIs
            console.log(`[${this.entityName}] Self-promoting to central registry host.`);
            this._registryApps = new Map();
            const { registerAppApi, deregisterAppApi, heartbeatAppApi, lookupAppApi, listAppsApi } = await import('./K_LIB_Krnl_System_Base_Functionality_APIs.js');
            this.addLocal({ id: 'registerApp', api: registerAppApi(this) });
            this.addLocal({ id: 'deregisterApp', api: deregisterAppApi(this) });
            this.addLocal({ id: 'heartbeatApp', api: heartbeatAppApi(this) });
            this.addLocal({ id: 'lookupApp', api: lookupAppApi(this) });
            this.addLocal({ id: 'listApps', api: listAppsApi(this) });
            // Evict expired heartbeats loop
            this._registryEvictionInterval = setInterval(() => {
                const now = Date.now();
                for (const [name, app] of this._registryApps.entries()) {
                    if (now - app.lastHeartbeat > 30000) {
                        console.log(`[Registry] Evicting dead app "${name}" (no heartbeat for 30s)`);
                        this._registryApps.delete(name);
                    }
                }
            }, 5000);
            return;
        }
        // Otherwise, we are an app. Register with the registry.
        const registered = await this._registryClient.register(this.entityName, actualPort, typeof process !== 'undefined' ? process.pid : 0);
        if (registered) {
            // Start heartbeat
            if (this._registryHeartbeatInterval)
                clearInterval(this._registryHeartbeatInterval);
            this._registryHeartbeatInterval = setInterval(async () => {
                await this._registryClient.heartbeat(this.entityName);
            }, 10000);
        }
        // Start a long-running safety loop to re-register every 60s
        // (if registry restarts, we refresh our state)
        this._startReRegistrationSafetyLoop(actualPort);
    }
    _startReRegistrationSafetyLoop(actualPort) {
        setInterval(async () => {
            const alive = await this._registryClient.isRegistryAlive();
            if (alive) {
                await this._registryClient.register(this.entityName, actualPort, typeof process !== 'undefined' ? process.pid : 0);
            }
        }, 60000);
    }
    async _deregisterFromRegistry() {
        if (this._registryHeartbeatInterval)
            clearInterval(this._registryHeartbeatInterval);
        if (this._registryEvictionInterval)
            clearInterval(this._registryEvictionInterval);
        if (this.commPort === 10099)
            return; // Registry host shutdown
        if (this._registryClient) {
            try {
                await this._registryClient.deregister(this.entityName);
            }
            catch (_) { }
        }
    }
    // ── Graceful Shutdown ─────────────────────────────────────────────────────
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
    async gracefulShutdown({ timeoutMs = 10_000 } = {}) {
        if (this._shuttingDown)
            return;
        this._shuttingDown = true;
        console.log(`\n[${this.entityName}] ── Graceful shutdown initiated ──`);
        try {
            await this._deregisterFromRegistry();
        }
        catch (_) { }
        // 1. Collect owned microservices
        const owned = this.hierarchyManager.getAllOwnedComponentEntities?.() ?? [];
        // 2. Signal each owned entity and await (parallel, with timeout)
        const shutdownOne = async (child) => {
            const label = child.entityName ?? '(unknown)';
            try {
                if (typeof child.gracefulShutdown === 'function') {
                    await child.gracefulShutdown({ timeoutMs });
                }
                else {
                    child.dispose();
                }
                console.log(`[${this.entityName}] ✓ '${label}' stopped.`);
            }
            catch (err) {
                console.error(`[${this.entityName}] ✗ '${label}' shutdown error: ${err?.message ?? err}`);
            }
        };
        // 2.5 Stop managed processes
        const stopManaged = async () => {
            const stopPromises = [];
            for (const [name, handle] of this._managedServices) {
                if (handle.processHandle && handle.status !== 'stopped') {
                    Logger.log(`[${this.entityName}] Stopping managed service '${name}' (PID: ${handle.pid})...`);
                    handle.processHandle.kill('SIGTERM');
                    handle.status = 'stopped';
                    if (handle.processHandle.promise) {
                        stopPromises.push(handle.processHandle.promise.catch(() => { }));
                    }
                }
            }
            await Promise.all(stopPromises);
        };
        await Promise.race([
            Promise.allSettled([...owned.map(shutdownOne), stopManaged()]),
            new Promise(res => setTimeout(res, timeoutMs)),
        ]);
        // 3. Remove ports snapshot
        this._deletePortsFile();
        // 4. Dispose self
        this.dispose();
        console.log(`[${this.entityName}] ── Shutdown complete ──`);
        // 5. Exit
        if (typeof process !== 'undefined' && process.exit) {
            setTimeout(() => process.exit(0), 100);
        }
    }
    /**
     * shutdown — public alias for gracefulShutdown().
     * Enables clean consumer code: await system.shutdown()
     * No type-casting or feature detection required.
     */
    async shutdown(opts = {}) {
        return this.gracefulShutdown(opts);
    }
    // ── Endpoint Category Helpers ─────────────────────────────────────────────
    /**
     * addInternalEndpoint
     *
     * Registers a functionality accessible ONLY to services whose ports are in
     * the portRegistry (internal microservices). All external ports are forbidden.
     *
     *   policy: allow = [...portRegistry values], default = forbid_unlisted
     */
    addInternalEndpoint(config) {
        const internalPorts = Object.values(this.getRegisteredPorts());
        config.accessPolicy = {
            allow: internalPorts,
            allow_with_key: [],
            forbid: [],
            default_connection_behaviour: 'forbid_unlisted',
        };
        this.addLocal(config);
    }
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
    addExternalEndpoint(config, access = 'free', accessKey) {
        if (access === 'keyed' && !accessKey) {
            throw new Error(`[${this.entityName}] addExternalEndpoint: accessKey is required for 'keyed' endpoints.`);
        }
        config.accessPolicy = {
            allow: [],
            allow_with_key: [],
            forbid: [],
            default_connection_behaviour: access === 'free' ? 'allow_unlisted' : 'ask_key_unlisted',
        };
        if (accessKey)
            config.accessKey = accessKey;
        this.addLocal(config);
    }
    // ── Managed Services ──────────────────────────────────────────────────────
    /**
     * registerManagedService
     * Adds an external process configuration to the system's startup sequence.
     * Services are started in the order they are registered.
     */
    registerManagedService(config) {
        // Check if name is already taken
        if (this._serviceConfigs.some(c => c.name === config.name)) {
            throw new Error(`[${this.entityName}] Managed service '${config.name}' is already registered.`);
        }
        this._serviceConfigs.push(config);
    }
    /**
     * startManagedServices
     * Sequentially launches all registered external processes.
     * Assigns dynamic ports, injects them into process environment, and updates the port registry.
     */
    async startManagedServices() {
        for (const config of this._serviceConfigs) {
            if (this._managedServices.has(config.name))
                continue;
            // 1. Assign dynamic port
            // Start probing from 10000 or the one provided in config env
            const preferred = config.env?.PORT ? parseInt(config.env.PORT) : 10000;
            const assignedPort = await this._probeAvailablePort(preferred, '0.0.0.0');
            // 2. Prepare environment
            const env = {
                ...process.env,
                ...(config.env || {}),
                [config.portEnvVar || 'PORT']: assignedPort.toString()
            };
            Logger.log(`[${this.entityName}] Starting managed service '${config.name}' on port ${assignedPort}...`);
            // 3. Spawn process
            // We use inherit for stdio so child logs appear in the parent terminal
            const handle = KrnlShell.spawn(config.command, config.args || [], {
                cwd: config.cwd,
                env,
                stdio: 'inherit'
            });
            const serviceHandle = {
                config,
                port: assignedPort,
                processHandle: handle,
                pid: handle.pid,
                status: 'starting'
            };
            this._managedServices.set(config.name, serviceHandle);
            // Register in port registry so other entities can find it
            await this.registerPort(config.name, assignedPort);
            // 4. Wait for startup if requested
            if (config.waitForStartup) {
                const timeout = config.startupTimeoutMs || 30000;
                const start = Date.now();
                let ready = false;
                while (Date.now() - start < timeout) {
                    ready = await new Promise(resolve => {
                        const probe = net.connect(assignedPort, '127.0.0.1');
                        probe.on('connect', () => { probe.destroy(); resolve(true); });
                        probe.on('error', () => { resolve(false); });
                    });
                    if (ready)
                        break;
                    // Check if process crashed while waiting
                    if (serviceHandle.status === 'failed')
                        break;
                    await new Promise(r => setTimeout(r, 500));
                }
                if (ready) {
                    serviceHandle.status = 'running';
                    Logger.log(`[${this.entityName}] Managed service '${config.name}' is READY.`);
                }
                else {
                    serviceHandle.status = 'failed';
                    Logger.error(`[${this.entityName}] Managed service '${config.name}' FAILED to start within ${timeout}ms.`);
                }
            }
            else {
                serviceHandle.status = 'running';
            }
            // Listen for unexpected exit
            handle.promise.then(({ code, signal }) => {
                if (serviceHandle.status !== 'stopped') {
                    serviceHandle.status = 'failed';
                    Logger.error(`[${this.entityName}] Managed service '${config.name}' exited unexpectedly (code: ${code}, signal: ${signal})`);
                }
            });
        }
    }
    reserveFor(serviceName = 'unknown') {
        this.reservation = {
            busy: true,
            reservedBy: serviceName,
            reservedAt: Date.now(),
        };
        return this.getSystemFlags();
    }
    releaseReservation(serviceName = null) {
        if (serviceName && this.reservation.reservedBy && this.reservation.reservedBy !== serviceName) {
            throw new Error(`[${this.entityName}] Reservation owned by ${this.reservation.reservedBy}; cannot release as ${serviceName}.`);
        }
        this.reservation = {
            busy: false,
            reservedBy: null,
            reservedAt: null,
        };
        return this.getSystemFlags();
    }
    _assertAvailableForRemoteAccess(requester = null) {
        if (!this.reservation.busy)
            return;
        if (requester && requester === this.reservation.reservedBy)
            return;
        const by = this.reservation.reservedBy || 'another service';
        throw new Error(`[${this.entityName}] Entity is busy/reserved by ${by}.`);
    }
    getManifest() {
        const apiNames = [];
        const eventsNames = [];
        const api = {};
        const serializeSchema = (schema) => {
            if (!schema)
                return undefined;
            try {
                return zodToJsonSchema(schema);
            }
            catch (e) {
                return { type: "custom", message: "Non-Zod or complex schema" };
            }
        };
        const buildFManifest = (f, type, resolved) => {
            const fManifest = {
                id: f.id,
                type,
                method: resolved.method || 'POST',
                visibility: resolved.visibility,
                sourcePath: resolved.sourcePath,
                examples: resolved.examples || f.examples || null,
                example: resolved.example || f.example || null,
                events: []
            };
            if (resolved.intelligenceSpec) {
                fManifest.intelligenceSpec = resolved.intelligenceSpec;
            }
            resolved.emitters.forEach((_, eid) => {
                const eventId = `${f.id}:${eid}`;
                fManifest.events.push(eventId);
                eventsNames.push(eventId);
            });
            if (resolved.schema) {
                fManifest.schema = {};
                if (resolved.schema.input) {
                    fManifest.schema.input = serializeSchema(resolved.schema.input);
                }
                if (resolved.schema.output) {
                    fManifest.schema.output = serializeSchema(resolved.schema.output);
                }
            }
            return fManifest;
        };
        this.localFunctionalities.forEach((f) => {
            api[f.id] = buildFManifest(f, 'local', f);
            apiNames.push(f.id);
        });
        this.remoteFunctionalities.forEach((f) => {
            if (!api[f.id]) {
                const resolved = this.resolveLocalFunctionality(f.id);
                if (resolved) {
                    api[f.id] = buildFManifest(f, 'remote', resolved);
                }
                else {
                    api[f.id] = { id: f.id, type: 'remote' };
                }
                apiNames.push(f.id);
            }
        });
        return {
            entityName: this.entityName,
            systemType: this.systemType,
            flags: this.getSystemFlags(),
            telemetry: this.telemetryEnabled,
            inputs: {
                collectors: this.interface.collectorNames,
                api: api,
            },
            outputs: {
                emitters: this.interface.emitterNames,
                events: eventsNames,
            }
        };
    }
    async startDiscovery(discoveryPort = 10101, discoveryHost = '255.255.255.255') {
        if (this._isIngressNetworkMember || this._isSubApp)
            return;
        if (this.discoverySocket)
            return;
        if (!this.isDiscoveryAvailable()) {
            console.warn(`[${this.entityName}] Discovery: UDP not supported in current environment.`);
            return;
        }
        const dgram = await import('dgram').then(m => m.default || m);
        this.discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.discoverySocket.on('error', (err) => {
            console.warn(`[${this.entityName}] Discovery socket error:`, err.message);
            try {
                if (this.discoverySocket) {
                    this.discoverySocket.close();
                }
            }
            catch (e) { }
            this.discoverySocket = null;
        });
        this.discoverySocket.on('message', (msg, rinfo) => {
            try {
                const data = JSON.parse(msg.toString());
                if (data.type === 'KRNL_REGISTRY_RESTART' && this.commPort !== 10099) {
                    console.log(`[${this.entityName}] Registry restart beacon received. Triggering immediate re-registration.`);
                    this._registerWithRegistry(this.commPort).catch(() => { });
                    return;
                }
                if (data.type === 'KRNL_BEACON' && data.id !== this.entityName) {
                    if (data.discoverable === false) {
                        this.peers.delete(data.id);
                        return;
                    }
                    this.peers.set(data.id, {
                        id: data.id,
                        name: data.id,
                        address: `${rinfo.address}:${data.port}`,
                        busy: Boolean(data.busy),
                        reservedBy: data.reservedBy || null,
                        discoverable: data.discoverable !== false,
                        lastSeen: Date.now()
                    });
                }
            }
            catch (e) { }
        });
        // 255.255.255.255 is not looped back through loopback-bound sockets on most OS stacks.
        // Redirect broadcast target to 127.0.0.1 when the entity is bound to loopback.
        const broadcastTarget = (this.host === '127.0.0.1') ? '127.0.0.1' : discoveryHost;
        try {
            this.discoverySocket.bind(discoveryPort, this.host, () => {
                try {
                    if (this.discoverySocket) {
                        this.discoverySocket.setBroadcast(true);
                        console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${broadcastTarget})`);
                    }
                }
                catch (err) {
                    console.warn(`[${this.entityName}] Discovery setBroadcast failed:`, err.message);
                }
            });
        }
        catch (err) {
            console.warn(`[${this.entityName}] Discovery bind failed:`, err.message);
            this.discoverySocket = null;
        }
        this.beaconInterval = setInterval(async () => {
            if (!this.discoverable)
                return;
            // Wait for port finalization before sending any beacons.
            // This ensures peers receive the authoritative bound port, not the constructor hint.
            await this.whenReady();
            const beacon = JSON.stringify({
                type: 'KRNL_BEACON',
                id: this.entityName,
                port: this.commPort,
                discoverable: this.discoverable,
                busy: this.reservation.busy,
                reservedBy: this.reservation.reservedBy
            });
            if (this.discoverySocket) {
                this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, broadcastTarget);
            }
        }, 5000);
        // If we are the registry, broadcast registry restart beacon immediately to inform listening peers
        if (this.commPort === 10099) {
            await this.whenReady();
            const restartBeacon = JSON.stringify({ type: 'KRNL_REGISTRY_RESTART', port: 10099 });
            if (this.discoverySocket) {
                this.discoverySocket.send(restartBeacon, 0, restartBeacon.length, discoveryPort, broadcastTarget);
            }
        }
        await this._startSharedServer();
    }
    async _startSharedServer() {
        if (this._isIngressNetworkMember)
            return;
        if (this._sharedServer)
            return;
        // ── Port probe: find first bindable port from the preferred hint ──
        const resolvedPort = await this._probeAvailablePort(this._preferredPort, this.host);
        this._sharedServer = http.createServer();
        await this.unifiedHttpAdapter.start(this._sharedServer);
        this.serviceSuites.set("UNIFIED_HTTP", this.unifiedHttpAdapter);
        await this.commComponent.startWsServer(this._sharedServer);
        return new Promise((resolve, reject) => {
            this._sharedServer.listen(resolvedPort, this.host, async () => {
                // Read the port the OS actually bound — the only authoritative source
                const bound = this._sharedServer.address().port;
                // ── Single write barrier: all port state updated here, atomically ──
                await this.finalizeCommPort(bound);
                console.log(`[${this.entityName}] Unified port active on http://${this.host}:${bound} (WS + REST + MCP + ACP)`);
                resolve();
            });
            this._sharedServer.on('error', (err) => {
                console.error(`[${this.entityName}] Failed to start unified server:`, err.message);
                reject(err);
            });
        });
    }
    async activateServiceSuite(suiteName = "UNIFIED_HTTP") {
        return this._startSharedServer();
    }
    listPeers() {
        const now = Date.now();
        for (const [id, peer] of this.peers.entries()) {
            if (now - peer.lastSeen > this.peerTtlMs)
                this.peers.delete(id);
        }
        return Array.from(this.peers.values()).filter((peer) => peer.discoverable !== false);
    }
    getRemoteEntity(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer)
            return null;
        return {
            call: async (fid, data) => {
                return await this.commComponent.callWsRpc(peer.address, 'call', { fid, data });
            }
        };
    }
    async wire(peerId, options) {
        const peer = this.peers.get(peerId);
        if (!peer)
            throw new Error(`Peer ${peerId} not discovered.`);
        if (peer.busy)
            throw new Error(`Peer ${peerId} is reserved by ${peer.reservedBy || 'another service'}.`);
        const { localOutput, remoteInput, remoteOutput, localInput, connectionPolicy = {} } = options;
        if (localOutput && remoteInput) {
            await this.commComponent.wireViaWs(localOutput, peer.address, remoteInput, peer.name, {
                managedBy: connectionPolicy.managedBy || this.entityName,
                externallyMutable: connectionPolicy.externallyMutable !== false,
                metadata: connectionPolicy.metadata || {},
            });
        }
        if (remoteOutput && localInput) {
            await this.commComponent.callWsRpc(peer.address, 'wire-output-to-me', {
                remoteOutput: remoteOutput,
                localInput: localInput,
                myAddress: `${this.host}:${this.commPort}`,
                myName: this.entityName,
                connectionPolicy,
            });
        }
    }
    _setupRpcHandlers() {
        this.commComponent.defineRpc('get-manifest', async () => {
            return this.getManifest();
        });
        this.commComponent.defineRpc('wire-output-to-me', async (params) => {
            const { remoteOutput, localInput, myAddress, myName, connectionPolicy = {} } = params;
            this._assertAvailableForRemoteAccess(myName);
            return await this.commComponent.wireViaWs(remoteOutput, myAddress, localInput, myName, {
                managedBy: connectionPolicy.managedBy || myName,
                externallyMutable: connectionPolicy.externallyMutable !== false,
                metadata: connectionPolicy.metadata || {},
            });
        });
        this.commComponent.defineRpc('call', async ({ fid, data }, { callerPort } = {}) => {
            this._assertAvailableForRemoteAccess(data?.meta?.requester || null);
            return await this.call(fid, data, { callerPort, accessKey: data?.meta?.accessKey });
        });
        this.commComponent.defineRpc('set-entity-flags', async ({ discoverable, busy, reservedBy, requester }) => {
            this._assertAvailableForRemoteAccess(requester || null);
            if (typeof discoverable === 'boolean')
                this.setDiscoverable(discoverable);
            if (typeof busy === 'boolean') {
                if (busy)
                    this.reserveFor(reservedBy || requester || 'unknown');
                else
                    this.releaseReservation(requester || null);
            }
            return this.getSystemFlags();
        });
        this.commComponent.defineRpc('list-routes', async () => {
            return this.commComponent.listRoutes();
        });
        this.commComponent.defineRpc('disconnect-route', async ({ routeId, requester, force = false }) => {
            this._assertAvailableForRemoteAccess(requester || null);
            this.commComponent.disconnectRoute(routeId, { requester, force });
            return { ok: true, routeId };
        });
        this.commComponent.defineRpc('connect-to-target', async ({ sourceEmitter, targetAddress, targetCollector, targetName, requester, connectionPolicy = {} }) => {
            this._assertAvailableForRemoteAccess(requester || null);
            return await this.commComponent.wireViaWs(sourceEmitter, targetAddress, targetCollector, targetName, {
                managedBy: connectionPolicy.managedBy || requester || this.entityName,
                externallyMutable: connectionPolicy.externallyMutable !== false,
                metadata: connectionPolicy.metadata || {},
            });
        });
    }
    _setupBaseFunctionalities() {
        this.addLocal({
            id: 'heartbeat',
            api: heartbeatApi(this),
            emitters: { status: {} }
        });
        this.addLocal({
            id: 'getTelemetry',
            api: telemetryApi(this)
        });
        this.addLocal({
            id: 'adminCommand',
            api: adminCommandApi(this)
        });
        this.addLocal({
            id: 'discoverPeers',
            api: discoverPeersApi(this)
        });
        this.addLocal({
            id: 'getManifest',
            api: manifestApi(this)
        });
        this.addLocal({
            id: 'getLastActionDocs',
            api: getLastActionDocsApi(this)
        });
        this.addLocal({
            id: 'getFullDocumentation',
            api: getFullDocumentationApi(this)
        });
        this.addLocal({
            id: 'getUsedPorts',
            api: getUsedPortsApi(this)
        });
        this.addLocal({
            id: 'findFreePorts',
            api: findFreePortsApi(this)
        });
        this.addLocal({
            id: 'shutdown',
            description: 'Gracefully shut down all owned microservices then self. Responds immediately; shutdown runs async.',
            api: shutdownApi(this),
        });
        this.addLocal({
            id: 'getIngressNetworkTopology',
            api: getIngressNetworkTopologyApi(this)
        });
        this.addLocal({
            id: 'getEndpointDefinitions',
            description: 'Aggregates and returns the full definitions of all endpoints in the system.',
            api: getEndpointDefinitionsApi(this)
        });
        this.addLocal({
            id: 'setEndpointDefinition',
            description: 'Sets and persists runtime config overrides for an endpoint.',
            api: setEndpointDefinitionApi(this)
        });
        this.addLocal({
            id: 'getTelemetryLog',
            description: 'Retrieves historical telemetry traces from the persistent store.',
            api: getTelemetryLogApi(this)
        });
        this.addLocal({
            id: 'getAikoCatalog',
            description: 'Retrieves the cached or live agent profiles catalog from Aiko.',
            api: getAikoCatalogApi(this)
        });
        this.addLocal({
            id: 'ai',
            description: 'Natural language gateway — routes to correct endpoint agent via Aiko.',
            api: aiOrchestrationApi(this)
        });
        this.addLocal({
            id: 'getTaskList',
            description: 'Retrieves current task list and status from the orchestrator.',
            api: getTaskListApi(this)
        });
    }
    isAikoAlive() {
        const aikoPeer = this.peers.get('Aiko');
        if (!aikoPeer)
            return false;
        const TTL = 35000; // 35 seconds TTL
        return (Date.now() - aikoPeer.lastSeen) < TTL;
    }
    async initializeAiLayer(appRoot) {
        try {
            this._aiProfilesStore = new KrnlRuntimeStore(appRoot);
            await this._aiProfilesStore.load();
            // Set runtime store in telemetry
            import('./K_LIB_Krnl_Telemetry.js').then(({ telemetry }) => {
                if (typeof telemetry.setRuntimeStore === "function") {
                    telemetry.setRuntimeStore(this._aiProfilesStore);
                }
            }).catch(() => { });
            // Setup client. Fallback to localhost:10095 if not discovered passively
            this._aikoClient = KrnlAikoClient.discover(this) || new KrnlAikoClient(10095);
            // Passive availability check
            const aikoActive = this.isAikoAlive() || await this._aikoClient.isAlive();
            if (!aikoActive) {
                console.warn(`[KrnlTS AI] ${KrnlAikoClient.getNotRunningMessage()}`);
            }
            else {
                try {
                    this._aikoCatalog = await this._aikoClient.fetchCatalog();
                }
                catch (e) {
                    console.warn("[KrnlTS AI] Failed to fetch profile catalog from Aiko:", e);
                }
            }
            this._aiTracker = new KrnlWatchVariablesTracker();
            this._aiScheduler = new KrnlEndpointScheduler(this._aiTracker);
            const overrides = await this._aiProfilesStore.getAllEndpointDefinitions();
            const aiEndpoints = new Map();
            const { buildEndpointDefinition } = await import('./K_LIB_Krnl_System_Base_Functionality_APIs.js');
            const { KrnlEpTools } = await import('./K_LIB_Krnl_Ep_Tools.js');
            // Scan and match AI-enabled functionalities
            for (const [fid, fn] of this.localFunctionalities.entries()) {
                if (fid === 'ai' || fid === 'setEndpointDefinition' || fid === 'getEndpointDefinitions' || fid === 'getTelemetryLog' || fid === 'getAikoCatalog')
                    continue;
                const override = overrides[fid] || null;
                const isEnabled = override?.intelligenceSpec || fn.ai?.enabled || fn.ai;
                if (!isEnabled)
                    continue;
                const mem = await this._aiProfilesStore.getEndpointMemory(fid);
                const definition = buildEndpointDefinition(fn, this, override, mem);
                this._aiTracker.register(fid, definition, fn);
                const mergedTools = {};
                if (definition.agentTools && Array.isArray(definition.agentTools)) {
                    const addAllBuiltins = definition.agentTools.includes('*');
                    if (addAllBuiltins) {
                        Object.assign(mergedTools, KrnlEpTools);
                    }
                    for (const toolId of definition.agentTools) {
                        if (toolId === '*')
                            continue;
                        if (KrnlEpTools[toolId]) {
                            mergedTools[toolId] = KrnlEpTools[toolId];
                        }
                        else if (this.localFunctionalities.has(toolId) || this.remoteFunctionalities.has(toolId)) {
                            mergedTools[toolId] = {
                                id: toolId,
                                description: `Calls the sibling endpoint '${toolId}'.`,
                                execute: async (payload) => {
                                    return await this.call(toolId, payload, { unwrap: true });
                                }
                            };
                        }
                    }
                }
                const agent = new KrnlEndpointAgent(definition, this._aikoClient, this._aiTracker, this, mergedTools);
                aiEndpoints.set(fid, agent);
            }
            // Configure Orchestrator
            const defaultRoutingSpec = {
                reasoning: 5, planning: 3, toolUsage: 1, structuredOutput: 5, jsonStrictness: 5,
                coding: 1, extraction: 3, classification: 8, summarization: 2, creativity: 1,
                determinism: 7, context: 4, vision: 1, multimodal: 1, outputComplexity: 2
            };
            const defaultEscalationSpec = {
                reasoning: 8, planning: 6, toolUsage: 2, structuredOutput: 8, jsonStrictness: 8,
                coding: 2, extraction: 5, classification: 6, summarization: 4, creativity: 2,
                determinism: 8, context: 6, vision: 2, multimodal: 2, outputComplexity: 6
            };
            const routingSpec = this._aiRoutingSpec || defaultRoutingSpec;
            const escalationSpec = this._aiEscalationSpec || defaultEscalationSpec;
            this._aiOrchestrator = new KrnlApplicationOrchestrator(this, this._aikoClient, this._aiTracker, this._aiScheduler, routingSpec, escalationSpec, this._aiProfilesStore);
            for (const [fid, agent] of aiEndpoints.entries()) {
                this._aiOrchestrator.registerAgent(fid, agent);
            }
            console.log(`[KrnlTS AI] Initialized: ${aiEndpoints.size} endpoint agents connected.`);
        }
        catch (e) {
            console.error("[KrnlTS AI] Failed to initialize AI Layer:", e.message);
        }
    }
    _setupBaseInterface() {
        this.interface.createEmitter('system-events');
        this.interface.createCollector('system-commands');
        this._attachCollectorHandler('system-commands', systemCommandsCollectorHandler(this));
    }
    _attachCollectorHandler(collectorName, handler) {
        const collector = this.interface.getCollector(collectorName);
        collector._directHandler = handler;
    }
    bindProcessSignals() {
        if (typeof process === 'undefined' || !process.on)
            return;
        process.on('SIGINT', () => {
            console.log(`\n[${this.entityName}] SIGINT received.`);
            this.gracefulShutdown().catch(() => process.exit(1));
        });
        process.on('SIGTERM', () => {
            console.log(`\n[${this.entityName}] SIGTERM received.`);
            this.gracefulShutdown().catch(() => process.exit(1));
        });
        process.on('SIGHUP', () => {
            console.log(`[${this.entityName}] SIGHUP received. Ignoring to maintain background persistence.`);
        });
        process.on('uncaughtException', (err) => {
            Logger.error(`UNCAUGHT EXCEPTION in ${this.entityName}:`, err);
            this.gracefulShutdown({ timeoutMs: 3000 }).catch(() => process.exit(1));
        });
        process.on('unhandledRejection', (reason) => {
            Logger.error(`UNHANDLED REJECTION in ${this.entityName}:`, reason);
            this.gracefulShutdown({ timeoutMs: 3000 }).catch(() => process.exit(1));
        });
        process.on('exit', (code) => {
            console.log(`[${this.entityName}] Process exiting with code: ${code}`);
        });
    }
    dispose() {
        this._deletePortsFile();
        if (this.beaconInterval)
            clearInterval(this.beaconInterval);
        if (this.discoverySocket)
            this.discoverySocket.close();
        // Kill managed processes if not already stopped
        for (const [name, handle] of this._managedServices) {
            if (handle.processHandle && handle.status !== 'stopped') {
                Logger.log(`[${this.entityName}] Force killing managed service '${name}' (PID: ${handle.pid})...`);
                handle.processHandle.kill('SIGKILL');
            }
        }
        this._managedServices.clear();
        for (const [name, suite] of this.serviceSuites) {
            suite.stop();
        }
        this.serviceSuites.clear();
        if (this._sharedServer) {
            this._sharedServer.close();
            this._sharedServer = null;
        }
        this.commComponent.dispose();
        super.dispose();
    }
}
//# sourceMappingURL=K_ENT_Krnl_System_Entity_Base.js.map