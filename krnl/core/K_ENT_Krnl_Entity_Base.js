//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description The "Master Descriptor" in the Ultrst Philosophy (by Dinil Palackal).
 * 
 * The Entity file is where the IO (Interface) is explicitly described. 
 * Logic is imported as atoms, but the Entity file serves as the documentation 
 * for the ports and components of the software block.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";

export class krnlEntityBase {
  /**
   * @param {string} name - The folder name of the entity.
   * @param {object|null} owner - The parent entity.
   */
  constructor(name, owner = null) {
    this.__krnlEntityInstance = true;
    this.id = name || "UnnamedEntity";
    this.entityName = this.id;

    // 1. IO HUB: Explicitly described in the extending class.
    this.interface = new krnlInterface(this);

    // 2. LOGIC REGISTRIES: Atomic logic assembly.
    this.localFunctionalities = new Map();
    this.remoteFunctionalities = new Map();

    // 3. HIERARCHY: Managed components.
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,
      owner,
      krnlEntityBase
    );
  }

  /**
   * Registers a Functionality.
   */
  addLocal(localFunctionality) {
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    functionality.bindToEntity(this);
    this.localFunctionalities.set(functionality.id, functionality);

    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityAdded) {
      owner._onComponentFunctionalityAdded(this, functionality);
    }

    return functionality;
  }

  /**
   * Registers a proxy for an external entity.
   */
  addRemote(remoteFunctionality) {
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality
      ? remoteFunctionality
      : new krnlRemoteFunctionality(remoteFunctionality);

    functionality.bindToEntity(this);
    this.remoteFunctionalities.set(functionality.id, functionality);
    return functionality;
  }

  /**
   * BUBBLING: Interface promotion.
   */
  _onComponentFunctionalityAdded(component, functionality) {
    if (functionality.visibility !== 'public') return;

    const promotedCollector = this.interface.createCollector(functionality.id);
    promotedCollector._directHandler = async (msg) => {
      const caller = msg.metadata?.caller || this.entityName;
      return await component.call(functionality.id, msg.data, { caller });
    };

    functionality.emitters.forEach((_, eid) => {
      const promotedEmitter = this.interface.createEmitter(`${functionality.id}:${eid}`);
      const componentEmitter = component.interface.getEmitter(`${functionality.id}:${eid}`);
      componentEmitter.subscribe((msg) => promotedEmitter.pushDataStreamToEmitter(msg.data, msg.time));
    });
  }

  /**
   * CALL: Direct logic invocation.
   */
  async call(fid, input, opts = {}) {
    if (this.localFunctionalities.has(fid)) {
      return this.localFunctionalities.get(fid).execute(input, opts);
    }
    if (this.remoteFunctionalities.has(fid)) {
      return this.remoteFunctionalities.get(fid).execute(input, opts);
    }
    throw new Error(`Ultrst Error: Logic '${fid}' not found on entity '${this.id}'.`);
  }

  dispose() {
    this.hierarchyManager.dispose();
    this.interface.dispose();
    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
