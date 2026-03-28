//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Returned_Functionalities.js
 * @description Manages named functionalities that return immediate results.
 * Supports multi-instance: each instance has a unique name and its own state.
 */

import { rFind, rFindIndex, rMap, rFilter } from "../extensions/K_LIB_Krnl_Core_Function_Atoms.js";
import { krnlError, krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL RETURNED FUNCTIONALITIES ////////////////////////////////////////
/**
 * Manages returned (request-response) functionalities on an entity.
 * 
 * Workflow:
 *   1. define(name, method, options)  — registers a base functionality template with uFn prefix
 *   2. createInstance(functionalityName, callerName)  — spawns a unique instance with its own state
 *   3. call(instanceName, data)  — executes an instance's method and returns the result
 */
export class krnlReturnedFunctionalities {
  constructor(entity) {
    this.hostEntity = entity;
    this.definitions = [];  // array of { name, method, options }
    this.instances = [];    // array of { instanceName, definitionName, connectedStateIndex, method }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// FUNCTIONALITY DEFINITIONS ////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Registers a base functionality definition.
   * @param {string} name - Base name (auto-prefixed with uFn).
   * @param {function} method - The function to execute.
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
   * Creates a unique instance of a defined functionality for a specific caller.
   * Instance name: uFn{FunctionalityName}_{CallerName}
   * If stateful, creates a state named uSt{FunctionalityName}_{CallerName}.
   * @param {string} functionalityName - Base name of the functionality (without uFn prefix).
   * @param {string} callerName - Name of the caller entity/context.
   * @returns {{ instanceName: string, connectedStateIndex: number }} Instance info.
   * @throws {krnlError} FUNCTIONALITY_NOT_DEFINED if base functionality isn't registered.
   */
  createInstance(functionalityName, callerName) {
    const fullDefName = `uFn${functionalityName}`;
    const definition = rFind(this.definitions, (d) => d.name === fullDefName);
    if (definition === null) {
      throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
    }

    const instanceName = `${fullDefName}_${callerName}`;
    let connectedStateIndex = -1;

    if (definition.options.stateful) {
      const stateName = `${functionalityName}_${callerName}`;
      const result = this.hostEntity.stateManager.createState(stateName);
      connectedStateIndex = result.index;
    }

    this.instances.push({
      instanceName,
      definitionName: fullDefName,
      connectedStateIndex,
      method: definition.method,
      options: definition.options,
    });

    return { instanceName, connectedStateIndex };
  }

  /**
   * Calls an instance's method with the provided data and returns the result.
   * If stateful, caches the result in the instance's connected state.
   * @param {string} instanceName - Full instance name (e.g., uFnVolume_AudioEngine).
   * @param {*} data - Input data for the function.
   * @returns {Promise<*>} The result of the function call.
   * @throws {krnlError} FUNCTIONALITY_INSTANCE_NOT_FOUND if instance doesn't exist.
   */
  async call(instanceName, data) {
    const instance = rFind(this.instances, (inst) => inst.instanceName === instanceName);
    if (instance === null) {
      throw new krnlError(krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND);
    }

    const result = instance.method.call(this.hostEntity, data);
    const finalResult = result instanceof Promise ? await result : result;

    if (instance.options.stateful && instance.connectedStateIndex >= 0) {
      const state = this.hostEntity.stateManager.getStateByIndex(instance.connectedStateIndex);
      state.set(instance.options.stateKey, finalResult);
    }

    return finalResult;
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
      this.instances.splice(index, 1);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Cleans up all instances.
   */
  dispose() {
    this.instances = [];
    this.definitions = [];
  }
}
