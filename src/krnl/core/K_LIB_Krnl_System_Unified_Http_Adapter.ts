/**
 * @file K_LIB_Krnl_System_Unified_Http_Adapter.ts
 * @description Unified HTTP adapter that exposes REST, SSE, MCP, and ACP protocols.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { KrnlMcpProtocol } from './K_LIB_Krnl_Protocol_MCP.js';
import { KrnlAcpProtocol } from './K_LIB_Krnl_Protocol_ACP.js';
import { Logger } from './K_LIB_Krnl_Base_Concepts.js';

export class krnlUnifiedHttpAdapter {
    system: any;
    port: number;
    host: string;
    server: http.Server | null;
    _isExternalServer: boolean;
    mcp: KrnlMcpProtocol;
    acp: KrnlAcpProtocol;
    enableFriendlyRouting: boolean;

    /**
     * @param system
     * @param port
     * @param host
     */
    constructor(system: any, port: number, host: string = '0.0.0.0') {
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
    async start(externalServer: http.Server | null = null): Promise<void> {
        if (this.server) return;

        if (externalServer) {
            this.server = externalServer;
            this._isExternalServer = true;
            this.server.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
                this._handleRequest(req, res);
            });
        } else {
            this.server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
                this._handleRequest(req, res);
            });

            return new Promise((resolve, reject) => {
                this.server!.listen(this.port, this.host, () => {
                    Logger.log(`[${this.system.entityName}] Unified HTTP Adapter active on http://${this.host}:${this.port}`);
                    resolve();
                });
                this.server!.on('error', reject);
            });
        }
    }

    stop(): void {
        if (this.server && !this._isExternalServer) {
            this.server.close();
            console.log(`[${this.system.entityName}] Unified HTTP Adapter stopped.`);
        }
        this.server = null;
    }

    async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const reqPath = url.pathname;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // ── Internal Sub-App routing ──────────────────────────────────────────────────────────
        // Sub-apps are embedded components; they have NO networking of their own.
        // Local-mode sub-apps: call their unifiedHttpAdapter._handleRequest directly (in-process).
        // Worker-mode sub-apps: parse body here, send via MessagePort, write response.
        if (this.system._subAppRegistry?.size > 0) {
            const segments = reqPath.split('/').filter(Boolean);
            const prefix = segments[0]?.toLowerCase();
            if (prefix && this.system._subAppRegistry.has(prefix)) {
                const entry = this.system._subAppRegistry.get(prefix)!;
                let subPath = '/' + segments.slice(1).join('/') + url.search;
                if (reqPath.endsWith('/') && !subPath.endsWith('/')) subPath += '/';

                if (entry.executionMode === 'worker') {
                    // Worker mode: parse the request and route via MessagePort IPC
                    const fid  = segments[1] ?? 'heartbeat';
                    const body = req.method === 'GET'
                        ? Object.fromEntries(url.searchParams.entries())
                        : await this._readJsonBody(req);
                    try {
                        const result = await entry.entity.call(fid, body);
                        this._sendJson(res, 200, result);
                    } catch (err: any) {
                        this._sendJson(res, 200, { status: 'error', message: err.message || String(err) });
                    }
                } else {
                    // Local mode: delegate directly to the sub-app's in-process HTTP adapter
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

        // ── Sibling Network frontend routing ───────────────────────────────────────────────
        // The sibling network (formerly ingress network) connects STANDALONE independent apps.
        // This routing block handles custom frontends registered via the sibling network.
        if (this.system._siblingNetwork) {
            const segments = reqPath.split('/').filter(Boolean);
            const prefix = segments[0]?.toLowerCase();
            if (prefix && this.system._siblingNetwork.members.has(prefix)) {
                if (segments.length === 3 && segments[1] === 'frontend' && segments[2] === 'default' && !reqPath.endsWith('/')) {
                    res.writeHead(302, { 'Location': reqPath + '/' + url.search });
                    res.end();
                    return;
                }
                let subPath = '/' + segments.slice(1).join('/') + url.search;
                if (reqPath.endsWith('/') && !subPath.endsWith('/')) subPath += '/';
                await this.system._siblingNetwork.routeHttpRequest(prefix, req, res, subPath);
                return;
            }
            // Custom/arbitrary frontends
            if (segments[0] && segments[1] && segments[0].toLowerCase() !== 'default') {
                const key = `${segments[0].toLowerCase()}/${segments[1].toLowerCase()}`;
                if (this.system._siblingNetwork.members.has(key)) {
                    await this.system._siblingNetwork.routeHttpRequest(key, req, res, req.url || '/');
                    return;
                }
            }
        }

        if (reqPath === '/frontend' || reqPath.startsWith('/frontend/')) {
            if (!this.system._frontend && this.system._entityDataDir) {
                const frontendDir = path.join(this.system._entityDataDir, 'frontend');
                if (fs.existsSync(frontendDir)) {
                    this.system.enableFrontend({ frontendDir });
                }
            }

            if (this.system._frontend) {
                const subPath = reqPath.slice('/frontend'.length) || '/';
                await this.system._frontend.handleRequest(req, res, subPath);
            } else {
                this._sendJson(res, 404, { status: 'error', message: 'Frontend not enabled.' });
            }
            return;
        }

        const isKrnlRoute = reqPath.startsWith('/call/') || 
                           reqPath.startsWith('/sse/') || 
                           reqPath.startsWith('/mcp') || 
                           reqPath.startsWith('/acp') || 
                           reqPath === '/manifest' ||
                           reqPath === '/health';

        if (!isKrnlRoute) {
            if (this.enableFriendlyRouting) {
                let fid = reqPath.slice(1);
                if (fid.endsWith('/')) fid = fid.slice(0, -1); 

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
                        
                        const result = await this.system.call(fid, (data as any).data || data, {
                            unwrap: false,
                            callerPort: req.socket?.remotePort,
                            accessKey: req.headers['x-krnl-access-key'] as string | undefined,
                        });
                        this._sendJson(res, 200, result);
                    } catch (e: any) {
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

            this._sendJson(res, 404, this.system.getNotFoundResponse(reqPath));
            return;
        }

        try {
            if (reqPath.startsWith('/call/')) {
                const fid = reqPath.split('/')[2];
                const body = await this._readJsonBody(req);
                const result = await this.system.call(fid, body, {
                    unwrap: false,
                    callerPort: req.socket?.remotePort,
                    accessKey: req.headers['x-krnl-access-key'] as string | undefined,
                });
                this._sendJson(res, 200, result);
                return;
            }

            if (reqPath.startsWith('/sse/')) {
                const fid = reqPath.split('/')[2];
                this._handleSse(req, res, fid);
                return;
            }

            if (reqPath === '/ai') {
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

            if (reqPath === '/ai/manifest') {
                const agents = this.system._aiOrchestrator?.getAgentSummaries() ?? [];
                this._sendJson(res, 200, { 
                    aiEnabled: !!this.system._aiOrchestrator, 
                    aikoAlive: this.system.isAikoAlive(),
                    endpoints: agents 
                });
                return;
            }

            if (reqPath === '/mcp') {
                const body = await this._readJsonBody(req);
                const result = await (this.mcp as any).handleRequest(body, {
                    callerPort: req.socket?.remotePort,
                    accessKey: req.headers['x-krnl-access-key'] as string | undefined,
                });
                this._sendJson(res, 200, result);
                return;
            }

            if (reqPath === '/health') {
                const healthData: any = { status: "ok", entity: this.system.entityName };
                if (this.system._subappErrors && this.system._subappErrors.length > 0) {
                    healthData.status = "issues";
                    healthData.issues = this.system._subappErrors;
                }
                this._sendJson(res, 200, healthData);
                return;
            }

            if (reqPath.startsWith('/acp')) {
                if (reqPath === '/acp/info' || reqPath === '/acp') {
                    this._sendJson(res, 200, this.acp.getInfo());
                } else if (reqPath === '/acp/capabilities') {
                    this._sendJson(res, 200, this.acp.getCapabilities());
                } else if (reqPath === '/acp/messages' && req.method === 'POST') {
                    const body = await this._readJsonBody(req);
                    const result = await (this.acp as any).handleMessage(body, {
                        callerPort: req.socket?.remotePort,
                        accessKey: req.headers['x-krnl-access-key'] as string | undefined,
                    });
                    this._sendJson(res, 200, result);
                } else {
                    this._sendJson(res, 404, { error: "ACP route not found" });
                }
                return;
            }

            if (reqPath === '/manifest') {
                if (this.system._ingressNetwork) {
                    this._sendJson(res, 200, this.system._ingressNetwork.getGrossManifest(`http://${req.headers.host}`));
                } else {
                    this._sendJson(res, 200, this.system.getManifest());
                }
                return;
            }

        } catch (error: any) {
            Logger.error(`[HttpAdapter] Fatal handler error ${reqPath}:`, error.message || error);
            this._sendJson(res, 200, { 
                status: "error", 
                message: error.message || String(error),
                errorDocumentation: error.errorDocumentation || null
            });
        }
    }

    _handleSse(req: http.IncomingMessage, res: http.ServerResponse, fid: string): void {
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
        const unsubscribe = stateEmitter?.subscribe((msg: any) => {
            res.write(`data: ${JSON.stringify(msg.data)}\n\n`);
        });

        const interval = setInterval(() => {
            if (res.writable) {
                res.write(': keepalive\n\n');
            }
        }, 15000);

        req.on('close', () => {
            if (unsubscribe) unsubscribe();
            clearInterval(interval);
            res.end();
        });
    }

    _sendJson(res: http.ServerResponse, status: number, data: any): void {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    _readJsonBody(req: http.IncomingMessage): Promise<any> {
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
