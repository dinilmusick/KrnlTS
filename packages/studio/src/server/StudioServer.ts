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
    this.httpServer.on('error', (err) => console.error('HTTP Server Error:', err));

    this.wss = new WebSocketServer({ server: this.httpServer, path: '/studio/ws', perMessageDeflate: false });
    this.wss.on('error', (err) => console.error('WSS Error:', err));

    this.initWebSocket();
    this.initFileWatcher();
  }

  private initWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('error', (err) => {
        console.warn('WS Client connection error handled:', err.message);
      });

      try {
        const initialGraph = this.astEngine.extractArchitectureGraph();
        ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'graph.init', params: { ...initialGraph, projectRoot: this.projectRoot } }));
      } catch (e) {}

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
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(res));
          }

          if (req.method && (req.method.startsWith('graph.') || req.method.startsWith('entity.') || req.method.startsWith('functionality.') || req.method.startsWith('library.'))) {
            this.broadcastGraphUpdate();
          }
        } catch (e: any) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32700, message: 'Parse error: ' + (e.message || String(e)) }
            }));
          }
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
    try {
      const graph = this.astEngine.extractArchitectureGraph();
      const payload = JSON.stringify({ jsonrpc: '2.0', method: 'graph.updated', params: { ...graph, projectRoot: this.projectRoot } });
      for (const client of this.wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    } catch (e) {}
  }

  private broadcastAgentActivity(mutation: { action: string; params: any }) {
    try {
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
    } catch (e) {}
  }

  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url?.split('?')[0] || '/';

    if (url === '/api/graph') {
      const graph = this.astEngine.extractArchitectureGraph();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', payload: graph, projectRoot: this.projectRoot }, null, 2));
      return;
    }

    if (url.startsWith('/api/v1/')) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
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
          else if (url === '/api/v1/graph/moveMultipleNodes') method = 'graph.moveMultipleNodes';
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
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || String(err) }));
        }
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(this.getStudioHtml());
  }

  private getStudioHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krnl Studio — Omni Canvas Visual IDE</title>
  
  <!-- Monaco Editor AMD Loader -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>

  <style>
    :root {
      --krnl-bg: #0e0e12;
      --krnl-panel: #16161e;
      --krnl-panel-hover: #1f1f2a;
      --krnl-accent: #d4af37;
      --krnl-accent-glow: rgba(212, 175, 55, 0.45);
      --krnl-purple: #c678dd;
      --krnl-purple-glow: rgba(198, 120, 221, 0.45);
      --krnl-blue: #61afef;
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

    /* Tooltip Helper */
    .tooltip-container { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    .tooltip-text {
      visibility: hidden; opacity: 0;
      position: absolute; z-index: 10000;
      background: #1e1e28; color: #f5ede4;
      border: 1px solid #d4af37; border-radius: 6px;
      padding: 4px 8px; font-size: 11px; white-space: nowrap;
      box-shadow: 0 4px 14px rgba(0,0,0,0.8);
      pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }
    .tooltip-bottom { top: 100%; left: 50%; transform: translateX(-50%) translateY(6px); }
    .tooltip-top { bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-6px); }

    /* INFINITE 4-QUADRANT CANVAS VIEWPORT (-INF to +INF) */
    #graph-viewport {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      background-color: #0e0e12;
      background-image: radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px);
      background-size: 24px 24px; cursor: default;
    }
    #graph-container {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      transform-origin: 0 0;
    }
    
    /* Strict Layering Hierarchy:
       svg-wires (5) < gizmos-layer (7) < nodes-layer (10) < node-cards (20) < viewers (50) */
    #svg-wires {
      position: absolute; top: -50000px; left: -50000px;
      width: 100000px; height: 100000px;
      overflow: visible !important; pointer-events: none; z-index: 5;
    }
    #gizmos-layer {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      overflow: visible; pointer-events: none; z-index: 7;
    }
    #nodes-layer {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      overflow: visible; pointer-events: none; z-index: 10;
    }

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
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
      pointer-events: auto; z-index: 20;
      overflow: visible;
    }
    .krnl-node:hover {
      box-shadow: 0 14px 42px rgba(0,0,0,0.9), 0 0 24px var(--krnl-accent-glow);
    }
    .krnl-node.dragging { cursor: grabbing !important; }
    .krnl-node.selected {
      box-shadow: 0 0 0 2px #f5ede4, 0 14px 42px rgba(0,0,0,0.9), 0 0 28px var(--krnl-accent-glow) !important;
    }

    /* 1. Entity System Nodes */
    .krnl-node-entity {
      background: linear-gradient(180deg, #1d1d28 0%, #13131b 100%);
      border: 2px solid #d4af37; min-width: 290px;
      box-shadow: 0 10px 32px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212, 175, 55, 0.4);
    }
    .node-header-entity {
      background: rgba(212, 175, 55, 0.12);
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }

    /* 2. Quad-Unit Functionality Nodes */
    .krnl-node-functionality {
      background: linear-gradient(180deg, #181926 0%, #11121a 100%);
      border: 1px solid #61afef; min-width: 280px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(97, 175, 239, 0.3);
    }
    .node-header-functionality {
      background: rgba(97, 175, 239, 0.12);
      border-bottom: 1px solid rgba(97, 175, 239, 0.25);
      padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }
    .quad-layers-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      padding: 10px 14px; background: rgba(0,0,0,0.25);
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .quad-pill {
      font-size: 10px; padding: 4px 6px; border-radius: 4px;
      display: flex; align-items: center; gap: 6px; font-weight: 500;
    }

    /* 3. Concept Library Nodes */
    .krnl-node-library {
      background: linear-gradient(180deg, #261f18 0%, #18130e 100%);
      border: 1px solid #e5c07b; min-width: 250px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75), inset 0 1px 0 rgba(229, 192, 123, 0.3);
    }
    .node-header-library {
      background: rgba(229, 192, 123, 0.14);
      border-bottom: 1px solid rgba(229, 192, 123, 0.3);
      padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }

    /* 4. Sub-App Nodes */
    .krnl-node-subapp {
      background: linear-gradient(180deg, #15222b 0%, #0d151c 100%);
      border: 1px dashed #56b6c2; min-width: 260px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75), inset 0 1px 0 rgba(86, 182, 194, 0.25);
    }
    .node-header-subapp {
      background: rgba(86, 182, 194, 0.14);
      border-bottom: 1px dashed rgba(86, 182, 194, 0.3);
      padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }

    /* 5. Omni Viewer Widget Nodes */
    .krnl-viewer-node {
      position: absolute; border-radius: 12px;
      background: rgba(22, 22, 30, 0.98); backdrop-filter: blur(20px);
      border: 2px solid #c678dd;
      box-shadow: 0 16px 48px rgba(0,0,0,0.9), 0 0 24px var(--krnl-purple-glow);
      pointer-events: auto; z-index: 50; display: flex; flex-direction: column;
      min-width: 380px; min-height: 280px;
      overflow: hidden;
    }
    .viewer-titlebar {
      background: linear-gradient(90deg, rgba(198, 120, 221, 0.25) 0%, rgba(22, 22, 30, 0.8) 100%);
      border-bottom: 1px solid rgba(198, 120, 221, 0.35);
      padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
      cursor: move;
    }
    .viewer-body {
      flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;
    }
    .viewer-resize-handle {
      position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
      cursor: nwse-resize; z-index: 100;
      background: linear-gradient(135deg, transparent 50%, #c678dd 50%);
    }

    /* Sockets */
    .node-socket {
      width: 14px; height: 14px; border-radius: 50%;
      background: #d4af37; border: 2px solid #0e0e12;
      position: absolute; cursor: crosshair; pointer-events: auto; z-index: 35;
      transition: transform 0.1s ease, background 0.1s ease;
    }
    .node-socket:hover {
      transform: translateY(-50%) scale(1.35);
      background: #f5ede4; box-shadow: 0 0 12px #d4af37;
    }
    .socket-out { right: -7px; top: 50%; transform: translateY(-50%); }
    .socket-in { left: -7px; top: 50%; transform: translateY(-50%); background: #61afef; }

    /* MONOCHROMATIC 'VIEWS' SOCKET HANDLE */
    .socket-views {
      position: absolute; right: 12px; bottom: -10px;
      width: 26px; height: 26px; border-radius: 50%;
      background: #1e1e28; border: 2px solid #c678dd;
      display: flex; align-items: center; justify-content: center;
      cursor: crosshair; pointer-events: auto; z-index: 40;
      box-shadow: 0 2px 10px rgba(0,0,0,0.8), 0 0 10px var(--krnl-purple-glow);
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .socket-views svg { stroke: #c678dd; transition: stroke 0.15s ease; }
    .socket-views:hover {
      transform: scale(1.25); background: #c678dd;
      box-shadow: 0 0 16px var(--krnl-purple-glow);
    }
    .socket-views:hover svg { stroke: #0e0e12; }

    /* Centered Wire Delete Gizmo */
    .edge-delete-gizmo {
      position: absolute; width: 20px; height: 20px; border-radius: 50%;
      background: #16161e; border: 1px solid #e06c75; color: #e06c75;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: bold; cursor: pointer; pointer-events: auto;
      transform: translate(-50%, -50%); z-index: 7;
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
      border: var(--krnl-border); border-radius: 10px; padding: 8px; min-width: 210px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.9), 0 0 14px var(--krnl-accent-glow);
    }
    .menu-item {
      padding: 8px 12px; font-size: 12px; border-radius: 6px; cursor: pointer;
      display: flex; align-items: center; gap: 10px; color: var(--krnl-text);
      transition: background 0.1s ease, color 0.1s ease;
    }
    .menu-item:hover { background: rgba(212, 175, 55, 0.25); color: #d4af37; }
    .menu-separator { height: 1px; background: rgba(212, 175, 55, 0.15); margin: 4px 0; }

    /* STRICT MONOCHROMATIC ICON-ONLY DOCK TOOLBAR */
    .dock-icon-btn {
      width: 38px; height: 38px; border-radius: 8px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #f5ede4;
      transition: all 0.15s ease;
    }
    .dock-icon-btn svg { stroke: #d4af37; transition: transform 0.15s ease; }
    .dock-icon-btn:hover {
      background: rgba(212, 175, 55, 0.25); border-color: #d4af37;
      transform: scale(1.12);
      box-shadow: 0 0 14px var(--krnl-accent-glow);
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Live Agent Activity Toast -->
    <div id="agent-activity-hud">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
      <span id="agent-hud-text">AI Agent Mutation</span>
    </div>

    <!-- Header -->
    <div class="studio-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="status-dot"></span>
        <span style="letter-spacing: 1px;">KRNL STUDIO</span>
        <span style="color: var(--krnl-accent);">|</span>
        <span style="color: #abb2bf;">Omni Canvas IDE</span>
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
        <div class="tooltip-container">
          <button onclick="triggerPurityAudit()" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Purity Audit</span>
          </button>
          <span class="tooltip-text tooltip-bottom">Run AST 4-Layer Purity Audit</span>
        </div>
      </div>
    </div>

    <!-- Infinite 4-Quadrant Canvas Viewport -->
    <div id="graph-viewport">
      <div id="graph-container">
        <svg id="svg-wires"></svg>
        <div id="gizmos-layer"></div>
        <div id="nodes-layer"></div>
        <div id="selection-box"></div>
      </div>
    </div>

    <!-- STRICT MONOCHROMATIC ICON-ONLY DOCK TOOLBAR -->
    <div style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(22, 22, 30, 0.94); backdrop-filter: blur(16px); border: var(--krnl-border); padding: 8px 14px; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.8); z-index: 2000;">
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="resetZoomAndFit()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">Fit View & Reset Zoom</span>
      </div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="apiAlignLayout('hierarchical')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">Auto-Align Hierarchical Layout</span>
      </div>
      <div style="width: 1px; background: rgba(212, 175, 55, 0.2); margin: 4px 0;"></div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="contextAddEntity()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">New System Entity</span>
      </div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="contextAddFunctionality()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#61afef" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">New Quad-Unit Functionality</span>
      </div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="contextAddLibrary()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">New Domain Concept Library</span>
      </div>
    </div>

    <!-- Canvas Context Menu -->
    <div id="pane-context-menu" class="krnl-context-menu">
      <div class="menu-item" onclick="contextAddEntity()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <span>New Entity</span>
      </div>
      <div class="menu-item" onclick="contextAddFunctionality()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#61afef" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>New Functionality</span>
      </div>
      <div class="menu-item" onclick="contextAddLibrary()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>New Concept Library</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" onclick="apiAlignLayout('hierarchical')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Auto-Align Layout</span>
      </div>
      <div class="menu-item" onclick="resetZoomAndFit()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
        <span>Fit View</span>
      </div>
    </div>

    <!-- Node Context Menu -->
    <div id="node-context-menu" class="krnl-context-menu">
      <div class="menu-item" onclick="spawnViewerForContext('ui')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        <span>UI & Atom Builder</span>
      </div>
      <div class="menu-item" onclick="spawnViewerForContext('code')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        <span>Monaco Source Code</span>
      </div>
      <div class="menu-item" onclick="spawnViewerForContext('test')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Sandboxed Test Bench</span>
      </div>
      <div class="menu-item" onclick="spawnViewerForContext('state')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        <span>Reactive State Inspector</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" onclick="contextDisconnectSelected()" style="color: #e5c07b;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>Disconnect Wires</span>
      </div>
      <div class="menu-item" onclick="contextDeleteSelected()" style="color: #e06c75;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e06c75" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Delete Node</span>
      </div>
    </div>

    <!-- STRICT MONOCHROMATIC VIEWS SPAWN DIALOGUE -->
    <div id="view-selector-modal" class="krnl-context-menu" style="border-color: #c678dd; box-shadow: 0 12px 36px rgba(0,0,0,0.95), 0 0 20px var(--krnl-purple-glow); min-width: 240px;">
      <div style="padding: 6px 8px 8px 8px; font-size: 11px; color: #c678dd; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(198, 120, 221, 0.25); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <span>SPAWN OMNI VIEW</span>
        <span id="views-modal-node-title" style="color: #f5ede4; font-size: 10px; background: rgba(198,120,221,0.2); padding: 2px 6px; border-radius: 4px;">Node</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div class="menu-item" onclick="confirmSpawnViewer('ui')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">UI & Atom Builder</div>
            <div style="font-size: 10px; color: #7f848e;">Live preview & VanJS editor</div>
          </div>
        </div>
        <div class="menu-item" onclick="confirmSpawnViewer('code')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">Monaco Source Code</div>
            <div style="font-size: 10px; color: #7f848e;">TypeScript quad-unit code</div>
          </div>
        </div>
        <div class="menu-item" onclick="confirmSpawnViewer('test')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">Sandboxed Test Bench</div>
            <div style="font-size: 10px; color: #7f848e;">Input/output execution & latency</div>
          </div>
        </div>
        <div class="menu-item" onclick="confirmSpawnViewer('state')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">Reactive State Inspector</div>
            <div style="font-size: 10px; color: #7f848e;">Live reactive schema viewer</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentGraph = { nodes: [], edges: [] };
    let selectedNodes = new Set();
    let spawnedViewers = new Map();
    let viewerCounter = 0;
    let maxZIndex = 100;
    let lastModalOpenTime = 0;

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

    // Dragging / Resizing Viewer Window State
    let isDraggingViewer = false, draggedViewerId = null, viewerDragOffset = { x: 0, y: 0 };
    let isResizingViewer = false, resizedViewerId = null, resizeStartPos = { x: 0, y: 0, w: 0, h: 0 };

    // Wire Dragging State
    let isDraggingWire = false;
    let isDraggingViewsWire = false;
    let wireSource = null;
    let wireDropPos = { x: 0, y: 0 };

    // Context Menus
    const paneMenu = document.getElementById('pane-context-menu');
    const nodeMenu = document.getElementById('node-context-menu');
    const viewSelectorModal = document.getElementById('view-selector-modal');
    let contextTargetNodeId = null;

    function hideContextMenus(e) {
      if (Date.now() - lastModalOpenTime < 250) return;
      if (e && e.target.closest('.krnl-context-menu')) return;
      paneMenu.style.display = 'none';
      nodeMenu.style.display = 'none';
      viewSelectorModal.style.display = 'none';
    }
    window.addEventListener('click', hideContextMenus);

    // --- Mouse Pan & Box Selection ---
    viewport.onmousedown = (e) => {
      hideContextMenus(e);
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        viewport.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      if (e.button === 2) {
        isRightDragPanning = true;
        rightDragDist = 0;
        rightDragStartX = e.clientX;
        rightDragStartY = e.clientY;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        return;
      }

      if (e.button === 0) {
        const isInteractive = e.target.closest('.krnl-node') || e.target.closest('.krnl-viewer-node') || e.target.closest('.node-socket') || e.target.closest('.socket-views') || e.target.closest('.edge-delete-gizmo');
        if (!isInteractive) {
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

      if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
        return;
      }
      if (isRightDragPanning) {
        const dx = e.clientX - rightDragStartX;
        const dy = e.clientY - rightDragStartY;
        rightDragDist += Math.abs(dx) + Math.abs(dy);
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
        return;
      }

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

        for (const node of currentGraph.nodes) {
          const el = document.getElementById('node-' + node.id);
          if (el) {
            const nx = parseFloat(el.style.left);
            const ny = parseFloat(el.style.top);
            if (nx + el.offsetWidth >= left && nx <= left + width && ny + el.offsetHeight >= top && ny <= top + height) {
              selectedNodes.add(node.id);
            }
          }
        }
        updateNodeSelectionStyles();
        return;
      }

      if (isDraggingNode) {
        nodeDragMoved = true;
        const dx = (clientX - dragStartPos.x) / zoom;
        const dy = (clientY - dragStartPos.y) / zoom;

        selectedNodes.forEach(nodeId => {
          const init = initialNodePositions.get(nodeId);
          if (init) {
            const el = document.getElementById('node-' + nodeId);
            if (el) {
              el.style.left = Math.round(init.x + dx) + 'px';
              el.style.top = Math.round(init.y + dy) + 'px';
            }
          }
        });
        renderWiresAndGizmos();
        return;
      }

      if (isDraggingViewer && draggedViewerId) {
        const vEl = document.getElementById('viewer-' + draggedViewerId);
        if (vEl) {
          const currentX = (clientX - panX) / zoom;
          const currentY = (clientY - panY) / zoom;
          const newX = Math.round(currentX - viewerDragOffset.x);
          const newY = Math.round(currentY - viewerDragOffset.y);
          vEl.style.left = newX + 'px';
          vEl.style.top = newY + 'px';
          const vData = spawnedViewers.get(draggedViewerId);
          if (vData) { vData.x = newX; vData.y = newY; }
          renderWiresAndGizmos();
        }
        return;
      }

      if (isResizingViewer && resizedViewerId) {
        const vEl = document.getElementById('viewer-' + resizedViewerId);
        if (vEl) {
          const dx = (clientX - resizeStartPos.startX) / zoom;
          const dy = (clientY - resizeStartPos.startY) / zoom;
          const newW = Math.max(380, Math.round(resizeStartPos.w + dx));
          const newH = Math.max(260, Math.round(resizeStartPos.h + dy));
          vEl.style.width = newW + 'px';
          vEl.style.height = newH + 'px';
          const vData = spawnedViewers.get(resizedViewerId);
          if (vData) {
            vData.w = newW; vData.h = newH;
            if (vData.monacoInstance) vData.monacoInstance.layout();
          }
          renderWiresAndGizmos();
        }
        return;
      }

      if (isDraggingWire && wireSource) {
        const currentX = (clientX - panX) / zoom;
        const currentY = (clientY - panY) / zoom;
        drawLiveWire(wireSource.x, wireSource.y, currentX, currentY, isDraggingViewsWire ? '#c678dd' : '#61afef');
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isPanning) { isPanning = false; viewport.style.cursor = 'default'; }
      if (isRightDragPanning) { isRightDragPanning = false; }
      if (isBoxSelecting) { isBoxSelecting = false; selectionBox.style.display = 'none'; }

      if (isDraggingNode) {
        isDraggingNode = false;
        document.querySelectorAll('.krnl-node').forEach(el => el.classList.remove('dragging'));
        if (nodeDragMoved) {
          const positions = {};
          selectedNodes.forEach(nodeId => {
            const el = document.getElementById('node-' + nodeId);
            if (el) positions[nodeId] = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
          });
          apiMoveMultipleNodes(positions);
        }
      }

      if (isDraggingViewer) { isDraggingViewer = false; draggedViewerId = null; }
      if (isResizingViewer) { isResizingViewer = false; resizedViewerId = null; }

      if (isDraggingWire) {
        isDraggingWire = false;
        removeLiveWire();

        const rect = viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        const dropX = Math.round((clientX - panX) / zoom);
        const dropY = Math.round((clientY - panY) / zoom);

        if (isDraggingViewsWire && wireSource) {
          isDraggingViewsWire = false;
          wireDropPos = { x: dropX, y: dropY };
          openViewSelectorModalAt(e.clientX, e.clientY, wireSource.nodeId);
          return;
        }

        const elemUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        if (elemUnderCursor && elemUnderCursor.classList.contains('node-socket')) {
          const targetNodeId = elemUnderCursor.dataset.nodeId;
          const targetSocketType = elemUnderCursor.dataset.socketType;
          if (targetNodeId && targetNodeId !== wireSource.nodeId && wireSource.socketType !== targetSocketType) {
            const src = wireSource.socketType === 'out' ? wireSource.nodeId : targetNodeId;
            const tgt = wireSource.socketType === 'out' ? targetNodeId : wireSource.nodeId;
            apiConnectNodes(src, tgt);
          }
        }
      }
    });

    function openViewSelectorModalAt(screenX, screenY, nodeId) {
      lastModalOpenTime = Date.now();
      const node = currentGraph.nodes.find(n => n.id === nodeId);
      document.getElementById('views-modal-node-title').textContent = node ? node.name : 'Node';
      viewSelectorModal.style.display = 'block';
      viewSelectorModal.style.left = screenX + 'px';
      viewSelectorModal.style.top = screenY + 'px';
    }

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
      renderWiresAndGizmos();
    }
    updateTransform();

    function resetZoomAndFit() {
      apiAlignLayout('hierarchical');
      panX = 40; panY = 70; zoom = 0.85;
      updateTransform();
    }

    viewport.oncontextmenu = (e) => {
      e.preventDefault();
      if (rightDragDist > 8) return;
      hideContextMenus();

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

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('.monaco-editor')) return;
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) apiRedo();
        else apiUndo();
      }
    });

    // --- RECONCILIATION NODE RENDERING (ZERO-POLL, PRESERVES DOM & MONACO) ---
    function renderGraphNodes(graph) {
      const layer = document.getElementById('nodes-layer');

      if (!graph.nodes || graph.nodes.length === 0) {
        document.getElementById('node-count-badge').textContent = '0 Nodes (Empty)';
        return;
      }

      document.getElementById('node-count-badge').textContent = \`\${graph.nodes.length} Nodes | \${graph.edges?.length || 0} Wires\`;

      const incomingIds = new Set(graph.nodes.map(n => n.id));

      document.querySelectorAll('.krnl-node').forEach(el => {
        if (!incomingIds.has(el.dataset.nodeId)) el.remove();
      });

      graph.nodes.forEach((node, idx) => {
        let el = document.getElementById('node-' + node.id);
        if (!el) {
          let x = node.position?.x;
          let y = node.position?.y;
          if (x === undefined || y === undefined) {
            if (node.type === 'entity') {
              const col = Math.floor(idx / 5); const row = idx % 5;
              x = 60 + col * 360; y = 60 + row * 240;
            } else if (node.type === 'functionality') {
              const col = Math.floor(idx / 6); const row = idx % 6;
              x = 840 + col * 340; y = 60 + row * 220;
            } else {
              x = 1580; y = 60 + idx * 180;
            }
          }
          createNodeElement(node, x, y, layer);
        } else if (!isDraggingNode || !selectedNodes.has(node.id)) {
          if (node.position?.x !== undefined && node.position?.y !== undefined) {
            el.style.left = node.position.x + 'px';
            el.style.top = node.position.y + 'px';
          }
        }
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

      if (node.type === 'entity') {
        const parentBadge = node.parentEntity
          ? \`<span style="background: rgba(212, 175, 55, 0.2); color: #d4af37; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Subsystem of \${node.parentEntity}</span>\`
          : \`<span style="background: rgba(152, 195, 121, 0.2); color: #98c379; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Root Entity</span>\`;

        innerHtml = \`
          <div class="node-header-entity">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span style="font-size: 11px; font-weight: bold; color: #d4af37; text-transform: uppercase;">SYSTEM ENTITY</span>
            </div>
            \${parentBadge}
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 16px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="font-size: 10px; background: #21212b; color: #abb2bf; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">Auto-Boot</span>
            </div>
          </div>
        \`;
      } else if (node.type === 'functionality') {
        const helperCount = node.helpers?.length || 0;
        innerHtml = \`
          <div class="node-header-functionality">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#61afef" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style="font-size: 10px; font-weight: bold; color: #61afef; text-transform: uppercase;">QUAD-UNIT</span>
            </div>
            <span style="font-size: 10px; background: rgba(97, 175, 239, 0.2); color: #61afef; padding: 2px 6px; border-radius: 4px;">\${node.parentEntity}</span>
          </div>
          <div style="padding: 10px 14px 6px 14px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4; margin-bottom: 2px;">\${node.name}</div>
            <div style="font-size: 9px; color: #7f848e; font-family: monospace;">\${node.filePath.split('/').slice(-2).join('/')}</div>
          </div>
          <div class="quad-layers-grid">
            <div class="quad-pill" style="background: rgba(97, 175, 239, 0.15); color: #61afef; border: 1px solid rgba(97, 175, 239, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>Atom</span>
            </div>
            <div class="quad-pill" style="background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Logic</span>
            </div>
            <div class="quad-pill" style="background: rgba(152, 195, 121, 0.15); color: #98c379; border: 1px solid rgba(152, 195, 121, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              <span>State</span>
            </div>
            <div class="quad-pill" style="background: rgba(198, 120, 221, 0.15); color: #c678dd; border: 1px solid rgba(198, 120, 221, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <span>\${helperCount} Helpers</span>
            </div>
          </div>
        \`;
      } else if (node.type === 'library') {
        innerHtml = \`
          <div class="node-header-library">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span style="font-size: 10px; font-weight: bold; color: #e5c07b; text-transform: uppercase;">CONCEPT LIBRARY</span>
            </div>
            <span style="font-size: 10px; background: rgba(229, 192, 123, 0.2); color: #e5c07b; padding: 2px 6px; border-radius: 4px;">Layer 0 Pure</span>
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="font-size: 10px; color: #98c379; margin-top: 2px;">Deterministic Purity</div>
          </div>
        \`;
      } else if (node.type === 'subapp') {
        innerHtml = \`
          <div class="node-header-subapp">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#56b6c2" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <span style="font-size: 10px; font-weight: bold; color: #56b6c2; text-transform: uppercase;">SUB-APP CONTAINER</span>
            </div>
            <span style="font-size: 10px; background: rgba(86, 182, 194, 0.2); color: #56b6c2; padding: 2px 6px; border-radius: 4px;">SPA</span>
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="font-size: 10px; color: #56b6c2; margin-top: 2px;">Self-Contained UI & API Bundle</div>
          </div>
        \`;
      }

      innerHtml += \`
        <div class="node-socket socket-out" data-node-id="\${node.id}" data-socket-type="out"></div>
        <div class="node-socket socket-in" data-node-id="\${node.id}" data-socket-type="in"></div>
        <div class="tooltip-container socket-views" data-node-id="\${node.id}" data-socket-type="views">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>
          <span class="tooltip-text tooltip-bottom">Spawn Omni View</span>
        </div>
      \`;

      el.innerHTML = innerHtml;

      el.onmousedown = (e) => {
        if (e.target.closest('.node-socket') || e.target.closest('.socket-views')) return;
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
            if (nEl) initialNodePositions.set(nid, { x: parseFloat(nEl.style.left), y: parseFloat(nEl.style.top) });
          });
        }
      };

      const outSocket = el.querySelector('.socket-out');
      const inSocket = el.querySelector('.socket-in');
      [outSocket, inSocket].forEach(sock => {
        if (sock) {
          sock.onmousedown = (e) => {
            e.stopPropagation();
            isDraggingWire = true;
            isDraggingViewsWire = false;
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

      const viewsSocket = el.querySelector('.socket-views');
      if (viewsSocket) {
        viewsSocket.onmousedown = (e) => {
          e.stopPropagation();
          isDraggingWire = true;
          isDraggingViewsWire = true;
          const sockRect = viewsSocket.getBoundingClientRect();
          const vpRect = viewport.getBoundingClientRect();
          wireSource = {
            nodeId: node.id,
            socketType: 'views',
            x: (sockRect.left + sockRect.width / 2 - vpRect.left - panX) / zoom,
            y: (sockRect.top + sockRect.height / 2 - vpRect.top - panY) / zoom
          };
        };

        viewsSocket.onclick = (e) => {
          e.stopPropagation();
          wireSource = { nodeId: node.id, socketType: 'views', x: x + 300, y: y + 50 };
          wireDropPos = { x: x + 360, y: y };
          openViewSelectorModalAt(e.clientX + 10, e.clientY + 10, node.id);
        };
      }

      layer.appendChild(el);
    }

    // --- OMNI VIEWER NODE SPAWNING & PERSISTENCE ---
    function confirmSpawnViewer(viewType) {
      hideContextMenus();
      const targetId = wireSource?.nodeId || contextTargetNodeId;
      if (!targetId) return;
      spawnViewerNode(targetId, viewType, wireDropPos.x, wireDropPos.y);
    }

    function spawnViewerForContext(viewType) {
      hideContextMenus();
      if (!contextTargetNodeId) return;
      const el = document.getElementById('node-' + contextTargetNodeId);
      const x = el ? parseFloat(el.style.left) + 380 : 500;
      const y = el ? parseFloat(el.style.top) : 200;
      spawnViewerNode(contextTargetNodeId, viewType, x, y);
    }

    function spawnViewerNode(sourceNodeId, viewType, x, y) {
      const sourceNode = currentGraph.nodes.find(n => n.id === sourceNodeId);
      if (!sourceNode) return;

      const viewerId = 'viewer_' + (++viewerCounter);
      const viewerData = {
        id: viewerId,
        sourceNodeId,
        viewType,
        sourceNode,
        x: x || 400,
        y: y || 200,
        w: viewType === 'ui' ? 620 : 520,
        h: viewType === 'ui' ? 440 : 380,
        monacoInstance: null
      };

      spawnedViewers.set(viewerId, viewerData);
      renderViewerDomElement(viewerData, document.getElementById('nodes-layer'));
      requestAnimationFrame(() => {
        renderWiresAndGizmos();
      });
    }

    function closeViewerNode(viewerId) {
      const vEl = document.getElementById('viewer-' + viewerId);
      if (vEl) vEl.remove();
      const vData = spawnedViewers.get(viewerId);
      if (vData?.monacoInstance) {
        try { vData.monacoInstance.dispose(); } catch (e) {}
      }
      spawnedViewers.delete(viewerId);
      renderWiresAndGizmos();
    }

    function renderViewerDomElement(viewer, layer) {
      let vEl = document.getElementById('viewer-' + viewer.id);
      if (vEl) return;

      vEl = document.createElement('div');
      vEl.id = 'viewer-' + viewer.id;
      vEl.className = 'krnl-viewer-node';
      layer.appendChild(vEl);

      vEl.style.left = viewer.x + 'px';
      vEl.style.top = viewer.y + 'px';
      vEl.style.width = viewer.w + 'px';
      vEl.style.height = viewer.h + 'px';

      const nodeName = viewer.sourceNode.name;
      const viewTitle = viewer.viewType === 'ui' ? 'UI & Atom Builder'
        : viewer.viewType === 'code' ? 'Monaco Source Code'
        : viewer.viewType === 'test' ? 'Sandboxed Test Bench'
        : 'Reactive State Inspector';

      vEl.innerHTML = \`
        <div class="viewer-titlebar" id="vtb-\${viewer.id}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span style="font-size: 13px; font-weight: bold; color: #c678dd;">\${viewTitle}</span>
            <span style="font-size: 11px; background: rgba(198, 120, 221, 0.2); color: #c678dd; padding: 2px 6px; border-radius: 4px;">\${nodeName}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button onclick="closeViewerNode('\${viewer.id}')" style="background: transparent; border: none; color: #abb2bf; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
          </div>
        </div>
        <div class="viewer-body" id="vb-\${viewer.id}"></div>
        <div class="viewer-resize-handle" id="vrh-\${viewer.id}"></div>
      \`;

      vEl.onmousedown = () => { vEl.style.zIndex = ++maxZIndex; };

      const titlebar = vEl.querySelector('#vtb-' + viewer.id);
      titlebar.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        e.stopPropagation();
        isDraggingViewer = true;
        draggedViewerId = viewer.id;
        const rect = viewport.getBoundingClientRect();
        viewerDragOffset = {
          x: (e.clientX - rect.left - panX) / zoom - viewer.x,
          y: (e.clientY - rect.top - panY) / zoom - viewer.y
        };
      };

      const resizeHandle = vEl.querySelector('#vrh-' + viewer.id);
      resizeHandle.onmousedown = (e) => {
        e.stopPropagation();
        isResizingViewer = true;
        resizedViewerId = viewer.id;
        const rect = viewport.getBoundingClientRect();
        resizeStartPos = {
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          w: viewer.w,
          h: viewer.h
        };
      };

      const body = vEl.querySelector('#vb-' + viewer.id);
      populateViewerContent(viewer, body);
    }

    // --- Bulletproof File Loader (WebSocket RPC + HTTP Fallback) ---
    function fetchFileContent(filePath, cb) {
      if (window.studioWs && window.studioWs.readyState === WebSocket.OPEN) {
        const reqId = 'file-read-' + Date.now();
        const msgHandler = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.id === reqId) {
              window.studioWs.removeEventListener('message', msgHandler);
              if (data.result?.payload?.content !== undefined) {
                cb(null, data.result.payload.content);
              } else if (data.result?.content !== undefined) {
                cb(null, data.result.content);
              } else if (data.error) {
                cb(new Error(data.error.message));
              }
            }
          } catch (e) {}
        };
        window.studioWs.addEventListener('message', msgHandler);
        window.studioWs.send(JSON.stringify({
          jsonrpc: '2.0',
          id: reqId,
          method: 'file.read',
          params: { filePath }
        }));
        return;
      }

      // HTTP fetch fallback
      fetch('/api/v1/file/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })
      .then(res => res.json())
      .then(data => {
        if (data.payload?.content !== undefined) cb(null, data.payload.content);
        else if (data.result?.payload?.content !== undefined) cb(null, data.result.payload.content);
        else cb(new Error('No content returned'));
      })
      .catch(err => cb(err));
    }

    function populateViewerContent(viewer, containerEl) {
      containerEl.innerHTML = '';

      if (viewer.viewType === 'ui') {
        containerEl.innerHTML = \`
          <div style="display: flex; flex: 1; overflow: hidden;">
            <div style="width: 140px; border-right: 1px solid rgba(198, 120, 221, 0.25); padding: 10px; background: rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 10px; color: #c678dd; font-weight: bold;">KRNL ATOMS</span>
              <div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('text', 'KrnlButton')" style="padding: 6px; border: var(--krnl-border); background: #21212b; border-radius: 4px; cursor: grab; font-size: 11px;">Button</div>
              <div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('text', 'KrnlTextInput')" style="padding: 6px; border: var(--krnl-border); background: #21212b; border-radius: 4px; cursor: grab; font-size: 11px;">TextInput</div>
              <div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('text', 'KrnlTile')" style="padding: 6px; border: var(--krnl-border); background: #21212b; border-radius: 4px; cursor: grab; font-size: 11px;">Tile</div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; padding: 12px; gap: 10px; overflow: hidden;">
              <div id="drop-target-\${viewer.id}" ondragover="event.preventDefault()" ondrop="handleViewerAtomDrop(event, '\${viewer.id}')" style="flex: 1; border: 1px dashed rgba(198, 120, 221, 0.4); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 6px; overflow-y: auto;">
                <div style="margin: auto; font-size: 11px; color: #7f848e;">Drag atoms here to compose view</div>
              </div>
              <div style="height: 120px; border: 1px solid rgba(198, 120, 221, 0.2); border-radius: 6px; overflow: hidden;" id="monaco-ui-\${viewer.id}"></div>
            </div>
          </div>
        \`;

        setTimeout(() => {
          if (window.monaco) {
            viewer.monacoInstance = monaco.editor.create(document.getElementById('monaco-ui-' + viewer.id), {
              value: \`// Generated VanJS UI for \${viewer.sourceNode.name}\\nimport van from 'vanjs-core';\\nimport { KrnlTile } from '@dinilmusick/krnl-ui';\\n\\nexport function \${viewer.sourceNode.name}View() {\\n  return KrnlTile({ title: '\${viewer.sourceNode.name}' });\\n}\`,
              language: 'typescript', theme: 'krnl-dark', readOnly: true, fontSize: 11, minimap: { enabled: false }
            });
          }
        }, 50);
      } else if (viewer.viewType === 'code') {
        const monacoDiv = document.createElement('div');
        monacoDiv.style.width = '100%'; monacoDiv.style.height = '100%';
        containerEl.appendChild(monacoDiv);

        setTimeout(() => {
          if (window.monaco) {
            viewer.monacoInstance = monaco.editor.create(monacoDiv, {
              value: \`// Loading source code for \${viewer.sourceNode.name}...\`,
              language: 'typescript',
              theme: 'krnl-dark',
              automaticLayout: true,
              fontSize: 12,
              minimap: { enabled: true }
            });

            fetchFileContent(viewer.sourceNode.filePath, (err, content) => {
              if (err) {
                viewer.monacoInstance.setValue(\`// File: \${viewer.sourceNode.filePath}\\n// Could not load file directly: \${err.message}\\n\\n// Showing placeholder contract:\\nexport function \${viewer.sourceNode.name}() {\\n  // Implementation\\n}\`);
              } else {
                viewer.monacoInstance.setValue(content);
              }
            });
          }
        }, 50);
      } else if (viewer.viewType === 'test') {
        containerEl.innerHTML = \`
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; height: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #abb2bf; font-weight: bold;">INPUT PAYLOAD:</span>
              <button onclick="executeViewerTest('\${viewer.id}')" style="background: #c678dd; color: #121212; border: none; padding: 4px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; transition: transform 0.1s ease;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='none'">▶ Execute in Sandbox</button>
            </div>
            <div id="test-in-\${viewer.id}" style="height: 100px; border: 1px solid rgba(198, 120, 221, 0.3); border-radius: 6px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span style="font-size: 11px; color: #abb2bf; font-weight: bold;">OUTPUT & BENCHMARK:</span>
              <span id="test-badge-\${viewer.id}" style="font-size: 11px; font-weight: bold; color: #7f848e;">Awaiting run</span>
            </div>
            <div id="test-out-\${viewer.id}" style="flex: 1; border: 1px solid rgba(198, 120, 221, 0.3); border-radius: 6px;"></div>
          </div>
        \`;

        let defaultJson = '{}';
        if (viewer.sourceNode.name.includes('Calc')) {
          defaultJson = '{\\n  "a": 10,\\n  "b": 25\\n}';
        } else if (viewer.sourceNode.name.includes('Order')) {
          defaultJson = '{\\n  "orderId": "ORD-9821",\\n  "amount": 250\\n}';
        } else if (viewer.sourceNode.name.includes('Agent') || viewer.sourceNode.name.includes('AI')) {
          defaultJson = '{\\n  "prompt": "Analyze systems status",\\n  "maxTokens": 100\\n}';
        }

        setTimeout(() => {
          if (window.monaco) {
            viewer.testInputEditor = monaco.editor.create(document.getElementById('test-in-' + viewer.id), {
              value: defaultJson,
              language: 'json', theme: 'krnl-dark', fontSize: 11, minimap: { enabled: false }
            });
            viewer.testOutputEditor = monaco.editor.create(document.getElementById('test-out-' + viewer.id), {
              value: '// Press [▶ Execute in Sandbox] above to run in isolated VM',
              language: 'json', theme: 'krnl-dark', readOnly: true, fontSize: 11, minimap: { enabled: false }
            });
          }
        }, 50);
      } else if (viewer.viewType === 'state') {
        const monacoDiv = document.createElement('div');
        monacoDiv.style.width = '100%'; monacoDiv.style.height = '100%';
        containerEl.appendChild(monacoDiv);

        setTimeout(() => {
          if (window.monaco) {
            viewer.monacoInstance = monaco.editor.create(monacoDiv, {
              value: JSON.stringify({ active: true, invocationCount: 14, lastUpdated: Date.now() }, null, 2),
              language: 'json', theme: 'krnl-dark', fontSize: 12, minimap: { enabled: false }
            });
          }
        }, 50);
      }
    }

    function handleViewerAtomDrop(e, viewerId) {
      e.preventDefault();
      const atom = e.dataTransfer.getData('text');
      const target = document.getElementById('drop-target-' + viewerId);
      if (atom && target) {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 6px 10px; background: #21212b; border: 1px solid #c678dd; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between;';
        item.innerHTML = \`<span>\${atom}</span><span style="color: #98c379;">Bound</span>\`;
        target.appendChild(item);
      }
    }

    async function executeViewerTest(viewerId) {
      const viewer = spawnedViewers.get(viewerId);
      if (!viewer || !viewer.testInputEditor) return;
      const badge = document.getElementById('test-badge-' + viewerId);
      if (badge) {
        badge.textContent = '⏳ Executing in Sandbox...';
        badge.style.color = '#e5c07b';
      }

      let inputVal = {};
      try {
        const raw = viewer.testInputEditor.getValue().trim();
        inputVal = raw ? JSON.parse(raw) : {};
      } catch (e) {
        if (badge) {
          badge.textContent = '❌ Invalid Input JSON';
          badge.style.color = '#e06c75';
        }
        if (viewer.testOutputEditor) {
          viewer.testOutputEditor.setValue(JSON.stringify({ error: 'Invalid JSON: ' + e.message }, null, 2));
        }
        return;
      }

      try {
        if (window.studioWs && window.studioWs.readyState === WebSocket.OPEN) {
          const reqId = 'test-exec-' + Date.now();
          const handler = (evt) => {
            try {
              const data = JSON.parse(evt.data);
              if (data.id === reqId) {
                window.studioWs.removeEventListener('message', handler);
                handleTestResult(data.result?.payload || data.result, viewerId);
              }
            } catch (e) {}
          };
          window.studioWs.addEventListener('message', handler);
          window.studioWs.send(JSON.stringify({
            jsonrpc: '2.0',
            id: reqId,
            method: 'test.executeFunction',
            params: { filePath: viewer.sourceNode.filePath, input: inputVal }
          }));
          return;
        }

        const res = await fetch('/api/v1/test/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: viewer.sourceNode.filePath, input: inputVal })
        });
        const data = await res.json();
        handleTestResult(data.payload || data.result?.payload || data, viewerId);
      } catch (err) {
        if (badge) {
          badge.textContent = '[FAILED]';
          badge.style.color = '#e06c75';
        }
        if (viewer.testOutputEditor) {
          viewer.testOutputEditor.setValue(JSON.stringify({ error: err.message || String(err) }, null, 2));
        }
      }
    }

    function handleTestResult(payload, viewerId) {
      const viewer = spawnedViewers.get(viewerId);
      const badge = document.getElementById('test-badge-' + viewerId);
      if (badge && payload) {
        if (payload.success) {
          badge.textContent = \`[\${payload.durationMs || 0}ms | PASSED]\`;
          badge.style.color = '#98c379';
        } else {
          badge.textContent = \`[\${payload.durationMs || 0}ms | FAILED]\`;
          badge.style.color = '#e06c75';
        }
      }
      if (viewer && viewer.testOutputEditor) {
        if (payload?.output !== undefined) {
          viewer.testOutputEditor.setValue(JSON.stringify(payload.output, null, 2));
        } else if (payload?.error) {
          viewer.testOutputEditor.setValue(JSON.stringify({ error: payload.error, logs: payload.logs || [] }, null, 2));
        } else {
          viewer.testOutputEditor.setValue(JSON.stringify(payload, null, 2));
        }
      }
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
      if (!svg || !gizmosLayer) return;

      svg.innerHTML = '';
      gizmosLayer.innerHTML = '';

      // Standard Flow Connections
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

          if (edge.deletable !== false) {
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;
            const gizmo = document.createElement('div');
            gizmo.className = 'edge-delete-gizmo';
            gizmo.style.left = midX + 'px';
            gizmo.style.top = midY + 'px';
            gizmo.innerHTML = '✕';
            gizmo.title = 'Delete Connection';
            gizmo.onclick = (e) => { e.stopPropagation(); apiDeleteEdge(edge.id); };
            gizmosLayer.appendChild(gizmo);
          }
        }
      }

      // TETHERING 'VIEWS' WIRES (Rendered between Node's Views Socket & Viewer Window)
      spawnedViewers.forEach(viewer => {
        const sEl = document.getElementById('node-' + viewer.sourceNodeId);
        const vEl = document.getElementById('viewer-' + viewer.id);
        if (sEl && vEl) {
          const sX = parseFloat(sEl.style.left) || 0;
          const sY = parseFloat(sEl.style.top) || 0;
          const sW = sEl.offsetWidth || 280;
          const sH = sEl.offsetHeight || 130;

          // Originates at bottom-right Views handle
          const sx = sX + sW - 13;
          const sy = sY + sH + 3;

          const tx = parseFloat(vEl.style.left) || viewer.x;
          const ty = (parseFloat(vEl.style.top) || viewer.y) + 20;

          const dx = Math.max(50, Math.abs(tx - sx) * 0.45);
          const dy = Math.abs(ty - sy) * 0.45;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy + dy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
          path.setAttribute('stroke', '#c678dd');
          path.setAttribute('stroke-width', '3');
          path.setAttribute('stroke-dasharray', '6,6');
          path.setAttribute('fill', 'none');
          path.setAttribute('opacity', '0.95');
          svg.appendChild(path);

          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;
          const gizmo = document.createElement('div');
          gizmo.className = 'edge-delete-gizmo';
          gizmo.style.left = midX + 'px';
          gizmo.style.top = midY + 'px';
          gizmo.style.borderColor = '#c678dd';
          gizmo.style.color = '#c678dd';
          gizmo.innerHTML = '✕';
          gizmo.title = 'Close Viewer';
          gizmo.onclick = (e) => { e.stopPropagation(); closeViewerNode(viewer.id); };
          gizmosLayer.appendChild(gizmo);
        }
      });
    }

    function drawLiveWire(sx, sy, tx, ty, color = '#61afef') {
      let livePath = document.getElementById('live-drag-wire');
      const svg = document.getElementById('svg-wires');
      if (!livePath) {
        livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        livePath.id = 'live-drag-wire';
        livePath.setAttribute('stroke-width', '3');
        livePath.setAttribute('stroke-dasharray', '6,6');
        livePath.setAttribute('fill', 'none');
        svg.appendChild(livePath);
      }
      livePath.setAttribute('stroke', color);
      const dx = Math.abs(tx - sx) * 0.5;
      livePath.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
    }

    function removeLiveWire() {
      const livePath = document.getElementById('live-drag-wire');
      if (livePath) livePath.remove();
    }

    function apiMoveMultipleNodes(positions) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'move-' + Date.now(), method: 'graph.moveMultipleNodes', params: { positions } }));
    }
    function apiConnectNodes(source, target) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'conn-' + Date.now(), method: 'graph.connectNodes', params: { source, target, type: 'contains' } }));
    }
    function apiDeleteEdge(edgeId) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'del-edge-' + Date.now(), method: 'graph.deleteEdge', params: { edgeId } }));
    }
    function apiDeleteNode(nodeId) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'del-node-' + Date.now(), method: 'graph.deleteNode', params: { nodeId } }));
    }
    function apiAlignLayout(algorithm = 'hierarchical') {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'align-' + Date.now(), method: 'graph.alignLayout', params: { algorithm } }));
    }
    function apiUndo() {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'undo-' + Date.now(), method: 'graph.undo', params: {} }));
    }
    function apiRedo() {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'redo-' + Date.now(), method: 'graph.redo', params: {} }));
    }

    function contextAddEntity() {
      const name = prompt('Enter Entity Name:');
      if (name && window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'c-ent-' + Date.now(), method: 'entity.create', params: { name } }));
    }
    function contextAddFunctionality() {
      const entityName = prompt('Enter Parent Entity Name:');
      const name = prompt('Enter Functionality Name:');
      if (entityName && name && window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'c-fn-' + Date.now(), method: 'functionality.create', params: { entityName, name } }));
    }
    function contextAddLibrary() {
      const name = prompt('Enter Concept Library Name:');
      if (name && window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'c-lib-' + Date.now(), method: 'library.create', params: { name } }));
    }

    function switchProject(relPath) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'switch-' + Date.now(), method: 'project.switch', params: { path: relPath } }));
    }
    function triggerPurityAudit() {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'audit-' + Date.now(), method: 'validate.runPurityAudit' }));
    }

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/studio/ws');
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'graph.init' || msg.method === 'graph.updated') {
          currentGraph = msg.params;
          renderGraphNodes(currentGraph);
        } else if (msg.method === 'agent.activity') {
          showAgentHud(msg.params);
        }
      };
      ws.onclose = () => setTimeout(connectWebSocket, 2000);
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

    if (window.require) {
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], function () {
        monaco.editor.defineTheme('krnl-dark', {
          base: 'vs-dark', inherit: true,
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
            'editorWidget.border': '#c678dd'
          }
        });
      });
    }
  </script>
</body>
</html>`;
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log(`\n🚀 [Krnl Studio] Omni Canvas IDE running at: http://localhost:${this.port}`);
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
