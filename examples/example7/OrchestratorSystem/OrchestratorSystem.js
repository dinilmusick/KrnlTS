import {
  krnlNetworkOrchestratorEntityBase,
  krnlSystemEntityBase,
} from "../../../src/krnl/core/index.js";

export class SourceSystem extends krnlSystemEntityBase {
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

export class TargetSystem extends krnlSystemEntityBase {
  static Singleton = true;
  constructor(port = 10122) {
    super("TargetSystem", null, port, "127.0.0.1");
  }
}

export class DemoOrchestrator extends krnlNetworkOrchestratorEntityBase {
  static Singleton = true;
  constructor(port = 10123) {
    super("DemoOrchestrator", null, port, "127.0.0.1");
  }
}

// const source = new SourceSystem();
// ... removed embedded runner ...

