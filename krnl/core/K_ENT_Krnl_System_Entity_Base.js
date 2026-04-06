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

    // ── Uniform P2P communication bridge ──────────────────────────────
    this.commPort = commPort;
    this.host = host;
    this.commComponent = new krnlSystemCommComponent(this, commPort, host);

    this._setupBaseFunctionalities();
    this._setupBaseInterface();
    this._setupRpcHandlers();

    // ── Startup Diagnostics ──────────────────────────────
    this._emitStartupDiagnostics();
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
      environment: typeof window === 'undefined' ? 'node' : 'browser'
    };
    console.log(`[KRNL_DIAGNOSTICS] ${JSON.stringify(diagnostics)}`);
  }

  /**
   * Returns a manifest of all available inputs and outputs.
   * Inputs = Collectors + Functionalities (API call)
   * Outputs = Emitters + Functionality Emitters (Events)
   */
  getManifest() {
    const apiNames = [];
    const eventsNames = [];

    this.localFunctionalities.forEach((f) => {
      apiNames.push(f.id);
      f.emitters.forEach((_, eid) => eventsNames.push(`${f.id}:${eid}`));
    });

    return {
      entityName: this.entityName,
      systemType: this.systemType,
      inputs: {
        collectors: this.interface.collectorNames,
        api: apiNames,
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
          this.peers.set(data.id, {
            id: data.id,
            name: data.id,
            address: `${rinfo.address}:${data.port}`,
            lastSeen: Date.now()
          });
        }
      } catch (e) { }
    });

    this.discoverySocket.bind(discoveryPort, this.host, () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`[${this.entityName}] Discovery active on ${this.host}:${discoveryPort} (broadcast to ${discoveryHost})`);
      
      // Advertise presence periodically
      this.beaconInterval = setInterval(() => {
        const beacon = JSON.stringify({
          type: 'KRNL_BEACON',
          id: this.entityName,
          port: this.commPort
        });
        this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, discoveryHost);
      }, 5000);
    });

    // Start WS server for incoming connections
    await this.commComponent.startWsServer();
  }

  /**
   * Returns a list of all discovered peers.
   */
  listPeers() {
    return Array.from(this.peers.values());
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

    const { localOutput, remoteInput, remoteOutput, localInput } = options;

    // Case 1: Local Output -> Remote Input
    if (localOutput && remoteInput) {
      await this.commComponent.wireViaWs(localOutput, peer.address, remoteInput, peer.name);
    }

    // Case 2: Remote Output -> Local Input
    if (remoteOutput && localInput) {
      // We request the remote peer to wire its output to our local input
      await this.commComponent.callWsRpc(peer.address, 'wire-output-to-me', {
        remoteOutput: remoteOutput,
        localInput: localInput,
        myAddress: `${this.host}:${this.commPort}`,
        myName: this.entityName
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
      const { remoteOutput, localInput, myAddress, myName } = params;
      console.log(`[${this.entityName}] Remote ${myName} requested wiring: ${remoteOutput} -> ${localInput}`);
      return await this.commComponent.wireViaWs(remoteOutput, myAddress, localInput, myName);
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

  dispose() {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.discoverySocket) this.discoverySocket.close();
    this.commComponent.dispose();
    super.dispose();
  }
}
