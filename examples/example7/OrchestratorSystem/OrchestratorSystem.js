import {
  Entity,
  krnlSystemCommComponent,
  krnlNetworkOrchestratorEntityBase
} from "../../../dist/index.js";

export class SourceSystem extends Entity {
  static Singleton = true;
  constructor(port = 10121, host = "127.0.0.1") {
    super("SourceSystem", null);
    this.addLocal({
      id: "Pulse",
      manifest: {
        version: "1.0.0",
        capabilities: ["stream:pulse"]
      },
      emitters: { pulse: {} },
      api: async (input, { functionality }) => {
        functionality.emitters.get("pulse").pushDataStreamToEmitter({
          from: "SourceSystem",
          payload: input,
        });
        return { pushed: true, input };
      },
    });
    this.attachAdapter(new krnlSystemCommComponent(this, port, host));
  }
}

export class TargetSystem extends Entity {
  static Singleton = true;
  constructor(port = 10122, host = "127.0.0.1") {
    super("TargetSystem", null);
    this.interface.createCollector("system-commands");
    this.attachAdapter(new krnlSystemCommComponent(this, port, host));
  }
}

export class DemoOrchestrator extends krnlNetworkOrchestratorEntityBase {
  static Singleton = true;
  constructor(port = 10123, host = "127.0.0.1") {
    super("DemoOrchestrator", null, port, host);
  }
}
