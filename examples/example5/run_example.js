import { InstanceSystem } from "./InstanceSystem/InstanceSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 5 ---");
    const system = new InstanceSystem(10096);
    await system.startDiscovery();
    
    // Explicitly call the demo
    const result = await system.call("RunInstanceDemo");
    console.log("[InstanceSystem] Demo result:", result);

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[InstanceSystem]", JSON.stringify(system.getTelemetry(), null, 2));

        system.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
