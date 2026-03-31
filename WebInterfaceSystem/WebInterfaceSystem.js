// WebInterfaceSystem/WebInterfaceSystem.js
import { krnlSystemEntityBase } from "../krnl/core/index.js";
import { UIPanelAtom } from "./functionalities/UIPanel/UIPanel.js";

export class WebInterfaceSystem extends krnlSystemEntityBase {
    constructor(port = 10092) {
        super("WebInterfaceSystem", null, port);

        this.addLocal(UIPanelAtom);
        this.interface.createCollector("remote-monitor");

        this.startDiscovery().then(() => {
            console.log(`[WebInterfaceSystem] Frontend ready on port ${port}.`);
            this._setupNetworkWiring();
        });
    }

    /**
     * INTER-SYSTEM WIRING (Cross-Network)
     * Demonstrates using the inherited 'wire' method to subscribe to remote events.
     */
    async _setupNetworkWiring() {
        setTimeout(async () => {
            const peers = this.listPeers();
            const calcPeer = peers.find(p => p.name === "CalculatorSystem");

            if (calcPeer) {
                console.log("[WebInterfaceSystem] INTER-SYSTEM: Subscribing to CalculatorSystem...");

                // 1. Setup Remote Proxy for calls
                this.addRemote({
                    id: "RemoteCalc",
                    targetEntity: { call: (fid, data) => this.commComponent.callWsRpc(calcPeer.address, 'call', { fid, data }) },
                    targetFunction: "Calculator"
                });

                // 2. Perform Network Wiring (Remote Output -> Local Input)
                // This uses WebSockets behind the scenes
                await this.wire("CalculatorSystem", {
                    remoteOutput: "Calculator:onCalculated",
                    localInput: "remote-monitor"
                });

                // Handle the remote event stream locally
                this.interface.getCollector("remote-monitor")._directHandler = (msg) => {
                    console.log(`[NETWORK_MONITOR] Observed Remote Event: ${msg.data.status}`);
                };
            }
        }, 3000);
    }
}

new WebInterfaceSystem();
