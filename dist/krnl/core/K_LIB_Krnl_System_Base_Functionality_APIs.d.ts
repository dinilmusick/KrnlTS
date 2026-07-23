import { KrnlEndpointDefinition } from './K_LIB_Krnl_Ai_Concepts.js';
export declare function heartbeatApi(entity: any): () => {
    name: any;
    type: any;
    timestamp: string;
};
export declare function telemetryApi(entity: any): () => {
    entityName: any;
    systemType: any;
    flags: any;
    owner: any;
    ownedEntities: any;
    activeRoutes: any;
    uptime: number | null;
    performance: any;
    callLogs: any;
    libraryUsage: any;
    dataUsage: any;
};
export declare function adminCommandApi(entity: any): ({ command, args }: {
    command: string;
    args: any;
}) => Promise<{
    status: string;
    command: string;
    flags: any;
    message?: undefined;
} | {
    status: string;
    command: string;
    message: string;
    flags?: undefined;
}>;
export declare function discoverPeersApi(entity: any): ({ includeBusy }?: {
    includeBusy?: boolean | undefined;
}) => any;
export declare function getManifestApi(entity: any): () => any;
export declare function getLastActionDocsApi(entity: any): () => {
    preemptiveDocumentation: any;
    errorDocumentation: any;
};
export declare function getFullDocumentationApi(entity: any): () => any;
export declare function systemCommandsCollectorHandler(entity: any): (msg: any) => void;
/**
 * getUsedPortsApi
 *
 * Returns every port registered on this system entity.
 * P_local ⊆ ℕ  is the image of the portRegistry map.
 *
 * Response: { entity, ports: number[], registry: Record<string, number> }
 */
export declare function getUsedPortsApi(entity: any): () => {
    entity: any;
    ports: number[];
    registry: Record<string, number>;
};
/**
 * findFreePortsApi
 *
 * Queries every known peer for its port set, unions them with the local set,
 * then returns the k smallest ports in [rangeStart, rangeEnd] not in the union.
 *
 *   U      = ⋃_{i=0}^{N} P_i        (union across N peers + self)
 *   F      = { p ∈ [rangeStart, rangeEnd] | p ∉ U }
 *   result = min_k(F)                (k smallest free ports)
 *
 * Input:  { count, rangeStart?, rangeEnd? }
 * Output: { freePorts, queriedPeers, totalUsedCount, usedByPeer }
 */
export declare function findFreePortsApi(entity: any): ({ count, rangeStart, rangeEnd, }: {
    count?: number;
    rangeStart?: number;
    rangeEnd?: number;
}) => Promise<{
    freePorts: number[];
    queriedPeers: number;
    totalUsedCount: number;
    usedByPeer: Record<string, number[]>;
}>;
/**
 * shutdownApi
 *
 * Default `shutdown` endpoint registered on every krnlSystemEntityBase.
 *
 * Responds immediately with an acknowledgement, then fires
 * entity.gracefulShutdown() asynchronously:
 *
 *   shutdown sequence:
 *     forEach owned ∈ hierarchy  →  gracefulShutdown() | dispose()   (parallel, timeoutMs)
 *     → _deletePortsFile()
 *     → dispose()
 *     → process.exit(0)
 *
 * Input:  { timeoutMs? }   (ms to wait for each microservice; default 10 000)
 * Output: { status, message, entity, timeoutMs }
 */
export declare function shutdownApi(entity: any): ({ timeoutMs }?: {
    timeoutMs?: number;
}) => {
    status: string;
    message: string;
    entity: any;
    timeoutMs: number;
};
export declare function getIngressNetworkTopologyApi(entity: any): () => any;
export declare function registerAppApi(entity: any): ({ name, port, pid }: {
    name: string;
    port: number;
    pid: number;
}) => {
    success: boolean;
};
export declare function deregisterAppApi(entity: any): ({ name }: {
    name: string;
}) => {
    success: boolean;
};
export declare function heartbeatAppApi(entity: any): ({ name }: {
    name: string;
}) => {
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: string;
};
export declare function lookupAppApi(entity: any): ({ name }: {
    name: string;
}) => {
    name: any;
    port: any;
    pid: any;
    registeredAt: any;
    error?: undefined;
} | {
    error: string;
    name?: undefined;
    port?: undefined;
    pid?: undefined;
    registeredAt?: undefined;
};
export declare function listAppsApi(entity: any): () => {
    name: any;
    port: any;
    pid: any;
    registeredAt: any;
}[];
export declare function buildEndpointDefinition(fn: any, entity: any, runtimeOverride?: any, memory?: string): KrnlEndpointDefinition;
export declare function getEndpointDefinitionsApi(entity: any): () => Promise<KrnlEndpointDefinition[]>;
export declare function setEndpointDefinitionApi(entity: any): ({ id, override }: {
    id: string;
    override: any;
}) => Promise<KrnlEndpointDefinition>;
export declare function getTelemetryLogApi(entity: any): ({ limit }?: {
    limit?: number;
}) => Promise<any>;
export declare function getAikoCatalogApi(entity: any): () => Promise<{
    status: string;
    catalog: any;
    message?: undefined;
} | {
    status: string;
    message: string;
    catalog: any;
}>;
export declare function aiOrchestrationApi(entity: any): ({ message }: {
    message: string;
}) => Promise<{
    status: string;
    info: any;
    message?: undefined;
} | {
    status: string;
    message: any;
    info?: undefined;
}>;
export declare function getTaskListApi(entity: any): () => any;
//# sourceMappingURL=K_LIB_Krnl_System_Base_Functionality_APIs.d.ts.map