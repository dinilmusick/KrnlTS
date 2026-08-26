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
  AstMutationEngine: () => AstMutationEngine,
  FunctionExecutor: () => FunctionExecutor,
  JsonRpcRouter: () => JsonRpcRouter,
  StudioFileWatcher: () => StudioFileWatcher,
  StudioServer: () => StudioServer,
  VanJSCodeGenerator: () => VanJSCodeGenerator,
  createVanJSRenderPlugin: () => createVanJSRenderPlugin
});
module.exports = __toCommonJS(index_exports);

// src/server/AstMutationEngine.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_ts_morph = require("ts-morph");
var AstMutationEngine = class {
  projectRoot;
  project;
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    const tsConfigPath = path.join(this.projectRoot, "tsconfig.json");
    if (fs.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph.Project({ compilerOptions: {
        target: 99
        /* ESNext */
      } });
    }
  }
  /**
   * Scans the workspace and builds the full visual architecture graph.
   */
  extractArchitectureGraph() {
    const nodes = [];
    const edges = [];
    const possibleEntityDirs = [
      path.join(this.projectRoot, "src", "entities"),
      path.join(this.projectRoot, "entities")
    ];
    for (const entitiesDir of possibleEntityDirs) {
      if (fs.existsSync(entitiesDir)) {
        this.scanEntitiesRecursive(entitiesDir, nodes, edges);
      }
    }
    const possibleLibDirs = [
      path.join(this.projectRoot, "src", "libraries"),
      path.join(this.projectRoot, "libraries")
    ];
    for (const libDir of possibleLibDirs) {
      if (fs.existsSync(libDir)) {
        const libFiles = fs.readdirSync(libDir, { withFileTypes: true });
        for (const file of libFiles) {
          if (file.isFile() && (file.name.endsWith(".ts") || file.name.endsWith(".js"))) {
            const baseName = file.name.replace(/\.(ts|js)$/, "");
            const libPath = path.join(libDir, file.name);
            nodes.push({
              id: `library:${baseName}`,
              type: "library",
              name: baseName,
              filePath: libPath
            });
          }
        }
      }
    }
    const possibleSubappDirs = [
      path.join(this.projectRoot, "src", "subapps"),
      path.join(this.projectRoot, "subapps")
    ];
    for (const subappDir of possibleSubappDirs) {
      if (fs.existsSync(subappDir)) {
        const subapps = fs.readdirSync(subappDir, { withFileTypes: true });
        for (const sa of subapps) {
          if (sa.isDirectory()) {
            const saName = sa.name;
            const saPath = path.join(subappDir, saName);
            nodes.push({
              id: `subapp:${saName}`,
              type: "subapp",
              name: saName,
              filePath: saPath
            });
          }
        }
      }
    }
    return { nodes, edges };
  }
  scanEntitiesRecursive(entitiesDir, nodes, edges, parentEntityName) {
    const entries = fs.readdirSync(entitiesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entityName = entry.name;
        const entityDir = path.join(entitiesDir, entityName);
        let entityFile = path.join(entityDir, `${entityName}.ts`);
        if (!fs.existsSync(entityFile)) {
          entityFile = path.join(entityDir, `${entityName}.js`);
        }
        const entityNodeId = `entity:${entityName}`;
        nodes.push({
          id: entityNodeId,
          type: "entity",
          name: entityName,
          parentEntity: parentEntityName,
          filePath: fs.existsSync(entityFile) ? entityFile : entityDir
        });
        if (parentEntityName) {
          edges.push({
            id: `edge:${parentEntityName}->child:${entityName}`,
            source: `entity:${parentEntityName}`,
            target: entityNodeId,
            type: "contains",
            deletable: true
          });
        }
        const funcDir = path.join(entityDir, "functionalities");
        if (fs.existsSync(funcDir)) {
          const funcs = fs.readdirSync(funcDir, { withFileTypes: true });
          for (const f of funcs) {
            if (f.isDirectory()) {
              const funcName = f.name;
              const funcPath = path.join(funcDir, funcName);
              const funcNode = this.parseFunctionalityQuadUnit(entityName, funcName, funcPath);
              nodes.push(funcNode);
              edges.push({
                id: `edge:${entityName}->${funcName}`,
                source: entityNodeId,
                target: funcNode.id,
                type: "contains",
                deletable: true
              });
            }
          }
        }
        const childEntitiesDir = path.join(entityDir, "entities");
        if (fs.existsSync(childEntitiesDir)) {
          this.scanEntitiesRecursive(childEntitiesDir, nodes, edges, entityName);
        }
      }
    }
  }
  parseFunctionalityQuadUnit(entityName, funcName, funcPath) {
    const helpers = [];
    const helpersDir = path.join(funcPath, "helper_functions");
    if (fs.existsSync(helpersDir)) {
      const hFiles = fs.readdirSync(helpersDir);
      for (const h of hFiles) {
        if (h.endsWith(".ts") || h.endsWith(".js")) {
          helpers.push({
            name: path.basename(h, path.extname(h)),
            filePath: path.join(helpersDir, h)
          });
        }
      }
    }
    const hasUi = fs.existsSync(path.join(funcPath, "ui")) || fs.existsSync(path.join(funcPath, `${funcName}UI.ts`));
    let logicFile = path.join(funcPath, "main_function", "logic.ts");
    if (!fs.existsSync(logicFile)) {
      logicFile = path.join(funcPath, "main_function", "logic.js");
    }
    if (!fs.existsSync(logicFile)) {
      logicFile = path.join(funcPath, `${funcName}.ts`);
    }
    if (!fs.existsSync(logicFile)) {
      logicFile = path.join(funcPath, `${funcName}.js`);
    }
    return {
      id: `functionality:${entityName}:${funcName}`,
      type: "functionality",
      name: funcName,
      parentEntity: entityName,
      filePath: logicFile,
      helpers,
      uiSpec: hasUi
    };
  }
  /**
   * Surgical AST Operation: Create Entity
   */
  createEntity(entityName) {
    const entityDir = path.join(this.projectRoot, "src", "entities", entityName);
    fs.mkdirSync(entityDir, { recursive: true });
    fs.mkdirSync(path.join(entityDir, "functionalities"), { recursive: true });
    const entityFile = path.join(entityDir, `${entityName}.ts`);
    const content = `import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class ${entityName} extends Entity {
  constructor() {
    super({
      id: '${entityName}',
      version: '1.0.0',
      description: '${entityName} root entity'
    });
  }

  async boot(): Promise<void> {
    // Magnetic auto-discovery of functionalities, child entities, and subapps
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${entityName};
`;
    fs.writeFileSync(entityFile, content);
    return { success: true, filePath: entityFile };
  }
  /**
   * Surgical AST Operation: Create Quad-Unit Functionality
   */
  createFunctionality(entityName, funcName) {
    const funcDir = path.join(this.projectRoot, "src", "entities", entityName, "functionalities", funcName);
    fs.mkdirSync(path.join(funcDir, "main_function"), { recursive: true });
    fs.mkdirSync(path.join(funcDir, "state_data"), { recursive: true });
    fs.mkdirSync(path.join(funcDir, "helper_functions"), { recursive: true });
    fs.mkdirSync(path.join(funcDir, "events"), { recursive: true });
    const atomFile = path.join(funcDir, `${funcName}Atom.ts`);
    fs.writeFileSync(atomFile, `export interface ${funcName}Input {
  payload?: any;
}

export interface ${funcName}Output {
  success: boolean;
  timestamp: number;
}
`);
    const logicFile = path.join(funcDir, "main_function", "logic.ts");
    fs.writeFileSync(logicFile, `import { ${funcName}Input, ${funcName}Output } from '../${funcName}Atom.js';
import { executeStep } from '../helper_functions/executeStep.js';

export const main = async (input: ${funcName}Input, { state, entity }: any): Promise<${funcName}Output> => {
  const timestamp = executeStep();
  return {
    success: true,
    timestamp
  };
};
`);
    const stateFile = path.join(funcDir, "state_data", "state.ts");
    fs.writeFileSync(stateFile, `export interface ${funcName}State {
  executionCount: number;
}

export const initialState: ${funcName}State = {
  executionCount: 0
};
`);
    const helperFile = path.join(funcDir, "helper_functions", "executeStep.ts");
    fs.writeFileSync(helperFile, `export function executeStep(): number {
  return Date.now();
}
`);
    return {
      success: true,
      filesCreated: [atomFile, logicFile, stateFile, helperFile]
    };
  }
  /**
   * Surgical AST Operation: Create Domain Concept Library (Layer 0)
   */
  createLibrary(domainName) {
    const libDir = path.join(this.projectRoot, "src", "libraries");
    fs.mkdirSync(libDir, { recursive: true });
    const fileName = `${domainName}Concepts.ts`;
    const filePath = path.join(libDir, fileName);
    const content = `/**
 * @file ${fileName}
 * @role component
 * @description Layer 0 pure domain concept library for ${domainName}.
 */

export class ${domainName}Concepts {
  static pureTransform<T>(data: T): T {
    return data;
  }
}
`;
    fs.writeFileSync(filePath, content);
    return { success: true, filePath };
  }
  /**
   * Surgical AST Operation: Add Flow Connection (entity.flow().then().branch())
   */
  addFlowStep(entityFilePath, flowName, stepFunctionName) {
    if (!fs.existsSync(entityFilePath)) return false;
    const sf = this.project.addSourceFileAtPath(entityFilePath);
    let modified = false;
    sf.forEachDescendant((node) => {
      if (import_ts_morph.Node.isMethodDeclaration(node) && node.getName() === "boot") {
        const body = node.getBody();
        if (body && import_ts_morph.Node.isBlock(body)) {
          const stmts = body.getStatements();
          const insertIdx = Math.max(0, stmts.length - 1);
          body.insertStatements(insertIdx, `this.flow('${flowName}').then('${stepFunctionName}').register({ visibility: 'public' });`);
          modified = true;
        }
      }
    });
    if (modified) {
      sf.formatText({ indentSize: 2 });
      sf.saveSync();
    }
    return modified;
  }
};

// src/server/FunctionExecutor.ts
var import_worker_threads = require("worker_threads");
var FunctionExecutor = class {
  /**
   * Executes a specific function in an isolated process/worker with performance metrics.
   */
  static async execute(request) {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs = [];
    return new Promise((resolve4) => {
      try {
        const workerCode = `
          const { parentPort, workerData } = require('worker_threads');
          const path = require('path');

          async function run() {
            try {
              let mod;
              const ext = path.extname(workerData.filePath);
              if (ext === '.ts') {
                try {
                  mod = await import(workerData.filePath);
                } catch (e) {
                  mod = await import('file://' + workerData.filePath);
                }
              } else {
                mod = await import('file://' + workerData.filePath);
              }

              const fn = workerData.functionName
                ? (mod[workerData.functionName] || mod.default || mod.main)
                : (mod.main || mod.default || mod[Object.keys(mod)[0]]);

              if (typeof fn !== 'function') {
                throw new Error("No executable function export found in " + workerData.filePath);
              }

              const dummyContext = {
                state: workerData.state || {},
                entity: {
                  id: 'TestSandbox',
                  call: async () => ({}),
                  emitEvent: () => {}
                }
              };

              const result = await fn(workerData.input || {}, dummyContext);
              parentPort.postMessage({ success: true, output: result });
            } catch (err) {
              parentPort.postMessage({ success: false, error: err && err.message ? err.message : String(err) });
            }
          }

          run();
        `;
        const worker = new import_worker_threads.Worker(workerCode, {
          eval: true,
          workerData: request
        });
        const timer = setTimeout(() => {
          worker.terminate();
          resolve4({
            success: false,
            durationMs: performance.now() - startTime,
            memoryDeltaBytes: 0,
            error: "Execution timed out after 5000ms",
            logs
          });
        }, 5e3);
        worker.on("message", (msg) => {
          clearTimeout(timer);
          const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
          const memoryDeltaBytes = process.memoryUsage().heapUsed - initialMem;
          resolve4({
            success: msg.success,
            output: msg.output,
            error: msg.error,
            durationMs,
            memoryDeltaBytes,
            logs
          });
        });
        worker.on("error", (err) => {
          clearTimeout(timer);
          resolve4({
            success: false,
            durationMs: performance.now() - startTime,
            memoryDeltaBytes: 0,
            error: err?.message || String(err),
            logs
          });
        });
      } catch (err) {
        resolve4({
          success: false,
          durationMs: performance.now() - startTime,
          memoryDeltaBytes: 0,
          error: err?.message || String(err),
          logs
        });
      }
    });
  }
};

// src/server/FileWatcher.ts
var fs2 = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var StudioFileWatcher = class {
  watcher = null;
  rootDir;
  listeners = /* @__PURE__ */ new Set();
  debounceTimers = /* @__PURE__ */ new Map();
  constructor(rootDir = process.cwd()) {
    this.rootDir = path2.resolve(rootDir);
  }
  start() {
    if (this.watcher) return;
    const srcDir = path2.join(this.rootDir, "src");
    if (!fs2.existsSync(srcDir)) return;
    this.watcher = fs2.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes("node_modules") || filename.includes("dist") || filename.includes(".git")) return;
      const fullPath = path2.join(srcDir, filename);
      if (this.debounceTimers.has(fullPath)) {
        clearTimeout(this.debounceTimers.get(fullPath));
      }
      const timer = setTimeout(() => {
        this.debounceTimers.delete(fullPath);
        for (const listener of this.listeners) {
          try {
            listener({ eventType, filename, fullPath });
          } catch (e) {
          }
        }
      }, 150);
      this.debounceTimers.set(fullPath, timer);
    });
  }
  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
};

// src/server/JsonRpcRouter.ts
var import_krnl_validate = require("@dinilmusick/krnl-validate");
var JsonRpcRouter = class {
  astEngine;
  validator;
  projectRoot;
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.astEngine = new AstMutationEngine(projectRoot);
    this.validator = new import_krnl_validate.KrnlValidatorEngine({ projectRoot });
  }
  async handle(req) {
    try {
      const { method, params = {}, id } = req;
      switch (method) {
        case "graph.getArchitecture": {
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: "2.0", id, result: graph };
        }
        case "graph.createEntity": {
          const { name } = params;
          if (!name) throw new Error("Entity name is required");
          const res = this.astEngine.createEntity(name);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: "2.0", id, result: { ...res, graph } };
        }
        case "graph.createFunctionality": {
          const { entityName, name } = params;
          if (!entityName || !name) throw new Error("entityName and name are required");
          const res = this.astEngine.createFunctionality(entityName, name);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: "2.0", id, result: { ...res, graph } };
        }
        case "graph.createLibrary": {
          const { name } = params;
          if (!name) throw new Error("Library name is required");
          const res = this.astEngine.createLibrary(name);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: "2.0", id, result: { ...res, graph } };
        }
        case "graph.addFlowStep": {
          const { entityFilePath, flowName, stepFunctionName } = params;
          const success = this.astEngine.addFlowStep(entityFilePath, flowName, stepFunctionName);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: "2.0", id, result: { success, graph } };
        }
        case "test.executeFunction": {
          const result = await FunctionExecutor.execute(params);
          return { jsonrpc: "2.0", id, result };
        }
        case "validate.runPurityAudit": {
          const summary = this.validator.validateAll();
          return { jsonrpc: "2.0", id, result: summary };
        }
        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method '${method}' not found` }
          };
      }
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32e3, message: err?.message || String(err) }
      };
    }
  }
};

// src/server/StudioServer.ts
var http = __toESM(require("http"), 1);
var fs3 = __toESM(require("fs"), 1);
var path3 = __toESM(require("path"), 1);
var import_ws = require("ws");
var StudioServer = class {
  port;
  projectRoot;
  httpServer;
  wss;
  router;
  watcher;
  astEngine;
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.projectRoot = path3.resolve(options.projectRoot || process.cwd());
    this.router = new JsonRpcRouter(this.projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);
    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new import_ws.WebSocketServer({ server: this.httpServer, path: "/studio/ws" });
    this.initWebSocket();
    this.initFileWatcher();
  }
  initWebSocket() {
    this.wss.on("connection", (ws) => {
      const initialGraph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "graph.init", params: { ...initialGraph, projectRoot: this.projectRoot } }));
      ws.on("message", async (data) => {
        try {
          const req = JSON.parse(data.toString());
          if (req.method === "project.switch") {
            const newPath = path3.resolve(this.projectRoot, req.params.path);
            if (fs3.existsSync(newPath)) {
              this.projectRoot = newPath;
              this.router = new JsonRpcRouter(this.projectRoot);
              this.astEngine = new AstMutationEngine(this.projectRoot);
              this.watcher.stop();
              this.watcher = new StudioFileWatcher(this.projectRoot);
              this.initFileWatcher();
              const graph = this.astEngine.extractArchitectureGraph();
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, result: { success: true, projectRoot: this.projectRoot } }));
              this.broadcastGraphUpdate();
            } else {
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32001, message: "Directory does not exist" } }));
            }
            return;
          }
          const res = await this.router.handle(req);
          ws.send(JSON.stringify(res));
          if (req.method && req.method.startsWith("graph.create")) {
            this.broadcastGraphUpdate();
          }
        } catch (e) {
          ws.send(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error: " + (e.message || String(e)) }
          }));
        }
      });
    });
  }
  initFileWatcher() {
    this.watcher.start();
    this.watcher.subscribe(() => {
      this.broadcastGraphUpdate();
    });
  }
  broadcastGraphUpdate() {
    const graph = this.astEngine.extractArchitectureGraph();
    const payload = JSON.stringify({ jsonrpc: "2.0", method: "graph.updated", params: { ...graph, projectRoot: this.projectRoot } });
    for (const client of this.wss.clients) {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
  handleHttpRequest(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url === "/api/graph") {
      const graph = this.astEngine.extractArchitectureGraph();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(graph));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(this.getStudioHtml());
  }
  getStudioHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krnl Studio \u2014 Visual Node IDE & Workflow Engine</title>
  <style>
    :root {
      --krnl-bg: #0e0e12;
      --krnl-panel: #16161e;
      --krnl-panel-hover: #1f1f2a;
      --krnl-accent: #d4af37;
      --krnl-accent-glow: rgba(212, 175, 55, 0.35);
      --krnl-text: #f5ede4;
      --krnl-border: 1px solid rgba(212, 175, 55, 0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--krnl-bg);
      color: var(--krnl-text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }
    #app { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
    .studio-canvas { width: 100%; height: 100%; position: absolute; inset: 0; display: none; }
    .studio-canvas.active { display: block; }
    
    /* Header */
    .studio-header {
      position: absolute; top: 12px; left: 16px; right: 16px; z-index: 1000;
      background: rgba(22, 22, 30, 0.88); backdrop-filter: blur(14px);
      border: var(--krnl-border); border-radius: 10px; padding: 8px 16px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px; font-weight: bold; box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #98c379; box-shadow: 0 0 8px #98c379; }

    /* Graph Canvas Viewport */
    #graph-viewport {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      background-image: radial-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px);
      background-size: 24px 24px; cursor: grab;
    }
    #graph-viewport:active { cursor: grabbing; }
    #graph-container { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
    #svg-wires { position: absolute; top: 0; left: 0; width: 5000px; height: 5000px; pointer-events: none; }

    /* Nodes */
    .krnl-node {
      position: absolute; border-radius: 10px; padding: 14px 16px;
      font-family: inherit; color: var(--krnl-text); cursor: move;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
      z-index: 10;
    }
    .krnl-node:hover {
      box-shadow: 0 8px 30px rgba(0,0,0,0.8), 0 0 16px var(--krnl-accent-glow);
    }
    .krnl-node-entity {
      background: rgba(24, 24, 34, 0.95); border: 2px solid #d4af37;
      min-width: 240px; box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 12px var(--krnl-accent-glow);
    }
    .krnl-node-functionality {
      background: rgba(18, 18, 26, 0.95); border: 1px solid rgba(255, 255, 255, 0.25);
      min-width: 210px; box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .krnl-node-library {
      background: rgba(32, 26, 20, 0.95); border: 1px solid #e5c07b;
      min-width: 190px;
    }
    .krnl-node-subapp {
      background: rgba(20, 30, 36, 0.95); border: 1px dashed #56b6c2;
      min-width: 210px;
    }

    /* Socket Ports */
    .node-socket {
      width: 12px; height: 12px; border-radius: 50%;
      background: #d4af37; border: 2px solid #0e0e12;
      position: absolute; cursor: crosshair;
    }
    .socket-out { right: -6px; top: 50%; transform: translateY(-50%); }
    .socket-in { left: -6px; top: 50%; transform: translateY(-50%); background: #61afef; }

    /* Context Menu */
    #context-menu {
      position: fixed; display: none; z-index: 9999;
      background: rgba(22, 22, 30, 0.98); backdrop-filter: blur(16px);
      border: var(--krnl-border); border-radius: 8px; padding: 6px; min-width: 170px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 10px var(--krnl-accent-glow);
    }
    .menu-item {
      padding: 8px 12px; font-size: 12px; border-radius: 4px; cursor: pointer;
      display: flex; align-items: center; gap: 8px; color: var(--krnl-text);
    }
    .menu-item:hover { background: rgba(212, 175, 55, 0.25); color: #d4af37; }
  </style>
</head>
<body>
  <div id="app">
    <!-- Top Header Navigation -->
    <div class="studio-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="status-dot"></span>
        <span style="letter-spacing: 1px;">KRNL STUDIO</span>
        <span style="color: var(--krnl-accent);">|</span>
        <span id="canvas-title" style="color: #abb2bf;">\u{1F3D7}\uFE0F Architecture Canvas</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 11px; color: #7f848e;">Project:</span>
        <select id="project-selector" onchange="switchProject(this.value)" style="background: #1e1e28; color: #d4af37; border: var(--krnl-border); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
          <option value=".">Current Root Project</option>
          <option value="examples/calculator-app">examples/calculator-app</option>
          <option value="examples/ecommerce-app">examples/ecommerce-app</option>
          <option value="examples/ai-agent-app">examples/ai-agent-app</option>
          <option value="examples/example1/CalculatorSystem">examples/example1/CalculatorSystem</option>
        </select>
        <button onclick="triggerPurityAudit()" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold;">\u26A1 Run AST Purity Audit</button>
      </div>
    </div>

    <!-- 1. Architecture Node Graph Canvas -->
    <div id="canvas-architecture" class="studio-canvas active">
      <div id="graph-viewport">
        <div id="graph-container">
          <svg id="svg-wires"></svg>
          <div id="nodes-layer"></div>
        </div>
      </div>
    </div>

    <!-- 2. UI Composer Canvas -->
    <div id="canvas-ui" class="studio-canvas">
      <div style="display: flex; width: 100%; height: 100%; padding-top: 60px;">
        <div style="width: 250px; border-right: var(--krnl-border); padding: 16px; background: var(--krnl-panel);">
          <h3 style="font-size: 12px; color: var(--krnl-accent); margin-bottom: 12px; letter-spacing: 0.5px;">KRNL UI ATOMS</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlButton')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">\u{1F518} KrnlButton</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlTextInput')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">\u{1F4DD} KrnlTextInput</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlDropdown')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">\u{1F4CB} KrnlDropdown</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlTile')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">\u{1F4CA} KrnlTile</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlDock')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">\u{1F680} KrnlDock</div>
          </div>
        </div>
        <div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div id="ui-drop-target" ondragover="event.preventDefault()" ondrop="onDropAtom(event)" style="flex: 1; border: 2px dashed rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
            <div id="ui-empty-hint" style="text-align: center; color: #7f848e; margin: auto;">Drag KrnlUI atoms here to compose live views</div>
          </div>
          <div style="height: 160px; border-top: var(--krnl-border); padding-top: 12px; display: flex; flex-direction: column;">
            <div style="font-size: 11px; color: var(--krnl-accent); margin-bottom: 6px;">GENERATED VANJS TYPESCRIPT SOURCE CODE</div>
            <textarea id="ui-generated-code" readonly style="flex: 1; background: #16161e; border: var(--krnl-border); color: #98c379; font-family: monospace; font-size: 11px; padding: 8px; border-radius: 6px;"></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Test Console Canvas -->
    <div id="canvas-test" class="studio-canvas">
      <div style="display: flex; width: 100%; height: 100%; padding-top: 60px;">
        <div style="width: 280px; border-right: var(--krnl-border); padding: 16px; background: var(--krnl-panel); overflow-y: auto;">
          <h3 style="font-size: 12px; color: var(--krnl-accent); margin-bottom: 12px;">SELECT FUNCTION TO TEST</h3>
          <div id="test-fn-items" style="display: flex; flex-direction: column; gap: 6px;"></div>
        </div>
        <div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 id="active-test-fn-name" style="font-size: 17px; color: var(--krnl-accent);">Select a function from the left</h2>
            <button id="btn-run-test" style="background: #d4af37; color: #121212; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">\u25B6 Execute in Sandbox</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">INPUT (JSON)</label>
              <textarea id="test-input-json" style="flex: 1; background: #16161e; border: var(--krnl-border); color: #98c379; font-family: monospace; padding: 12px; border-radius: 6px;">{
  "payload": "demo_test_value"
}</textarea>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">EXECUTION METRICS & OUTPUT</label>
              <div id="test-output-panel" style="flex: 1; background: #16161e; border: var(--krnl-border); padding: 12px; border-radius: 6px; font-family: monospace; overflow-y: auto;">
                <div style="color: #7f848e;">Awaiting test execution...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Dock Switcher -->
    <div style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(22, 22, 30, 0.88); backdrop-filter: blur(14px); border: var(--krnl-border); padding: 8px 14px; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.7); z-index: 2000;">
      <button id="dock-btn-arch" onclick="switchCanvas('architecture', '\u{1F3D7}\uFE0F Architecture Canvas')" style="background: rgba(212, 175, 55, 0.25); border: 1px solid #d4af37; color: #d4af37; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;">\u{1F3D7}\uFE0F Architecture</button>
      <button id="dock-btn-ui" onclick="switchCanvas('ui', '\u{1F3A8} UI Composer')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px;">\u{1F3A8} UI Composer</button>
      <button id="dock-btn-test" onclick="switchCanvas('test', '\u{1F9EA} Test Console')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px;">\u{1F9EA} Test Console</button>
    </div>

    <!-- Context Menu -->
    <div id="context-menu">
      <div class="menu-item" onclick="contextAddEntity()">\u{1F4E6} New Entity</div>
      <div class="menu-item" onclick="contextAddFunctionality()">\u26A1 New Functionality</div>
      <div class="menu-item" onclick="contextAddLibrary()">\u{1F4DA} New Domain Library</div>
      <div class="menu-item" onclick="autoLayoutNodes()">\u{1F4D0} Auto Align Nodes</div>
    </div>
  </div>

  <script>
    let activeCanvas = 'architecture';
    let currentGraph = { nodes: [], edges: [] };
    let selectedFunction = null;
    let droppedAtoms = [];

    // Viewport Pan & Zoom State
    let panX = 40, panY = 70, zoom = 1.0;
    let isPanning = false, startPanX = 0, startPanY = 0;
    const viewport = document.getElementById('graph-viewport');
    const container = document.getElementById('graph-container');

    viewport.onmousedown = (e) => {
      if (e.target === viewport || e.target.id === 'svg-wires' || e.target.id === 'nodes-layer') {
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
      }
    };
    window.onmousemove = (e) => {
      if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
      }
    };
    window.onmouseup = () => { isPanning = false; };
    viewport.onwheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.min(Math.max(0.4, zoom * zoomFactor), 2.5);
      updateTransform();
    };

    function updateTransform() {
      container.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${zoom})\`;
    }
    updateTransform();

    // Context Menu Handling
    let contextClickPos = { x: 100, y: 100 };
    viewport.oncontextmenu = (e) => {
      e.preventDefault();
      contextClickPos = { x: (e.clientX - panX) / zoom, y: (e.clientY - panY) / zoom };
      const menu = document.getElementById('context-menu');
      menu.style.display = 'block';
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
    };
    window.onclick = () => { document.getElementById('context-menu').style.display = 'none'; };

    function switchCanvas(canvasId, title) {
      activeCanvas = canvasId;
      document.querySelectorAll('.studio-canvas').forEach(c => c.classList.remove('active'));
      document.getElementById('canvas-' + canvasId).classList.add('active');
      document.getElementById('canvas-title').textContent = title;

      ['arch', 'ui', 'test'].forEach(k => {
        const btn = document.getElementById('dock-btn-' + k);
        if (canvasId.startsWith(k)) {
          btn.style.background = 'rgba(212, 175, 55, 0.25)';
          btn.style.borderColor = '#d4af37';
          btn.style.color = '#d4af37';
          btn.style.fontWeight = 'bold';
        } else {
          btn.style.background = 'rgba(255, 255, 255, 0.05)';
          btn.style.borderColor = 'rgba(255,255,255,0.1)';
          btn.style.color = '#e0e0e0';
          btn.style.fontWeight = 'normal';
        }
      });
    }

    // WebSocket JSON-RPC
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(protocol + '//' + window.location.host + '/studio/ws');

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'graph.init' || msg.method === 'graph.updated') {
        currentGraph = msg.params;
        renderGraphNodes(currentGraph);
        renderTestFunctions(currentGraph);
      } else if (msg.result && msg.result.durationMs !== undefined) {
        renderTestOutput(msg.result);
      } else if (msg.result && msg.result.errors !== undefined) {
        alert(\`AST Purity Audit: \${msg.result.valid ? 'PASSED (Clean)' : 'FAILED (' + msg.result.errors.length + ' errors)'}\`);
      }
    };

    function renderGraphNodes(graph) {
      const layer = document.getElementById('nodes-layer');
      layer.innerHTML = '';

      let col = 0, row = 0;
      const positions = new Map();

      // Entity Nodes
      const entities = graph.nodes.filter(n => n.type === 'entity');
      entities.forEach((node, idx) => {
        const x = 60 + (idx % 3) * 320;
        const y = 60 + Math.floor(idx / 3) * 280;
        positions.set(node.id, { x, y });
        createNodeElement(node, x, y, layer);
      });

      // Functionality Nodes
      const funcs = graph.nodes.filter(n => n.type === 'functionality');
      funcs.forEach((node, idx) => {
        const parentPos = node.parentEntity ? positions.get('entity:' + node.parentEntity) : null;
        const x = parentPos ? parentPos.x + 40 : 420 + (idx % 3) * 280;
        const y = parentPos ? parentPos.y + 120 + (idx % 2) * 90 : 380 + Math.floor(idx / 3) * 160;
        positions.set(node.id, { x, y });
        createNodeElement(node, x, y, layer);
      });

      // Libraries & Subapps
      const others = graph.nodes.filter(n => n.type === 'library' || n.type === 'subapp');
      others.forEach((node, idx) => {
        const x = 740 + (idx % 2) * 240;
        const y = 80 + idx * 140;
        positions.set(node.id, { x, y });
        createNodeElement(node, x, y, layer);
      });

      renderWires(graph.edges, positions);
    }

    function createNodeElement(node, x, y, layer) {
      const el = document.createElement('div');
      el.className = 'krnl-node krnl-node-' + node.type;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.id = 'dom-' + node.id.replace(/[:/]/g, '_');

      el.innerHTML = \`
        <div style="font-size: 10px; text-transform: uppercase; color: var(--krnl-accent); font-weight: bold; margin-bottom: 4px;">\${node.type}</div>
        <div style="font-size: 15px; font-weight: bold; margin-bottom: 6px;">\${node.name}</div>
        <div style="font-size: 9px; color: #7f848e; font-family: monospace; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${node.filePath}</div>
        <div class="node-socket socket-out"></div>
        <div class="node-socket socket-in"></div>
      \`;

      // Drag node
      let isDraggingNode = false, startX = 0, startY = 0, nodeX = x, nodeY = y;
      el.onmousedown = (e) => {
        if (e.target.classList.contains('node-socket')) return;
        isDraggingNode = true;
        startX = e.clientX;
        startY = e.clientY;
        e.stopPropagation();
      };
      window.addEventListener('mousemove', (e) => {
        if (isDraggingNode) {
          const dx = (e.clientX - startX) / zoom;
          const dy = (e.clientY - startY) / zoom;
          el.style.left = (nodeX + dx) + 'px';
          el.style.top = (nodeY + dy) + 'px';
        }
      });
      window.addEventListener('mouseup', () => {
        if (isDraggingNode) {
          nodeX = parseFloat(el.style.left);
          nodeY = parseFloat(el.style.top);
          isDraggingNode = false;
        }
      });

      layer.appendChild(el);
    }

    function renderWires(edges, positions) {
      const svg = document.getElementById('svg-wires');
      svg.innerHTML = '';

      for (const edge of edges) {
        const sPos = positions.get(edge.source);
        const tPos = positions.get(edge.target);
        if (sPos && tPos) {
          const sx = sPos.x + 220, sy = sPos.y + 40;
          const tx = tPos.x, ty = tPos.y + 35;
          const dx = Math.abs(tx - sx) * 0.5;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
          path.setAttribute('stroke', '#d4af37');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-dasharray', edge.type === 'contains' ? 'none' : '4,4');
          path.setAttribute('opacity', '0.75');
          svg.appendChild(path);
        }
      }
    }

    function renderTestFunctions(graph) {
      const list = document.getElementById('test-fn-items');
      list.innerHTML = '';

      for (const node of graph.nodes) {
        if (node.type === 'functionality' || node.type === 'library') {
          const item = document.createElement('div');
          item.style.cssText = 'padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: pointer; font-size: 12px;';
          item.innerHTML = \`<span style="color: var(--krnl-accent); font-weight: bold;">\${node.parentEntity ? node.parentEntity + ' > ' : ''}</span>\${node.name}\`;
          item.onclick = () => {
            selectedFunction = node;
            document.getElementById('active-test-fn-name').textContent = 'Testing: ' + node.name;
          };
          list.appendChild(item);
        }
      }
    }

    document.getElementById('btn-run-test').onclick = () => {
      if (!selectedFunction) {
        alert('Please select a function to test.');
        return;
      }
      let inputVal = {};
      try {
        inputVal = JSON.parse(document.getElementById('test-input-json').value);
      } catch (e) {
        alert('Invalid JSON input: ' + e.message);
        return;
      }

      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-' + Date.now(),
        method: 'test.executeFunction',
        params: {
          filePath: selectedFunction.filePath,
          input: inputVal
        }
      }));
    };

    function renderTestOutput(result) {
      const out = document.getElementById('test-output-panel');
      const badge = result.success ? '<span style="color: #98c379; font-weight: bold;">[SUCCESS]</span>' : '<span style="color: #e06c75; font-weight: bold;">[ERROR]</span>';
      out.innerHTML = \`
        <div style="margin-bottom: 8px;">\${badge} Duration: <b>\${result.durationMs}ms</b></div>
        <pre style="color: #e5c07b;">\${JSON.stringify(result.output || result.error, null, 2)}</pre>
      \`;
    }

    function switchProject(relPath) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'switch-' + Date.now(),
        method: 'project.switch',
        params: { path: relPath }
      }));
    }

    function triggerPurityAudit() {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'audit-' + Date.now(),
        method: 'validate.runPurityAudit'
      }));
    }

    function contextAddEntity() {
      const name = prompt('Enter Entity Name (e.g. OrderSystem):');
      if (name) {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'create-ent-' + Date.now(),
          method: 'graph.createEntity',
          params: { name }
        }));
      }
    }

    function contextAddFunctionality() {
      const entityName = prompt('Enter Parent Entity Name:');
      const name = prompt('Enter Functionality Name:');
      if (entityName && name) {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'create-fn-' + Date.now(),
          method: 'graph.createFunctionality',
          params: { entityName, name }
        }));
      }
    }

    function contextAddLibrary() {
      const name = prompt('Enter Domain Concept Library Name (e.g. Payment):');
      if (name) {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'create-lib-' + Date.now(),
          method: 'graph.createLibrary',
          params: { name }
        }));
      }
    }

    // UI Composer Drag & Drop
    function onDragAtom(e, atomType) {
      e.dataTransfer.setData('text/plain', atomType);
    }
    function onDropAtom(e) {
      e.preventDefault();
      const atomType = e.dataTransfer.getData('text/plain');
      if (atomType) {
        document.getElementById('ui-empty-hint').style.display = 'none';
        droppedAtoms.push({ type: atomType });
        renderDroppedUI();
      }
    }
    function renderDroppedUI() {
      const target = document.getElementById('ui-drop-target');
      target.innerHTML = '';
      for (const atom of droppedAtoms) {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 12px; background: #21212b; border: var(--krnl-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
        item.innerHTML = \`<span>\${atom.type}</span><span style="color: #7f848e; font-size: 11px;">Bound to Entity</span>\`;
        target.appendChild(item);
      }

      // Generate VanJS code snippet
      const imports = Array.from(new Set(droppedAtoms.map(a => a.type))).join(', ');
      const code = \`import van from 'vanjs-core';
import { \${imports} } from '@dinilmusick/krnl-ui';

export function View({ state, entity }: any): HTMLElement {
  const { div } = van.tags;
  return div(
    { class: 'krnl-view-panel' },
    \${droppedAtoms.map(a => a.type + '({ ... })').join(',\\n    ')}
  );
}\`;
      document.getElementById('ui-generated-code').value = code;
    }
  </script>
</body>
</html>`;
  }
  async start() {
    return new Promise((resolve4) => {
      this.httpServer.listen(this.port, () => {
        console.log(`
\u{1F680} [Krnl Studio] Visual IDE running at: http://localhost:${this.port}`);
        console.log(`\u{1F4E1} [Krnl Studio] WebSocket JSON-RPC protocol active on /studio/ws
`);
        resolve4();
      });
    });
  }
  async stop() {
    this.watcher.stop();
    return new Promise((resolve4) => {
      this.wss.close(() => {
        this.httpServer.close(() => resolve4());
      });
    });
  }
};

// src/client/plugins/VanJSRenderPlugin.ts
var import_vanjs_core = __toESM(require("vanjs-core"), 1);
var { div, span, button } = import_vanjs_core.default.tags;
function createVanJSRenderPlugin(options = {}) {
  return (area) => {
    area.addPipe((context) => {
      if (context.type === "render") {
        const { element } = context.data;
        if (context.data.type === "node") {
          const nodeData = context.data.data;
          const nodeType = nodeData.nodeType || "functionality";
          const nodeView = div(
            {
              class: `krnl-node krnl-node-${nodeType}`,
              style: `
                background: rgba(22, 22, 30, 0.95);
                border: 2px solid ${nodeType === "entity" ? "#d4af37" : "#4b5263"};
                border-radius: 10px;
                padding: 12px 16px;
                min-width: 220px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px ${nodeType === "entity" ? "rgba(212, 175, 55, 0.3)" : "transparent"};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                color: #f5ede4;
                position: relative;
                user-select: none;
              `,
              oncontextmenu: (e) => {
                e.preventDefault();
                if (options.onNodeContextMenu) {
                  options.onNodeContextMenu(nodeData.id, e);
                }
              }
            },
            div(
              { style: "font-size: 10px; text-transform: uppercase; color: #d4af37; font-weight: bold; margin-bottom: 4px;" },
              nodeType
            ),
            div(
              { style: "font-size: 15px; font-weight: bold; margin-bottom: 8px;" },
              nodeData.label || nodeData.name || "Unnamed Node"
            ),
            nodeData.filePath ? div(
              { style: "font-size: 9px; color: #7f848e; font-family: monospace; overflow: hidden; text-overflow: ellipsis;" },
              nodeData.filePath
            ) : null
          );
          element.replaceChildren(nodeView);
        }
      }
      return context;
    });
  };
}

// src/client/ui-builder/VanJSCodeGenerator.ts
var VanJSCodeGenerator = class {
  /**
   * Generates production-ready VanJS TypeScript source code from a component tree.
   */
  static generateCode(root, componentName = "GeneratedView") {
    const usedAtoms = /* @__PURE__ */ new Set();
    this.collectUsedAtoms(root, usedAtoms);
    const atomImports = Array.from(usedAtoms).filter((a) => a !== "Container" && a.startsWith("Krnl")).join(", ");
    let code = `import van from 'vanjs-core';
`;
    if (atomImports.length > 0) {
      code += `import { ${atomImports} } from '@dinilmusick/krnl-ui';
`;
    }
    code += `
`;
    code += `export function ${componentName}({ state, entity }: any): HTMLElement {
`;
    code += `  const { div } = van.tags;

`;
    code += `  return ${this.renderNodeToCode(root, 2)};
`;
    code += `}

`;
    code += `export default ${componentName};
`;
    return code;
  }
  static renderNodeToCode(node, indentLevel) {
    const indent = " ".repeat(indentLevel);
    const childIndent = " ".repeat(indentLevel + 2);
    if (node.type === "Container") {
      const childCode = (node.children || []).map((c) => this.renderNodeToCode(c, indentLevel + 2)).join(",\n");
      return `div(
${childIndent}{ class: '${node.props.class || "krnl-container"}' }${childCode ? `,
${childCode}` : ""}
${indent})`;
    }
    const propEntries = Object.entries(node.props).map(([k, v]) => {
      if (typeof v === "string" && (v.startsWith("state.") || v.startsWith("entity."))) {
        return `${k}: ${v}`;
      }
      if (k.startsWith("on") && typeof v === "string") {
        return `${k}: () => { ${v} }`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    }).join(", ");
    return `${node.type}({ ${propEntries} })`;
  }
  static collectUsedAtoms(node, atoms) {
    atoms.add(node.type);
    if (node.children) {
      for (const c of node.children) {
        this.collectUsedAtoms(c, atoms);
      }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AstMutationEngine,
  FunctionExecutor,
  JsonRpcRouter,
  StudioFileWatcher,
  StudioServer,
  VanJSCodeGenerator,
  createVanJSRenderPlugin
});
