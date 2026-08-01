import "./chunk-PNKVD2UK.js";

// src/krnl/core/K_LIB_Krnl_Ep_Tools.ts
var KrnlEpTools = {
  calculator: {
    id: "calculator",
    description: "eval arith-expr(str) \u2192 num. use-when: derive numeric val from schema fields.",
    schema: {
      input: { expression: "str: arith expr. ops: +,-,*,/,(). e.g. '(a+b)*c'" },
      output: "num"
    },
    examples: [
      { input: { expression: "10 + 5 * 2" }, output: 20 },
      { input: { expression: "(100-30)/7" }, output: 10 }
    ],
    execute: (expression) => {
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
      try {
        const result = new Function(`return (${sanitized});`)();
        if (typeof result === "number") return result;
        throw new Error("Result is not a number");
      } catch (e) {
        throw new Error(`Math evaluation failed: ${e.message}`);
      }
    }
  },
  jsonCreator: {
    id: "jsonCreator",
    description: "parse(jsonStr) \u2192 obj | merge(obj,base) \u2192 merged. use-when: validate/build payload.",
    schema: {
      input: { jsonStr: "str: valid JSON", mergeWith: "obj? base to merge into" },
      output: "obj"
    },
    examples: [
      { input: { jsonStr: '{"a":1}' }, output: { a: 1 } },
      { input: { jsonStr: '{"b":2}', mergeWith: { a: 1 } }, output: { a: 1, b: 2 } }
    ],
    execute: (jsonStr, mergeWith) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (mergeWith && typeof mergeWith === "object") {
          return { ...mergeWith, ...parsed };
        }
        return parsed;
      } catch (e) {
        throw new Error(`JSON validation/parsing failed: ${e.message}`);
      }
    }
  },
  textFormatter: {
    id: "textFormatter",
    description: "render(template,vars) \u2192 str. use-when: replace placeholders in templates.",
    schema: {
      input: { template: "str w/ {{key}} placeholders", variables: "obj mapping keys \u2192 values" },
      output: "str"
    },
    examples: [
      { input: { template: "hello {{name}}", variables: { name: "alice" } }, output: "hello alice" }
    ],
    execute: (template, variables) => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value));
      }
      return result;
    }
  },
  endpointCaller: {
    id: "endpointCaller",
    description: "call(endpointId,payload) \u2192 res. use-when: invoke sibling endpoint in same system.",
    schema: {
      input: { endpointId: "str: target endpoint", payload: "obj: input matching target schema" },
      output: "any"
    },
    examples: [
      { input: { endpointId: "StoreKey", payload: { name: "test", value: "val" } }, output: { status: "success" } }
    ],
    execute: async (system, endpointId, payload) => {
      if (!system || typeof system.call !== "function") {
        throw new Error("System host entity not available or invalid.");
      }
      return await system.call(endpointId, payload, { unwrap: true });
    }
  },
  healthChecker: {
    id: "healthChecker",
    description: "ping(peerId) \u2192 status. use-when: verify component/sibling system is alive.",
    schema: {
      input: { peerId: "str: peer system identifier" },
      output: "obj"
    },
    examples: [
      { input: { peerId: "Aiko" }, output: { status: "alive" } }
    ],
    execute: async (system, peerId) => {
      if (!system) throw new Error("System host entity not available.");
      const peer = system.getRemoteEntity ? system.getRemoteEntity(peerId) : null;
      if (peer) {
        return await peer.call("heartbeat", {});
      }
      if (system.localFunctionalities?.has("heartbeat")) {
        return await system.call("heartbeat", {});
      }
      throw new Error(`Peer or heartbeat endpoint not found for: ${peerId}`);
    }
  }
};
export {
  KrnlEpTools
};
