import { krnlEntityBase } from "../../../../dist/index.js";

export default class Display extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner, options) {
        super(name, owner, options);
        
        this.addLocal({
            id: "show",
            visibility: "public",
            api: async (text) => {
                console.log(`[Display Component] >>> ${text} <<<`);
                return `Rendered: ${text}`;
            }
        });
    }
}
