import { NodeRegistry, NodeDefinition } from "../registry/index.js";

// 1. Create Array Node
export const CreateArrayNode: NodeDefinition = {
  metadata: {
    type: "collections/array",
    category: "collections",
    displayName: "Create Array",
    description: "Constructs an array out of connected inputs (primitives only)"
  },
  inputs: {
    item: { type: "any", label: "Item" }
  },
  outputs: {
    result: { type: "array", label: "Array Result" }
  },
  async execute(inputs) {
    const itemInput = inputs.item;
    let items = Array.isArray(itemInput) ? itemInput : (itemInput !== undefined && itemInput !== null ? [itemInput] : []);
    return { result: items };
  }
};

// 4. Filter Array Node
export const FilterListNode: NodeDefinition = {
  metadata: {
    type: "collections/filter",
    category: "collections",
    displayName: "Filter Array",
    description: "Filters items in an array based on equality check"
  },
  inputs: {
    array: { type: "array", label: "Source Array", defaultValue: [] },
    property: { type: "string", label: "Property Key", defaultValue: "status" },
    value: { type: "any", label: "Target Value", defaultValue: "active" }
  },
  outputs: {
    result: { type: "array", label: "Filtered Array" }
  },
  async execute(inputs) {
    const arr = Array.isArray(inputs.array) ? inputs.array : [];
    const prop = String(inputs.property ?? "");
    const target = inputs.value;
    
    if (!prop) return { result: arr };
    
    const result = arr.filter(item => {
      if (item && typeof item === "object") {
        return String(item[prop]) === String(target);
      }
      return String(item) === String(target);
    });
    return { result };
  }
};

// 6. Create Object from KV Pairs Node
export const CreateObjectFromKVNode: NodeDefinition = {
  metadata: {
    type: "collections/object-from-kv",
    category: "collections",
    displayName: "Object from KV",
    description: "Constructs a JSON object from multiple connected KV pair nodes"
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

// 7. Create KV Pair Node
export const CreateKVPairNode: NodeDefinition = {
  metadata: {
    type: "collections/kv-pair",
    category: "collections",
    displayName: "Create KV",
    description: "Constructs a Key-Value pair out of connected key and value inputs"
  },
  inputs: {
    key: { type: "any", label: "Key" },
    value: { type: "any", label: "Value" }
  },
  outputs: {
    result: { type: "kv", label: "KV" }
  },
  async execute(inputs) {
    const key = inputs.key !== undefined ? inputs.key : null;
    const value = inputs.value !== undefined ? inputs.value : null;
    return { result: { key, value, __type: "kv" } };
  }
};

// 9. Merge to Array Node
export const MergeArraysNode: NodeDefinition = {
  metadata: {
    type: "collections/merge",
    category: "collections",
    displayName: "Merge to Array",
    description: "Merges multiple arrays and items together into a single array"
  },
  inputs: {
    array: { type: "array", label: "Arrays" },
    item: { type: "any", label: "Items to Add" }
  },
  outputs: {
    result: { type: "array", label: "Merged Array" }
  },
  async execute(inputs) {
    const arraysInput = inputs.array;
    const itemsInput = inputs.item;
    const list: any[] = [];
    
    const arrays = Array.isArray(arraysInput) ? arraysInput : (arraysInput !== undefined && arraysInput !== null ? [arraysInput] : []);
    const itemsToAdd = Array.isArray(itemsInput) ? itemsInput : (itemsInput !== undefined && itemsInput !== null ? [itemsInput] : []);
    
    for (const arr of arrays) {
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (item === null || item === undefined) continue;
        list.push(item);
      }
    }
    for (const item of itemsToAdd) {
      if (item === null || item === undefined) continue;
      list.push(item);
    }
    return { result: list };
  }
};

export function registerCollectionsNodes(registry: NodeRegistry) {
  registry.register(CreateArrayNode, true);
  registry.register(FilterListNode, true);
  registry.register(CreateObjectFromKVNode, true);
  registry.register(CreateKVPairNode, true);
  registry.register(MergeArraysNode, true);
}
