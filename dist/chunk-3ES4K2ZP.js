import {
  Logger
} from "./chunk-K54K2KZW.js";

// src/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts
import http from "http";
import fs from "fs";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";

// src/core/K_LIB_Krnl_Protocol_MCP.ts
var KrnlMcpProtocol = class {
  system;
  /**
   * @param system
   */
  constructor(system) {
    this.system = system;
  }
  /**
   * Returns the MCP Tools list based on system functionalities.
   */
  async listTools() {
    if (this.system._ingressNetwork) {
      const tools2 = this.system._ingressNetwork.getAggregatedMcpTools();
      return { tools: tools2 };
    }
    const manifest = this.system.getManifest();
    const apiIds = Object.keys(manifest.inputs?.api || manifest.api || {});
    const tools = apiIds.map((fid) => {
      const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
      const description = functionality?.description || `Execute ${fid} on ${this.system.entityName}`;
      let inputSchema = { type: "object", properties: {} };
      if (functionality?.schema?.input) {
        inputSchema.properties = {
          data: { type: "object", description: "Input data for the functionality" }
        };
      }
      return {
        name: fid,
        description,
        inputSchema
      };
    });
    return { tools };
  }
  /**
   * Handles an MCP JSON-RPC request.
   */
  async handleRequest(rpc, opts = {}) {
    const { method, params, id } = rpc;
    if (method === "tools/list") {
      const result = await this.listTools();
      return { jsonrpc: "2.0", id, result };
    }
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      try {
        let result;
        if (this.system._ingressNetwork && name.includes(".")) {
          const parts = name.split(".");
          const prefix = parts[0].toLowerCase();
          const toolName = parts.slice(1).join(".");
          const entry = this.system._ingressNetwork.members.get(prefix);
          if (entry) {
            result = await entry.entity.call(toolName, args, opts);
          } else {
            throw new Error(`Ingress member for prefix '${prefix}' not found.`);
          }
        } else {
          result = await this.system.call(name, args, opts);
        }
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          }
        };
      } catch (error) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32e3,
            message: error.message,
            data: {
              errorDocumentation: error.errorDocumentation || null
            }
          }
        };
      }
    }
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false }
          },
          serverInfo: {
            name: this.system.entityName,
            version: "1.0.0"
          }
        }
      };
    }
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Method not found" }
    };
  }
};

// src/core/K_LIB_Krnl_Protocol_ACP.ts
var KrnlAcpProtocol = class {
  system;
  /**
   * @param system
   */
  constructor(system) {
    this.system = system;
  }
  /**
   * ACP Information endpoint.
   */
  getInfo() {
    const manifest = this.system.getManifest();
    return {
      agentId: this.system.entityName,
      type: manifest.systemType,
      version: "1.0.0",
      protocols: ["ACP", "MCP", "KrnlWS"],
      description: `Krnl System Entity: ${this.system.entityName}`
    };
  }
  /**
   * ACP Capabilities endpoint.
   */
  getCapabilities() {
    const manifest = this.system.getManifest();
    return {
      services: Object.keys(manifest.inputs.api).map((fid) => ({
        id: fid,
        name: fid,
        type: "functionality"
      })),
      events: manifest.outputs.events.map((eid) => ({
        id: eid,
        type: "event"
      }))
    };
  }
  /**
   * ACP Message endpoint handler.
   */
  async handleMessage(payload, opts = {}) {
    const { action, data } = payload;
    try {
      const result = await this.system.call(action, data, opts);
      return {
        status: "success",
        result,
        metadata: {
          processedBy: this.system.entityName,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
        errorDocumentation: error.errorDocumentation || null,
        metadata: {
          processedBy: this.system.entityName,
          timestamp: Date.now()
        }
      };
    }
  }
};

// src/core/K_LIB_Krnl_System_Unified_Http_Adapter.ts
var krnlUnifiedHttpAdapter = class {
  name = "https";
  system;
  port;
  host;
  server;
  _isExternalServer;
  mcp;
  acp;
  enableFriendlyRouting;
  wss;
  _latestUiSnapshot;
  _uiWsClients;
  _uiSseClients;
  _uiReadyComponents = /* @__PURE__ */ new Set();
  /**
   * @param system
   * @param port
   * @param host
   */
  constructor(system, port, host = "0.0.0.0") {
    this.system = system;
    this.port = port;
    this.host = host;
    this.server = null;
    this._isExternalServer = false;
    this.mcp = new KrnlMcpProtocol(system);
    this.acp = new KrnlAcpProtocol(system);
    this.enableFriendlyRouting = false;
    this.wss = null;
    this._latestUiSnapshot = {};
    this._uiWsClients = /* @__PURE__ */ new Set();
    this._uiSseClients = /* @__PURE__ */ new Set();
  }
  /**
   * Starts the adapter.
   */
  async start(externalServerOrEntity = null, options = {}) {
    if (externalServerOrEntity && typeof externalServerOrEntity.call === "function") {
      this.system = externalServerOrEntity;
      if (options.port) this.port = options.port;
      if (options.host) this.host = options.host;
      return this.start(null);
    }
    const externalServer = externalServerOrEntity;
    if (this.server) return;
    this.wss = new WebSocketServer({ noServer: true });
    const handleUpgrade = (req, socket, head) => {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      if (url.pathname === "/agent/ws") {
        if (socket.upgraded || socket._krnlUpgraded || !socket.readable) return;
        socket._krnlUpgraded = true;
        try {
          this.wss.handleUpgrade(req, socket, head, (ws) => {
            this._handleAgentWsClient(ws);
          });
        } catch (err) {
          console.warn("[HttpAdapter] WebSocket handleUpgrade ignored:", err?.message || err);
        }
      }
    };
    if (externalServer) {
      this.server = externalServer;
      this._isExternalServer = true;
      this.server.on("request", (req, res) => {
        this._handleRequest(req, res);
      });
      this.server.on("upgrade", handleUpgrade);
    } else {
      this.server = http.createServer((req, res) => {
        this._handleRequest(req, res);
      });
      this.server.on("upgrade", handleUpgrade);
      return new Promise((resolve, reject) => {
        this.server.listen(this.port, this.host, () => {
          Logger.log(`[${this.system.entityName}] Unified HTTP Adapter active on http://${this.host}:${this.port}`);
          resolve();
        });
        this.server.on("error", reject);
      });
    }
  }
  _handleAgentWsClient(ws) {
    this._uiWsClients.add(ws);
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log(`[UnifiedHttpAdapter] WS msg type: '${msg.type}', fid: '${msg.fid || ""}', ticketId: '${msg.ticketId || ""}'`);
        if (msg.type === "state" && msg.snapshot) {
          this._latestUiSnapshot = { ...this._latestUiSnapshot, ...msg.snapshot };
          this._broadcastUiSse(this._latestUiSnapshot);
        } else if (msg.type === "component_ready" && msg.fid) {
          this._uiReadyComponents.add(msg.fid);
        } else if (msg.type === "component_unready" && msg.fid) {
          this._uiReadyComponents.delete(msg.fid);
        } else if (msg.type === "component_ready_all" && Array.isArray(msg.fids)) {
          msg.fids.forEach((f) => this._uiReadyComponents.add(f));
        } else if (msg.type === "job_complete" && msg.ticketId) {
          this.system._jobScheduler.resolveTicket(
            msg.ticketId,
            msg.error ? "failed" : "done",
            msg.result,
            msg.error
          );
        }
      } catch (e) {
      }
    });
    ws.on("close", () => {
      this._uiWsClients.delete(ws);
    });
    ws.on("error", () => {
      this._uiWsClients.delete(ws);
    });
  }
  _broadcastUiSse(data) {
    const payload = `data: ${JSON.stringify(data)}

`;
    for (const res of this._uiSseClients) {
      if (res.writable) {
        res.write(payload);
      }
    }
  }
  sendWsTrigger(fid, input, ticketId) {
    const msg = JSON.stringify({ action: "trigger", fid, input, ticketId });
    for (const ws of this._uiWsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }
  async _handleRequest(req, res) {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const reqPath = url.pathname;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (this.system._subAppRegistry?.size > 0) {
      const segments = reqPath.split("/").filter(Boolean);
      const prefix = segments[0]?.toLowerCase();
      if (prefix && this.system._subAppRegistry.has(prefix)) {
        const entry = this.system._subAppRegistry.get(prefix);
        let subPath = "/" + segments.slice(1).join("/") + url.search;
        if (reqPath.endsWith("/") && !subPath.endsWith("/")) subPath += "/";
        if (entry.executionMode === "worker") {
          const fid = segments[1] ?? "heartbeat";
          const body = req.method === "GET" ? Object.fromEntries(url.searchParams.entries()) : await this._readJsonBody(req);
          try {
            const result = await entry.entity.call(fid, body);
            this._sendJson(res, 200, result);
          } catch (err) {
            this._sendJson(res, 200, { status: "error", message: err.message || String(err) });
          }
        } else {
          const originalUrl = req.url;
          req.url = subPath;
          try {
            await entry.entity.unifiedHttpAdapter._handleRequest(req, res);
          } finally {
            req.url = originalUrl;
          }
        }
        return;
      }
    }
    if (this.system._siblingNetwork) {
      const segments = reqPath.split("/").filter(Boolean);
      const prefix = segments[0]?.toLowerCase();
      if (prefix && this.system._siblingNetwork.members.has(prefix)) {
        if (segments.length === 3 && segments[1] === "frontend" && segments[2] === "default" && !reqPath.endsWith("/")) {
          res.writeHead(302, { "Location": reqPath + "/" + url.search });
          res.end();
          return;
        }
        let subPath = "/" + segments.slice(1).join("/") + url.search;
        if (reqPath.endsWith("/") && !subPath.endsWith("/")) subPath += "/";
        await this.system._siblingNetwork.routeHttpRequest(prefix, req, res, subPath);
        return;
      }
      if (segments[0] && segments[1] && segments[0].toLowerCase() !== "default") {
        const key = `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
        if (this.system._siblingNetwork.members.has(key)) {
          await this.system._siblingNetwork.routeHttpRequest(key, req, res, req.url || "/");
          return;
        }
      }
    }
    const isKrnlRoute = reqPath.startsWith("/call/") || reqPath.startsWith("/sse/") || reqPath.startsWith("/ui") || reqPath.startsWith("/mcp") || reqPath.startsWith("/acp") || reqPath === "/agent/job_complete" || reqPath === "/subapps" || reqPath === "/api/subapps" || reqPath === "/manifest" || reqPath === "/health";
    if (reqPath === "/subapps" || reqPath === "/api/subapps") {
      const subappsList = [];
      if (this.system._subApps && this.system._subApps.size > 0) {
        for (const [id, inst] of this.system._subApps.entries()) {
          subappsList.push({
            id,
            state: inst.state,
            manifest: inst.manifest || null,
            operations: Array.from(inst.operations?.values() || []).map((op) => ({
              name: op.name,
              description: op.description || "",
              method: op.method || "POST",
              metadata: op.metadata || {}
            })),
            ui: inst.registration?.ui || inst.manifest?.ui || null,
            loadedAt: inst.loadedAt,
            readyAt: inst.readyAt,
            error: inst.error ? inst.error.message || String(inst.error) : null
          });
        }
      }
      this._sendJson(res, 200, { status: "success", entity: this.system.entityName, subapps: subappsList });
      return;
    }
    if (!isKrnlRoute) {
      if (reqPath === "/inspect" || reqPath.startsWith("/inspect/") || reqPath === "/frontend" || reqPath.startsWith("/frontend/")) {
        if (!this.system._frontend && this.system._entityDataDir) {
          const frontendDir = path.join(this.system._entityDataDir, "frontend");
          if (fs.existsSync(frontendDir)) {
            this.system.enableFrontend({ frontendDir });
          }
        }
        if (this.system._frontend) {
          const subPath = reqPath.startsWith("/frontend") ? reqPath.slice("/frontend".length) || "/" : reqPath;
          await this.system._frontend.handleRequest(req, res, subPath);
        } else {
          this._sendJson(res, 404, { status: "error", message: "Frontend not enabled." });
        }
        return;
      }
      const isFrontendAsset = reqPath === "/" || reqPath === "/index.html" || reqPath === "/bundle.js" || reqPath === "/styles.css" || reqPath === "/index.css";
      if (isFrontendAsset && req.method === "GET" && (this.system._frontend || this.system._entityDataDir)) {
        if (!this.system._frontend && this.system._entityDataDir) {
          const frontendDir = path.join(this.system._entityDataDir, "frontend");
          if (fs.existsSync(frontendDir)) {
            this.system.enableFrontend({ frontendDir });
          }
        }
        if (this.system._frontend) {
          const assetPath = reqPath === "/" ? "/index.html" : reqPath;
          await this.system._frontend.handleRequest(req, res, assetPath);
          return;
        }
      }
      if (this.enableFriendlyRouting) {
        let fid = reqPath.slice(1);
        if (fid.endsWith("/")) fid = fid.slice(0, -1);
        let resolvedCap = this.system.resolveCapability ? this.system.resolveCapability(fid) : null;
        let functionality = this.system.localFunctionalities.get(fid) || this.system.remoteFunctionalities.get(fid) || (resolvedCap ? resolvedCap.owner.localFunctionalities.get(resolvedCap.fid) : null);
        let resolved = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : null;
        if (!functionality) {
          const cleanPath = reqPath.replace(/^\/api\//, "/").slice(1);
          const segments = cleanPath.split("/").filter(Boolean);
          if (segments.length >= 2) {
            const subAppPrefix = segments[0];
            const opSuffix = segments.slice(1).join(".");
            const potentialFid = `${subAppPrefix}.${opSuffix}`;
            const allKeys = Array.from(this.system.localFunctionalities.keys()).concat(
              Array.from(this.system.remoteFunctionalities.keys())
            );
            const match = allKeys.find((k) => k.toLowerCase() === potentialFid.toLowerCase());
            if (match) {
              fid = match;
              resolvedCap = this.system.resolveCapability ? this.system.resolveCapability(fid) : null;
              functionality = this.system.localFunctionalities.get(fid) || this.system.remoteFunctionalities.get(fid) || (resolvedCap ? resolvedCap.owner.localFunctionalities.get(resolvedCap.fid) : null);
              resolved = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : null;
            }
          }
        }
        if (functionality) {
          const expectedMethod = (resolved || functionality).method || "POST";
          if (req.method !== expectedMethod) {
            this._sendJson(res, 405, {
              status: "error",
              message: `Method ${req.method} not allowed for ${fid}. Use ${expectedMethod}.`
            });
            return;
          }
          try {
            Logger.log(`[HttpAdapter] Friendly route hit: ${fid} (${req.method})`);
            const input = req.method === "GET" ? Object.fromEntries(url.searchParams.entries()) : await this._readJsonBody(req);
            const data = input && typeof input === "object" && !("data" in input) && Object.keys(input).length > 0 ? { data: input } : input;
            let result;
            if (resolvedCap) {
              result = await resolvedCap.owner.call(resolvedCap.fid, data.data || data, {
                unwrap: false,
                callerPort: req.socket?.remotePort,
                accessKey: req.headers["x-krnl-access-key"]
              });
            } else {
              result = await this.system.call(fid, data.data || data, {
                unwrap: false,
                callerPort: req.socket?.remotePort,
                accessKey: req.headers["x-krnl-access-key"]
              });
            }
            this._sendJson(res, 200, result);
          } catch (e) {
            Logger.error(`[HttpAdapter] Friendly route error (${fid}):`, e.message);
            this._sendJson(res, 200, {
              status: "error",
              message: e.message,
              errorDocumentation: e.errorDocumentation || null
            });
          }
          return;
        }
      }
      const notFoundData = typeof this.system.getNotFoundResponse === "function" ? this.system.getNotFoundResponse(reqPath) : { error: "Route not found", path: reqPath };
      this._sendJson(res, 404, notFoundData);
      return;
    }
    try {
      if (reqPath.startsWith("/ui")) {
        if (reqPath === "/ui/manifest") {
          const activeFids = Array.from(/* @__PURE__ */ new Set([
            ...Object.keys(this._latestUiSnapshot),
            ...this.system.localFunctionalities ? Array.from(this.system.localFunctionalities.keys()) : []
          ]));
          this._sendJson(res, 200, {
            status: "success",
            entity: this.system.entityName,
            uiActive: this._uiWsClients.size > 0,
            endpoints: activeFids
          });
          return;
        }
        if (reqPath === "/ui/state" || reqPath === "/ui/state/") {
          if (this._uiWsClients.size > 0) {
            for (const ws of this._uiWsClients) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: "query" }));
              }
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          this._sendJson(res, 200, {
            status: "success",
            uiActive: this._uiWsClients.size > 0,
            states: this._latestUiSnapshot
          });
          return;
        }
        if (reqPath.startsWith("/ui/state/")) {
          const fid = reqPath.slice("/ui/state/".length);
          this._sendJson(res, 200, {
            status: "success",
            fid,
            state: this._latestUiSnapshot[fid] || null
          });
          return;
        }
        if (reqPath === "/ui/trigger" && req.method === "POST") {
          const { fid, input, timeoutMs } = await this._readJsonBody(req);
          if (!fid) {
            this._sendJson(res, 400, { status: "error", message: "Missing required field: fid" });
            return;
          }
          const maxWaitMs = timeoutMs || 5e3;
          let readyWait = 0;
          while (!this._uiReadyComponents.has(fid) && readyWait < maxWaitMs) {
            await new Promise((r) => setTimeout(r, 50));
            readyWait += 50;
          }
          if (!this._uiReadyComponents.has(fid) && this._uiWsClients.size === 0) {
            this._sendJson(res, 400, {
              status: "error",
              message: `Endpoint component '${fid}' is not mounted in the UI or no active UI client connected.`
            });
            return;
          }
          const ticket = this.system._jobScheduler.createTicket(fid, "ui_trigger");
          this.system._jobScheduler.markRunning(ticket.id);
          this.sendWsTrigger(fid, input, ticket.id);
          try {
            const finishedTicket = await this.system._jobScheduler.waitForTicket(ticket.id, Math.max(1e3, maxWaitMs - readyWait));
            this._sendJson(res, 200, {
              status: finishedTicket.status === "done" ? "success" : "error",
              fid,
              ticketId: ticket.id,
              uiActive: this._uiWsClients.size > 0,
              result: finishedTicket.result,
              error: finishedTicket.error,
              state: this._latestUiSnapshot[fid] || null
            });
          } catch (err) {
            this._sendJson(res, 200, {
              status: "timeout",
              fid,
              ticketId: ticket.id,
              uiActive: this._uiWsClients.size > 0,
              error: err.message || "Timeout waiting for ticket",
              state: this._latestUiSnapshot[fid] || null
            });
          }
          return;
        }
        if (reqPath === "/ui/subscribe") {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
          });
          this._uiSseClients.add(res);
          res.write(`data: ${JSON.stringify(this._latestUiSnapshot)}

`);
          req.on("close", () => {
            this._uiSseClients.delete(res);
            res.end();
          });
          return;
        }
      }
      if (reqPath === "/agent/job_complete" && req.method === "POST") {
        const { ticketId, fid, result, error } = await this._readJsonBody(req);
        console.log(`[UnifiedHttpAdapter] Received HTTP /agent/job_complete ACK for ticket '${ticketId}', fid '${fid}', error: '${error}'`);
        if (!ticketId) {
          this._sendJson(res, 400, { status: "error", message: "Missing required field: ticketId" });
          return;
        }
        this.system._jobScheduler.resolveTicket(
          ticketId,
          error ? "failed" : "done",
          result,
          error
        );
        this._sendJson(res, 200, { status: "success", ticketId });
        return;
      }
      if (reqPath.startsWith("/call/")) {
        const fid = reqPath.slice("/call/".length);
        const body = await this._readJsonBody(req);
        let result;
        if (this.system.resolveCapability) {
          const resolved = this.system.resolveCapability(fid);
          if (resolved) {
            result = await resolved.owner.call(resolved.fid, body, {
              unwrap: false,
              callerPort: req.socket?.remotePort,
              accessKey: req.headers["x-krnl-access-key"]
            });
          } else {
            result = await this.system.call(fid, body, {
              unwrap: false,
              callerPort: req.socket?.remotePort,
              accessKey: req.headers["x-krnl-access-key"]
            });
          }
        } else {
          result = await this.system.call(fid, body, {
            unwrap: false,
            callerPort: req.socket?.remotePort,
            accessKey: req.headers["x-krnl-access-key"]
          });
        }
        this._sendJson(res, 200, result);
        return;
      }
      if (reqPath.startsWith("/sse/")) {
        const fid = reqPath.split("/")[2];
        this._handleSse(req, res, fid);
        return;
      }
      if (reqPath === "/ai") {
        const { message } = await this._readJsonBody(req);
        if (!this.system._aiOrchestrator) {
          const { KrnlAikoClient } = await import("./K_LIB_Krnl_Aiko_Client-OPZAVZCW.js");
          this._sendJson(res, 200, {
            status: "error",
            message: KrnlAikoClient.getNotRunningMessage()
          });
          return;
        }
        const result = await this.system._aiOrchestrator.handle(message);
        this._sendJson(res, 200, result);
        return;
      }
      if (reqPath === "/ai/manifest") {
        const agents = this.system._aiOrchestrator?.getAgentSummaries() ?? [];
        this._sendJson(res, 200, {
          aiEnabled: !!this.system._aiOrchestrator,
          aikoAlive: this.system.isAikoAlive(),
          endpoints: agents
        });
        return;
      }
      if (reqPath === "/mcp") {
        const body = await this._readJsonBody(req);
        const result = await this.mcp.handleRequest(body, {
          callerPort: req.socket?.remotePort,
          accessKey: req.headers["x-krnl-access-key"]
        });
        this._sendJson(res, 200, result);
        return;
      }
      if (reqPath === "/health") {
        const healthData = { status: "ok", entity: this.system.entityName };
        if (this.system._subappErrors && this.system._subappErrors.length > 0) {
          healthData.status = "issues";
          healthData.issues = this.system._subappErrors;
        }
        this._sendJson(res, 200, healthData);
        return;
      }
      if (reqPath.startsWith("/acp")) {
        if (reqPath === "/acp/info" || reqPath === "/acp") {
          this._sendJson(res, 200, this.acp.getInfo());
        } else if (reqPath === "/acp/capabilities") {
          this._sendJson(res, 200, this.acp.getCapabilities());
        } else if (reqPath === "/acp/messages" && req.method === "POST") {
          const body = await this._readJsonBody(req);
          const result = await this.acp.handleMessage(body, {
            callerPort: req.socket?.remotePort,
            accessKey: req.headers["x-krnl-access-key"]
          });
          this._sendJson(res, 200, result);
        } else {
          this._sendJson(res, 404, { error: "ACP route not found" });
        }
        return;
      }
      if (reqPath === "/manifest") {
        if (this.system._ingressNetwork) {
          this._sendJson(res, 200, this.system._ingressNetwork.getGrossManifest(`http://${req.headers.host}`));
        } else {
          this._sendJson(res, 200, this.system.getManifest());
        }
        return;
      }
    } catch (error) {
      Logger.error(`[HttpAdapter] Fatal handler error ${reqPath}:`, error.message || error);
      this._sendJson(res, 200, {
        status: "error",
        message: error.message || String(error),
        errorDocumentation: error.errorDocumentation || null
      });
    }
  }
  _handleSse(req, res, fid) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
    if (!functionality) {
      res.write(`data: ${JSON.stringify({ error: "Functionality not found" })}

`);
      res.end();
      return;
    }
    const stateEmitter = functionality.emitters.get("state:changed");
    const unsubscribe = stateEmitter?.subscribe((msg) => {
      res.write(`data: ${JSON.stringify(msg.data)}

`);
    });
    const interval = setInterval(() => {
      if (res.writable) {
        res.write(": keepalive\n\n");
      }
    }, 15e3);
    req.on("close", () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
      res.end();
    });
  }
  _sendJson(res, status, data) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
  _readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        if (!body) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Invalid JSON body"));
        }
      });
    });
  }
  onCapabilitySurfaceChanged(entity) {
    this.system = entity;
  }
  async stop() {
    if (this.wss) {
      for (const ws of this._uiWsClients) {
        try {
          ws.close();
        } catch (_) {
        }
      }
      this._uiWsClients.clear();
      try {
        this.wss.close();
      } catch (_) {
      }
      this.wss = null;
    }
    if (this.server && !this._isExternalServer) {
      await new Promise((resolve) => {
        this.server.close(() => resolve());
      });
      this.server = null;
    }
  }
  dispose() {
    this.stop().catch(() => {
    });
  }
};

export {
  KrnlMcpProtocol,
  KrnlAcpProtocol,
  krnlUnifiedHttpAdapter
};
