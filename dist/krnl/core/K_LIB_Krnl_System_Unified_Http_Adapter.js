/**
 * @file K_LIB_Krnl_System_Unified_Http_Adapter.ts
 * @description Unified HTTP adapter that exposes REST, SSE, MCP, and ACP protocols.
 */
import http from 'http';
import { KrnlMcpProtocol } from './K_LIB_Krnl_Protocol_MCP.js';
import { KrnlAcpProtocol } from './K_LIB_Krnl_Protocol_ACP.js';
import { Logger } from './K_LIB_Krnl_Base_Concepts.js';
export class krnlUnifiedHttpAdapter {
    system;
    port;
    host;
    server;
    _isExternalServer;
    mcp;
    acp;
    enableFriendlyRouting;
    /**
     * @param system
     * @param port
     * @param host
     */
    constructor(system, port, host = '0.0.0.0') {
        this.system = system;
        this.port = port;
        this.host = host;
        this.server = null;
        this._isExternalServer = false;
        this.mcp = new KrnlMcpProtocol(system);
        this.acp = new KrnlAcpProtocol(system);
        this.enableFriendlyRouting = false;
    }
    /**
     * Starts the adapter.
     */
    async start(externalServer = null) {
        if (this.server)
            return;
        if (externalServer) {
            this.server = externalServer;
            this._isExternalServer = true;
            this.server.on('request', (req, res) => {
                this._handleRequest(req, res);
            });
        }
        else {
            this.server = http.createServer((req, res) => {
                this._handleRequest(req, res);
            });
            return new Promise((resolve, reject) => {
                this.server.listen(this.port, this.host, () => {
                    Logger.log(`[${this.system.entityName}] Unified HTTP Adapter active on http://${this.host}:${this.port}`);
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
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const path = url.pathname;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        // Ingress Network routing (Sub-apps)
        if (this.system._ingressNetwork) {
            const segments = path.split('/').filter(Boolean);
            const prefix = segments[0]?.toLowerCase();
            if (prefix && this.system._ingressNetwork.members.has(prefix)) {
                if (segments.length === 3 && segments[1] === 'frontend' && segments[2] === 'default' && !path.endsWith('/')) {
                    res.writeHead(302, { 'Location': path + '/' + url.search });
                    res.end();
                    return;
                }
                let subPath = '/' + segments.slice(1).join('/') + url.search;
                if (path.endsWith('/') && !subPath.endsWith('/')) {
                    subPath += '/';
                }
                await this.system._ingressNetwork.routeHttpRequest(prefix, req, res, subPath);
                return;
            }
        }
        // Ingress Network custom/arbitrary frontends check
        if (this.system._ingressNetwork) {
            const segments = path.split('/').filter(Boolean);
            if (segments[0] && segments[1] && segments[0].toLowerCase() !== 'default') {
                const key = `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
                if (this.system._ingressNetwork.members.has(key)) {
                    await this.system._ingressNetwork.routeHttpRequest(key, req, res, req.url || '/');
                    return;
                }
            }
        }
        if (path.startsWith('/frontend/default')) {
            if (this.system._frontend) {
                const subPath = path.slice('/frontend/default'.length) || '/';
                await this.system._frontend.handleRequest(req, res, subPath);
            }
            else {
                this._sendJson(res, 404, { status: 'error', message: 'Frontend not enabled.' });
            }
            return;
        }
        const isKrnlRoute = path.startsWith('/call/') ||
            path.startsWith('/sse/') ||
            path.startsWith('/mcp') ||
            path.startsWith('/acp') ||
            path === '/manifest' ||
            path === '/health';
        if (!isKrnlRoute) {
            if (this.enableFriendlyRouting) {
                let fid = path.slice(1);
                if (fid.endsWith('/'))
                    fid = fid.slice(0, -1);
                const functionality = this.system.localFunctionalities.get(fid) || this.system.remoteFunctionalities.get(fid);
                const resolved = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : null;
                if (functionality) {
                    const expectedMethod = (resolved || functionality).method || 'POST';
                    if (req.method !== expectedMethod) {
                        this._sendJson(res, 405, {
                            status: "error",
                            message: `Method ${req.method} not allowed for ${fid}. Use ${expectedMethod}.`
                        });
                        return;
                    }
                    try {
                        Logger.log(`[HttpAdapter] Friendly route hit: ${fid} (${req.method})`);
                        const input = req.method === 'GET'
                            ? Object.fromEntries(url.searchParams.entries())
                            : await this._readJsonBody(req);
                        const data = (input && typeof input === 'object' && !('data' in input) && Object.keys(input).length > 0)
                            ? { data: input }
                            : input;
                        const result = await this.system.call(fid, data.data || data, {
                            unwrap: false,
                            callerPort: req.socket?.remotePort,
                            accessKey: req.headers['x-krnl-access-key'],
                        });
                        this._sendJson(res, 200, result);
                    }
                    catch (e) {
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
            this._sendJson(res, 404, this.system.getNotFoundResponse(path));
            return;
        }
        try {
            if (path.startsWith('/call/')) {
                const fid = path.split('/')[2];
                const body = await this._readJsonBody(req);
                const result = await this.system.call(fid, body, {
                    unwrap: false,
                    callerPort: req.socket?.remotePort,
                    accessKey: req.headers['x-krnl-access-key'],
                });
                this._sendJson(res, 200, result);
                return;
            }
            if (path.startsWith('/sse/')) {
                const fid = path.split('/')[2];
                this._handleSse(req, res, fid);
                return;
            }
            if (path === '/ai') {
                const { message } = await this._readJsonBody(req);
                if (!this.system._aiOrchestrator) {
                    const { KrnlAikoClient } = await import("./K_LIB_Krnl_Aiko_Client.js");
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
            if (path === '/ai/manifest') {
                const agents = this.system._aiOrchestrator?.getAgentSummaries() ?? [];
                this._sendJson(res, 200, {
                    aiEnabled: !!this.system._aiOrchestrator,
                    aikoAlive: this.system.isAikoAlive(),
                    endpoints: agents
                });
                return;
            }
            if (path === '/mcp') {
                const body = await this._readJsonBody(req);
                const result = await this.mcp.handleRequest(body, {
                    callerPort: req.socket?.remotePort,
                    accessKey: req.headers['x-krnl-access-key'],
                });
                this._sendJson(res, 200, result);
                return;
            }
            if (path === '/health') {
                const healthData = { status: "ok", entity: this.system.entityName };
                if (this.system._subappErrors && this.system._subappErrors.length > 0) {
                    healthData.status = "issues";
                    healthData.issues = this.system._subappErrors;
                }
                this._sendJson(res, 200, healthData);
                return;
            }
            if (path.startsWith('/acp')) {
                if (path === '/acp/info' || path === '/acp') {
                    this._sendJson(res, 200, this.acp.getInfo());
                }
                else if (path === '/acp/capabilities') {
                    this._sendJson(res, 200, this.acp.getCapabilities());
                }
                else if (path === '/acp/messages' && req.method === 'POST') {
                    const body = await this._readJsonBody(req);
                    const result = await this.acp.handleMessage(body, {
                        callerPort: req.socket?.remotePort,
                        accessKey: req.headers['x-krnl-access-key'],
                    });
                    this._sendJson(res, 200, result);
                }
                else {
                    this._sendJson(res, 404, { error: "ACP route not found" });
                }
                return;
            }
            if (path === '/manifest') {
                if (this.system._ingressNetwork) {
                    this._sendJson(res, 200, this.system._ingressNetwork.getGrossManifest(`http://${req.headers.host}`));
                }
                else {
                    this._sendJson(res, 200, this.system.getManifest());
                }
                return;
            }
        }
        catch (error) {
            Logger.error(`[HttpAdapter] Fatal handler error ${path}:`, error.message || error);
            this._sendJson(res, 200, {
                status: "error",
                message: error.message || String(error),
                errorDocumentation: error.errorDocumentation || null
            });
        }
    }
    _handleSse(req, res, fid) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
        if (!functionality) {
            res.write(`data: ${JSON.stringify({ error: "Functionality not found" })}\n\n`);
            res.end();
            return;
        }
        const stateEmitter = functionality.emitters.get('state:changed');
        const unsubscribe = stateEmitter?.subscribe((msg) => {
            res.write(`data: ${JSON.stringify(msg.data)}\n\n`);
        });
        const interval = setInterval(() => {
            if (res.writable) {
                res.write(': keepalive\n\n');
            }
        }, 15000);
        req.on('close', () => {
            if (unsubscribe)
                unsubscribe();
            clearInterval(interval);
            res.end();
        });
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
                if (!body)
                    return resolve({});
                try {
                    resolve(JSON.parse(body));
                }
                catch (e) {
                    reject(new Error("Invalid JSON body"));
                }
            });
        });
    }
}
//# sourceMappingURL=K_LIB_Krnl_System_Unified_Http_Adapter.js.map