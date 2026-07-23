//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Comm_Component.ts
 *
 * @description The uniform P2P communication bridge for all Krnl system orchestrators.
 */
import { krnlTransportAdapter } from "./K_LIB_Krnl_Functionality_Types.js";
import { Logger, KrnlPolicy } from "./K_LIB_Krnl_Base_Concepts.js";
import { krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";
import { krnl as krnlProto } from "./krnl_pb.js";
/**
 * WEBSOCKET TRANSPORT ADAPTER
 * For remote inter-system communication.
 */
export class WebSocketTransportAdapter extends krnlTransportAdapter {
    commComponent;
    remoteAddress;
    /**
     * @param commComponent - The local system's comm component.
     * @param remoteAddress - "host:port" of the remote system.
     */
    constructor(commComponent, remoteAddress) {
        super();
        this.commComponent = commComponent;
        this.remoteAddress = remoteAddress;
    }
    async call(targetFunction, input, opts = {}) {
        const policy = opts.policy instanceof KrnlPolicy ? opts.policy : new KrnlPolicy(opts);
        const data = {
            ...input,
            meta: {
                ...(input?.meta || {}),
                accessKey: opts.accessKey
            }
        };
        return await this.commComponent.callWsRpc(this.remoteAddress, 'call', { fid: targetFunction, data }, policy);
    }
}
// ws is loaded lazily
let _WS, _WSServer;
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
    ownerEntity;
    listenPort;
    host;
    routes;
    _routeSeq;
    _wsServer;
    _wsClients;
    _wsIngress;
    _wsPendingRpc;
    _wsRpcHandlers;
    _introspectionProvider;
    /**
     * @param ownerEntity
     * @param listenPort - WS server port (only used in "ws" mode).
     * @param host - Interface to bind to.
     */
    constructor(ownerEntity, listenPort = 10099, host = '0.0.0.0') {
        this.ownerEntity = ownerEntity;
        this.listenPort = listenPort;
        this.host = host;
        this.routes = new Map(); // routeId → KrnlRoute
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
    wireDirectly(localEmitterName, remoteCommComponent, remoteCollectorName) {
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const remoteCollector = remoteCommComponent.ownerEntity.interface.getCollector(remoteCollectorName);
        const unsubscribe = emitter.subscribe((msg) => {
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
        Logger.log(`[CommComponent:${this.ownerEntity.entityName}] DIRECT route created: ` +
            `${localEmitterName} → ${route.targetSystem}.${remoteCollectorName}`);
        return route;
    }
    /**
     * Starts a WebSocket server so that remote systems can push data into local collectors.
     */
    async startWsServer(externalServer = null) {
        if (this._wsServer)
            return;
        const { WebSocketServer } = await _loadWs();
        return new Promise((resolve, reject) => {
            if (externalServer) {
                if (this.ownerEntity.options?.wsPath) {
                    this._wsServer = new WebSocketServer({ noServer: true });
                    externalServer.on('upgrade', (req, socket, head) => {
                        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
                        if (url.pathname === this.ownerEntity.options.wsPath) {
                            this._wsServer.handleUpgrade(req, socket, head, (ws) => {
                                this._wsServer.emit('connection', ws);
                            });
                        }
                    });
                }
                else {
                    this._wsServer = new WebSocketServer({ server: externalServer });
                }
                resolve();
            }
            else {
                this._wsServer = new WebSocketServer({ port: this.listenPort, host: this.host });
                this._wsServer.on('listening', () => {
                    Logger.log(`[CommComponent:${this.ownerEntity.entityName}] WS server listening on :${this.listenPort}`);
                    resolve();
                });
            }
            this._wsServer.on('error', (err) => {
                Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS server error:`, err.message);
                reject(err);
            });
            this._wsServer.on('connection', (ws) => {
                ws.on('error', (err) => {
                    Logger.error(`[CommComponent:${this.ownerEntity.entityName}] Incoming WS error:`, err.message);
                });
                ws.on('message', (raw) => {
                    try {
                        let msg;
                        const rawStr = raw.toString().trim();
                        if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
                            const parsed = JSON.parse(rawStr);
                            msg = {
                                kind: parsed.kind === 'rpc-request' ? krnlProto.MessageKind.RPC_REQUEST :
                                    parsed.kind === 'rpc-response' ? krnlProto.MessageKind.RPC_RESPONSE :
                                        parsed.kind === 'register-ingress' ? krnlProto.MessageKind.REGISTER_INGRESS :
                                            parsed.kind === 'route-data' ? krnlProto.MessageKind.ROUTE_DATA :
                                                parsed.kind === 'introspect' ? krnlProto.MessageKind.INTROSPECT : krnlProto.MessageKind.UNKNOWN,
                                routeId: parsed.routeId || "",
                                requestId: parsed.requestId || "",
                                method: parsed.method || "",
                                collectorName: parsed.collectorName || "",
                                jsonPayload: parsed.params ? JSON.stringify(parsed.params) : (parsed.data ? JSON.stringify(parsed.data) : "")
                            };
                        }
                        else {
                            msg = krnlProto.KrnlMessage.decode(new Uint8Array(raw));
                        }
                        if (msg.kind === krnlProto.MessageKind.REGISTER_INGRESS) {
                            this.registerWsIngress(msg.routeId, msg.collectorName);
                            return;
                        }
                        if (msg.kind === krnlProto.MessageKind.ROUTE_DATA) {
                            const handler = this._wsIngress.get(msg.routeId);
                            if (handler) {
                                const payload = msg.jsonPayload ? JSON.parse(msg.jsonPayload) : undefined;
                                handler(payload);
                            }
                            return;
                        }
                        if (msg.kind === krnlProto.MessageKind.RPC_REQUEST) {
                            const callerPort = ws._socket?.remotePort;
                            this._handleRpcRequest(ws, msg, callerPort);
                            return;
                        }
                        if (msg.kind === krnlProto.MessageKind.RPC_RESPONSE) {
                            this._handleRpcResponse(msg);
                            return;
                        }
                        if (msg.kind === krnlProto.MessageKind.INTROSPECT) {
                            this._handleIntrospect(ws, msg);
                            return;
                        }
                    }
                    catch (e) {
                        Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS message error:`, e.message);
                    }
                });
            });
        });
    }
    /**
     * Connects to a remote system's CommComponent WS server.
     */
    async wireViaWs(localEmitterName, remoteAddress, remoteCollectorName, remoteSystemName, options = {}) {
        const { WebSocket } = await _loadWs();
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const ws = new WebSocket(`ws://${remoteAddress}`);
        const { managedBy = this.ownerEntity.entityName, externallyMutable = true, metadata = {}, } = options;
        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });
        ws.on('error', (err) => {
            Logger.error(`[CommComponent:${this.ownerEntity.entityName}] Outgoing WS error to ${remoteSystemName}:`, err.message);
        });
        this._wsClients.set(remoteSystemName, ws);
        const routeId = `ws_route_${this._routeSeq++}`;
        const regMsg = krnlProto.KrnlMessage.encode({
            kind: krnlProto.MessageKind.REGISTER_INGRESS,
            routeId,
            collectorName: remoteCollectorName,
        }).finish();
        ws.send(regMsg);
        const unsubscribe = emitter.subscribe((msg) => {
            if (ws.readyState === _WS.OPEN) {
                const dataMsg = krnlProto.KrnlMessage.encode({
                    kind: krnlProto.MessageKind.ROUTE_DATA,
                    routeId,
                    jsonPayload: JSON.stringify(msg.data),
                }).finish();
                ws.send(dataMsg);
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
        Logger.log(`[CommComponent:${this.ownerEntity.entityName}] WS route created: ` +
            `${localEmitterName} → ${remoteSystemName}.${remoteCollectorName} @ ${remoteAddress}`);
        return route;
    }
    /**
     * Registers a WS ingress handler.
     */
    registerWsIngress(routeId, localCollectorName) {
        this._wsIngress.set(routeId, (data) => {
            const collector = this.ownerEntity.interface.getCollector(localCollectorName);
            if (collector._directHandler) {
                collector._directHandler({ data });
            }
        });
    }
    defineRpc(methodName, handler) {
        this._wsRpcHandlers.set(methodName, handler);
    }
    setIntrospectionProvider(providerFn) {
        this._introspectionProvider = providerFn;
    }
    async _getWsRpcClient(remoteAddress) {
        const { WebSocket } = await _loadWs();
        let ws = this._wsClients.get(remoteAddress);
        if (ws && (ws.readyState === 1 || ws.readyState === 0)) { // 1 = OPEN, 0 = CONNECTING
            return ws;
        }
        ws = new WebSocket(`ws://${remoteAddress}`);
        this._wsClients.set(remoteAddress, ws);
        ws.on('error', (err) => {
            Logger.error(`[CommComponent:${this.ownerEntity.entityName}] WS error to ${remoteAddress}:`, err.message);
            this._wsClients.delete(remoteAddress);
        });
        ws.on('close', () => {
            this._wsClients.delete(remoteAddress);
        });
        ws.on('message', (raw) => {
            try {
                let msg;
                const rawStr = raw.toString().trim();
                if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
                    const parsed = JSON.parse(rawStr);
                    msg = {
                        kind: parsed.kind === 'rpc-response' ? krnlProto.MessageKind.RPC_RESPONSE : krnlProto.MessageKind.UNKNOWN,
                        requestId: parsed.requestId || "",
                        ok: parsed.ok,
                        error: parsed.error,
                        result: parsed.result
                    };
                }
                else {
                    msg = krnlProto.KrnlMessage.decode(new Uint8Array(raw));
                }
                if (msg.kind === krnlProto.MessageKind.RPC_RESPONSE) {
                    this._handleRpcResponse(msg);
                }
            }
            catch (_) { }
        });
        await new Promise((resolve, reject) => {
            const connTimeout = setTimeout(() => {
                ws.close();
                reject(new Error("ERR_NET_CONNECTION_TIMEOUT"));
            }, 5000);
            ws.once('open', () => {
                clearTimeout(connTimeout);
                resolve(true);
            });
            ws.once('error', (err) => {
                clearTimeout(connTimeout);
                reject(err);
            });
        });
        return ws;
    }
    async callWsRpc(remoteAddress, method, params = {}, policy = KrnlPolicy.default()) {
        let lastError = null;
        for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
            try {
                const requestId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                const ws = await this._getWsRpcClient(remoteAddress);
                const result = await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        this._wsPendingRpc.delete(requestId);
                        reject({ code: krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED, message: "ERR_NET_RPC_TIMEOUT_EXCEEDED" });
                    }, policy.timeoutMs);
                    this._wsPendingRpc.set(requestId, { resolve, reject, timeoutId, ws });
                    const rpcReq = krnlProto.KrnlMessage.encode({
                        kind: krnlProto.MessageKind.RPC_REQUEST,
                        requestId,
                        traceCorrelationId: requestId,
                        originSystemAddress: this.ownerEntity.entityName,
                        timestamp: Date.now(),
                        method,
                        jsonPayload: JSON.stringify(params),
                    }).finish();
                    ws.send(rpcReq);
                });
                return result;
            }
            catch (err) {
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
    async _handleRpcRequest(ws, msg, callerPort) {
        const { requestId, method } = msg;
        const params = msg.jsonPayload ? JSON.parse(msg.jsonPayload) : undefined;
        // Ingress network target routing
        if (params?.target && this.ownerEntity._ingressNetwork) {
            const member = this.ownerEntity._ingressNetwork.members.get(params.target.toLowerCase());
            if (member) {
                const { target, ...memberParams } = params;
                const memberMsg = { ...msg, jsonPayload: JSON.stringify(memberParams) };
                await member.entity.commComponent._handleRpcRequest(ws, memberMsg, callerPort);
                return;
            }
        }
        const handler = this._wsRpcHandlers.get(method);
        if (!handler) {
            const rpcResp = krnlProto.RpcResponse.encode({
                requestId,
                ok: false,
                error: `Unknown RPC method: ${method}`
            }).finish();
            const envelope = krnlProto.KrnlMessage.encode({
                kind: krnlProto.MessageKind.RPC_RESPONSE,
                requestId,
                binaryPayload: rpcResp
            }).finish();
            ws.send(envelope);
            return;
        }
        try {
            const result = await handler(params, { callerPort });
            const rpcResp = krnlProto.RpcResponse.encode({
                requestId,
                ok: true,
                jsonResult: JSON.stringify(result)
            }).finish();
            const envelope = krnlProto.KrnlMessage.encode({
                kind: krnlProto.MessageKind.RPC_RESPONSE,
                requestId,
                binaryPayload: rpcResp
            }).finish();
            ws.send(envelope);
        }
        catch (e) {
            let errorMsg = e.message || String(e);
            const rpcResp = krnlProto.RpcResponse.encode({
                requestId,
                ok: false,
                error: errorMsg,
                errorDocumentation: e.errorDocumentation || ""
            }).finish();
            const envelope = krnlProto.KrnlMessage.encode({
                kind: krnlProto.MessageKind.RPC_RESPONSE,
                requestId,
                binaryPayload: rpcResp
            }).finish();
            ws.send(envelope);
        }
    }
    async _handleIntrospect(ws, msg) {
        const baseInfo = {
            entity: this.ownerEntity.entityName,
            methods: Array.from(this._wsRpcHandlers.keys())
        };
        let finalInfo = baseInfo;
        if (this._introspectionProvider) {
            try {
                const extra = await this._introspectionProvider();
                finalInfo = { ...baseInfo, ...extra };
            }
            catch (e) {
                finalInfo = { ...baseInfo, error: `Introspection provider failed: ${e.message}` };
            }
        }
        const envelope = krnlProto.KrnlMessage.encode({
            kind: krnlProto.MessageKind.INTROSPECT_RESPONSE,
            requestId: msg.requestId,
            jsonPayload: JSON.stringify(finalInfo)
        }).finish();
        ws.send(envelope);
    }
    _handleRpcResponse(msg) {
        let responseMsg = msg;
        if (msg.binaryPayload) {
            try {
                const dec = krnlProto.RpcResponse.decode(msg.binaryPayload);
                responseMsg = {
                    requestId: dec.requestId,
                    ok: dec.ok,
                    error: dec.error,
                    result: dec.jsonResult ? JSON.parse(dec.jsonResult) : undefined,
                    errorDocumentation: dec.errorDocumentation
                };
            }
            catch (e) {
                Logger.error("Failed to decode RpcResponse payload:", e);
            }
        }
        const pending = this._wsPendingRpc.get(responseMsg.requestId);
        if (!pending)
            return;
        clearTimeout(pending.timeoutId);
        this._wsPendingRpc.delete(responseMsg.requestId);
        if (responseMsg.ok)
            pending.resolve(responseMsg.result);
        else
            pending.reject(new Error(responseMsg.error || 'RPC error'));
    }
    listRoutes() {
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
    disconnectRoute(routeId, options = {}) {
        const { requester = null, force = false } = options;
        const route = this.routes.get(routeId);
        if (!route)
            throw new Error(`[CommComponent] Route not found: ${routeId}`);
        if (!force && route.externallyMutable === false) {
            const manager = route.managedBy || this.ownerEntity.entityName;
            if (requester && requester !== manager) {
                throw new Error(`[CommComponent] Route ${routeId} is immutable for requester ${requester}.`);
            }
        }
        if (route.disconnect)
            route.disconnect();
        this.routes.delete(routeId);
    }
    dispose() {
        for (const [id] of this.routes) {
            try {
                this.disconnectRoute(id, { force: true });
            }
            catch (_) { }
        }
        if (this._wsServer) {
            this._wsServer.close();
            this._wsServer = null;
        }
        for (const ws of this._wsClients.values())
            ws.close();
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
//# sourceMappingURL=K_LIB_Krnl_System_Comm_Component.js.map