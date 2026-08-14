import { Level1System } from "./Level1System/Level1System.js";

async function main() {
    console.log("--- Starting Example 2 (Gross Architecture Nested Entity Test) ---");
    const system = new Level1System(10093, { telemetryEnabled: true });
    
    // Finalize Root Entity
    await system.finalize();
    
    console.log("[Level1System] Testing 3-level nesting call...");
    const res = await system.call("TestNesting");
    console.log("[Level1System] Verification output:", res);

    console.log("\n--- Telemetry Report ---");
    console.log("[Level1System]", JSON.stringify(system.getTelemetry(), null, 2));

    console.log("\nCleanup: Disposing system...");
    system.dispose();
    process.exit(0);
}

main().catch(console.error);
