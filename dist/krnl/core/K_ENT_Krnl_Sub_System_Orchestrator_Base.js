//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Sub_System_Orchestrator_Base.ts
 * @description Defines the base class for all sub-system orchestrator entities in the Krnl ecosystem.
 */
import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
//////////////////////////////////////// KRNL SUB SYSTEM ORCHESTRATOR BASE ////////////////////////////////////////
export class krnlSubSystemOrchestratorBase extends krnlEntityBase {
    constructor(name, owner) {
        if (!owner) {
            throw new Error("A sub-system orchestrator must be owned by a parent entity.");
        }
        super(name, owner);
        this.systemType = 'SubSystemOrchestrator';
    }
}
//# sourceMappingURL=K_ENT_Krnl_Sub_System_Orchestrator_Base.js.map