import { Level1System } from "./Level1System/Level1System.js";

async function main() {
    console.log("--- Starting Example 2 ---");
    const system = new Level1System(10093);
    await system.startDiscovery();
    
    system.telemetryEnabled = true;
    
    // Example 2 calls 'TestNesting' in its constructor
    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[Level1System]", JSON.stringify(system.getTelemetry(), null, 2));

        system.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
