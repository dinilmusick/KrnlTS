//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description Defines the core base class for all Krnl entities.
 * 
 * An Entity is the foundational "Software Block" in the Krnl ecosystem. 
 * It is a container for logic (Functionalities) and provides the necessary 
 * infrastructure for communication and lifecycle management.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";

export class krnlEntityBase {
  /**
   * @param {string} name - The unique name/id of the entity.
   * @param {object} [owner=null] - Optional parent entity.
   */
  constructor(name, owner = null) {
    this.__krnlEntityInstance = true;
    this.id = name || "UnnamedEntity";
    this.entityName = this.id;

    /**
     * THE INTERFACE (The Circulatory System / IO Hub)
     * -------------------------------------------------------------------------
     * Why it's needed: Logic (Functionalities) should never talk to the network 
     * or other entities directly. The Interface provides "ports" (Emitters/Collectors).
     * 
     * Roles:
     * 1. Registry: Stores all named inputs and outputs for this entity.
     * 2. Decoupling: Allows logic to emit data without knowing who is listening.
     * 3. Wiring Target: The point where the CommComponent plugs in remote connections.
     */
    this.interface = new krnlInterface(this);

    /**
     * LOCAL FUNCTIONALITIES (The Brain / Logic Blocks)
     * -------------------------------------------------------------------------
     * Why it's needed: Every entity needs specific logic to perform its task.
     * Each block here owns its own private state, making data usage crystal clear.
     */
    this.localFunctionalities = new Map();

    /**
     * REMOTE FUNCTIONALITIES (The Proxies / Virtual Arms)
     * -------------------------------------------------------------------------
     * Why it's needed: Allows this entity to "call" functions on another entity
     * as if they were local, abstracting the network/location complexity.
     */
    this.remoteFunctionalities = new Map();

    /**
     * COLLECTORS (The Inbound Pipes)
     * -------------------------------------------------------------------------
     * Why it's needed: Tracks active listeners so they can be properly 
     * disconnected during disposal, preventing memory leaks.
     */
    this.collectors = new Set();

    /**
     * HIERARCHY MANAGER (The Skeleton / Lifecycle Hub)
     * -------------------------------------------------------------------------
     * Why it's needed: Logic blocks don't live in a vacuum; they belong to a system.
     * 
     * Roles:
     * 1. Ownership: Tracks parent-child relationships (e.g., System owns Sub-System).
     * 2. Component Spawning: Provides a standard way to create sub-entities.
     * 3. Recursive Disposal: When this entity dies, the manager ensures all children
     *    and their resources are also wiped from memory (The "Clean Death").
     */
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,
      owner,
      krnlEntityBase
    );
  }

  /**
   * Registers a logic block owned by this entity.
   * @param {object|krnlLocalFunctionality} localFunctionality 
   */
  addLocal(localFunctionality) {
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    functionality.bindToEntity(this);
    this.localFunctionalities.set(functionality.id, functionality);
    return functionality;
  }

  /**
   * Registers a proxy to a functionality on another entity.
   * @param {object|krnlRemoteFunctionality} remoteFunctionality 
   */
  addRemote(remoteFunctionality) {
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality
      ? remoteFunctionality
      : new krnlRemoteFunctionality(remoteFunctionality);

    functionality.bindToEntity(this);
    this.remoteFunctionalities.set(functionality.id, functionality);
    return functionality;
  }

  getLocal(fid) {
    return this.localFunctionalities.get(fid);
  }

  getRemote(fid) {
    return this.remoteFunctionalities.get(fid);
  }

  /**
   * Executes a functionality.
   * @param {string} fid - Functionality ID.
   * @param {any} input - Arguments for the API.
   */
  async call(fid, input, opts = {}) {
    if (this.localFunctionalities.has(fid)) {
      return this.localFunctionalities.get(fid).execute(input, opts);
    }

    if (this.remoteFunctionalities.has(fid)) {
      return this.remoteFunctionalities.get(fid).execute(input, opts);
    }

    throw new Error(`Functionality '${fid}' not found on entity '${this.id}'.`);
  }

  /**
   * Performs a complete teardown of the entity.
   * Ensures the hierarchy is dissolved and all IO ports are closed.
   */
  dispose() {
    console.log(`[${this.entityName}] Initiating disposal...`);
    
    // 1. Trigger recursive hierarchy disposal (Skeleton)
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    
    // 2. Tear down the IO Hub (Interface)
    if (this.interface) this.interface.dispose();

    // 3. Close any remaining inbound pipes
    for (const collector of this.collectors) {
      if (collector?.disconnectCollector) collector.disconnectCollector();
    }

    this.collectors.clear();
    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
