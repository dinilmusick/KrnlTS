import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { JsonRpcRouter } from './JsonRpcRouter.js';
import { StudioFileWatcher } from './FileWatcher.js';
import { AstMutationEngine } from './AstMutationEngine.js';

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
    this.projectRoot = path.resolve(options.projectRoot || process.cwd());
    this.router = new JsonRpcRouter(this.projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);

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

          if (req.method === 'project.switch') {
            const newPath = path.resolve(this.projectRoot, req.params.path);
            if (fs.existsSync(newPath)) {
              this.projectRoot = newPath;
              this.router = new JsonRpcRouter(this.projectRoot);
              this.astEngine = new AstMutationEngine(this.projectRoot);
              this.watcher.stop();
              this.watcher = new StudioFileWatcher(this.projectRoot);
              this.initFileWatcher();
              const graph = this.astEngine.extractArchitectureGraph();
              ws.send(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { success: true, projectRoot: this.projectRoot } }));
              this.broadcastGraphUpdate();
            } else {
              ws.send(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32001, message: 'Directory does not exist' } }));
            }
            return;
          }

          const res = await this.router.handle(req);
          ws.send(JSON.stringify(res));

          if (req.method && req.method.startsWith('graph.create')) {
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

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/api/graph') {
      const graph = this.astEngine.extractArchitectureGraph();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(graph));
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
  <title>Krnl Studio — Visual Node IDE & Workflow Engine</title>
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
        <span id="canvas-title" style="color: #abb2bf;">🏗️ Architecture Canvas</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 11px; color: #7f848e;">Project:</span>
        <select id="project-selector" onchange="switchProject(this.value)" style="background: #1e1e28; color: #d4af37; border: var(--krnl-border); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
          <option value="examples/unified-workspace" selected>examples/unified-workspace (All Examples Combined)</option>
          <option value=".">Current Root Project</option>
          <option value="examples/calculator-app">examples/calculator-app</option>
          <option value="examples/ecommerce-app">examples/ecommerce-app</option>
          <option value="examples/ai-agent-app">examples/ai-agent-app</option>
          <option value="examples/example1/CalculatorSystem">examples/example1/CalculatorSystem</option>
        </select>
        <button onclick="triggerPurityAudit()" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold;">⚡ Run AST Purity Audit</button>
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
            <button id="btn-run-test" style="background: #d4af37; color: #121212; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">▶ Execute in Sandbox</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">INPUT (JSON)</label>
              <textarea id="test-input-json" style="flex: 1; background: #16161e; border: var(--krnl-border); color: #98c379; font-family: monospace; padding: 12px; border-radius: 6px;">{\n  "payload": "demo_test_value"\n}</textarea>
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
      <button id="dock-btn-arch" onclick="switchCanvas('architecture', '🏗️ Architecture Canvas')" style="background: rgba(212, 175, 55, 0.25); border: 1px solid #d4af37; color: #d4af37; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;">🏗️ Architecture</button>
      <button id="dock-btn-ui" onclick="switchCanvas('ui', '🎨 UI Composer')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px;">🎨 UI Composer</button>
      <button id="dock-btn-test" onclick="switchCanvas('test', '🧪 Test Console')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px;">🧪 Test Console</button>
    </div>

    <!-- Context Menu -->
    <div id="context-menu">
      <div class="menu-item" onclick="contextAddEntity()">📦 New Entity</div>
      <div class="menu-item" onclick="contextAddFunctionality()">⚡ New Functionality</div>
      <div class="menu-item" onclick="contextAddLibrary()">📚 New Domain Library</div>
      <div class="menu-item" onclick="autoLayoutNodes()">📐 Auto Align Nodes</div>
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
      el.id = 'dom-' + node.id.replace(/[:\/]/g, '_');

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

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log(`\n🚀 [Krnl Studio] Visual IDE running at: http://localhost:${this.port}`);
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
