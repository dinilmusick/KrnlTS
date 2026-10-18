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

// src/events/ServiceEventBus.ts
var ServiceEventBus = class {
  handlers = /* @__PURE__ */ new Map();
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, /* @__PURE__ */ new Set());
    }
    const set = this.handlers.get(event);
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }
  emit(event, payload) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[ServiceEventBus] Handler error for '${event}':`, err);
      }
    }
  }
  clear() {
    this.handlers.clear();
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

// src/services/ServiceInstance.ts
var ServiceInstance = class {
  constructor(definition) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.lifecycle = new LifecycleManager();
    this.eventBus = new ServiceEventBus();
    if (definition.state) {
      this.stateStore = new ServiceStateStore(definition.state.initial);
    }
  }
  definition;
  id;
  name;
  version;
  stateStore;
  eventBus;
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
    return await operation.handler(input, ctx);
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
  on(event, handler) {
    return this.eventBus.on(event, handler);
  }
  emit(event, payload) {
    this.eventBus.emit(event, payload);
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
    this.stateCache = { ...definition.state?.initial ?? {} };
  }
  definition;
  adapter;
  endpoint;
  id;
  name;
  version;
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
    const response = await this.adapter.send(this.endpoint, envelope);
    if (response.error) {
      throw new Error("[ServiceProxy:" + this.name + "] Remote error: " + response.error);
    }
    return response.payload;
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
  for (const [key, event] of Object.entries(definition.events ?? {})) {
    if (!event || typeof event !== "object") {
      throw new Error("[Service:" + definition.name + "] Invalid event '" + key + "'.");
    }
    assertNonEmptyString(event.name, "events." + key + ".name");
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

// src/services/ServiceFacade.ts
var ServiceFacade = class {
  id;
  name;
  version;
  description;
  functionalities;
  orchestrations;
  dependencies;
  capabilities;
  instance;
  constructor(config) {
    if (!config || !config.id || typeof config.id !== "string") {
      throw new Error("[ServiceFacade] ServiceFacade requires a valid id.");
    }
    this.id = config.id;
    this.name = config.name || config.id;
    this.version = config.version || "1.0.0";
    this.description = config.description || "";
    this.functionalities = config.functionalities ? { ...config.functionalities } : {};
    this.orchestrations = config.orchestrations ? { ...config.orchestrations } : {};
    this.dependencies = Object.freeze(config.dependencies ? [...config.dependencies] : []);
    this.capabilities = Object.freeze(config.capabilities ? [...config.capabilities] : []);
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
  }
  getInstance() {
    return this.instance;
  }
  getStatus() {
    return this.instance.getStatus();
  }
  async start() {
    await this.instance.start();
  }
  async stop() {
    await this.instance.stop();
  }
  async dispose() {
    await this.instance.dispose();
  }
  async call(op, input, ctx) {
    return this.instance.call(op, input, ctx);
  }
  getState() {
    return this.instance.getState();
  }
  setState(mutation) {
    this.instance.setState(mutation);
  }
  on(event, handler) {
    return this.instance.on(event, handler);
  }
  emit(event, payload) {
    this.instance.emit(event, payload);
  }
  registerFunctionality(name, functionality) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] Functionality name must be a non-empty string.");
    }
    this.functionalities[name] = functionality;
    return this;
  }
  registerOrchestration(name, orchestration) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] Orchestration name must be a non-empty string.");
    }
    if (!orchestration) {
      throw new Error("[ServiceFacade] Orchestration instance is required.");
    }
    this.orchestrations[name] = orchestration;
    return this;
  }
};
function createServiceFacade(config) {
  return new ServiceFacade(config);
}

// src/protocols/HttpProtocolAdapter.ts
import http from "http";
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
    this.server = http.createServer();
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
    this.server = http.createServer(async (req, res) => {
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
    let WS = globalThis.WebSocket;
    if (!WS) {
      const wsMod = await import("ws").catch(() => null);
      WS = wsMod?.WebSocket || wsMod?.default?.WebSocket || wsMod;
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
import dgram from "dgram";
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
    this.socket = dgram.createSocket("udp4");
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
      const client = dgram.createSocket("udp4");
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
   * @throws Error if service is already registered under the same ID with a different version.
   */
  register(definition, endpoints = []) {
    validateServiceDefinition(definition);
    for (const endpoint of endpoints) validateEndpoint(endpoint);
    const existing = this.services.get(definition.id);
    if (existing && existing.definition.version !== definition.version) {
      throw new Error(
        "[ServiceRegistry] Service '" + definition.id + "' is already registered at version '" + existing.definition.version + "'; refusing replacement with '" + definition.version + "'."
      );
    }
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
  registerPeer(id, name, endpoints) {
    this.peers.set(id, {
      id,
      name,
      endpoints,
      lastSeen: Date.now()
    });
  }
  getPeers() {
    return Array.from(this.peers.values());
  }
  findPeer(id) {
    return this.peers.get(id);
  }
};

// src/discovery/KrnlPackageReconciler.ts
import * as fs from "fs";
import * as path from "path";
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
        const json = JSON.parse(raw);
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
      path.join(projectRoot, "krnl", "backend", "libraries"),
      path.join(projectRoot, "krnl", "backend", "functionalities"),
      path.join(projectRoot, "krnl", "frontend", "libraries"),
      path.join(projectRoot, "krnl", "frontend", "functionalities"),
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

// src/orchestration/Orchestration.ts
var Orchestration = class {
  id;
  name;
  version;
  description;
  flows = /* @__PURE__ */ new Map();
  constructor(descriptor) {
    if (!descriptor || typeof descriptor !== "object" || !descriptor.id) {
      throw new Error("[Orchestration] Valid orchestration descriptor with non-empty id is required.");
    }
    this.id = descriptor.id;
    this.name = descriptor.name || descriptor.id;
    this.version = descriptor.version || "1.0.0";
    this.description = descriptor.description || "";
  }
  flow(name) {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("[Orchestration] Flow name must be a non-empty string.");
    }
    const chain = {
      name,
      steps: [],
      visibility: "internal",
      thenFunctionality(funcName) {
        if (!funcName || typeof funcName !== "string") {
          throw new Error("[OrchestrationFlow] Functionality name must be a non-empty string.");
        }
        chain.steps.push({ type: "functionality", target: funcName });
        return chain;
      },
      thenOrchestration(orchestrationName, flowName) {
        if (!orchestrationName || typeof orchestrationName !== "string") {
          throw new Error("[OrchestrationFlow] Orchestration name must be a non-empty string.");
        }
        chain.steps.push({ type: "orchestration", target: orchestrationName, flow: flowName });
        return chain;
      },
      register(options) {
        if (options?.visibility) chain.visibility = options.visibility;
        return chain;
      }
    };
    this.flows.set(name, chain);
    return chain;
  }
  getFlow(name) {
    return this.flows.get(name);
  }
  listFlows() {
    return Array.from(this.flows.values());
  }
  clearFlows() {
    this.flows.clear();
  }
};
export {
  HttpProtocolAdapter,
  KrnlPackageReconciler,
  LifecycleManager,
  MemoryTransport,
  Orchestration,
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
  UdpProtocolAdapter,
  WebSocketProtocolAdapter,
  createService,
  createServiceDefinition,
  createServiceFacade,
  createServiceProxy,
  validateServiceDefinition
};
