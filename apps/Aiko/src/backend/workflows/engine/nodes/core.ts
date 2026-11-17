import { NodeRegistry, NodeDefinition } from "../registry/index.js";
import { MemoryStore } from "../memory/index.js";
import { FloatNumber } from "./math.js";

// 1. Primitive Node
export const PrimitiveNode: NodeDefinition = {
  metadata: {
    type: "core/primitive",
    category: "core",
    displayName: "Primitive",
    description: "Outputs a configured primitive value (String, Number, or Boolean)"
  },
  inputs: {
    value: { type: "any", label: "Value", defaultValue: 2 },
    valueType: { type: "string", label: "Value Type", defaultValue: "Number" }
  },
  outputs: {
    result: { type: "any", label: "Result" }
  },
  async execute(inputs, memory, nodeId) {
    const type = String(inputs.valueType ?? "Number").toLowerCase();
    const rawValue = inputs.value !== undefined ? inputs.value : 2;
    
    let value: any;
    if (type === "number" || type === "integer" || type === "int" || type === "float") {
      const parsed = parseFloat(String(rawValue));
      value = isNaN(parsed) ? 0 : parsed;
    } else if (type === "boolean" || type === "bool") {
      value = rawValue === true || String(rawValue).toLowerCase() === "true";
    } else {
      value = String(rawValue);
    }
    return { result: value };
  }
};

// 8. Object Node
export const ObjectNode: NodeDefinition = {
  metadata: {
    type: "core/object",
    category: "core",
    displayName: "Object Node",
    description: "Consolidates multiple KV pairs into an Object"
  },
  inputs: {
    kvs: { type: "kv", label: "KV Pairs" }
  },
  outputs: {
    result: { type: "object", label: "Object Result" }
  },
  async execute(inputs) {
    const obj: Record<string, any> = {};
    const kvs = Array.isArray(inputs.kvs) ? inputs.kvs : (inputs.kvs ? [inputs.kvs] : []);
    
    kvs.forEach(pair => {
      if (pair && typeof pair === "object") {
        if (pair.key !== undefined) {
          obj[String(pair.key)] = pair.value;
        } else {
          Object.assign(obj, pair);
        }
      }
    });
    return { result: obj };
  }
};

// Landmark Node
export const LandmarkNode: NodeDefinition = {
  metadata: {
    type: "core/landmark",
    category: "core",
    displayName: "Landmark Pin",
    description: "Marks a physical canvas coordinate. Binds to a hotkey number (1-9) to allow instant camera panning."
  },
  inputs: {},
  outputs: {},
  async execute() {
    return {};
  }
};

export function registerCoreNodes(registry: NodeRegistry) {
  registry.register(PrimitiveNode, true);
  registry.register(ObjectNode, true);
  registry.register(LandmarkNode, true);
}
