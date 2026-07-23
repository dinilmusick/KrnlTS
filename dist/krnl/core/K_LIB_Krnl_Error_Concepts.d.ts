/**
 * @file K_LIB_Krnl_Error_Concepts.ts
 * @description Defines the system-wide error codes, messages, and typed error class for the Krnl ecosystem.
 */
/**
 * Krnl System Error Codes.
 * Integer-based for cross-platform portability (Go, C++, Rust).
 */
export declare const krnlErrorCodes: Readonly<{
    readonly ENUM_ID_NOT_FOUND: -1;
    readonly STATE_NOT_FOUND: 100;
    readonly STATE_DUPLICATE_NAME: 101;
    readonly STATE_INDEX_OUT_OF_RANGE: 102;
    readonly FUNCTIONALITY_NOT_DEFINED: 200;
    readonly FUNCTIONALITY_ALREADY_DEFINED: 201;
    readonly FUNCTIONALITY_INSTANCE_NOT_FOUND: 202;
    readonly REMOTE_EXECUTION_FAILED: 203;
    readonly EMITTER_NOT_FOUND: 300;
    readonly COLLECTOR_NOT_FOUND: 301;
    readonly COLLECTOR_NOT_SUBSCRIBED: 302;
    readonly ENTITY_NOT_FOUND: 400;
    readonly ERR_NET_RPC_TIMEOUT_EXCEEDED: 500;
    readonly ERR_NET_RPC_NETWORK_ERROR: 501;
    readonly ERR_NET_RPC_INTERNAL_SERVER_ERROR: 502;
    readonly ERR_SYS_ENTITY_BUSY_RESERVED: 503;
    readonly ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504;
    readonly ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505;
}>;
/**
 * Map of Error Codes to human-readable messages.
 */
export declare const krnlErrorMessages: Record<number, string>;
export declare const CUSTOM_ERROR_CODE = -999;
/**
 * Typed error class for the Krnl system.
 */
export declare class krnlError extends Error {
    code: number;
    errorMessage: string;
    constructor(code: number | string);
}
//# sourceMappingURL=K_LIB_Krnl_Error_Concepts.d.ts.map