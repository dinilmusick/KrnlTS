import { Entity } from "../../../../../dist/index.js";
import { LeafEntity } from "./entities/LeafEntity/LeafEntity.js";

export class MidEntity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.hierarchyManager.createComponentEntity("Leaf", LeafEntity);
        const promoted = this.getRemote("LeafAction");
        if (promoted) promoted.setVisibility("private");
    }
}
