//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Discovery.js
 * @description Provides network discovery mechanisms for orchestrators.
 * Abstracts LAN/P2P discovery using mDNS, Broadcast, or WebSocket signaling.
 */

import { krnlError, krnlErrorCodes } from "../core/K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// DISCOVERY MECHANISM ////////////////////////////////////////
export class krnlDiscovery {
  constructor(entity, discoveryPort = 10101) {
    this.entity = entity;
    this.discoveryPort = discoveryPort;
    this.foundHubs = new Map(); // id -> { address, lastSeen }
    this.peers = new Map();     // id -> { address, metadata, lastSeen }
    this.isScanning = false;
    this.isAdvertising = false;
    this.socket = null;
    this.beaconInterval = null;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// UDP SOCKET INITIALIZATION ////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
     * Initializes the UDP socket for discovery.
     */
  async _initSocket() {
    if (this.socket) return;

    // Check if we are in a Node.js environment with dgram support
    if (typeof window !== 'undefined') {
      console.warn(`[${this.entity.entityName}] Discovery: UDP not supported in browser. Skipping socket init.`);
      return;
    }

    try {
      const dgram = await import('dgram').then(m => m.default || m);
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.socket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log(`[${this.entity.entityName}] Incoming UDP from ${rinfo.address}:${rinfo.port}`);
          this._handleDiscoveryMessage(data, rinfo);
        } catch (e) {
          // Ignore malformed packets
        }
      });

      this.socket.on('error', (err) => {
        console.error(`[${this.entity.entityName}] Discovery Socket Error:`, err);
      });
    } catch (e) {
      console.warn(`[${this.entity.entityName}] Discovery: Failed to initialize UDP socket: ${e.message}`);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISCOVERY OPERATIONS /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts listening for discovery beacons on the local network.
   */
  async startListening() {
    await this._initSocket();
    if (!this.socket) {
      console.warn(`[${this.entity.entityName}] Discovery: startListening skipped (no socket).`);
      return;
    }
    return new Promise((resolve) => {
      this.socket.bind(this.discoveryPort, () => {
        this.socket.setBroadcast(true);
        this.isScanning = true;
        console.log(`[${this.entity.entityName}] Discovery listening on UDP port ${this.discoveryPort}`);
        resolve();
      });
    });
  }

  /**
   * Starts periodic advertising of this system's presence.
   * @param {Object} metadata - Data to include in the beacon (name, port, type, etc.)
   * @param {number} intervalMs - Interval between beacons.
   */
  async startAdvertising(metadata, intervalMs = 5000) {
    await this._initSocket();
    if (!this.socket) {
      console.warn(`[${this.entity.entityName}] Discovery: startAdvertising skipped (no socket).`);
      return;
    }
    if (!this.socket._bindState) {
      await this.startListening();
    }

    this.isAdvertising = true;
    const beacon = JSON.stringify({
      type: 'KRNL_BEACON',
      id: this.entity.entityName,
      ...metadata,
      timestamp: Date.now()
    });

    console.log(`[${this.entity.entityName}] Starting advertising every ${intervalMs}ms...`);

    this.beaconInterval = setInterval(() => {
      const message = Buffer.from(beacon);
      console.log(`[${this.entity.entityName}] Sending beacon to ${this.discoveryPort}`);
      this.socket.send(message, 0, message.length, this.discoveryPort, '255.255.255.255');
    }, intervalMs);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// MESSAGE HANDLING //////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _handleDiscoveryMessage(data, rinfo) {
    if (data.type !== 'KRNL_BEACON') return;
    if (data.id === this.entity.entityName) return;

    // console.log(`[${this.entity.entityName}] Processing Beacon from: ${data.id} content: Type=${data.systemType}`);

    const info = {
      ...data,
      ip: rinfo.address,
      lastSeen: Date.now()
    };

    if (data.systemType === 'ORCHESTRATOR') {
      if (!this.foundHubs.has(data.id)) {
        console.log(`[${this.entity.entityName}] DISCOVERED_ORCHESTRATOR: ${data.id} @ ${rinfo.address}`);
      }
      this.foundHubs.set(data.id, info);
      if (this.entity.onHubFound) {
        this.entity.onHubFound(info);
      }
    } else {
      if (!this.peers.has(data.id)) {
        console.log(`[${this.entity.entityName}] DISCOVERED_PEER: ${data.id} [Type: ${data.systemType}] @ ${rinfo.address}`);
      }
      this.peers.set(data.id, info);
      if (this.entity.onPeerFound) {
        // console.log(`[${this.entity.entityName}] Executing onPeerFound for ${data.id}`);
        this.entity.onPeerFound(info);
      } else {
        console.log(`[${this.entity.entityName}] No onPeerFound handler registered for entity`);
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Cleans up discovery resources.
   */
  dispose() {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.foundHubs.clear();
    this.peers.clear();
    this.isScanning = false;
    this.isAdvertising = false;
  }
}
