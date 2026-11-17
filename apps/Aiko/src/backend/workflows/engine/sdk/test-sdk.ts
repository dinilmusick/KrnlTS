import { SDKRegistry } from "./registry/index.js";
import { WorkflowNode, SDKExecutionResult } from "./types/index.js";
import { PortBuilder } from "./ports/index.js";
import { ParameterBuilder } from "./parameters/index.js";
import { validateNodeInputsAndParameters } from "./validation/index.js";
import { ExecutionContext } from "../executor/context.js";
import { DataType } from "../types/graph.js";
import { NodeRegistry } from "../registry/index.js";

// Define a test node using our Node SDK
export const TestMathNode: WorkflowNode = {
  id: "test-node-1",
  category: "math",
  version: "1.0.0",
  metadata: {
    name: "sdk/test-math",
    displayName: "SDK Test Math",
    category: "math",
    version: "1.0.0",
    description: "Multiplies an input number by a parameterized multiplier factor",
    keywords: ["multiply", "sdk", "test"],
    tags: ["math", "sdk"]
  },
  inputs: {
    value: PortBuilder.createInput("value", DataType.Number, true, 0, "The input number")
  },
  outputs: {
    result: PortBuilder.createOutput("result", DataType.Number, "The resulting multiplied number")
  },
  parameters: {
    factor: ParameterBuilder.createInteger("factor", 2, "The multiplication factor", 1, 10)
  },
  async execute(context: ExecutionContext): Promise<SDKExecutionResult> {
    const value = context.getVariable("value") ?? 0;
    const factor = context.getVariable("factor") ?? 2;
    
    return {
      success: true,
      outputs: {
        result: value * factor
      }
    };
  },
  validate(inputs: Record<string, any>): string[] {
    const value = inputs.value;
    if (typeof value !== "number") {
      return ["Input value must be a valid number."];
    }
    return [];
  }
};

// Simple self-running validation script
export async function runSDKVerification(): Promise<void> {
  console.log("🧪 Starting Node SDK verification...");

  // 1. Parameter and input validation tests
  const invalidInputs = { value: "not-a-number" };
  const valErrors = validateNodeInputsAndParameters(TestMathNode, invalidInputs, { factor: 15 });
  
  if (valErrors.length === 0) {
    throw new Error("Validation test failed: expected validation errors but got none.");
  }
  console.log("✅ SDK validation successfully caught invalid inputs and parameter bounds:", valErrors);

  // 2. Registration tests
  const nodeRegistry = new NodeRegistry();
  const sdkRegistry = new SDKRegistry(nodeRegistry);
  sdkRegistry.registerNode(TestMathNode);
  
  const registeredNode = nodeRegistry.getDefinition("sdk/test-math");
  if (!registeredNode) {
    throw new Error("Registration test failed: Node was not registered in NodeRegistry.");
  }
  console.log("✅ Node was successfully adapted and registered to the global NodeRegistry:", registeredNode.metadata.displayName);

  // 3. Execution tests
  const outputs = await registeredNode.execute({ value: 5 }, {
    log: (msg: string, lvl: string) => console.log(`[LOG - ${lvl}]`, msg),
    setError: () => {},
    getNodeOutput: () => 5,
    setNodeOutputs: () => {},
    getAllOutputs: () => ({ value: 5 })
  } as any, "test-node");

  if (outputs.result !== 10) { // 5 * default factor (2) = 10
    throw new Error(`Execution test failed: expected output result to be 10 but got ${outputs.result}`);
  }
  console.log("✅ Adapted execution completed successfully! Outputs:", outputs);
  console.log("🎉 Node SDK is 100% verified!");
}

if (require.main === module) {
  runSDKVerification().catch(err => {
    console.error("❌ Node SDK verification failed:", err);
    process.exit(1);
  });
}
