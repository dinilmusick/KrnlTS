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
  }

  /**
   * Spawns a unique component entity within this host.
   * @param {string} name - The name of the component.
   * @param {function} [CustomClass=null] - Optional specific class to instantiate.
   */
  createComponentEntity(name, CustomClass = null) {
    // 1. Enforce unique instantiation.
    if (this.ownedComponents.has(name)) {
      return this.ownedComponents.get(name);
    }

    // 2. Determine which class to use (Default or Custom).
    const ClassToUse = CustomClass || this.EntityClass;

    // 3. Create the new entity instance.
    const newEntity = new ClassToUse(name, this.self);

    // 4. Register the component locally.
    this.ownedComponents.set(name, newEntity);

    // 4. Notify the host entity that a new component has arrived.
    // This is crucial for the automatic interface promotion logic.
    if (this.self._onComponentAdded) {
      this.self._onComponentAdded(newEntity);
    }

    return newEntity;
  }

  /**
   * Returns a list of all component entities owned by this host.
   */
  getAllOwnedComponentEntities() {
    return Array.from(this.ownedComponents.values());
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
  }
}
