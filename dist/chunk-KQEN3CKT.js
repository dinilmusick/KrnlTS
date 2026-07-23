// src/krnl/core/K_LIB_Krnl_Telemetry.ts
var KrnlTelemetry = class {
  metrics;
  callLogs;
  libraryUsage;
  dataUsage;
  enabled;
  ringBufferSize;
  aiTraces;
  totalAiCalls;
  totalAiRetries;
  avgAiLatencyMs;
  constructor() {
    this.metrics = /* @__PURE__ */ new Map();
    this.callLogs = /* @__PURE__ */ new Map();
    this.libraryUsage = /* @__PURE__ */ new Map();
    this.dataUsage = /* @__PURE__ */ new Map();
    this.enabled = false;
    this.ringBufferSize = 100;
    this.aiTraces = [];
    this.totalAiCalls = 0;
    this.totalAiRetries = 0;
    this.avgAiLatencyMs = 0;
  }
  recordAiTrace(trace) {
    if (this.aiTraces.length >= this.ringBufferSize) {
      this.aiTraces.shift();
    }
    this.aiTraces.push(trace);
    this.totalAiCalls++;
    this.totalAiRetries += trace.retryCount || 0;
    this.avgAiLatencyMs = (this.avgAiLatencyMs * (this.totalAiCalls - 1) + trace.latencyMs) / this.totalAiCalls;
  }
  /**
   * Starts a telemetry trace for a specific functionality.
   * @param fid 
   * @returns Trace data
   */
  startTrace(fid) {
    return {
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage ? process.memoryUsage().heapUsed : 0
    };
  }
  /**
   * Ends a telemetry trace and updates aggregated metrics.
   * @param fid 
   * @param trace 
   */
  endTrace(fid, trace, success = true) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const latencyNs = Number(endTime - trace.startTime);
    const memoryDelta = endMemory - trace.startMemory;
    const latencyMs = latencyNs / 1e6;
    let stats = this.metrics.get(fid);
    if (!stats) {
      stats = {
        calls: 0,
        errors: 0,
        totalLatencyNs: 0,
        avgLatencyMs: 0,
        peakLatencyMs: 0,
        totalMemoryDelta: 0,
        avgMemoryDelta: 0,
        lastUpdated: 0
      };
      this.metrics.set(fid, stats);
    }
    stats.calls++;
    if (!success) stats.errors++;
    stats.totalLatencyNs += latencyNs;
    stats.totalMemoryDelta += memoryDelta;
    stats.avgLatencyMs = stats.totalLatencyNs / stats.calls / 1e6;
    stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
    if (latencyMs > stats.peakLatencyMs) stats.peakLatencyMs = latencyMs;
    stats.lastUpdated = Date.now();
    if (this.enabled) {
      let logs = this.callLogs.get(fid);
      if (!logs) {
        logs = [];
        this.callLogs.set(fid, logs);
      }
      logs.push({
        timestamp: Date.now(),
        durationMs: latencyMs,
        success
      });
      if (logs.length > this.ringBufferSize) {
        logs.shift();
      }
    }
  }
  /**
   * Record library usage (functions/helpers).
   */
  recordLibraryCall(libraryId, durationMs) {
    if (!this.enabled) return;
    let stats = this.libraryUsage.get(libraryId);
    if (!stats) {
      stats = { calls: 0, totalDurationMs: 0, avgDurationMs: 0 };
      this.libraryUsage.set(libraryId, stats);
    }
    stats.calls++;
    stats.totalDurationMs += durationMs;
    stats.avgDurationMs = stats.totalDurationMs / stats.calls;
  }
  /**
   * Record library data access.
   */
  recordDataAccess(dataKey, type = "read") {
    if (!this.enabled) return;
    let stats = this.dataUsage.get(dataKey);
    if (!stats) {
      stats = { reads: 0, writes: 0 };
      this.dataUsage.set(dataKey, stats);
    }
    if (type === "read") stats.reads++;
    else stats.writes++;
  }
  /**
   * Returns a snapshot of all metrics.
   */
  getSummary() {
    return {
      metrics: Object.fromEntries(this.metrics),
      callLogs: Object.fromEntries(this.callLogs),
      libraryUsage: Object.fromEntries(this.libraryUsage),
      dataUsage: Object.fromEntries(this.dataUsage)
    };
  }
  /**
   * Clears all collected metrics.
   */
  reset() {
    this.metrics.clear();
    this.callLogs.clear();
    this.libraryUsage.clear();
    this.dataUsage.clear();
  }
};
var telemetry = new KrnlTelemetry();

// src/krnl/core/K_LIB_Krnl_System_Base_Functionality_APIs.ts
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

export {
  KrnlTelemetry,
  telemetry,
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
  listAppsApi
};
