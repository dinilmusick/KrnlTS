import { NodeMetadata, NodeDefinition, NodeRegistry } from "../registry/index.js";
import { MemoryStore } from "../memory/index.js";

export const PRESET_NODES: Record<string, { metadata: NodeMetadata; inputs: any; outputs: any }> = {
  "core/constant": {
    metadata: {
      type: "core/constant",
      category: "core",
      displayName: "Primitive",
      description: "Outputs a configured primitive value (String, Number, or Boolean)",
      defaultCode: `// Returns configured primitive value\nreturn 2;`
    },
    inputs: {
      value: { type: "any", label: "Value", defaultValue: 2 },
      valueType: { type: "string", label: "Value Type", defaultValue: "Number" }
    },
    outputs: {
      result: { type: "any", label: "Result" }
    }
  },
  "core/object": {
    metadata: {
      type: "core/object",
      category: "core",
      displayName: "Object Node",
      description: "Consolidates multiple KV pairs into an Object",
      defaultCode: `// Constructs an object from connected KV pairs
const obj = {};
const kvs = inputs.kvs;
if (Array.isArray(kvs)) {
  kvs.forEach(pair => {
    if (pair && typeof pair === "object" && pair.key !== undefined) {
      obj[pair.key] = pair.value;
    }
  });
} else if (kvs && typeof kvs === "object" && kvs.key !== undefined) {
  obj[kvs.key] = kvs.value;
}
return obj;`
    },
    inputs: {
      kvs: { type: "kv", label: "KV Pairs" }
    },
    outputs: {
      result: { type: "object", label: "Object Result" }
    }
  },
  "collections/object-from-kv": {
    metadata: {
      type: "collections/object-from-kv",
      category: "collections",
      displayName: "Object from KV",
      description: "Constructs a JSON object from multiple connected KV pair nodes",
      defaultCode: `// Constructs an object from connected KV pairs
const obj = {};
const kvs = inputs.kvs;
if (Array.isArray(kvs)) {
  kvs.forEach(pair => {
    if (pair && typeof pair === "object" && pair.key !== undefined) {
      obj[pair.key] = pair.value;
    }
  });
}
return obj;`
    },
    inputs: {
      kvs: { type: "kv", label: "KV Pairs" }
    },
    outputs: {
      result: { type: "object", label: "Object Result" }
    }
  },
  "math/add": {
    metadata: {
      type: "math/add",
      category: "math",
      displayName: "Add",
      description: "Adds connected inputs together",
      defaultCode: `// Adds connected variables\nreturn 0;`
    },
    inputs: {
      addend: { type: "number", label: "Addend", defaultValue: 0 }
    },
    outputs: {
      result: { type: "number", label: "Result" }
    }
  },
  "math/subtract": {
    metadata: {
      type: "math/subtract",
      category: "math",
      displayName: "Subtract",
      description: "Subtracts the second input from the first input",
      defaultCode: `// Subtracts connected variables\nconst a = 0;\nconst b = 0;\nreturn a - b;`
    },
    inputs: {
      minuend: { type: "number", label: "Minuend", defaultValue: 0 },
      subtrahend: { type: "number", label: "Subtrahend", defaultValue: 0 }
    },
    outputs: {
      result: { type: "number", label: "Result" }
    }
  },
  "math/multiply": {
    metadata: {
      type: "math/multiply",
      category: "math",
      displayName: "Multiply",
      description: "Multiplies connected inputs",
      defaultCode: `// Multiplies connected variables\nreturn 1;`
    },
    inputs: {
      factor: { type: "number", label: "Factor", defaultValue: 1 }
    },
    outputs: {
      result: { type: "number", label: "Result" }
    }
  },
  "math/divide": {
    metadata: {
      type: "math/divide",
      category: "math",
      displayName: "Divide",
      description: "Divides the first input by the second input",
      defaultCode: `// Divides first variable by second variable\nconst a = 0;\nconst b = 1;\nif (b === 0) throw new Error("Division by zero!");\nreturn a / b;`
    },
    inputs: {
      dividend: { type: "number", label: "Dividend", defaultValue: 0 },
      divisor: { type: "number", label: "Divisor", defaultValue: 1 }
    },
    outputs: {
      result: { type: "number", label: "Result" }
    }
  },
  "logic/gate": {
    metadata: {
      type: "logic/gate",
      category: "logic",
      displayName: "Gate",
      description: "Passes or blocks the input value based on whether the gate is open",
      defaultCode: `// Passes or blocks the input value based on whether the gate is open\nconst isOpen = inputs.open !== undefined ? Boolean(inputs.open) : true;\nreturn {\n  "exec-out-true": isOpen ? "execute" : null,\n  true_data: isOpen ? inputs.input : null,\n  "exec-out-false": !isOpen ? "execute" : null,\n  false_data: !isOpen ? inputs.input : null\n};`
    },
    inputs: {
      "exec-in": { type: "exec", label: "Exec In" },
      input: { type: "any", label: "Input Value" },
      open: { type: "boolean", label: "Gate Open?", defaultValue: true }
    },
    outputs: {
      "exec-out-true": { type: "exec", label: "True Exec" },
      true_data: { type: "any", label: "True Data" },
      "exec-out-false": { type: "exec", label: "False Exec" },
      false_data: { type: "any", label: "False Data" }
    }
  },
  "logic/switch": {
    metadata: {
      type: "logic/switch",
      category: "flow",
      displayName: "Switch Multi-Router",
      description: "Routes the input payload to a specific output matching the active route index",
      defaultCode: `// Switch Node (Multi-Output Router)
// Routes the payload to the output index that matches the active index number
const payload = null;
const activeIndex = 0;
return {
  output_0: activeIndex === 0 ? payload : null,
  output_1: activeIndex === 1 ? payload : null,
  output_2: activeIndex === 2 ? payload : null,
  output_3: activeIndex === 3 ? payload : null,
  output_4: activeIndex === 4 ? payload : null
};`
    },
    inputs: {},
    outputs: {
      output_0: { type: "any", label: "Output 0" },
      output_1: { type: "any", label: "Output 1" },
      output_2: { type: "any", label: "Output 2" },
      output_3: { type: "any", label: "Output 3" },
      output_4: { type: "any", label: "Output 4" }
    }
  },
  "logic/compare": {
    metadata: {
      type: "logic/compare",
      category: "logic",
      displayName: "Compare",
      description: "Compares two inputs and returns a Boolean value",
      defaultCode: `// Compares two variables\nconst a = null;\nconst b = null;\nreturn a === b;`
    },
    inputs: {
      compare_a: { type: "any", label: "First Value (A)" },
      compare_b: { type: "any", label: "Second Value (B)" },
      compare_op: { type: "string", label: "Operator" }
    },
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "logic/and": {
    metadata: {
      type: "logic/and",
      category: "logic",
      displayName: "AND Gate",
      description: "Returns true if all connected inputs are true",
      defaultCode: `// Returns true if all connected variables are truthy\nreturn false;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "logic/or": {
    metadata: {
      type: "logic/or",
      category: "logic",
      displayName: "OR Gate",
      description: "Returns true if any connected input is true",
      defaultCode: `// Returns true if any of the connected variables are truthy\nreturn false;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "logic/nand": {
    metadata: {
      type: "logic/nand",
      category: "logic",
      displayName: "NAND Gate",
      description: "Returns false if all connected inputs are true",
      defaultCode: `// Returns false if all connected variables are truthy\nreturn true;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "logic/nor": {
    metadata: {
      type: "logic/nor",
      category: "logic",
      displayName: "NOR Gate",
      description: "Returns true if none of the connected inputs are true",
      defaultCode: `// Returns true if none of the connected variables are truthy\nreturn true;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "logic/xor": {
    metadata: {
      type: "logic/xor",
      category: "logic",
      displayName: "XOR Gate",
      description: "Returns true if an odd number of connected inputs are true",
      defaultCode: `// Returns true if an odd number of connected variables are truthy (XOR Parity)\nreturn false;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "logic/not": {
    metadata: {
      type: "logic/not",
      category: "logic",
      displayName: "NOT Gate",
      description: "Inverts the input boolean value",
      defaultCode: `// Inverts the input boolean value\nconst value = false;\nreturn !value;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },
  "string/concat": {
    metadata: {
      type: "string/concat",
      category: "string",
      displayName: "String Concat",
      description: "Concatenates multiple string values",
      defaultCode: `// Concatenates connected text variables with a space\nreturn "";`
    },
    inputs: {
      text: { type: "string", label: "Text", defaultValue: "" },
      separator: { type: "string", label: "Separator", defaultValue: " " }
    },
    outputs: {
      result: { type: "string", label: "Result" }
    }
  },
  "string/case_transform": {
    metadata: {
      type: "string/case_transform",
      category: "string",
      displayName: "Case Transform",
      description: "Converts text characters to uppercase or lowercase based on flexible index targeting",
      defaultCode: `// Case Transform Node (Converts text characters to uppercase or lowercase based on flexible index targeting)
const text = "";
const transformMode = "uppercase";
const targetScope = "all";

if (targetScope === "all") {
  return transformMode === "uppercase" ? text.toUpperCase() : text.toLowerCase();
}
return text;`
    },
    inputs: {},
    outputs: {
      result: { type: "string", label: "Result" }
    }
  },
  "string/replace_alphabets": {
    metadata: {
      type: "string/replace_alphabets",
      category: "string",
      displayName: "Replace Alphabets",
      description: "Removes target alphabets based on index targeting and replaces them with a custom string",
      defaultCode: `// Replace Alphabets Node (Removes targeted alphabets and inserts replacement string there)
const text = "";
const replacement = "";
const targetScope = "all";

if (targetScope === "all") {
  return replacement;
}
return text;`
    },
    inputs: {},
    outputs: {
      result: { type: "string", label: "Result" }
    }
  },
  "string/filter": {
    metadata: {
      type: "string/filter",
      category: "string",
      displayName: "Filter Word by Index",
      description: "Extracts a word at a specific index, returning the word, and parts before and after it",
      defaultCode: `// Filter Word Node (Filters a word at an index from a sentence and returns left and right parts)
const text = "";
const index = 0;
return { word: "", before: "", after: "" };`
    },
    inputs: {},
    outputs: {
      word: { type: "string", label: "Filtered Word" },
      before: { type: "string", label: "Part Before" },
      after: { type: "string", label: "Part After" }
    }
  },
  "string/match": {
    metadata: {
      type: "string/match",
      category: "string",
      displayName: "Match Words",
      description: "Checks if a set of words are present in a sentence or group of sentences with OR/AND modes",
      defaultCode: `// Match Words Node (Checks if words are present in sentences using OR/AND modes)
const words = [];
const sentences = [];
const mode = 0; // 0 for OR, 1 for AND
return false;`
    },
    inputs: {},
    outputs: {
      result: { type: "boolean", label: "Result" }
    }
  },

  "collections/array-map": {
    metadata: {
      type: "collections/array-map",
      category: "collections",
      displayName: "Map Array",
      description: "Maps elements of an array using a callback expression",
      defaultCode: `// Maps elements of an incoming list\nconst list = [];\nif (!Array.isArray(list)) return [];\nreturn list.map(item => typeof item === 'number' ? item * 2 : String(item) + "!");`
    },
    inputs: {},
    outputs: {
      result: { type: "array", label: "Result" }
    }
  },
  "parsing/parse-json": {
    metadata: {
      type: "parsing/parse-json",
      category: "json",
      displayName: "Parse JSON",
      description: "Parses a valid JSON string into an Object",
      defaultCode: `// Parses a JSON string\nconst text = "{}";\nreturn JSON.parse(String(text));`
    },
    inputs: {},
    outputs: {
      result: { type: "object", label: "Result" }
    }
  },
  "parsing/stringify": {
    metadata: {
      type: "parsing/stringify",
      category: "json",
      displayName: "Stringify JSON",
      description: "Serializes an object into a JSON string",
      defaultCode: `// Serializes variable into a JSON string\nconst obj = "";\nreturn JSON.stringify(obj, null, 2);`
    },
    inputs: {},
    outputs: {
      result: { type: "string", label: "Result" }
    }
  },
  "utilities/logger": {
    metadata: {
      type: "utilities/logger",
      category: "utilities",
      displayName: "Logger Console",
      description: "Logs the value in the workflow engine terminal console",
      defaultCode: `// Print items directly to execution terminal logs
const val = typeof inputs.value !== "undefined" ? inputs.value : (typeof inputs.val !== "undefined" ? inputs.val : "No input connected");
console.log("[LOG]:", val);
return val;`
    },
    inputs: {
      value: { type: "any", label: "Value" }
    },
    outputs: {
      result: { type: "any", label: "Result" }
    }
  },
  "utilities/delay": {
    metadata: {
      type: "utilities/delay",
      category: "utilities",
      displayName: "Delay Timeout",
      description: "Pauses workflow for a specified number of milliseconds",
      defaultCode: `// Pauses execution asynchronously in milliseconds\nconst ms = 500;\nconsole.log("Sleeping/Waiting for " + ms + " milliseconds...");\n\nawait new Promise(resolve => setTimeout(resolve, ms));\nreturn "Resumed execution after " + ms + "ms";`
    },
    inputs: {},
    outputs: {
      result: { type: "string", label: "Result" }
    }
  },
  "utilities/current-time": {
    metadata: {
      type: "utilities/current-time",
      category: "utilities",
      displayName: "Current Time",
      description: "Returns the formatted current system time",
      defaultCode: `// Retrieves current timestamp string\nreturn new Date().toLocaleTimeString();`
    },
    inputs: {},
    outputs: {
      result: { type: "string", label: "Result" }
    }
  },
  "custom/js-block": {
    metadata: {
      type: "custom/js-block",
      category: "custom",
      displayName: "Custom JS Block",
      description: "A sandbox node to run any custom JavaScript code snippet",
      defaultCode: `// Write any valid JavaScript here!\n// Connected inputs are directly injected as local variable names!\nreturn "Custom Output Value";`
    },
    inputs: {},
    outputs: {
      result: { type: "any", label: "Result" }
    }
  },
  "variables/get": {
    metadata: {
      type: "variables/get",
      category: "core",
      displayName: "Get Variable",
      description: "Get the value of a global variable",
      defaultCode: `// Get Variable Node\n// Reads from the global variables sandbox object\nreturn variables.globalName || null;`
    },
    inputs: {},
    outputs: {
      result: { type: "any", label: "Result" }
    }
  },
  "variables/set": {
    metadata: {
      type: "variables/set",
      category: "core",
      displayName: "Set Variable",
      description: "Set the value of a global variable",
      defaultCode: `// Set Variable Node\n// Writes a value to the global variables sandbox object\nvariables.globalName = typeof value !== 'undefined' ? value : null;\nreturn variables.globalName;`
    },
    inputs: {
      value: { type: "any", label: "Value" }
    },
    outputs: {
      result: { type: "any", label: "Result" }
    }
  },

  "process/object": {
    metadata: {
      type: "process/object",
      category: "collections",
      displayName: "Get Object Field",
      description: "Processes a specific field inside an object",
      defaultCode: `// Processes a field inside an object\nconst obj = {};\nconst field = "fieldName";\nreturn obj[field];`
    },
    inputs: {},
    outputs: {
      result: { type: "any", label: "Result" }
    }
  },
  "variables/create": {
    metadata: {
      type: "variables/create",
      category: "core",
      displayName: "Create Global Variable",
      description: "Defines a global variable for use in Get and Set nodes",
      defaultCode: `// Create Global Variable Node\n// This node is not executed at runtime.\nreturn null;`
    },
    inputs: {},
    outputs: {}
  },
  "core/exec-start": {
    metadata: {
      type: "core/exec-start",
      category: "core",
      displayName: "Execution Start",
      description: "The initial trigger point for sequential graph execution",
      defaultCode: `// Execution Start Node\nreturn { exec: "start" };`
    },
    inputs: {},
    outputs: {
      exec: { type: "exec", label: "Exec" }
    }
  },
  "core/group": {
    metadata: {
      type: "core/group",
      category: "core",
      displayName: "Node Group",
      description: "A container for a nested graph of nodes",
      defaultCode: `// Group Node execution is handled internally by the engine.`
    },
    inputs: {
      input: { type: "any", label: "Input" }
    },
    outputs: {
      result: { type: "any", label: "Result" }
    }
  }
};

// Auto register them to the NodeRegistry when called
export function registerPresetNodes(registry: NodeRegistry) {
  Object.values(PRESET_NODES).forEach(preset => {
    registry.register({
      metadata: preset.metadata,
      inputs: preset.inputs,
      outputs: preset.outputs,
      execute: async (inputs, memory, nodeId) => {
        // Fallback or legacy execution handler (the main execution logic is in executeNode)
        return { result: null };
      }
    });
  });
}
