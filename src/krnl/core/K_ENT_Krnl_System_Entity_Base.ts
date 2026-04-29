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
  manifestApi,
  systemCommandsCollectorHandler,
  telemetryApi,
} from "./K_LIB_Krnl_System_Base_Functionality_APIs.js";
import { Logger } from "./K_LIB_Krnl_Base_Concepts.js";
import { krnlUnifiedHttpAdapter } from "./K_LIB_Krnl_System_Unified_Http_Adapter.js";
import http from 'http';
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
  discoverySocket: any | null;
  beaconInterval: any | null;

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

    // ── Protocol Unification & Decoration ──────────────────────────────
    this._documentationProvider = null;

    // ── Startup Diagnostics ──────────────────────────────
    this._emitStartupDiagnostics();
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
        finalResult.preemptiveDocumentation = {
          message: "Progressive Exploration: Recommended next steps.",
          nextSteps
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
      if (usageDoc) response.errorDocumentation = usageDoc;
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
        comm: { status: 'active', port: this.commPort },
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

    this.localFunctionalities.forEach((f: any) => {
      const fManifest: any = {
        id: f.id,
        type: 'local',
        visibility: f.visibility,
        sourcePath: f.sourcePath, 
        events: [] 
      };
      f.emitters.forEach((_: any, eid: string) => {
        const eventId = `${f.id}:${eid}`;
        fManifest.events.push(eventId);
        eventsNames.push(eventId);
      });

      if (f.schema) {
        fManifest.schema = {};
        if (f.schema.input) {
          try {
            fManifest.schema.input = zodToJsonSchema(f.schema.input);
          } catch (e) {
             fManifest.schema.input = { type: "custom", message: "Non-Zod or complex schema" };
          }
        }
        if (f.schema.output) {
          try {
            fManifest.schema.output = zodToJsonSchema(f.schema.output);
          } catch (e) {
            fManifest.schema.output = { type: "custom", message: "Non-Zod or complex schema" };
          }
        }
      }

      api[f.id] = fManifest;
      apiNames.push(f.id);
    });

    this.remoteFunctionalities.forEach((f: any) => {
      if (!api[f.id]) {
        api[f.id] = { id: f.id, type: 'remote' };
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

    this.beaconInterval = setInterval(() => {
      if (!this.discoverable) return;
      const beacon = JSON.stringify({
        type: 'KRNL_BEACON',
        id: this.entityName,
        port: this.commPort,
        discoverable: this.discoverable,
        busy: this.reservation.busy,
        reservedBy: this.reservation.reservedBy
      });
      this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, discoveryHost);
    }, 5000);

    await this._startSharedServer();
  }

  async _startSharedServer(): Promise<void> {
    if (this._sharedServer) return;

    this._sharedServer = http.createServer();

    await this.unifiedHttpAdapter.start(this._sharedServer);
    this.serviceSuites.set("UNIFIED_HTTP", this.unifiedHttpAdapter);

    await (this.commComponent as any).startWsServer(this._sharedServer);

    return new Promise((resolve, reject) => {
      this._sharedServer!.listen(this.commPort, this.host, () => {
        console.log(`[${this.entityName}] Unified port active on http://${this.host}:${this.commPort} (WS + REST + MCP + ACP)`);
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
        return await (this.commComponent as any).callWsRpc(peer.address, 'call', { fid, data });
      }
    };
  }

  async wire(peerId: string, options: any): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    if (peer.busy) throw new Error(`Peer ${peerId} is reserved by ${peer.reservedBy || 'another service'}.`);

    const { localOutput, remoteInput, remoteOutput, localInput, connectionPolicy = {} } = options;

    if (localOutput && remoteInput) {
      await (this.commComponent as any).wireViaWs(localOutput, peer.address, remoteInput, peer.name, {
        managedBy: connectionPolicy.managedBy || this.entityName,
        externallyMutable: connectionPolicy.externallyMutable !== false,
        metadata: connectionPolicy.metadata || {},
      });
    }

    if (remoteOutput && localInput) {
      await (this.commComponent as any).callWsRpc(peer.address, 'wire-output-to-me', {
        remoteOutput: remoteOutput,
        localInput: localInput,
        myAddress: `${this.host}:${this.commPort}`,
        myName: this.entityName,
        connectionPolicy,
      });
    }
  }

  _setupRpcHandlers(): void {
    (this.commComponent as any).defineRpc('get-manifest', async () => {
      return this.getManifest();
    });

    (this.commComponent as any).defineRpc('wire-output-to-me', async (params: any) => {
      const { remoteOutput, localInput, myAddress, myName, connectionPolicy = {} } = params;
      this._assertAvailableForRemoteAccess(myName);
      return await (this.commComponent as any).wireViaWs(remoteOutput, myAddress, localInput, myName, {
        managedBy: connectionPolicy.managedBy || myName,
        externallyMutable: connectionPolicy.externallyMutable !== false,
        metadata: connectionPolicy.metadata || {},
      });
    });

    (this.commComponent as any).defineRpc('call', async ({ fid, data }: any) => {
      this._assertAvailableForRemoteAccess(data?.meta?.requester || null);
      return await this.call(fid, data);
    });

    (this.commComponent as any).defineRpc('set-entity-flags', async ({ discoverable, busy, reservedBy, requester }: any) => {
      this._assertAvailableForRemoteAccess(requester || null);
      if (typeof discoverable === 'boolean') this.setDiscoverable(discoverable);
      if (typeof busy === 'boolean') {
        if (busy) this.reserveFor(reservedBy || requester || 'unknown');
        else this.releaseReservation(requester || null);
      }
      return this.getSystemFlags();
    });

    (this.commComponent as any).defineRpc('list-routes', async () => {
      return (this.commComponent as any).listRoutes();
    });

    (this.commComponent as any).defineRpc('disconnect-route', async ({ routeId, requester, force = false }: any) => {
      this._assertAvailableForRemoteAccess(requester || null);
      (this.commComponent as any).disconnectRoute(routeId, { requester, force });
      return { ok: true, routeId };
    });

    (this.commComponent as any).defineRpc('connect-to-target', async ({ sourceEmitter, targetAddress, targetCollector, targetName, requester, connectionPolicy = {} }: any) => {
      this._assertAvailableForRemoteAccess(requester || null);
      return await (this.commComponent as any).wireViaWs(sourceEmitter, targetAddress, targetCollector, targetName, {
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

    const handleSignal = (signal: string) => {
      console.log(`\n[${this.entityName}] OS Signal ${signal} received. Cleaning up...`);
      this.dispose();
      process.exit(0);
    };

    process.on('SIGINT', () => handleSignal('SIGINT'));
    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    process.on('SIGHUP', () => {
      console.log(`[${this.entityName}] SIGHUP received. Ignoring to maintain background persistence.`);
    });

    process.on('uncaughtException', (err) => {
      Logger.error(`UNCAUGHT EXCEPTION in ${this.entityName}:`, err);
      this.dispose();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      Logger.error(`UNHANDLED REJECTION in ${this.entityName}:`, reason);
      this.dispose();
      process.exit(1);
    });

    process.on('exit', (code) => {
      console.log(`[${this.entityName}] Process exiting with code: ${code}`);
    });
  }

  dispose(): void {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.discoverySocket) this.discoverySocket.close();
    
    for (const [name, suite] of this.serviceSuites) {
      suite.stop();
    }
    this.serviceSuites.clear();

    if (this._sharedServer) {
        this._sharedServer.close();
        this._sharedServer = null;
    }

    (this.commComponent as any).dispose();
    super.dispose();
  }
}
