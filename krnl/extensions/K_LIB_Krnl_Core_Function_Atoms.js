//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Core_Function_Atoms.js
 * @description These are very low level, building blocks of functions and logic shared across the entire Krnl system.
 * This file does not have dependencies.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// CREATE ENUM ////////////////////////////////////////
/**
 * Creates an immutable enum object from a list of type names.
 * @param {string[]} typeNames - An array of strings representing the enum type names.
 * @returns {Readonly<object>} An immutable enum object.
 */
export function createEnum(typeNames) {
  const enumObj = { ...EnumTemplate };
  enumObj.types = typeNames;
  rForEach(typeNames, (name, index) => { enumObj[name] = index; });
  return Object.freeze(enumObj);
}

//////////////////////////////////////// FIND BY FIELD ////////////////////////////////////////
/**
 * Finds an object in an array based on a field's value.
 * @param {string} fieldName - The name of the field to search by.
 * @param {*} value - The value to match.
 * @param {Array<object>} objects - The array of objects to search within.
 * @returns {object|null} The first object that matches the criteria, or null if not found.
 */
export function findByField(fieldName, value, objects) {
  return rFind(objects, (obj) => obj?.[fieldName] === value);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// RECURSIVE PROCESSING FUNCTIONS ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// R MAP ////////////////////////////////////////
/**
 * Recursive map: transforms each element of arr via fn.
 * @param {Array} arr - Source array.
 * @param {function(element, index): *} fn - Transform function.
 * @param {number} [i=0] - Current index (internal).
 * @returns {Array} New array of transformed elements.
 */
export function rMap(arr, fn, i = 0) {
  if (i >= arr.length) return [];
  return [fn(arr[i], i), ...rMap(arr, fn, i + 1)];
}

//////////////////////////////////////// R FILTER ////////////////////////////////////////
/**
 * Recursive filter: returns elements where fn returns true.
 * @param {Array} arr - Source array.
 * @param {function(element, index): boolean} fn - Predicate function.
 * @param {number} [i=0] - Current index (internal).
 * @returns {Array} New array of matching elements.
 */
export function rFilter(arr, fn, i = 0) {
  if (i >= arr.length) return [];
  const rest = rFilter(arr, fn, i + 1);
  return fn(arr[i], i) ? [arr[i], ...rest] : rest;
}

//////////////////////////////////////// R FIND ////////////////////////////////////////
/**
 * Recursive find: returns first element where fn returns true.
 * @param {Array} arr - Source array.
 * @param {function(element, index): boolean} fn - Predicate function.
 * @param {number} [i=0] - Current index (internal).
 * @returns {*|null} Found element, or null if not found.
 */
export function rFind(arr, fn, i = 0) {
  if (i >= arr.length) return null;
  if (fn(arr[i], i)) return arr[i];
  return rFind(arr, fn, i + 1);
}

//////////////////////////////////////// R FIND INDEX ////////////////////////////////////////
/**
 * Recursive findIndex: returns index of first element where fn returns true.
 * @param {Array} arr - Source array.
 * @param {function(element, index): boolean} fn - Predicate function.
 * @param {number} [i=0] - Current index (internal).
 * @returns {number} Index of found element, or -1 if not found.
 */
export function rFindIndex(arr, fn, i = 0) {
  if (i >= arr.length) return -1;
  if (fn(arr[i], i)) return i;
  return rFindIndex(arr, fn, i + 1);
}

//////////////////////////////////////// R REDUCE ////////////////////////////////////////
/**
 * Recursive reduce: accumulates a value over arr.
 * @param {Array} arr - Source array.
 * @param {function(accumulator, element, index): *} fn - Reducer function.
 * @param {*} acc - Initial accumulator value.
 * @param {number} [i=0] - Current index (internal).
 * @returns {*} Final accumulated value.
 */
export function rReduce(arr, fn, acc, i = 0) {
  if (i >= arr.length) return acc;
  return rReduce(arr, fn, fn(acc, arr[i], i), i + 1);
}

//////////////////////////////////////// R FOR EACH ////////////////////////////////////////
/**
 * Recursive forEach: executes fn for each element (side-effects only).
 * @param {Array} arr - Source array.
 * @param {function(element, index): void} fn - Side-effect function.
 * @param {number} [i=0] - Current index (internal).
 */
export function rForEach(arr, fn, i = 0) {
  if (i >= arr.length) return;
  fn(arr[i], i);
  rForEach(arr, fn, i + 1);
}

//////////////////////////////////////// R BUILD MAP ////////////////////////////////////////
/**
 * Recursive buildMap: constructs a Map from an array.
 * @param {Array} arr - Source array.
 * @param {function(element, index): string} keyFn - Extracts the map key from each element.
 * @param {function(element, index): *} valFn - Extracts the map value from each element.
 * @param {number} [i=0] - Current index (internal).
 * @param {Map} [map=new Map()] - Accumulator map (internal).
 * @returns {Map} The constructed Map.
 */
export function rBuildMap(arr, keyFn, valFn, i = 0, map = new Map()) {
  if (i >= arr.length) return map;
  map.set(keyFn(arr[i], i), valFn(arr[i], i));
  return rBuildMap(arr, keyFn, valFn, i + 1, map);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// ENUM TEMPLATE ////////////////////////////////////////
/**
 * Enum Template Object :
 * Used by the Create Enum function.
 * Template enum "class"
 */
export const EnumTemplate = {
  types: [], // This gets replaced

  /**
   * Returns an immutable array of all enum type names.
   * @returns {Readonly<string[]>} An immutable array of type names.
   */
  listTypes() {
    return Object.freeze([...this.types]);
  },

  /**
   * Returns the ID (index) of an enum type by its name.
   * @param {string} typeName - The name of the enum type.
   * @returns {number} The ID of the type, or -1 if not found.
   */
  getTypeID(typeName) {
    return this[typeName] !== undefined ? this[typeName] : -1;
  },
};
