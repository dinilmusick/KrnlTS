// WebInterfaceSystem/WebInterfaceSystem.js
import { krnlSystemEntityBase } from "../../../src/krnl/core/index.js";
import { UIPanelAtom } from "./functionalities/UIPanel/UIPanel.js";
import { SetupCommsAtom } from "./functionalities/SetupComms/SetupComms.js";
import { MonitorAtom } from "./functionalities/Monitor/Monitor.js";

export class WebInterfaceSystem extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10092, options = {}) {
        super("WebInterfaceSystem", null, port, "0.0.0.0", options);

        this.addLocal(UIPanelAtom);
        this.addLocal(SetupCommsAtom);
        this.addLocal(MonitorAtom);
        
        // this.startDiscovery().then(async () => {
        //     console.log(`[WebInterfaceSystem] Frontend ready on port ${port}.`);
        //     const status = await this.call("SetupComms");
        //     console.log(`[WebInterfaceSystem] Setup status: ${status}`);
        //     if (status === "Wiring complete.") {
        //         console.log("[WebInterfaceSystem] Triggering demo calculation...");
        //         const res = await this.call("UIPanel", { a: 10, b: 5, op: "add" });
        //         console.log("[WebInterfaceSystem] Result from UIPanel:", res);
        //     }
        // });
    }
}

// new WebInterfaceSystem();
