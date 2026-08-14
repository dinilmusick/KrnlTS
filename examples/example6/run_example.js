import { AvailabilitySystem } from "./AvailabilitySystem/AvailabilitySystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 6 (Gross Architecture Availability & Reservation) ---");
    const supervisor = new AvailabilitySystem("SupervisorSystem", null, 10097, "127.0.0.1");
    const subservice = new AvailabilitySystem("SubserviceSystem", null, 10098, "127.0.0.1");

    await subservice.finalize();
    await supervisor.finalize();

    console.log("[Example6] Initial flags:", subservice.getSystemFlags());

    // Reserve subservice for supervisor
    subservice.reserveFor("SupervisorSystem");
    console.log("[Example6] After reserveFor:", subservice.getSystemFlags());

    // Test reservation guard assertion
    try {
        console.log("[Example6] Testing unauthorized call...");
        subservice._assertAvailableForRemoteAccess("ExternalApp");
        console.error("[Example6] ERROR: reservation guard was expected to reject ExternalApp.");
    } catch (error) {
        console.log("[Example6] Reservation guard rejection (expected):", error.message);
    }

    // Authorized check
    subservice._assertAvailableForRemoteAccess("SupervisorSystem");
    console.log("[Example6] Reserved owner can access: true");

    // Discoverability tests
    subservice.setDiscoverable(false);
    console.log("[Example6] After setDiscoverable(false):", subservice.getManifest().flags.discoverable);
    
    subservice.setDiscoverable(true);
    subservice.releaseReservation("SupervisorSystem");
    console.log("[Example6] After release + discoverable on:", subservice.getManifest().flags);

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[SubserviceSystem]", JSON.stringify(subservice.getTelemetry(), null, 2));

        supervisor.dispose();
        subservice.dispose();
        process.exit(0);
    }, 500);
}

main().catch(console.error);
