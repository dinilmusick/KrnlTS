import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { JsonRpcRouter } from './JsonRpcRouter.js';
import { StudioFileWatcher } from './FileWatcher.js';
import { AstMutationEngine } from './AstMutationEngine.js';
import { PreemptiveDocManager } from './PreemptiveDocManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const candidates = [
      path.join(__dirname, 'studio.html'),
      path.join(__dirname, '../../src/server/studio.html'),
      path.join(process.cwd(), 'packages/studio/src/server/studio.html'),
      path.join(process.cwd(), 'src/server/studio.html')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate, 'utf8');
      }
    }

    return `<!DOCTYPE html><html><body><h1>Krnl Studio Error: studio.html template not found.</h1></body></html>`;
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
