import {
  krnlNetworkOrchestratorEntityBase,
  krnlSystemEntityBase,
} from "../../../src/krnl/core/index.js";

class SourceSystem extends krnlSystemEntityBase {
  static Singleton = true;
  constructor(port = 10121) {
    super("SourceSystem", null, port, "127.0.0.1");
    this.addLocal({
      id: "Pulse",
      emitters: { pulse: {} },
      api: async (input, { functionality }) => {
        functionality.emitters.get("pulse").pushDataStreamToEmitter({
          from: "SourceSystem",
          payload: input,
        });
        return { pushed: true, input };
      },
    });
  }
}

class TargetSystem extends krnlSystemEntityBase {
  static Singleton = true;
  constructor(port = 10122) {
    super("TargetSystem", null, port, "127.0.0.1");
  }
}

class DemoOrchestrator extends krnlNetworkOrchestratorEntityBase {
  static Singleton = true;
  constructor(port = 10123) {
    super("DemoOrchestrator", null, port, "127.0.0.1");
  }
}

const source = new SourceSystem();
const target = new TargetSystem();
const orchestrator = new DemoOrchestrator();

await Promise.all([
  source.commComponent.startWsServer(),
  target.commComponent.startWsServer(),
  orchestrator.commComponent.startWsServer(),
]);

// Deterministic peer registry for the demo (independent of UDP environment).
orchestrator.peers.set("SourceSystem", {
  id: "SourceSystem",
  name: "SourceSystem",
  address: "127.0.0.1:10121",
  discoverable: true,
  busy: false,
  reservedBy: null,
  lastSeen: Date.now(),
});
orchestrator.peers.set("TargetSystem", {
  id: "TargetSystem",
  name: "TargetSystem",
  address: "127.0.0.1:10122",
  discoverable: true,
  busy: false,
  reservedBy: null,
  lastSeen: Date.now(),
});

const createdRoute = await orchestrator.connectSystems("SourceSystem", "TargetSystem", {
  sourceEmitter: "Pulse:pulse",
  targetCollector: "system-commands",
  externallyMutable: false, // immutable to non-manager external requests
  metadata: { profile: "app-internal" },
});
console.log("[Example7] Route created by orchestrator:", createdRoute);

await source.call("Pulse", { msg: "hello-through-orchestrator" });
const sourceRoutes = await orchestrator.listPeerRoutes("SourceSystem");
console.log("[Example7] Source routes after push:", sourceRoutes);

try {
  await orchestrator.commComponent.callWsRpc("127.0.0.1:10121", "disconnect-route", {
    routeId: createdRoute.id,
    requester: "ExternalOrchestrator",
  });
  console.log("[Example7] ERROR: immutable route should reject external orchestrator disconnect.");
} catch (error) {
  console.log("[Example7] Immutable-route guard rejection (expected):", error.message);
}

await orchestrator.disconnectPeerRoute("SourceSystem", createdRoute.id);
console.log("[Example7] Route disconnected by manager orchestrator.");

source.dispose();
target.dispose();
orchestrator.dispose();

