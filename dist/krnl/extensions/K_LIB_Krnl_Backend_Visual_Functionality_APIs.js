//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Backend_Visual_Functionality_APIs.js
 * @description Reusable API atoms for krnlBackendVisualEntityBase.
 */
export function setBrndaComponentApi(entity) {
    return (config = {}) => {
        entity.brndaConfig = { ...entity.brndaConfig, ...config };
        console.log(`[${entity.entityName}] Brnda config updated:`, entity.brndaConfig);
        return entity.brndaConfig;
    };
}
export function setWeprComponentApi(entity) {
    return (config = {}) => {
        entity.weprConfig = { ...entity.weprConfig, ...config };
        console.log(`[${entity.entityName}] Wepr config updated:`, entity.weprConfig);
        return entity.weprConfig;
    };
}
export function setVisualCoreApi(entity) {
    return (patch = {}) => {
        entity.visualCore = {
            ...entity.visualCore,
            ...patch,
            position: { ...entity.visualCore.position, ...patch.position },
            rotation: { ...entity.visualCore.rotation, ...patch.rotation },
            scale: { ...entity.visualCore.scale, ...patch.scale },
        };
        return entity.visualCore;
    };
}
export function getVisualSnapshotApi(entity) {
    return () => entity.visualCore;
}
export function syncAllFrontendsApi(entity) {
    return async () => {
        console.log(`[${entity.entityName}] Syncing all frontends...`);
        return { status: 'synced', timestamp: Date.now() };
    };
}
//# sourceMappingURL=K_LIB_Krnl_Backend_Visual_Functionality_APIs.js.map