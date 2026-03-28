//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.js
 * @description vNext Local/Remote functionality model for Krnl entities.
 */

import { krnlEmitter, krnlCollector } from "./K_LIB_Krnl_Messaging_Concepts.js";

function cloneMap(source = {}) {
  if (source instanceof Map) return new Map(source);
  return new Map(Object.entries(source));
}

function resolveTargetEntityInstance(targetEntityRef, opts = {}) {
  if (targetEntityRef?.__krnlEntityInstance === true) return targetEntityRef;

  if (typeof targetEntityRef === "function") {
    // Factory/class path.
    return targetEntityRef(opts.instance_id);
  }

  if (targetEntityRef && typeof targetEntityRef.createInstance === "function") {
    return targetEntityRef.createInstance(opts.instance_id);
  }

  if (targetEntityRef && typeof targetEntityRef.instantiate === "function") {
    return targetEntityRef.instantiate(opts.instance_id);
  }

  throw new Error("Remote target entity cannot be instantiated.");
}

export class krnlLocalFunctionality {
  constructor(config = {}) {
    const {
      id,
      state = {},
      api = (input) => input,
      helpers = {},
      emitters = {},
      collectors = [],
      lifecycle = {},
    } = config;

    if (!id) throw new Error("LocalFunctionality requires an id.");

    this.id = id;
    this.isLocal = true;
    this.state = state;
    this.api = api;
    this.helpers = cloneMap(helpers);
    this.emitters = new Map();
    this.collectors = new Set(collectors);
    this.lifecycle = {
      onInit: lifecycle.onInit,
      onCall: lifecycle.onCall,
      onComplete: lifecycle.onComplete,
      onError: lifecycle.onError,
    };

    const emitterEntries = emitters instanceof Map ? emitters.entries() : Object.entries(emitters);
    for (const [emitterId, emitter] of emitterEntries) {
      this.emitters.set(emitterId, emitter instanceof krnlEmitter ? emitter : new krnlEmitter());
    }
  }

  bindToEntity(entity) {
    this.hostEntity = entity;

    // 1. Register main API as a collector in the entity interface
    // This allows the functionality to be called via the messaging system
    const mainCollector = entity.interface.createCollector(this.id);
    mainCollector._directHandler = async (msg) => {
      // The direct handler triggers the execution of the API
      return await this.execute(msg.data);
    };

    // 2. Register all internal emitters in the entity interface
    // Convention: "functionalityId:emitterId"
    this.emitters.forEach((emitter, emitterId) => {
      const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${emitterId}`);
      
      // Mirror internal emitter pushes to the interface emitter
      emitter.subscribe((msg) => {
        interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time);
      });
    });

    if (typeof this.lifecycle.onInit === "function") {
      this.lifecycle.onInit({ entity, functionality: this });
    }
    return this;
  }

  async execute(input, opts = {}) {
    try {
      if (typeof this.lifecycle.onCall === "function") {
        this.lifecycle.onCall({ input, opts, functionality: this, entity: this.hostEntity });
      }

      const output = await this.api(input, {
        ...opts,
        state: this.state,
        helpers: this.helpers,
        emitters: this.emitters,
        collectors: this.collectors,
        entity: this.hostEntity,
        functionality: this,
      });

      if (typeof this.lifecycle.onComplete === "function") {
        this.lifecycle.onComplete({ input, output, opts, functionality: this, entity: this.hostEntity });
      }

      return output;
    } catch (error) {
      if (typeof this.lifecycle.onError === "function") {
        this.lifecycle.onError({ input, error, opts, functionality: this, entity: this.hostEntity });
      }
      throw error;
    }
  }
}

export class krnlRemoteFunctionality {
  constructor(config = {}) {
    const { id, target, proxy_api = null, collectors = [] } = config;
    if (!id) throw new Error("RemoteFunctionality requires an id.");
    if (!target?.entity || !target?.functionality) {
      throw new Error("RemoteFunctionality target requires { entity, functionality }.");
    }

    this.id = id;
    this.isLocal = false;
    this.target = target;
    this.collectors = new Set(collectors);
    this.proxy_api = proxy_api;
  }

  bindToEntity(entity) {
    this.hostEntity = entity;

    // 1. Register an emitter to call this remote functionality via interface
    const remoteEmitter = entity.interface.createEmitter(this.id);
    remoteEmitter.subscribe(async (msg) => {
      return await this.execute(msg.data);
    });

    // 2. Automatically discover and mirror emitters from the target
    // Note: This requires the target to be resolvable at bind time for full automation,
    // otherwise it can be done lazily in resolveTarget or manually via bindEvents.
    try {
      const { targetFunctionality } = this.resolveTarget({});
      targetFunctionality.emitters.forEach((emitter, emitterId) => {
        const localMirror = entity.interface.createCollector(`${this.id}:${emitterId}`);
        localMirror.subscribeTo(emitter, (msg) => {
          // You could add global remote event handlers here
        });
        this.collectors.add(localMirror);
      });
    } catch (e) {
      // If target is not resolvable yet (e.g. dynamic loading), 
      // the user must call bindEvents or we handle it lazily.
      console.warn(`[RemoteFunctionality:${this.id}] Could not auto-bind events: ${e.message}`);
    }

    return this;
  }

  resolveTarget(opts = {}) {
    const targetEntityInstance = resolveTargetEntityInstance(this.target.entity, opts);
    const targetFunctionality = targetEntityInstance.getLocal(this.target.functionality);
    if (!targetFunctionality) {
      throw new Error(`Remote target functionality '${this.target.functionality}' not found.`);
    }
    return { targetEntityInstance, targetFunctionality };
  }

  async execute(input, opts = {}) {
    if (typeof this.proxy_api === "function") {
      return this.proxy_api(input, opts, this);
    }

    const { targetFunctionality } = this.resolveTarget(opts);
    return targetFunctionality.execute(input, opts);
  }

  bindEvents(bindings = []) {
    for (const binding of bindings) {
      const { targetEmitterId, collectorHandler } = binding;
      const { targetFunctionality } = this.resolveTarget({});
      const emitter = targetFunctionality.emitters.get(targetEmitterId);
      if (!emitter) continue;

      const collector = new krnlCollector();
      collector.subscribeTo(emitter, (msg) => {
        if (typeof collectorHandler === "function") {
          collectorHandler(msg, { remote: this, targetFunctionality });
        }
      });
      this.collectors.add(collector);
    }

    return this;
  }

  get state() {
    return undefined;
  }
}
