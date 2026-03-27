//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description Defines the core base class for all Krnl entities.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlStateManager } from "./K_LIB_Krnl_State_Manager.js";
import { krnlReturnedFunctionalities } from "./K_LIB_Krnl_Returned_Functionalities.js";
import { krnlBroadcastFunctionalities } from "./K_LIB_Krnl_Broadcast_Functionalities.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL ENTITY BASE ////////////////////////////////////////
/**
 * Main Krnl Entity Base Class
 * Composed of state, broadcast, and returned functionalities.
 */
export class krnlEntityBase {
  constructor(name, owner = null) {
    this.entityName = name;
    this.interface = new krnlInterface(this);
    this.stateManager = new krnlStateManager(this);
    this.broadcastFunctionalities = new krnlBroadcastFunctionalities(this);
    this.returnedFunctionalities = new krnlReturnedFunctionalities(this);

    // Manager creates + owns entityCompHierarchyData
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,
      owner,
      krnlEntityBase
    );
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Disposes the entity and all its components (managers and owned entities).
   */
  dispose() {
    console.log(`[${this.entityName}] Disposing entity...`);

    // 1. Recursively dispose children first
    if (this.hierarchyManager) this.hierarchyManager.dispose();

    // 2. Dispose functionalities
    if (this.broadcastFunctionalities) this.broadcastFunctionalities.dispose();
    if (this.returnedFunctionalities) this.returnedFunctionalities.dispose();

    // 3. Dispose state
    if (this.stateManager) this.stateManager.dispose();

    // 4. Dispose interface (connections)
    if (this.interface) this.interface.dispose();
  }
}
