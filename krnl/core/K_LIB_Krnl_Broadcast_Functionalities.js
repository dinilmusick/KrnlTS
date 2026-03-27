//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Broadcast_Functionalities.js
 * @description Manages stream-based (broadcast) functionalities tied to collectors and emitters.
 * Supports multi-instance: each instance has its own collector/emitter pair and state.
 */

import { rFind, rMap, rFilter } from "../extensions/K_LIB_Krnl_Core_Function_Atoms.js";
import { krnlError, krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL BROADCAST FUNCTIONALITIES ////////////////////////////////////////
/**
 * Manages broadcast (stream-based) functionalities on an entity.
 *
 * Workflow:
 *   1. define(name, method, options)  — registers a base functionality template with uFn prefix
 *   2. createInstance(functionalityName, callerName)  — spawns a unique instance with own collector/emitter/state
 *   3. call(instanceName, data)  — pushes data into an instance's collector
 */
export class krnlBroadcastFunctionalities {
  constructor(entity) {
    this.hostEntity = entity;
    this.definitions = [];  // array of { name, method, options }
    this.instances = [];    // array of { instanceName, definitionName, connectedStateIndex, input, output, disconnect, options }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// FUNCTIONALITY DEFINITIONS ////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Registers a base broadcast functionality definition.
   * @param {string} name - Base name (auto-prefixed with uFn).
   * @param {function} method - The processing function (receives data, returns result).
   * @param {object} [options={}] - Configuration.
   * @param {boolean} [options.stateful=false] - Whether instances should auto-create state.
   * @param {string} [options.stateKey='value'] - Default key for state caching.
   * @returns {this} For chaining.
   * @throws {krnlError} FUNCTIONALITY_ALREADY_DEFINED if name is already registered.
   */
  define(name, method, options = {}) {
    const fullName = `uFn${name}`;
    const existing = rFind(this.definitions, (d) => d.name === fullName);
    if (existing !== null) {
      throw new krnlError(krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED);
    }
    this.definitions.push({
      name: fullName,
      method,
      options: { stateful: false, stateKey: "value", ...options },
    });
    return this;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INSTANCE MANAGEMENT //////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a unique instance of a defined broadcast functionality for a specific caller.
   * Instance name: uFn{FunctionalityName}_{CallerName}
   * Each instance gets its own collector, emitter, and optionally a state.
   * @param {string} functionalityName - Base name of the functionality (without uFn prefix).
   * @param {string} callerName - Name of the caller entity/context.
   * @returns {{ instanceName: string, connectedStateIndex: number, output: object }} Instance info.
   * @throws {krnlError} FUNCTIONALITY_NOT_DEFINED if base functionality isn't registered.
   */
  createInstance(functionalityName, callerName) {
    const fullDefName = `uFn${functionalityName}`;
    const definition = rFind(this.definitions, (d) => d.name === fullDefName);
    if (definition === null) {
      throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
    }

    const instanceName = `${fullDefName}_${callerName}`;

    // Create dedicated collector and emitter for this instance
    const collector = this.hostEntity.interface.createCollector(`${instanceName}In`);
    const emitter = this.hostEntity.interface.createEmitter(`${instanceName}Out`);

    let connectedStateIndex = -1;

    if (definition.options.stateful) {
      const stateName = `${functionalityName}_${callerName}`;
      const result = this.hostEntity.stateManager.createState(stateName);
      connectedStateIndex = result.index;
    }

    // Wire the collector to process data through the functionality method
    const disconnectFn = collector.pipeTo(this.hostEntity, async (msg) => {
      try {
        const result = definition.method.call(this.hostEntity, msg.data);
        const finalResult = result instanceof Promise ? await result : result;

        if (definition.options.stateful && connectedStateIndex >= 0) {
          const state = this.hostEntity.stateManager.getStateByIndex(connectedStateIndex);
          state.set(definition.options.stateKey, finalResult);
        }

        emitter.pushDataStreamToEmitter(finalResult);
      } catch (error) {
        emitter.pushDataStreamToEmitter({ error: error.message, code: error.code ?? -1 });
      }
    });

    this.instances.push({
      instanceName,
      definitionName: fullDefName,
      connectedStateIndex,
      input: collector,
      output: emitter,
      disconnect: disconnectFn,
      options: definition.options,
    });

    return { instanceName, connectedStateIndex, output: emitter };
  }

  /**
   * Pushes data into an instance's collector to trigger processing.
   * @param {string} instanceName - Full instance name.
   * @param {*} data - Data to process.
   * @returns {object} The instance's output emitter (for subscribing to results).
   * @throws {krnlError} FUNCTIONALITY_INSTANCE_NOT_FOUND if instance doesn't exist.
   */
  call(instanceName, data) {
    const instance = rFind(this.instances, (inst) => inst.instanceName === instanceName);
    if (instance === null) {
      throw new krnlError(krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND);
    }
    instance.input.pushDataStreamToEmitter(data);
    return instance.output;
  }

  /**
   * Disconnects an instance's collector and emitter.
   * @param {string} instanceName - Full instance name.
   * @throws {krnlError} FUNCTIONALITY_INSTANCE_NOT_FOUND if instance doesn't exist.
   */
  disconnectInstance(instanceName) {
    const instance = rFind(this.instances, (inst) => inst.instanceName === instanceName);
    if (instance === null) {
      throw new krnlError(krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND);
    }
    instance.input.disconnectCollector();
    instance.output.disconnectEmitter();
    if (instance.disconnect) instance.disconnect();
  }

  /**
   * Lists all registered functionality definition names.
   * @returns {string[]} Array of definition names.
   */
  listFunctionalities() {
    return rMap(this.definitions, (d) => d.name);
  }

  /**
   * Lists all instance names for a given functionality definition.
   * @param {string} functionalityName - Base name (without uFn prefix).
   * @returns {string[]} Array of instance names.
   */
  listInstances(functionalityName) {
    const fullDefName = `uFn${functionalityName}`;
    const matching = rFilter(this.instances, (inst) => inst.definitionName === fullDefName);
    return rMap(matching, (inst) => inst.instanceName);
  }

  /**
   * Disposes a specific functionality instance.
   * @param {string} instanceName - Full instance name.
   */
  disposeInstance(instanceName) {
    const index = rFindIndex(this.instances, (inst) => inst.instanceName === instanceName);
    if (index !== -1) {
      const instance = this.instances[index];
      instance.input.disconnectCollector();
      instance.output.disconnectEmitter();
      if (instance.disconnect) instance.disconnect();
      this.instances.splice(index, 1);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Disconnects all instances and clears definitions.
   */
  dispose() {
    for (let i = 0; i < this.instances.length; i++) {
      this.disconnectInstance(this.instances[i].instanceName);
    }
    this.instances = [];
    this.definitions = [];
  }
}
