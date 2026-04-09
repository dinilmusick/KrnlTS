//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Error_Concepts.js
 * @description Defines the system-wide error codes, messages, and typed error class for the Krnl ecosystem.
 * This file does not have dependencies.
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// ERROR CODES ////////////////////////////////////////
/**
 * Krnl System Error Codes.
 * Integer-based for cross-platform portability (Go, C++, Rust).
 */
export const krnlErrorCodes = Object.freeze({
  // Enum errors (0-99)
  ENUM_ID_NOT_FOUND: -1,

  // State errors (100-199)
  STATE_NOT_FOUND: 100,
  STATE_DUPLICATE_NAME: 101,
  STATE_INDEX_OUT_OF_RANGE: 102,

  // Functionality errors (200-299)
  FUNCTIONALITY_NOT_DEFINED: 200,
  FUNCTIONALITY_ALREADY_DEFINED: 201,
  FUNCTIONALITY_INSTANCE_NOT_FOUND: 202,

  // Interface errors (300-399)
  EMITTER_NOT_FOUND: 300,
  COLLECTOR_NOT_FOUND: 301,
  COLLECTOR_NOT_SUBSCRIBED: 302,

  // Hierarchy errors (400-499)
  ENTITY_NOT_FOUND: 400,
});

//////////////////////////////////////// ERROR MESSAGES ////////////////////////////////////////
/**
 * Map of Error Codes to human-readable messages.
 */
export const krnlErrorMessages = Object.freeze({
  // Enum
  [krnlErrorCodes.ENUM_ID_NOT_FOUND]:
    "Enum: ID not found. The requested enum type is not defined.",

  // State
  [krnlErrorCodes.STATE_NOT_FOUND]:
    "State: No state found with the given name.",
  [krnlErrorCodes.STATE_DUPLICATE_NAME]:
    "State: A state with this name already exists.",
  [krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE]:
    "State: Index is out of range of the states array.",

  // Functionality
  [krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED]:
    "Functionality: The requested functionality is not defined.",
  [krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED]:
    "Functionality: A functionality with this name is already defined.",
  [krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND]:
    "Functionality: The requested functionality instance was not found.",

  // Interface
  [krnlErrorCodes.EMITTER_NOT_FOUND]:
    "Interface: No emitter found with the given name.",
  [krnlErrorCodes.COLLECTOR_NOT_FOUND]:
    "Interface: No collector found with the given name.",
  [krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED]:
    "Interface: Collector is not subscribed to any emitter.",

  // Hierarchy
  [krnlErrorCodes.ENTITY_NOT_FOUND]:
    "Hierarchy: No entity found with the given name.",
});

//////////////////////////////////////// KRNL ERROR ////////////////////////////////////////
/**
 * Typed error class for the Krnl system.
 * Always carries an integer error code for programmatic handling.
 */
export class krnlError extends Error {
  constructor(code) {
    super(krnlErrorMessages[code] ?? `Unknown error (code: ${code})`);
    this.code = code;
    this.errorMessage = this.message;
  }
}