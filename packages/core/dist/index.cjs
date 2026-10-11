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
  HttpProtocolAdapter: () => HttpProtocolAdapter,
  LifecycleManager: () => LifecycleManager,
  MemoryTransport: () => MemoryTransport,
  P2PProtocolAdapter: () => P2PProtocolAdapter,
  ProtocolResolver: () => ProtocolResolver,
  ServiceDiscovery: () => ServiceDiscovery,
  ServiceEventBus: () => ServiceEventBus,
  ServiceInstance: () => ServiceInstance,
  ServiceProxy: () => ServiceProxy,
  ServiceRegistry: () => ServiceRegistry,
  ServiceRuntime: () => ServiceRuntime,
  ServiceStateStore: () => ServiceStateStore,
  UdpProtocolAdapter: () => UdpProtocolAdapter,
  WebSocketProtocolAdapter: () => WebSocketProtocolAdapter,
  createService: () => createService,
  createServiceDefinition: () => createServiceDefinition,
  createServiceProxy: () => createServiceProxy
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
var LifecycleManager = class {
  status = "uninitialized";
  getStatus() {
    return this.status;
  }
  setStatus(next) {
    this.status = next;
  }
  assertRunning(serviceName) {
    if (this.status !== "running") {
      throw new Error(`[Service:${serviceName}] Cannot invoke operation while status is '${this.status}' (expected 'running').`);
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
    if (definition.state?.initial) {
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
  getDefinition() {
    return this.definition;
  }
  async start() {
    this.lifecycle.setStatus("starting");
    if (this.definition.lifecycle?.onInit) {
      await this.definition.lifecycle.onInit();
    }
    if (this.definition.lifecycle?.onStart) {
      await this.definition.lifecycle.onStart();
    }
    this.lifecycle.setStatus("running");
  }
  async stop() {
    this.lifecycle.setStatus("stopping");
    if (this.definition.lifecycle?.onStop) {
      await this.definition.lifecycle.onStop();
    }
    if (this.definition.lifecycle?.onDispose) {
      await this.definition.lifecycle.onDispose();
    }
    this.lifecycle.setStatus("stopped");
  }
  async call(op, input, ctx = {}) {
    this.lifecycle.assertRunning(this.name);
    const operation = this.definition.operations[op];
    if (!operation) {
      throw new Error(`[Service:${this.name}] Operation '${op}' not found.`);
    }
    return await operation.handler(input, ctx);
  }
  getState() {
    if (!this.stateStore) {
      return Object.freeze({});
    }
    return this.stateStore.getState();
  }
  setState(mutation) {
    if (!this.stateStore) {
      this.stateStore = new ServiceStateStore(mutation);
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
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.stateCache = definition.state?.initial || {};
  }
  definition;
  adapter;
  endpoint;
  id;
  name;
  version;
  stateCache;
  eventHandlers = /* @__PURE__ */ new Map();
  getDefinition() {
    return this.definition;
  }
  async start() {
  }
  async stop() {
  }
  async call(op, input, ctx = {}) {
    if (!this.adapter.send) {
      throw new Error(`[ServiceProxy:${this.name}] Adapter does not support send().`);
    }
    const envelope = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "request",
      operation: op,
      payload: input,
      timestamp: Date.now()
    };
    const response = await this.adapter.send(this.endpoint, envelope);
    if (response.error) {
      throw new Error(`[ServiceProxy:${this.name}] Remote error: ${response.error}`);
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
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, /* @__PURE__ */ new Set());
    }
    const handlers = this.eventHandlers.get(event);
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }
  emit(event, payload) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of Array.from(handlers)) {
        handler(payload);
      }
    }
  }
};

// src/services/ServiceGenerators.ts
function createServiceDefinition(definition) {
  return definition;
}
function createService(definition) {
  return new ServiceInstance(definition);
}
function createServiceProxy(definition, adapter, endpoint) {
  return new ServiceProxy(definition, adapter, endpoint);
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
var import_http2 = __toESM(require("http"), 1);
var import_ws = require("ws");
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
    this.server = import_http2.default.createServer();
    this.wss = new import_ws.WebSocketServer({ server: this.server });
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
    return new Promise((resolve, reject) => {
      const ws = new import_ws.WebSocket(`ws://${endpoint.address}:${endpoint.port}`);
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
var ServiceRegistry = class {
  services = /* @__PURE__ */ new Map();
  register(definition, endpoints = []) {
    this.services.set(definition.id, {
      definition,
      endpoints,
      registeredAt: Date.now()
    });
  }
  unregister(serviceId) {
    this.services.delete(serviceId);
  }
  get(serviceId) {
    return this.services.get(serviceId);
  }
  list() {
    return Array.from(this.services.values());
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
    this.registry = registry || new ServiceRegistry();
  }
  register(service) {
    this.instances.set(service.id, service);
    this.registry.register(service.getDefinition());
    return this;
  }
  get(serviceId) {
    return this.instances.get(serviceId);
  }
  async execute(target, operation, input, ctx) {
    const service = this.instances.get(target);
    if (!service) {
      throw new Error(`[ServiceRuntime] Target service '${target}' not found.`);
    }
    return await service.call(operation, input, ctx);
  }
  async startAll() {
    for (const service of this.instances.values()) {
      await service.start();
    }
  }
  async stopAll() {
    for (const service of this.instances.values()) {
      await service.stop();
    }
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpProtocolAdapter,
  LifecycleManager,
  MemoryTransport,
  P2PProtocolAdapter,
  ProtocolResolver,
  ServiceDiscovery,
  ServiceEventBus,
  ServiceInstance,
  ServiceProxy,
  ServiceRegistry,
  ServiceRuntime,
  ServiceStateStore,
  UdpProtocolAdapter,
  WebSocketProtocolAdapter,
  createService,
  createServiceDefinition,
  createServiceProxy
});
