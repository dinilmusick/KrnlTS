import { Entity } from "../../../../../dist/index.js";
import { LoggerAtom } from "./functionalities/Logger/Logger.js";

export class ConsumerEntity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.addLocal({
            ...LoggerAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["logging:consumer"]
            }
        });
    }
}
