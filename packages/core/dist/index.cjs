"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  EventBus: () => EventBus,
  FunctionalityFacade: () => FunctionalityFacade,
  FunctionalityOrchestration: () => FunctionalityOrchestration,
  HttpProtocolAdapter: () => HttpProtocolAdapter,
  KrnlPackageReconciler: () => KrnlPackageReconciler,
  KrnlQueue: () => KrnlQueue,
  KrnlWorkerPool: () => KrnlWorkerPool,
  LifecycleManager: () => LifecycleManager,
  MemoryTransport: () => MemoryTransport,
  OrchestrationEventFacade: () => OrchestrationEventFacade,
  P2PProtocolAdapter: () => P2PProtocolAdapter,
  ProtocolResolver: () => ProtocolResolver,
  ServiceDiscovery: () => ServiceDiscovery,
  ServiceEventBus: () => ServiceEventBus,
  ServiceFacade: () => ServiceFacade,
  ServiceInstance: () => ServiceInstance,
  ServiceProxy: () => ServiceProxy,
  ServiceRegistry: () => ServiceRegistry,
  ServiceRuntime: () => ServiceRuntime,
  ServiceStateStore: () => ServiceStateStore,
  TelemetryController: () => TelemetryController,
  UdpProtocolAdapter: () => UdpProtocolAdapter,
  WebSocketProtocolAdapter: () => WebSocketProtocolAdapter,
  WorkerExecutionBoundary: () => WorkerExecutionBoundary,
  createEventChannels: () => createEventChannels,
  createService: () => createService,
  createServiceDefinition: () => createServiceDefinition,
  createServiceFacade: () => createServiceFacade,
  createServiceProxy: () => createServiceProxy,
  deltaResources: () => deltaResources,
  gutts: () => gutts,
  sampleResources: () => sampleResources,
  telemetryNow: () => telemetryNow,
  validateOrchestrationDAG: () => validateOrchestrationDAG,
  validateServiceDefinition: () => validateServiceDefinition
});
module.exports = __toCommonJS(index_exports);

// src/state/ServiceStateStore.ts
var ServiceStateStore = class {
  state;
  listeners = /* @__PURE__ */ new Set();
  constructor(initialState) {
    this.state = { ...initialState };
  }
  getState() {
    return Object.freeze({ ...this.state });
  }
  setState(mutation) {
    this.state = { ...this.state, ...mutation };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot, mutation);
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  reset(newState) {
    this.state = { ...newState || {} };
  }
};

// src/lifecycle/LifecycleManager.ts
var TRANSITIONS = {
  uninitialized: ["initializing"],
  initializing: ["ready", "uninitialized"],
  ready: ["starting"],
  starting: ["running", "ready"],
  running: ["stopping"],
  stopping: ["stopped", "running"],
  stopped: ["starting"]
};
var LifecycleManager = class {
  status = "uninitialized";
  getStatus() {
    return this.status;
  }
  canTransitionTo(next) {
    return TRANSITIONS[this.status].includes(next);
  }
  transitionTo(next) {
    if (!this.canTransitionTo(next)) {
      throw new Error("[Lifecycle] Invalid transition '" + this.status + "' -> '" + next + "'.");
    }
    this.status = next;
  }
  setStatus(next) {
    this.transitionTo(next);
  }
  assertRunning(serviceName) {
    if (this.status !== "running") {
      throw new Error(
        "[Service:" + serviceName + "] Cannot invoke operation while status is '" + this.status + "' (expected 'running')."
      );
    }
  }
};

// src/telemetry/TelemetryController.ts
var import_node_crypto = require("crypto");

// src/telemetry/TelemetryResources.ts
var runtimeProcess = typeof globalThis !== "undefined" ? globalThis.process : void 0;
var runtimePerformance = typeof globalThis !== "undefined" ? globalThis.performance : void 0;
function telemetryNow() {
  return runtimePerformance?.now ? runtimePerformance.now() : Date.now();
}
function sampleResources() {
  const memory = runtimeProcess?.memoryUsage?.();
  const cpu = runtimeProcess?.cpuUsage?.();
  const eventLoop = runtimePerformance?.eventLoopUtilization?.();
  return {
    cpuUserMicros: cpu?.user,
    cpuSystemMicros: cpu?.system,
    heapUsedBytes: memory?.heapUsed,
    heapTotalBytes: memory?.heapTotal,
    rssBytes: memory?.rss,
    externalBytes: memory?.external,
    arrayBuffersBytes: memory?.arrayBuffers,
    eventLoopUtilization: eventLoop?.utilization,
    scope: memory || cpu || eventLoop ? "process" : "runtime"
  };
}
function deltaResources(start, end) {
  const delta = (a, b) => a === void 0 || b === void 0 ? void 0 : b - a;
  return {
    cpuUserMicros: delta(start.cpuUserMicros, end.cpuUserMicros),
    cpuSystemMicros: delta(start.cpuSystemMicros, end.cpuSystemMicros),
    heapUsedBytes: delta(start.heapUsedBytes, end.heapUsedBytes),
    heapTotalBytes: delta(start.heapTotalBytes, end.heapTotalBytes),
    rssBytes: delta(start.rssBytes, end.rssBytes),
    externalBytes: delta(start.externalBytes, end.externalBytes),
    arrayBuffersBytes: delta(start.arrayBuffersBytes, end.arrayBuffersBytes),
    eventLoopUtilization: delta(start.eventLoopUtilization, end.eventLoopUtilization),
    scope: start.scope
  };
}

// src/telemetry/TelemetryController.ts
var id = (prefix) => `${prefix}_${(0, import_node_crypto.randomUUID)()}`;
function percentiles(values) {
  if (!values.length) return { min: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return {
    min: sorted[0],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50: pick(0.5),
    p90: pick(0.9),
    p95: pick(0.95),
    p99: pick(0.99),
    max: sorted[sorted.length - 1]
  };
}
var TelemetryController = class {
  constructor(serviceId, options = {}) {
    this.serviceId = serviceId;
    this.mode = options.mode ?? "off";
    this.maxSamples = Math.max(1, options.maxSamples ?? 2048);
    this.maxRecentInvocations = Math.max(1, options.maxRecentInvocations ?? 100);
  }
  serviceId;
  mode;
  maxSamples;
  maxRecentInvocations;
  samples = [];
  active = /* @__PURE__ */ new Map();
  totalInvocationCount = 0;
  totalSuccessCount = 0;
  totalErrorCount = 0;
  lastInvocationAt;
  enable(mode = "standard") {
    this.mode = mode;
  }
  disable() {
    this.mode = "off";
    this.active.clear();
  }
  setMode(mode) {
    this.mode = mode;
    if (mode === "off") this.active.clear();
  }
  getMode() {
    return this.mode;
  }
  status() {
    return {
      enabled: this.mode !== "off",
      mode: this.mode,
      serviceId: this.serviceId,
      invocationCount: this.totalInvocationCount,
      activeInvocations: this.active.size,
      lastInvocationAt: this.lastInvocationAt
    };
  }
  begin(target, kind, correlationId, parentSpanId) {
    if (this.mode === "off") {
      return {
        invocationId: "",
        traceId: "",
        spanId: "",
        parentSpanId,
        end: () => void 0
      };
    }
    const invocationId = id("inv");
    const spanId = id("span");
    const traceId = parentSpanId ? this.findTraceId(parentSpanId) ?? id("trace") : id("trace");
    const active = {
      invocationId,
      traceId,
      spanId,
      parentSpanId,
      serviceId: this.serviceId,
      target,
      kind,
      correlationId,
      startedAt: telemetryNow(),
      resourcesStart: this.mode === "standard" ? void 0 : sampleResources()
    };
    this.active.set(invocationId, active);
    return {
      invocationId,
      traceId,
      spanId,
      parentSpanId,
      end: (error) => this.finish(active, error)
    };
  }
  reset() {
    this.samples.length = 0;
    this.active.clear();
    this.totalInvocationCount = 0;
    this.totalSuccessCount = 0;
    this.totalErrorCount = 0;
    this.lastInvocationAt = void 0;
  }
  snapshot() {
    const invocations = this.samples.slice();
    const durations = invocations.map((item) => item.durationMs);
    const targetMap = /* @__PURE__ */ new Map();
    for (const invocation of invocations) {
      const key = `${invocation.kind}:${invocation.target}`;
      const group = targetMap.get(key) ?? [];
      group.push(invocation);
      targetMap.set(key, group);
    }
    const targets = [...targetMap.values()].map((group) => ({
      target: group[0].target,
      kind: group[0].kind,
      count: group.length,
      successCount: group.filter((item) => item.status === "completed").length,
      errorCount: group.filter((item) => item.status === "failed").length,
      durationMs: percentiles(group.map((item) => item.durationMs)),
      lastInvocationAt: group[group.length - 1]?.completedAt
    }));
    return {
      serviceId: this.serviceId,
      mode: this.mode,
      capturedAt: Date.now(),
      status: this.status(),
      totals: {
        invocationCount: this.totalInvocationCount,
        successCount: this.totalSuccessCount,
        errorCount: this.totalErrorCount,
        durationMs: percentiles(durations)
      },
      targets,
      activeInvocations: this.active.size,
      recentInvocations: invocations.slice(-this.maxRecentInvocations)
    };
  }
  functionality(name) {
    return this.snapshot().targets.find((target) => target.kind === "functionality" && target.target === name);
  }
  functionalities() {
    return this.snapshot().targets.filter((target) => target.kind === "functionality");
  }
  findTraceId(parentSpanId) {
    for (let index = this.samples.length - 1; index >= 0; index -= 1) {
      if (this.samples[index].spanId === parentSpanId) return this.samples[index].traceId;
    }
    for (const active of this.active.values()) {
      if (active.spanId === parentSpanId) return active.traceId;
    }
    return void 0;
  }
  finish(active, error) {
    if (!this.active.delete(active.invocationId)) return;
    const completedAt = telemetryNow();
    const resourcesEnd = this.mode === "standard" ? void 0 : sampleResources();
    const invocation = {
      invocationId: active.invocationId,
      traceId: active.traceId,
      spanId: active.spanId,
      parentSpanId: active.parentSpanId,
      serviceId: active.serviceId,
      target: active.target,
      kind: active.kind,
      correlationId: active.correlationId,
      startedAt: active.startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt - active.startedAt),
      status: error === void 0 ? "completed" : "failed",
      error: error === void 0 ? void 0 : {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error)
      },
      resources: active.resourcesStart && resourcesEnd ? { start: active.resourcesStart, end: resourcesEnd, delta: deltaResources(active.resourcesStart, resourcesEnd) } : void 0
    };
    this.samples.push(invocation);
    this.totalInvocationCount += 1;
    if (invocation.status === "completed") this.totalSuccessCount += 1;
    else this.totalErrorCount += 1;
    if (this.samples.length > this.maxSamples) this.samples.splice(0, this.samples.length - this.maxSamples);
    this.lastInvocationAt = Date.now();
  }
};

// src/services/ServiceInstance.ts
var ServiceInstance = class {
  constructor(definition) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.telemetry = new TelemetryController(this.id);
    this.lifecycle = new LifecycleManager();
    if (definition.state) {
      this.stateStore = new ServiceStateStore(definition.state.initial);
    }
  }
  definition;
  id;
  name;
  version;
  telemetry;
  stateStore;
  lifecycle;
  initialized = false;
  disposed = false;
  getDefinition() {
    return this.definition;
  }
  getStatus() {
    return this.lifecycle.getStatus();
  }
  async start() {
    if (this.disposed) throw new Error("[Service:" + this.name + "] Cannot start a disposed service.");
    const current = this.lifecycle.getStatus();
    if (current === "running") return;
    if (current === "initializing" || current === "starting" || current === "stopping") {
      throw new Error("[Service:" + this.name + "] Cannot start while status is '" + current + "'.");
    }
    if (!this.initialized) {
      this.lifecycle.transitionTo("initializing");
      try {
        await this.definition.lifecycle?.onInit?.();
        this.initialized = true;
        this.lifecycle.transitionTo("ready");
      } catch (error) {
        this.lifecycle.transitionTo("uninitialized");
        throw error;
      }
    }
    this.lifecycle.transitionTo("starting");
    try {
      await this.definition.lifecycle?.onStart?.();
      this.lifecycle.transitionTo("running");
    } catch (error) {
      this.lifecycle.transitionTo("ready");
      throw error;
    }
  }
  async stop() {
    const current = this.lifecycle.getStatus();
    if (current === "stopped") return;
    if (current !== "running") {
      throw new Error("[Service:" + this.name + "] Cannot stop while status is '" + current + "'.");
    }
    this.lifecycle.transitionTo("stopping");
    try {
      await this.definition.lifecycle?.onStop?.();
      this.lifecycle.transitionTo("stopped");
    } catch (error) {
      this.lifecycle.transitionTo("running");
      throw error;
    }
  }
  async dispose() {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === "running") await this.stop();
    await this.definition.lifecycle?.onDispose?.();
    this.disposed = true;
  }
  async call(op, input, ctx = {}) {
    this.lifecycle.assertRunning(this.name);
    const operation = this.definition.operations[op];
    if (!operation) {
      throw new Error("[Service:" + this.name + "] Operation '" + op + "' not found.");
    }
    if (ctx.metadata?.__krnlTelemetryInternal === true) {
      return await operation.handler(input, ctx);
    }
    const parentSpanId = typeof ctx.metadata?.__krnlTelemetryParentSpanId === "string" ? ctx.metadata.__krnlTelemetryParentSpanId : void 0;
    const handle = this.telemetry.begin(op, "service", ctx.correlationId, parentSpanId);
    try {
      const output = await operation.handler(input, ctx);
      handle.end();
      return output;
    } catch (error) {
      handle.end(error);
      throw error;
    }
  }
  getState() {
    return this.stateStore?.getState() ?? Object.freeze({});
  }
  setState(mutation) {
    if (!this.stateStore) {
      this.stateStore = new ServiceStateStore({ ...mutation });
      return;
    }
    this.stateStore.setState(mutation);
  }
};

// src/services/ServiceProxy.ts
var ServiceProxy = class {
  constructor(definition, adapter, endpoint) {
    this.definition = definition;
    this.adapter = adapter;
    this.endpoint = endpoint;
    if (!definition) {
      throw new Error("[ServiceProxy] Missing service definition.");
    }
    if (!adapter || typeof adapter.send !== "function") {
      throw new Error("[ServiceProxy:" + (definition.name || "unknown") + "] Missing or invalid protocol adapter.");
    }
    if (!endpoint || typeof endpoint.address !== "string" || endpoint.address.length === 0) {
      throw new Error("[ServiceProxy:" + (definition.name || "unknown") + "] Missing or invalid endpoint descriptor.");
    }
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.telemetry = new TelemetryController(this.id);
    this.stateCache = { ...definition.state?.initial ?? {} };
  }
  definition;
  adapter;
  endpoint;
  id;
  name;
  version;
  telemetry;
  stateCache;
  eventHandlers = /* @__PURE__ */ new Map();
  lifecycle = new LifecycleManager();
  disposed = false;
  getDefinition() {
    return this.definition;
  }
  getStatus() {
    return this.lifecycle.getStatus();
  }
  async start() {
    if (this.disposed) {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot start a disposed service proxy.");
    }
    const status = this.lifecycle.getStatus();
    if (status === "running") return;
    if (status === "stopping" || status === "starting" || status === "initializing") {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot start while status is '" + status + "'.");
    }
    if (status === "uninitialized") {
      this.lifecycle.transitionTo("initializing");
      this.lifecycle.transitionTo("ready");
    }
    this.lifecycle.transitionTo("starting");
    this.lifecycle.transitionTo("running");
  }
  async stop() {
    const status = this.lifecycle.getStatus();
    if (status === "stopped") return;
    if (status !== "running") {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot stop while status is '" + status + "'.");
    }
    this.lifecycle.transitionTo("stopping");
    this.lifecycle.transitionTo("stopped");
  }
  async dispose() {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === "running") await this.stop();
    this.disposed = true;
  }
  async call(op, input, ctx = {}) {
    if (!this.definition.operations[op]) {
      throw new Error("[ServiceProxy:" + this.name + "] Operation '" + op + "' not found.");
    }
    if (this.lifecycle.getStatus() !== "running") {
      await this.start();
    }
    if (!this.adapter.send) {
      throw new Error("[ServiceProxy:" + this.name + "] Adapter does not support send().");
    }
    const envelope = {
      id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: "request",
      operation: op,
      payload: input,
      timestamp: Date.now()
    };
    const parentSpanId = typeof ctx.metadata?.__krnlTelemetryParentSpanId === "string" ? ctx.metadata.__krnlTelemetryParentSpanId : void 0;
    const handle = this.telemetry.begin(op, "service", ctx.correlationId, parentSpanId);
    try {
      const response = await this.adapter.send(this.endpoint, envelope);
      if (response.error) {
        const error = new Error("[ServiceProxy:" + this.name + "] Remote error: " + response.error);
        handle.end(error);
        throw error;
      }
      handle.end();
      return response.payload;
    } catch (error) {
      handle.end(error);
      throw error;
    }
  }
  getState() {
    return Object.freeze({ ...this.stateCache });
  }
  setState(mutation) {
    this.stateCache = { ...this.stateCache, ...mutation };
  }
  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, /* @__PURE__ */ new Set());
    const handlers = this.eventHandlers.get(event);
    handlers.add(handler);
    return () => handlers.delete(handler);
  }
  emit(event, payload) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of Array.from(handlers)) {
      try {
        handler(payload);
      } catch (error) {
        console.error("[ServiceProxy:" + this.name + "] Event handler error for '" + event + "':", error);
      }
    }
  }
};

// src/services/ServiceGenerators.ts
function assertRecord(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be an object.");
  }
}
function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be a non-empty string.");
  }
}
function validateServiceDefinition(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("[KrnlTS] Invalid service definition: expected an object.");
  }
  assertNonEmptyString(definition.id, "id");
  assertNonEmptyString(definition.name, "name");
  assertNonEmptyString(definition.version, "version");
  if (!definition.operations || typeof definition.operations !== "object") {
    throw new Error("[Service:" + definition.name + "] Invalid operations: expected an object.");
  }
  for (const [key, operation] of Object.entries(definition.operations)) {
    if (!operation || typeof operation !== "object") {
      throw new Error("[Service:" + definition.name + "] Invalid operation '" + key + "'.");
    }
    assertNonEmptyString(operation.id, "operations." + key + ".id");
    assertNonEmptyString(operation.name, "operations." + key + ".name");
    if (operation.inputSchema !== void 0) assertRecord(operation.inputSchema, "operations." + key + ".inputSchema");
    if (operation.outputSchema !== void 0) assertRecord(operation.outputSchema, "operations." + key + ".outputSchema");
    if (typeof operation.handler !== "function") {
      throw new Error("[Service:" + definition.name + "] Operation '" + key + "' must define a handler.");
    }
  }
  for (const [key, schema] of Object.entries(definition.inputs ?? {})) assertRecord(schema, "inputs." + key);
  for (const [key, schema] of Object.entries(definition.outputs ?? {})) assertRecord(schema, "outputs." + key);
  if (definition.state?.schema !== void 0) assertRecord(definition.state.schema, "state.schema");
  for (const capability of definition.capabilities ?? []) {
    assertNonEmptyString(capability.id, "capability.id");
    assertNonEmptyString(capability.name, "capability.name");
    if (!Array.isArray(capability.protocols)) {
      throw new Error("[Service:" + definition.name + "] Capability '" + capability.name + "' protocols must be an array.");
    }
  }
  for (const dependency of definition.dependencies ?? []) {
    assertNonEmptyString(dependency.serviceId, "dependency.serviceId");
  }
  return definition;
}
function createServiceDefinition(definition) {
  return validateServiceDefinition(definition);
}
function createService(definition) {
  return new ServiceInstance(validateServiceDefinition(definition));
}
function createServiceProxy(definition, adapter, endpoint) {
  validateServiceDefinition(definition);
  if (!adapter || typeof adapter.send !== "function") {
    throw new Error("[ServiceProxy:" + definition.name + "] Adapter must implement send().");
  }
  if (!endpoint || typeof endpoint.address !== "string" || endpoint.address.length === 0) {
    throw new Error("[ServiceProxy:" + definition.name + "] Endpoint must have an address.");
  }
  return new ServiceProxy(definition, adapter, endpoint);
}

// src/events/EventBus.ts
var EventBus = class {
  handlers = /* @__PURE__ */ new Map();
  subscribe(event, handler) {
    let listeners = this.handlers.get(event);
    if (!listeners) {
      listeners = /* @__PURE__ */ new Set();
      this.handlers.set(event, listeners);
    }
    listeners.add(handler);
    return {
      unsubscribe: () => {
        listeners?.delete(handler);
        if (listeners && listeners.size === 0) this.handlers.delete(event);
      }
    };
  }
  on(event, handler) {
    return this.subscribe(event, handler).unsubscribe;
  }
  emit(event, payload) {
    const listeners = this.handlers.get(event);
    if (!listeners) return;
    for (const listener of Array.from(listeners)) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`[EventBus] Handler error for '${event}':`, error);
      }
    }
  }
  clear() {
    this.handlers.clear();
  }
};
function createEventChannels(bus, names) {
  const channels = {};
  for (const name of names) {
    channels[name] = {
      name,
      subscribe: (handler) => bus.subscribe(name, handler),
      on: (handler) => bus.on(name, handler)
    };
  }
  return channels;
}

// src/functionalities/FunctionalityFacade.ts
var FunctionalityFacade = class {
  id;
  name;
  description;
  bubbleEvents;
  definition;
  eventBus;
  events;
  constructor(id2, definition, options = {}) {
    if (!id2 || typeof id2 !== "string") {
      throw new Error("[FunctionalityFacade] Functionality id must be a non-empty string.");
    }
    if (!definition || typeof definition.execute !== "function") {
      throw new Error(`[FunctionalityFacade:${id2}] Functionality must define execute().`);
    }
    this.id = id2;
    this.name = definition.name || id2;
    this.description = definition.description || "";
    this.bubbleEvents = options.bubbleEvents ?? definition.bubbleEvents ?? true;
    this.definition = definition;
    this.eventBus = new EventBus();
    for (const reserved of ["triggered", "completed", "failed"]) {
      if (definition.events && reserved in definition.events) {
        throw new Error(`[FunctionalityFacade:${id2}] Event '${reserved}' is reserved for functionality lifecycle.`);
      }
    }
    const eventNames = [
      "triggered",
      "completed",
      "failed",
      ...Object.keys(definition.events ?? {})
    ];
    this.events = createEventChannels(this.eventBus, eventNames);
  }
  getEventDefinitions() {
    return {
      triggered: { name: "triggered", description: "Functionality execution started." },
      completed: { name: "completed", description: "Functionality execution completed successfully." },
      failed: { name: "failed", description: "Functionality execution failed." },
      ...this.definition.events ?? {}
    };
  }
  subscribe(event, handler) {
    return this.eventBus.on(event, handler);
  }
  emit(event, payload) {
    this.eventBus.emit(event, payload);
  }
  async execute(input, context) {
    const lifecycle = {
      serviceId: context.serviceId,
      functionalityId: this.id,
      functionalityName: this.name,
      correlationId: context.correlationId,
      timestamp: Date.now(),
      input
    };
    this.emit("triggered", lifecycle);
    try {
      const output = await this.definition.execute(input, {
        ...context,
        emit: (event, payload) => this.emit(event, payload)
      });
      this.emit("completed", {
        ...lifecycle,
        timestamp: Date.now(),
        output
      });
      return output;
    } catch (error) {
      this.emit("failed", {
        ...lifecycle,
        timestamp: Date.now(),
        error: error?.message || String(error)
      });
      throw error;
    }
  }
  clearEventSubscriptions() {
    this.eventBus.clear();
  }
};

// ../../node_modules/.pnpm/p-queue@10.0.0/node_modules/p-queue/dist/lower-bound.js
function lowerBound(array, value, comparator) {
  let first = 0;
  let count = array.length;
  while (count > 0) {
    const step = Math.trunc(count / 2);
    let it = first + step;
    if (comparator(array[it], value) <= 0) {
      first = ++it;
      count -= step + 1;
    } else {
      count = step;
    }
  }
  return first;
}

// ../../node_modules/.pnpm/p-queue@10.0.0/node_modules/p-queue/dist/priority-queue.js
var compactionThreshold = 100;
var PriorityQueue = class {
  // The slots before `#head` are `undefined`.
  #queue = [];
  // The queue is stored as a sorted array, but dequeued slots are left before `#head` until compaction. Only items from `#head` onward are live, which keeps repeated dequeues amortized O(1).
  #head = 0;
  #compact() {
    if (this.#head === 0) {
      return;
    }
    this.#queue.splice(0, this.#head);
    this.#head = 0;
  }
  // Only the live items, because a dequeued item with the same id or function is no longer part of the queue.
  #findIndex(isMatch) {
    for (let index = this.#head; index < this.#queue.length; index++) {
      if (isMatch(this.#queue[index])) {
        return index;
      }
    }
    return -1;
  }
  // Not `dequeue()`, which a subclass can override, because `remove()` also uses it.
  #removeFirst() {
    const item = this.#queue[this.#head];
    this.#queue[this.#head] = void 0;
    this.#head++;
    if (this.#head === this.#queue.length) {
      this.#queue.length = 0;
      this.#head = 0;
    } else if (this.#head > compactionThreshold && this.#head > this.#queue.length / 2) {
      this.#compact();
    }
    return item.run;
  }
  enqueue(run, options) {
    const { priority = 0, id: id2 } = options ?? {};
    const { size } = this;
    const element = {
      priority,
      id: id2,
      run
    };
    if (size === 0) {
      this.#queue.length = 0;
      this.#head = 0;
      this.#queue.push(element);
      return;
    }
    if (this.#queue.at(-1).priority >= priority) {
      this.#queue.push(element);
      return;
    }
    this.#compact();
    const index = lowerBound(this.#queue, element, (a, b) => a.priority === b.priority ? 0 : b.priority - a.priority);
    this.#queue.splice(index, 0, element);
  }
  setPriority(id2, priority) {
    const index = this.#findIndex((element) => element.id === id2);
    if (index === -1) {
      throw new ReferenceError(`No promise function with the id "${id2}" exists in the queue.`);
    }
    if (this.#queue[index].priority === priority) {
      return;
    }
    const [item] = this.#queue.splice(index, 1);
    this.enqueue(item.run, { priority, id: id2 });
  }
  remove(idOrRun) {
    const index = this.#findIndex((element) => (typeof idOrRun === "string" ? element.id : element.run) === idOrRun);
    if (index === this.#head) {
      this.#removeFirst();
    } else if (index !== -1) {
      this.#queue.splice(index, 1);
    }
  }
  dequeue() {
    return this.#head === this.#queue.length ? void 0 : this.#removeFirst();
  }
  filter(options) {
    const result = [];
    for (let index = this.#head; index < this.#queue.length; index++) {
      const element = this.#queue[index];
      if (element.priority === options.priority) {
        result.push(element.run);
      }
    }
    return result;
  }
  get size() {
    return this.#queue.length - this.#head;
  }
};

// ../../node_modules/.pnpm/p-queue@10.0.0/node_modules/p-queue/dist/index.js
var maximumTimerDelay = 2147483647;
var asyncHooks = globalThis.process?.getBuiltinModule?.("node:async_hooks");
var bindAsyncContext = (function_) => {
  if (asyncHooks === void 0) {
    return function_;
  }
  const asyncResource = new asyncHooks.AsyncResource("PQueueTask");
  return () => asyncResource.runInAsyncScope(function_);
};
var validateTimeout = (timeout) => {
  if (timeout !== void 0 && !(Number.isFinite(timeout) && timeout > 0 && timeout <= maximumTimerDelay)) {
    throw new TypeError(`Expected \`timeout\` to be a positive finite number up to ${maximumTimerDelay}, got \`${timeout}\` (${typeof timeout})`);
  }
};
var validateLimit = (name, value) => {
  if (!(typeof value === "number" && value >= 1 && (value === Infinity || Number.isInteger(value)))) {
    throw new TypeError(`Expected \`${name}\` to be an integer from 1 and up or \`Infinity\`, got \`${String(value)}\` (${typeof value})`);
  }
};
var validateRateLimit = (interval, intervalCap, isStrict) => {
  validateLimit("intervalCap", intervalCap);
  if (!(Number.isFinite(interval) && interval >= 0)) {
    throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${String(interval)}\` (${typeof interval})`);
  }
  if (intervalCap !== Infinity && interval > maximumTimerDelay) {
    throw new TypeError(`Expected \`interval\` to be at most ${maximumTimerDelay} with an \`intervalCap\`, got \`${interval}\``);
  }
  if (isStrict && interval === 0) {
    throw new TypeError("The `strict` option requires a non-zero `interval`");
  }
  if (isStrict && intervalCap === Infinity) {
    throw new TypeError("The `strict` option requires a finite `intervalCap`");
  }
};
var PQueue = class extends EventTarget {
  #carryoverIntervalCount;
  #isIntervalIgnored;
  #intervalCount = 0;
  #intervalCap;
  #rateLimitedInInterval = false;
  #rateLimitFlushScheduled = false;
  #interval;
  /*
  Timestamp when the current interval window ends. Kept accurate at every window transition: `#initializeIntervalIfNeeded` sets it when a window starts and `#onInterval` advances it as the recurring timer rolls into each new window. This is the source of truth for whether a task added after the queue goes idle belongs to a fresh window, so it must not go stale.
  */
  #intervalEnd = 0;
  // Recurring timer that drives windows while the queue is actively processing. Absent (`undefined`) once the queue goes idle.
  #intervalId;
  // One-shot timer used while idle to resume at the next window boundary, since `#intervalId` is cleared when idle.
  #timeoutId;
  #strict;
  // Circular buffer implementation for better performance
  #strictTicks = [];
  #strictTicksStartIndex = 0;
  #queue;
  #queueClass;
  #pending = 0;
  // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
  #concurrency;
  #isPaused;
  // Use to assign a unique identifier to a promise function, if not explicitly specified
  #idAssigner = 1n;
  // Track currently running tasks for debugging
  #runningTasks = /* @__PURE__ */ new Set();
  // The `abort` listener of each signal, with the callbacks of the tasks that use the signal.
  #abortListeners = /* @__PURE__ */ new Map();
  // The waiting tasks, so that `.clear()` can reject their promises.
  #waitingTasks = /* @__PURE__ */ new Set();
  #timeout;
  constructor(options) {
    super();
    globalThis.process?.getBuiltinModule?.("node:events")?.setMaxListeners(Infinity, this);
    const { carryoverIntervalCount = false, intervalCap = Infinity, interval = 0, concurrency = Infinity, autoStart = true, queueClass = PriorityQueue, strict = false, timeout } = options ?? {};
    validateRateLimit(interval, intervalCap, strict);
    this.#carryoverIntervalCount = carryoverIntervalCount;
    this.#isIntervalIgnored = intervalCap === Infinity || interval === 0;
    this.#intervalCap = intervalCap;
    this.#interval = interval;
    this.#strict = strict;
    this.#queueClass = queueClass;
    this.#queue = new this.#queueClass();
    this.concurrency = concurrency;
    this.timeout = timeout;
    this.#isPaused = !autoStart;
    this.#setupRateLimitTracking();
  }
  // Calls `callback` when `signal` aborts, and returns a function that stops it. The tasks that share a signal share one listener on it, because Node.js searches all the listeners of a signal to add or remove one, so a listener for each task takes O(n²) time with many tasks.
  #onAbort(signal, callback) {
    let listener = this.#abortListeners.get(signal);
    if (!listener) {
      const callbacks = /* @__PURE__ */ new Set();
      const dispatch = () => {
        this.#abortListeners.delete(signal);
        for (const abortCallback of callbacks) {
          abortCallback();
        }
      };
      listener = { callbacks, dispatch };
      this.#abortListeners.set(signal, listener);
      signal.addEventListener("abort", dispatch, { once: true });
    }
    const currentListener = listener;
    currentListener.callbacks.add(callback);
    return () => {
      currentListener.callbacks.delete(callback);
      if (currentListener.callbacks.size > 0 || this.#abortListeners.get(signal) !== currentListener) {
        return;
      }
      this.#abortListeners.delete(signal);
      signal.removeEventListener("abort", currentListener.dispatch);
    };
  }
  #emit(event, detail) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }
  async #onEvent(events, shouldHandle) {
    const eventList = Array.isArray(events) ? events : [events];
    return new Promise((resolve) => {
      const controller = new AbortController();
      const listener = () => {
        if (shouldHandle && !shouldHandle()) {
          return;
        }
        controller.abort();
        resolve();
      };
      for (const event of eventList) {
        this.addEventListener(event, listener, { signal: controller.signal });
      }
    });
  }
  // From the current state. `#rateLimitedInInterval` is what the events last reported, and it updates in a microtask.
  get #isRateLimitedNow() {
    if (this.#isIntervalIgnored || this.#queue.size === 0) {
      return false;
    }
    const now = Date.now();
    if (this.#strict) {
      this.#cleanupStrictTicks(now);
      return this.#getActiveTicksCount() >= this.#intervalCap;
    }
    const isWindowOver = this.#intervalId === void 0 && this.#intervalEnd <= now;
    const count = isWindowOver ? this.#intervalCountAtWindowStart : this.#intervalCount;
    return count >= this.#intervalCap;
  }
  // The tasks that still run count against the new window with `carryoverIntervalCount`.
  get #intervalCountAtWindowStart() {
    return this.#carryoverIntervalCount ? this.#pending : 0;
  }
  #updateRateLimitState() {
    const shouldBeRateLimited = this.#isRateLimitedNow;
    if (shouldBeRateLimited === this.#rateLimitedInInterval) {
      return;
    }
    this.#rateLimitedInInterval = shouldBeRateLimited;
    this.#emit(shouldBeRateLimited ? "rateLimit" : "rateLimitCleared");
  }
  #rollbackIntervalConsumption() {
    if (this.#isIntervalIgnored) {
      return;
    }
    this.#rollbackIntervalSlot();
    this.#scheduleRateLimitUpdate();
  }
  #scheduleRateLimitUpdate() {
    if (this.#isIntervalIgnored || this.#rateLimitFlushScheduled) {
      return;
    }
    this.#rateLimitFlushScheduled = true;
    queueMicrotask(() => {
      this.#rateLimitFlushScheduled = false;
      this.#updateRateLimitState();
    });
  }
  #setupRateLimitTracking() {
    if (this.#isIntervalIgnored) {
      return;
    }
    this.addEventListener("add", () => {
      if (this.#queue.size > 0) {
        this.#scheduleRateLimitUpdate();
      }
    });
    this.addEventListener("next", () => {
      this.#scheduleRateLimitUpdate();
    });
  }
  #cleanupStrictTicks(now) {
    while (this.#strictTicksStartIndex < this.#strictTicks.length) {
      const oldestTick = this.#strictTicks[this.#strictTicksStartIndex];
      if (oldestTick !== void 0 && now - oldestTick >= this.#interval) {
        this.#strictTicksStartIndex++;
      } else {
        break;
      }
    }
    const shouldCompact = this.#strictTicksStartIndex > 100 && this.#strictTicksStartIndex > this.#strictTicks.length / 2 || this.#strictTicksStartIndex === this.#strictTicks.length;
    if (!shouldCompact) {
      return;
    }
    this.#strictTicks = this.#strictTicks.slice(this.#strictTicksStartIndex);
    this.#strictTicksStartIndex = 0;
  }
  // Helper methods for interval consumption
  #consumeIntervalSlot(now) {
    if (this.#strict) {
      this.#strictTicks.push(now);
    } else {
      this.#intervalCount++;
    }
  }
  #rollbackIntervalSlot() {
    if (this.#strict) {
      if (this.#strictTicks.length > this.#strictTicksStartIndex) {
        this.#strictTicks.pop();
      }
      return;
    }
    if (this.#intervalCount > 0) {
      this.#intervalCount--;
    }
  }
  #getActiveTicksCount() {
    return this.#strictTicks.length - this.#strictTicksStartIndex;
  }
  get #doesIntervalAllowAnother() {
    if (this.#isIntervalIgnored) {
      return true;
    }
    const count = this.#strict ? this.#getActiveTicksCount() : this.#intervalCount;
    return count < this.#intervalCap;
  }
  get #doesConcurrentAllowAnother() {
    return this.#pending < this.#concurrency;
  }
  #next() {
    this.#pending--;
    if (this.#pending === 0) {
      this.#emit("pendingZero");
    }
    this.#processQueue();
    this.#emit("next");
  }
  #onResumeInterval() {
    this.#timeoutId = void 0;
    this.#onInterval();
    if (!this.#isPaused) {
      this.#initializeIntervalIfNeeded();
    }
  }
  #isIntervalPausedAt(now) {
    if (this.#strict) {
      this.#cleanupStrictTicks(now);
      const activeTicksCount = this.#getActiveTicksCount();
      if (activeTicksCount >= this.#intervalCap) {
        const oldestTick = this.#strictTicks[this.#strictTicksStartIndex];
        const delay = this.#interval - (now - oldestTick);
        this.#createIntervalTimeout(delay);
        return true;
      }
      return false;
    }
    if (this.#intervalId === void 0) {
      const delay = this.#intervalEnd - now;
      if (delay <= 0) {
        this.#intervalCount = this.#intervalCountAtWindowStart;
      } else {
        this.#createIntervalTimeout(delay);
        return true;
      }
    }
    return false;
  }
  #createIntervalTimeout(delay) {
    if (this.#timeoutId !== void 0) {
      return;
    }
    this.#timeoutId = setTimeout(() => {
      this.#onResumeInterval();
    }, delay);
  }
  #clearIntervalTimer() {
    if (this.#intervalId === void 0) {
      return;
    }
    clearInterval(this.#intervalId);
    this.#intervalId = void 0;
  }
  #clearTimeoutTimer() {
    if (this.#timeoutId === void 0) {
      return;
    }
    clearTimeout(this.#timeoutId);
    this.#timeoutId = void 0;
  }
  // Emits `empty`, and `idle` when no tasks run. For when the queue has no waiting tasks.
  #emitEmptyAndIdle() {
    this.#clearIntervalTimer();
    this.#emit("empty");
    if (this.#pending > 0 || this.#queue.size > 0) {
      return;
    }
    this.#clearTimeoutTimer();
    if (this.#strict) {
      this.#cleanupStrictTicks(Date.now());
    }
    this.#emit("idle");
  }
  #tryToStartAnother() {
    let isStarted;
    do {
      isStarted = this.#startNextTask();
    } while (isStarted === void 0);
    return isStarted;
  }
  // Returns `undefined` when it skipped a task whose signal aborted while it waited.
  #startNextTask() {
    if (this.#queue.size === 0) {
      this.#emitEmptyAndIdle();
      return false;
    }
    if (this.#isPaused) {
      if (!this.#doesIntervalAllowAnother) {
        this.#isIntervalPausedAt(Date.now());
      }
      return false;
    }
    const now = Date.now();
    const canInitializeInterval = !this.#isIntervalPausedAt(now);
    if (this.#doesIntervalAllowAnother && this.#doesConcurrentAllowAnother) {
      const job = this.#queue.dequeue();
      if (!this.#isIntervalIgnored) {
        this.#consumeIntervalSlot(now);
        this.#scheduleRateLimitUpdate();
      }
      if (canInitializeInterval) {
        this.#initializeIntervalIfNeeded();
      }
      const pendingBefore = this.#pending;
      job();
      if (this.#pending === pendingBefore) {
        this.#emit("next");
        return;
      }
      this.#emit("active");
      return true;
    }
    return false;
  }
  #initializeIntervalIfNeeded() {
    if (this.#isIntervalIgnored || this.#intervalId !== void 0 || this.#strict) {
      return;
    }
    this.#clearTimeoutTimer();
    this.#intervalId = setInterval(() => {
      this.#onInterval();
    }, this.#interval);
    this.#intervalEnd = Date.now() + this.#interval;
  }
  #onInterval() {
    if (!this.#strict) {
      if (this.#intervalId !== void 0) {
        if (this.#intervalCount === 0 && this.#pending === 0) {
          this.#clearIntervalTimer();
        } else {
          this.#intervalEnd = Date.now() + this.#interval;
        }
      }
      this.#intervalCount = this.#intervalCountAtWindowStart;
    }
    this.#processQueue();
    this.#scheduleRateLimitUpdate();
  }
  /**
  Executes all queued functions until it reaches the limit.
  */
  #processQueue() {
    while (this.#tryToStartAnother()) {
    }
  }
  // On an empty queue, `#processQueue()` emits `empty` and `idle`. An `idle` listener that sets `concurrency` or calls `.start()` would then recurse without end.
  #processWaitingTasks() {
    if (this.#queue.size > 0) {
      this.#processQueue();
    }
  }
  async #add(function_, options, waitingTask) {
    const id2 = options.id ?? (this.#idAssigner++).toString();
    options = {
      timeout: this.#timeout,
      ...options,
      id: id2
    };
    validateTimeout(options.timeout);
    if (options.priority !== void 0 && (typeof options.priority !== "number" || Number.isNaN(options.priority))) {
      throw new TypeError(`Expected \`priority\` to be a number, got \`${String(options.priority)}\` (${typeof options.priority})`);
    }
    waitingTask.id = id2;
    waitingTask.priority = options.priority ?? 0;
    return new Promise((resolve, reject) => {
      if (options.signal?.aborted) {
        reject(options.signal.reason);
        return;
      }
      const run = bindAsyncContext(async () => {
        waitingTask.stopListeningForAbort?.();
        this.#waitingTasks.delete(waitingTask);
        if (options.signal?.aborted) {
          this.#rollbackIntervalConsumption();
          reject(options.signal.reason);
          return;
        }
        this.#pending++;
        const runningTask = {
          id: id2,
          priority: waitingTask.priority,
          startTime: Date.now(),
          timeout: options.timeout
        };
        this.#runningTasks.add(runningTask);
        let { signal } = options;
        let stopListeningForAbort;
        let stopForwardingAbort;
        let timeoutId;
        try {
          if (options.timeout !== void 0) {
            const { signal: userSignal, timeout } = options;
            const taskController = new AbortController();
            timeoutId = setTimeout(() => {
              taskController.abort(new TimeoutError(`Task timed out after ${timeout}ms (queue has ${this.#pending} running, ${this.#queue.size} waiting)`));
            }, timeout);
            if (userSignal) {
              stopForwardingAbort = this.#onAbort(userSignal, () => {
                taskController.abort(userSignal.reason);
              });
            }
            signal = taskController.signal;
          }
          let operation;
          if (signal) {
            const abortSignal = signal;
            const abortPromise = new Promise((_resolve, rejectWithReason) => {
              stopListeningForAbort = this.#onAbort(abortSignal, () => {
                rejectWithReason(abortSignal.reason);
              });
            });
            operation = Promise.race([abortPromise, (async () => function_({ signal }))()]);
          } else {
            try {
              operation = function_({ signal });
            } catch (error) {
              operation = Promise.reject(error);
            }
          }
          const result = await operation;
          resolve(result);
          this.#emit("completed", result);
        } catch (error) {
          reject(error);
          this.#emit("error", error);
        } finally {
          clearTimeout(timeoutId);
          stopListeningForAbort?.();
          stopForwardingAbort?.();
          this.#runningTasks.delete(runningTask);
          queueMicrotask(() => {
            this.#next();
          });
        }
      });
      const hasWaitingTasks = this.#queue.size > 0;
      this.#queue.enqueue(run, options);
      waitingTask.reject = reject;
      this.#waitingTasks.add(waitingTask);
      if (options.signal) {
        const { signal } = options;
        waitingTask.stopListeningForAbort = this.#onAbort(signal, () => {
          this.#waitingTasks.delete(waitingTask);
          if (this.#queue instanceof PriorityQueue) {
            this.#queue.remove(run);
          } else {
            this.#queue.remove(id2);
          }
          reject(signal.reason);
          this.#processQueue();
          this.#emit("next");
        });
      }
      this.#emit("add");
      if (hasWaitingTasks) {
        this.#processQueue();
      } else {
        this.#tryToStartAnother();
      }
    });
  }
  /**
      Get or set the default timeout. A change applies to tasks added after it.
  
      @example
      ```
      const queue = new PQueue({timeout: 5000});
  
      queue.timeout = 10000;
      ```
      */
  get timeout() {
    return this.#timeout;
  }
  // Validated here, not only in `.add()`, so that an invalid value throws where it is set, instead of making every later `.add()` reject.
  set timeout(timeout) {
    validateTimeout(timeout);
    this.#timeout = timeout;
  }
  get concurrency() {
    return this.#concurrency;
  }
  set concurrency(newConcurrency) {
    validateLimit("concurrency", newConcurrency);
    this.#concurrency = newConcurrency;
    this.#processWaitingTasks();
  }
  /**
      Changes the priority of a waiting task, found by its `id`. Throws a `ReferenceError` if no waiting task has that `id`, for example because it already started. Throws a `TypeError` if `priority` is not a finite number. Tasks only wait when the queue has a `concurrency` limit, is paused, or is rate-limited.
  
      @example
      ```
      // Raise the priority to run a task earlier
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 0, id: '🦀'});
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦄', {priority: 1});
  
      queue.setPriority('🦀', 2);
      // '🦀' runs second
      ```
  
      @example
      ```
      // Lower the priority to run a task later
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 1, id: '🦀'});
      queue.add(async () => '🦄');
      queue.add(async () => '🦄', {priority: 0});
  
      queue.setPriority('🦀', -1);
      // '🦀' runs last
      ```
      */
  setPriority(id2, priority) {
    if (typeof priority !== "number" || !Number.isFinite(priority)) {
      throw new TypeError(`Expected \`priority\` to be a finite number, got \`${priority}\` (${typeof priority})`);
    }
    for (const waitingTask of this.#waitingTasks) {
      if (waitingTask.id === id2) {
        this.#queue.setPriority(id2, priority);
        waitingTask.priority = priority;
        return;
      }
    }
    throw new ReferenceError(`No promise function with the id "${id2}" exists in the queue.`);
  }
  /**
      Adds a sync or async task to the queue.
  
      Returns a promise that settles with the result of `fn` when the task completes, not when it is added. The function gets `{signal}` as its first argument. The signal is set when the task has a `signal` or a `timeout`, and aborts when either one does. Pass it on, for example to `fetch()`, to stop the work. The function runs in the async context of the `.add()` call (in Node.js 22.3 and later, Deno, and Bun), so it sees the [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) values of the caller, also when it starts later.
  
      If you `await` each `.add()` call before the next, the tasks run one after the other, whatever the `concurrency`.
  
      Handle rejections of the returned promise. Otherwise, they are unhandled rejections, which can make the process exit.
      */
  add(function_, options = {}) {
    const waitingTask = {};
    const promise = this.#add(function_, options, waitingTask);
    waitingTask.promise = promise;
    if (waitingTask.isCleared) {
      promise.catch(() => void 0);
    }
    return promise;
  }
  async addAll(functions, options) {
    return Promise.all(functions.map(async (function_) => this.add(function_, options)));
  }
  /**
      Starts (or resumes) running queued tasks. Only needed if the queue is paused, with `autoStart: false` or `.pause()`.
  
      @returns `this` (the instance).
      */
  start() {
    if (!this.#isPaused) {
      return this;
    }
    this.#isPaused = false;
    this.#processWaitingTasks();
    return this;
  }
  /**
  Stops starting new tasks. Running tasks continue.
  */
  pause() {
    this.#isPaused = true;
  }
  /**
      Removes all waiting tasks. Running tasks continue.
  
      The promises returned by `.add()` for the removed tasks reject with an `AbortError`, which is a `DOMException`. The removed tasks do not run, and they do not emit the `error` event.
  
      If you ignore such a promise, its rejection is not reported as unhandled. This does not apply to a promise made from it, like the one from `queue.add(fn).then(…)` or from `.addAll()`, so handle the rejection of that promise.
  
      @example
      ```
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(() => doWork());
      const promise = queue.add(() => doWork());
  
      queue.clear();
  
      try {
          await promise;
      } catch (error) {
          console.log(error.name);
          //=> 'AbortError'
      }
      ```
      */
  clear() {
    if (this.#queue.size === 0) {
      return;
    }
    this.#queue = new this.#queueClass();
    const error = new DOMException("The queue was cleared", "AbortError");
    for (const waitingTask of this.#waitingTasks) {
      waitingTask.stopListeningForAbort?.();
      waitingTask.isCleared = true;
      waitingTask.promise?.catch(() => void 0);
      waitingTask.reject(error);
    }
    this.#waitingTasks.clear();
    this.#emitEmptyAndIdle();
    this.#updateRateLimitState();
    this.#emit("next");
  }
  /**
      Returns a promise that resolves when the queue is empty. Tasks can still be running.
  
      The promise resolves once. Call `.onEmpty()` again to wait for the next time, or use the `empty` event to get every time.
      */
  async onEmpty() {
    if (this.#queue.size === 0) {
      return;
    }
    await this.#onEvent(["empty", "active"], () => this.#queue.size === 0);
  }
  /**
      Returns a promise that resolves when `queue.size < limit`.
  
      Await it before you add a task, to keep the queue from growing beyond a size. It counts only waiting tasks, not running tasks.
      */
  async onSizeLessThan(limit) {
    if (this.#queue.size < limit) {
      return;
    }
    await this.#onEvent(["next", "active"], () => this.#queue.size < limit);
  }
  /**
      Returns a promise that resolves when the queue is empty and all tasks have completed: `queue.size === 0 && queue.pending === 0`.
  
      Unlike `.onEmpty()`, it waits for running tasks to finish.
  
      The promise resolves once. Call `.onIdle()` again to wait for the next time, or use the `idle` event to get every time.
      */
  async onIdle() {
    if (this.#pending === 0 && this.#queue.size === 0) {
      return;
    }
    await this.#onEvent("idle");
  }
  /**
      Returns a promise that resolves when no tasks are running: `queue.pending === 0`.
  
      Unlike `.onIdle()`, it ignores queued tasks. Use it to let running tasks finish before you change shared state. A task that timed out, or whose `signal` aborted while it ran, no longer counts, although its function can still run.
  
      @example
      ```
      queue.pause();
      await queue.onPendingZero();
      // No tasks are running, but the queue can still have tasks
      ```
      */
  async onPendingZero() {
    if (this.#pending === 0) {
      return;
    }
    await this.#onEvent("pendingZero");
  }
  /**
      Returns a promise that resolves when the queue becomes rate-limited by `intervalCap`. If the queue is already rate-limited, it resolves immediately.
  
      Useful for backpressure, when tasks are added faster than they run.
  
      @example
      ```
      const queue = new PQueue({intervalCap: 5, interval: 1000});
  
      for (let index = 0; index < 10; index++) {
          queue.add(() => someTask());
      }
  
      await queue.onRateLimit();
      console.log('The queue is rate-limited');
      ```
      */
  async onRateLimit() {
    this.#updateRateLimitState();
    if (this.isRateLimited) {
      return;
    }
    await this.#onEvent("rateLimit");
  }
  /**
      Returns a promise that resolves when the queue is no longer rate-limited. If the queue is not rate-limited, it resolves immediately.
  
      @example
      ```
      const queue = new PQueue({intervalCap: 5, interval: 1000});
  
      for (let index = 0; index < 10; index++) {
          queue.add(() => someTask());
      }
  
      await queue.onRateLimitCleared();
      console.log('The rate limit is cleared');
      ```
      */
  async onRateLimitCleared() {
    this.#updateRateLimitState();
    if (!this.isRateLimited) {
      return;
    }
    await this.#onEvent("rateLimitCleared");
  }
  /**
      Returns a promise that rejects when a task fails: it throws, times out, or its `signal` aborts while it runs. It rejects with the error of the task, or with `null` if the error is `undefined`, like the `error` event.
  
      Use `Promise.race([queue.onError(), queue.onIdle()])` to stop at the first error, and to resolve normally when the queue becomes idle. Each call adds an `error` listener that stays until a task fails, so to get every error, for example in a loop, use the `error` event instead.
  
      Important: The promises returned by `.add()` still reject. Handle each of them (for example with `.catch(() => {})`) to prevent unhandled rejections.
  
      @example
      ```
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 2});
  
      // Do not start the remaining tasks. Pause in an `error` listener, because it runs before the next task starts, and the code after `await` runs later.
      queue.addEventListener('error', () => {
          queue.pause();
      }, {once: true});
  
      queue.add(() => fetchData(1)).catch(() => {});
      queue.add(() => fetchData(2)).catch(() => {});
      queue.add(() => fetchData(3)).catch(() => {});
  
      try {
          await Promise.race([
              queue.onError(),
              queue.onIdle()
          ]);
      } catch (error) {
          console.error('Queue failed:', error);
      }
      ```
      */
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  onError() {
    return new Promise((_resolve, reject) => {
      this.addEventListener("error", (event) => {
        reject(event.detail);
      }, { once: true });
    });
  }
  /**
  The number of tasks waiting to run.
  */
  get size() {
    return this.#queue.size;
  }
  /**
      The number of waiting tasks with the given `priority`.
  
      @example
      ```
      import PQueue from 'p-queue';
  
      const queue = new PQueue();
  
      // Paused, so the tasks stay queued. Without it they all start synchronously and the queue is empty by the time `sizeBy` reads it.
      queue.pause();
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦄', {priority: 0});
      queue.add(async () => '🦄', {priority: 1});
  
      console.log(queue.sizeBy({priority: 1}));
      //=> 2
  
      console.log(queue.sizeBy({priority: 0}));
      //=> 1
      ```
      */
  sizeBy(options) {
    return this.#queue.filter(options).length;
  }
  /**
  The number of running tasks.
  */
  get pending() {
    return this.#pending;
  }
  /**
  Whether the queue is paused.
  */
  get isPaused() {
    return this.#isPaused;
  }
  /**
  Whether the queue is rate-limited: the number of tasks started in the current interval, plus the tasks still running from earlier intervals with `carryoverIntervalCount`, has reached `intervalCap`, and tasks are waiting.
  */
  get isRateLimited() {
    return this.#isRateLimitedNow;
  }
  /**
      Whether tasks are waiting because all concurrency slots are in use, or because the queue is rate-limited.
  
      Useful to detect backpressure and tasks that hang.
  
      @example
      ```
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 2});
  
      // Backpressure
      if (queue.isSaturated) {
          await queue.onSizeLessThan(queue.concurrency);
      }
  
      // Monitoring
      setInterval(() => {
          if (queue.isSaturated) {
              console.warn(`Queue saturated: ${queue.pending} running, ${queue.size} waiting`);
          }
      }, 60000);
      ```
      */
  get isSaturated() {
    return this.#queue.size > 0 && (this.#pending >= this.#concurrency || this.isRateLimited);
  }
  /**
      An array with the running tasks. Each task has its `id`, `priority`, `startTime`, `timeout`, and `timeoutRemaining` (the milliseconds until it times out). Without a timeout, `timeout` and `timeoutRemaining` are `undefined`.
  
      @example
      ```
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 2, timeout: 10000});
  
      queue.add(() => fetchUser(123), {id: 'user-123'});
      queue.add(() => fetchPosts(456), {id: 'posts-456', priority: 1});
  
      console.log(queue.runningTasks);
      // => [{
      //   id: 'user-123',
      //   priority: 0,
      //   startTime: 1759253001716,
      //   timeout: 10000,
      //   timeoutRemaining: 10000
      // }, {
      //   id: 'posts-456',
      //   priority: 1,
      //   startTime: 1759253001716,
      //   timeout: 10000,
      //   timeoutRemaining: 10000
      // }]
      ```
      */
  get runningTasks() {
    return Array.from(this.#runningTasks, (task) => ({
      ...task,
      timeoutRemaining: task.timeout === void 0 ? void 0 : Math.max(0, task.startTime + task.timeout - Date.now())
    }));
  }
};
var TimeoutError = class extends DOMException {
  constructor(message) {
    super(message, "TimeoutError");
  }
};

// src/orchestration/canonical/KrnlQ.ts
var import_node_crypto2 = require("crypto");

// src/orchestration/canonical/model.ts
function validateOrchestrationDAG(steps) {
  const errors = [];
  const stepMap = /* @__PURE__ */ new Map();
  for (const step of steps) {
    if (!step.id || typeof step.id !== "string" || step.id.trim() === "") {
      errors.push("Step must have a non-empty string ID.");
      continue;
    }
    if (stepMap.has(step.id)) {
      errors.push(`Duplicate step ID detected: "${step.id}"`);
    }
    stepMap.set(step.id, step);
    if (step.timeoutPolicy) {
      if (typeof step.timeoutPolicy.timeoutMs !== "number" || step.timeoutPolicy.timeoutMs <= 0) {
        errors.push(`Step "${step.id}" has invalid timeoutMs: must be a positive number.`);
      }
    }
    if (step.retryPolicy) {
      if (typeof step.retryPolicy.maxAttempts !== "number" || step.retryPolicy.maxAttempts < 1) {
        errors.push(`Step "${step.id}" has invalid maxAttempts: must be >= 1.`);
      }
      if (step.retryPolicy.backoffMs !== void 0 && step.retryPolicy.backoffMs < 0) {
        errors.push(`Step "${step.id}" has negative backoffMs.`);
      }
      if (step.retryPolicy.initialDelayMs !== void 0 && step.retryPolicy.initialDelayMs < 0) {
        errors.push(`Step "${step.id}" has negative initialDelayMs.`);
      }
    }
    if (step.concurrency !== void 0 && (typeof step.concurrency !== "number" || step.concurrency < 1)) {
      errors.push(`Step "${step.id}" has invalid concurrency: must be >= 1.`);
    }
    if (step.type === "task" || step.type === "sequential") {
      if (!step.target && !step.handler) {
        errors.push(`Step "${step.id}" requires a non-empty target or handler.`);
      }
    }
  }
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepMap.has(dep)) {
          errors.push(`Step "${step.id}" depends on unknown step "${dep}".`);
        }
      }
    }
  }
  if (errors.length > 0) {
    return { valid: false, order: [], errors };
  }
  const inDegree = /* @__PURE__ */ new Map();
  const graph = /* @__PURE__ */ new Map();
  for (const step of steps) {
    inDegree.set(step.id, 0);
    graph.set(step.id, []);
  }
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        graph.get(dep)?.push(step.id);
      }
    }
  }
  const queue = [];
  for (const [id2, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id2);
  }
  const order = [];
  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }
  if (order.length !== steps.length) {
    errors.push("Circular dependency cycle detected in orchestration DAG.");
    return { valid: false, order: [], errors };
  }
  return { valid: true, order, errors: [] };
}

// src/orchestration/canonical/WorkerExecutionBoundary.ts
var WorkerExecutionBoundary = class _WorkerExecutionBoundary {
  constructor(workerId, handler) {
    this.workerId = workerId;
    this.handler = handler;
  }
  workerId;
  handler;
  async processJob(command, metadata) {
    if (!this.handler) {
      return {
        correlationId: command.correlationId,
        status: "COMPLETED",
        data: command.payload,
        executionTimestamp: Date.now()
      };
    }
    const context = {
      isWorkerContext: true,
      workerId: this.workerId,
      timestamp: Date.now(),
      correlationId: command.correlationId,
      metadata
    };
    _WorkerExecutionBoundary.assertWorkerContext(context);
    return await this.handler(command, context);
  }
  static assertWorkerContext(context) {
    if (!context || !context.isWorkerContext) {
      throw new Error(
        "[WorkerExecutionBoundary] Violation: DIRECT_CALL -> SERVICE_BOUNDARY is strictly forbidden. All operations must execute inside KrnlWorker context."
      );
    }
  }
};

// src/orchestration/canonical/KrnlWorkerPool.ts
var KrnlWorkerPool = class {
  constructor(queueName, workerId = `worker_${queueName}_${Math.random().toString(36).substring(2, 7)}`) {
    this.queueName = queueName;
    this.workerId = workerId;
    this.workerBoundary = new WorkerExecutionBoundary(this.workerId);
  }
  queueName;
  workerId;
  state = "created";
  activeJobsCount = 0;
  startedAt = Date.now();
  workerBoundary;
  getState() {
    return this.state;
  }
  getActiveJobs() {
    return this.activeJobsCount;
  }
  getWorkerBoundary() {
    return this.workerBoundary;
  }
  getInfo() {
    return {
      id: this.workerId,
      queueName: this.queueName,
      state: this.state,
      startedAt: this.startedAt,
      activeJobs: this.activeJobsCount
    };
  }
  start() {
    if (this.state === "stopped") {
      throw new Error(`[KrnlWorkerPool:${this.workerId}] Cannot start stopped worker.`);
    }
    this.state = "started";
  }
  createContext(correlationId, metadata) {
    return {
      isWorkerContext: true,
      workerId: this.workerId,
      timestamp: Date.now(),
      correlationId: correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`,
      metadata
    };
  }
  async runWithContext(correlationId, metadata, fn) {
    if (this.state === "stopped" || this.state === "draining") {
      throw new Error(`[KrnlWorkerPool:${this.workerId}] Worker is not accepting new jobs (state: ${this.state}).`);
    }
    this.state = "running";
    this.activeJobsCount++;
    const ctx = this.createContext(correlationId, metadata);
    WorkerExecutionBoundary.assertWorkerContext(ctx);
    try {
      return await fn(ctx);
    } finally {
      this.activeJobsCount--;
      if (this.activeJobsCount === 0 && this.state === "running") {
        this.state = "started";
      }
    }
  }
  async drain() {
    this.state = "draining";
    while (this.activeJobsCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  async stop() {
    await this.drain();
    this.state = "stopped";
  }
};

// src/orchestration/canonical/KrnlQ.ts
function generateSecureId(prefix) {
  try {
    return `${prefix}_${(0, import_node_crypto2.randomUUID)()}`;
  } catch {
    return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  }
}
var KrnlQueue = class {
  queueName;
  queue;
  workerPool;
  jobs = /* @__PURE__ */ new Map();
  idempotencyStore = /* @__PURE__ */ new Map();
  activeOrchestrations = /* @__PURE__ */ new Map();
  maxRetainedJobs;
  constructor(options = {}) {
    this.queueName = options.queueName ?? "krnl_default_queue";
    this.maxRetainedJobs = options.maxRetainedJobs ?? 1e3;
    const concurrency = options.concurrency ?? 10;
    this.queue = new PQueue({
      concurrency,
      autoStart: options.autoStart ?? true
    });
    this.workerPool = new KrnlWorkerPool(this.queueName);
    this.workerPool.start();
  }
  get concurrency() {
    return this.queue.concurrency;
  }
  set concurrency(value) {
    this.queue.concurrency = value;
  }
  get size() {
    return this.queue.size;
  }
  get pending() {
    return this.queue.pending;
  }
  get isPaused() {
    return this.queue.isPaused;
  }
  getWorkerBoundary() {
    return this.workerPool.getWorkerBoundary();
  }
  getWorkerPool() {
    return this.workerPool;
  }
  pause() {
    this.queue.pause();
  }
  resume() {
    this.queue.start();
  }
  clear() {
    this.queue.clear();
    for (const job of this.jobs.values()) {
      if (job.status === "waiting") {
        job.status = "cancelled";
        job.completedAt = Date.now();
        job.abortController.abort();
        const cancelErr = new Error("The operation was aborted");
        cancelErr.name = "AbortError";
        job.rejectPromise(cancelErr);
      }
    }
  }
  pruneJobs() {
    if (this.jobs.size <= this.maxRetainedJobs) return;
    const excess = this.jobs.size - this.maxRetainedJobs;
    let pruned = 0;
    for (const [id2, record] of this.jobs.entries()) {
      if (record.status === "completed" || record.status === "failed" || record.status === "cancelled") {
        this.jobs.delete(id2);
        pruned++;
        if (pruned >= excess) break;
      }
    }
  }
  async drain() {
    await this.queue.onIdle();
  }
  async shutdown(options = { drain: true }) {
    if (options.drain) {
      await this.drain();
    } else {
      this.clear();
    }
    for (const active of this.activeOrchestrations.values()) {
      active.abortController.abort();
      active.context.isCancelled = true;
    }
    this.activeOrchestrations.clear();
    await this.workerPool.stop();
  }
  async close() {
    await this.shutdown({ drain: false });
  }
  async dispose() {
    await this.shutdown({ drain: false });
  }
  async start() {
    this.resume();
  }
  async stop() {
    this.pause();
  }
  /**
   * Enqueues a job returning a strong handle.
   */
  enqueue(jobDef) {
    this.pruneJobs();
    const jobId = jobDef.id || generateSecureId("job");
    const abortController = new AbortController();
    if (jobDef.options?.abortSignal) {
      if (jobDef.options.abortSignal.aborted) {
        abortController.abort();
      } else {
        jobDef.options.abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
      }
    }
    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((res, rej) => {
      resolvePromise = res;
      rejectPromise = rej;
    });
    const record = {
      id: jobId,
      name: jobDef.name,
      status: "waiting",
      createdAt: Date.now(),
      abortController,
      resolvePromise,
      rejectPromise,
      promise
    };
    this.jobs.set(jobId, record);
    const priority = jobDef.options?.priority ?? 0;
    this.queue.add(
      async () => {
        if (record.status === "cancelled" || abortController.signal.aborted) {
          record.status = "cancelled";
          const cancelErr = new Error("The operation was aborted");
          cancelErr.name = "AbortError";
          rejectPromise(cancelErr);
          return;
        }
        record.status = "active";
        record.startedAt = Date.now();
        const idemKey = jobDef.options?.idempotencyKey;
        if (idemKey && this.idempotencyStore.has(idemKey)) {
          const cached = this.idempotencyStore.get(idemKey);
          record.status = cached.status === "COMPLETED" ? "completed" : "failed";
          record.completedAt = Date.now();
          if (cached.status === "COMPLETED") {
            record.result = cached.data;
            resolvePromise(cached.data);
          } else {
            record.error = cached.error;
            rejectPromise(new Error(cached.error));
          }
          return;
        }
        const retries = jobDef.options?.retries ?? 0;
        const maxAttempts = retries + 1;
        const timeoutMs = jobDef.options?.timeoutMs;
        const backoffMs = jobDef.options?.backoffMs ?? 100;
        const backoffPolicy = jobDef.options?.backoffPolicy ?? "exponential";
        let attempt = 0;
        let lastError;
        while (attempt < maxAttempts) {
          if (abortController.signal.aborted) {
            record.status = "cancelled";
            const cancelErr = new Error("The operation was aborted");
            cancelErr.name = "AbortError";
            rejectPromise(cancelErr);
            return;
          }
          attempt++;
          try {
            const result = await this.workerPool.runWithContext(
              jobDef.options?.correlationId,
              jobDef.options?.metadata,
              async (workerCtx) => {
                let timer;
                try {
                  const workPromise = jobDef.handler(jobDef.payload, workerCtx);
                  if (timeoutMs && timeoutMs > 0) {
                    const timeoutPromise = new Promise((_, rej) => {
                      timer = setTimeout(() => {
                        const err = new Error(`Job "${jobDef.name}" timed out after ${timeoutMs}ms.`);
                        err.name = "TimeoutError";
                        rej(err);
                      }, timeoutMs);
                    });
                    return await Promise.race([workPromise, timeoutPromise]);
                  }
                  return await workPromise;
                } finally {
                  if (timer) clearTimeout(timer);
                }
              }
            );
            record.status = "completed";
            record.completedAt = Date.now();
            record.result = result;
            if (idemKey) {
              this.idempotencyStore.set(idemKey, {
                correlationId: jobDef.options?.correlationId || jobId,
                status: "COMPLETED",
                data: result,
                executionTimestamp: Date.now()
              });
            }
            resolvePromise(result);
            return;
          } catch (err) {
            lastError = err;
            if (abortController.signal.aborted || err?.name === "AbortError") {
              record.status = "cancelled";
              record.completedAt = Date.now();
              rejectPromise(err);
              return;
            }
            if (attempt < maxAttempts) {
              const delay = backoffPolicy === "exponential" ? backoffMs * Math.pow(2, attempt - 1) : backoffMs * attempt;
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }
        record.status = "failed";
        record.completedAt = Date.now();
        record.error = lastError?.message || String(lastError);
        if (idemKey) {
          this.idempotencyStore.set(idemKey, {
            correlationId: jobDef.options?.correlationId || jobId,
            status: "FAILED",
            error: record.error,
            executionTimestamp: Date.now()
          });
        }
        rejectPromise(lastError);
      },
      { priority }
    );
    return {
      id: jobId,
      name: jobDef.name,
      getStatus: () => record.status,
      result: () => record.promise,
      cancel: () => this.cancel(jobId)
    };
  }
  cancel(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      return false;
    }
    job.status = "cancelled";
    job.abortController.abort();
    return true;
  }
  getJob(jobId) {
    return this.jobs.get(jobId);
  }
  /**
   * Dispatches a single command through the KrnlQ worker boundary.
   */
  async executeCommand(command, handler) {
    if (command.idempotencyKey && this.idempotencyStore.has(command.idempotencyKey)) {
      return this.idempotencyStore.get(command.idempotencyKey);
    }
    try {
      const handle = this.enqueue({
        id: command.id,
        name: command.type,
        payload: command.payload,
        handler,
        options: {
          idempotencyKey: command.idempotencyKey,
          correlationId: command.correlationId
        }
      });
      const data = await handle.result();
      const res = {
        correlationId: command.correlationId,
        status: "COMPLETED",
        data,
        executionTimestamp: Date.now()
      };
      return res;
    } catch (err) {
      const isAbort = err?.name === "AbortError" || err?.message === "The operation was aborted";
      const res = {
        correlationId: command.correlationId,
        status: isAbort ? "CANCELLED" : "FAILED",
        error: err?.message || String(err),
        executionTimestamp: Date.now()
      };
      return res;
    }
  }
  /**
   * Executes a full Canonical Orchestration DAG through KrnlQ and worker boundary.
   * This is a first-class queued job scheduled via this.enqueue() to respect concurrency and worker limits.
   */
  async executeOrchestration(descriptor, steps, input, options = {}) {
    const startedAt = Date.now();
    const correlationId = options.correlationId || generateSecureId("corr");
    const executionId = generateSecureId("exec");
    if (options.idempotencyKey && this.idempotencyStore.has(options.idempotencyKey)) {
      const cached = this.idempotencyStore.get(options.idempotencyKey);
      return cached.data;
    }
    const validation = validateOrchestrationDAG(steps);
    if (!validation.valid) {
      return {
        orchestrationId: descriptor.id,
        correlationId,
        status: "FAILED",
        stepResults: {},
        error: `Invalid DAG: ${validation.errors.join("; ")}`,
        startedAt,
        completedAt: Date.now(),
        executionMetadata: { validationErrors: validation.errors }
      };
    }
    const abortController = new AbortController();
    if (options.abortSignal) {
      if (options.abortSignal.aborted) {
        abortController.abort();
      } else {
        options.abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
      }
    }
    const context = {
      correlationId,
      parentCorrelationId: options.parentCorrelationId,
      orchestrationId: descriptor.id,
      executionId,
      idempotencyKey: options.idempotencyKey,
      scope: descriptor.scope || "functionality",
      results: { input },
      metadata: { ...options.metadata },
      timestamp: startedAt,
      isCancelled: abortController.signal.aborted,
      abortSignal: abortController.signal
    };
    abortController.signal.addEventListener("abort", () => {
      context.isCancelled = true;
    });
    this.activeOrchestrations.set(executionId, { abortController, context });
    const handle = this.enqueue({
      id: executionId,
      name: descriptor.name || descriptor.id,
      payload: input,
      options: {
        idempotencyKey: options.idempotencyKey,
        correlationId,
        metadata: options.metadata,
        abortSignal: abortController.signal
      },
      handler: async () => {
        const timeoutMs = options.timeoutMs || descriptor.timeoutMs;
        let timeoutTimer;
        let isWorkflowTimeout = false;
        if (timeoutMs && timeoutMs > 0) {
          timeoutTimer = setTimeout(() => {
            isWorkflowTimeout = true;
            context.isCancelled = true;
            abortController.abort();
          }, timeoutMs);
        }
        const stepResults = {};
        const executedSteps = /* @__PURE__ */ new Set();
        const executedComps = [];
        let finalOutput = void 0;
        let orchestrationStatus = "COMPLETED";
        let errorMessage;
        try {
          while (executedSteps.size < steps.length) {
            if (context.isCancelled) {
              orchestrationStatus = "CANCELLED";
              errorMessage = "Orchestration execution cancelled.";
              break;
            }
            const readySteps = steps.filter((step) => {
              if (executedSteps.has(step.id)) return false;
              if (!step.dependsOn || step.dependsOn.length === 0) return true;
              return step.dependsOn.every((dep) => executedSteps.has(dep));
            });
            if (readySteps.length === 0) {
              break;
            }
            const batch = readySteps.slice(0, this.concurrency);
            const batchPromises = batch.map(async (step) => {
              const stepRes = await this.executeSingleStep(step, context, options.nestedRunner);
              stepResults[step.id] = stepRes;
              executedSteps.add(step.id);
              if (stepRes.status === "COMPLETED") {
                context.results[step.id] = stepRes.output;
                finalOutput = stepRes.output;
                if (step.compensation?.handler) {
                  executedComps.push(() => step.compensation.handler(context));
                }
              } else if (stepRes.status === "SKIPPED") {
              } else if (stepRes.status === "CANCELLED") {
                const cancelErr = new Error("The operation was aborted");
                cancelErr.name = "AbortError";
                throw cancelErr;
              } else {
                throw new Error(stepRes.error || `Step "${step.id}" failed with status ${stepRes.status}`);
              }
            });
            await Promise.all(batchPromises);
          }
        } catch (err) {
          const isExplicitStepFailure = err && err.name !== "AbortError" && err.message !== "The operation was aborted";
          const wasCancelled = (context.isCancelled || abortController.signal.aborted || err?.name === "AbortError") && !isExplicitStepFailure;
          if (isWorkflowTimeout) {
            orchestrationStatus = "TIMED_OUT";
            errorMessage = `Orchestration timed out after ${timeoutMs}ms.`;
          } else if (isExplicitStepFailure) {
            orchestrationStatus = "FAILED";
            errorMessage = err?.message || String(err);
          } else if (wasCancelled) {
            orchestrationStatus = "CANCELLED";
            errorMessage = "The operation was aborted";
          } else {
            orchestrationStatus = "FAILED";
            errorMessage = err?.message || String(err);
          }
          if (executedComps.length > 0) {
            for (let i = executedComps.length - 1; i >= 0; i--) {
              try {
                await executedComps[i]();
              } catch (compErr) {
                console.error(`[KrnlQ] Compensation failed:`, compErr);
              }
            }
          }
        } finally {
          if (timeoutTimer) clearTimeout(timeoutTimer);
          this.activeOrchestrations.delete(executionId);
        }
        const result = {
          orchestrationId: descriptor.id,
          correlationId,
          status: orchestrationStatus,
          output: finalOutput,
          stepResults,
          error: errorMessage,
          startedAt,
          completedAt: Date.now(),
          executionMetadata: {
            executionId,
            scope: descriptor.scope,
            stepsCount: steps.length,
            executedCount: executedSteps.size
          }
        };
        if (options.idempotencyKey) {
          this.idempotencyStore.set(options.idempotencyKey, {
            correlationId,
            status: orchestrationStatus === "COMPLETED" ? "COMPLETED" : "FAILED",
            data: result,
            executionTimestamp: Date.now()
          });
        }
        return result;
      }
    });
    return await handle.result();
  }
  async executeSingleStep(step, context, nestedRunner) {
    const stepStart = Date.now();
    let attempts = 0;
    const maxAttempts = step.retryPolicy?.maxAttempts ?? 1;
    if (step.condition) {
      try {
        const conditionPass = await step.condition(context);
        if (!conditionPass) {
          return {
            stepId: step.id,
            status: "SKIPPED",
            attempts: 0,
            startedAt: stepStart,
            completedAt: Date.now()
          };
        }
      } catch (condErr) {
        return {
          stepId: step.id,
          status: "FAILED",
          attempts: 1,
          error: `Condition evaluation failed: ${condErr?.message || String(condErr)}`,
          startedAt: stepStart,
          completedAt: Date.now()
        };
      }
    }
    let lastError;
    let stepCancelled = false;
    const stepTimeoutMs = step.timeoutPolicy?.timeoutMs;
    while (attempts < maxAttempts) {
      if (context.isCancelled) {
        return {
          stepId: step.id,
          status: "CANCELLED",
          attempts,
          startedAt: stepStart,
          completedAt: Date.now()
        };
      }
      attempts++;
      const stepAbortController = new AbortController();
      if (context.abortSignal) {
        if (context.abortSignal.aborted) {
          stepAbortController.abort();
        } else {
          context.abortSignal.addEventListener("abort", () => stepAbortController.abort(), { once: true });
        }
      }
      const stepContext = {
        ...context,
        abortSignal: stepAbortController.signal
      };
      try {
        let stepOutput;
        let stepTimer;
        stepCancelled = false;
        const runPromise = (async () => {
          if (step.type === "nested" && step.nestedOrchestrationId && nestedRunner) {
            const childContext = {
              ...stepContext,
              parentCorrelationId: context.correlationId,
              correlationId: `${context.correlationId}.${step.id}`
            };
            return await nestedRunner(step.nestedOrchestrationId, context.results, childContext);
          }
          if (step.type === "fanOut" && step.getItems) {
            const items = await step.getItems(stepContext);
            if (!Array.isArray(items)) throw new Error(`[fanOut] getItems must return an array.`);
            const concurrency = step.concurrency || 5;
            const results = [];
            for (let i = 0; i < items.length; i += concurrency) {
              const slice = items.slice(i, i + concurrency);
              const sliceRes = await Promise.all(
                slice.map((item) => step.handler ? step.handler(item, stepContext) : Promise.resolve(item))
              );
              results.push(...sliceRes);
            }
            return results;
          }
          if (step.handler) {
            return await step.handler(context.results, stepContext);
          }
          return context.results;
        })();
        const abortPromise = new Promise((_, reject) => {
          if (stepAbortController.signal.aborted || context.isCancelled) {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          }
          stepAbortController.signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
        const promisesToRace = [runPromise, abortPromise];
        if (stepTimeoutMs && stepTimeoutMs > 0) {
          const timeoutPromise = new Promise((_, reject) => {
            stepTimer = setTimeout(() => {
              stepCancelled = true;
              const tErr = new Error(`Step "${step.id}" timed out after ${stepTimeoutMs}ms.`);
              tErr.name = "TimeoutError";
              reject(tErr);
            }, stepTimeoutMs);
          });
          promisesToRace.push(timeoutPromise);
        }
        stepOutput = await Promise.race(promisesToRace);
        if (stepTimer) clearTimeout(stepTimer);
        return {
          stepId: step.id,
          status: "COMPLETED",
          attempts,
          output: stepOutput,
          startedAt: stepStart,
          completedAt: Date.now()
        };
      } catch (err) {
        if (stepCancelled || err?.name === "TimeoutError") {
          return {
            stepId: step.id,
            status: "TIMED_OUT",
            attempts,
            error: err?.message || `Step "${step.id}" timed out after ${stepTimeoutMs}ms.`,
            startedAt: stepStart,
            completedAt: Date.now()
          };
        }
        if (context.isCancelled || context.abortSignal?.aborted || err?.name === "AbortError" || err?.message === "Operation cancelled" || err?.message === "The operation was aborted") {
          return {
            stepId: step.id,
            status: "CANCELLED",
            attempts,
            startedAt: stepStart,
            completedAt: Date.now()
          };
        }
        lastError = err;
        if (step.catchHandler && attempts >= maxAttempts) {
          try {
            const recovered = await step.catchHandler(err, stepContext);
            return {
              stepId: step.id,
              status: "COMPLETED",
              attempts,
              output: recovered,
              startedAt: stepStart,
              completedAt: Date.now()
            };
          } catch (catchErr) {
            lastError = catchErr;
          }
        }
        if (attempts < maxAttempts && step.retryPolicy) {
          const backoffDelay = this.computeBackoff(step.retryPolicy, attempts);
          await new Promise((r) => setTimeout(r, backoffDelay));
        }
      }
    }
    return {
      stepId: step.id,
      status: "FAILED",
      attempts,
      error: lastError?.message || String(lastError),
      startedAt: stepStart,
      completedAt: Date.now()
    };
  }
  computeBackoff(policy, attempt) {
    const base = policy.backoffMs || 100;
    let delay;
    if (policy.backoff === "exponential") {
      delay = base * Math.pow(2, attempt - 1);
    } else {
      delay = base * attempt;
    }
    if (policy.maxBackoffMs && delay > policy.maxBackoffMs) {
      delay = policy.maxBackoffMs;
    }
    if (policy.jitter) {
      delay += Math.floor(Math.random() * (base * 0.5));
    }
    return delay;
  }
  cancelExecution(executionId) {
    const active = this.activeOrchestrations.get(executionId);
    if (active) {
      active.context.isCancelled = true;
      active.abortController.abort();
      return true;
    }
    return false;
  }
};

// src/services/ServiceFacade.ts
var ServiceFacade = class {
  id;
  name;
  version;
  description;
  functionalities;
  functionalityOrchestrations;
  libraries;
  dependencies;
  capabilities;
  defaultFrontend;
  instance;
  queue;
  telemetry;
  constructor(config) {
    if (!config || !config.id || typeof config.id !== "string") {
      throw new Error("[ServiceFacade] ServiceFacade requires a valid id.");
    }
    this.id = config.id;
    this.name = config.name || config.id;
    this.version = config.version || "1.0.0";
    this.description = config.description || "";
    this.functionalities = {};
    for (const [name, functionality] of Object.entries(config.functionalities ?? {})) {
      this.registerFunctionality(name, functionality);
    }
    this.functionalityOrchestrations = config.functionalityOrchestrations ? { ...config.functionalityOrchestrations } : config.orchestrations ? { ...config.orchestrations } : {};
    this.libraries = config.libraries ? { ...config.libraries } : {};
    this.dependencies = Object.freeze(config.dependencies ? [...config.dependencies] : []);
    this.capabilities = Object.freeze(config.capabilities ? [...config.capabilities] : []);
    this.defaultFrontend = config.defaultFrontend ? Object.freeze({ ...config.defaultFrontend }) : void 0;
    if (config.instance) {
      this.instance = config.instance;
    } else if (config.definition) {
      this.instance = new ServiceInstance(config.definition);
    } else {
      this.instance = new ServiceInstance({
        id: this.id,
        name: this.name,
        version: this.version,
        operations: {}
      });
    }
    this.telemetry = this.instance.telemetry;
    this.queue = new KrnlQueue({
      queueName: `krnl_queue_${this.id}`,
      concurrency: config.concurrency ?? config.queueOptions?.concurrency ?? 10,
      autoStart: config.queueOptions?.autoStart ?? true
    });
  }
  get orchestrations() {
    return this.functionalityOrchestrations;
  }
  getInstance() {
    return this.instance;
  }
  getQueue() {
    return this.queue;
  }
  getExecutionEngine() {
    return this.queue;
  }
  getWorkerBoundary() {
    return this.queue.getWorkerBoundary();
  }
  getStatus() {
    return this.instance.getStatus();
  }
  async start() {
    await this.instance.start();
    await this.queue.start();
  }
  async stop() {
    await this.queue.stop();
    await this.instance.stop();
  }
  async dispose() {
    await this.queue.dispose();
    await this.instance.dispose();
  }
  /**
   * External caller callable boundary for single functionality / operation execution.
   * Path: External Caller -> Service Facade -> KrnlQ Job -> Worker -> Functionality -> Result.
   * Strictly avoids synchronous unmediated execution outside the queue.
   */
  async call(op, input, ctx) {
    const correlationId = ctx?.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const telemetryParent = typeof ctx?.metadata?.__krnlTelemetryParentSpanId === "string" ? ctx.metadata.__krnlTelemetryParentSpanId : void 0;
    const telemetryHandle = this.telemetry.begin(op, "service", correlationId, telemetryParent);
    const commandId = `cmd_${this.id}_${op}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const command = {
      id: commandId,
      type: `${this.id}.${op}`,
      payload: input ?? {},
      correlationId,
      idempotencyKey: ctx?.idempotencyKey,
      createdAt: Date.now()
    };
    try {
      const result = await this.queue.executeCommand(command, async (payload, workerCtx) => {
        WorkerExecutionBoundary.assertWorkerContext(workerCtx);
        const functionality = this.functionalities[op];
        if (functionality) {
          const functionalityTelemetry = this.telemetry.begin(
            functionality.name,
            "functionality",
            workerCtx.correlationId,
            telemetryHandle.spanId
          );
          try {
            return await functionality.execute(payload, {
              serviceId: this.id,
              functionalityId: functionality.id,
              correlationId: workerCtx.correlationId,
              state: this.instance.getState()
            });
          } catch (error) {
            functionalityTelemetry.end(error);
            throw error;
          } finally {
            functionalityTelemetry.end();
          }
        }
        return await this.instance.call(op, payload, {
          correlationId: workerCtx.correlationId,
          idempotencyKey: command.idempotencyKey,
          metadata: { __krnlTelemetryInternal: true }
        });
      });
      if (result.status === "FAILED") {
        const error = new Error(result.error || `[ServiceFacade:${this.id}] Operation '${op}' execution failed.`);
        telemetryHandle.end(error);
        throw error;
      }
      telemetryHandle.end();
      return result.data;
    } catch (error) {
      telemetryHandle.end(error);
      throw error;
    }
  }
  /**
   * External caller callable boundary for functionality orchestration execution.
   * Path: External Caller -> Service Facade -> KrnlQ Command -> Worker -> FunctionalityOrchestration -> Result.
   */
  async orchestrate(orchestrationName, input, options = {}) {
    const orch = this.functionalityOrchestrations[orchestrationName];
    if (!orch) {
      throw new Error(
        `[ServiceFacade:${this.id}] FunctionalityOrchestration "${orchestrationName}" not found.`
      );
    }
    const correlationId = options.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const serviceTelemetryHandle = this.telemetry.begin(
      `orchestrate:${orchestrationName}`,
      "service",
      correlationId,
      typeof options.metadata?.__krnlTelemetryParentSpanId === "string" ? options.metadata.__krnlTelemetryParentSpanId : void 0
    );
    const telemetryHandle = this.telemetry.begin(
      orchestrationName,
      "orchestration",
      correlationId,
      serviceTelemetryHandle.spanId
    );
    const commandId = `cmd_orch_${this.id}_${orchestrationName}_${Date.now()}`;
    const command = {
      id: commandId,
      type: `${this.id}.orchestrations.${orchestrationName}`,
      payload: input ?? {},
      correlationId,
      idempotencyKey: options.idempotencyKey,
      createdAt: Date.now()
    };
    orch.events.emit("triggered", {
      serviceId: this.id,
      orchestrationId: orch.id,
      orchestrationName: orch.name,
      correlationId,
      timestamp: Date.now()
    });
    const cmdResult = await this.queue.executeCommand(
      command,
      async (payload, workerCtx) => {
        WorkerExecutionBoundary.assertWorkerContext(workerCtx);
        const resolveStepInput = (step, results) => {
          const deps = step.dependsOn;
          if (!deps || deps.length === 0) {
            return results["input"];
          }
          if (deps.length === 1) {
            const depRes = results[deps[0]];
            const initialInput = results["input"];
            if (typeof depRes === "object" && depRes !== null && typeof initialInput === "object" && initialInput !== null && !Array.isArray(depRes) && !Array.isArray(initialInput)) {
              return { ...initialInput, ...depRes };
            }
            return depRes !== void 0 ? depRes : results["input"];
          }
          const joined = {};
          for (const dep of deps) {
            joined[dep] = results[dep];
          }
          return joined;
        };
        const rawSteps = orch.getSteps();
        const boundSteps = rawSteps.map((s) => {
          let compensation = s.compensation;
          if (s.compensation?.target && !s.compensation.handler) {
            compensation = {
              ...s.compensation,
              handler: async (compCtx) => {
                await this.call(s.compensation.target, compCtx.results[s.id], {
                  correlationId: compCtx.correlationId,
                  metadata: { __krnlTelemetryParentSpanId: telemetryHandle.spanId }
                });
              }
            };
          }
          if (s.type === "task" && s.target) {
            return {
              ...s,
              compensation,
              handler: async (_stepInput, stepCtx) => {
                const resolvedInput = resolveStepInput(s, stepCtx.results);
                const stepPayload = typeof resolvedInput === "object" && resolvedInput !== null && !Array.isArray(resolvedInput) ? { ...stepCtx.results, ...resolvedInput } : { ...stepCtx.results };
                if (stepCtx.results.input) {
                  stepPayload.input = stepCtx.results.input;
                }
                return await this.call(s.target, stepPayload, {
                  correlationId: stepCtx.correlationId,
                  metadata: { __krnlTelemetryParentSpanId: telemetryHandle.spanId }
                });
              }
            };
          }
          return {
            ...s,
            compensation
          };
        });
        const nestedRunner = async (childOrchId, childInput, childCtx) => {
          const childOrch = this.functionalityOrchestrations[childOrchId];
          if (!childOrch) {
            throw new Error(
              `[ServiceFacade:${this.id}] Nested FunctionalityOrchestration "${childOrchId}" not found in service.`
            );
          }
          const nestedResult = await this.orchestrate(childOrchId, childInput, {
            correlationId: childCtx.correlationId,
            timeoutMs: childOrch.timeoutMs,
            abortSignal: options.abortSignal,
            metadata: { __krnlTelemetryParentSpanId: telemetryHandle.spanId }
          });
          if (nestedResult.status !== "COMPLETED") {
            throw new Error(nestedResult.error || `Nested orchestration "${childOrchId}" failed.`);
          }
          return nestedResult.output;
        };
        return await this.queue.executeOrchestration(
          { id: orch.id, name: orch.name, version: orch.version, timeoutMs: orch.timeoutMs, scope: "functionality" },
          boundSteps,
          payload,
          {
            correlationId: workerCtx.correlationId,
            idempotencyKey: command.idempotencyKey,
            timeoutMs: options.timeoutMs || orch.timeoutMs,
            metadata: options.metadata,
            nestedRunner,
            abortSignal: options.abortSignal
          }
        );
      }
    );
    const orchestrationResult = cmdResult.data;
    if (cmdResult.status === "COMPLETED" && orchestrationResult) {
      const lifecycleEvent = orchestrationResult.status === "COMPLETED" ? "completed" : "failed";
      orch.events.emit(lifecycleEvent, {
        serviceId: this.id,
        orchestrationId: orch.id,
        orchestrationName: orch.name,
        correlationId,
        executionId: String(orchestrationResult.executionMetadata.executionId ?? ""),
        timestamp: Date.now(),
        status: orchestrationResult.status,
        output: orchestrationResult.output,
        error: orchestrationResult.error
      });
    } else {
      orch.events.emit("failed", {
        serviceId: this.id,
        orchestrationId: orch.id,
        orchestrationName: orch.name,
        correlationId,
        timestamp: Date.now(),
        status: cmdResult.status,
        error: cmdResult.error
      });
    }
    if (cmdResult.status === "FAILED" || orchestrationResult?.status === "FAILED") {
      const error = new Error(orchestrationResult?.error || cmdResult.error || `[ServiceFacade:${this.id}] Orchestration failed.`);
      telemetryHandle.end(error);
      serviceTelemetryHandle.end(error);
      throw error;
    }
    telemetryHandle.end();
    serviceTelemetryHandle.end();
    return cmdResult.data;
  }
  /**
   * Executes a callable operation or orchestration through KrnlQ and worker boundary.
   * Path: External Caller -> Service Facade -> KrnlQ Command -> Worker -> Functionality / Orchestration -> Result.
   * Strictly queue-mediated; zero unmediated bypasses.
   */
  async execute(target, input, options) {
    if (this.functionalityOrchestrations[target]) {
      const res = await this.orchestrate(target, input, options);
      if (res.status === "FAILED") {
        throw new Error(res.error || `[ServiceFacade:${this.id}] Orchestration "${target}" failed.`);
      }
      return res;
    }
    return this.call(target, input, {
      correlationId: options?.correlationId,
      idempotencyKey: options?.idempotencyKey
    });
  }
  getState() {
    return this.instance.getState();
  }
  setState(mutation) {
    this.instance.setState(mutation);
  }
  getFunctionality(name) {
    const functionality = this.functionalities[name];
    if (!functionality) {
      throw new Error(`[ServiceFacade:${this.id}] Functionality "${name}" not found.`);
    }
    return functionality;
  }
  registerFunctionality(name, functionality, options = {}) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] Functionality name must be a non-empty string.");
    }
    if (functionality instanceof FunctionalityFacade) {
      this.functionalities[name] = functionality;
      return this;
    }
    if (!functionality || typeof functionality !== "object" || typeof functionality.execute !== "function") {
      throw new Error(`[ServiceFacade:${this.id}] Functionality "${name}" must define execute().`);
    }
    this.functionalities[name] = new FunctionalityFacade(
      name,
      functionality,
      options
    );
    return this;
  }
  registerFunctionalityOrchestration(name, orchestration) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] FunctionalityOrchestration name must be a non-empty string.");
    }
    if (!orchestration) {
      throw new Error("[ServiceFacade] FunctionalityOrchestration instance is required.");
    }
    this.functionalityOrchestrations[name] = orchestration;
    return this;
  }
  /** @deprecated Use registerFunctionalityOrchestration */
  registerOrchestration(name, orchestration) {
    return this.registerFunctionalityOrchestration(name, orchestration);
  }
  registerLibrary(name, library) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] Library name must be a non-empty string.");
    }
    if (library === void 0 || library === null) {
      throw new Error(`[ServiceFacade] Library "${name}" must not be null or undefined.`);
    }
    this.libraries[name] = library;
    return this;
  }
  getLibrary(name) {
    const lib = this.libraries[name];
    if (lib === void 0 || lib === null) {
      throw new Error(`[ServiceFacade:${this.id}] Library "${name}" not found on service facade.`);
    }
    return lib;
  }
  get namespace() {
    return this.getNamespace();
  }
  getNamespace() {
    const bubbledFunctionalities = {};
    for (const [name, functionality] of Object.entries(this.functionalities)) {
      if (functionality.bubbleEvents) bubbledFunctionalities[name] = functionality;
    }
    const bubbledOrchestrations = {};
    for (const [name, orchestration] of Object.entries(this.functionalityOrchestrations)) {
      if (orchestration.bubbleEvents) bubbledOrchestrations[name] = orchestration;
    }
    return {
      serviceId: this.id,
      serviceName: this.name,
      version: this.version,
      description: this.description,
      libraries: { ...this.libraries },
      functionalities: bubbledFunctionalities,
      functionalityOrchestrations: bubbledOrchestrations,
      capabilities: this.capabilities,
      dependencies: this.dependencies
    };
  }
  getServiceFacadeMetadata() {
    return this.getNamespace();
  }
};
function createServiceFacade(config) {
  return new ServiceFacade(config);
}

// src/protocols/HttpProtocolAdapter.ts
var import_http = __toESM(require("http"), 1);
var HttpProtocolAdapter = class {
  protocol = "http";
  capabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: false,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false
  };
  server;
  listeningPort;
  async listen(port, host = "127.0.0.1") {
    this.server = import_http.default.createServer();
    await new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        const addr = this.server.address();
        this.listeningPort = addr.port;
        resolve();
      });
      this.server.on("error", reject);
    });
    return {
      protocol: "http",
      address: host,
      port: this.listeningPort,
      capabilities: ["requestResponse", "streaming"]
    };
  }
  async expose(service, port = 0) {
    this.server = import_http.default.createServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      if (url.pathname === "/manifest") {
        res.writeHead(200);
        res.end(JSON.stringify(service.getDefinition()));
        return;
      }
      if (url.pathname === "/health") {
        res.writeHead(200);
        res.end(JSON.stringify({ status: "ok", service: service.name }));
        return;
      }
      if (url.pathname.startsWith("/call/")) {
        const op = url.pathname.slice("/call/".length);
        let body = "";
        req.on("data", (c) => body += c);
        req.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await service.call(op, parsed);
            res.writeHead(200);
            res.end(JSON.stringify({ status: "success", payload: result }));
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ status: "error", error: err.message || String(err) }));
          }
        });
        return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Route not found" }));
    });
    await new Promise((resolve, reject) => {
      this.server.listen(port, "127.0.0.1", () => {
        const addr = this.server.address();
        this.listeningPort = addr.port;
        resolve();
      });
      this.server.on("error", reject);
    });
    return {
      protocol: "http",
      address: "127.0.0.1",
      port: this.listeningPort,
      capabilities: ["requestResponse", "streaming"]
    };
  }
  async send(endpoint, envelope) {
    const url = `http://${endpoint.address}:${endpoint.port}/call/${envelope.operation}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope.payload || {})
    });
    const json = await res.json();
    return {
      id: `res-${Date.now()}`,
      type: "response",
      correlationId: envelope.id,
      payload: json.payload,
      error: json.error,
      timestamp: Date.now()
    };
  }
  async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(() => resolve()));
      this.server = void 0;
    }
  }
};

// src/protocols/WebSocketProtocolAdapter.ts
var WebSocketProtocolAdapter = class {
  protocol = "ws";
  capabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: true,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false
  };
  server;
  wss;
  port;
  async expose(service, port = 0) {
    const httpMod = await import("http");
    const http2 = httpMod.default || httpMod;
    const wsMod = await import("ws").catch(() => null);
    if (!wsMod) {
      throw new Error('WebSocketProtocolAdapter.expose requires "ws" package in Node.js environment.');
    }
    const WebSocketServer = wsMod.WebSocketServer || wsMod.default?.WebSocketServer || wsMod.Server;
    this.server = http2.createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.wss.on("connection", (ws) => {
      ws.on("message", async (raw) => {
        try {
          const envelope = JSON.parse(raw.toString());
          if (envelope.type === "request" && envelope.operation) {
            try {
              const res = await service.call(envelope.operation, envelope.payload);
              ws.send(JSON.stringify({
                id: `res-${Date.now()}`,
                type: "response",
                correlationId: envelope.id,
                payload: res,
                timestamp: Date.now()
              }));
            } catch (err) {
              ws.send(JSON.stringify({
                id: `res-${Date.now()}`,
                type: "response",
                correlationId: envelope.id,
                error: err.message || String(err),
                timestamp: Date.now()
              }));
            }
          }
        } catch (_) {
        }
      });
    });
    await new Promise((resolve, reject) => {
      this.server.listen(port, "127.0.0.1", () => {
        const addr = this.server.address();
        this.port = addr.port;
        resolve();
      });
      this.server.on("error", reject);
    });
    return {
      protocol: "ws",
      address: "127.0.0.1",
      port: this.port,
      capabilities: ["requestResponse", "pubSub", "streaming"]
    };
  }
  async send(endpoint, envelope) {
    let WS;
    const isNode = Boolean(globalThis.process?.versions?.node);
    if (isNode) {
      const wsMod = await import("ws").catch(() => null);
      WS = wsMod?.WebSocket || wsMod?.default?.WebSocket || wsMod?.default || wsMod;
    }
    if (!WS) {
      WS = globalThis.WebSocket;
    }
    if (!WS) {
      throw new Error("No WebSocket client implementation available in this environment.");
    }
    return new Promise((resolve, reject) => {
      const ws = new WS(`ws://${endpoint.address}:${endpoint.port}`);
      ws.on("open", () => {
        ws.send(JSON.stringify(envelope));
      });
      ws.on("message", (data) => {
        try {
          const res = JSON.parse(data.toString());
          ws.close();
          resolve(res);
        } catch (e) {
          ws.close();
          reject(e);
        }
      });
      ws.on("error", (err) => {
        reject(err);
      });
    });
  }
  async stop() {
    if (this.wss) {
      await new Promise((r) => this.wss.close(() => r()));
      this.wss = void 0;
    }
    if (this.server) {
      await new Promise((r) => this.server.close(() => r()));
      this.server = void 0;
    }
  }
};

// src/protocols/UdpProtocolAdapter.ts
var import_dgram = __toESM(require("dgram"), 1);
var UdpProtocolAdapter = class {
  protocol = "udp";
  capabilities = {
    requestResponse: true,
    streaming: false,
    pubSub: false,
    datagram: true,
    peerToPeer: false,
    signaling: false,
    discovery: true
  };
  socket;
  port;
  async expose(service, port = 0) {
    this.socket = import_dgram.default.createSocket("udp4");
    this.socket.on("message", async (msg, rinfo) => {
      try {
        const envelope = JSON.parse(msg.toString());
        if (envelope.type === "request" && envelope.operation) {
          try {
            const res = await service.call(envelope.operation, envelope.payload);
            const resp = JSON.stringify({
              id: `res-${Date.now()}`,
              type: "response",
              correlationId: envelope.id,
              payload: res,
              timestamp: Date.now()
            });
            this.socket.send(resp, rinfo.port, rinfo.address);
          } catch (err) {
            const resp = JSON.stringify({
              id: `res-${Date.now()}`,
              type: "response",
              correlationId: envelope.id,
              error: err.message || String(err),
              timestamp: Date.now()
            });
            this.socket.send(resp, rinfo.port, rinfo.address);
          }
        }
      } catch (_) {
      }
    });
    await new Promise((resolve) => {
      this.socket.bind(port, "127.0.0.1", () => {
        this.port = this.socket.address().port;
        resolve();
      });
    });
    return {
      protocol: "udp",
      address: "127.0.0.1",
      port: this.port,
      capabilities: ["datagram", "requestResponse"]
    };
  }
  async send(endpoint, envelope) {
    return new Promise((resolve, reject) => {
      const client = import_dgram.default.createSocket("udp4");
      const payload = Buffer.from(JSON.stringify(envelope));
      client.on("message", (msg) => {
        try {
          const res = JSON.parse(msg.toString());
          client.close();
          resolve(res);
        } catch (e) {
          client.close();
          reject(e);
        }
      });
      client.on("error", (err) => {
        client.close();
        reject(err);
      });
      client.send(payload, endpoint.port, endpoint.address);
    });
  }
  async stop() {
    if (this.socket) {
      await new Promise((r) => this.socket.close(() => r()));
      this.socket = void 0;
    }
  }
};

// src/protocols/P2PProtocolAdapter.ts
var P2PProtocolAdapter = class _P2PProtocolAdapter {
  protocol = "p2p";
  capabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: true,
    datagram: false,
    peerToPeer: true,
    signaling: true,
    discovery: true
  };
  static peerHub = /* @__PURE__ */ new Map();
  async expose(service) {
    _P2PProtocolAdapter.peerHub.set(service.id, service);
    return {
      protocol: "p2p",
      address: `p2p://${service.id}`,
      capabilities: ["peerToPeer", "requestResponse", "pubSub"]
    };
  }
  async send(endpoint, envelope) {
    const peerId = endpoint.address.replace("p2p://", "");
    const service = _P2PProtocolAdapter.peerHub.get(peerId);
    if (!service) {
      return {
        id: `res-${Date.now()}`,
        type: "response",
        correlationId: envelope.id,
        error: `Peer '${peerId}' not discovered or offline.`,
        timestamp: Date.now()
      };
    }
    try {
      const res = await service.call(envelope.operation || "", envelope.payload);
      return {
        id: `res-${Date.now()}`,
        type: "response",
        correlationId: envelope.id,
        payload: res,
        timestamp: Date.now()
      };
    } catch (err) {
      return {
        id: `res-${Date.now()}`,
        type: "response",
        correlationId: envelope.id,
        error: err.message || String(err),
        timestamp: Date.now()
      };
    }
  }
  async stop() {
    _P2PProtocolAdapter.peerHub.clear();
  }
};

// src/transports/MemoryTransport.ts
var MemoryTransport = class {
  handlers = /* @__PURE__ */ new Set();
  onMessage(handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
  async send(envelope) {
    for (const handler of this.handlers) {
      const res = await handler(envelope);
      if (res) return res;
    }
    return {
      id: `res-${Date.now()}`,
      type: "response",
      correlationId: envelope.id,
      payload: null,
      timestamp: Date.now()
    };
  }
};

// src/registry/ServiceRegistry.ts
var PROTOCOLS = ["http", "https", "ws", "wss", "udp", "p2p", "signaling", "memory"];
function validateEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== "object") throw new Error("[ServiceRegistry] Invalid endpoint.");
  if (!PROTOCOLS.includes(endpoint.protocol)) throw new Error("[ServiceRegistry] Unsupported endpoint protocol.");
  if (typeof endpoint.address !== "string" || endpoint.address.trim() === "") throw new Error("[ServiceRegistry] Endpoint address must be non-empty.");
  if (endpoint.port !== void 0 && (!Number.isInteger(endpoint.port) || endpoint.port < 0 || endpoint.port > 65535)) throw new Error("[ServiceRegistry] Endpoint port is invalid.");
  if (!Array.isArray(endpoint.capabilities)) throw new Error("[ServiceRegistry] Endpoint capabilities must be an array.");
}
var ServiceRegistry = class {
  services = /* @__PURE__ */ new Map();
  /**
   * Registers a service definition and its endpoints into the registry.
   *
   * @param definition Validated service definition.
   * @param endpoints Optional list of active endpoint descriptors.
   * @throws Error if definition or endpoints fail validation.
   * @throws Error if service is already registered under the same ID.
   */
  register(definition, endpoints = []) {
    validateServiceDefinition(definition);
    for (const endpoint of endpoints) validateEndpoint(endpoint);
    const existing = this.services.get(definition.id);
    if (existing) {
      throw new Error(
        "[ServiceRegistry] Service '" + definition.id + "' is already registered at version '" + existing.definition.version + "'. Use replace() to explicitly replace an existing service."
      );
    }
    this.services.set(definition.id, {
      definition,
      endpoints: endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: Date.now()
    });
  }
  /**
   * Explicitly replaces or updates a service definition and its endpoints in the registry.
   * Preserves original registeredAt timestamp if the service was previously registered.
   *
   * @param definition Validated service definition.
   * @param endpoints Optional list of active endpoint descriptors.
   */
  replace(definition, endpoints = []) {
    validateServiceDefinition(definition);
    for (const endpoint of endpoints) validateEndpoint(endpoint);
    const existing = this.services.get(definition.id);
    this.services.set(definition.id, {
      definition,
      endpoints: endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: existing?.registeredAt ?? Date.now()
    });
  }
  unregister(serviceId) {
    return this.services.delete(serviceId);
  }
  get(serviceId) {
    const record = this.services.get(serviceId);
    if (!record) return void 0;
    return {
      definition: record.definition,
      endpoints: record.endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: record.registeredAt
    };
  }
  list() {
    return Array.from(this.services.values()).map((record) => ({
      definition: record.definition,
      endpoints: record.endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: record.registeredAt
    }));
  }
  findByCapability(capabilityName) {
    return this.list().filter(
      (record) => record.definition.capabilities?.some((cap) => cap.name === capabilityName)
    );
  }
};

// src/runtime/ServiceRuntime.ts
var ServiceRuntime = class {
  instances = /* @__PURE__ */ new Map();
  registry;
  constructor(registry) {
    this.registry = registry ?? new ServiceRegistry();
  }
  register(service) {
    const existing = this.instances.get(service.id);
    if (existing && existing !== service) {
      throw new Error("[ServiceRuntime] Service '" + service.id + "' is already registered.");
    }
    this.registry.register(service.getDefinition());
    this.instances.set(service.id, service);
    return this;
  }
  unregister(serviceId) {
    const removed = this.instances.delete(serviceId);
    this.registry.unregister(serviceId);
    return removed;
  }
  get(serviceId) {
    return this.instances.get(serviceId);
  }
  list() {
    return Array.from(this.instances.values());
  }
  async execute(target, operation, input, ctx) {
    const service = this.instances.get(target);
    if (!service) {
      throw new Error("[ServiceRuntime] Target service '" + target + "' not found.");
    }
    return service.call(operation, input, ctx);
  }
  async startAll() {
    const started = [];
    try {
      for (const service of this.instances.values()) {
        await service.start();
        started.push(service);
      }
    } catch (error) {
      for (const service of started.reverse()) {
        try {
          await service.stop();
        } catch {
        }
      }
      throw error;
    }
  }
  async disposeAll() {
    let firstError;
    const services = Array.from(this.instances.values()).reverse();
    for (const service of services) {
      try {
        await service.dispose();
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) throw firstError;
  }
  async stopAll() {
    let firstError;
    const services = Array.from(this.instances.values()).reverse();
    for (const service of services) {
      try {
        await service.stop();
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) throw firstError;
  }
};

// src/discovery/ServiceDiscovery.ts
var ServiceDiscovery = class {
  peers = /* @__PURE__ */ new Map();
  registerPeer(id2, name, endpoints) {
    this.peers.set(id2, {
      id: id2,
      name,
      endpoints,
      lastSeen: Date.now()
    });
  }
  getPeers() {
    return Array.from(this.peers.values());
  }
  findPeer(id2) {
    return this.peers.get(id2);
  }
};

// src/discovery/KrnlPackageReconciler.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_gutts = require("@dinilmusick/gutts");
var KrnlPackageReconciler = class {
  /**
   * Scans all manifest.json files across backend and frontend and reconciles root package.json.
   */
  static reconcile(projectRoot = process.cwd(), writeChanges = true) {
    const manifests = this.findManifests(projectRoot);
    const aggregatedDeps = {};
    const aggregatedDevDeps = {};
    for (const mPath of manifests) {
      try {
        const raw = fs.readFileSync(mPath, "utf8");
        const json = (0, import_gutts.tryParseJson)(raw) ?? {};
        if (json.dependencies && typeof json.dependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.dependencies)) {
            if (!aggregatedDeps[pkg]) aggregatedDeps[pkg] = [];
            if (!aggregatedDeps[pkg].includes(String(ver))) {
              aggregatedDeps[pkg].push(String(ver));
            }
          }
        }
        if (json.devDependencies && typeof json.devDependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.devDependencies)) {
            if (!aggregatedDevDeps[pkg]) aggregatedDevDeps[pkg] = [];
            if (!aggregatedDevDeps[pkg].includes(String(ver))) {
              aggregatedDevDeps[pkg].push(String(ver));
            }
          }
        }
      } catch (err) {
        console.warn(`[KrnlPackageReconciler] Warning: Could not parse ${mPath}:`, err);
      }
    }
    const conflicts = [];
    const resolvedDeps = {};
    const resolvedDevDeps = {};
    for (const [pkg, versions] of Object.entries(aggregatedDeps)) {
      if (versions.length > 1) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDeps[pkg] = versions[versions.length - 1];
    }
    for (const [pkg, versions] of Object.entries(aggregatedDevDeps)) {
      if (versions.length > 1 && !conflicts.some((c) => c.package === pkg)) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDevDeps[pkg] = versions[versions.length - 1];
    }
    const pkgJsonPath = path.join(projectRoot, "package.json");
    let updated = false;
    if (fs.existsSync(pkgJsonPath)) {
      const pkgContent = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      pkgContent.dependencies = pkgContent.dependencies || {};
      pkgContent.devDependencies = pkgContent.devDependencies || {};
      let hasChanges = false;
      for (const [pkg, ver] of Object.entries(resolvedDeps)) {
        if (pkgContent.dependencies[pkg] !== ver) {
          pkgContent.dependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      for (const [pkg, ver] of Object.entries(resolvedDevDeps)) {
        if (!pkgContent.dependencies[pkg] && pkgContent.devDependencies[pkg] !== ver) {
          pkgContent.devDependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      if (hasChanges && writeChanges) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + "\n");
        updated = true;
        console.log(`[KrnlPackageReconciler] Reconciled package.json from ${manifests.length} manifest(s).`);
      }
    }
    return {
      updated,
      totalManifests: manifests.length,
      addedDependencies: resolvedDeps,
      addedDevDependencies: resolvedDevDeps,
      conflicts
    };
  }
  /**
   * Discovers all manifest.json files in krnl/ (or src/)
   */
  static findManifests(projectRoot) {
    const searchDirs = [
      path.join(projectRoot, "krnl", "backend", "services"),
      path.join(projectRoot, "krnl", "backend", "libraries"),
      path.join(projectRoot, "krnl", "backend", "functionalities"),
      path.join(projectRoot, "krnl", "frontend", "libraries"),
      path.join(projectRoot, "krnl", "frontend", "functionalities"),
      path.join(projectRoot, "src", "backend", "services"),
      path.join(projectRoot, "src", "services"),
      path.join(projectRoot, "src", "functionalities"),
      path.join(projectRoot, "src", "libraries")
    ];
    const found = [];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.scanRecursive(dir, found);
      }
    }
    return found;
  }
  static scanRecursive(dir, found) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.scanRecursive(full, found);
        } else if (entry.isFile() && entry.name === "manifest.json") {
          found.push(full);
        }
      }
    } catch {
    }
  }
};

// src/events/ServiceEventBus.ts
var ServiceEventBus = class extends EventBus {
};

// src/events/OrchestrationEventFacade.ts
var OrchestrationEventFacade = class {
  eventBus = new EventBus();
  events;
  constructor() {
    this.events = createEventChannels(this.eventBus, ["triggered", "completed", "failed"]);
  }
  get triggered() {
    return this.events.triggered;
  }
  get completed() {
    return this.events.completed;
  }
  get failed() {
    return this.events.failed;
  }
  emit(event, payload) {
    this.eventBus.emit(event, payload);
  }
  clear() {
    this.eventBus.clear();
  }
};

// src/connectivity/ProtocolResolver.ts
var ProtocolResolver = class {
  static selectProtocol(requiredCapabilities, availableEndpoints) {
    return availableEndpoints.find(
      (ep) => requiredCapabilities.every((req) => ep.capabilities.includes(req))
    );
  }
  static getSupportedProtocols(definition) {
    return definition.protocols || ["http"];
  }
};

// src/orchestration/FunctionalityOrchestration.ts
var FunctionalityOrchestration = class {
  id;
  name;
  version;
  description;
  timeoutMs;
  scope = "functionality";
  bubbleEvents;
  events;
  steps = [];
  flows = /* @__PURE__ */ new Map();
  constructor(descriptor) {
    if (!descriptor || typeof descriptor !== "object" || !descriptor.id) {
      throw new Error("[FunctionalityOrchestration] Valid descriptor with non-empty id is required.");
    }
    this.id = descriptor.id;
    this.name = descriptor.name || descriptor.id;
    this.version = descriptor.version || "1.0.0";
    this.description = descriptor.description || "";
    this.timeoutMs = descriptor.timeoutMs;
    this.bubbleEvents = descriptor.bubbleEvents ?? true;
    this.events = new OrchestrationEventFacade();
  }
  /**
   * Adds a sequential functionality step to the DAG.
   */
  thenFunctionality(funcName, options = {}) {
    if (!funcName) {
      throw new Error("[FunctionalityOrchestration] Functionality name must be a non-empty string.");
    }
    if (typeof funcName !== "string") {
      if (typeof funcName === "object" && ("call" in funcName || "getStatus" in funcName || "definition" in funcName || "instance" in funcName || "id" in funcName)) {
        throw new Error(
          "[FunctionalityOrchestration] Invariant Violation: FunctionalityOrchestration only composes functionalities within the service, not independent services."
        );
      }
      throw new Error("[FunctionalityOrchestration] Functionality name must be a non-empty string.");
    }
    this.assertServiceBoundary(funcName);
    const stepId = options.id || `step_${funcName}_${this.steps.length + 1}`;
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    const step = {
      id: stepId,
      name: funcName,
      type: "task",
      target: funcName,
      dependsOn,
      retryPolicy: options.retry,
      timeoutPolicy: options.timeoutMs ? { timeoutMs: options.timeoutMs } : void 0,
      compensation: options.compensation ? { name: options.compensation, target: options.compensation } : void 0,
      catchHandler: options.catchHandler
    };
    this.steps.push(step);
    return this;
  }
  /**
   * Adds parallel functionality steps to the DAG.
   */
  parallel(name, functionalityNames, options = {}) {
    if (!name || typeof name !== "string") {
      throw new Error("[FunctionalityOrchestration] Parallel group name must be a non-empty string.");
    }
    if (!functionalityNames || functionalityNames.length === 0) {
      throw new Error("[FunctionalityOrchestration] Parallel step requires at least one functionality.");
    }
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const baseDependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    const parallelStepIds = [];
    for (const funcName of functionalityNames) {
      this.assertServiceBoundary(funcName);
      const stepId = `${name}_${funcName}`;
      parallelStepIds.push(stepId);
      this.steps.push({
        id: stepId,
        name: funcName,
        type: "task",
        target: funcName,
        dependsOn: baseDependsOn
      });
    }
    const joinId = `${name}_join`;
    this.steps.push({
      id: joinId,
      name: `${name} Join`,
      type: "fanIn",
      dependsOn: parallelStepIds
    });
    return this;
  }
  /**
   * Adds conditional branching to the DAG.
   */
  branch(name, condition, thenFunc, elseFunc, options = {}) {
    this.assertServiceBoundary(thenFunc);
    if (elseFunc) this.assertServiceBoundary(elseFunc);
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const baseDependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    const thenStepId = `${name}_then_${thenFunc}`;
    this.steps.push({
      id: thenStepId,
      name: thenFunc,
      type: "task",
      target: thenFunc,
      condition,
      dependsOn: baseDependsOn
    });
    let joinDeps = [thenStepId];
    if (elseFunc) {
      const elseStepId = `${name}_else_${elseFunc}`;
      this.steps.push({
        id: elseStepId,
        name: elseFunc,
        type: "task",
        target: elseFunc,
        condition: async (ctx) => !await condition(ctx),
        dependsOn: baseDependsOn
      });
      joinDeps.push(elseStepId);
    }
    const joinId = `${name}_join`;
    this.steps.push({
      id: joinId,
      name: `${name} Join`,
      type: "fanIn",
      dependsOn: joinDeps
    });
    return this;
  }
  /**
   * Adds fan-out step processing items through a functionality.
   */
  fanOut(name, funcName, getItems, options = {}) {
    this.assertServiceBoundary(funcName);
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    this.steps.push({
      id: name,
      name,
      type: "fanOut",
      target: funcName,
      getItems,
      concurrency: options.concurrency ?? 5,
      dependsOn
    });
    return this;
  }
  /**
   * Nested orchestration: Invokes a child FunctionalityOrchestration within the same service boundary.
   */
  thenFunctionalityOrchestration(childOrchId, options = {}) {
    if (!childOrchId || typeof childOrchId !== "string") {
      throw new Error("[FunctionalityOrchestration] Child orchestration id must be a non-empty string.");
    }
    const stepId = options.id || `nested_${childOrchId}_${this.steps.length + 1}`;
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    this.steps.push({
      id: stepId,
      name: childOrchId,
      type: "nested",
      nestedOrchestrationId: childOrchId,
      dependsOn,
      retryPolicy: options.retry,
      timeoutPolicy: options.timeoutMs ? { timeoutMs: options.timeoutMs } : void 0
    });
    return this;
  }
  getSteps() {
    return Object.freeze([...this.steps]);
  }
  /**
   * Converts this FunctionalityOrchestration to a pure serializable OrchestrationDefinition.
   */
  toDefinition() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      timeoutMs: this.timeoutMs,
      scope: "functionality",
      bubbleEvents: this.bubbleEvents,
      dependencies: [],
      steps: this.steps.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        target: s.target,
        dependsOn: s.dependsOn ? [...s.dependsOn] : void 0,
        retryPolicy: s.retryPolicy ? { ...s.retryPolicy } : void 0,
        timeoutPolicy: s.timeoutPolicy ? { ...s.timeoutPolicy } : void 0,
        compensationTarget: s.compensation?.target ?? s.compensation?.name,
        compensationOperation: s.compensation?.operation ?? s.compensation?.name,
        nestedOrchestrationId: s.nestedOrchestrationId,
        concurrency: s.concurrency
      }))
    };
  }
  /**
   * Named flow builder interface.
   */
  flow(name) {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("[FunctionalityOrchestration] Flow name must be a non-empty string.");
    }
    const steps = [];
    const self = this;
    const flowInstance = {
      name,
      steps,
      visibility: "internal",
      thenFunctionality(funcName, options) {
        if (!funcName) {
          throw new Error("[FunctionalityFlow] Functionality name must be a non-empty string.");
        }
        if (typeof funcName !== "string") {
          if (typeof funcName === "object" && ("call" in funcName || "getStatus" in funcName || "definition" in funcName || "instance" in funcName || "id" in funcName)) {
            throw new Error(
              "[FunctionalityOrchestration] Invariant Violation: FunctionalityOrchestration only composes functionalities within the service, not independent services."
            );
          }
          throw new Error("[FunctionalityFlow] Functionality name must be a non-empty string.");
        }
        self.assertServiceBoundary(funcName);
        const stepId = `${name}_${funcName}_${steps.length + 1}`;
        steps.push({
          id: stepId,
          type: "functionality",
          target: funcName,
          dependsOn: options?.dependsOn,
          retryPolicy: options?.retry,
          timeoutPolicy: options?.timeoutMs ? { timeoutMs: options?.timeoutMs } : void 0
        });
        self.thenFunctionality(funcName, {
          id: stepId,
          retry: options?.retry,
          timeoutMs: options?.timeoutMs,
          dependsOn: options?.dependsOn
        });
        return flowInstance;
      },
      thenFunctionalityOrchestration(childName, flowName) {
        if (!childName || typeof childName !== "string") {
          throw new Error("[FunctionalityFlow] Orchestration name must be a non-empty string.");
        }
        const stepId = `${name}_orch_${childName}_${steps.length + 1}`;
        steps.push({
          id: stepId,
          type: "functionalityOrchestration",
          target: childName,
          flow: flowName
        });
        self.thenFunctionalityOrchestration(childName, { id: stepId });
        return flowInstance;
      },
      register(options) {
        if (options?.visibility) flowInstance.visibility = options.visibility;
        return flowInstance;
      }
    };
    this.flows.set(name, flowInstance);
    return flowInstance;
  }
  getFlow(name) {
    return this.flows.get(name);
  }
  listFlows() {
    return Array.from(this.flows.values());
  }
  clearFlows() {
    this.flows.clear();
    this.steps.length = 0;
  }
  assertServiceBoundary(target) {
    if (target.endsWith("ServiceFacade") || target.startsWith("service.") || target.includes("Service.") || target.endsWith("Service") && !target.includes("Functionality") && !target.includes("Atom") || target.startsWith("Service") && !target.includes("Functionality") && !target.includes("Atom")) {
      throw new Error(
        `[FunctionalityOrchestration] Plane Isolation Invariant Violation: Invariant Violation: FunctionalityOrchestration only composes functionalities within the service, not independent services. External Service composition is forbidden. Target "${target}" is not an internal functionality.`
      );
    }
  }
};

// src/index.ts
var gutts = __toESM(require("@dinilmusick/gutts"), 1);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EventBus,
  FunctionalityFacade,
  FunctionalityOrchestration,
  HttpProtocolAdapter,
  KrnlPackageReconciler,
  KrnlQueue,
  KrnlWorkerPool,
  LifecycleManager,
  MemoryTransport,
  OrchestrationEventFacade,
  P2PProtocolAdapter,
  ProtocolResolver,
  ServiceDiscovery,
  ServiceEventBus,
  ServiceFacade,
  ServiceInstance,
  ServiceProxy,
  ServiceRegistry,
  ServiceRuntime,
  ServiceStateStore,
  TelemetryController,
  UdpProtocolAdapter,
  WebSocketProtocolAdapter,
  WorkerExecutionBoundary,
  createEventChannels,
  createService,
  createServiceDefinition,
  createServiceFacade,
  createServiceProxy,
  deltaResources,
  gutts,
  sampleResources,
  telemetryNow,
  validateOrchestrationDAG,
  validateServiceDefinition
});
