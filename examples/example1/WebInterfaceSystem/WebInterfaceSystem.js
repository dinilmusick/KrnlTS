// WebInterfaceSystem/WebInterfaceSystem.js
import { krnlSystemEntityBase } from "../../../src/krnl/core/index.js";
import { UIPanelAtom } from "./functionalities/UIPanel/UIPanel.js";
import { SetupCommsAtom } from "./functionalities/SetupComms/SetupComms.js";
import { MonitorAtom } from "./functionalities/Monitor/Monitor.js";

export class WebInterfaceSystem extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10092) {
        super("WebInterfaceSystem", null, port);

        this.addLocal(UIPanelAtom);
        this.addLocal(SetupCommsAtom);
        this.addLocal(MonitorAtom);
        
        this.startDiscovery().then(() => {
            console.log(`[WebInterfaceSystem] Frontend ready on port ${port}.`);
            this.call("SetupComms");
        });
    }
}

new WebInterfaceSystem();
