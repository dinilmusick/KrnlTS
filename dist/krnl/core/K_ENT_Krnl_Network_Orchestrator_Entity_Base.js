//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Network_Orchestrator_Entity_Base.ts
 * @description Network-level orchestrator for discovering systems and managing inter-system routes.
 */
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
export class krnlNetworkOrchestratorEntityBase extends krnlSystemEntityBase {
    constructor(name = "KrnlNetworkOrchestrator", owner = null, commPort = 10110, host = "0.0.0.0") {
        super(name, owner, commPort, host);
        this.systemType = "NetworkOrchestrator";
    }
    async getPeerManifest(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer)
            throw new Error(`Peer ${peerId} not discovered.`);
        return await this.commComponent.callWsRpc(peer.address, "get-manifest", {});
    }
    async listPeerRoutes(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer)
            throw new Error(`Peer ${peerId} not discovered.`);
        return await this.commComponent.callWsRpc(peer.address, "list-routes", {});
    }
    /**
     * Connects source system emitter -> target system collector.
     */
    async connectSystems(sourcePeerId, targetPeerId, options) {
        const source = this.peers.get(sourcePeerId);
        const target = this.peers.get(targetPeerId);
        if (!source)
            throw new Error(`Source peer ${sourcePeerId} not discovered.`);
        if (!target)
            throw new Error(`Target peer ${targetPeerId} not discovered.`);
        if (source.busy && source.reservedBy !== this.entityName) {
            throw new Error(`Source peer ${sourcePeerId} is reserved by ${source.reservedBy || "another service"}.`);
        }
        if (target.busy && target.reservedBy !== this.entityName) {
            throw new Error(`Target peer ${targetPeerId} is reserved by ${target.reservedBy || "another service"}.`);
        }
        const { sourceEmitter, targetCollector, externallyMutable = true, metadata = {}, } = options;
        return await this.commComponent.callWsRpc(source.address, "connect-to-target", {
            sourceEmitter,
            targetAddress: target.address,
            targetCollector,
            targetName: target.name,
            requester: this.entityName,
            connectionPolicy: {
                managedBy: this.entityName,
                externallyMutable,
                metadata,
            },
        });
    }
    async disconnectPeerRoute(peerId, routeId, options = {}) {
        const peer = this.peers.get(peerId);
        if (!peer)
            throw new Error(`Peer ${peerId} not discovered.`);
        const { force = false } = options;
        return await this.commComponent.callWsRpc(peer.address, "disconnect-route", {
            routeId,
            force,
            requester: this.entityName,
        });
    }
}
//# sourceMappingURL=K_ENT_Krnl_Network_Orchestrator_Entity_Base.js.map