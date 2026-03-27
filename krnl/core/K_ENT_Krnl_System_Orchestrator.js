//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_System_Orchestrator.js
 * @description Base class for all system-specific orchestrators (Qwnsr, Brnda, etc.).
 * Inherits from krnlEntity and adds network discovery and registration logic.
 */

import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import { krnlDiscovery } from "../extensions/K_LIB_Krnl_Discovery.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL SYSTEM ORCHESTRATOR ////////////////////////////////////////
export class krnlSystemOrchestrator extends krnlEntityBase {
  constructor(name, owner = null) {
    // Standard naming: [Context]_[System]_[Role]
    super(name, owner);

    // Each orchestrator has a discovery mechanism
    this.discovery = new krnlDiscovery(this);
    
    // Status tracking
    this.stateManager.createState("OrchestratorStatus");
    this.stateManager.setStateValue("OrchestratorStatus", "isConnectedToHub", false);
    this.stateManager.setStateValue("OrchestratorStatus", "peers", []);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INITIALIZATION AND DISCOVERY /////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Called when the system initializes.
   * Scans for the Main Hub and registers itself.
   */
  async initSystem() {
    console.log(`[${this.entityName}] Initializing...`);
    
    // 1. Advertise self
    await this.discovery.advertisePresence();

    // 2. Scan for Main Hub
    const hub = await this.discovery.scanForHub();
    if (hub) {
        // 3. Register with Hub
        const success = await this.discovery.registerWithHub(hub);
        if (success) {
            this.stateManager.setStateValue("OrchestratorStatus", "isConnectedToHub", true);
            console.log(`[${this.entityName}] Connected to Main Hub.`);
        }
    }

    // 4. Start listening for connection requests (via Interface)
    this.interface.listenForDirectConnections();
  }

  /**
   * Connects this system directly to another peer (P2P).
   * @param {string} peerId 
   * @param {string} peerAddress 
   */
  async connectToPeer(peerId, peerAddress) {
      console.log(`[${this.entityName}] Connecting P2P to ${peerId} at ${peerAddress}`);
      // Interface logic to establish WebSocket/WebRTC to peer
      this.interface.connectTo(peerAddress);
      
      const peers = this.stateManager.getStateValue("OrchestratorStatus", "peers") || [];
      peers.push(peerId);
      this.stateManager.setStateValue("OrchestratorStatus", "peers", peers);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Overrides base dispose to clean up the discovery mechanism.
   */
  dispose() {
    if (this.discovery && typeof this.discovery.dispose === "function") {
      this.discovery.dispose();
    }
    super.dispose();
  }
}
