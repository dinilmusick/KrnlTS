// src/server/AstMutationEngine.ts
import * as fs from "fs";
import * as path from "path";
import { Project, Node } from "ts-morph";
var AstMutationEngine = class {
  projectRoot;
  project;
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    const tsConfigPath = path.join(this.projectRoot, "tsconfig.json");
    if (fs.existsSync(tsConfigPath)) {
      this.project = new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new Project({ compilerOptions: {
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
    const entitiesDir = path.join(this.projectRoot, "src", "entities");
    if (fs.existsSync(entitiesDir)) {
      const entityEntries = fs.readdirSync(entitiesDir, { withFileTypes: true });
      for (const entry of entityEntries) {
        if (entry.isDirectory()) {
          const entityName = entry.name;
          const entityFilePath = path.join(entitiesDir, entityName, `${entityName}.ts`);
          nodes.push({
            id: `entity:${entityName}`,
            type: "entity",
            name: entityName,
            filePath: entityFilePath
          });
          const funcDir = path.join(entitiesDir, entityName, "functionalities");
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
                  source: `entity:${entityName}`,
                  target: funcNode.id,
                  type: "contains",
                  deletable: true
                });
              }
            }
          }
        }
      }
    }
    const libDir = path.join(this.projectRoot, "src", "libraries");
    if (fs.existsSync(libDir)) {
      const libFiles = fs.readdirSync(libDir, { withFileTypes: true });
      for (const file of libFiles) {
        if (file.isFile() && (file.name.endsWith("Concepts.ts") || file.name.endsWith(".ts"))) {
          const baseName = file.name.replace(/\.ts$/, "");
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
    const subappDir = path.join(this.projectRoot, "src", "subapps");
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
    return { nodes, edges };
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
    return {
      id: `functionality:${entityName}:${funcName}`,
      type: "functionality",
      name: funcName,
      parentEntity: entityName,
      filePath: path.join(funcPath, "main_function", "logic.ts"),
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
      if (Node.isMethodDeclaration(node) && node.getName() === "boot") {
        const body = node.getBody();
        if (body) {
          body.insertStatements(body.getStatements().length - 1, `this.flow('${flowName}').then('${stepFunctionName}').register({ visibility: 'public' });`);
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
import * as path2 from "path";
import { Worker } from "worker_threads";
var FunctionExecutor = class {
  /**
   * Executes a specific function in an isolated process/worker with performance metrics.
   */
  static async execute(request) {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs = [];
    const absPath = path2.resolve(request.filePath);
    return new Promise((resolve5) => {
      try {
        const workerCode = `
          const { parentPort, workerData } = require('worker_threads');
          const path = require('path');

          async function run() {
            try {
              let mod;
              const ext = path.extname(workerData.filePath);
              if (ext === '.ts') {
                // If TS file directly in dev runtime, use dynamic import with tsx or esm
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
        const worker = new Worker(workerCode, {
          eval: true,
          workerData: request
        });
        const timer = setTimeout(() => {
          worker.terminate();
          resolve5({
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
          resolve5({
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
          resolve5({
            success: false,
            durationMs: performance.now() - startTime,
            memoryDeltaBytes: 0,
            error: err.message,
            logs
          });
        });
      } catch (err) {
        resolve5({
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
import * as fs2 from "fs";
import * as path3 from "path";
var StudioFileWatcher = class {
  watcher = null;
  rootDir;
  listeners = /* @__PURE__ */ new Set();
  debounceTimers = /* @__PURE__ */ new Map();
  constructor(rootDir = process.cwd()) {
    this.rootDir = path3.resolve(rootDir);
  }
  start() {
    if (this.watcher) return;
    const srcDir = path3.join(this.rootDir, "src");
    if (!fs2.existsSync(srcDir)) return;
    this.watcher = fs2.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes("node_modules") || filename.includes("dist") || filename.includes(".git")) return;
      const fullPath = path3.join(srcDir, filename);
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
import { KrnlValidatorEngine } from "@dinilmusick/krnl-validate";
var JsonRpcRouter = class {
  astEngine;
  validator;
  projectRoot;
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.astEngine = new AstMutationEngine(projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot });
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
import * as http from "http";
import * as path4 from "path";
import { WebSocketServer, WebSocket } from "ws";
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
    this.projectRoot = path4.resolve(options.projectRoot || process.cwd());
    this.router = new JsonRpcRouter(this.projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);
    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ server: this.httpServer, path: "/studio/ws" });
    this.initWebSocket();
    this.initFileWatcher();
  }
  initWebSocket() {
    this.wss.on("connection", (ws) => {
      const initialGraph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "graph.init", params: initialGraph }));
      ws.on("message", async (data) => {
        try {
          const req = JSON.parse(data.toString());
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
    const payload = JSON.stringify({ jsonrpc: "2.0", method: "graph.updated", params: graph });
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
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
  <title>Krnl Studio \u2014 Visual Node IDE</title>
  <style>
    :root {
      --krnl-bg: #0e0e12;
      --krnl-panel: #16161e;
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
    }
    #app { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
    .studio-canvas { width: 100%; height: 100%; position: absolute; inset: 0; display: none; }
    .studio-canvas.active { display: block; }
    
    /* Top Header */
    .studio-header {
      position: absolute; top: 12px; left: 16px; z-index: 1000;
      background: rgba(22, 22, 30, 0.85); backdrop-filter: blur(10px);
      border: var(--krnl-border); border-radius: 8px; padding: 6px 14px;
      display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: bold;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #98c379; box-shadow: 0 0 8px #98c379; }

    /* Node Styles */
    .node-entity {
      background: rgba(26, 26, 36, 0.95); border: 2px solid #d4af37;
      border-radius: 12px; padding: 14px; min-width: 260px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 14px var(--krnl-accent-glow);
    }
    .node-functionality {
      background: rgba(20, 20, 28, 0.95); border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px; padding: 12px; min-width: 220px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
    .node-library {
      background: rgba(30, 24, 20, 0.95); border: 1px solid #e5c07b;
      border-radius: 8px; padding: 10px; min-width: 180px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="studio-header">
      <span class="status-dot"></span>
      <span>KRNL STUDIO v1.0.0</span>
      <span style="color: var(--krnl-accent); font-weight: normal;">|</span>
      <span id="canvas-indicator" style="color: #abb2bf;">\u{1F3D7}\uFE0F Architecture Canvas</span>
    </div>

    <!-- 1. Architecture Canvas -->
    <div id="canvas-architecture" class="studio-canvas active">
      <div id="rete-container" style="width: 100%; height: 100%;"></div>
    </div>

    <!-- 2. UI Composer Canvas -->
    <div id="canvas-ui" class="studio-canvas">
      <div style="display: flex; width: 100%; height: 100%; padding-top: 60px;">
        <div style="width: 240px; border-right: var(--krnl-border); padding: 16px; background: var(--krnl-panel);">
          <h3 style="font-size: 13px; color: var(--krnl-accent); margin-bottom: 12px;">KRNL UI ATOMS</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="palette-item" draggable="true" data-type="KrnlButton" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">\u{1F518} KrnlButton</div>
            <div class="palette-item" draggable="true" data-type="KrnlTextInput" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">\u{1F4DD} KrnlTextInput</div>
            <div class="palette-item" draggable="true" data-type="KrnlDropdown" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">\u{1F4CB} KrnlDropdown</div>
            <div class="palette-item" draggable="true" data-type="KrnlTile" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">\u{1F4CA} KrnlTile</div>
            <div class="palette-item" draggable="true" data-type="KrnlDock" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">\u{1F680} KrnlDock</div>
          </div>
        </div>
        <div id="ui-drop-target" style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: rgba(0,0,0,0.3);">
          <div style="border: 2px dashed rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 32px; text-align: center; color: #7f848e;">
            Drag KrnlUI atoms here to compose functionality views
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Test Console Canvas -->
    <div id="canvas-test" class="studio-canvas">
      <div style="display: flex; width: 100%; height: 100%; padding-top: 60px;">
        <div style="width: 280px; border-right: var(--krnl-border); padding: 16px; background: var(--krnl-panel); overflow-y: auto;" id="test-function-list">
          <h3 style="font-size: 13px; color: var(--krnl-accent); margin-bottom: 12px;">EXECUTABLE FUNCTIONS</h3>
          <div id="test-fn-items" style="display: flex; flex-direction: column; gap: 6px;"></div>
        </div>
        <div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px;" id="test-runner-panel">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 id="active-test-fn-name" style="font-size: 18px; color: var(--krnl-accent);">Select a function to test</h2>
            <button id="btn-run-test" style="background: #d4af37; color: #121212; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">\u25B6 Run Test</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">INPUT (JSON)</label>
              <textarea id="test-input-json" style="flex: 1; background: #16161e; border: var(--krnl-border); color: #98c379; font-family: monospace; padding: 12px; border-radius: 6px;">{
  "payload": "test"
}</textarea>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">EXECUTION OUTPUT & METRICS</label>
              <div id="test-output-panel" style="flex: 1; background: #16161e; border: var(--krnl-border); padding: 12px; border-radius: 6px; font-family: monospace; overflow-y: auto;">
                <div style="color: #7f848e;">Awaiting execution...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- macOS-Style Floating Dock Switcher -->
    <div style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(22, 22, 30, 0.85); backdrop-filter: blur(12px); border: var(--krnl-border); padding: 8px 14px; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 2000;">
      <button onclick="switchCanvas('architecture', '\u{1F3D7}\uFE0F Architecture Canvas')" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;">\u{1F3D7}\uFE0F Architecture</button>
      <button onclick="switchCanvas('ui', '\u{1F3A8} UI Composer')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;">\u{1F3A8} UI Composer</button>
      <button onclick="switchCanvas('test', '\u{1F9EA} Test Console')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;">\u{1F9EA} Test Console</button>
    </div>
  </div>

  <script>
    let activeCanvas = 'architecture';
    let currentGraph = { nodes: [], edges: [] };
    let selectedFunction = null;

    function switchCanvas(canvasId, title) {
      activeCanvas = canvasId;
      document.querySelectorAll('.studio-canvas').forEach(c => c.classList.remove('active'));
      document.getElementById('canvas-' + canvasId).classList.add('active');
      document.getElementById('canvas-indicator').textContent = title;
    }

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(protocol + '//' + window.location.host + '/studio/ws');

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'graph.init' || msg.method === 'graph.updated') {
        currentGraph = msg.params;
        renderGraphNodes(currentGraph);
        renderTestFunctions(currentGraph);
      } else if (msg.result && msg.result.output !== undefined) {
        renderTestOutput(msg.result);
      }
    };

    function renderGraphNodes(graph) {
      const container = document.getElementById('rete-container');
      container.innerHTML = '';
      
      const grid = document.createElement('div');
      grid.style.cssText = 'padding: 80px 40px; display: flex; flex-wrap: wrap; gap: 24px;';

      for (const node of graph.nodes) {
        const el = document.createElement('div');
        el.className = 'node-' + node.type;
        el.innerHTML = \`
          <div style="font-size: 11px; text-transform: uppercase; color: var(--krnl-accent); margin-bottom: 4px;">\${node.type}</div>
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">\${node.name}</div>
          <div style="font-size: 10px; color: #7f848e; font-family: monospace;">\${node.filePath}</div>
        \`;
        grid.appendChild(el);
      }

      container.appendChild(grid);
    }

    function renderTestFunctions(graph) {
      const list = document.getElementById('test-fn-items');
      list.innerHTML = '';

      for (const node of graph.nodes) {
        if (node.type === 'functionality' || node.type === 'library') {
          const item = document.createElement('div');
          item.style.cssText = 'padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: pointer; font-size: 12px;';
          item.textContent = (node.parentEntity ? node.parentEntity + ' > ' : '') + node.name;
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
        alert('Please select a function from the left panel.');
        return;
      }
      let inputVal = {};
      try {
        inputVal = JSON.parse(document.getElementById('test-input-json').value);
      } catch (e) {
        alert('Invalid JSON in Input: ' + e.message);
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
      const badge = result.success ? '<span style="color: #98c379;">[SUCCESS]</span>' : '<span style="color: #e06c75;">[FAILED]</span>';
      out.innerHTML = \`
        <div style="margin-bottom: 8px;">\${badge} Duration: <b>\${result.durationMs}ms</b></div>
        <pre style="color: #e5c07b;">\${JSON.stringify(result.output || result.error, null, 2)}</pre>
      \`;
    }
  </script>
</body>
</html>`;
  }
  async start() {
    return new Promise((resolve5) => {
      this.httpServer.listen(this.port, () => {
        console.log(`
\u{1F680} [Krnl Studio] Visual IDE running at: http://localhost:${this.port}`);
        console.log(`\u{1F4E1} [Krnl Studio] WebSocket JSON-RPC protocol active on /studio/ws
`);
        resolve5();
      });
    });
  }
  async stop() {
    this.watcher.stop();
    return new Promise((resolve5) => {
      this.wss.close(() => {
        this.httpServer.close(() => resolve5());
      });
    });
  }
};

export {
  AstMutationEngine,
  FunctionExecutor,
  StudioFileWatcher,
  JsonRpcRouter,
  StudioServer
};
