/**
 * @file K_LIB_Krnl_Entity_Registry.ts
 * @description Centralized in-memory registry for all active Entities in a KrnlTS runtime.
 *
 * Governing Principles:
 * 1. Flat Multi-Entity Discovery: Entities are registered upon instantiation or boot.
 * 2. Cross-Entity Orchestration: Orchestration chains resolve peer entities by ID or name
 *    via this registry.
 * 3. App Variants & Combined Builds: Supports lookup of independent entity app variants
 *    or multiple combined entities operating in the same process.
 */

import type { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";

export class KrnlEntityRegistry {
  private static instance: KrnlEntityRegistry | null = null;
  private entities: Map<string, krnlEntityBase> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the entity registry.
   */
  public static getInstance(): KrnlEntityRegistry {
    if (!KrnlEntityRegistry.instance) {
      KrnlEntityRegistry.instance = new KrnlEntityRegistry();
    }
    return KrnlEntityRegistry.instance;
  }

  /**
   * Registers an entity instance into the global registry.
   */
  public static register(entity: krnlEntityBase): void {
    const reg = KrnlEntityRegistry.getInstance();
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
  public static unregister(entityOrId: krnlEntityBase | string): void {
    const reg = KrnlEntityRegistry.getInstance();
    if (typeof entityOrId === 'string') {
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
  public static get<T extends krnlEntityBase = krnlEntityBase>(idOrName: string): T | undefined {
    return KrnlEntityRegistry.getInstance().entities.get(idOrName) as T | undefined;
  }

  /**
   * Checks if an entity with the given ID or name is registered.
   */
  public static has(idOrName: string): boolean {
    return KrnlEntityRegistry.getInstance().entities.has(idOrName);
  }

  /**
   * Returns a list of all currently registered unique entities.
   */
  public static getAll(): krnlEntityBase[] {
    const set = new Set(KrnlEntityRegistry.getInstance().entities.values());
    return Array.from(set);
  }

  /**
   * Clears all registered entities.
   */
  public static clear(): void {
    KrnlEntityRegistry.getInstance().entities.clear();
  }
}
