//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Backend_Visual_Entity_Base.js
 * @description A base class for entities that have a visual backend representation.
 */
import { krnlEntityBase } from "../core/K_ENT_Krnl_Entity_Base.js";
import { getVisualSnapshotApi, setBrndaComponentApi, setVisualCoreApi, setWeprComponentApi, syncAllFrontendsApi, } from "./K_LIB_Krnl_Backend_Visual_Functionality_APIs.js";
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
            api: setBrndaComponentApi(this)
        });
        this.addLocal({
            id: 'setWeprComponent',
            api: setWeprComponentApi(this)
        });
        this.addLocal({
            id: 'setVisualCore',
            api: setVisualCoreApi(this)
        });
        this.addLocal({
            id: 'getVisualSnapshot',
            api: getVisualSnapshotApi(this)
        });
        this.addLocal({
            id: 'syncAllFrontends',
            api: syncAllFrontendsApi(this)
        });
    }
    getVisualSnapshot() {
        return { ...this.visualCore };
    }
}
//# sourceMappingURL=K_ENT_Krnl_Backend_Visual_Entity_Base.js.map