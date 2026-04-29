import { SourceSystem, TargetSystem, DemoOrchestrator } from "./OrchestratorSystem/OrchestratorSystem.js";
import { telemetry } from "../../dist/index.js";

// Note: I had to add exports to the classes in OrchestratorSystem.js for this to work.
// I'll go back and add those exports.

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 7 ---");
    const source = new SourceSystem(10221);
    const target = new TargetSystem(10222);
    const orchestrator = new DemoOrchestrator(10223);

    await Promise.all([
        source.startDiscovery(),
        target.startDiscovery(),
        orchestrator.startDiscovery()
    ]);

    // Deterministic peer registry for the demo
    orchestrator.peers.set("SourceSystem", {
        id: "SourceSystem",
        name: "SourceSystem",
        address: "127.0.0.1:10221",
        discoverable: true,
        busy: false,
        reservedBy: null,
        lastSeen: Date.now(),
    });
    orchestrator.peers.set("TargetSystem", {
        id: "TargetSystem",
        name: "TargetSystem",
        address: "127.0.0.1:10222",
        discoverable: true,
        busy: false,
        reservedBy: null,
        lastSeen: Date.now(),
    });

    const createdRoute = await orchestrator.connectSystems("SourceSystem", "TargetSystem", {
        sourceEmitter: "Pulse:pulse",
        targetCollector: "system-commands",
        externallyMutable: false,
        metadata: { profile: "app-internal" },
    });
    console.log("[Example7] Route created by orchestrator:", createdRoute.id);

    await source.call("Pulse", { msg: "hello-through-orchestrator" });
    const sourceRoutes = await orchestrator.listPeerRoutes("SourceSystem");
    console.log("[Example7] Source routes count:", sourceRoutes.length);

    await orchestrator.disconnectPeerRoute("SourceSystem", createdRoute.id);
    console.log("[Example7] Route disconnected by manager orchestrator.");

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[DemoOrchestrator]", JSON.stringify(orchestrator.getTelemetry(), null, 2));

        source.dispose();
        target.dispose();
        orchestrator.dispose();
        process.exit(0);
    }, 2000);
}

// I need to fix OrchestratorSystem.js to export the classes.
// I'll do that now.

main().catch(console.error);
