import { krnlEntityBase } from "../../../../../src/krnl/core/index.js";
import { LeafEntity } from "./entities/LeafEntity/LeafEntity.js";

// Entity descriptor: assembly and visibility boundary only.
export class MidEntity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.hierarchyManager.createComponentEntity("Leaf", LeafEntity);
        const promoted = this.getRemote("LeafAction");
        if (promoted) promoted.setVisibility("private");
    }
}
