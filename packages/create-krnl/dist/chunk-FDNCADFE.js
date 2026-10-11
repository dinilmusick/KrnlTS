// ../core/dist/chunk-HIMEZUU2.js
var KrnlEntityRegistry = class _KrnlEntityRegistry {
  static instance = null;
  entities = /* @__PURE__ */ new Map();
  constructor() {
  }
  /**
   * Get the singleton instance of the entity registry.
   */
  static getInstance() {
    if (!_KrnlEntityRegistry.instance) {
      _KrnlEntityRegistry.instance = new _KrnlEntityRegistry();
    }
    return _KrnlEntityRegistry.instance;
  }
  /**
   * Registers an entity instance into the global registry.
   */
  static register(entity) {
    const reg = _KrnlEntityRegistry.getInstance();
    const id = entity.id || entity.entityName;
    if (id) {
      reg.entities.set(id, entity);
    }
    if (entity.entityName && entity.entityName !== id) {
      reg.entities.set(entity.entityName, entity);
    }
  }
  /**
   * Unregisters an entity instance or ID from the registry.
   */
  static unregister(entityOrId) {
    const reg = _KrnlEntityRegistry.getInstance();
    if (typeof entityOrId === "string") {
      reg.entities.delete(entityOrId);
    } else {
      const id = entityOrId.id || entityOrId.entityName;
      if (id) reg.entities.delete(id);
      if (entityOrId.entityName) reg.entities.delete(entityOrId.entityName);
    }
  }
  /**
   * Retrieves an entity by its ID or name.
   */
  static get(idOrName) {
    return _KrnlEntityRegistry.getInstance().entities.get(idOrName);
  }
  /**
   * Checks if an entity with the given ID or name is registered.
   */
  static has(idOrName) {
    return _KrnlEntityRegistry.getInstance().entities.has(idOrName);
  }
  /**
   * Returns a list of all currently registered unique entities.
   */
  static getAll() {
    const set = new Set(_KrnlEntityRegistry.getInstance().entities.values());
    return Array.from(set);
  }
  /**
   * Clears all registered entities.
   */
  static clear() {
    _KrnlEntityRegistry.getInstance().entities.clear();
  }
};

export {
  KrnlEntityRegistry
};
