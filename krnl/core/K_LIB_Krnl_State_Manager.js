//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_State_Manager.js
 * @description Provides state management logic for Krnl entities.
 * Single source of truth: states stored as array only, derived maps computed fresh.
 */

import {
  rFind,
  rFindIndex,
  rMap,
  rBuildMap,
} from "../extensions/K_LIB_Krnl_Core_Function_Atoms.js";

import {
  krnlError,
  krnlErrorCodes,
} from "./K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL STATE ////////////////////////////////////////
/**
 * A named key-value state container.
 * Name is prefixed with uSt by the StateManager at creation time.
 */
export class krnlState {
  constructor(name) {
    this.name = name;
    this.data = new Map(); // key → value storage
  }

  set(key, value) {
    this.data.set(key, value);
    return value;
  }

  get(key, defaultValue = null) {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    return this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }

  entries() {
    return Array.from(this.data.entries());
  }
}

//////////////////////////////////////// KRNL STATE MANAGER ////////////////////////////////////////
/**
 * Manages named states for an entity.
 * Single source of truth: this.states is the only data store (array).
 * Derived views (maps) are computed fresh via buildStateMap().
 */
export class krnlStateManager {
  constructor(entity) {
    this.hostEntity = entity;
    this.states = []; // array of krnlState — single source of truth
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// STATE MANAGEMENT /////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new named state. Name is auto-prefixed with uSt.
   * @param {string} name - Base name for the state.
   * @returns {{ state: krnlState, index: number }} The created state and its index.
   * @throws {krnlError} STATE_DUPLICATE_NAME if a state with this name already exists.
   */
  createState(name) {
    const fullName = `uSt${name}`;
    const existing = rFind(this.states, (s) => s.name === fullName);
    if (existing !== null) {
      throw new krnlError(krnlErrorCodes.STATE_DUPLICATE_NAME);
    }
    const newState = new krnlState(fullName);
    this.states.push(newState);
    const index = this.states.length - 1;
    return { state: newState, index };
  }

  /**
   * Retrieves a state by its name.
   * @param {string} name - Base name (without uSt prefix) or full name (with uSt prefix).
   * @returns {krnlState} The found state.
   * @throws {krnlError} STATE_NOT_FOUND if no state matches.
   */
  getStateByName(name) {
    const fullName = name.startsWith("uSt") ? name : `uSt${name}`;
    const state = rFind(this.states, (s) => s.name === fullName);
    if (state === null) {
      throw new krnlError(krnlErrorCodes.STATE_NOT_FOUND);
    }
    return state;
  }

  /**
   * Retrieves a state by its array index.
   * @param {number} index - The index of the state.
   * @returns {krnlState} The state at the given index.
   * @throws {krnlError} STATE_INDEX_OUT_OF_RANGE if index is invalid.
   */
  getStateByIndex(index) {
    if (index < 0 || index >= this.states.length) {
      throw new krnlError(krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE);
    }
    return this.states[index];
  }

  /**
   * Returns a list of all state names.
   * @returns {string[]} Array of state names.
   */
  listStateNames() {
    return rMap(this.states, (s) => s.name);
  }

  /**
   * Builds a fresh Map<stateName, stateIndex> from the states array.
   * This is a derived view — never stored, always computed.
   * @returns {Map<string, number>} Map of state names to their indices.
   */
  buildStateMap() {
    return rBuildMap(
      this.states,
      (s) => s.name,
      (_s, i) => i
    );
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// CONVENIENCE HELPERS //////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Convenience: set a value on a named state.
   * @param {string} stateName - Base name or full name of the state.
   * @param {string} key - Key within the state's data map.
   * @param {*} value - Value to set.
   * @returns {*} The value that was set.
   * @throws {krnlError} STATE_NOT_FOUND if state doesn't exist.
   */
  setStateValue(stateName, key, value) {
    const state = this.getStateByName(stateName);
    return state.set(key, value);
  }

  /**
   * Convenience: get a value from a named state.
   * @param {string} stateName - Base name or full name of the state.
   * @param {string} key - Key within the state's data map.
   * @param {*} [defaultValue=null] - Value returned if key is not in state.
   * @returns {*} The value, or defaultValue.
   * @throws {krnlError} STATE_NOT_FOUND if state doesn't exist.
   */
  getStateValue(stateName, key, defaultValue = null) {
    const state = this.getStateByName(stateName);
    return state.get(key, defaultValue);
  }

  /**
   * Deletes a state by name.
   * @param {string} name - Base name or full name.
   * @returns {boolean} true if deleted.
   * @throws {krnlError} STATE_NOT_FOUND if state doesn't exist.
   */
  deleteState(name) {
    const fullName = name.startsWith("uSt") ? name : `uSt${name}`;
    const index = rFindIndex(this.states, (s) => s.name === fullName);
    if (index === -1) {
      throw new krnlError(krnlErrorCodes.STATE_NOT_FOUND);
    }
    this.states.splice(index, 1);
    return true;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Clears all states.
   */
  dispose() {
    for (let i = 0; i < this.states.length; i++) {
      this.states[i].clear();
    }
    this.states = [];
  }
}
