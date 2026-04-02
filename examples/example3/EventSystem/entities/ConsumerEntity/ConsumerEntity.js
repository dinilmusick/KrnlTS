import { krnlEntityBase } from "../../../../../krnl/core/index.js";
import { LoggerAtom } from "./functionalities/Logger/Logger.js";

export class ConsumerEntity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        this.addLocal(LoggerAtom);
    }
}
