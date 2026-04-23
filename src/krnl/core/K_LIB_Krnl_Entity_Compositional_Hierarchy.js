//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Entity_Compositional_Hierarchy.js
 * @description Manages parent-child relationships and component unique instantiation.
 */

/**
 * KRNL ENTITY COMPOSITIONAL HIERARCHY MANAGER
 * Responsible for the "skeleton" of the system.
 */
export class krnlEntityCompositionalHierarchyManager {
  /**
   * @param {object} self - The entity this manager belongs to.
   * @param {object|null} owner - The parent entity (if any).
   * @param {function} EntityClass - Reference to the Entity base class for instantiation.
   */
  constructor(self, owner, EntityClass) {
    this.self = self;                  // The entity instance we are managing.
    this.owner = owner;                // The parent entity.
    this.EntityClass = EntityClass;    // Class used to spawn sub-entities.
    this.ownedComponents = new Map();  // Map of Name -> EntityInstance.
    this.componentBaseNames = new Map(); // Map of BaseName -> [EntityInstance]
    this.componentInstanceCounters = new Map(); // BaseName -> number of created instances
  }

  /**
   * Spawns a unique component entity within this host.
   * @param {string} name - The name of the component.
   * @param {function} [CustomClass=null] - Optional specific class to instantiate.
   */
  createComponentEntity(name, CustomClass = null, options = {}) {
    // 1. Determine which class to use (Default or Custom).
    const ClassToUse = CustomClass || this.EntityClass;
    const shouldBeSingleton = options.Singleton ?? ClassToUse.Singleton ?? true;

    // 2. Enforce unique instantiation for singleton components.
    if (shouldBeSingleton && this.ownedComponents.has(name)) {
      return this.ownedComponents.get(name);
    }

    // 3. Resolve instance identity.
    const currentCount = this.componentInstanceCounters.get(name) || 0;
    const nextCount = currentCount + 1;
    this.componentInstanceCounters.set(name, nextCount);
    const resolvedName = shouldBeSingleton ? name : `${name}#${nextCount}`;

    // 4. Create the new entity instance.
    const newEntity = new ClassToUse(resolvedName, this.self, {
      Singleton: shouldBeSingleton,
      baseName: name,
      instanceNumber: nextCount,
    });

    // 5. Register the component locally.
    this.ownedComponents.set(resolvedName, newEntity);
    const group = this.componentBaseNames.get(name) || [];
    group.push(newEntity);
    this.componentBaseNames.set(name, group);

    // 6. Notify the host entity that a new component has arrived.
    // This is crucial for the automatic interface promotion logic.
    if (this.self._onComponentAdded) {
      this.self._onComponentAdded(newEntity);
    }

    return newEntity;
  }

  /**
   * Registers a pre-existing entity instance as a component of this host.
   * Automatically triggers interface promotion for all its public functionalities.
   * @param {object} instance - The entity instance to register.
   */
  addComponentEntityInstance(instance) {
    this.ownedComponents.set(instance.id, instance);
    instance.hierarchyManager.owner = this.self;
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
      if (entity.dispose) entity.dispose(); // Kill children first.
    });
    this.ownedComponents.clear(); // Clear the registry.
    this.componentBaseNames.clear();
    this.componentInstanceCounters.clear();
  }

  /**
   * Disposes a specific component instance by ID/name.
   * @param {string} entityId
   * @returns {boolean}
   */
  disposeComponentEntity(entityId) {
    const entity = this.ownedComponents.get(entityId);
    if (!entity) return false;

    if (entity.dispose) entity.dispose();
    this.ownedComponents.delete(entityId);

    const base = entity.baseName || entity.entityName;
    const group = this.componentBaseNames.get(base) || [];
    this.componentBaseNames.set(base, group.filter((e) => e !== entity));
    return true;
  }
}
