import { krnlSystemEntityBase } from "../dist/index.js";

async function main() {
    console.log("--- Testing Krnl Telemetry ---");
    
    // 1. Setup a test system
    const system = new krnlSystemEntityBase("TelemetryTestSystem", null, 10111);
    
    // 2. Add a functionality that we can call
    system.addLocal({
        id: "SlowLogic",
        api: async (input) => {
            // Simulate variable workload
            const delay = input.delay || 50;
            await new Promise(r => setTimeout(r, delay));
            return { done: true, delay };
        },
        visibility: "public"
    });

    console.log("Telemetry Disabled (Default): Running 5 calls...");
    for(let i=0; i<5; i++) await system.call("SlowLogic", { delay: 10 });
    
    let stats = system.getTelemetry();
    console.log("Stats (should be empty):", JSON.stringify(stats.metrics, null, 2));

    console.log("\nEnabling Telemetry: Running 10 calls with varying delays...");
    system.telemetryEnabled = true;
    
    for(let i=0; i<10; i++) {
        await system.call("SlowLogic", { delay: i * 10 });
    }

    stats = system.getTelemetry();
    console.log("Stats (should be populated):", JSON.stringify(stats.metrics, null, 2));

    const slowStats = stats.metrics["SlowLogic"];
    if (slowStats && slowStats.calls === 10) {
        console.log("\n✅ PASS: Successfully tracked 10 calls.");
        console.log(`✅ PASS: Average Latency: ${slowStats.avgLatencyMs.toFixed(2)}ms`);
        console.log(`✅ PASS: Peak Latency: ${slowStats.peakLatencyMs.toFixed(2)}ms`);
    } else {
        console.log("\n❌ FAIL: Metric mismatch.");
    }

    system.dispose();
    process.exit(0);
}

main().catch(console.error);
