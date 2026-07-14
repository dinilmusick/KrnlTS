import { z } from "zod";
import { krnlSystemEntityBase } from "../../src/krnl/core/K_ENT_Krnl_System_Entity_Base.js";
import { KrnlWatchVariablesTracker } from "../../src/krnl/core/K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "../../src/krnl/core/K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlEndpointAgent } from "../../src/krnl/core/K_LIB_Krnl_Endpoint_Agent.js";
import { KrnlApplicationOrchestrator } from "../../src/krnl/core/K_LIB_Krnl_Application_Orchestrator.js";
import { KrnlAikoClient } from "../../src/krnl/core/K_LIB_Krnl_Aiko_Client.js";
import { KrnlRuntimeStore } from "../../src/krnl/core/K_LIB_Krnl_Runtime_Store.js";
import { KrnlIntelligenceSpec, KrnlEndpointDefinition } from "../../src/krnl/core/K_LIB_Krnl_Ai_Concepts.js";

async function runRealAiCalculator() {
  console.log("=== RUNNING REAL AI-NATIVE CALCULATOR PIPELINE ===");

  // 1. Setup Aiko Client pointing to our Aiko server (default port 10095)
  const aikoPort = Number(process.env.AIKO_PORT || 10095);
  const aikoClient = new KrnlAikoClient(aikoPort);

  const isAikoUp = await aikoClient.isAlive();
  if (!isAikoUp) {
    console.error("❌ Error: Aiko server is not running on port " + aikoPort);
    console.error("Please run: cd /Users/dinil/Desktop/Projects/Javascript/Aiko && node src/Aiko.js");
    process.exit(1);
  }
  console.log("✓ Connected to Aiko server on port " + aikoPort);

  // 2. Setup local system with Calculator functionality
  class CalcSystem extends krnlSystemEntityBase {
    constructor() {
      super("CalcSystem", null, 10777);
    }
  }

  const system = new CalcSystem();
  await system.activateServiceSuite();

  const CalculatorInputSchema = z.object({
    a: z.number(),
    b: z.number(),
    op: z.enum(["add", "sub", "mul", "div"])
  });

  const stateObj = { history: [] as string[] };

  // Register calculator functionality
  system.addLocal({
    id: "Calculator",
    description: "Performs basic math operations (add, sub, mul, div) on two numbers a and b.",
    schema: { input: CalculatorInputSchema },
    api: async (input: any) => {
      const { a, b, op } = input;
      let result = 0;
      if (op === "add") result = a + b;
      else if (op === "sub") result = a - b;
      else if (op === "mul") result = a * b;
      else if (op === "div") result = a / b;
      
      const record = `${a} ${op} ${b} = ${result}`;
      stateObj.history.push(record);
      return { status: "success", result, record };
    }
  });

  const calcFunc = system.localFunctionalities.get("Calculator");
  calcFunc.state = stateObj; // bind state

  // Define full intelligence specs
  const routingSpec: KrnlIntelligenceSpec = {
    reasoning: 3, planning: 1, toolUsage: 0, structuredOutput: 5, jsonStrictness: 5,
    coding: 0, extraction: 2, classification: 5, summarization: 1, creativity: 1,
    determinism: 8, context: 3, vision: 0, multimodal: 0, outputComplexity: 2
  };

  const endpointSpec: KrnlIntelligenceSpec = {
    reasoning: 5, planning: 2, toolUsage: 1, structuredOutput: 8, jsonStrictness: 8,
    coding: 0, extraction: 6, classification: 4, summarization: 1, creativity: 1,
    determinism: 8, context: 5, vision: 0, multimodal: 0, outputComplexity: 3
  };

  // 3. Build definition and agents
  const definition: KrnlEndpointDefinition = {
    id: "Calculator",
    category: "app",
    method: "POST",
    visibility: "public",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
        op: { type: "string", enum: ["add", "sub", "mul", "div"] }
      },
      required: ["a", "b", "op"]
    },
    outputSchema: {},
    description: "Performs basic math operations (add, sub, mul, div) on two numbers a and b.",
    systemInstructions: "Extract the numbers and operation to perform calculation. Only return JSON.",
    examples: [
      { input: { a: 10, b: 5, op: "add" }, output: { status: "success", result: 15 } }
    ],
    examplePayload: { a: 1, b: 2, op: "add" },
    intelligenceSpec: endpointSpec,
    agentTools: [],
    retryConfig: { maxRetries: 3, timeoutMs: 15000, retryDelayMs: 500, backoffStrategy: "LINEAR" },
    staticWatchVars: [],
    dynamicWatchVars: ["history"],
    accessPolicy: null,
    emitters: [],
    sourcePath: null,
    memory: "",
    runtimeEdited: false
  };

  const tracker = new KrnlWatchVariablesTracker();
  tracker.register("Calculator", definition as any, calcFunc);

  const scheduler = new KrnlEndpointScheduler(tracker);
  const store = new KrnlRuntimeStore(process.cwd());
  await store.load();

  const agent = new KrnlEndpointAgent(definition, aikoClient, tracker, system);

  // Initialize application orchestrator
  const orchestrator = new KrnlApplicationOrchestrator(
    system,
    aikoClient,
    tracker,
    scheduler,
    routingSpec,
    endpointSpec, // escalation spec
    store
  );
  orchestrator.registerAgent("Calculator", agent);

  // 4. Send natural language prompt
  const prompt = "Can you please add 12 and 15 for me?";
  console.log(`\nSending prompt to Orchestrator: "${prompt}"`);
  
  const response = await orchestrator.handle(prompt);
  console.log("\n=== ORCHESTRATOR RESPONSE ===");
  console.log("Status:", response.status);
  console.log("Routed Endpoint:", response.endpointId);
  console.log("Result:", JSON.stringify(response.result));
  console.log("AI Latency (ms):", response.trace.aiLatencyMs);
  console.log("Trace Payload:", JSON.stringify(response.trace.payload));

  // Verify result correctness
  const actualVal = response.result?.result ?? response.result?.payload?.result;
  if (actualVal === 27) {
    console.log("\n✅ SUCCESS: The pipeline works perfectly and resolved 12 + 15 = 27!");
  } else {
    console.error("\n❌ FAILURE: Pipeline resolved incorrect result:", response.result);
    process.exit(1);
  }

  // Cleanup
  system.dispose();
  process.exit(0);
}

runRealAiCalculator().catch(e => {
  console.error("❌ UNCAUGHT ERROR IN TEST PIPELINE:", e);
  process.exit(1);
});
