//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Entity_Compositional_Hierarchy.js
 * @description Manages the parent-child relationships and component entities of an Krnl entity.
 */

import { rFind } from "../extensions/K_LIB_Krnl_Core_Function_Atoms.js";
import { krnlError, krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL ENTITY COMPOSITIONAL HIERARCHY DATA ////////////////////////////////////////
export class krnlEntityCompositionalHierarchyData {
  ownerEntity = null;
  ownedEntities = []; // array of krnlEntityBase type
}

//////////////////////////////////////// KRNL ENTITY COMPOSITIONAL HIERARCHY MANAGER ////////////////////////////////////////
export class krnlEntityCompositionalHierarchyManager {
  constructor(thisEntity, ownerEntity, EntityClass) {
    this.thisEntity = thisEntity;
    this.EntityClass = EntityClass;

    this.entityCompHierarchyData = new krnlEntityCompositionalHierarchyData();
    this.entityCompHierarchyData.ownerEntity = ownerEntity;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// HIERARCHY MANAGEMENT /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  createComponentEntity(name, componentArgs = []) {
    const newCompEntity = new this.EntityClass(
      name,
      this.thisEntity,
      ...componentArgs
    );
    this.entityCompHierarchyData.ownedEntities.push(newCompEntity);
    return newCompEntity;
  }

  /**
   * Gets a component entity by name.
   * @param {string} compEntityName - Name of the component entity.
   * @returns {object} The component entity.
   * @throws {krnlError} ENTITY_NOT_FOUND if no entity matches.
   */
  getComponentEntity(compEntityName) {
    const entity = rFind(
      this.entityCompHierarchyData.ownedEntities,
      (e) => e.entityName === compEntityName
    );
    if (entity === null) {
      throw new krnlError(krnlErrorCodes.ENTITY_NOT_FOUND);
    }
    return entity;
  }

  getAllOwnedComponentEntities() {
    return this.entityCompHierarchyData.ownedEntities;
  }

  getOwnerEntity() {
    return this.entityCompHierarchyData.ownerEntity;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// DISPOSAL /////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Recursively disposes all owned component entities.
   */
  dispose() {
    for (let i = 0; i < this.entityCompHierarchyData.ownedEntities.length; i++) {
      const entity = this.entityCompHierarchyData.ownedEntities[i];
      if (entity && typeof entity.dispose === "function") {
        entity.dispose();
      }
    }
    this.entityCompHierarchyData.ownedEntities = [];
    this.entityCompHierarchyData.ownerEntity = null;
  }
}