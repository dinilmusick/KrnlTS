// WebInterfaceSystem/WebInterfaceSystem.js
import { krnlSystemEntityBase } from "../krnl/core/index.js";
import { UIPanelAtom } from "./functionalities/UIPanel/UIPanel.js";

/**
 * WEB INTERFACE SYSTEM (The Frontend Controller)
 * Listens on port 10092. Consumes math logic from CalculatorSystem.
 */
export class WebInterfaceSystem extends krnlSystemEntityBase {
    constructor(port = 10092) {
        super("WebInterfaceSystem", null, port);

        // 1. Assemble Logic
        this.addLocal(UIPanelAtom);

        // 2. System Initialization
        this.startDiscovery().then(() => {
            console.log(`[WebInterfaceSystem] Frontend controller ready on port ${port}.`);
            this._attemptAutoWiring();
        });
    }

    /**
     * Automatic Wiring: Find the Calculator and bridge the logic.
     */
    async _attemptAutoWiring() {
        // Wait for discovery to find peers
        setTimeout(async () => {
            const peers = this.listPeers();
            const calcPeer = peers.find(p => p.name === "CalculatorSystem");

            if (calcPeer) {
                console.log("[WebInterfaceSystem] Found Calculator. Wiring remote proxy...");
                
                // Add a remote proxy locally so UIPanel can call it as "RemoteCalc"
                // In a real production app, this could also be done via this.wire()
                // using WebSocket redirection.
                this.addRemote({
                    id: "RemoteCalc",
                    targetEntity: { call: (fid, data) => this.commComponent.callWsRpc(calcPeer.address, 'call', { fid, data }) },
                    targetFunction: "Calculator"
                });
            }
        }, 3000);
    }
}

// Bootstrap
new WebInterfaceSystem();
