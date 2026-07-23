/**
 * @file K_LIB_Krnl_Entity_Compositional_Hierarchy.ts
 * @description Manages parent-child relationships and component unique instantiation.
 */
/**
 * KRNL ENTITY COMPOSITIONAL HIERARCHY MANAGER
 * Responsible for the "skeleton" of the system.
 */
export declare class krnlEntityCompositionalHierarchyManager {
    self: any;
    owner: any | null;
    EntityClass: any;
    ownedComponents: Map<string, any>;
    componentBaseNames: Map<string, any[]>;
    componentInstanceCounters: Map<string, number>;
    /**
     * @param self - The entity this manager belongs to.
     * @param owner - The parent entity (if any).
     * @param EntityClass - Reference to the Entity base class for instantiation.
     */
    constructor(self: any, owner: any | null, EntityClass: any);
    /**
     * Spawns a unique component entity within this host.
     */
    createComponentEntity(name: string, CustomClass?: any, options?: any): any;
    /**
     * Registers a pre-existing entity instance as a component of this host.
     */
    addComponentEntityInstance(instance: any): void;
    /**
     * Returns a list of all component entities owned by this host.
     */
    getAllOwnedComponentEntities(): any[];
    /**
     * Returns all component entity instances created from the same base component name.
     */
    getOwnedComponentEntitiesByName(name: string): any[];
    /**
     * Returns the parent entity.
     */
    getOwnerEntity(): any | null;
    /**
     * Recursively disposes of all owned components.
     */
    dispose(): void;
    /**
     * Disposes a specific component instance by ID/name.
     */
    disposeComponentEntity(entityId: string): boolean;
}
//# sourceMappingURL=K_LIB_Krnl_Entity_Compositional_Hierarchy.d.ts.map