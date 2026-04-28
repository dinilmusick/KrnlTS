//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_System_Entity_Base.js
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
import { krnlServiceSuites, krnlServiceSuitePorts, Logger } from "./K_LIB_Krnl_Base_Concepts.js";
import { krnlUnifiedHttpAdapter } from "./K_LIB_Krnl_System_Unified_Http_Adapter.js";
import http from 'http';
import { zodToJsonSchema } from 'zod-to-json-schema';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL SYSTEM ENTITY BASE ////////////////////////////////////////
export class krnlSystemEntityBase extends krnlEntityBase {
  /**
   * @param {string} name
   * @param {object|null} owner
   * @param {number} [commPort=10099] - WS listen port for the commComponent.
   * @param {string} [host='0.0.0.0'] - Interface to bind to.
   */
  constructor(name, owner = null, commPort = 10099, host = '0.0.0.0') {
    super(name, owner, { Singleton: true });
    this.systemType = 'SystemOrchestrator';
    this.peers = new Map(); // id -> { address, lastSeen }
    this.discoverable = true;
    this.reservation = {
      busy: false,
      reservedBy: null,
      reservedAt: null,
    };
    this.peerTtlMs = 60000; // Increased to 60s for stability

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

    // ── Protocol Unification & Decoration ──────────────────────────────
    this._documentationProvider = null;

    // ── Startup Diagnostics ──────────────────────────────
    this._emitStartupDiagnostics();
  }

  /**
   * Registers a documentation provider to enable automatic result decoration across all protocols.
   * @param {Object} provider - Must implement getDocForEndpoint, getNextStepsDoc, and getDocsForLayer.
   */
  setDocumentationProvider(provider) {
    this._documentationProvider = provider;
  }

  async _decorateResult(result, fid, input) {
    // 1. Standardize Transaction Wrapping
    // If the result is already wrapped, we keep it. Otherwise, we wrap it.
    let finalResult = (result && typeof result === 'object' && result.status)
      ? result
      : { status: "success", payload: result };

    // 2. Inject Preemptive Documentation
    if (this._documentationProvider && finalResult.status === "success") {
      if (typeof this._documentationProvider.getNextStepsDoc === 'function') {
        const nextSteps = this._documentationProvider.getNextStepsDoc(fid);
        if (nextSteps && nextSteps.length > 0) {
          // If payload is an object, attach documentation
        finalResult.preemptiveDocumentation = {
          message: "Progressive Exploration: Recommended next steps.",
          nextSteps
        };
        }
      }
    }
    return finalResult;
  }

  /**
   * Universal Error Decorator: Automatically attaches documentation to error results.
   */
  async _decorateError(err, fid, input) {
    const response = {
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

  /**
   * Global 404 Handler: Provides entry-layer documentation for unknown routes.
   */
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

  /**
   * Returns true if UDP discovery is available in the current environment.
   */
  isDiscoveryAvailable() {
    return typeof window === 'undefined';
  }

  /**
   * Emits structured startup diagnostics.
   * Useful for wrapper services (like Wepr) to monitor active subsystems.
   */
  _emitStartupDiagnostics() {
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

  setDiscoverable(value) {
    this.discoverable = Boolean(value);
    return this.getSystemFlags();
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

  _assertAvailableForRemoteAccess(requester = null) {
    if (!this.reservation.busy) return;
    if (requester && requester === this.reservation.reservedBy) return;
    const by = this.reservation.reservedBy || 'another service';
    throw new Error(`[${this.entityName}] Entity is busy/reserved by ${by}.`);
  }

  /**
   * Returns a manifest of all available inputs and outputs.
   * Inputs = Collectors + Functionalities (API call)
   * Outputs = Emitters + Functionality Emitters (Events)
   */
  getManifest() {
    const apiNames = [];
    const eventsNames = [];
    const api = {};

    this.localFunctionalities.forEach((f) => {
      const fManifest = { id: f.id, events: [] };
      f.emitters.forEach((_, eid) => {
        const eventId = `${f.id}:${eid}`;
        fManifest.events.push(eventId);
        eventsNames.push(eventId);
      });

      // Export Schemas if they exist
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

    this.remoteFunctionalities.forEach((f) => {
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
        collectors: this.interface.collectorNames,
        api: api, // Detailed map instead of just names
      },
      outputs: {
        emitters: this.interface.emitterNames,
        events: eventsNames,
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISCOVERY ////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts discovery: advertises presence and listens for other peers.
   * @param {number} [discoveryPort=10101]
   * @param {string} [discoveryHost='255.255.255.255'] - Broadcast address.
   */
  async startDiscovery(discoveryPort = 10101, discoveryHost = '255.255.255.255') {
    if (this.discoverySocket) return; // Already started
    
    if (!this.isDiscoveryAvailable()) {
      console.warn(`[${this.entityName}] Discovery: UDP not supported in current environment.`);
      return;
    }

    const dgram = await import('dgram').then(m => m.default || m);
    this.discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.discoverySocket.on('message', (msg, rinfo) => {
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

    // Start Discovery UDP beacon
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

    // Initialise and start the shared HTTP/WS server
    await this._startSharedServer();
  }

  /**
   * Internal helper to start the shared server for WS and HTTP protocols.
   * Ensures everything runs on this.commPort.
   */
  async _startSharedServer() {
    if (this._sharedServer) return;

    // Create the primary HTTP server
    this._sharedServer = http.createServer();

    // 1. Start the Unified HTTP Adapter (Routes: /call, /mcp, /acp, /sse, /manifest)
    await this.unifiedHttpAdapter.start(this._sharedServer);
    this.serviceSuites.set("UNIFIED_HTTP", this.unifiedHttpAdapter);

    // 2. Start the WebSocket server using the SAME HTTP server
    await this.commComponent.startWsServer(this._sharedServer);

    // 3. Listen on the unified port
    return new Promise((resolve, reject) => {
      this._sharedServer.listen(this.commPort, this.host, () => {
        console.log(`[${this.entityName}] Unified port active on http://${this.host}:${this.commPort} (WS + REST + MCP + ACP)`);
        resolve();
      });
      this._sharedServer.on('error', (err) => {
        console.error(`[${this.entityName}] Failed to start unified server:`, err.message);
        reject(err);
      });
    });
  }

  /**
   * Backward compatible activation method. Now simply ensures the shared server is running.
   */
  async activateServiceSuite(suiteName = "UNIFIED_HTTP") {
    return this._startSharedServer();
  }

  /**
   * Returns a list of all discovered peers.
   */
  listPeers() {
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > this.peerTtlMs) this.peers.delete(id);
    }
    return Array.from(this.peers.values()).filter((peer) => peer.discoverable !== false);
  }

  /**
   * Returns a proxy object for a remote entity by ID.
   * @param {string} peerId 
   * @returns {Object|null}
   */
  getRemoteEntity(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return null;
    return {
      call: async (fid, data) => {
        return await this.commComponent.callWsRpc(peer.address, 'call', { fid, data });
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// WIRING ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Wires a local output to a remote input, or a remote output to a local input.
   * 
   * @param {string} peerId - The ID of the discovered peer.
   * @param {Object} options 
   * @param {string} [options.localOutput] - Name of local emitter.
   * @param {string} [options.remoteInput] - Name of remote collector.
   * @param {string} [options.remoteOutput] - Name of remote emitter.
   * @param {string} [options.localInput] - Name of local collector.
   */
  async wire(peerId, options) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    if (peer.busy) throw new Error(`Peer ${peerId} is reserved by ${peer.reservedBy || 'another service'}.`);

    const { localOutput, remoteInput, remoteOutput, localInput, connectionPolicy = {} } = options;

    // Case 1: Local Output -> Remote Input
    if (localOutput && remoteInput) {
      await this.commComponent.wireViaWs(localOutput, peer.address, remoteInput, peer.name, {
        managedBy: connectionPolicy.managedBy || this.entityName,
        externallyMutable: connectionPolicy.externallyMutable !== false,
        metadata: connectionPolicy.metadata || {},
      });
    }

    // Case 2: Remote Output -> Local Input
    if (remoteOutput && localInput) {
      // We request the remote peer to wire its output to our local input
      await this.commComponent.callWsRpc(peer.address, 'wire-output-to-me', {
        remoteOutput: remoteOutput,
        localInput: localInput,
        myAddress: `${this.host}:${this.commPort}`,
        myName: this.entityName,
        connectionPolicy,
      });
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// PRIVATE SETUP ////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _setupRpcHandlers() {
    // Allows others to see what we have
    this.commComponent.defineRpc('get-manifest', async () => {
      return this.getManifest();
    });

    // Allows others to request we wire an output to them
    this.commComponent.defineRpc('wire-output-to-me', async (params) => {
      const { remoteOutput, localInput, myAddress, myName, connectionPolicy = {} } = params;
      this._assertAvailableForRemoteAccess(myName);
      console.log(`[${this.entityName}] Remote ${myName} requested wiring: ${remoteOutput} -> ${localInput}`);
      return await this.commComponent.wireViaWs(remoteOutput, myAddress, localInput, myName, {
        managedBy: connectionPolicy.managedBy || myName,
        externallyMutable: connectionPolicy.externallyMutable !== false,
        metadata: connectionPolicy.metadata || {},
      });
    });

    // Allows others to call functionalities on this system
    this.commComponent.defineRpc('call', async ({ fid, data }) => {
      this._assertAvailableForRemoteAccess(data?.meta?.requester || null);
      return await this.call(fid, data);
    });

    this.commComponent.defineRpc('set-entity-flags', async ({ discoverable, busy, reservedBy, requester }) => {
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

  /**
   * Binds Node.js process signals (SIGINT, SIGTERM) and unhandled errors 
   * to the entity's dispose() method. Ensures graceful shutdown and 
   * port release in Node.js environments.
   */
  bindProcessSignals() {
    if (typeof process === 'undefined' || !process.on) return;

    const handleSignal = (signal) => {
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

  dispose() {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.discoverySocket) this.discoverySocket.close();
    
    // Stop all service suites
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
