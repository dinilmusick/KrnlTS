/**
 * @file CoreEntity.ts
 * @description Foundational root entity for SRKL (Service Hub).
 * Every domain entity, service, account, resource, and action inherits from CoreEntity.
 * Adheres to Srkl-spec.md Section 4 (Inheritance) and Skipo code limits (<200 lines).
 */

export interface CoreEntityData {
  id: string;
  name: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export abstract class CoreEntity {
  public readonly id: string;
  public readonly entityType: string;
  public name: string;
  public readonly createdAt: string;
  public updatedAt: string;
  public metadata: Record<string, unknown>;

  constructor(data: CoreEntityData) {
    this.id = data.id;
    this.name = data.name;
    this.entityType = data.entityType;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.metadata = data.metadata ? { ...data.metadata } : {};
  }

  /**
   * Updates the entity timestamp upon modification.
   */
  public touch(): void {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validates internal invariants of this entity.
   * Override in sub-classes for specialized validation.
   */
  public validate(): boolean {
    return Boolean(this.id && this.name && this.entityType);
  }

  /**
   * Serializes the entity to standard plain JSON representation.
   */
  public toJSON(): CoreEntityData {
    return {
      id: this.id,
      name: this.name,
      entityType: this.entityType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: { ...this.metadata },
    };
  }
}
