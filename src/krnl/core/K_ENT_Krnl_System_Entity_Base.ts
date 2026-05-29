//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_System_Entity_Base.ts
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */

import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import { krnlSystemCommComponent } from "./K_LIB_Krnl_System_Comm_Component.js";
import {
  adminCommandApi,
  discoverPeersApi,
  heartbeatApi,
  getManifestApi as manifestApi,
  getLastActionDocsApi,
  getFullDocumentationApi,
  systemCommandsCollectorHandler,
  telemetryApi,
  getUsedPortsApi,
  findFreePortsApi,
  shutdownApi,
} from "./K_LIB_Krnl_System_Base_Functionality_APIs.js";
import { Logger } from "./K_LIB_Krnl_Base_Concepts.js";
import { krnlUnifiedHttpAdapter } from "./K_LIB_Krnl_System_Unified_Http_Adapter.js";
import { KrnlShell } from "../tools/KrnlShell.js";
import { 
  KrnlManagedServiceConfig, 
  KrnlManagedServiceHandle 
} from "./types.js";
import http from 'http';
import net  from 'net';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { zodToJsonSchema } from 'zod-to-json-schema';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// KRNL SYSTEM ENTITY BASE ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

export class krnlSystemEntityBase extends krnlEntityBase {
  systemType: string;
  peers: Map<string, any>;
  discoverable: boolean;
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
  _lastPreemptiveDoc: any | null = null;
  _lastErrorDoc: any | null = null;
  discoverySocket: any | null;
  beaconInterval: any | null;
  /** portRegistry: serviceName → port  (P_local ⊆ ℕ) */
  portRegistry: Map<string, number>;
  /** Registered service configurations for external processes. */
  _serviceConfigs: KrnlManagedServiceConfig[] = [];
  /** Active handles for managed services. */
  _managedServices: Map<string, KrnlManagedServiceHandle> = new Map();
  /**
   * _preferredPort — the port hint supplied at construction.
   * Write-once. Never published externally. The actual bound port is commPort
   * (set by finalizeCommPort after a successful server.listen()).
   */
  _preferredPort: number;
  /** Directory where {entityName}.ports.json is written. */
  _entityDataDir: string;
  /** True once gracefulShutdown has been triggered — prevents re-entry. */
  _shuttingDown: boolean = false;
  /** 
   * Internal readiness signaling. 
   * Resolves after _startSharedServer successfully binds and finalizeCommPort is called.
   */
  private _readyPromise: Promise<void>;
  private _resolveReady!: () => void;

  /**
   * @param name
   * @param owner
   * @param commPort - WS listen port for the commComponent.
   * @param host - Interface to bind to.
   * @param options - Entity options.
   */
  constructor(name: string, owner: krnlEntityBase | null = null, commPort: number = 10099, host: string = '0.0.0.0', options: any = {}) {
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

    // ── Readiness State ───────────────────────────────────────────────
    this._readyPromise = new Promise((resolve) => {
      this._resolveReady = resolve;
    });

    // ── Uniform P2P communication bridge ──────────────────────────────
    this.commPort = commPort;
    this.host = host;
    this.commComponent = new krnlSystemCommComponent(this as any, commPort, host);

    this._setupBaseFunctionalities();
    this._setupBaseInterface();
    this._setupRpcHandlers();
    
    this._sharedServer = null;
    this.serviceSuites = new Map(); // suiteName -> adapterInstance
    // Pre-initialize the unified HTTP adapter (always-on)
    this.unifiedHttpAdapter = new krnlUnifiedHttpAdapter(this as any, commPort, host);

    // ── Port Registry ─────────────────────────────────────────────────
    // portRegistry is intentionally EMPTY at construction time.
    // _krnl_system is only added by finalizeCommPort() after the server
    // has successfully bound to an OS port.  This prevents snapshot drift.
    this.portRegistry   = new Map<string, number>();
    this._preferredPort = commPort;   // hint — never written to portRegistry directly

    // ── Data directory for port snapshot file ─────────────────────────
    // Pass options.sourcePath = import.meta.url (ESM) or __filename (CJS)
    // from the assembler to co-locate {entityName}.ports.json with the app.
    let dataDir = process.cwd();
    if (options.sourcePath) {
      try {
        const resolved = (options.sourcePath as string).startsWith('file:')
          ? fileURLToPath(options.sourcePath)
          : options.sourcePath;
        dataDir = path.dirname(resolved);
      } catch (_) { /* fall back to cwd */ }
    }
    this._entityDataDir = dataDir;

    // ── Protocol Unification & Decoration ──────────────────────────────
    this._documentationProvider = null;

    // ── Startup Diagnostics ──────────────────────────────
    this._emitStartupDiagnostics();
  }

  /**
   * whenReady
   * Await this promise to ensure the system has bound to its final port,
   * written its snapshot file, and is fully operational.
   */
  async whenReady(): Promise<void> {
    return this._readyPromise;
  }

  /**
   * Registers a documentation provider to enable automatic result decoration across all protocols.
   */
  setDocumentationProvider(provider: any): void {
    this._documentationProvider = provider;
  }

  async _decorateResult(result: any, fid: string, input: any): Promise<any> {
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

  async _decorateError(err: any, fid: string, input: any): Promise<any> {
    const response: any = {
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

  getNotFoundResponse(path: string): any {
    const response: any = {
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

  isDiscoveryAvailable(): boolean {
    return typeof window === 'undefined';
  }

  _emitStartupDiagnostics(): void {
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

  setDiscoverable(value: boolean) {
    this.discoverable = Boolean(value);
    return this.getSystemFlags();
  }

  // ── Port Registry Methods ────────────────────────────────────────────────

  /**
   * Register a named service port.
   * registerPort(name, p) → portRegistry[name] = p
   * Throws if the port is already claimed by a different service.
   */
  async registerPort(serviceName: string, port: number): Promise<void> {
    for (const [existingName, existingPort] of this.portRegistry.entries()) {
      if (existingPort === port && existingName !== serviceName) {
        throw new Error(
          `[${this.entityName}] Port ${port} is already registered to '${existingName}'.`
        );
      }
    }
    this.portRegistry.set(serviceName, port);
    await this._writePortsFile();
  }

  /** Remove a service port registration. */
  async unregisterPort(serviceName: string): Promise<void> {
    if (serviceName === '_krnl_system') {
      throw new Error(`[${this.entityName}] Cannot unregister the system port '_krnl_system'.`);
    }
    this.portRegistry.delete(serviceName);
    await this._writePortsFile();
  }

  /** Return a plain-object snapshot of portRegistry: Record<serviceName, port>. */
  getRegisteredPorts(): Record<string, number> {
    return Object.fromEntries(this.portRegistry.entries());
  }

  // ── Port Snapshot File ────────────────────────────────────────────────────

  /** Absolute path of the JSON port snapshot co-located with the assembler. */
  _getPortsFilePath(): string {
    return path.join(this._entityDataDir, `${this.entityName}.ports.json`);
  }

  /**
   * _writePortsFile — persists portRegistry to disk.
   *
   * Only called by finalizeCommPort() — never from constructor state.
   */
  async _writePortsFile(): Promise<void> {
    const filePath = this._getPortsFilePath();
    const snapshot = JSON.stringify({
      entity:    this.entityName,
      timestamp: new Date().toISOString(),
      ports:     this.getRegisteredPorts(),
    }, null, 2);

    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      // Direct write ensures we don't try to rename a file that was never written
      await fs.promises.writeFile(filePath, snapshot);
    } catch (err) {
      Logger.error(`[${this.entityName}] Ports file write failed:`, err);
    }
  }

  /** Remove the ports snapshot file on shutdown. */
  _deletePortsFile(): void {
    const filePath = this._getPortsFilePath();
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_) {}
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
  async _probeAvailablePort(preferred: number, host: string): Promise<number> {
    const cap = Math.min(preferred + 100, 65535);
    for (let port = preferred; port <= cap; port++) {
      const available = await new Promise<boolean>(resolve => {
        const probe = net.createServer();
        probe.once('error', () => resolve(false));
        probe.listen(port, host, () => probe.close(() => resolve(true)));
      });
      if (available) return port;
    }
    throw new Error(
      `[${this.entityName}] No available port in [${preferred}, ${cap}]. ` +
      `Cannot start server.`
    );
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
  async finalizeCommPort(actualPort: number): Promise<void> {
    this.commPort                   = actualPort;
    this.commComponent.listenPort   = actualPort;
    this.unifiedHttpAdapter.port    = actualPort;
    this.portRegistry.set('_krnl_system', actualPort);
    
    // Write snapshot file and wait for completion before signaling readiness
    await this._writePortsFile();
    
    this._resolveReady();
    Logger.log(`[${this.entityName}] commPort finalized → ${actualPort}`);
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
  async gracefulShutdown({ timeoutMs = 10_000 }: { timeoutMs?: number } = {}): Promise<void> {
    if (this._shuttingDown) return;
    this._shuttingDown = true;

    console.log(`\n[${this.entityName}] ── Graceful shutdown initiated ──`);

    // 1. Collect owned microservices
    const owned: any[] = (this as any).hierarchyManager.getAllOwnedComponentEntities?.() ?? [];

    // 2. Signal each owned entity and await (parallel, with timeout)
    const shutdownOne = async (child: any) => {
      const label = child.entityName ?? '(unknown)';
      try {
        if (typeof child.gracefulShutdown === 'function') {
          await child.gracefulShutdown({ timeoutMs });
        } else {
          child.dispose();
        }
        console.log(`[${this.entityName}] ✓ '${label}' stopped.`);
      } catch (err: any) {
        console.error(`[${this.entityName}] ✗ '${label}' shutdown error: ${err?.message ?? err}`);
      }
    };

    // 2.5 Stop managed processes
    const stopManaged = async () => {
      for (const [name, handle] of this._managedServices) {
        if (handle.processHandle && handle.status !== 'stopped') {
          Logger.log(`[${this.entityName}] Stopping managed service '${name}' (PID: ${handle.pid})...`);
          handle.processHandle.kill('SIGTERM');
          handle.status = 'stopped';
        }
      }
    };

    await Promise.race([
      Promise.allSettled([...owned.map(shutdownOne), stopManaged()]),
      new Promise<void>(res => setTimeout(res, timeoutMs)),
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

  // ── Endpoint Category Helpers ─────────────────────────────────────────────

  /**
   * addInternalEndpoint
   *
   * Registers a functionality accessible ONLY to services whose ports are in
   * the portRegistry (internal microservices). All external ports are forbidden.
   *
   *   policy: allow = [...portRegistry values], default = forbid_unlisted
   */
  addInternalEndpoint(config: any): void {
    const internalPorts = Object.values(this.getRegisteredPorts()) as number[];
    config.accessPolicy = {
      allow:                      internalPorts,
      allow_with_key:             [],
      forbid:                     [],
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
  addExternalEndpoint(config: any, access: 'free' | 'keyed' = 'free', accessKey?: string): void {
    if (access === 'keyed' && !accessKey) {
      throw new Error(`[${this.entityName}] addExternalEndpoint: accessKey is required for 'keyed' endpoints.`);
    }
    config.accessPolicy = {
      allow:                      [],
      allow_with_key:             [],
      forbid:                     [],
      default_connection_behaviour: access === 'free' ? 'allow_unlisted' : 'ask_key_unlisted',
    };
    if (accessKey) config.accessKey = accessKey;
    this.addLocal(config);
  }

  // ── Managed Services ──────────────────────────────────────────────────────

  /**
   * registerManagedService
   * Adds an external process configuration to the system's startup sequence.
   * Services are started in the order they are registered.
   */
  registerManagedService(config: KrnlManagedServiceConfig): void {
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
  async startManagedServices(): Promise<void> {
    for (const config of this._serviceConfigs) {
      if (this._managedServices.has(config.name)) continue;

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

      const serviceHandle: KrnlManagedServiceHandle = {
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
          ready = await new Promise<boolean>(resolve => {
            const probe = net.connect(assignedPort, '127.0.0.1');
            probe.on('connect', () => { probe.destroy(); resolve(true); });
            probe.on('error', () => { resolve(false); });
          });

          if (ready) break;
          // Check if process crashed while waiting
          if (serviceHandle.status === 'failed') break;
          
          await new Promise(r => setTimeout(r, 500));
        }

        if (ready) {
          serviceHandle.status = 'running';
          Logger.log(`[${this.entityName}] Managed service '${config.name}' is READY.`);
        } else {
          serviceHandle.status = 'failed';
          Logger.error(`[${this.entityName}] Managed service '${config.name}' FAILED to start within ${timeout}ms.`);
        }
      } else {
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

  reserveFor(serviceName: string = 'unknown') {
    this.reservation = {
      busy: true,
      reservedBy: serviceName,
      reservedAt: Date.now(),
    };
    return this.getSystemFlags();
  }

  releaseReservation(serviceName: string | null = null) {
    if (serviceName && this.reservation.reservedBy && this.reservation.reservedBy !== serviceName) {
      throw new Error(
        `[${this.entityName}] Reservation owned by ${this.reservation.reservedBy}; cannot release as ${serviceName}.`
      );
    }
    this.reservation = {
      busy: false,
      reservedBy: null,
      reservedAt: null,
    };
    return this.getSystemFlags();
  }

  _assertAvailableForRemoteAccess(requester: string | null = null) {
    if (!this.reservation.busy) return;
    if (requester && requester === this.reservation.reservedBy) return;
    const by = this.reservation.reservedBy || 'another service';
    throw new Error(`[${this.entityName}] Entity is busy/reserved by ${by}.`);
  }

  getManifest() {
    const apiNames: string[] = [];
    const eventsNames: string[] = [];
    const api: any = {};

    const serializeSchema = (schema: any) => {
      if (!schema) return undefined;
      try {
        return zodToJsonSchema(schema);
      } catch (e) {
        return { type: "custom", message: "Non-Zod or complex schema" };
      }
    };

    const buildFManifest = (f: any, type: 'local' | 'remote', resolved: any) => {
      const fManifest: any = {
        id: f.id,
        type,
        visibility: resolved.visibility,
        sourcePath: resolved.sourcePath, 
        events: [] 
      };
      resolved.emitters.forEach((_: any, eid: string) => {
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

    this.localFunctionalities.forEach((f: any) => {
      api[f.id] = buildFManifest(f, 'local', f);
      apiNames.push(f.id);
    });

    this.remoteFunctionalities.forEach((f: any) => {
      if (!api[f.id]) {
        const resolved = (this as any).resolveLocalFunctionality(f.id);
        if (resolved) {
          api[f.id] = buildFManifest(f, 'remote', resolved);
        } else {
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
        collectors: (this.interface as any).collectorNames,
        api: api,
      },
      outputs: {
        emitters: (this.interface as any).emitterNames,
        events: eventsNames,
      }
    };
  }

  async startDiscovery(discoveryPort: number = 10101, discoveryHost: string = '255.255.255.255'): Promise<void> {
    if (this.discoverySocket) return; 
    
    if (!this.isDiscoveryAvailable()) {
      console.warn(`[${this.entityName}] Discovery: UDP not supported in current environment.`);
      return;
    }

    const dgram = await import('dgram').then(m => m.default || m);
    this.discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.discoverySocket.on('message', (msg: Buffer, rinfo: any) => {
      try {
        const data = JSON.parse(msg.toString());
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
      } catch (e) { }
    });

    this.discoverySocket.bind(discoveryPort, this.host, () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${discoveryHost})`);
    });

    this.beaconInterval = setInterval(async () => {
      if (!this.discoverable) return;
      
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
        this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, discoveryHost);
      }
    }, 5000);

    await this._startSharedServer();
  }

  async _startSharedServer(): Promise<void> {
    if (this._sharedServer) return;

    // ── Port probe: find first bindable port from the preferred hint ──
    const resolvedPort = await this._probeAvailablePort(this._preferredPort, this.host);

    this._sharedServer = http.createServer();

    await this.unifiedHttpAdapter.start(this._sharedServer);
    this.serviceSuites.set("UNIFIED_HTTP", this.unifiedHttpAdapter);

    await this.commComponent.startWsServer(this._sharedServer);

    return new Promise((resolve, reject) => {
      this._sharedServer!.listen(resolvedPort, this.host, async () => {
        // Read the port the OS actually bound — the only authoritative source
        const bound = (this._sharedServer!.address() as net.AddressInfo).port;

        // ── Single write barrier: all port state updated here, atomically ──
        await this.finalizeCommPort(bound);

        console.log(`[${this.entityName}] Unified port active on http://${this.host}:${bound} (WS + REST + MCP + ACP)`);
        resolve();
      });
      this._sharedServer!.on('error', (err: any) => {
        console.error(`[${this.entityName}] Failed to start unified server:`, err.message);
        reject(err);
      });
    });
  }

  async activateServiceSuite(suiteName: string = "UNIFIED_HTTP"): Promise<void> {
    return this._startSharedServer();
  }

  listPeers(): any[] {
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > this.peerTtlMs) this.peers.delete(id);
    }
    return Array.from(this.peers.values()).filter((peer) => peer.discoverable !== false);
  }

  getRemoteEntity(peerId: string): any {
    const peer = this.peers.get(peerId);
    if (!peer) return null;
    return {
      call: async (fid: string, data: any) => {
        return await this.commComponent.callWsRpc(peer.address, 'call', { fid, data });
      }
    };
  }

  async wire(peerId: string, options: any): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    if (peer.busy) throw new Error(`Peer ${peerId} is reserved by ${peer.reservedBy || 'another service'}.`);

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

  _setupRpcHandlers(): void {
    this.commComponent.defineRpc('get-manifest', async () => {
      return this.getManifest();
    });

    this.commComponent.defineRpc('wire-output-to-me', async (params: any) => {
      const { remoteOutput, localInput, myAddress, myName, connectionPolicy = {} } = params;
      this._assertAvailableForRemoteAccess(myName);
      return await this.commComponent.wireViaWs(remoteOutput, myAddress, localInput, myName, {
        managedBy: connectionPolicy.managedBy || myName,
        externallyMutable: connectionPolicy.externallyMutable !== false,
        metadata: connectionPolicy.metadata || {},
      });
    });

    this.commComponent.defineRpc('call', async ({ fid, data }: any, { callerPort }: any = {}) => {
      this._assertAvailableForRemoteAccess(data?.meta?.requester || null);
      return await this.call(fid, data, { callerPort, accessKey: data?.meta?.accessKey });
    });

    this.commComponent.defineRpc('set-entity-flags', async ({ discoverable, busy, reservedBy, requester }: any) => {
      this._assertAvailableForRemoteAccess(requester || null);
      if (typeof discoverable === 'boolean') this.setDiscoverable(discoverable);
      if (typeof busy === 'boolean') {
        if (busy) this.reserveFor(reservedBy || requester || 'unknown');
        else this.releaseReservation(requester || null);
      }
      return this.getSystemFlags();
    });

    this.commComponent.defineRpc('list-routes', async () => {
      return this.commComponent.listRoutes();
    });

    this.commComponent.defineRpc('disconnect-route', async ({ routeId, requester, force = false }: any) => {
      this._assertAvailableForRemoteAccess(requester || null);
      this.commComponent.disconnectRoute(routeId, { requester, force });
      return { ok: true, routeId };
    });

    this.commComponent.defineRpc('connect-to-target', async ({ sourceEmitter, targetAddress, targetCollector, targetName, requester, connectionPolicy = {} }: any) => {
      this._assertAvailableForRemoteAccess(requester || null);
      return await this.commComponent.wireViaWs(sourceEmitter, targetAddress, targetCollector, targetName, {
        managedBy: connectionPolicy.managedBy || requester || this.entityName,
        externallyMutable: connectionPolicy.externallyMutable !== false,
        metadata: connectionPolicy.metadata || {},
      });
    });
  }

  _setupBaseFunctionalities(): void {
    this.addLocal({
      id: 'heartbeat',
      api: heartbeatApi(this as any),
      emitters: { status: {} }
    });

    this.addLocal({
      id: 'getTelemetry',
      api: telemetryApi(this as any)
    });

    this.addLocal({
      id: 'adminCommand',
      api: adminCommandApi(this as any)
    });

    this.addLocal({
      id: 'discoverPeers',
      api: discoverPeersApi(this as any)
    });

    this.addLocal({
      id: 'getManifest',
      api: manifestApi(this as any)
    });

    this.addLocal({
      id: 'getLastActionDocs',
      api: getLastActionDocsApi(this as any)
    });

    this.addLocal({
      id: 'getFullDocumentation',
      api: getFullDocumentationApi(this as any)
    });

    this.addLocal({
      id: 'getUsedPorts',
      api: getUsedPortsApi(this as any)
    });

    this.addLocal({
      id: 'findFreePorts',
      api: findFreePortsApi(this as any)
    });

    this.addLocal({
      id: 'shutdown',
      description: 'Gracefully shut down all owned microservices then self. Responds immediately; shutdown runs async.',
      api: shutdownApi(this as any),
    });
  }

  _setupBaseInterface(): void {
    this.interface.createEmitter('system-events');
    this.interface.createCollector('system-commands');
    this._attachCollectorHandler('system-commands', systemCommandsCollectorHandler(this as any));
  }

  _attachCollectorHandler(collectorName: string, handler: any): void {
    const collector = (this.interface as any).getCollector(collectorName);
    collector._directHandler = handler;
  }

  bindProcessSignals(): void {
    if (typeof process === 'undefined' || !process.on) return;

    process.on('SIGINT',  () => {
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

  dispose(): void {
    this._deletePortsFile();
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.discoverySocket) this.discoverySocket.close();

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
