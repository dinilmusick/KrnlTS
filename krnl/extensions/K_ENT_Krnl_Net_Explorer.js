//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Net_Explorer.js
 * @description Defines the Krnl Net Explorer entity, used for discovering and managing other Krnl Entities in the constructor net.
 */

import { krnlEntityBase } from "../core/K_ENT_Krnl_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// KRNL NET EXPLORER ENTITY ////////////////////////////////////////
export class krnlNetExplorerEntity extends krnlEntityBase {
  constructor(owner = null) {
    super("NetExplorer", owner);

    this._initNetExplorerReturnedFunctionalities();
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INITIALIZATION AND FUNCTIONALITIES ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _initNetExplorerReturnedFunctionalities() {
    // 1) List names of entities.
    //    getSiblings? true → siblings of input entity
    //    getSiblings? false → owned/nested entities inside this explorer
    this.returnedFunctionalities.define(
      "listEntityNames",
      ({ entityName, getSiblings }) => {
        if (getSiblings) {
          if (!entityName) return [];
          const entity = this._findEntityByNameInOwnerScope(entityName);
          if (!entity) return [];

          const hierarchyData = entity.hierarchyManager.entityCompHierarchyData;
          const ownerEntity = hierarchyData.ownerEntity;
          if (!ownerEntity) return [];

          const ownedByOwner =
            ownerEntity.hierarchyManager.getAllOwnedComponentEntities();

          return ownedByOwner
            .filter((ent) => ent !== entity)
            .map((ent) => ent.entityName);
        } else {
          // Owned / nested entities inside this net explorer
          return this.hierarchyManager
            .getAllOwnedComponentEntities()
            .map((ent) => ent.entityName);
        }
      }
    );

    // 2) Using input name, get reference(s) of sibling/owned entities.
    //    getSiblings? true → siblings with matching name
    //    getSiblings? false → owned entities of this explorer with matching name
    this.returnedFunctionalities.define(
      "getEntitiesByName",
      ({ entityName, searchName, getSiblings }) => {
        const targetName = searchName ?? entityName;
        if (!targetName) return [];

        if (getSiblings) {
          const baseEntity = this._findEntityByNameInOwnerScope(entityName);
          if (!baseEntity) return [];

          const hierarchyData =
            baseEntity.hierarchyManager.entityCompHierarchyData;
          const ownerEntity = hierarchyData.ownerEntity;
          if (!ownerEntity) return [];

          const ownedByOwner =
            ownerEntity.hierarchyManager.getAllOwnedComponentEntities();

          return ownedByOwner.filter(
            (ent) => ent !== baseEntity && ent.entityName === targetName
          );
        } else {
          const owned = this.hierarchyManager.getAllOwnedComponentEntities();
          return owned.filter((ent) => ent.entityName === targetName);
        }
      }
    );

    // 3) Get name of owner entity (of this explorer)
    this.returnedFunctionalities.define("getOwnerName", () => {
      const owner = this.hierarchyManager.getOwnerEntity();
      return owner ? owner.entityName : null;
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INTERNAL HELPERS /////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  _findEntityByNameInOwnerScope(entityName) {
    const owner = this.hierarchyManager.getOwnerEntity();
    if (!owner) return null;

    const owned = owner.hierarchyManager.getAllOwnedComponentEntities();
    return owned.find((ent) => ent.entityName === entityName) || null;
  }
}
