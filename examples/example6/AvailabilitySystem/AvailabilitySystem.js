import { krnlSystemEntityBase } from "../../../src/krnl/core/index.js";

/**
 * Exhibit 6:
 * Deterministic availability/discoverability test that avoids UDP-network dependence.
 */
export class AvailabilitySystem extends krnlSystemEntityBase {
  static Singleton = true;
}

const supervisor = new AvailabilitySystem("SupervisorSystem", null, 10096, "127.0.0.1");
const subservice = new AvailabilitySystem("SubserviceSystem", null, 10097, "127.0.0.1");

await subservice.commComponent.startWsServer();

console.log("[Example6] Initial flags:", subservice.getSystemFlags());

const heartbeatBeforeReservation = await supervisor.commComponent.callWsRpc(
  "127.0.0.1:10097",
  "call",
  { fid: "heartbeat", data: { meta: { requester: "SupervisorSystem" } } }
);
console.log("[Example6] RPC heartbeat before reservation:", heartbeatBeforeReservation);

subservice.reserveFor("SupervisorSystem");
console.log("[Example6] After reserveFor:", subservice.getSystemFlags());

try {
  await supervisor.commComponent.callWsRpc("127.0.0.1:10097", "call", {
    fid: "heartbeat",
    data: { meta: { requester: "ExternalApp" } },
  });
  console.log("[Example6] ERROR: reservation guard was expected to reject ExternalApp.");
} catch (error) {
  console.log("[Example6] Reservation guard rejection (expected):", error.message);
}

const heartbeatForOwner = await supervisor.commComponent.callWsRpc(
  "127.0.0.1:10097",
  "call",
  { fid: "heartbeat", data: { meta: { requester: "SupervisorSystem" } } }
);
console.log("[Example6] Reserved owner can still call:", heartbeatForOwner);

subservice.setDiscoverable(false);
console.log("[Example6] After setDiscoverable(false):", subservice.getManifest().flags);
subservice.setDiscoverable(true);
subservice.releaseReservation("SupervisorSystem");
console.log("[Example6] After release + discoverable on:", subservice.getManifest().flags);

// Demonstrate discoverPeers filtering + stale pruning behavior deterministically.
supervisor.peerTtlMs = 5;
supervisor.peers.set("VisibleBusy", {
  id: "VisibleBusy",
  name: "VisibleBusy",
  address: "127.0.0.1:12000",
  busy: true,
  reservedBy: "OtherService",
  discoverable: true,
  lastSeen: Date.now(),
});
supervisor.peers.set("HiddenPeer", {
  id: "HiddenPeer",
  name: "HiddenPeer",
  address: "127.0.0.1:12001",
  busy: false,
  reservedBy: null,
  discoverable: false,
  lastSeen: Date.now(),
});
supervisor.peers.set("StalePeer", {
  id: "StalePeer",
  name: "StalePeer",
  address: "127.0.0.1:12002",
  busy: false,
  reservedBy: null,
  discoverable: true,
  lastSeen: Date.now() - 1000,
});

console.log("[Example6] listPeers (hidden + stale removed):", supervisor.listPeers());
console.log(
  "[Example6] discoverPeers includeBusy=false:",
  await supervisor.call("discoverPeers", { includeBusy: false })
);

supervisor.dispose();
subservice.dispose();

