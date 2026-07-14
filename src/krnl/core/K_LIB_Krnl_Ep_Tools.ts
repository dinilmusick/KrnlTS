export const KrnlEpTools = {
  calculator: {
    id: "calculator",
    description: "Evaluates standard numeric/arithmetic mathematical expressions securely.",
    execute: (expression: string): number => {
      // Safe evaluation of simple arithmetic using Function
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
      try {
        const result = new Function(`return (${sanitized});`)();
        if (typeof result === "number") return result;
        throw new Error("Result is not a number");
      } catch (e: any) {
        throw new Error(`Math evaluation failed: ${e.message}`);
      }
    }
  },

  jsonCreator: {
    id: "jsonCreator",
    description: "Validates, formats, and creates/merges JSON payloads.",
    execute: (jsonStr: string, mergeWith?: any): any => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (mergeWith && typeof mergeWith === "object") {
          return { ...mergeWith, ...parsed };
        }
        return parsed;
      } catch (e: any) {
        throw new Error(`JSON validation/parsing failed: ${e.message}`);
      }
    }
  },

  textFormatter: {
    id: "textFormatter",
    description: "Formats text templates by interpolating variable values.",
    execute: (template: string, variables: Record<string, any>): string => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value));
      }
      return result;
    }
  },

  endpointCaller: {
    id: "endpointCaller",
    description: "Allows an endpoint agent to call other endpoints within the same system.",
    execute: async (system: any, endpointId: string, payload: any): Promise<any> => {
      if (!system || typeof system.call !== "function") {
        throw new Error("System host entity not available or invalid.");
      }
      return await system.call(endpointId, payload, { unwrap: true });
    }
  },

  healthChecker: {
    id: "healthChecker",
    description: "Queries the heartbeat status of a sibling system or component.",
    execute: async (system: any, peerId: string): Promise<any> => {
      if (!system) throw new Error("System host entity not available.");
      const peer = system.getRemoteEntity ? system.getRemoteEntity(peerId) : null;
      if (peer) {
        return await peer.call("heartbeat", {});
      }
      // Try local call if peer is unregistered but exists locally
      if (system.localFunctionalities?.has("heartbeat")) {
        return await system.call("heartbeat", {});
      }
      throw new Error(`Peer or heartbeat endpoint not found for: ${peerId}`);
    }
  }
};
