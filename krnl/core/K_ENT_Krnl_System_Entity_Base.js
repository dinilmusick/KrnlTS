//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_System_Entity_Base.js
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 */

import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import { krnlSystemCommComponent } from "./K_LIB_Krnl_System_Comm_Component.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL SYSTEM ENTITY BASE ////////////////////////////////////////
export class krnlSystemEntityBase extends krnlEntityBase {
  /**
   * @param {string} name
   * @param {object|null} owner
   * @param {number} [commPort=10099] - WS listen port for the commComponent.
   */
  constructor(name, owner = null, commPort = 10099) {
    super(name, owner);
    this.systemType = 'SystemOrchestrator';
    this.peers = new Map(); // id -> { address, lastSeen }

    // ── Uniform P2P communication bridge ──────────────────────────────
    this.commPort = commPort;
    this.commComponent = new krnlSystemCommComponent(this, commPort);

    this._setupBaseFunctionalities();
    this._setupBaseInterface();
    this._setupRpcHandlers();
  }

  /**
   * Returns a manifest of all available inputs and outputs.
   * Inputs = Collectors + Returned Functionalities (One-shot)
   * Outputs = Emitters + Broadcast Functionalities (Stream)
   */
  getManifest() {
    return {
      entityName: this.entityName,
      systemType: this.systemType,
      inputs: {
        collectors: this.interface.collectorNames,
        oneShot: this.returnedFunctionalities.listNames(),
      },
      outputs: {
        emitters: this.interface.emitterNames,
        broadcast: this.broadcastFunctionalities.listNames(),
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISCOVERY ////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts discovery: advertises presence and listens for other peers.
   * @param {number} [discoveryPort=10101]
   */
  async startDiscovery(discoveryPort = 10101) {
    if (typeof window !== 'undefined') {
      console.warn(`[${this.entityName}] Discovery: UDP not supported in browser.`);
      return;
    }

    const dgram = await import('dgram').then(m => m.default || m);
    this.discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.discoverySocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'KRNL_BEACON' && data.id !== this.entityName) {
          this.peers.set(data.id, {
            name: data.id,
            address: `${rinfo.address}:${data.port}`,
            lastSeen: Date.now()
          });
        }
      } catch (e) { }
    });

    this.discoverySocket.bind(discoveryPort, () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`[${this.entityName}] Discovery active on port ${discoveryPort}`);
      
      // Advertise presence periodically
      this.beaconInterval = setInterval(() => {
        const beacon = JSON.stringify({
          type: 'KRNL_BEACON',
          id: this.entityName,
          port: this.commPort
        });
        this.discoverySocket.send(beacon, 0, beacon.length, discoveryPort, '255.255.255.255');
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
   * @param {string} [options.localOutput] - Name of local emitter/broadcast.
   * @param {string} [options.remoteInput] - Name of remote collector/oneShot.
   * @param {string} [options.remoteOutput] - Name of remote emitter/broadcast.
   * @param {string} [options.localInput] - Name of local collector/oneShot.
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
        myAddress: `localhost:${this.commPort}`, // Simplification for same-machine/LAN
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
    this.broadcastFunctionalities.define('heartbeat', () => ({
      name: this.entityName,
      type: this.systemType,
      timestamp: new Date().toISOString()
    }), { stateful: true, stateName: 'heartbeat' });

    this.returnedFunctionalities.define('getTelemetry', () => ({
      entityName: this.entityName,
      systemType: this.systemType,
      owner: this.hierarchyManager.getOwnerEntity()?.entityName || null,
      ownedEntities: this.hierarchyManager.getAllOwnedComponentEntities().map(e => e.entityName),
      activeRoutes: this.commComponent.listRoutes(),
      uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : null,
    }));

    this.returnedFunctionalities.define('adminCommand', async ({ command, args }) => {
      console.log(`[${this.entityName}] Admin command: ${command}`, args);
      return { status: 'acknowledged', command };
    });

    // One-shot discovery function
    this.returnedFunctionalities.define('discoverPeers', () => this.listPeers());
    this.returnedFunctionalities.define('getManifest', () => this.getManifest());
  }

  _setupBaseInterface() {
    this.interface.createEmitter('system-events');
    this.interface.createCollector('system-commands');
    this._attachCollectorHandler('system-commands', (msg) => {
      console.log(`[${this.entityName}] system-commands received:`, JSON.stringify(msg.data));
    });
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
