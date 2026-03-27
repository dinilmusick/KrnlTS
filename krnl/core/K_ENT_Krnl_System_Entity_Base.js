//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_System_Entity_Base.js
 * @description Base class for all system orchestrator entities in the Krnl ecosystem.
 *
 * Every system (Brnda, Qwnsr, Wepr, any user-defined dummy) inherits from this class and
 * automatically receives:
 *   • Standard interface emitters/collectors for inter-system events.
 *   • A `commComponent` (krnlSystemCommComponent) for uniform P2P wiring.
 *   • Standard returnedFunctionalities: `getTelemetry`, `adminCommand`.
 *   • Standard broadcastFunctionality: `heartbeat`.
 *
 * The `commComponent` is the single, standard way ALL systems wire their emitters to other
 * systems' collectors — either directly (same process) or via WebSocket (network).
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

    // ── Uniform P2P communication bridge ──────────────────────────────
    this.commComponent = new krnlSystemCommComponent(this, commPort);

    this._setupBaseFunctionalities();
    this._setupBaseInterface();
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// BASE FUNCTIONALITIES ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Sets up the core functionalities for discovery, telemetry, and administration.
   */
  _setupBaseFunctionalities() {
    // Heartbeat for service discovery
    this.broadcastFunctionalities.define('heartbeat', () => ({
      name: this.entityName,
      type: this.systemType,
      timestamp: new Date().toISOString()
    }), { stateful: true, stateName: 'heartbeat' });

    // Telemetry — reports system state snapshot
    this.returnedFunctionalities.define('getTelemetry', () => ({
      entityName: this.entityName,
      systemType: this.systemType,
      owner: this.hierarchyManager.getOwnerEntity()?.entityName || null,
      ownedEntities: this.hierarchyManager.getAllOwnedComponentEntities().map(e => e.entityName),
      activeRoutes: this.commComponent.listRoutes(),
      uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : null,
    }));

    // Admin command executor
    this.returnedFunctionalities.define('adminCommand', async ({ command, args }) => {
      console.log(`[${this.entityName}] Admin command: ${command}`, args);
      return { status: 'acknowledged', command };
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// BASE INTERFACE ////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates the standard inter-system emitter and collector endpoints.
   * All Krnl systems expose these by convention.
   */
  _setupBaseInterface() {
    // Outbound channel — broadcast system-level events to other systems
    this.interface.createEmitter('system-events');

    // Inbound channel — receive commands from other systems
    const cmdCollector = this.interface.createCollector('system-commands');

    // Attach a default handler so the Orchestrator can wire collectors directly
    this._attachCollectorHandler('system-commands', (msg) => {
      console.log(`[${this.entityName}] system-commands received:`, JSON.stringify(msg.data));
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// HELPER METHODS ////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Attaches a direct (synchronous) message handler to a named collector.
   * This allows the CommComponent to call the handler when data arrives from
   * a remote (or same-process) emitter.
   *
   * @param {string} collectorName
   * @param {function(Message): void} handler
   */
  _attachCollectorHandler(collectorName, handler) {
    const collector = this.interface.getCollector(collectorName);
    collector._directHandler = handler;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSE ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  dispose() {
    this.commComponent.dispose();
    super.dispose();
  }
}
