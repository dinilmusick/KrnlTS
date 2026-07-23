//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Entity_Compositional_Hierarchy.ts
 * @description Manages parent-child relationships and component unique instantiation.
 */
/**
 * KRNL ENTITY COMPOSITIONAL HIERARCHY MANAGER
 * Responsible for the "skeleton" of the system.
 */
export class krnlEntityCompositionalHierarchyManager {
    self;
    owner;
    EntityClass;
    ownedComponents;
    componentBaseNames;
    componentInstanceCounters;
    /**
     * @param self - The entity this manager belongs to.
     * @param owner - The parent entity (if any).
     * @param EntityClass - Reference to the Entity base class for instantiation.
     */
    constructor(self, owner, EntityClass) {
        this.self = self;
        this.owner = owner;
        this.EntityClass = EntityClass;
        this.ownedComponents = new Map();
        this.componentBaseNames = new Map();
        this.componentInstanceCounters = new Map();
    }
    /**
     * Spawns a unique component entity within this host.
     */
    createComponentEntity(name, CustomClass = null, options = {}) {
        const ClassToUse = CustomClass || this.EntityClass;
        const shouldBeSingleton = options.Singleton ?? ClassToUse.Singleton ?? true;
        if (shouldBeSingleton && this.ownedComponents.has(name)) {
            return this.ownedComponents.get(name);
        }
        const currentCount = this.componentInstanceCounters.get(name) || 0;
        const nextCount = currentCount + 1;
        this.componentInstanceCounters.set(name, nextCount);
        const resolvedName = shouldBeSingleton ? name : `${name}#${nextCount}`;
        const newEntity = new ClassToUse(resolvedName, this.self, {
            Singleton: shouldBeSingleton,
            baseName: name,
            instanceNumber: nextCount,
        });
        this.ownedComponents.set(resolvedName, newEntity);
        const group = this.componentBaseNames.get(name) || [];
        group.push(newEntity);
        this.componentBaseNames.set(name, group);
        if (this.self._onComponentAdded) {
            this.self._onComponentAdded(newEntity);
        }
        return newEntity;
    }
    /**
     * Registers a pre-existing entity instance as a component of this host.
     */
    addComponentEntityInstance(instance) {
        this.ownedComponents.set(instance.id, instance);
        instance.hierarchyManager.owner = this.self;
        const base = instance.baseName || instance.id;
        const group = this.componentBaseNames.get(base) || [];
        group.push(instance);
        this.componentBaseNames.set(base, group);
        if (instance._promoteAllExistingFunctionalities) {
            instance._promoteAllExistingFunctionalities();
        }
    }
    /**
     * Returns a list of all component entities owned by this host.
     */
    getAllOwnedComponentEntities() {
        return Array.from(this.ownedComponents.values());
    }
    /**
     * Returns all component entity instances created from the same base component name.
     */
    getOwnedComponentEntitiesByName(name) {
        return [...(this.componentBaseNames.get(name) || [])];
    }
    /**
     * Returns the parent entity.
     */
    getOwnerEntity() {
        return this.owner;
    }
    /**
     * Recursively disposes of all owned components.
     */
    dispose() {
        this.ownedComponents.forEach((entity) => {
            if (entity.dispose)
                entity.dispose();
        });
        this.ownedComponents.clear();
        this.componentBaseNames.clear();
        this.componentInstanceCounters.clear();
    }
    /**
     * Disposes a specific component instance by ID/name.
     */
    disposeComponentEntity(entityId) {
        const entity = this.ownedComponents.get(entityId);
        if (!entity)
            return false;
        if (entity.dispose)
            entity.dispose();
        this.ownedComponents.delete(entityId);
        const base = entity.baseName || entity.entityName;
        const group = this.componentBaseNames.get(base) || [];
        this.componentBaseNames.set(base, group.filter((e) => e !== entity));
        return true;
    }
}
//# sourceMappingURL=K_LIB_Krnl_Entity_Compositional_Hierarchy.js.map