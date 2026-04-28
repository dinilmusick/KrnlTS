//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.js
 * @description The core Entity class, supporting recursive interface promotion and visibility control.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";
import { krnlError, krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";

/**
 * KRNL ENTITY BASE
 * The building block of the Krnl ecosystem.
 */
import { telemetry } from "./K_LIB_Krnl_Telemetry.js";

export class krnlEntityBase {
  /**
   * @param {string} name - The unique identity of the entity.
   * @param {object|null} owner - The parent entity (if any).
   */
  constructor(name, owner = null, options = {}) {
    // 1. Core Identification.
    this.__krnlEntityInstance = true; // Marker for type checking.
    this.id = name || "UnnamedEntity"; // Unique ID.
    this.entityName = this.id;         // Alias for the name.
    this.Singleton = options.Singleton ?? this.constructor.Singleton ?? true;
    this.baseName = options.baseName || this.entityName;
    this.instanceNumber = options.instanceNumber || 1;

    // 2. Messaging Infrastructure (The IO Hub).
    this.interface = new krnlInterface(this);

    // 3. Logic Storage (The Brain).
    this.localFunctionalities = new Map();  // Logic that is MINE.
    this.remoteFunctionalities = new Map(); // Proxies for logic from components or external peers.
    this.collectors = new Set();            // Tracks listeners for cleanup.
    this.telemetryEnabled = false;          // Default: Disabled for zero overhead

    // 4. Hierarchy Management (The Skeleton).
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,          // Host.
      owner,         // Parent.
      krnlEntityBase // Base class for nesting.
    );
  }

  /**
   * Registers a local logic block.
   * If the functionality is 'public', it is automatically promoted to the owner.
   */
  addLocal(localFunctionality) {
    // 1. Ensure we have an instance of LocalFunctionality.
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    // 2. Bind it to THIS entity.
    functionality.bindToEntity(this);

    // 3. Save it to our local logic map.
    this.localFunctionalities.set(functionality.id, functionality);

    // 4. Notify our owner to promote this logic.
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityAdded) {
      owner._onComponentFunctionalityAdded(this, functionality);
    }

    return functionality;
  }

  /**
   * Registers a proxy for a functionality on another entity.
   * If the proxy is 'public', it is promoted to the owner (Recursive Bubbling).
   */
  addRemote(remoteFunctionality) {
    // 1. Ensure we have an instance of RemoteFunctionality.
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality
      ? remoteFunctionality
      : new krnlRemoteFunctionality(remoteFunctionality);

    // 2. Bind it to THIS entity.
    functionality.bindToEntity(this);

    // 3. Store the proxy.
    this.remoteFunctionalities.set(functionality.id, functionality);

    // 4. BUBBLING: Notify our owner to promote this proxy if it is public.
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityAdded) {
      owner._onComponentFunctionalityAdded(this, functionality);
    }

    return functionality;
  }

  /**
   * INTERFACE PROMOTION
   * Handles the automatic bubbling of component logic to the owner.
   */
  _onComponentFunctionalityAdded(component, functionality) {
    // 1. Only promote 'public' functionalities from the component.
    if (functionality.visibility !== 'public') return;

    console.log(`[${this.entityName}] Attempting to promote ${functionality.id} from ${component.entityName}`);

    const existing = this.remoteFunctionalities.get(functionality.id);
    if (existing) {
      existing.targetEntity = component;
      existing.targetFunction = functionality.id;
      return;
    }

    // 2. Register the component's functionality as a REMOTE proxy on this owner.
    // By default, promoted proxies are 'public' so they keep bubbling up,
    // but the owner can intercept this or re-configure the proxy to be 'private'.
    this.addRemote({
      id: functionality.id,
      targetEntity: component,
      targetFunction: functionality.id,
      visibility: 'public' // Bubbles up further by default.
    });

    console.log(`[${this.entityName}] Promoted component logic: ${functionality.id}`);
  }

  /**
   * Removes a promoted remote functionality and recursively propagates removal upward.
   * @param {object} component
   * @param {string} functionalityId
   */
  _onComponentFunctionalityRemoved(component, functionalityId) {
    console.log(`[${this.entityName}] Removing component logic: ${functionalityId} from ${component.entityName}`);
    const existing = this.remoteFunctionalities.get(functionalityId);
    if (!existing) {
      console.log(`[${this.entityName}] Logic ${functionalityId} not found in remoteFunctionalities.`);
      return;
    }
    if (existing.targetEntity !== component) {
      console.log(`[${this.entityName}] Logic ${functionalityId} targetEntity mismatch.`);
      return;
    }

    this.remoteFunctionalities.delete(functionalityId);

    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityRemoved) {
      owner._onComponentFunctionalityRemoved(this, functionalityId);
    }
  }

  /**
   * Internal helper to trigger promotion of all existing functionalities.
   * Useful when an entity is assigned an owner AFTER its functionalities are created.
   */
  _promoteAllExistingFunctionalities() {
    const owner = this.hierarchyManager.getOwnerEntity();
    if (!owner || !owner._onComponentFunctionalityAdded) return;

    this.localFunctionalities.forEach(f => {
      owner._onComponentFunctionalityAdded(this, f);
    });
    this.remoteFunctionalities.forEach(f => {
      owner._onComponentFunctionalityAdded(this, f);
    });
  }

  /**
   * Executes a functionality by ID.
   */
  async call(fid, input, opts = {}) {
    const unwrap = opts.unwrap !== false; // Default to true
    try {
      let result;
      if (this.localFunctionalities.has(fid)) {
        result = await this.localFunctionalities.get(fid).execute(input, opts);
      } else if (this.remoteFunctionalities.has(fid)) {
        result = await this.remoteFunctionalities.get(fid).execute(input, opts);
      } else {
        throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
      }

      // Universal result decoration hook
      if (this._decorateResult) {
        result = await this._decorateResult(result, fid, input);
      }

      // Backward compatibility: If it's a standard Krnl success envelope, unwrap it.
      // NOTE: We only unwrap if 'unwrap' is true AND there is NO preemptiveDocumentation
      if (unwrap && result && typeof result === 'object' && result.status === 'success' && 'payload' in result && !result.preemptiveDocumentation) {
        return result.payload;
      }

      // Backward compatibility: If it's a standard Krnl error envelope, throw it.
      if (result && typeof result === 'object' && result.status === 'error') {
        throw new krnlError(result.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
      }

      return result;
    } catch (err) {
      let finalErr = err;
      // Universal error decoration hook
      if (this._decorateError) {
        finalErr = await this._decorateError(err, fid, input);
      }
      
      // If the error was decorated into a Krnl error object, throw it so try/catch works locally
      if (finalErr && typeof finalErr === 'object' && finalErr.status === 'error') {
        const wrapper = new krnlError(finalErr.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
        Object.assign(wrapper, finalErr); // Preserve metadata/documentation
        throw wrapper;
      }

      throw finalErr;
    }
  }

  getLocal(fid) { return this.localFunctionalities.get(fid); }
  getRemote(fid) { return this.remoteFunctionalities.get(fid); }
  addChild(instance) {
    return this.hierarchyManager.addComponentEntityInstance(instance);
  }

  getTelemetry() {
    return {
      entity: this.entityName,
      timestamp: Date.now(),
      metrics: telemetry.getSummary()
    };
  }

  disposeOwnedComponent(entityId) {
    return this.hierarchyManager.disposeComponentEntity(entityId);
  }

  dispose() {
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    if (this.interface) this.interface.dispose();

    // 1. Teardown all local functionalities to release resources.
    this.localFunctionalities.forEach(func => {
      if (typeof func.teardown === 'function') {
        func.teardown();
      }
    });

    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
