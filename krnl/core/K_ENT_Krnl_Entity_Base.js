//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description The core Entity class, supporting automatic interface promotion and scoped state.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";

/**
 * KRNL ENTITY BASE
 * The building block of the Krnl ecosystem.
 */
export class krnlEntityBase {
  /**
   * @param {string} name - The unique identity of the entity.
   * @param {object|null} owner - The parent entity (if any).
   */
  constructor(name, owner = null) {
    // 1. Core Identification.
    this.__krnlEntityInstance = true; // Marker for type checking.
    this.id = name || "UnnamedEntity"; // Unique ID.
    this.entityName = this.id;         // Alias for the name.

    // 2. Messaging Infrastructure (The IO Hub).
    this.interface = new krnlInterface(this);

    // 3. Logic Storage (The Brain).
    this.localFunctionalities = new Map();  // Logic that is MINE.
    this.remoteFunctionalities = new Map(); // Proxies for borrowing logic from others.
    this.collectors = new Set();            // Tracks listeners for cleanup.

    // 4. Hierarchy Management (The Skeleton).
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,          // Host.
      owner,         // Parent.
      krnlEntityBase // Base class for nesting.
    );
  }

  /**
   * Registers a local logic block.
   * If the functionality is 'public', it is automatically added to the interface.
   * @param {object|krnlLocalFunctionality} localFunctionality 
   */
  addLocal(localFunctionality) {
    // 1. Ensure we have an instance of LocalFunctionality.
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    // 2. Bind it to THIS entity. This step triggers the auto-interface registration.
    functionality.bindToEntity(this);

    // 3. Save it to our local logic map.
    this.localFunctionalities.set(functionality.id, functionality);

    // 4. Notify our owner (if we have one) to promote this logic.
    // This allows component functionalities to bubble up to the owner's interface.
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityAdded) {
      owner._onComponentFunctionalityAdded(this, functionality);
    }

    return functionality;
  }

  /**
   * Registers a proxy for an external, non-component entity.
   * @param {object|krnlRemoteFunctionality} remoteFunctionality 
   */
  addRemote(remoteFunctionality) {
    // 1. Ensure we have an instance of RemoteFunctionality.
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality
      ? remoteFunctionality
      : new krnlRemoteFunctionality(remoteFunctionality);

    // 2. Bind it to THIS entity. Registers it as an emitter on our interface.
    functionality.bindToEntity(this);

    // 3. Store the proxy.
    this.remoteFunctionalities.set(functionality.id, functionality);

    return functionality;
  }

  /**
   * INTERFACE PROMOTION: INTERNAL HANDLERS
   * These methods handle the automatic bubbling of component logic to the owner.
   */

  /**
   * Called by the HierarchyManager when a child component is spawned.
   * Registers all existing public functionalities of the child.
   */
  _onComponentAdded(componentEntity) {
    componentEntity.localFunctionalities.forEach((func) => {
      this._onComponentFunctionalityAdded(componentEntity, func);
    });
  }

  /**
   * Called when a component adds a NEW functionality.
   * Maps the component's public logic directly into the owner's interface.
   */
  _onComponentFunctionalityAdded(component, functionality) {
    // 1. Only promote 'public' functionalities.
    if (functionality.visibility !== 'public') return;

    // 2. Register the component's functionality on the owner's interface.
    // The owner's interface collector will now directly trigger the component's logic.
    const promotedCollector = this.interface.createCollector(functionality.id);
    promotedCollector._directHandler = async (msg) => {
      // Forward the call to the component, passing 'this' name as the caller metadata.
      const caller = msg.metadata?.caller || this.entityName;
      return await component.call(functionality.id, msg.data, { caller });
    };

    // 3. Register the component's emitters on the owner's interface.
    functionality.emitters.forEach((_, eid) => {
      // Convention: same ID or "componentId:functionalityId:emitterId".
      const promotedEmitter = this.interface.createEmitter(`${functionality.id}:${eid}`);
      // Locate the actual emitter on the component's interface.
      const componentEmitter = component.interface.getEmitter(`${functionality.id}:${eid}`);
      // Mirror the component's events on the owner.
      componentEmitter.subscribe((msg) => promotedEmitter.pushDataStreamToEmitter(msg.data, msg.time));
    });

    console.log(`[${this.entityName}] Promoted component functionality: ${functionality.id}`);
  }

  /**
   * Executes a functionality by ID.
   * Prioritizes local, then remote logic.
   */
  async call(fid, input, opts = {}) {
    // 1. Try Local logic.
    if (this.localFunctionalities.has(fid)) {
      return this.localFunctionalities.get(fid).execute(input, opts);
    }

    // 2. Try Remote proxy logic.
    if (this.remoteFunctionalities.has(fid)) {
      return this.remoteFunctionalities.get(fid).execute(input, opts);
    }

    throw new Error(`Functionality '${fid}' not found on entity '${this.id}'.`);
  }

  /**
   * Retrieves logic by ID.
   */
  getLocal(fid) { return this.localFunctionalities.get(fid); }
  getRemote(fid) { return this.remoteFunctionalities.get(fid); }

  /**
   * Performs a clean disposal of all resources.
   */
  dispose() {
    // 1. Banish all component entities recursively.
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    
    // 2. Dissolve the interface.
    if (this.interface) this.interface.dispose();

    // 3. Clear all internal logic maps.
    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
