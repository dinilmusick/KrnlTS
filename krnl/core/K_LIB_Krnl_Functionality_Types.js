//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.js
 * @description Defines Local and Remote functionalities with visibility and state management.
 */

import { krnlEmitter, krnlCollector } from "./K_LIB_Krnl_Messaging_Concepts.js";

/**
 * Helper to clone state objects to ensure isolation.
 */
function cloneState(source) {
  // Simple JSON clone for state objects; can be replaced with structuredClone if available.
  return JSON.parse(JSON.stringify(source));
}

/**
 * KRNL LOCAL FUNCTIONALITY
 * A self-contained logic block that lives within an entity.
 */
export class krnlLocalFunctionality {
  /**
   * @param {object} config - Configuration for the functionality.
   */
  constructor(config = {}) {
    // 1. Destructure config with defaults for the new paradigm.
    const {
      id,                               // Unique ID for this functionality.
      visibility = 'public',            // 'public' (visible to owner/peers) or 'private' (internal only).
      stateModel = 'single',            // 'single' (one state) or 'multi' (state per caller).
      initialState = {},                // The starting template for state.
      api = (input) => input,           // The actual logic function.
      helpers = {},                     // Internal helper functions.
      emitters = {},                    // Event streams this functionality emits.
      lifecycle = {},                   // Hook points (onInit, onCall, etc).
    } = config;

    // 2. Validate essential identity.
    if (!id) throw new Error("LocalFunctionality requires an id.");

    // 3. Assign core properties.
    this.id = id;                       // Store the unique ID.
    this.visibility = visibility;       // Set visibility: public or private.
    this.stateModel = stateModel;       // Set state model: single or multi.
    this.initialState = initialState;   // Keep the template for new state instances.
    this.api = api;                     // Bind the logic.
    this.isLocal = true;                // Flag identifying this as a local block.
    
    // 4. Initialize State Containers based on the selected model.
    if (this.stateModel === 'multi') {
      this.states = new Map();          // Map of CallerName -> StateObject.
    } else {
      this.state = cloneState(initialState); // Single shared state object.
    }

    // 5. Initialize Emitters and Helpers.
    this.helpers = new Map(Object.entries(helpers)); // Convert helpers to a Map.
    this.emitters = new Map();                       // Internal emitters map.
    this.lifecycle = lifecycle;                      // Store lifecycle hooks.

    // 6. Register initial emitters from config.
    Object.entries(emitters).forEach(([eid, e]) => {
      this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
    });
  }

  /**
   * Binds this functionality to a host entity and handles auto-registration.
   * @param {object} entity - The krnlEntityBase instance.
   */
  bindToEntity(entity) {
    this.hostEntity = entity; // Establish the parent link.

    // 1. Register logic in the Entity's interface ONLY if it is public.
    if (this.visibility === 'public') {
      // Create a collector on the entity interface named after this functionality.
      const mainCollector = entity.interface.createCollector(this.id);
      // Link the collector's handler to this functionality's execution.
      mainCollector._directHandler = async (msg) => {
        // Extract caller from message metadata or default to 'anonymous'.
        const caller = msg.metadata?.caller || 'anonymous';
        return await this.execute(msg.data, { caller });
      };

      // 2. Register Emitters in the Entity's interface.
      this.emitters.forEach((emitter, eid) => {
        // Name convention: "FunctionalityID:EmitterID".
        const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${eid}`);
        // Pipe internal events to the public interface.
        emitter.subscribe((msg) => interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time));
      });
    }

    // 3. Trigger initialization lifecycle hook.
    if (typeof this.lifecycle.onInit === "function") {
      this.lifecycle.onInit({ entity, functionality: this });
    }
    return this;
  }

  /**
   * Executes the API logic, selecting the correct state based on the caller.
   * @param {any} input - Arguments passed to the API.
   * @param {object} opts - Options including the 'caller' name.
   */
  async execute(input, opts = {}) {
    const caller = opts.caller || 'default'; // Identify who is making the call.
    let activeState; // Variable to hold the state for this specific execution.

    // 1. Resolve the correct state object based on the stateModel.
    if (this.stateModel === 'multi') {
      // If no state exists for this caller, create one from the template.
      if (!this.states.has(caller)) {
        this.states.set(caller, cloneState(this.initialState));
      }
      activeState = this.states.get(caller); // Retrieve the caller-specific state.
    } else {
      activeState = this.state; // Use the single shared state.
    }

    // 2. Execute the actual logic.
    try {
      if (typeof this.lifecycle.onCall === "function") {
        this.lifecycle.onCall({ input, opts, state: activeState, entity: this.hostEntity });
      }

      // Call the API with the resolved state and context.
      const result = await this.api(input, {
        state: activeState,      // The caller-specific or single state.
        emitters: this.emitters, // Access to events.
        helpers: this.helpers,   // Access to internal tools.
        entity: this.hostEntity, // Reference to the host.
        caller: caller           // Name of the entity/system calling this.
      });

      return result;
    } catch (error) {
      if (typeof this.lifecycle.onError === "function") {
        this.lifecycle.onError({ error, input, caller });
      }
      throw error;
    }
  }

  /**
   * Disposes of a specific caller's state in a multi-state model.
   * @param {string} caller - The name of the caller whose state to wipe.
   */
  disposeState(caller) {
    if (this.stateModel === 'multi') {
      this.states.delete(caller); // Remove only the specific state entry.
    }
  }
}

/**
 * KRNL REMOTE FUNCTIONALITY
 * A proxy that "borrows" a functionality from an external, non-component entity.
 */
export class krnlRemoteFunctionality {
  /**
   * @param {object} config - Target entity and functionality name.
   */
  constructor(config = {}) {
    const { 
      id,               // The ID this proxy will use locally.
      targetEntity,     // The actual entity instance to call.
      targetFunction,   // The ID of the functionality on that target.
      visibility = 'public' // Usually public to allow owner to use it.
    } = config;

    if (!id || !targetEntity || !targetFunction) {
      throw new Error("RemoteFunctionality requires id, targetEntity, and targetFunction.");
    }

    this.id = id;                       // Local alias for the remote logic.
    this.targetEntity = targetEntity;   // Reference to the external entity.
    this.targetFunction = targetFunction; // Name of the logic on the external entity.
    this.visibility = visibility;       // Visibility on the CURRENT host.
    this.isLocal = false;               // Identify as a proxy.
  }

  /**
   * Binds the proxy to a host and registers it in the local interface.
   */
  bindToEntity(entity) {
    this.hostEntity = entity; // Link to current host.

    // If public, register as an emitter in the local interface to allow local calls.
    if (this.visibility === 'public') {
      const proxyEmitter = entity.interface.createEmitter(this.id);
      // When the local interface receives a call, forward it to the target entity.
      proxyEmitter.subscribe(async (msg) => {
        return await this.execute(msg.data);
      });
    }
  }

  /**
   * Forwards the call to the remote target entity.
   */
  async execute(input, opts = {}) {
    // Inject the host name as the caller for state tracking on the target.
    const forwardOpts = { ...opts, caller: this.hostEntity.entityName };
    // Trigger the actual call on the target entity instance.
    return await this.targetEntity.call(this.targetFunction, input, forwardOpts);
  }
}
