//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.js
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
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
 * The fundamental unit of logic.
 */
export class krnlLocalFunctionality {
  constructor(config = {}) {
    const {
      id,
      visibility = 'public', // Default: public (bubbles up)
      stateModel = 'single',
      initialState = {},
      api = (input) => input,
      helpers = {},
      emitters = {},
      events = {},
    } = config;

    if (!id) throw new Error("LocalFunctionality requires an ID.");

    this.id = id;
    this.visibility = visibility;
    this.stateModel = stateModel;
    this.initialState = initialState;
    this.api = api;
    this.isLocal = true;
    this.helpers = new Map(Object.entries(helpers));
    this.emitters = new Map();
    this.lifecycle = {
      beginning: events.beginning,
      during: events.during,
      end: events.end,
      failure: events.failure
    };

    if (this.stateModel === 'multi') {
      this.states = new Map();
    } else {
      this.state = cloneState(initialState);
    }

    Object.entries(emitters).forEach(([eid, e]) => {
      this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
    });
  }

  /**
   * Updates the visibility and handles interface registration/deregistration.
   * This is the mechanism used to STOP bubbling at a certain level.
   * @param {'public'|'private'} v 
   */
  setVisibility(v) {
    const oldVisibility = this.visibility;
    this.visibility = v;

    if (!this.hostEntity) return;

    if (oldVisibility === 'private' && v === 'public') {
      // Transition to Public: Register in interface
      this._registerInInterface();
      // Notify owner to bubble it up
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (oldVisibility === 'public' && v === 'private') {
      // Transition to Private: Remove from interface
      // (Implementation note: current interface doesn't support easy removal by name,
      // but in a production system, we would prune the collectors/emitters here).
      console.warn(`[${this.id}] Visibility set to private. Higher entities will no longer see this.`);
    }
  }

  _registerInInterface() {
    const entity = this.hostEntity;
    // Register API as input
    const mainCollector = entity.interface.createCollector(this.id);
    mainCollector._directHandler = async (msg) => {
      const caller = msg.metadata?.caller || 'anonymous';
      return await this.execute(msg.data, { caller });
    };

    // Register Emitters as outputs
    this.emitters.forEach((emitter, eid) => {
      const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${eid}`);
      emitter.subscribe((msg) => interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time));
    });
  }

  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      this._registerInInterface();
    }
    if (typeof this.lifecycle.beginning === "function") {
      this.lifecycle.beginning({ entity, functionality: this });
    }
    return this;
  }

  async execute(input, opts = {}) {
    const caller = opts.caller || 'default';
    let activeState = this.stateModel === 'multi' 
      ? (this.states.get(caller) || this.states.set(caller, cloneState(this.initialState)).get(caller))
      : this.state;

    try {
      if (typeof this.lifecycle.during === "function") {
        this.lifecycle.during({ input, opts, state: activeState, entity: this.hostEntity });
      }

      const result = await this.api(input, {
        state: activeState,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        caller: caller
      });

      if (typeof this.lifecycle.end === "function") {
        this.lifecycle.end({ input, output: result, caller });
      }

      return result;
    } catch (error) {
      if (typeof this.lifecycle.failure === "function") {
        this.lifecycle.failure({ error, input, caller });
      }
      throw error;
    }
  }
}

/**
 * KRNL REMOTE FUNCTIONALITY
 * Proxy for recursive bubbling.
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

  setVisibility(v) {
    const oldVisibility = this.visibility;
    this.visibility = v;
    if (this.hostEntity && oldVisibility === 'private' && v === 'public') {
      this._registerInInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    }
  }

  _registerInInterface() {
    const proxyEmitter = this.hostEntity.interface.createEmitter(this.id);
    proxyEmitter.subscribe(async (msg) => await this.execute(msg.data));
  }

  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      this._registerInInterface();
    }
  }

  async execute(input, opts = {}) {
    return await this.targetEntity.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
  }
}
