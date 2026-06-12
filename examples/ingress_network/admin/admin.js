import { krnlSystemEntityBase } from "../../../dist/index.js";

export class AdminSystem extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10099, options = {}) {
        super("AdminSystem", null, port, options.host || "0.0.0.0", options);

        this.addLocal({
            id: "systemInfo",
            visibility: "public",
            description: "Retrieve administrator system statistics and information.",
            api: async () => {
                return {
                    name: this.entityName,
                    role: "AdminIngressGateway",
                    timestamp: new Date().toISOString()
                };
            }
        });
    }
}
