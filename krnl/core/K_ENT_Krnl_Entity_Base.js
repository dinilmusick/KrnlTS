//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description Defines the core base class for all Krnl entities using the locality model.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlStateManager } from "./K_LIB_Krnl_State_Manager.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";

export class krnlEntityBase {
  constructor(nameOrConfig, owner = null) {
    const config = typeof nameOrConfig === "string"
      ? { id: nameOrConfig }
      : (nameOrConfig || {});

    this.__krnlEntityInstance = true;
    this.id = config.id || "UnnamedEntity";
    this.entityName = this.id;

    this.interface = new krnlInterface(this);
    this.stateManager = new krnlStateManager(this);

    // Functionality Maps
    this.localFunctionalities = new Map();
    this.remoteFunctionalities = new Map();
    this.collectors = new Set();

    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,
      owner,
      krnlEntityBase
    );

    const local = config.localFunctionalities || [];
    const remote = config.remoteFunctionalities || [];

    for (const functionality of local) {
      this.addLocal(functionality);
    }

    for (const functionality of remote) {
      this.addRemote(functionality);
    }
  }

  addLocal(localFunctionality) {
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    functionality.bindToEntity(this);
    this.localFunctionalities.set(functionality.id, functionality);
    return functionality;
  }

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
    if (this.stateManager) this.stateManager.dispose();
    if (this.interface) this.interface.dispose();

    for (const collector of this.collectors) {
      if (collector?.disconnectCollector) collector.disconnectCollector();
    }

    this.collectors.clear();
    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
