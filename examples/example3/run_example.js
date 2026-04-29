import { EventSystem } from "./EventSystem/EventSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 3 ---");
    const system = new EventSystem(10094);
    await system.startDiscovery();
    
    system.telemetryEnabled = true;

    // Example 3 calls 'RunScenario' in its constructor
    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[EventSystem]", JSON.stringify(system.getTelemetry(), null, 2));

        system.dispose();
        process.exit(0);
    }, 8000);
}

main().catch(console.error);
