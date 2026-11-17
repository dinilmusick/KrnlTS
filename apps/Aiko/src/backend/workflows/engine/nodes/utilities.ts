import { NodeRegistry, NodeDefinition } from "../registry/index.js";

// 1. Delay Node
export const DelayNode: NodeDefinition = {
  metadata: {
    type: "utilities/delay",
    category: "utilities",
    displayName: "Delay Timeout",
    description: "Pauses graph execution for a specified number of milliseconds"
  },
  inputs: {
    milliseconds: { type: "number", label: "Pause duration (ms)", defaultValue: 1000 }
  },
  outputs: {
    slept: { type: "number", label: "Actual Slept Duration (ms)" }
  },
  async execute(inputs, memory, nodeId) {
    const ms = Number(inputs.milliseconds ?? 1000);
    memory.log(`[Delay] Sleeping execution flow for ${ms}ms...`, "warn", nodeId);
    await new Promise(resolve => setTimeout(resolve, ms));
    memory.log(`[Delay] Slept complete. Resuming...`, "success", nodeId);
    return { slept: ms };
  }
};

// 2. Timer Node
export const TimerNode: NodeDefinition = {
  metadata: {
    type: "utilities/timer",
    category: "utilities",
    displayName: "Execution Timer",
    description: "Measures and outputs current timestamp and standard ISO date details"
  },
  inputs: {},
  outputs: {
    timestamp: { type: "number", label: "Epoch Unix Timestamp (ms)" },
    isoString: { type: "string", label: "ISO 8601 String" },
    year: { type: "number", label: "Year" }
  },
  async execute(inputs) {
    const now = new Date();
    return {
      timestamp: now.getTime(),
      isoString: now.toISOString(),
      year: now.getFullYear()
    };
  }
};

export function registerUtilitiesNodes(registry: NodeRegistry) {
  registry.register(DelayNode, true);
  registry.register(TimerNode, true);
}
