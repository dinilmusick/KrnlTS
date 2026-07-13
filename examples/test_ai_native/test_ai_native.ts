import { z } from "zod";
import { krnlSystemEntityBase } from "../../src/krnl/core/K_ENT_Krnl_System_Entity_Base.js";
import { KrnlWatchVariablesTracker } from "../../src/krnl/core/K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "../../src/krnl/core/K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlEndpointAgent } from "../../src/krnl/core/K_LIB_Krnl_Endpoint_Agent.js";
import { KrnlApplicationOrchestrator } from "../../src/krnl/core/K_LIB_Krnl_Application_Orchestrator.js";
import { KrnlAikoClient } from "../../src/krnl/core/K_LIB_Krnl_Aiko_Client.js";

async function runTests() {
  console.log("=== STARTING KRNLTS AI-NATIVE CORE UNIT TESTS ===");

  // 1. Setup mock system
  class TestSystem extends krnlSystemEntityBase {
    constructor() {
      super("TestSystem", null, 10555);
    }
  }

  const system = new TestSystem();
  await system.activateServiceSuite();

  // Define mock raw local endpoints
  const StoreKeySchema = z.object({
    name: z.string().min(3),
    value: z.string()
  });

  const stateObj = { vault: { keys: [] as any[] } };

  system.addLocal({
    id: "StoreKey",
    description: "Stores a secret key in the vault",
    schema: { input: StoreKeySchema },
    api: async (input: any) => {
      stateObj.vault.keys.push(input);
      return { status: "success", stored: input.name };
    }
  });

  const storeKeyFunc = system.localFunctionalities.get("StoreKey");
  storeKeyFunc.state = stateObj.vault; // bind state

  console.log("✓ System setup and StoreKey endpoint registered.");

  // 2. Test KrnlWatchVariablesTracker
  console.log("\nTesting KrnlWatchVariablesTracker...");
  const tracker = new KrnlWatchVariablesTracker();
  
  const mockConfig1 = {
    enabled: true,
    grade: "endpoint-grade-2" as any,
    dynamicWatchVars: ["keys"],
    staticWatchVars: ["vault"]
  };

  const mockConfig2 = {
    enabled: true,
    grade: "endpoint-grade-1" as any,
    dynamicWatchVars: ["keys"]
  };

  tracker.register("StoreKey", mockConfig1, storeKeyFunc);
  
  // Test live read
  const liveVars = tracker.readLiveVars("StoreKey");
  if (Array.isArray(liveVars.keys)) {
    console.log("✓ readLiveVars: successfully read live keys array.");
  } else {
    throw new Error("Failed to read live watch variables.");
  }

  // Test shared dynamic variables conflict
  const mockFunc2 = { id: "DeleteKey", state: stateObj.vault };
  tracker.register("DeleteKey", mockConfig2, mockFunc2);
  const shared = tracker.sharedDynamicVars("StoreKey", "DeleteKey");
  if (shared.includes("keys")) {
    console.log("✓ sharedDynamicVars: correctly identified shared dynamic variables.");
  } else {
    throw new Error("Failed conflict matching.");
  }

  // 3. Test KrnlEndpointScheduler
  console.log("\nTesting KrnlEndpointScheduler...");
  const scheduler = new KrnlEndpointScheduler(tracker);

  let executions: string[] = [];
  const task1 = async () => {
    executions.push("start-1");
    await new Promise(r => setTimeout(r, 100));
    executions.push("end-1");
    return "res-1";
  };

  const task2 = async () => {
    executions.push("start-2");
    await new Promise(r => setTimeout(r, 50));
    executions.push("end-2");
    return "res-2";
  };

  // Dispatch concurrently - should run sequentially because they share 'keys' watch variable
  const p1 = scheduler.dispatch("StoreKey", task1);
  const p2 = scheduler.dispatch("DeleteKey", task2);

  const [r1, r2] = await Promise.all([p1, p2]);
  
  if (
    executions[0] === "start-1" &&
    executions[1] === "end-1" &&
    executions[2] === "start-2" &&
    executions[3] === "end-2"
  ) {
    console.log("✓ scheduler: successfully serialized conflicting endpoints.");
  } else {
    throw new Error(`Serialization failed. Sequence: ${JSON.stringify(executions)}`);
  }

  // 4. Test KrnlEndpointAgent & KrnlAikoClient (Mocked)
  console.log("\nTesting KrnlEndpointAgent & Aiko Client...");
  
  // Mock Aiko client to return simulated completions
  class MockAikoClient extends KrnlAikoClient {
    constructor() {
      super(10095);
    }
    async isAlive(): Promise<boolean> {
      return true;
    }
    async fetchCatalog(): Promise<Record<string, any>> {
      return { "endpoint-grade-2": { description: "Mini" } };
    }
    async infer(profileTag: string, systemPrompt: string, userPrompt: string): Promise<string> {
      // Simulate validation failure on first attempt to check repair loop, success on retry
      if (userPrompt.includes("Validation error")) {
        return JSON.stringify({ name: "API_KEY", value: "sk-override" });
      }
      // Malformed payload on first attempt
      return JSON.stringify({ name: "AP", value: "sk-malformed" });
    }
  }

  const mockAiko = new MockAikoClient();
  const agentSchema = {
    functionalityId: "StoreKey",
    description: "Store API key",
    inputSchema: { type: "object", properties: { name: { type: "string", minLength: 3 }, value: { type: "string" } } },
    outputSchema: {},
    examples: [],
    systemInstructions: "",
    grade: "endpoint-grade-2" as any,
    retryConfig: { maxRetries: 2, timeoutMs: 5000 } as any,
    staticWatchVars: [],
    dynamicWatchVars: ["keys"],
    permissions: null
  };

  const agent = new KrnlEndpointAgent(agentSchema, mockAiko, tracker, system);
  
  const runRes = await agent.executeFromNaturalLanguage("Save OpenAI key as sk-malformed");
  
  if (runRes.result && runRes.result.status === "success" && runRes.trace.retryCount === 1) {
    console.log("✓ agent: successfully handled JSON validation failure and repaired payload in retry loop.");
  } else {
    throw new Error(`Agent repair loop failure. Retry count: ${runRes.trace.retryCount}`);
  }

  // 5. Test Application Orchestrator
  console.log("\nTesting KrnlApplicationOrchestrator...");
  
  // Mock orchestrator router response
  class RouterMockAiko extends MockAikoClient {
    async infer(profileTag: string, systemPrompt: string, userPrompt: string): Promise<string> {
      if (systemPrompt.includes("request router")) {
        return "StoreKey";
      }
      return JSON.stringify({ name: "API_KEY", value: "sk-final" });
    }
  }

  const routerAiko = new RouterMockAiko();
  const routerAgent = new KrnlEndpointAgent(agentSchema, routerAiko, tracker, system);
  const orchestrator = new KrnlApplicationOrchestrator(system, routerAiko, tracker, scheduler, "orchestrator-standard");
  orchestrator.registerAgent("StoreKey", routerAgent);

  const orchRes = await orchestrator.handle("Save OpenAI key");
  if (orchRes.status === "success" && orchRes.endpointId === "StoreKey") {
    console.log("✓ orchestrator: successfully routed query and triggered endpoint agent execution.");
  } else {
    throw new Error("Orchestration failed.");
  }

  // Cleanup
  system.dispose();

  console.log("\n=== ALL UNIT TESTS COMPLETED SUCCESSFULLY ===");
}

runTests().catch(e => {
  console.error("❌ TEST FAILURE:", e);
  process.exit(1);
});
