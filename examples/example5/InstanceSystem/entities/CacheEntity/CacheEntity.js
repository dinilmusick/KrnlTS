import { Entity } from "../../../../../dist/index.js";
import { ReadAtom } from "./functionalities/Read/Read.js";

export class CacheEntity extends Entity {
    static Singleton = true;

    constructor(name, owner, options = {}) {
        super(name, owner, options);
        this.addLocal({
            ...ReadAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["cache:read"]
            }
        });
    }
}
