import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { JsonRpcRouter } from './JsonRpcRouter.js';
import { StudioFileWatcher } from './FileWatcher.js';
import { AstMutationEngine } from './AstMutationEngine.js';
import { PreemptiveDocManager } from './PreemptiveDocManager.js';

export interface StudioServerOptions {
  port?: number;
  projectRoot?: string;
}

export class StudioServer {
  private port: number;
  private projectRoot: string;
  private httpServer: http.Server;
  private wss: WebSocketServer;
  private router: JsonRpcRouter;
  private watcher: StudioFileWatcher;
  private astEngine: AstMutationEngine;

  constructor(options: StudioServerOptions = {}) {
    this.port = options.port || 8080;
    const initialRoot = path.resolve(options.projectRoot || process.cwd());
    
    // Auto-select unified-workspace if running from monorepo root
    const unifiedPath = path.join(initialRoot, 'examples/unified-workspace');
    if (!fs.existsSync(path.join(initialRoot, 'src/entities')) && fs.existsSync(unifiedPath)) {
      this.projectRoot = unifiedPath;
    } else {
      this.projectRoot = initialRoot;
    }

    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);

    this.router = new JsonRpcRouter(this.projectRoot, (mutation) => {
      this.broadcastAgentActivity(mutation);
    });

    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ server: this.httpServer, path: '/studio/ws' });

    this.initWebSocket();
    this.initFileWatcher();
  }

  private initWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      const initialGraph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'graph.init', params: { ...initialGraph, projectRoot: this.projectRoot } }));

      ws.on('message', async (data: string) => {
        try {
          const req = JSON.parse(data.toString());

          if (req.method === 'project.switch' || req.method === 'project.load') {
            const targetPath = req.params.path || req.params.projectPath;
            const newPath = path.isAbsolute(targetPath)
              ? targetPath
              : path.resolve(process.cwd(), targetPath);

            if (fs.existsSync(newPath)) {
              this.projectRoot = newPath;
              this.router.setProjectRoot(this.projectRoot);
              this.astEngine = new AstMutationEngine(this.projectRoot);
              this.watcher.stop();
              this.watcher = new StudioFileWatcher(this.projectRoot);
              this.initFileWatcher();
              const graph = this.astEngine.extractArchitectureGraph();
              const decorated = PreemptiveDocManager.decorateResponse('project.load', { success: true, projectRoot: this.projectRoot, graph });
              ws.send(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: decorated }));
              this.broadcastGraphUpdate();
            } else {
              ws.send(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32001, message: 'Directory does not exist: ' + targetPath } }));
            }
            return;
          }

          const res = await this.router.handle(req);
          ws.send(JSON.stringify(res));

          if (req.method && (req.method.startsWith('graph.') || req.method.startsWith('entity.') || req.method.startsWith('functionality.') || req.method.startsWith('library.'))) {
            this.broadcastGraphUpdate();
          }
        } catch (e: any) {
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error: ' + (e.message || String(e)) }
          }));
        }
      });
    });
  }

  private initFileWatcher() {
    this.watcher.start();
    this.watcher.subscribe(() => {
      this.broadcastGraphUpdate();
    });
  }

  private broadcastGraphUpdate() {
    const graph = this.astEngine.extractArchitectureGraph();
    const payload = JSON.stringify({ jsonrpc: '2.0', method: 'graph.updated', params: { ...graph, projectRoot: this.projectRoot } });
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private broadcastAgentActivity(mutation: { action: string; params: any }) {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'agent.activity',
      params: {
        action: mutation.action,
        params: mutation.params,
        timestamp: Date.now()
      }
    });
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url?.split('?')[0] || '/';

    // Direct Graph REST endpoint
    if (url === '/api/graph') {
      const graph = this.astEngine.extractArchitectureGraph();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', payload: graph, projectRoot: this.projectRoot }, null, 2));
      return;
    }

    // REST API Endpoint Routing for AI Agents
    if (url.startsWith('/api/v1/')) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        let params: any = {};
        if (body.trim()) {
          try { params = JSON.parse(body); } catch (e) {}
        }

        let method = 'graph.getArchitecture';
        if (url === '/api/v1/project/create') method = 'project.create';
        else if (url === '/api/v1/project/load') method = 'project.load';
        else if (url === '/api/v1/project/graph') method = 'graph.getArchitecture';
        else if (url === '/api/v1/project/status') method = 'project.getStatus';
        else if (url === '/api/v1/graph/moveNode') method = 'graph.moveNode';
        else if (url === '/api/v1/graph/connectNodes') method = 'graph.connectNodes';
        else if (url === '/api/v1/graph/deleteEdge') method = 'graph.deleteEdge';
        else if (url === '/api/v1/graph/deleteNode') method = 'graph.deleteNode';
        else if (url === '/api/v1/graph/alignLayout') method = 'graph.alignLayout';
        else if (url === '/api/v1/graph/undo') method = 'graph.undo';
        else if (url === '/api/v1/graph/redo') method = 'graph.redo';
        else if (url === '/api/v1/entity/create') method = 'entity.create';
        else if (url === '/api/v1/functionality/create') method = 'functionality.create';
        else if (url === '/api/v1/library/create') method = 'library.create';
        else if (url === '/api/v1/flow/addStep') method = 'flow.addStep';
        else if (url === '/api/v1/file/read') method = 'file.read';
        else if (url === '/api/v1/file/edit') method = 'file.edit';
        else if (url === '/api/v1/ui/generate') method = 'ui.generate';
        else if (url === '/api/v1/validate/audit') method = 'validate.audit';
        else if (url === '/api/v1/test/execute') method = 'test.executeFunction';
        else if (url === '/api/v1/docs/endpoints') method = 'docs.endpoints';

        const rpcRes = await this.router.handle({
          jsonrpc: '2.0',
          id: 'http-req-' + Date.now(),
          method,
          params
        });

        if (rpcRes.error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rpcRes.error, null, 2));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rpcRes.result, null, 2));
          this.broadcastGraphUpdate();
        }
      });
      return;
    }

    // Serve HTML Shell for Krnl Studio UI
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(this.getStudioHtml());
  }

  private getStudioHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krnl Studio — Differentiated Visual Architecture IDE</title>
  
  <!-- Monaco Editor AMD Loader -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>

  <style>
    :root {
      --krnl-bg: #0e0e12;
      --krnl-panel: #16161e;
      --krnl-panel-hover: #1f1f2a;
      --krnl-accent: #d4af37;
      --krnl-accent-glow: rgba(212, 175, 55, 0.45);
      --krnl-text: #f5ede4;
      --krnl-border: 1px solid rgba(212, 175, 55, 0.3);
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
      background: rgba(22, 22, 30, 0.94); backdrop-filter: blur(16px);
      border: var(--krnl-border); border-radius: 10px; padding: 8px 16px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px; font-weight: bold; box-shadow: 0 4px 24px rgba(0,0,0,0.7);
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #98c379; box-shadow: 0 0 10px #98c379; }

    /* Live Agent Activity Toast */
    #agent-activity-hud {
      position: fixed; top: 60px; left: 16px; z-index: 1500;
      background: rgba(22, 22, 30, 0.98); border: 2px solid #d4af37;
      border-radius: 8px; padding: 10px 18px; display: none; align-items: center; gap: 12px;
      font-size: 13px; color: #d4af37; font-weight: bold;
      box-shadow: 0 6px 28px rgba(0,0,0,0.9), 0 0 16px var(--krnl-accent-glow);
    }

    /* Graph Canvas Viewport */
    #graph-viewport {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      background-color: #0e0e12;
      background-image: radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px);
      background-size: 24px 24px; cursor: default;
    }
    #graph-container { position: absolute; top: 0; left: 0; width: 6000px; height: 6000px; transform-origin: 0 0; }
    
    /* CRITICAL LAYER POINTER-EVENTS ISOLATION */
    #svg-wires { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
    #nodes-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
    #gizmos-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 25; }

    /* Selection Box */
    #selection-box {
      position: absolute; display: none;
      border: 1px dashed #d4af37; background: rgba(212, 175, 55, 0.12);
      pointer-events: none; z-index: 999;
    }

    /* Base Node Structure */
    .krnl-node {
      position: absolute; border-radius: 12px;
      font-family: inherit; color: var(--krnl-text); cursor: grab;
      box-shadow: 0 10px 30px rgba(0,0,0,0.75);
      transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
      pointer-events: auto; z-index: 20;
      overflow: hidden;
    }
    .krnl-node:hover {
      box-shadow: 0 14px 42px rgba(0,0,0,0.9), 0 0 24px var(--krnl-accent-glow);
    }
    .krnl-node.dragging { cursor: grabbing !important; }
    .krnl-node.selected {
      box-shadow: 0 0 0 2px #f5ede4, 0 14px 42px rgba(0,0,0,0.9), 0 0 28px var(--krnl-accent-glow) !important;
    }

    /* ==========================================================================
       1. ENTITY SYSTEM NODES (Deep Obsidian with Gold Dual-Border & System Crown)
       ========================================================================== */
    .krnl-node-entity {
      background: linear-gradient(180deg, #1d1d28 0%, #13131b 100%);
      border: 2px solid #d4af37;
      min-width: 290px;
      box-shadow: 0 10px 32px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212, 175, 55, 0.4);
    }
    .node-header-entity {
      background: rgba(212, 175, 55, 0.12);
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      padding: 10px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }

    /* ==========================================================================
       2. QUAD-UNIT FUNCTIONALITY NODES (Technical Slate with 4-Layer Compartments)
       ========================================================================== */
    .krnl-node-functionality {
      background: linear-gradient(180deg, #181926 0%, #11121a 100%);
      border: 1px solid #61afef;
      min-width: 280px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(97, 175, 239, 0.3);
    }
    .node-header-functionality {
      background: rgba(97, 175, 239, 0.12);
      border-bottom: 1px solid rgba(97, 175, 239, 0.25);
      padding: 9px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .quad-layers-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      padding: 10px 14px; background: rgba(0,0,0,0.25);
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .quad-pill {
      font-size: 10px; padding: 4px 6px; border-radius: 4px;
      display: flex; align-items: center; gap: 4px; font-weight: 500;
    }

    /* ==========================================================================
       3. DOMAIN CONCEPT LIBRARY NODES (Warm Amber Bronze with Math Emblem)
       ========================================================================== */
    .krnl-node-library {
      background: linear-gradient(180deg, #261f18 0%, #18130e 100%);
      border: 1px solid #e5c07b;
      min-width: 250px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75), inset 0 1px 0 rgba(229, 192, 123, 0.3);
    }
    .node-header-library {
      background: rgba(229, 192, 123, 0.14);
      border-bottom: 1px solid rgba(229, 192, 123, 0.3);
      padding: 9px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }

    /* ==========================================================================
       4. SUB-APP NODES (Cyan Blueprint Frame with Route Container)
       ========================================================================== */
    .krnl-node-subapp {
      background: linear-gradient(180deg, #15222b 0%, #0d151c 100%);
      border: 1px dashed #56b6c2;
      min-width: 260px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75), inset 0 1px 0 rgba(86, 182, 194, 0.25);
    }
    .node-header-subapp {
      background: rgba(86, 182, 194, 0.14);
      border-bottom: 1px dashed rgba(86, 182, 194, 0.3);
      padding: 9px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }

    /* Socket Ports */
    .node-socket {
      width: 14px; height: 14px; border-radius: 50%;
      background: #d4af37; border: 2px solid #0e0e12;
      position: absolute; cursor: crosshair; pointer-events: auto; z-index: 35;
      transition: transform 0.1s ease, background 0.1s ease;
    }
    .node-socket:hover {
      transform: translateY(-50%) scale(1.35);
      background: #f5ede4;
      box-shadow: 0 0 12px #d4af37;
    }
    .socket-out { right: -7px; top: 50%; transform: translateY(-50%); }
    .socket-in { left: -7px; top: 50%; transform: translateY(-50%); background: #61afef; }

    /* Centered Wire Delete Gizmo */
    .edge-delete-gizmo {
      position: absolute; width: 20px; height: 20px; border-radius: 50%;
      background: #16161e; border: 1px solid #e06c75; color: #e06c75;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: bold; cursor: pointer; pointer-events: auto;
      transform: translate(-50%, -50%); z-index: 30;
      box-shadow: 0 2px 8px rgba(0,0,0,0.8);
      transition: all 0.15s ease;
    }
    .edge-delete-gizmo:hover {
      background: #e06c75; color: #fff; transform: translate(-50%, -50%) scale(1.25);
      box-shadow: 0 0 12px rgba(224, 108, 117, 0.8);
    }

    /* Context Menus */
    .krnl-context-menu {
      position: fixed; display: none; z-index: 9999;
      background: rgba(22, 22, 30, 0.98); backdrop-filter: blur(16px);
      border: var(--krnl-border); border-radius: 8px; padding: 6px; min-width: 190px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 10px var(--krnl-accent-glow);
    }
    .menu-item {
      padding: 8px 12px; font-size: 12px; border-radius: 4px; cursor: pointer;
      display: flex; align-items: center; gap: 8px; color: var(--krnl-text);
    }
    .menu-item:hover { background: rgba(212, 175, 55, 0.25); color: #d4af37; }
    .menu-separator { height: 1px; background: rgba(212, 175, 55, 0.15); margin: 4px 0; }

    /* Monaco Container */
    .monaco-card {
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px; overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Live Agent Activity Toast -->
    <div id="agent-activity-hud">
      <span style="font-size: 18px;">🤖</span>
      <span id="agent-hud-text">AI Agent Mutation</span>
    </div>

    <!-- Header -->
    <div class="studio-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="status-dot"></span>
        <span style="letter-spacing: 1px;">KRNL STUDIO</span>
        <span style="color: var(--krnl-accent);">|</span>
        <span id="canvas-title" style="color: #abb2bf;">🏗️ Architecture Canvas</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span id="node-count-badge" style="background: rgba(212, 175, 55, 0.15); color: #d4af37; padding: 3px 8px; border-radius: 4px; font-size: 11px;">0 Nodes</span>
        <span style="font-size: 11px; color: #7f848e;">Project:</span>
        <select id="project-selector" onchange="switchProject(this.value)" style="background: #1e1e28; color: #d4af37; border: var(--krnl-border); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
          <option value="examples/unified-workspace" selected>examples/unified-workspace (All Combined)</option>
          <option value="examples/calculator-app">examples/calculator-app</option>
          <option value="examples/ecommerce-app">examples/ecommerce-app</option>
          <option value="examples/ai-agent-app">examples/ai-agent-app</option>
          <option value=".">Framework Root</option>
        </select>
        <button onclick="triggerPurityAudit()" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold;">⚡ Run AST Purity Audit</button>
      </div>
    </div>

    <!-- 1. Architecture Canvas -->
    <div id="canvas-architecture" class="studio-canvas active">
      <div id="graph-viewport">
        <div id="graph-container">
          <svg id="svg-wires"></svg>
          <div id="nodes-layer"></div>
          <div id="gizmos-layer"></div>
          <div id="selection-box"></div>
        </div>
      </div>

      <!-- Source Code Drawer -->
      <div id="code-drawer" style="position: absolute; top: 60px; right: 16px; bottom: 80px; width: 500px; background: rgba(22, 22, 30, 0.96); backdrop-filter: blur(16px); border: var(--krnl-border); border-radius: 10px; display: none; flex-direction: column; z-index: 1500; box-shadow: 0 12px 36px rgba(0,0,0,0.8);">
        <div style="padding: 12px 16px; border-bottom: var(--krnl-border); display: flex; justify-content: space-between; align-items: center;">
          <span id="drawer-file-title" style="font-size: 12px; font-weight: bold; color: var(--krnl-accent); font-family: monospace;">Source File</span>
          <button onclick="closeCodeDrawer()" style="background: transparent; border: none; color: #abb2bf; cursor: pointer; font-size: 14px;">✕</button>
        </div>
        <div id="drawer-monaco-container" style="flex: 1; width: 100%;"></div>
      </div>
    </div>

    <!-- 2. UI Composer Canvas -->
    <div id="canvas-ui" class="studio-canvas">
      <div style="display: flex; width: 100%; height: 100%; padding-top: 60px;">
        <div style="width: 250px; border-right: var(--krnl-border); padding: 16px; background: var(--krnl-panel);">
          <h3 style="font-size: 12px; color: var(--krnl-accent); margin-bottom: 12px;">KRNL UI ATOMS</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlButton')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">🔘 KrnlButton</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlTextInput')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">📝 KrnlTextInput</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlDropdown')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">📋 KrnlDropdown</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlTile')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">📊 KrnlTile</div>
            <div class="palette-item" draggable="true" ondragstart="onDragAtom(event, 'KrnlDock')" style="padding: 10px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab; font-size: 12px;">🚀 KrnlDock</div>
          </div>
        </div>
        <div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div id="ui-drop-target" ondragover="event.preventDefault()" ondrop="onDropAtom(event)" style="flex: 1; border: 2px dashed rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
            <div id="ui-empty-hint" style="text-align: center; color: #7f848e; margin: auto;">Drag KrnlUI atoms here to compose live views</div>
          </div>
          <div style="height: 220px; display: flex; flex-direction: column;">
            <div style="font-size: 11px; color: var(--krnl-accent); margin-bottom: 6px;">⚡ GENERATED VANJS TYPESCRIPT CODE (MONACO IDE)</div>
            <div id="ui-monaco-container" class="monaco-card" style="flex: 1; width: 100%;"></div>
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
            <button id="btn-run-test" style="background: #d4af37; color: #121212; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">▶ Execute in Sandbox</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">INPUT (MONACO JSON EDITOR)</label>
              <div id="test-input-monaco" class="monaco-card" style="flex: 1; width: 100%;"></div>
            </div>
            <div style="display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 11px; color: #abb2bf;">EXECUTION OUTPUT & BENCHMARK</label>
                <span id="test-metrics-badge" style="font-size: 11px; color: #98c379; font-weight: bold;"></span>
              </div>
              <div id="test-output-monaco" class="monaco-card" style="flex: 1; width: 100%;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Dock -->
    <div style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(22, 22, 30, 0.88); backdrop-filter: blur(14px); border: var(--krnl-border); padding: 8px 14px; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.7); z-index: 2000;">
      <button id="dock-btn-arch" onclick="switchCanvas('architecture', '🏗️ Architecture Canvas')" style="background: rgba(212, 175, 55, 0.25); border: 1px solid #d4af37; color: #d4af37; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;">🏗️ Architecture</button>
      <button id="dock-btn-ui" onclick="switchCanvas('ui', '🎨 UI Composer')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px;">🎨 UI Composer</button>
      <button id="dock-btn-test" onclick="switchCanvas('test', '🧪 Test Console')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px;">🧪 Test Console</button>
    </div>

    <!-- Canvas Context Menu -->
    <div id="pane-context-menu" class="krnl-context-menu">
      <div class="menu-item" onclick="contextAddEntity()">📦 New Entity</div>
      <div class="menu-item" onclick="contextAddFunctionality()">⚡ New Functionality</div>
      <div class="menu-item" onclick="contextAddLibrary()">📚 New Domain Library</div>
      <div class="menu-separator"></div>
      <div class="menu-item" onclick="apiAlignLayout('hierarchical')">📐 Auto-Align Hierarchical</div>
      <div class="menu-item" onclick="resetZoomAndFit()">🎯 Fit View / Reset Zoom</div>
    </div>

    <!-- Node Context Menu -->
    <div id="node-context-menu" class="krnl-context-menu">
      <div class="menu-item" onclick="contextOpenSelectedSource()">📄 Inspect Source Code</div>
      <div class="menu-item" onclick="contextDuplicateSelected()">📋 Duplicate Node</div>
      <div class="menu-separator"></div>
      <div class="menu-item" onclick="contextDisconnectSelected()" style="color: #e5c07b;">🔌 Disconnect All Wires</div>
      <div class="menu-item" onclick="contextDeleteSelected()" style="color: #e06c75;">🗑️ Delete Node</div>
    </div>

    <!-- Wire Drop Auto-Spawn Menu -->
    <div id="autospawn-menu" class="krnl-context-menu">
      <div style="padding: 6px 12px; font-size: 10px; color: #d4af37; font-weight: bold; text-transform: uppercase;">Spawn & Auto-Connect:</div>
      <div class="menu-item" onclick="spawnAndConnect('functionality')">⚡ New Functionality</div>
      <div class="menu-item" onclick="spawnAndConnect('entity')">📦 New Entity</div>
      <div class="menu-item" onclick="spawnAndConnect('library')">📚 New Domain Library</div>
    </div>
  </div>

  <script>
    let activeCanvas = 'architecture';
    let currentGraph = { nodes: [], edges: [] };
    let selectedNodes = new Set();
    let selectedFunction = null;
    let droppedAtoms = [];
    let clipboardNodes = [];

    let monacoUiEditor = null;
    let monacoTestInputEditor = null;
    let monacoTestOutputEditor = null;
    let monacoDrawerEditor = null;

    // Viewport Pan & Zoom
    let panX = 40, panY = 70, zoom = 0.85;
    let isPanning = false, startPanX = 0, startPanY = 0;
    let isRightDragPanning = false, rightDragStartX = 0, rightDragStartY = 0, rightDragDist = 0;
    const viewport = document.getElementById('graph-viewport');
    const container = document.getElementById('graph-container');

    // Box Selection State
    let isBoxSelecting = false, boxStartX = 0, boxStartY = 0;
    const selectionBox = document.getElementById('selection-box');

    // Dragging Nodes State
    let isDraggingNode = false;
    let nodeDragMoved = false;
    let draggedNodeId = null;
    let dragStartPos = { x: 0, y: 0 };
    let initialNodePositions = new Map();

    // Wire Dragging State
    let isDraggingWire = false;
    let wireSource = null;
    let wireDropLocation = { x: 0, y: 0 };

    // Context Menus
    const paneMenu = document.getElementById('pane-context-menu');
    const nodeMenu = document.getElementById('node-context-menu');
    const spawnMenu = document.getElementById('autospawn-menu');
    let contextTargetNodeId = null;
    let contextClickPos = { x: 0, y: 0 };

    function hideContextMenus() {
      paneMenu.style.display = 'none';
      nodeMenu.style.display = 'none';
      spawnMenu.style.display = 'none';
    }
    window.addEventListener('click', hideContextMenus);

    // --- Mouse & Pan/Zoom Controls ---

    viewport.onmousedown = (e) => {
      hideContextMenus();
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // 1. Middle Click (button === 1) or Space+LeftClick: Pan canvas
      if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        viewport.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      // 2. Right-Click Drag: Pan fallback for Mac trackpad
      if (e.button === 2) {
        isRightDragPanning = true;
        rightDragDist = 0;
        rightDragStartX = e.clientX;
        rightDragStartY = e.clientY;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        return;
      }

      // 3. Left Click on Canvas Background: Box Marquee Selection or Deselect
      if (e.button === 0) {
        const isNodeOrSocket = e.target.closest('.krnl-node') || e.target.closest('.node-socket') || e.target.closest('.edge-delete-gizmo');
        if (!isNodeOrSocket) {
          if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
            selectedNodes.clear();
            updateNodeSelectionStyles();
          }
          isBoxSelecting = true;
          boxStartX = (clientX - panX) / zoom;
          boxStartY = (clientY - panY) / zoom;
          selectionBox.style.left = boxStartX + 'px';
          selectionBox.style.top = boxStartY + 'px';
          selectionBox.style.width = '0px';
          selectionBox.style.height = '0px';
          selectionBox.style.display = 'block';
        }
      }
    };

    window.addEventListener('mousemove', (e) => {
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // 1. Middle-Mouse Pan
      if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
        return;
      }

      // 2. Right-Drag Pan
      if (isRightDragPanning) {
        const dx = e.clientX - rightDragStartX;
        const dy = e.clientY - rightDragStartY;
        rightDragDist += Math.abs(dx) + Math.abs(dy);
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
        return;
      }

      // 3. Box Selection
      if (isBoxSelecting) {
        const currentX = (clientX - panX) / zoom;
        const currentY = (clientY - panY) / zoom;
        const left = Math.min(boxStartX, currentX);
        const top = Math.min(boxStartY, currentY);
        const width = Math.abs(currentX - boxStartX);
        const height = Math.abs(currentY - boxStartY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';

        // Select all nodes within bounding box
        for (const node of currentGraph.nodes) {
          const el = document.getElementById('node-' + node.id);
          if (el) {
            const nx = parseFloat(el.style.left);
            const ny = parseFloat(el.style.top);
            const nw = el.offsetWidth;
            const nh = el.offsetHeight;

            if (nx + nw >= left && nx <= left + width && ny + nh >= top && ny <= top + height) {
              selectedNodes.add(node.id);
            }
          }
        }
        updateNodeSelectionStyles();
        return;
      }

      // 4. Dragging Selected Nodes
      if (isDraggingNode) {
        nodeDragMoved = true;
        const dx = (clientX - dragStartPos.x) / zoom;
        const dy = (clientY - dragStartPos.y) / zoom;

        selectedNodes.forEach(nodeId => {
          const init = initialNodePositions.get(nodeId);
          if (init) {
            const el = document.getElementById('node-' + nodeId);
            if (el) {
              const newX = Math.round(init.x + dx);
              const newY = Math.round(init.y + dy);
              el.style.left = newX + 'px';
              el.style.top = newY + 'px';
            }
          }
        });

        renderWiresAndGizmos();
        return;
      }

      // 5. Live Wire Dragging
      if (isDraggingWire && wireSource) {
        const currentX = (clientX - panX) / zoom;
        const currentY = (clientY - panY) / zoom;
        drawLiveWire(wireSource.x, wireSource.y, currentX, currentY);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isPanning) {
        isPanning = false;
        viewport.style.cursor = 'default';
      }

      if (isRightDragPanning) {
        isRightDragPanning = false;
      }

      if (isBoxSelecting) {
        isBoxSelecting = false;
        selectionBox.style.display = 'none';
      }

      if (isDraggingNode) {
        isDraggingNode = false;
        document.querySelectorAll('.krnl-node').forEach(el => el.classList.remove('dragging'));

        if (nodeDragMoved) {
          const positions = {};
          selectedNodes.forEach(nodeId => {
            const el = document.getElementById('node-' + nodeId);
            if (el) {
              positions[nodeId] = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
            }
          });
          apiMoveMultipleNodes(positions);
        }
      }

      if (isDraggingWire) {
        isDraggingWire = false;
        removeLiveWire();

        const rect = viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        const dropX = Math.round((clientX - panX) / zoom);
        const dropY = Math.round((clientY - panY) / zoom);

        // Check if dropped on another socket
        const elemUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        if (elemUnderCursor && elemUnderCursor.classList.contains('node-socket')) {
          const targetNodeId = elemUnderCursor.dataset.nodeId;
          const targetSocketType = elemUnderCursor.dataset.socketType;

          if (targetNodeId && targetNodeId !== wireSource.nodeId && wireSource.socketType !== targetSocketType) {
            const src = wireSource.socketType === 'out' ? wireSource.nodeId : targetNodeId;
            const tgt = wireSource.socketType === 'out' ? targetNodeId : wireSource.nodeId;
            apiConnectNodes(src, tgt);
            return;
          }
        }

        // Dropped on empty canvas space -> Open Auto-Spawn Menu
        wireDropLocation = { x: dropX, y: dropY };
        spawnMenu.style.display = 'block';
        spawnMenu.style.left = e.clientX + 'px';
        spawnMenu.style.top = e.clientY + 'px';
      }
    });

    // Zoom on Scroll Centered at Mouse Cursor
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const graphX = (mouseX - panX) / zoom;
      const graphY = (mouseY - panY) / zoom;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(Math.max(0.25, zoom * zoomFactor), 2.5);

      panX = mouseX - graphX * newZoom;
      panY = mouseY - graphY * newZoom;
      zoom = newZoom;

      updateTransform();
    }, { passive: false });

    function updateTransform() {
      container.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${zoom})\`;
    }
    updateTransform();

    function resetZoomAndFit() {
      apiAlignLayout('hierarchical');
      panX = 40; panY = 70; zoom = 0.85;
      updateTransform();
    }

    // --- Context Menu Handlers ---

    viewport.oncontextmenu = (e) => {
      e.preventDefault();
      if (rightDragDist > 8) return;
      hideContextMenus();

      const rect = viewport.getBoundingClientRect();
      contextClickPos = {
        x: Math.round((e.clientX - rect.left - panX) / zoom),
        y: Math.round((e.clientY - rect.top - panY) / zoom)
      };

      const nodeEl = e.target.closest('.krnl-node');
      if (nodeEl) {
        contextTargetNodeId = nodeEl.dataset.nodeId;
        if (!selectedNodes.has(contextTargetNodeId)) {
          selectedNodes.clear();
          selectedNodes.add(contextTargetNodeId);
          updateNodeSelectionStyles();
        }
        nodeMenu.style.display = 'block';
        nodeMenu.style.left = e.clientX + 'px';
        nodeMenu.style.top = e.clientY + 'px';
      } else {
        paneMenu.style.display = 'block';
        paneMenu.style.left = e.clientX + 'px';
        paneMenu.style.top = e.clientY + 'px';
      }
    };

    // --- Hotkeys Matrix ---

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('.monaco-editor')) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedNodes.forEach(nodeId => apiDeleteNode(nodeId));
        selectedNodes.clear();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        currentGraph.nodes.forEach(n => selectedNodes.add(n.id));
        updateNodeSelectionStyles();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clipboardNodes = currentGraph.nodes.filter(n => selectedNodes.has(n.id));
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        clipboardNodes.forEach((node, idx) => {
          const newName = node.name + 'Copy';
          if (node.type === 'entity') apiCreateEntity(newName);
          else if (node.type === 'functionality') apiCreateFunctionality(node.parentEntity || 'App', newName);
          else if (node.type === 'library') apiCreateLibrary(newName);
        });
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) apiRedo();
        else apiUndo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        apiRedo();
      }
    });

    // --- Rich Differentiated Node Rendering Engine ---

    function renderGraphNodes(graph) {
      const layer = document.getElementById('nodes-layer');
      layer.innerHTML = '';

      if (!graph.nodes || graph.nodes.length === 0) {
        document.getElementById('node-count-badge').textContent = '0 Nodes (Empty)';
        return;
      }

      document.getElementById('node-count-badge').textContent = \`\${graph.nodes.length} Nodes | \${graph.edges?.length || 0} Wires\`;

      graph.nodes.forEach((node, idx) => {
        let x = node.position?.x;
        let y = node.position?.y;

        if (x === undefined || y === undefined) {
          if (node.type === 'entity') {
            const col = Math.floor(idx / 5);
            const row = idx % 5;
            x = 60 + col * 360;
            y = 60 + row * 240;
          } else if (node.type === 'functionality') {
            const col = Math.floor(idx / 6);
            const row = idx % 6;
            x = 840 + col * 340;
            y = 60 + row * 220;
          } else {
            x = 1580;
            y = 60 + idx * 180;
          }
        }

        createNodeElement(node, x, y, layer);
      });

      renderWiresAndGizmos();
      updateNodeSelectionStyles();
    }

    function createNodeElement(node, x, y, layer) {
      const el = document.createElement('div');
      el.id = 'node-' + node.id;
      el.dataset.nodeId = node.id;
      el.className = 'krnl-node krnl-node-' + node.type;
      el.style.left = x + 'px';
      el.style.top = y + 'px';

      let innerHtml = '';

      // 1. ENTITY SYSTEM NODES
      if (node.type === 'entity') {
        const parentBadge = node.parentEntity
          ? \`<span style="background: rgba(212, 175, 55, 0.2); color: #d4af37; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Subsystem of \${node.parentEntity}</span>\`
          : \`<span style="background: rgba(152, 195, 121, 0.2); color: #98c379; padding: 2px 6px; border-radius: 4px; font-size: 10px;">👑 Root Entity</span>\`;

        innerHtml = \`
          <div class="node-header-entity">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">🏛️</span>
              <span style="font-size: 11px; font-weight: bold; color: #d4af37; text-transform: uppercase; letter-spacing: 0.5px;">SYSTEM ENTITY</span>
            </div>
            \${parentBadge}
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 16px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="font-size: 10px; background: #21212b; color: #abb2bf; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">⚡ Magnetic Auto-Boot</span>
              <span style="font-size: 10px; color: #7f848e; font-family: monospace;">\${node.filePath.split('/').slice(-1)[0]}</span>
            </div>
          </div>
        \`;
      }

      // 2. QUAD-UNIT FUNCTIONALITY NODES
      else if (node.type === 'functionality') {
        const helperCount = node.helpers?.length || 0;
        innerHtml = \`
          <div class="node-header-functionality">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px;">⚡</span>
              <span style="font-size: 10px; font-weight: bold; color: #61afef; text-transform: uppercase; letter-spacing: 0.5px;">QUAD-UNIT FUNCTIONALITY</span>
            </div>
            <span style="font-size: 10px; background: rgba(97, 175, 239, 0.2); color: #61afef; padding: 2px 6px; border-radius: 4px;">\${node.parentEntity}</span>
          </div>
          <div style="padding: 10px 14px 6px 14px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4; margin-bottom: 2px;">\${node.name}</div>
            <div style="font-size: 9px; color: #7f848e; font-family: monospace;">\${node.filePath.split('/').slice(-2).join('/')}</div>
          </div>
          <div class="quad-layers-grid">
            <div class="quad-pill" style="background: rgba(97, 175, 239, 0.15); color: #61afef; border: 1px solid rgba(97, 175, 239, 0.3);">
              <span>📝</span><span>Atom Contract</span>
            </div>
            <div class="quad-pill" style="background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3);">
              <span>⚙️</span><span>Layer 2 Logic</span>
            </div>
            <div class="quad-pill" style="background: rgba(152, 195, 121, 0.15); color: #98c379; border: 1px solid rgba(152, 195, 121, 0.3);">
              <span>💾</span><span>State Schema</span>
            </div>
            <div class="quad-pill" style="background: rgba(198, 120, 221, 0.15); color: #c678dd; border: 1px solid rgba(198, 120, 221, 0.3);">
              <span>🛠️</span><span>\${helperCount} Helpers</span>
            </div>
          </div>
        \`;
      }

      // 3. DOMAIN CONCEPT LIBRARY NODES
      else if (node.type === 'library') {
        innerHtml = \`
          <div class="node-header-library">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px;">📚</span>
              <span style="font-size: 10px; font-weight: bold; color: #e5c07b; text-transform: uppercase; letter-spacing: 0.5px;">CONCEPT LIBRARY</span>
            </div>
            <span style="font-size: 10px; background: rgba(229, 192, 123, 0.2); color: #e5c07b; padding: 2px 6px; border-radius: 4px;">Layer 0 Pure Math</span>
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="font-size: 10px; color: #98c379; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
              <span>🌱</span><span>Zero I/O • 100% Deterministic</span>
            </div>
          </div>
        \`;
      }

      // 4. SUB-APP NODES
      else if (node.type === 'subapp') {
        innerHtml = \`
          <div class="node-header-subapp">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px;">🌐</span>
              <span style="font-size: 10px; font-weight: bold; color: #56b6c2; text-transform: uppercase; letter-spacing: 0.5px;">SUB-APP CONTAINER</span>
            </div>
            <span style="font-size: 10px; background: rgba(86, 182, 194, 0.2); color: #56b6c2; padding: 2px 6px; border-radius: 4px;">Fullstack SPA</span>
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="font-size: 10px; color: #56b6c2; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
              <span>📦</span><span>Self-Contained UI & API Bundle</span>
            </div>
          </div>
        \`;
      }

      innerHtml += \`
        <div class="node-socket socket-out" data-node-id="\${node.id}" data-socket-type="out"></div>
        <div class="node-socket socket-in" data-node-id="\${node.id}" data-socket-type="in"></div>
      \`;

      el.innerHTML = innerHtml;

      // Node Drag Initiation
      el.onmousedown = (e) => {
        if (e.target.classList.contains('node-socket')) return;
        if (e.button === 0) {
          e.stopPropagation();
          nodeDragMoved = false;

          if (!selectedNodes.has(node.id)) {
            if (!e.shiftKey && !e.metaKey) selectedNodes.clear();
            selectedNodes.add(node.id);
            updateNodeSelectionStyles();
          }

          isDraggingNode = true;
          draggedNodeId = node.id;
          el.classList.add('dragging');

          const rect = viewport.getBoundingClientRect();
          dragStartPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

          initialNodePositions.clear();
          selectedNodes.forEach(nid => {
            const nEl = document.getElementById('node-' + nid);
            if (nEl) {
              initialNodePositions.set(nid, { x: parseFloat(nEl.style.left), y: parseFloat(nEl.style.top) });
            }
          });
        }
      };

      // Click to open source drawer (only if not dragged)
      el.onclick = (e) => {
        if (e.target.classList.contains('node-socket')) return;
        if (!nodeDragMoved && node.filePath && window.studioWs) {
          window.studioWs.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 'read-' + Date.now(),
            method: 'file.read',
            params: { filePath: node.filePath }
          }));
        }
      };

      // Socket Port Wire Drag Initiation
      const outSocket = el.querySelector('.socket-out');
      const inSocket = el.querySelector('.socket-in');

      [outSocket, inSocket].forEach(sock => {
        if (sock) {
          sock.onmousedown = (e) => {
            e.stopPropagation();
            isDraggingWire = true;
            const sockRect = sock.getBoundingClientRect();
            const vpRect = viewport.getBoundingClientRect();
            wireSource = {
              nodeId: node.id,
              socketType: sock.dataset.socketType,
              x: (sockRect.left + sockRect.width / 2 - vpRect.left - panX) / zoom,
              y: (sockRect.top + sockRect.height / 2 - vpRect.top - panY) / zoom
            };
          };
        }
      });

      layer.appendChild(el);
    }

    function updateNodeSelectionStyles() {
      document.querySelectorAll('.krnl-node').forEach(el => {
        if (selectedNodes.has(el.dataset.nodeId)) el.classList.add('selected');
        else el.classList.remove('selected');
      });
    }

    function renderWiresAndGizmos() {
      const svg = document.getElementById('svg-wires');
      const gizmosLayer = document.getElementById('gizmos-layer');
      svg.innerHTML = '';
      gizmosLayer.innerHTML = '';

      for (const edge of currentGraph.edges || []) {
        const sEl = document.getElementById('node-' + edge.source);
        const tEl = document.getElementById('node-' + edge.target);

        if (sEl && tEl) {
          const sx = parseFloat(sEl.style.left) + sEl.offsetWidth;
          const sy = parseFloat(sEl.style.top) + sEl.offsetHeight / 2;
          const tx = parseFloat(tEl.style.left);
          const ty = parseFloat(tEl.style.top) + tEl.offsetHeight / 2;

          const dx = Math.abs(tx - sx) * 0.5;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
          path.setAttribute('stroke', '#d4af37');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-dasharray', edge.type === 'contains' ? 'none' : '4,4');
          path.setAttribute('opacity', '0.75');
          svg.appendChild(path);

          // Render Centered Delete Gizmo on wire midpoint
          if (edge.deletable !== false) {
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;

            const gizmo = document.createElement('div');
            gizmo.className = 'edge-delete-gizmo';
            gizmo.style.left = midX + 'px';
            gizmo.style.top = midY + 'px';
            gizmo.innerHTML = '✕';
            gizmo.title = 'Delete Connection';
            gizmo.onclick = (e) => {
              e.stopPropagation();
              apiDeleteEdge(edge.id);
            };
            gizmosLayer.appendChild(gizmo);
          }
        }
      }
    }

    function drawLiveWire(sx, sy, tx, ty) {
      let livePath = document.getElementById('live-drag-wire');
      const svg = document.getElementById('svg-wires');
      if (!livePath) {
        livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        livePath.id = 'live-drag-wire';
        livePath.setAttribute('stroke', '#61afef');
        livePath.setAttribute('stroke-width', '3');
        livePath.setAttribute('stroke-dasharray', '6,6');
        livePath.setAttribute('fill', 'none');
        svg.appendChild(livePath);
      }
      const dx = Math.abs(tx - sx) * 0.5;
      livePath.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
    }

    function removeLiveWire() {
      const livePath = document.getElementById('live-drag-wire');
      if (livePath) livePath.remove();
    }

    function spawnAndConnect(nodeType) {
      hideContextMenus();
      const defaultName = prompt(\`Enter \${nodeType} name:\`);
      if (!defaultName) return;

      if (nodeType === 'entity') {
        apiCreateEntity(defaultName, () => {
          if (wireSource) apiConnectNodes(wireSource.nodeId, 'entity:' + defaultName);
        });
      } else if (nodeType === 'functionality') {
        const parentEntity = wireSource?.nodeId?.replace(/^entity:/, '') || 'App';
        apiCreateFunctionality(parentEntity, defaultName, () => {
          if (wireSource) apiConnectNodes(wireSource.nodeId, \`functionality:\${parentEntity}:\${defaultName}\`);
        });
      } else if (nodeType === 'library') {
        apiCreateLibrary(defaultName, () => {
          if (wireSource) apiConnectNodes(wireSource.nodeId, 'library:' + defaultName + 'Concepts');
        });
      }
    }

    // --- Programmatic Client API Calls ---

    function apiMoveMultipleNodes(positions) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'move-' + Date.now(),
          method: 'graph.moveMultipleNodes',
          params: { positions }
        }));
      }
    }

    function apiConnectNodes(source, target) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'conn-' + Date.now(),
          method: 'graph.connectNodes',
          params: { source, target, type: 'contains' }
        }));
      }
    }

    function apiDeleteEdge(edgeId) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'del-edge-' + Date.now(),
          method: 'graph.deleteEdge',
          params: { edgeId }
        }));
      }
    }

    function apiDeleteNode(nodeId) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'del-node-' + Date.now(),
          method: 'graph.deleteNode',
          params: { nodeId }
        }));
      }
    }

    function apiAlignLayout(algorithm = 'hierarchical') {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'align-' + Date.now(),
          method: 'graph.alignLayout',
          params: { algorithm }
        }));
      }
    }

    function apiUndo() {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'undo-' + Date.now(),
          method: 'graph.undo',
          params: {}
        }));
      }
    }

    function apiRedo() {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'redo-' + Date.now(),
          method: 'graph.redo',
          params: {}
        }));
      }
    }

    function apiCreateEntity(name, cb) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'create-ent-' + Date.now(),
          method: 'entity.create',
          params: { name }
        }));
        if (cb) setTimeout(cb, 300);
      }
    }

    function apiCreateFunctionality(entityName, name, cb) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'create-fn-' + Date.now(),
          method: 'functionality.create',
          params: { entityName, name }
        }));
        if (cb) setTimeout(cb, 300);
      }
    }

    function apiCreateLibrary(name, cb) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'create-lib-' + Date.now(),
          method: 'library.create',
          params: { name }
        }));
        if (cb) setTimeout(cb, 300);
      }
    }

    function contextAddEntity() {
      const name = prompt('Enter Entity Name:');
      if (name) apiCreateEntity(name);
    }

    function contextAddFunctionality() {
      const entityName = prompt('Enter Parent Entity Name:');
      const name = prompt('Enter Functionality Name:');
      if (entityName && name) apiCreateFunctionality(entityName, name);
    }

    function contextAddLibrary() {
      const name = prompt('Enter Domain Concept Library Name:');
      if (name) apiCreateLibrary(name);
    }

    function contextOpenSelectedSource() {
      if (contextTargetNodeId) {
        const node = currentGraph.nodes.find(n => n.id === contextTargetNodeId);
        if (node?.filePath && window.studioWs) {
          window.studioWs.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 'read-' + Date.now(),
            method: 'file.read',
            params: { filePath: node.filePath }
          }));
        }
      }
    }

    function contextDuplicateSelected() {
      if (contextTargetNodeId) {
        const node = currentGraph.nodes.find(n => n.id === contextTargetNodeId);
        if (node) {
          const newName = node.name + 'Copy';
          if (node.type === 'entity') apiCreateEntity(newName);
          else if (node.type === 'functionality') apiCreateFunctionality(node.parentEntity || 'App', newName);
          else if (node.type === 'library') apiCreateLibrary(newName);
        }
      }
    }

    function contextDisconnectSelected() {
      if (contextTargetNodeId) {
        const toDelete = currentGraph.edges.filter(e => e.source === contextTargetNodeId || e.target === contextTargetNodeId);
        toDelete.forEach(e => apiDeleteEdge(e.id));
      }
    }

    function contextDeleteSelected() {
      if (contextTargetNodeId) {
        apiDeleteNode(contextTargetNodeId);
        selectedNodes.delete(contextTargetNodeId);
      }
    }

    function displaySourceFile(filePath, content) {
      const drawer = document.getElementById('code-drawer');
      document.getElementById('drawer-file-title').textContent = filePath.split('/').slice(-3).join('/');
      drawer.style.display = 'flex';

      if (monacoDrawerEditor) {
        monacoDrawerEditor.setValue(content);
        const model = monacoDrawerEditor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, filePath.endsWith('.json') ? 'json' : 'typescript');
        }
      }
    }

    function closeCodeDrawer() {
      document.getElementById('code-drawer').style.display = 'none';
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
        inputVal = JSON.parse(monacoTestInputEditor ? monacoTestInputEditor.getValue() : '{}');
      } catch (e) {
        alert('Invalid JSON input: ' + e.message);
        return;
      }

      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'test-' + Date.now(),
          method: 'test.executeFunction',
          params: {
            filePath: selectedFunction.filePath,
            input: inputVal
          }
        }));
      }
    };

    function renderTestOutput(result) {
      document.getElementById('test-metrics-badge').textContent = \`[⏱️ \${result.durationMs}ms | \${result.success ? 'PASSED' : 'FAILED'}]\`;
      if (monacoTestOutputEditor) {
        monacoTestOutputEditor.setValue(JSON.stringify(result.output || result.error, null, 2));
      }
    }

    function switchProject(relPath) {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'switch-' + Date.now(),
          method: 'project.switch',
          params: { path: relPath }
        }));
      }
    }

    function triggerPurityAudit() {
      if (window.studioWs) {
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'audit-' + Date.now(),
          method: 'validate.runPurityAudit'
        }));
      }
    }

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
      if (monacoUiEditor) {
        monacoUiEditor.setValue(code);
      }
    }

    // Direct REST Initial Fetch
    async function initialGraphFetch() {
      try {
        const res = await fetch('/api/graph');
        const data = await res.json();
        if (data.payload && data.payload.nodes) {
          currentGraph = data.payload;
          renderGraphNodes(currentGraph);
          renderTestFunctions(currentGraph);
        }
      } catch (e) {
        console.error('Initial graph fetch error:', e);
      }
    }
    initialGraphFetch();

    // WebSocket Live Updates
    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/studio/ws');

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'graph.init' || msg.method === 'graph.updated') {
          currentGraph = msg.params;
          renderGraphNodes(currentGraph);
          renderTestFunctions(currentGraph);
        } else if (msg.method === 'agent.activity') {
          showAgentHud(msg.params);
        } else if (msg.result && msg.result.durationMs !== undefined) {
          renderTestOutput(msg.result);
        } else if (msg.result && msg.result.content !== undefined) {
          displaySourceFile(msg.result.filePath, msg.result.content);
        } else if (msg.result && msg.result.valid !== undefined) {
          alert(\`AST Purity Audit: \${msg.result.valid ? 'PASSED (Clean)' : 'FAILED (' + (msg.result.errors?.length || 0) + ' errors)'}\`);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWebSocket, 2000);
      };

      window.studioWs = ws;
    }
    connectWebSocket();

    function showAgentHud(activity) {
      const hud = document.getElementById('agent-activity-hud');
      const text = document.getElementById('agent-hud-text');
      text.textContent = \`AI Agent executed \${activity.action} (\${new Date(activity.timestamp).toLocaleTimeString()})\`;
      hud.style.display = 'flex';
      setTimeout(() => { hud.style.display = 'none'; }, 4000);
    }

    // Initialize Monaco instances safely
    if (window.require) {
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], function () {
        try {
          monaco.editor.defineTheme('krnl-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'keyword', foreground: 'd4af37', fontStyle: 'bold' },
              { token: 'string', foreground: '98c379' },
              { token: 'number', foreground: 'd19a66' },
              { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
              { token: 'type', foreground: 'e5c07b' },
              { token: 'identifier', foreground: 'f5ede4' }
            ],
            colors: {
              'editor.background': '#16161e',
              'editor.foreground': '#f5ede4',
              'editor.lineHighlightBackground': '#1f1f2a',
              'editorLineNumber.foreground': '#5c6370',
              'editorLineNumber.activeForeground': '#d4af37',
              'editorCursor.foreground': '#d4af37',
              'editor.selectionBackground': '#2d3139',
              'editorWidget.background': '#16161e',
              'editorWidget.border': '#d4af37'
            }
          });

          monacoUiEditor = monaco.editor.create(document.getElementById('ui-monaco-container'), {
            value: '// Drag KrnlUI atoms into the canvas above to generate VanJS code...',
            language: 'typescript',
            theme: 'krnl-dark',
            readOnly: true,
            automaticLayout: true,
            fontSize: 12,
            fontFamily: 'Fira Code, Menlo, Monaco, monospace',
            minimap: { enabled: false }
          });

          monacoTestInputEditor = monaco.editor.create(document.getElementById('test-input-monaco'), {
            value: '{\\n  "payload": "demo_test_value"\\n}',
            language: 'json',
            theme: 'krnl-dark',
            automaticLayout: true,
            fontSize: 12,
            fontFamily: 'Fira Code, Menlo, Monaco, monospace',
            minimap: { enabled: false }
          });

          monacoTestOutputEditor = monaco.editor.create(document.getElementById('test-output-monaco'), {
            value: '// Awaiting execution...',
            language: 'json',
            theme: 'krnl-dark',
            readOnly: true,
            automaticLayout: true,
            fontSize: 12,
            fontFamily: 'Fira Code, Menlo, Monaco, monospace',
            minimap: { enabled: false }
          });

          monacoDrawerEditor = monaco.editor.create(document.getElementById('drawer-monaco-container'), {
            value: '// Select a node to view its source code...',
            language: 'typescript',
            theme: 'krnl-dark',
            readOnly: true,
            automaticLayout: true,
            fontSize: 12,
            fontFamily: 'Fira Code, Menlo, Monaco, monospace',
            minimap: { enabled: true }
          });
        } catch (e) {
          console.error('Monaco init error:', e);
        }
      });
    }
  </script>
</body>
</html>`;
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log(`\n🚀 [Krnl Studio] Visual IDE running at: http://localhost:${this.port}`);
        console.log(`📡 [Krnl Studio] Active Project Root: ${this.projectRoot}`);
        console.log(`📡 [Krnl Studio] REST API Suite available at: http://localhost:${this.port}/api/v1/*`);
        console.log(`📡 [Krnl Studio] WebSocket JSON-RPC protocol active on /studio/ws\n`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    this.watcher.stop();
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.httpServer.close(() => resolve());
      });
    });
  }
}
