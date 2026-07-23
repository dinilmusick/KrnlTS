export function buildEntityIntention(entity) {
    const functionalities = [];
    if (entity.localFunctionalities) {
        for (const func of entity.localFunctionalities.values()) {
            if (func.intention) {
                functionalities.push(func.intention);
            }
        }
    }
    const componentEntities = [];
    if (entity.hierarchyManager && entity.hierarchyManager.ownedComponents) {
        for (const child of entity.hierarchyManager.ownedComponents.values()) {
            componentEntities.push(buildEntityIntention(child));
        }
    }
    return {
        purpose: entity.intention?.purpose || entity.description || "",
        functionalities,
        componentEntities
    };
}
//# sourceMappingURL=K_LIB_Krnl_Intention_Types.js.map