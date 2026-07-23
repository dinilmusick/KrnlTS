import { KrnlEndpointDefinition } from "./K_LIB_Krnl_Ai_Concepts.js";
export declare class KrnlWatchVariablesTracker {
    private registeredFunctionalities;
    private endpointConfigs;
    register(functionalityId: string, config: KrnlEndpointDefinition, functionality: any): void;
    readLiveVars(endpointId: string): Record<string, any>;
    sharedDynamicVars(endpointA: string, endpointB: string): string[];
    endpointsForVar(varKey: string): string[];
}
//# sourceMappingURL=K_LIB_Krnl_Watch_Variables_Tracker.d.ts.map