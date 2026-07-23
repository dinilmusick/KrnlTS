export class krnlBackendVisualEntityBase extends krnlEntityBase {
    constructor(name: any, owner?: null);
    visualCore: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        visible: boolean;
        color: string;
    };
    _setupVisualFunctionalities(): void;
    getVisualSnapshot(): {
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        visible: boolean;
        color: string;
    };
}
import { krnlEntityBase } from "../core/K_ENT_Krnl_Entity_Base.js";
//# sourceMappingURL=K_ENT_Krnl_Backend_Visual_Entity_Base.d.ts.map