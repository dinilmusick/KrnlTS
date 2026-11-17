import { NodeRegistry, NodeDefinition } from "../registry/index.js";

// 2. Switch Node
export const SwitchNode: NodeDefinition = {
  metadata: {
    type: "logic/switch",
    category: "flow",
    displayName: "Switch Multi-Router",
    description: "Routes the input payload to a specific output matching the active route index"
  },
  inputs: {
    payload: { type: "any", label: "Value to Route (Payload)" },
    index: { type: "number", label: "Active Output Index (Number)", defaultValue: 0 }
  },
  outputs: {
    output_0: { type: "any", label: "Output 0" },
    output_1: { type: "any", label: "Output 1" },
    output_2: { type: "any", label: "Output 2" },
    output_3: { type: "any", label: "Output 3" },
    output_4: { type: "any", label: "Output 4" },
    output_5: { type: "any", label: "Output 5" },
    output_6: { type: "any", label: "Output 6" },
    output_7: { type: "any", label: "Output 7" },
    output_8: { type: "any", label: "Output 8" },
    output_9: { type: "any", label: "Output 9" }
  },
  async execute(inputs) {
    const payload = inputs.payload;
    const activeIndex = Number(inputs.index ?? 0);
    const result: Record<string, any> = {
      activeIndex
    };
    for (let i = 0; i < 10; i++) {
        result[`output_${i}`] = activeIndex === i ? payload : null;
    }
    return result;
  }
};

// 4. Split Node
export const SplitNode: NodeDefinition = {
  metadata: {
    type: "logic/split",
    category: "json",
    displayName: "Split Object",
    description: "Splits an object into keys and values lists"
  },
  inputs: {
    inputObject: { type: "object", label: "Object to Split" }
  },
  outputs: {
    keys: { type: "array", label: "Keys List" },
    values: { type: "array", label: "Values List" }
  },
  async execute(inputs) {
    const obj = inputs.inputObject;
    if (obj && typeof obj === "object") {
      return {
        keys: Object.keys(obj),
        values: Object.values(obj)
      };
    }
    return { keys: [], values: [] };
  }
};

// 5. Loop Node
export const LoopNode: NodeDefinition = {
  metadata: {
    type: "logic/loop",
    category: "flow",
    displayName: "Loop Iterator",
    description: "Iterates through an array and outputs details"
  },
  inputs: {
    items: { type: "array", label: "Items Array", defaultValue: [] }
  },
  outputs: {
    item: { type: "any", label: "Current Item" },
    index: { type: "number", label: "Current Index" },
    length: { type: "number", label: "Length" }
  },
  async execute(inputs) {
    const items = Array.isArray(inputs.items) ? inputs.items : [];
    return {
      items, // Pass the array through so scheduler can retrieve it
      length: items.length,
      item: items.length > 0 ? items[0] : null,
      index: items.length > 0 ? 0 : -1
    };
  }
};

// 6. Gate Node
export const GateNode: NodeDefinition = {
  metadata: {
    type: "logic/gate",
    category: "flow",
    displayName: "Gate",
    description: "Passes or blocks the input value based on whether the gate is open"
  },
  inputs: {
    input: { type: "any", label: "Input Value" },
    open: { type: "boolean", label: "Gate Open?", defaultValue: true }
  },
  outputs: {
    result: { type: "any", label: "Result" }
  },
  async execute(inputs) {
    const isOpen = Boolean(inputs.open);
    return { result: isOpen ? inputs.input : null };
  }
};

export function registerLogicNodes(registry: NodeRegistry) {
  registry.register(SwitchNode, true);
  registry.register(SplitNode, true);
  registry.register(LoopNode, true);
  registry.register(GateNode, true);
}
