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
   * Multi-instantiation is removed; if name exists, it returns existing or throws.
   * @param {string} name - The name of the component.
   */
  createComponentEntity(name) {
    // 1. Enforce unique instantiation.
    if (this.ownedComponents.has(name)) {
      console.warn(`[Hierarchy] Component '${name}' already exists. Returning existing.`);
      return this.ownedComponents.get(name);
    }

    // 2. Create the new entity instance.
    // Note: We pass 'this.self' as the owner to the new entity's constructor.
    const newEntity = new this.EntityClass(name, this.self);

    // 3. Register the component locally.
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
