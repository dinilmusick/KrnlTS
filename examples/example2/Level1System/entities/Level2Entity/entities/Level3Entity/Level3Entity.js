import { krnlEntityBase } from "../../../../../../../krnl/core/index.js";
import { DeepLogic } from "./functionalities/DeepLogic/DeepLogic.js";

export class Level3Entity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        this.addLocal(DeepLogic);
    }
}
