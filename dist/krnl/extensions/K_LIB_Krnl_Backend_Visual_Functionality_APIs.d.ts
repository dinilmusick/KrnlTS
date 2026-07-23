/**
 * @file K_LIB_Krnl_Backend_Visual_Functionality_APIs.js
 * @description Reusable API atoms for krnlBackendVisualEntityBase.
 */
export function setBrndaComponentApi(entity: any): (config?: {}) => any;
export function setWeprComponentApi(entity: any): (config?: {}) => any;
export function setVisualCoreApi(entity: any): (patch?: {}) => any;
export function getVisualSnapshotApi(entity: any): () => any;
export function syncAllFrontendsApi(entity: any): () => Promise<{
    status: string;
    timestamp: number;
}>;
//# sourceMappingURL=K_LIB_Krnl_Backend_Visual_Functionality_APIs.d.ts.map