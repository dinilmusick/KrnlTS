/**
 * @file K_LIB_Krnl_System_Unified_Http_Adapter.js
 * @description Unified HTTP adapter that exposes REST, SSE, MCP, and ACP protocols.
 * Supports sharing a single port/server with WebSocket.
 */

import http from 'http';
import { KrnlMcpProtocol } from './K_LIB_Krnl_Protocol_MCP.js';
import { KrnlAcpProtocol } from './K_LIB_Krnl_Protocol_ACP.js';

export class krnlUnifiedHttpAdapter {
    /**
     * @param {import("./K_ENT_Krnl_System_Entity_Base.js").krnlSystemEntityBase} system
     * @param {number} port
     * @param {string} host
     */
    constructor(system, port, host = '0.0.0.0') {
        this.system = system;
        this.port = port;
        this.host = host;
        this.server = null;
        this._isExternalServer = false;

        this.mcp = new KrnlMcpProtocol(system);
        this.acp = new KrnlAcpProtocol(system);

        /**
         * If true, allows direct FID routes (e.g., POST /LoadProject) 
         * and supports flat JSON payloads.
         */
        this.enableFriendlyRouting = false;
    }

    /**
     * Starts the adapter. If an external server is provided, it attaches its handler to it.
     * @param {http.Server} [externalServer]
     */
    async start(externalServer = null) {
        if (this.server) return;

        if (externalServer) {
            this.server = externalServer;
            this._isExternalServer = true;
            // Intercept requests on the external server
            // Ensure we are the first handler if possible, or just add a listener.
            // Note: Since node's http.Server executes listeners in order, 
            // if this doesn't handle it, others might.
            this.server.on('request', (req, res) => {
                this._handleRequest(req, res);
            });
        } else {
            this.server = http.createServer((req, res) => {
                this._handleRequest(req, res);
            });

            return new Promise((resolve, reject) => {
                this.server.listen(this.port, this.host, () => {
                    console.log(`[${this.system.entityName}] Unified HTTP Adapter active on http://${this.host}:${this.port}`);
                    resolve();
                });
                this.server.on('error', reject);
            });
        }
    }
    stop() {
        if (this.server && !this._isExternalServer) {
            this.server.close();
            console.log(`[${this.system.entityName}] Unified HTTP Adapter stopped.`);
        }
        this.server = null;
    }

    async _handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const path = url.pathname;

        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Common routes
        const isKrnlRoute = path.startsWith('/call/') || 
                           path.startsWith('/sse/') || 
                           path.startsWith('/mcp') || 
                           path.startsWith('/acp') || 
                           path === '/manifest' ||
                           path === '/health';

        if (!isKrnlRoute) {
            // ── FRIENDLY ROUTING: /:fid ───────────────────────────
            if (this.enableFriendlyRouting && req.method === 'POST') {
                const fid = path.slice(1);
                if (this.system.localFunctionalities.has(fid) || this.system.remoteFunctionalities.has(fid)) {
                    try {
                        const body = await this._readJsonBody(req);
                        // Smart payload wrapping: if no "data" key but other keys exist, wrap it.
                        // We exclude empty bodies or already-wrapped bodies.
                        const data = (body && typeof body === 'object' && !('data' in body) && Object.keys(body).length > 0) 
                                     ? { data: body } 
                                     : body;
                        
                        const result = await this.system.call(fid, data.data || data);
                        this._sendJson(res, 200, result);
                    } catch (e) {
                        this._sendJson(res, 400, { error: e.message });
                    }
                    return;
                }
            }

            // If it's not a Krnl route and not a friendly route, respond with 404.
            this._sendJson(res, 404, this.system.getNotFoundResponse(path));
            return;
        }

        try {
            // ── REST: /call/:fid ───────────────────────────────────
            if (path.startsWith('/call/')) {
                const fid = path.split('/')[2];
                const body = await this._readJsonBody(req);
                const result = await this.system.call(fid, body);
                this._sendJson(res, 200, result);
                return;
            }

            // ── SSE: /sse/:fid ────────────────────────────────────
            if (path.startsWith('/sse/')) {
                const fid = path.split('/')[2];
                this._handleSse(req, res, fid);
                return;
            }

            // ── MCP: /mcp (Unified / Streamable) ───────────────────
            if (path === '/mcp') {
                const body = await this._readJsonBody(req);
                const result = await this.mcp.handleRequest(body);
                this._sendJson(res, 200, result);
                return;
            }

            // ── HEALTH: /health ────────────────────────────────────
            if (path === '/health') {
                this._sendJson(res, 200, { status: "ok", entity: this.system.entityName });
                return;
            }

            // ── ACP: /acp/* ───────────────────────────────────────
            if (path.startsWith('/acp')) {
                if (path === '/acp/info' || path === '/acp') {
                    this._sendJson(res, 200, this.acp.getInfo());
                } else if (path === '/acp/capabilities') {
                    this._sendJson(res, 200, this.acp.getCapabilities());
                } else if (path === '/acp/messages' && req.method === 'POST') {
                    const body = await this._readJsonBody(req);
                    const result = await this.acp.handleMessage(body);
                    this._sendJson(res, 200, result);
                } else {
                    this._sendJson(res, 404, { error: "ACP route not found" });
                }
                return;
            }

            // ── MANIFEST: /manifest ───────────────────────────────
            if (path === '/manifest') {
                this._sendJson(res, 200, this.system.getManifest());
                return;
            }

        } catch (error) {
            console.error(`[HttpAdapter] Error handling ${path}:`, error);
            this._sendJson(res, 500, { error: error.message });
        }
    }

    _handleSse(req, res, fid) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        const functionality = this.system.localFunctionalities.get(fid);
        if (!functionality) {
            res.write(`data: ${JSON.stringify({ error: "Functionality not found" })}\n\n`);
            res.end();
            return;
        }

        const stateEmitter = functionality.emitters.get('state:changed');
        const unsubscribe = stateEmitter?.subscribe((msg) => {
            res.write(`data: ${JSON.stringify(msg.data)}\n\n`);
        });

        req.on('close', () => {
            if (unsubscribe) unsubscribe();
            res.end();
        });

        // Heartbeat
        const interval = setInterval(() => {
            if (res.writable) {
                res.write(': keepalive\n\n');
            }
        }, 15000);

        req.on('close', () => clearInterval(interval));
    }

    _sendJson(res, status, data) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    _readJsonBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                if (!body) return resolve({});
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error("Invalid JSON body"));
                }
            });
        });
    }
}
