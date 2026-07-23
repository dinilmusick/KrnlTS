/**
 * @file K_LIB_Krnl_Functionality_Types.ts
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
 */
import { krnlEmitter } from "./K_LIB_Krnl_Messaging_Concepts.js";
import type { KrnlEndpointAccessPolicy } from "./types.js";
import type { KrnlIntentionFunctionality } from "./K_LIB_Krnl_Intention_Types.js";
import type { KrnlIntelligenceSpec } from "./K_LIB_Krnl_Ai_Concepts.js";
/**
 * TRANSPORT ADAPTER INTERFACE
 */
export declare abstract class krnlTransportAdapter {
    abstract call(targetFunction: string, input: any, opts: any): Promise<any>;
}
/**
 * MEMORY TRANSPORT ADAPTER
 * Default adapter for in-memory entity communication.
 */
export declare class MemoryTransportAdapter extends krnlTransportAdapter {
    targetEntity: any;
    constructor(targetEntity: any);
    call(targetFunction: string, input: any, opts: any): Promise<any>;
}
/**
 * KRNL LOCAL FUNCTIONALITY
 * The fundamental unit of logic.
 */
export declare class krnlLocalFunctionality {
    id: string;
    visibility: string;
    initialState: any;
    api: Function;
    isLocal: boolean;
    sourcePath: string | null;
    helpers: Map<string, any>;
    emitters: Map<string, krnlEmitter>;
    schema: any;
    description?: string;
    method?: string;
    tests?: any[];
    examples?: any[];
    intelligenceSpec?: KrnlIntelligenceSpec;
    /** Port-based access control policy. Absent = unrestricted. */
    accessPolicy?: KrnlEndpointAccessPolicy;
    /** Shared secret for allow_with_key / ask_key_unlisted gates. */
    accessKey?: string;
    lifecycle: {
        beginning?: Function;
        during?: Function;
        end?: Function;
        failure?: Function;
        teardown?: Function;
    };
    state: any;
    hostEntity: any;
    intention?: KrnlIntentionFunctionality;
    ai?: any;
    constructor(config?: any);
    _createObservedState(initialState: any): any;
    _notifyStateChanged(prop: string, value: any): void;
    /**
     * Updates the visibility and handles interface registration/deregistration.
     * This is the mechanism used to STOP bubbling at a certain level.
     */
    setVisibility(v: string): void;
    _unregisterFromInterface(): void;
    _registerInInterface(): void;
    /**
     * checkAccess — port-based access gate.
     *
     * f(p, k) ∈ { PASS, REJECT }
     *   FORBID  if p ∈ P_forbid
     *   PASS    if p ∈ P_allow
     *   KEY(k)  if p ∈ P_allow_with_key
     *   default_connection_behaviour(p, k)   otherwise (unlisted)
     */
    checkAccess(callerPort: number, key?: string): {
        allowed: boolean;
        reason?: string;
    };
    bindToEntity(entity: any): this;
    teardown(): void;
    execute(input: any, opts?: any): Promise<any>;
}
/**
 * KRNL REMOTE FUNCTIONALITY
 * Proxy for recursive bubbling.
 */
export declare class krnlRemoteFunctionality {
    id: string;
    targetFunction: string;
    targetEntity: any;
    visibility: string;
    isLocal: boolean;
    transport: krnlTransportAdapter;
    hostEntity: any;
    constructor(config?: any);
    setVisibility(v: string): void;
    _unregisterFromInterface(): void;
    _registerInInterface(): void;
    bindToEntity(entity: any): void;
    execute(input: any, opts?: any): Promise<any>;
}
//# sourceMappingURL=K_LIB_Krnl_Functionality_Types.d.ts.map