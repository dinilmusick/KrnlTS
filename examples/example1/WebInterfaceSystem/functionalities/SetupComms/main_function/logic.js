// examples/example1/WebInterfaceSystem/functionalities/SetupComms/main_function/logic.js
import { WebSocketTransportAdapter } from "../../../../../../krnl/core/index.js";

export const main = async (input, { entity }) => {
    // Wait for discovery to find peers
    await new Promise(r => setTimeout(r, 3000));
    
    const peers = entity.listPeers();
    const calcPeer = peers.find(p => p.name === "CalculatorSystem");

    if (calcPeer) {
        console.log("[WebInterfaceSystem] INTER-SYSTEM: Subscribing to CalculatorSystem...");

        // 1. Setup Remote Proxy for calls using the new WebSocketTransportAdapter
        entity.addRemote({
            id: "RemoteCalc",
            transport: new WebSocketTransportAdapter(entity.commComponent, calcPeer.address),
            targetFunction: "Calculator"
        });

        // 2. Perform Network Wiring (Remote Output -> Local Input)
        // We wire the remote output to our local "Monitor" input
        await entity.wire("CalculatorSystem", {
            remoteOutput: "Calculator:onCalculated",
            localInput: "Monitor"
        });

        return "Wiring complete.";
    }
    return "Calculator not found.";
};
