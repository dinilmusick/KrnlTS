//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description The "Master Assembler" in the Ultrst Philosophy (by Dinil Palackal).
 * 
 * In this paradigm, the Entity code file is the final point where 
 * Functionalities (from folders) and Libraries (from folders) are imported 
 * and registered into a singular logic block.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";

export class krnlEntityBase {
  /**
   * @param {string} name - The folder name of the entity.
   * @param {object|null} owner - The parent entity (from the higher directory).
   */
  constructor(name, owner = null) {
    this.__krnlEntityInstance = true;
    this.id = name || "UnnamedEntity";
    this.entityName = this.id;

    // 1. IO HUB: Manages the promoted ports.
    this.interface = new krnlInterface(this);

    // 2. ATOMIC REGISTRIES: Store the modular pieces.
    this.localFunctionalities = new Map();  // Assembled from /functionalities/
    this.remoteFunctionalities = new Map(); // Proxies for external singletons.
    this.libraries = new Map();             // Assembled from /libraries/

    // 3. HIERARCHY: Manages components in the /entities/ folder.
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,
      owner,
      krnlEntityBase
    );
  }

  /**
   * Registers a Functionality Atom.
   * Typically used in the entity root file after importing the functionality folder.
   * @param {object|krnlLocalFunctionality} localFunctionality 
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
   * Registers a library (data struct or utility) from the /libraries/ folder.
   */
  addLibrary(libId, libContent) {
    this.libraries.set(libId, libContent);
    return libContent;
  }

  /**
   * Registers a proxy for an external singleton.
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
   * BUBBLING: Component logic promotion to the owner's interface.
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
   * CALL: Executes functionality logic by ID.
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
    this.libraries.clear();
  }
}
