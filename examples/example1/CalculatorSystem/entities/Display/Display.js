// CalculatorSystem/entities/Display/Display.js
import { Entity } from "../../../../../dist/index.js";
import { showAtom } from "./functionalities/show/show.js";

export class DisplayEntity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        
        this.addLocal({
            ...showAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["ui:display"]
            }
        });
    }
}
