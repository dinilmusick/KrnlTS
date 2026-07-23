/**
 * @file K_ENT_Krnl_Network_Orchestrator_Entity_Base.ts
 * @description Network-level orchestrator for discovering systems and managing inter-system routes.
 */
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
export declare class krnlNetworkOrchestratorEntityBase extends krnlSystemEntityBase {
    constructor(name?: string, owner?: any, commPort?: number, host?: string);
    getPeerManifest(peerId: string): Promise<any>;
    listPeerRoutes(peerId: string): Promise<any>;
    /**
     * Connects source system emitter -> target system collector.
     */
    connectSystems(sourcePeerId: string, targetPeerId: string, options: any): Promise<any>;
    disconnectPeerRoute(peerId: string, routeId: string, options?: any): Promise<any>;
}
//# sourceMappingURL=K_ENT_Krnl_Network_Orchestrator_Entity_Base.d.ts.map