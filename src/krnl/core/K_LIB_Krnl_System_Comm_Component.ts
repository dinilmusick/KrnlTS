//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Comm_Component.ts
 *
 * @description The uniform P2P communication bridge for all Krnl system orchestrators.
 */

import { krnlEmitter } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlTransportAdapter } from "./K_LIB_Krnl_Functionality_Types.js";
import { Logger, KrnlPolicy } from "./K_LIB_Krnl_Base_Concepts.js";
import { krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";

/**
 * WEBSOCKET TRANSPORT ADAPTER
 * For remote inter-system communication.
 */
export class WebSocketTransportAdapter extends krnlTransportAdapter {
    commComponent: krnlSystemCommComponent;
    remoteAddress: string;

    /**
     * @param commComponent - The local system's comm component.
     * @param remoteAddress - "host:port" of the remote system.
     */
    constructor(commComponent: krnlSystemCommComponent, remoteAddress: string) {
        super();
        this.commComponent = commComponent;
        this.remoteAddress = remoteAddress;
    }

    async call(targetFunction: string, input: any, opts: any = {}): Promise<any> {
        const policy = opts.policy instanceof KrnlPolicy ? opts.policy : new KrnlPolicy(opts);
        return await this.commComponent.callWsRpc(this.remoteAddress, 'call', { fid: targetFunction, data: input }, policy);
    }
}

// ws is loaded lazily
let _WS: any, _WSServer: any;
async function _loadWs() {
    if (!_WS) {
        const mod = await import('ws');
        _WS = mod.WebSocket;
        _WSServer = mod.WebSocketServer;
    }
    return { WebSocket: _WS, WebSocketServer: _WSServer };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// KRNL SYSTEM COMM COMPONENT ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

export class krnlSystemCommComponent {
    ownerEntity: any;
    listenPort: number;
    host: string;
    routes: Map<string, any>;
    _routeSeq: number;
    _wsServer: any | null;
    _wsClients: Map<string, any>;
    _wsIngress: Map<string, (data: any) => void>;
    _wsPendingRpc: Map<string, any>;
    _wsRpcHandlers: Map<string, Function>;
    _introspectionProvider: (() => Promise<any>) | null;

    /**
     * @param ownerEntity
     * @param listenPort - WS server port (only used in "ws" mode).
     * @param host - Interface to bind to.
     */
    constructor(ownerEntity: any, listenPort: number = 10099, host: string = '0.0.0.0') {
        this.ownerEntity = ownerEntity;
        this.listenPort = listenPort;
        this.host = host;
        this.routes = new Map();   // routeId → KrnlRoute
        this._routeSeq = 0;
        this._wsServer = null;        
        this._wsClients = new Map();   
        this._wsIngress = new Map();   
        this._wsPendingRpc = new Map(); 
        this._wsRpcHandlers = new Map(); 
        this._introspectionProvider = null; 
    }

    /**
     * Binds a local emitter directly to another in-process system's collector.
     */
    wireDirectly(localEmitterName: string, remoteCommComponent: krnlSystemCommComponent, remoteCollectorName: string): any {
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const remoteCollector = remoteCommComponent.ownerEntity.interface.getCollector(remoteCollectorName);

        const unsubscribe = emitter.subscribe((msg: any) => {
            if (remoteCollector.emitter) {
                remoteCollector.emitter.pushDataStreamToEmitter(msg.data);
            }
            if (remoteCollector._directHandler) {
                remoteCollector._directHandler(msg);
            }
        });

        const routeId = `route_${this._routeSeq++}`;
        const route = {
            id: routeId,
            sourceEmitter: localEmitterName,
            targetSystem: remoteCommComponent.ownerEntity.entityName,
            targetCollector: remoteCollectorName,
            mode: "direct",
            disconnect: unsubscribe,
        };
        this.routes.set(routeId, route);

        Logger.log(
            `[CommComponent:${this.ownerEntity.entityName}] DIRECT route created: ` +
            `${localEmitterName} → ${route.targetSystem}.${remoteCollectorName}`
        );
        return route;
    }

    /**
     * Starts a WebSocket server so that remote systems can push data into local collectors.
     */
    async startWsServer(externalServer: any = null): Promise<void> {
        if (this._wsServer) return; 
        const { WebSocketServer } = await _loadWs();
        
        return new Promise((resolve, reject) => {
            if (externalServer) {
                this._wsServer = new WebSocketServer({ server: externalServer });
                resolve();
            } else {
                this._wsServer = new WebSocketServer({ port: this.listenPort, host: this.host });
                this._wsServer.on('listening', () => {
                    Logger.log(`[CommComponent:${this.ownerEntity.entityName}] WS server listening on :${this.listenPort}`);
                    resolve();
                });
            }

            this._wsServer.on('error', (err: any) => {
                Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS server error:`, err.message);
                reject(err);
            });

            this._wsServer.on('connection', (ws: any) => {
                ws.on('error', (err: any) => {
                    Logger.error(`[CommComponent:${this.ownerEntity.entityName}] Incoming WS error:`, err.message);
                });

                ws.on('message', (raw: Buffer) => {
                    try {
                        const msg = JSON.parse(raw.toString());

                        if (msg.routeId && Object.prototype.hasOwnProperty.call(msg, 'data') && !msg.kind) {
                            const handler = this._wsIngress.get(msg.routeId);
                            if (handler) handler(msg.data);
                            return;
                        }

                        if (msg.kind === 'register-ingress') {
                            this.registerWsIngress(msg.routeId, msg.collectorName);
                            return;
                        }

                        if (msg.kind === 'route-data') {
                            const handler = this._wsIngress.get(msg.routeId);
                            if (handler) handler(msg.data);
                            return;
                        }

                        if (msg.kind === 'rpc-request') {
                            this._handleRpcRequest(ws, msg);
                            return;
                        }

                        if (msg.kind === 'rpc-response') {
                            this._handleRpcResponse(msg);
                            return;
                        }

                        if (msg.kind === 'introspect') {
                            this._handleIntrospect(ws, msg);
                            return;
                        }
                    } catch (e: any) {
                        Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS message error:`, e.message);
                    }
                });
            });
        });
    }

    /**
     * Connects to a remote system's CommComponent WS server.
     */
    async wireViaWs(localEmitterName: string, remoteAddress: string, remoteCollectorName: string, remoteSystemName: string, options: any = {}): Promise<any> {
        const { WebSocket } = await _loadWs();
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const ws = new WebSocket(`ws://${remoteAddress}`);
        const {
            managedBy = this.ownerEntity.entityName,
            externallyMutable = true,
            metadata = {},
        } = options;

        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });

        ws.on('error', (err: any) => {
            Logger.error(`[CommComponent:${this.ownerEntity.entityName}] Outgoing WS error to ${remoteSystemName}:`, err.message);
        });

        this._wsClients.set(remoteSystemName, ws);
        const routeId = `ws_route_${this._routeSeq++}`;

        ws.send(JSON.stringify({
            kind: 'register-ingress',
            routeId,
            collectorName: remoteCollectorName,
        }));

        const unsubscribe = emitter.subscribe((msg: any) => {
            if (ws.readyState === _WS.OPEN) {
                ws.send(JSON.stringify({
                    kind: 'route-data',
                    routeId,
                    data: msg.data,
                }));
            }
        });

        const route = {
            id: routeId,
            sourceEmitter: localEmitterName,
            targetSystem: remoteSystemName,
            targetCollector: remoteCollectorName,
            mode: "ws",
            managedBy,
            externallyMutable,
            metadata,
            disconnect: () => {
                unsubscribe();
                ws.close();
                this._wsClients.delete(remoteSystemName);
            },
        };
        this.routes.set(routeId, route);

        Logger.log(
            `[CommComponent:${this.ownerEntity.entityName}] WS route created: ` +
            `${localEmitterName} → ${remoteSystemName}.${remoteCollectorName} @ ${remoteAddress}`
        );
        return route;
    }

    /**
     * Registers a WS ingress handler.
     */
    registerWsIngress(routeId: string, localCollectorName: string): void {
        this._wsIngress.set(routeId, (data: any) => {
            const collector = this.ownerEntity.interface.getCollector(localCollectorName);
            if (collector._directHandler) {
                collector._directHandler({ data });
            }
        });
    }

    defineRpc(methodName: string, handler: Function): void {
        this._wsRpcHandlers.set(methodName, handler);
    }

    setIntrospectionProvider(providerFn: () => Promise<any>): void {
        this._introspectionProvider = providerFn;
    }

    async callWsRpc(remoteAddress: string, method: string, params: any = {}, policy: KrnlPolicy = KrnlPolicy.default()): Promise<any> {
        const { WebSocket } = await _loadWs();
        let lastError: any = null;

        for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
            try {
                const requestId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                const ws = new WebSocket(`ws://${remoteAddress}`);

                await new Promise((resolve, reject) => {
                    const connTimeout = setTimeout(() => {
                        ws.close();
                        reject(new Error("ERR_NET_CONNECTION_TIMEOUT"));
                    }, policy.timeoutMs);

                    ws.once('open', () => {
                        clearTimeout(connTimeout);
                        resolve(true);
                    });
                    ws.once('error', (err: any) => {
                        clearTimeout(connTimeout);
                        reject(err);
                    });
                });

                const result = await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        this._wsPendingRpc.delete(requestId);
                        ws.close();
                        reject({ code: krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED, message: "ERR_NET_RPC_TIMEOUT_EXCEEDED" });
                    }, policy.timeoutMs);

                    this._wsPendingRpc.set(requestId, { resolve, reject, timeoutId, ws });

                    ws.on('message', (raw: Buffer) => {
                        try {
                            const msg = JSON.parse(raw.toString());
                            if (msg.kind === 'rpc-response') this._handleRpcResponse(msg);
                        } catch (_) { }
                    });

                    ws.send(JSON.stringify({
                        kind: 'rpc-request',
                        requestId,
                        traceCorrelationId: requestId, // Trace ID matches Request ID for initial hop
                        originSystemAddress: this.ownerEntity.entityName,
                        timestamp: Date.now(),
                        method,
                        params,
                    }));
                });

                return result;
            } catch (err: any) {
                lastError = err;
                if (attempt < policy.maxRetries) {
                    const delay = policy.backoffStrategy === "EXPONENTIAL"
                        ? policy.retryDelayMs * Math.pow(2, attempt)
                        : policy.retryDelayMs;
                    
                    Logger.log(`[CommComponent:${this.ownerEntity.entityName}] RPC failed (attempt ${attempt + 1}). Retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        throw lastError;
    }

    async _handleRpcRequest(ws: any, msg: any): Promise<void> {
        const { requestId, method, params } = msg;
        const handler = this._wsRpcHandlers.get(method);
        if (!handler) {
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: false,
                error: `Unknown RPC method: ${method}`,
            }));
            return;
        }

        try {
            const result = await handler(params);
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: true,
                result
            }));
        } catch (e: any) {
            let errorMsg = e.message || String(e);
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: false,
                status: "error",
                message: errorMsg,
                error: errorMsg,
                errorDocumentation: e.errorDocumentation || null,
                payload: null,
                ...(e && typeof e === 'object' ? (e.metadata || {}) : {})
            }));
        }
    }

    async _handleIntrospect(ws: any, msg: any): Promise<void> {
        const baseInfo = {
            entity: this.ownerEntity.entityName,
            kind: 'introspect-response',
            methods: Array.from(this._wsRpcHandlers.keys())
        };

        if (this._introspectionProvider) {
            try {
                const extra = await this._introspectionProvider();
                ws.send(JSON.stringify({ ...baseInfo, ...extra }));
            } catch (e: any) {
                ws.send(JSON.stringify({ ...baseInfo, error: `Introspection provider failed: ${e.message}` }));
            }
        } else {
            ws.send(JSON.stringify(baseInfo));
        }
    }

    _handleRpcResponse(msg: any): void {
        const pending = this._wsPendingRpc.get(msg.requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this._wsPendingRpc.delete(msg.requestId);
        pending.ws?.close();

        if (msg.ok) pending.resolve(msg.result);
        else pending.reject(new Error(msg.error || 'RPC error'));
    }

    listRoutes(): any[] {
        return Array.from(this.routes.values()).map(r => ({
            id: r.id,
            sourceEmitter: r.sourceEmitter,
            targetSystem: r.targetSystem,
            targetCollector: r.targetCollector,
            mode: r.mode,
            managedBy: r.managedBy || null,
            externallyMutable: r.externallyMutable !== false,
            metadata: r.metadata || {},
        }));
    }

    disconnectRoute(routeId: string, options: any = {}): void {
        const { requester = null, force = false } = options;
        const route = this.routes.get(routeId);
        if (!route) throw new Error(`[CommComponent] Route not found: ${routeId}`);
        if (!force && route.externallyMutable === false) {
            const manager = route.managedBy || this.ownerEntity.entityName;
            if (requester && requester !== manager) {
                throw new Error(`[CommComponent] Route ${routeId} is immutable for requester ${requester}.`);
            }
        }
        if (route.disconnect) route.disconnect();
        this.routes.delete(routeId);
    }

    dispose(): void {
        for (const [id] of this.routes) {
            try { this.disconnectRoute(id, { force: true }); } catch (_) { }
        }
        if (this._wsServer) {
            this._wsServer.close();
            this._wsServer = null;
        }
        for (const ws of this._wsClients.values()) ws.close();
        this._wsClients.clear();
        this._wsIngress.clear();
        for (const pending of this._wsPendingRpc.values()) {
            clearTimeout(pending.timeoutId);
            pending.reject(new Error('CommComponent disposed'));
        }
        this._wsPendingRpc.clear();
        this._wsRpcHandlers.clear();
        Logger.log(`[CommComponent:${this.ownerEntity.entityName}] Disposed.`);
    }
}
