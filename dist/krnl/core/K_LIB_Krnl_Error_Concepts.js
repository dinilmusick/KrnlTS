//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Error_Concepts.ts
 * @description Defines the system-wide error codes, messages, and typed error class for the Krnl ecosystem.
 */
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
    REMOTE_EXECUTION_FAILED: 203,
    // Interface errors (300-399)
    EMITTER_NOT_FOUND: 300,
    COLLECTOR_NOT_FOUND: 301,
    COLLECTOR_NOT_SUBSCRIBED: 302,
    // Hierarchy errors (400-499)
    ENTITY_NOT_FOUND: 400,
    // Networking/RPC errors (500-599)
    ERR_NET_RPC_TIMEOUT_EXCEEDED: 500,
    ERR_NET_RPC_NETWORK_ERROR: 501,
    ERR_NET_RPC_INTERNAL_SERVER_ERROR: 502,
    ERR_SYS_ENTITY_BUSY_RESERVED: 503,
    ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504,
    ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505,
});
//////////////////////////////////////// ERROR MESSAGES ////////////////////////////////////////
/**
 * Map of Error Codes to human-readable messages.
 */
export const krnlErrorMessages = Object.freeze({
    // Enum
    [krnlErrorCodes.ENUM_ID_NOT_FOUND]: "ERR_LIB_ENUM_ID_NOT_FOUND",
    // State
    [krnlErrorCodes.STATE_NOT_FOUND]: "ERR_LIB_STATE_NOT_FOUND",
    [krnlErrorCodes.STATE_DUPLICATE_NAME]: "ERR_LIB_STATE_DUPLICATE_NAME",
    [krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE]: "ERR_LIB_STATE_INDEX_OUT_OF_RANGE",
    // Functionality
    [krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED]: "ERR_LIB_FUNCTIONALITY_NOT_DEFINED",
    [krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED]: "ERR_LIB_FUNCTIONALITY_ALREADY_DEFINED",
    [krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND]: "ERR_LIB_FUNCTIONALITY_INSTANCE_NOT_FOUND",
    [krnlErrorCodes.REMOTE_EXECUTION_FAILED]: "ERR_LIB_REMOTE_EXECUTION_FAILED",
    // Interface
    [krnlErrorCodes.EMITTER_NOT_FOUND]: "ERR_INT_EMITTER_NOT_FOUND",
    [krnlErrorCodes.COLLECTOR_NOT_FOUND]: "ERR_INT_COLLECTOR_NOT_FOUND",
    [krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED]: "ERR_INT_COLLECTOR_NOT_SUBSCRIBED",
    // Hierarchy
    [krnlErrorCodes.ENTITY_NOT_FOUND]: "ERR_SYS_ENTITY_NOT_FOUND",
    // Networking/RPC
    [krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED]: "ERR_NET_RPC_TIMEOUT_EXCEEDED",
    [krnlErrorCodes.ERR_NET_RPC_NETWORK_ERROR]: "ERR_NET_RPC_NETWORK_ERROR",
    [krnlErrorCodes.ERR_NET_RPC_INTERNAL_SERVER_ERROR]: "ERR_NET_RPC_INTERNAL_SERVER_ERROR",
    [krnlErrorCodes.ERR_SYS_ENTITY_BUSY_RESERVED]: "ERR_SYS_ENTITY_BUSY_RESERVED",
    [krnlErrorCodes.ERR_COM_INGRESS_ROUTE_NOT_FOUND]: "ERR_COM_INGRESS_ROUTE_NOT_FOUND",
    [krnlErrorCodes.ERR_KRNL_UNRESOLVED_REMOTE_TARGET]: "ERR_KRNL_UNRESOLVED_REMOTE_TARGET",
});
export const CUSTOM_ERROR_CODE = -999;
//////////////////////////////////////// KRNL ERROR ////////////////////////////////////////
/**
 * Typed error class for the Krnl system.
 */
export class krnlError extends Error {
    code;
    errorMessage;
    constructor(code) {
        const isNumeric = typeof code === 'number';
        const numericCode = isNumeric ? code : CUSTOM_ERROR_CODE;
        const message = isNumeric ? (krnlErrorMessages[numericCode] ?? `Error: ${code}`) : code;
        super(message);
        this.code = numericCode;
        this.errorMessage = this.message;
    }
}
//# sourceMappingURL=K_LIB_Krnl_Error_Concepts.js.map