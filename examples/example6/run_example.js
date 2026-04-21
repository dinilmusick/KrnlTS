import { AvailabilitySystem } from "./AvailabilitySystem/AvailabilitySystem.js";

async function main() {
    console.log("--- Starting Example 6 ---");
    const supervisor = new AvailabilitySystem("SupervisorSystem", null, 10097, "127.0.0.1");
    const subservice = new AvailabilitySystem("SubserviceSystem", null, 10098, "127.0.0.1");

    await subservice.startDiscovery();
    await supervisor.startDiscovery();

    console.log("[Example6] Initial flags:", subservice.getSystemFlags());

    // Reserve subservice for supervisor
    subservice.reserveFor("SupervisorSystem");
    console.log("[Example6] After reserveFor:", subservice.getSystemFlags());

    // Try to call from an unknown entity (directly using comm component to simulate)
    try {
        console.log("[Example6] Testing unauthorized call...");
        await subservice.commComponent.callWsRpc("127.0.0.1:10098", "call", {
            fid: "heartbeat",
            data: { meta: { requester: "ExternalApp" } },
        });
        console.error("[Example6] ERROR: reservation guard was expected to reject ExternalApp.");
    } catch (error) {
        console.log("[Example6] Reservation guard rejection (expected):", error.message);
    }

    // Authorized call
    const heartbeatForOwner = await subservice.commComponent.callWsRpc(
        "127.0.0.1:10098",
        "call",
        { fid: "heartbeat", data: { meta: { requester: "SupervisorSystem" } } }
    );
    console.log("[Example6] Reserved owner can still call:", heartbeatForOwner.status);

    // Discoverability tests
    subservice.setDiscoverable(false);
    console.log("[Example6] After setDiscoverable(false):", subservice.getManifest().flags.discoverable);
    
    subservice.setDiscoverable(true);
    subservice.releaseReservation("SupervisorSystem");
    console.log("[Example6] After release + discoverable on:", subservice.getManifest().flags);

    setTimeout(() => {
        supervisor.dispose();
        subservice.dispose();
        process.exit(0);
    }, 2000);
}

main().catch(console.error);
