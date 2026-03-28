//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description Defines the core base class for all Krnl entities.
 * Simplified to remove centralized state; state is now scoped to individual functionalities.
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

    this.interface = new krnlInterface(this);

    // Functionality Maps (Logic & Scoped State)
    this.localFunctionalities = new Map();
    this.remoteFunctionalities = new Map();
    this.collectors = new Set();

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

  dispose() {
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    if (this.interface) this.interface.dispose();

    for (const collector of this.collectors) {
      if (collector?.disconnectCollector) collector.disconnectCollector();
    }

    this.collectors.clear();
    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
