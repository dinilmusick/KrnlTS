//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Backend_Visual_Entity_Base.js
 * @description A base class for entities that have a visual backend representation.
 */

import { krnlEntityBase } from "../core/K_ENT_Krnl_Entity_Base.js";

export class krnlBackendVisualEntityBase extends krnlEntityBase {
  constructor(name, owner = null) {
    super(name, owner);
    this.visualCore = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      color: "#ffffff"
    };

    this._setupVisualFunctionalities();
  }

  _setupVisualFunctionalities() {
    this.addLocal({
      id: 'setBrndaComponent',
      api: (config = {}) => {
        this.brndaConfig = { ...this.brndaConfig, ...config };
        console.log(`[${this.entityName}] Brnda config updated:`, this.brndaConfig);
        return this.brndaConfig;
      }
    });

    this.addLocal({
      id: 'setWeprComponent',
      api: (config = {}) => {
        this.weprConfig = { ...this.weprConfig, ...config };
        console.log(`[${this.entityName}] Wepr config updated:`, this.weprConfig);
        return this.weprConfig;
      }
    });

    this.addLocal({
      id: 'setVisualCore',
      api: (patch = {}) => {
        this.visualCore = {
          ...this.visualCore,
          ...patch,
          position: { ...this.visualCore.position, ...patch.position },
          rotation: { ...this.visualCore.rotation, ...patch.rotation },
          scale: { ...this.visualCore.scale, ...patch.scale },
        };
        return this.visualCore;
      }
    });

    this.addLocal({
      id: 'getVisualSnapshot',
      api: () => this.visualCore
    });

    this.addLocal({
      id: 'syncAllFrontends',
      api: async () => {
        console.log(`[${this.entityName}] Syncing all frontends...`);
        return { status: 'synced', timestamp: Date.now() };
      }
    });
  }

  getVisualSnapshot() {
    return { ...this.visualCore };
  }
}
