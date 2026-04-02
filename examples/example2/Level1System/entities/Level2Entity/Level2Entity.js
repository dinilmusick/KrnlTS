import { krnlEntityBase } from "../../../../../krnl/core/index.js";
import { Level3Entity } from "./entities/Level3Entity/Level3Entity.js";

export class Level2Entity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        this.hierarchyManager.createComponentEntity("Level3", Level3Entity);
    }
}
