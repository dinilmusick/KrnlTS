import {
  telemetry
} from "./chunk-AHWZBXWV.js";

// src/krnl/core/K_LIB_Krnl_System_Base_Functionality_APIs.ts
import { zodToJsonSchema } from "zod-to-json-schema";
function heartbeatApi(entity) {
  return () => ({
    name: entity.entityName,
    type: entity.systemType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function telemetryApi(entity) {
  return () => {
    const summary = telemetry.getSummary();
    return {
      entityName: entity.entityName,
      systemType: entity.systemType,
      flags: entity.getSystemFlags(),
      owner: entity.hierarchyManager.getOwnerEntity()?.entityName || null,
      ownedEntities: entity.hierarchyManager.getAllOwnedComponentEntities().map((e) => e.entityName),
      activeRoutes: entity.commComponent.listRoutes(),
      uptime: typeof process !== "undefined" && process.uptime ? process.uptime() : null,
      performance: summary.metrics || summary,
      callLogs: summary.callLogs,
      libraryUsage: summary.libraryUsage,
      dataUsage: summary.dataUsage
    };
  };
}
function adminCommandApi(entity) {
  return async ({ command, args }) => {
    console.log(`[${entity.entityName}] Admin command: ${command}`, args);
    if (command === "set-discoverable") {
      return {
        status: "acknowledged",
        command,
        flags: entity.setDiscoverable(Boolean(args?.value))
      };
    }
    if (command === "reserve") {
      return {
        status: "acknowledged",
        command,
        flags: entity.reserveFor(args?.serviceName || "unknown")
      };
    }
    if (command === "release-reservation") {
      return {
        status: "acknowledged",
        command,
        flags: entity.releaseReservation(args?.serviceName || null)
      };
    }
    if (command === "shutdown") {
      console.log(`[${entity.entityName}] Graceful shutdown initiated via admin command.`);
      setTimeout(() => {
        entity.dispose();
        process.exit(0);
      }, 500);
      return {
        status: "acknowledged",
        command,
        message: "System will shutdown in 500ms"
      };
    }
    return { status: "acknowledged", command, flags: entity.getSystemFlags() };
  };
}
function discoverPeersApi(entity) {
  return ({ includeBusy = true } = {}) => {
    const peers = entity.listPeers();
    if (includeBusy) return peers;
    return peers.filter((peer) => !peer.busy);
  };
}
function getManifestApi(entity) {
  return () => entity.getManifest();
}
function getLastActionDocsApi(entity) {
  return () => {
    return {
      preemptiveDocumentation: entity._lastPreemptiveDoc || null,
      errorDocumentation: entity._lastErrorDoc || null
    };
  };
}
function getFullDocumentationApi(entity) {
  return () => {
    if (entity._documentationProvider && typeof entity._documentationProvider.getDocsForLayer === "function") {
      return entity._documentationProvider.getDocsForLayer("LAYER_1_ENTRY") || [];
    }
    return [];
  };
}
function systemCommandsCollectorHandler(entity) {
  return (msg) => {
    console.log(`[${entity.entityName}] system-commands received:`, JSON.stringify(msg.data));
  };
}
function getUsedPortsApi(entity) {
  return () => {
    const registry = entity.getRegisteredPorts();
    return {
      entity: entity.entityName,
      ports: Object.values(registry),
      registry
    };
  };
}
function findFreePortsApi(entity) {
  return async ({
    count = 1,
    rangeStart = 3e3,
    rangeEnd = 65535
  }) => {
    if (count < 1) throw new Error("count must be \u2265 1");
    if (rangeStart < 1 || rangeEnd > 65535 || rangeStart > rangeEnd) {
      throw new Error("Invalid port range: 1 \u2264 rangeStart \u2264 rangeEnd \u2264 65535");
    }
    const usedSet = new Set(
      Object.values(entity.getRegisteredPorts())
    );
    const usedByPeer = {
      [entity.entityName]: Array.from(usedSet)
    };
    const peers = entity.listPeers();
    await Promise.allSettled(
      peers.map(async (peer) => {
        try {
          const remote = entity.getRemoteEntity(peer.id);
          if (!remote) return;
          const result = await remote.call("getUsedPorts", {});
          const payload = result?.payload ?? result;
          const peerPorts = Array.isArray(payload?.ports) ? payload.ports : [];
          usedByPeer[peer.id] = peerPorts;
          peerPorts.forEach((p) => usedSet.add(p));
        } catch (_) {
        }
      })
    );
    const freePorts = [];
    for (let p = rangeStart; p <= rangeEnd && freePorts.length < count; p++) {
      if (!usedSet.has(p)) freePorts.push(p);
    }
    if (freePorts.length < count) {
      throw new Error(
        `Only ${freePorts.length} free port(s) available in [${rangeStart}, ${rangeEnd}]; requested ${count}.`
      );
    }
    return { freePorts, queriedPeers: peers.length, totalUsedCount: usedSet.size, usedByPeer };
  };
}
function shutdownApi(entity) {
  return ({ timeoutMs = 1e4 } = {}) => {
    setTimeout(() => {
      entity.gracefulShutdown({ timeoutMs }).catch((err) => {
        console.error(`[${entity.entityName}] gracefulShutdown error:`, err?.message ?? err);
        process.exit(1);
      });
    }, 200);
    return {
      status: "acknowledged",
      message: `Graceful shutdown initiated for '${entity.entityName}' and all owned microservices.`,
      entity: entity.entityName,
      timeoutMs
    };
  };
}
function getIngressNetworkTopologyApi(entity) {
  return () => {
    if (!entity._ingressNetwork) return null;
    return entity.getIngressNetworkTopology();
  };
}
function registerAppApi(entity) {
  return ({ name, port, pid }) => {
    if (!entity._registryApps) {
      entity._registryApps = /* @__PURE__ */ new Map();
    }
    entity._registryApps.set(name, {
      name,
      port,
      pid,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastHeartbeat: Date.now()
    });
    console.log(`[Registry] Registered app "${name}" on port ${port} (PID ${pid})`);
    return { success: true };
  };
}
function deregisterAppApi(entity) {
  return ({ name }) => {
    if (entity._registryApps) {
      const deleted = entity._registryApps.delete(name);
      if (deleted) {
        console.log(`[Registry] Deregistered app "${name}"`);
      }
    }
    return { success: true };
  };
}
function heartbeatAppApi(entity) {
  return ({ name }) => {
    if (entity._registryApps && entity._registryApps.has(name)) {
      const app = entity._registryApps.get(name);
      app.lastHeartbeat = Date.now();
      return { success: true };
    }
    return { success: false, error: `App "${name}" not registered` };
  };
}
function lookupAppApi(entity) {
  return ({ name }) => {
    if (entity._registryApps && entity._registryApps.has(name)) {
      const app = entity._registryApps.get(name);
      return {
        name: app.name,
        port: app.port,
        pid: app.pid,
        registeredAt: app.registeredAt
      };
    }
    return { error: `App "${name}" not found` };
  };
}
function listAppsApi(entity) {
  return () => {
    if (!entity._registryApps) return [];
    return Array.from(entity._registryApps.values()).map((app) => ({
      name: app.name,
      port: app.port,
      pid: app.pid,
      registeredAt: app.registeredAt
    }));
  };
}
function buildEndpointDefinition(fn, entity, runtimeOverride = null, memory = "") {
  const isSystem = entity._krnlSystemEndpointIds?.has(fn.id) || fn.id === "getEndpointDefinitions" || fn.id === "setEndpointDefinition" || fn.id === "getTelemetryLog";
  let inputSchema = {};
  let outputSchema = {};
  if (fn.schema) {
    if (fn.schema.input) {
      try {
        inputSchema = zodToJsonSchema(fn.schema.input);
      } catch (e) {
        inputSchema = { type: "object" };
      }
    }
    if (fn.schema.output) {
      try {
        outputSchema = zodToJsonSchema(fn.schema.output);
      } catch (e) {
        outputSchema = { type: "object" };
      }
    }
  }
  const defaultSpec = {
    reasoning: 3,
    planning: 1,
    toolUsage: 1,
    structuredOutput: 5,
    jsonStrictness: 5,
    coding: 1,
    extraction: 3,
    classification: 3,
    summarization: 3,
    creativity: 3,
    determinism: 5,
    context: 3,
    vision: 1,
    multimodal: 1,
    outputComplexity: 3
  };
  const codeSpec = fn.ai?.intelligenceSpec || fn.intelligenceSpec || defaultSpec;
  const mergedSpec = runtimeOverride?.intelligenceSpec || codeSpec;
  const emittersList = [];
  if (fn.emitters) {
    fn.emitters.forEach((_, eid) => {
      emittersList.push(`${fn.id}:${eid}`);
    });
  }
  return {
    id: fn.id,
    category: isSystem ? "krnl_system" : "app",
    method: fn.method || "POST",
    visibility: fn.visibility || "public",
    inputSchema,
    outputSchema,
    description: runtimeOverride?.description || fn.description || `Execute ${fn.id}`,
    systemInstructions: runtimeOverride?.systemInstructions || fn.ai?.systemInstructions || "",
    examples: runtimeOverride?.examples || fn.examples || [],
    examplePayload: runtimeOverride?.examplePayload || fn.example || null,
    intelligenceSpec: mergedSpec,
    agentTools: runtimeOverride?.agentTools || fn.ai?.agentTools || [],
    retryConfig: runtimeOverride?.retryConfig || fn.ai?.retryConfig || { maxRetries: 4, timeoutMs: 12e3, retryDelayMs: 500, backoffStrategy: "LINEAR" },
    staticWatchVars: runtimeOverride?.staticWatchVars || fn.ai?.staticWatchVars || [],
    dynamicWatchVars: runtimeOverride?.dynamicWatchVars || fn.ai?.dynamicWatchVars || [],
    accessPolicy: fn.accessPolicy || null,
    emitters: emittersList,
    sourcePath: fn.sourcePath || null,
    memory: memory || "",
    runtimeEdited: !!runtimeOverride
  };
}
function getEndpointDefinitionsApi(entity) {
  return async () => {
    const list = [];
    const store = entity._aiProfilesStore;
    const overrides = store ? await store.getAllEndpointDefinitions() : {};
    const seen = /* @__PURE__ */ new Set();
    const processF = async (fn) => {
      if (seen.has(fn.id)) return;
      seen.add(fn.id);
      const override = overrides[fn.id] || null;
      const mem = store ? await store.getEndpointMemory(fn.id) : "";
      list.push(buildEndpointDefinition(fn, entity, override, mem));
    };
    if (entity.localFunctionalities) {
      for (const fn of entity.localFunctionalities.values()) {
        await processF(fn);
      }
    }
    if (entity.remoteFunctionalities) {
      for (const fn of entity.remoteFunctionalities.values()) {
        await processF(fn);
      }
    }
    return list;
  };
}
function setEndpointDefinitionApi(entity) {
  return async ({ id, override }) => {
    const store = entity._aiProfilesStore;
    if (!store) {
      throw new Error("Runtime Store not initialized.");
    }
    const current = await store.getEndpointDefinition(id) || {};
    const updated = { ...current, ...override };
    await store.setEndpointDefinition(id, updated);
    if (typeof entity.initializeAiLayer === "function") {
      await entity.initializeAiLayer(entity._entityDataDir);
    }
    const fn = entity.localFunctionalities.get(id) || entity.remoteFunctionalities.get(id);
    if (!fn) {
      throw new Error(`Endpoint ${id} not found.`);
    }
    const mem = await store.getEndpointMemory(id);
    return buildEndpointDefinition(fn, entity, updated, mem);
  };
}
function getTelemetryLogApi(entity) {
  return async ({ limit } = {}) => {
    const store = entity._aiProfilesStore;
    if (!store) return [];
    return await store.getTelemetryLog(limit);
  };
}
function getAikoCatalogApi(entity) {
  return async () => {
    if (!entity._aikoClient) {
      throw new Error("Aiko client not initialized.");
    }
    try {
      entity._aikoCatalog = await entity._aikoClient.fetchCatalog();
      return { status: "success", catalog: entity._aikoCatalog };
    } catch (e) {
      return { status: "error", message: `Failed to fetch catalog: ${e.message}`, catalog: entity._aikoCatalog };
    }
  };
}
function aiOrchestrationApi(entity) {
  return async ({ message }) => {
    if (!entity._aiOrchestrator) {
      const { KrnlAikoClient } = await import("./K_LIB_Krnl_Aiko_Client-DTTGY3UU.js");
      throw new Error(KrnlAikoClient.getNotRunningMessage());
    }
    try {
      return await entity._aiOrchestrator.handle(message);
    } catch (e) {
      return { status: "error", message: e.message };
    }
  };
}

export {
  heartbeatApi,
  telemetryApi,
  adminCommandApi,
  discoverPeersApi,
  getManifestApi,
  getLastActionDocsApi,
  getFullDocumentationApi,
  systemCommandsCollectorHandler,
  getUsedPortsApi,
  findFreePortsApi,
  shutdownApi,
  getIngressNetworkTopologyApi,
  registerAppApi,
  deregisterAppApi,
  heartbeatAppApi,
  lookupAppApi,
  listAppsApi,
  buildEndpointDefinition,
  getEndpointDefinitionsApi,
  setEndpointDefinitionApi,
  getTelemetryLogApi,
  getAikoCatalogApi,
  aiOrchestrationApi
};
