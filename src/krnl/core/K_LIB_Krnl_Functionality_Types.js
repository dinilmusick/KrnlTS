//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.js
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
 */

import { krnlEmitter } from "./K_LIB_Krnl_Messaging_Concepts.js";

/**
 * Helper to ensure state isolation.
 */
function cloneState(source) {
  return JSON.parse(JSON.stringify(source));
}

/**
 * TRANSPORT ADAPTER INTERFACE
 */
export class krnlTransportAdapter {
  async call(targetFunction, input, opts) {
    throw new Error("TransportAdapter.call() not implemented.");
  }
}

/**
 * MEMORY TRANSPORT ADAPTER
 * Default adapter for in-memory entity communication.
 */
export class MemoryTransportAdapter extends krnlTransportAdapter {
  constructor(targetEntity) {
    super();
    this.targetEntity = targetEntity;
  }

  async call(targetFunction, input, opts) {
    if (!this.targetEntity || typeof this.targetEntity.call !== 'function') {
      throw new Error("MemoryTransportAdapter: Invalid target entity.");
    }
    return await this.targetEntity.call(targetFunction, input, opts);
  }
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
      initialState = {},
      api = (input) => input,
      helpers = {},
      emitters = {},
      events = {},
      schema = null,
      onMount = null,
      onTeardown = null,
    } = config;

    if (!id) throw new Error("LocalFunctionality requires an ID.");

    this.id = id;
    this.visibility = visibility;
    this.initialState = initialState;
    this.api = api;
    this.isLocal = true;
    this.helpers = new Map(Object.entries(helpers));
    this.emitters = new Map();
    this.schema = schema;

    this.lifecycle = {
      beginning: onMount || events.beginning,
      during: events.during,
      end: events.end,
      failure: events.failure,
      teardown: onTeardown || events.teardown
    };

    // Ensure state:changed emitter exists if not provided
    if (!emitters['state:changed']) {
      this.emitters.set('state:changed', new krnlEmitter());
    }

    Object.entries(emitters).forEach(([eid, e]) => {
      this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
    });

    this.state = this._createObservedState(cloneState(initialState));
  }

  _createObservedState(initialState) {
    const self = this;
    const handler = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'object' && value !== null) {
          return new Proxy(value, handler);
        }
        return value;
      },
      set(target, prop, value, receiver) {
        const result = Reflect.set(target, prop, value, receiver);
        if (result) {
          self._notifyStateChanged(prop, value);
        }
        return result;
      },
      deleteProperty(target, prop) {
        const result = Reflect.deleteProperty(target, prop);
        if (result) {
          self._notifyStateChanged(prop, undefined);
        }
        return result;
      }
    };
    return new Proxy(initialState, handler);
  }

  _notifyStateChanged(prop, value) {
    const stateEmitter = this.emitters.get('state:changed');
    if (stateEmitter) {
      stateEmitter.pushDataStreamToEmitter({
        prop,
        value,
        state: this.state, // This is the proxied state
        functionalityId: this.id
      });
    }
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
      this._unregisterFromInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner && owner._onComponentFunctionalityRemoved) {
        owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
      }
    }
  }

  _unregisterFromInterface() {
    const entity = this.hostEntity;
    if (!entity) return;
    entity.interface.removeCollector(this.id);
    this.emitters.forEach((_, eid) => {
      entity.interface.removeEmitter(`${this.id}:${eid}`);
    });
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
      this.lifecycle.beginning({
        state: this.state,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this
      });
    }
    return this;
  }

  teardown() {
    if (typeof this.lifecycle.teardown === "function") {
      this.lifecycle.teardown({
        state: this.state,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this
      });
    }
  }

  async execute(input, opts = {}) {
    const caller = opts.caller || 'default';
    const activeState = this.state;

    // --- INPUT VALIDATION ---
    if (this.schema && this.schema.input) {
      try {
        if (typeof this.schema.input.parse === 'function') {
          // Zod-like
          input = this.schema.input.parse(input);
        } else if (typeof this.schema.input === 'function') {
          // Custom validator function
          if (!this.schema.input(input)) {
            throw new Error(`Input validation failed.`);
          }
        }
      } catch (err) {
        const msg = err.errors ? JSON.stringify(err.errors) : err.message;
        throw new Error(`[KrnlSchemaError] Input validation failed for "${this.id}": ${msg}`);
      }
    }

    try {
      if (typeof this.lifecycle.during === "function") {
        this.lifecycle.during({ input, opts, state: activeState, entity: this.hostEntity });
      }

      let result = await this.api(input, {
        state: activeState,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this,
        caller: caller
      });

      // --- OUTPUT VALIDATION ---
      if (this.schema && this.schema.output) {
        try {
          if (typeof this.schema.output.parse === 'function') {
            result = this.schema.output.parse(result);
          } else if (typeof this.schema.output === 'function') {
            if (!this.schema.output(result)) {
              throw new Error(`Output validation failed.`);
            }
          }
        } catch (err) {
          const msg = err.errors ? JSON.stringify(err.errors) : err.message;
          throw new Error(`[KrnlSchemaError] Output validation failed for "${this.id}": ${msg}`);
        }
      }

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
    const { id, targetEntity, targetFunction, transport, visibility = 'public' } = config;
    this.id = id;
    this.targetFunction = targetFunction || id;
    this.targetEntity = targetEntity; // Store the target entity for identification
    this.visibility = visibility;
    this.isLocal = false;

    if (transport) {
      this.transport = transport;
    } else if (targetEntity) {
      this.transport = new MemoryTransportAdapter(targetEntity);
    } else {
      throw new Error("RemoteFunctionality requires either a transport or a targetEntity.");
    }
  }

  setVisibility(v) {
    const oldVisibility = this.visibility;
    this.visibility = v;
    if (this.hostEntity && oldVisibility === 'private' && v === 'public') {
      this._registerInInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (this.hostEntity && oldVisibility === 'public' && v === 'private') {
      this._unregisterFromInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner && owner._onComponentFunctionalityRemoved) {
        owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
      }
    }
  }

  _unregisterFromInterface() {
    if (!this.hostEntity) return;
    this.hostEntity.interface.removeCollector(this.id);
  }

  _registerInInterface() {
    const mainCollector = this.hostEntity.interface.createCollector(this.id);
    mainCollector._directHandler = async (msg) => {
      const caller = msg.metadata?.caller || 'anonymous';
      return await this.execute(msg.data, { caller });
    };
  }

  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      this._registerInInterface();
    }
  }

  async execute(input, opts = {}) {
    return await this.transport.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
  }
}
