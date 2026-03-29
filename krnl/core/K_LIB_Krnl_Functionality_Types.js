//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.js
 * @description Optimized for the "Ultrst" Philosophy (by Dinil Palackal).
 * 
 * This file treats Functionalities as "Atoms" that are assembled from 
 * separate files (Main Function, Helpers, Events) in a strict directory structure.
 */

import { krnlEmitter, krnlCollector } from "./K_LIB_Krnl_Messaging_Concepts.js";

/**
 * Helper to ensure state isolation.
 */
function cloneState(source) {
  return JSON.parse(JSON.stringify(source));
}

/**
 * KRNL LOCAL FUNCTIONALITY
 * The logic "Atom". In the Ultrst philosophy, this is the result of importing 
 * the 'Main Function', 'Helpers', and 'Events' into a single functionality root.
 */
export class krnlLocalFunctionality {
  /**
   * @param {object} config - The assembled atoms of the functionality.
   */
  constructor(config = {}) {
    const {
      id,                               // Name of the functionality folder.
      visibility = 'public',            // Public (promoted to owner) or Private (internal).
      stateModel = 'single',            // singleState or multiState.
      initialState = {},                // The state data structure defined in the functionality.
      api = (input) => input,           // The "Main Function" (api logic).
      helpers = {},                     // The "Helper Functions" (modular logic atoms).
      emitters = {},                    // The "Events" (outputs) defined in the events folder.
      events = {},                      // The "Events" (lifecycle hooks: onInit, onCall, etc).
    } = config;

    if (!id) throw new Error("Ultrst Error: Functionality Atom requires an ID (Folder Name).");

    // 1. Identity & Visibility
    this.id = id;
    this.visibility = visibility;
    this.stateModel = stateModel;
    this.initialState = initialState;
    this.isLocal = true;

    // 2. Logic Assembly (The Atoms)
    this.api = api;                                  // The Main Function atom.
    this.helpers = new Map(Object.entries(helpers)); // The Helper Function atoms.
    this.emitters = new Map();                       // The Event Stream atoms.
    
    // 3. Lifecycle Events (The "Events" folder logic)
    // Maps Ultrst "Events" to the internal lifecycle hooks.
    this.lifecycle = {
      onInit: events.onInit || events.beginning,
      onCall: events.onCall || events.during,
      onComplete: events.onComplete || events.end,
      onError: events.onError || events.failure
    };

    // 4. State Initialization
    if (this.stateModel === 'multi') {
      this.states = new Map();
    } else {
      this.state = cloneState(initialState);
    }

    // 5. Emitter Assembly
    Object.entries(emitters).forEach(([eid, e]) => {
      this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
    });
  }

  /**
   * Binds the Atom to the Entity.
   */
  bindToEntity(entity) {
    this.hostEntity = entity;

    // Automatic Interface Registration (Wiring the Atom to the Hub)
    if (this.visibility === 'public') {
      const mainCollector = entity.interface.createCollector(this.id);
      mainCollector._directHandler = async (msg) => {
        const caller = msg.metadata?.caller || 'anonymous';
        return await this.execute(msg.data, { caller });
      };

      this.emitters.forEach((emitter, eid) => {
        const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${eid}`);
        emitter.subscribe((msg) => interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time));
      });
    }

    // Trigger the "Beginning" Event
    if (typeof this.lifecycle.onInit === "function") {
      this.lifecycle.onInit({ entity, functionality: this });
    }
    return this;
  }

  /**
   * Execution Logic (Caller-Aware)
   */
  async execute(input, opts = {}) {
    const caller = opts.caller || 'default';
    let activeState = this.stateModel === 'multi' 
      ? (this.states.get(caller) || this.states.set(caller, cloneState(this.initialState)).get(caller))
      : this.state;

    try {
      // Trigger the "During" Event
      if (typeof this.lifecycle.onCall === "function") {
        this.lifecycle.onCall({ input, opts, state: activeState, entity: this.hostEntity });
      }

      // Execute the Main Function Atom
      const result = await this.api(input, {
        state: activeState,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        caller: caller
      });

      // Trigger the "End" Event
      if (typeof this.lifecycle.onComplete === "function") {
        this.lifecycle.onComplete({ input, output: result, caller });
      }

      return result;
    } catch (error) {
      // Trigger the "Failure" Event
      if (typeof this.lifecycle.onError === "function") {
        this.lifecycle.onError({ error, input, caller });
      }
      throw error;
    }
  }

  disposeState(caller) {
    if (this.stateModel === 'multi') this.states.delete(caller);
  }
}

/**
 * KRNL REMOTE FUNCTIONALITY
 * Proxy for borrowing logic from external singleton entities.
 */
export class krnlRemoteFunctionality {
  constructor(config = {}) {
    const { id, targetEntity, targetFunction, visibility = 'public' } = config;
    this.id = id;
    this.targetEntity = targetEntity;
    this.targetFunction = targetFunction;
    this.visibility = visibility;
    this.isLocal = false;
  }

  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      const proxyEmitter = entity.interface.createEmitter(this.id);
      proxyEmitter.subscribe(async (msg) => await this.execute(msg.data));
    }
  }

  async execute(input, opts = {}) {
    return await this.targetEntity.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
  }
}
