// WebInterfaceSystem/WebInterfaceSystem.js
import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import { UIPanelAtom } from "./functionalities/UIPanel/UIPanel.js";
import { SetupCommsAtom } from "./functionalities/SetupComms/SetupComms.js";
import { MonitorAtom } from "./functionalities/Monitor/Monitor.js";

export class WebInterfaceSystem extends Entity {
    static Singleton = true;
    constructor(port = 10092, options = {}) {
        super("WebInterfaceSystem", null, options);

        this.addLocal({
            ...UIPanelAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["ui:panel"]
            }
        });
        this.addLocal(SetupCommsAtom);
        this.addLocal(MonitorAtom);

        // Attach Protocol Adapter
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
