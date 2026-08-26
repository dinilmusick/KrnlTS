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
      // Send initial architecture graph on connect
      const initialGraph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'graph.init', params: initialGraph }));

      ws.on('message', async (data: string) => {
        try {
          const req = JSON.parse(data.toString());
          const res = await this.router.handle(req);
          ws.send(JSON.stringify(res));

          // If a mutation occurred, broadcast updated graph to all other clients
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
    const payload = JSON.stringify({ jsonrpc: '2.0', method: 'graph.updated', params: graph });
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
  <title>Krnl Studio — Visual Node IDE</title>
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
      <span id="canvas-indicator" style="color: #abb2bf;">🏗️ Architecture Canvas</span>
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
            <div class="palette-item" draggable="true" data-type="KrnlButton" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">🔘 KrnlButton</div>
            <div class="palette-item" draggable="true" data-type="KrnlTextInput" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">📝 KrnlTextInput</div>
            <div class="palette-item" draggable="true" data-type="KrnlDropdown" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">📋 KrnlDropdown</div>
            <div class="palette-item" draggable="true" data-type="KrnlTile" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">📊 KrnlTile</div>
            <div class="palette-item" draggable="true" data-type="KrnlDock" style="padding: 8px; border: var(--krnl-border); background: #21212b; border-radius: 6px; cursor: grab;">🚀 KrnlDock</div>
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
            <button id="btn-run-test" style="background: #d4af37; color: #121212; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">▶ Run Test</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; color: #abb2bf; margin-bottom: 4px;">INPUT (JSON)</label>
              <textarea id="test-input-json" style="flex: 1; background: #16161e; border: var(--krnl-border); color: #98c379; font-family: monospace; padding: 12px; border-radius: 6px;">{\n  "payload": "test"\n}</textarea>
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
      <button onclick="switchCanvas('architecture', '🏗️ Architecture Canvas')" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;">🏗️ Architecture</button>
      <button onclick="switchCanvas('ui', '🎨 UI Composer')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;">🎨 UI Composer</button>
      <button onclick="switchCanvas('test', '🧪 Test Console')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); color: #e0e0e0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;">🧪 Test Console</button>
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
