import { AIServerSystem } from "./AIServerSystem/AIServerSystem.js";
import { telemetry } from "../../src/krnl/core/index.js";

/**
 * Bootstrapper for the AI Server Example.
 */
async function main() {
    telemetry.enabled = true;
    const port = 10111;
    const system = new AIServerSystem(port);

    // This triggers the shared server starting on the unified port.
    // In a real app, this is usually called to enable P2P discovery.
    await system.startDiscovery();

    console.log("\n--- Example Console ---");
    console.log("Try running the following command in your terminal:");
    console.log(`curl -X POST http://localhost:${port}/call/calculator -H "Content-Type: application/json" -d '{"a": 20, "b": 3, "op": "mul"}'`);
    console.log("------------------------\n");

    // Keep the process alive
    process.on('SIGINT', () => {
        console.log("\nShutting down AI Server...");
        system.dispose();
        process.exit(0);
    });
}

main().catch(err => {
    console.error("Failed to start AI Server example:", err);
});
