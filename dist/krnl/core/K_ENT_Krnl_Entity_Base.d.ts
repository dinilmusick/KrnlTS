/**
 * @file K_ENT_Krnl_Entity_Base.ts
 * @description The core Entity class, supporting recursive interface promotion and visibility control.
 */
import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";
import { KrnlTelemetry } from "./K_LIB_Krnl_Telemetry.js";
import type { KrnlIntentionEntity } from "./K_LIB_Krnl_Intention_Types.js";
/**
 * KRNL ENTITY BASE
 * The building block of the Krnl ecosystem.
 */
export declare class krnlEntityBase {
    __krnlEntityInstance: boolean;
    id: string;
    entityName: string;
    Singleton: boolean;
    baseName: string;
    instanceNumber: number;
    telemetry: KrnlTelemetry;
    _telemetryEnabled: boolean;
    get telemetryEnabled(): boolean;
    set telemetryEnabled(val: boolean);
    systemType: string;
    interface: krnlInterface;
    localFunctionalities: Map<string, krnlLocalFunctionality>;
    remoteFunctionalities: Map<string, krnlRemoteFunctionality>;
    collectors: Set<any>;
    hierarchyManager: krnlEntityCompositionalHierarchyManager;
    intention?: KrnlIntentionEntity;
    _decorateResult(result: any, fid: string, input: any): Promise<any>;
    _decorateError(error: any, fid: string, input: any): Promise<any>;
    /**
     * @param name - The unique identity of the entity.
     * @param owner - The parent entity (if any).
     */
    constructor(name: string, owner?: krnlEntityBase | null, options?: any);
    /**
     * Registers a local logic block.
     * If the functionality is 'public', it is automatically promoted to the owner.
     */
    addLocal(localFunctionality: any): krnlLocalFunctionality;
    /**
     * Registers a proxy for a functionality on another entity.
     * If the proxy is 'public', it is promoted to the owner (Recursive Bubbling).
     */
    addRemote(remoteFunctionality: any): krnlRemoteFunctionality;
    /**
     * INTERFACE PROMOTION
     * Handles the automatic bubbling of component logic to the owner.
     */
    _onComponentFunctionalityAdded(component: any, functionality: any): void;
    /**
     * Removes a promoted remote functionality and recursively propagates removal upward.
     */
    _onComponentFunctionalityRemoved(component: krnlEntityBase, functionalityId: string): void;
    /**
     * Internal helper to trigger promotion of all existing functionalities.
     */
    _promoteAllExistingFunctionalities(): void;
    /**
     * Executes a functionality by ID.
     */
    call(fid: string, input: any, opts?: any): Promise<any>;
    getLocal(fid: string): krnlLocalFunctionality | undefined;
    getRemote(fid: string): krnlRemoteFunctionality | undefined;
    resolveLocalFunctionality(fid: string): any;
    addChild(instance: krnlEntityBase): void;
    getTelemetry(): {
        entity: string;
        timestamp: number;
        metrics: any;
        callLogs: any;
        libraryUsage: any;
        dataUsage: any;
    };
    disposeOwnedComponent(entityId: string): boolean;
    dispose(): void;
}
//# sourceMappingURL=K_ENT_Krnl_Entity_Base.d.ts.map