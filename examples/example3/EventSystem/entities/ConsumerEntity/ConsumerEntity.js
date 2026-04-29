import { krnlEntityBase } from "../../../../../dist/index.js";
import { LoggerAtom } from "./functionalities/Logger/Logger.js";

export class ConsumerEntity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.addLocal(LoggerAtom);
    }
}
