//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Comm_Component.js
 *
 * @description The uniform P2P communication bridge for all Krnl system orchestrators.
 * Every system (Brnda, Qwnsr, Wepr, DummyA, etc.) owns one of these.
 *
 * Responsibilities:
 *  1. Accept "wire" instructions from the Hub: connect one of this system's emitters to a
 *     remote system's collector via a WebSocket channel (or in-process direct binding in tests).
 *  2. Maintain a table of active routes so the Hub can inspect them.
 *
 * Architecture:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │           SystemA                           │
 *   │  interface.emitter("A-Events")              │
 *   │          │                                  │
 *   │   CommComponent ──── ws ──► B.CommComponent │
 *   └─────────────────────────────────────────────┘
 *          ▼ injects into
 *   ┌──────────────────────────────────────────────┐
 *   │           SystemB                            │
 *   │  interface.collector("B-Commands")           │
 *   │          △                                  │
 *   │   CommComponent ─── receives & calls handler │
 *   └──────────────────────────────────────────────┘
 *
 * Two transport modes (both exposed via the same API):
 *   • "direct" — in-process reference wiring (testing / same-process demo).
 *   • "ws"     — WebSocket channel (multi-process / network).
 */

import { krnlEmitter, krnlCollector } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlTransportAdapter } from "./K_LIB_Krnl_Functionality_Types.js";

/**
 * WEBSOCKET TRANSPORT ADAPTER
 * For remote inter-system communication.
 */
export class WebSocketTransportAdapter extends krnlTransportAdapter {
    /**
     * @param {krnlSystemCommComponent} commComponent - The local system's comm component.
     * @param {string} remoteAddress - "host:port" of the remote system.
     */
    constructor(commComponent, remoteAddress) {
        super();
        this.commComponent = commComponent;
        this.remoteAddress = remoteAddress;
    }

    async call(targetFunction, input, opts) {
        return await this.commComponent.callWsRpc(this.remoteAddress, 'call', { fid: targetFunction, data: input }, opts.timeout);
    }
}

// ws is loaded lazily so the CommComponent can be imported in environments where
// the `ws` package is not installed — as long as only 'direct' wiring is used.
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
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// ROUTE ENTRY ////////////////////////////////////////
/**
 * Describes one active route.
 * @typedef {Object} KrnlRoute
 * @property {string} id             - Unique route id.
 * @property {string} sourceEmitter  - Emitter name on the local interface.
 * @property {string} targetSystem   - Remote system name.
 * @property {string} targetCollector - Collector name on the remote interface.
 * @property {"direct"|"ws"} mode   - Transport mode.
 * @property {Function} [disconnect] - Call to tear down this route.
 */

//////////////////////////////////////// KRNL SYSTEM COMM COMPONENT ////////////////////////////////////////
export class krnlSystemCommComponent {
    /**
     * @param {import("../../../entities/krnlEntityBase/K_ENT_Krnl_Entity_Base.js").krnlEntityBase} ownerEntity
     * @param {number} [listenPort=10099] - WS server port (only used in "ws" mode).
     * @param {string} [host='0.0.0.0'] - Interface to bind to.
     */
    constructor(ownerEntity, listenPort = 10099, host = '0.0.0.0') {
        this.ownerEntity = ownerEntity;
        this.listenPort = listenPort;
        this.host = host;
        this.routes = new Map();   // routeId → KrnlRoute
        this._routeSeq = 0;
        this._wsServer = null;        // WebSocketServer instance (if ws mode is active)
        this._wsClients = new Map();   // systemName → WebSocket (outgoing)
        this._wsIngress = new Map();   // routeId → unsubscribe fn
        this._wsPendingRpc = new Map(); // requestId → { resolve, reject, timeoutId }
        this._wsRpcHandlers = new Map(); // method → handler
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// DIRECT (IN-PROCESS) WIRING //////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Binds a local emitter directly to another in-process system's collector.
     * This is the primary method used in same-process tests.
     *
     * @param {string} localEmitterName - Name of the emitter on this entity's interface.
     * @param {object} remoteCommComponent - The target system's CommComponent instance.
     * @param {string} remoteCollectorName - The collector name on the target system's interface.
     * @returns {KrnlRoute} The created route.
     */
    wireDirectly(localEmitterName, remoteCommComponent, remoteCollectorName) {
        const emitter = this.ownerEntity.interface.getEmitter(localEmitterName);
        const remoteCollector = remoteCommComponent.ownerEntity.interface.getCollector(remoteCollectorName);

        // Subscribe the remote collector handler to this emitter
        const unsubscribe = emitter.subscribe((msg) => {
            // Inject the data stream into the remote collector via its internally piped emitter
            // If the collector has a subscriber registered by the remote system, it fires.
            if (remoteCollector.emitter) {
                remoteCollector.emitter.pushDataStreamToEmitter(msg.data);
            }
            // Also call any handlers registered via subscribeTo
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

        console.log(
            `[CommComponent:${this.ownerEntity.entityName}] DIRECT route created: ` +
            `${localEmitterName} → ${route.targetSystem}.${remoteCollectorName}`
        );
        return route;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// WEBSOCKET (NETWORK) WIRING ///////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Starts a WebSocket server so that remote systems can push data into local collectors.
     */
    async startWsServer() {
        if (this._wsServer) return; // Already running
        const { WebSocketServer } = await _loadWs();
        this._wsServer = new WebSocketServer({ port: this.listenPort, host: this.host });

        this._wsServer.on('connection', (ws) => {
            ws.on('error', (err) => {
                console.error(`[CommComponent:${this.ownerEntity.entityName}] Incoming WS error:`, err.message);
            });

            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());

                    // Backward-compatible payload support
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
                    }
                } catch (e) {
                    console.error(`[CommComponent:${this.ownerEntity.entityName}] WS parse error:`, e.message);
                }
            });
        });

        console.log(
            `[CommComponent:${this.ownerEntity.entityName}] WS server listening on :${this.listenPort}`
        );
    }

    /**
     * Connects to a remote system's CommComponent WS server.
     *
     * @param {string} localEmitterName - Local emitter to bridge out.
     * @param {string} remoteAddress - "host:port" of the remote system.
     * @param {string} remoteCollectorName - Collector name at the remote end.
     * @param {string} remoteSystemName - Name of the remote system.
     * @returns {Promise<KrnlRoute>}
     */
    async wireViaWs(localEmitterName, remoteAddress, remoteCollectorName, remoteSystemName, options = {}) {
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

        ws.on('error', (err) => {
            console.error(`[CommComponent:${this.ownerEntity.entityName}] Outgoing WS error to ${remoteSystemName}:`, err.message);
        });

        this._wsClients.set(remoteSystemName, ws);
        const routeId = `ws_route_${this._routeSeq++}`;

        ws.send(JSON.stringify({
            kind: 'register-ingress',
            routeId,
            collectorName: remoteCollectorName,
        }));

        const unsubscribe = emitter.subscribe((msg) => {
            if (ws.readyState === WebSocket.OPEN) {
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

        console.log(
            `[CommComponent:${this.ownerEntity.entityName}] WS route created: ` +
            `${localEmitterName} → ${remoteSystemName}.${remoteCollectorName} @ ${remoteAddress}`
        );
        return route;
    }

    /**
     * Registers a WS ingress handler: data arriving for a specific route is forwarded
     * to a local collector.
     *
     * @param {string} routeId - The route identifier the remote end will include.
     * @param {string} localCollectorName - Collector on this entity's interface.
     */
    registerWsIngress(routeId, localCollectorName) {
        this._wsIngress.set(routeId, (data) => {
            const collector = this.ownerEntity.interface.getCollector(localCollectorName);
            if (collector._directHandler) {
                collector._directHandler({ data });
            }
        });
    }

    /**
     * Wires a remote system's emitter to a local collector.
     * This is used when a remote system initiates the wiring.
     * 
     * @param {string} remoteAddress - "host:port" of the remote system.
     * @param {string} remoteEmitterName - Emitter name at the remote end.
     * @param {string} localCollectorName - Local collector name.
     * @param {string} remoteSystemName - Name of the remote system.
     */
    async wireRemoteEmitterToLocal(remoteAddress, remoteEmitterName, localCollectorName, remoteSystemName) {
        return this.wireViaWs(remoteEmitterName, remoteAddress, localCollectorName, remoteSystemName);
    }

    defineRpc(methodName, handler) {
        this._wsRpcHandlers.set(methodName, handler);
    }

    async callWsRpc(remoteAddress, method, params = {}, timeoutMs = 5000) {
        const { WebSocket } = await _loadWs();
        const requestId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const ws = new WebSocket(`ws://${remoteAddress}`);
        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });

        ws.on('error', (err) => {
            console.error(`[CommComponent:${this.ownerEntity.entityName}] RPC WS error to ${remoteAddress}:`, err.message);
        });

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this._wsPendingRpc.delete(requestId);
                ws.close();
                reject(new Error(`RPC timeout for method ${method}`));
            }, timeoutMs);

            this._wsPendingRpc.set(requestId, { resolve, reject, timeoutId, ws });

            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.kind === 'rpc-response') this._handleRpcResponse(msg);
                } catch (_) { }
            });

            ws.send(JSON.stringify({
                kind: 'rpc-request',
                requestId,
                method,
                params,
            }));
        });
    }

    async _handleRpcRequest(ws, msg) {
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
                result,
            }));
        } catch (e) {
            ws.send(JSON.stringify({
                kind: 'rpc-response',
                requestId,
                ok: false,
                error: e?.message || String(e),
            }));
        }
    }

    _handleRpcResponse(msg) {
        const pending = this._wsPendingRpc.get(msg.requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this._wsPendingRpc.delete(msg.requestId);
        pending.ws?.close();

        if (msg.ok) pending.resolve(msg.result);
        else pending.reject(new Error(msg.error || 'RPC error'));
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// ROUTE MANAGEMENT ////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Returns an array of all active routes (safe serializable snapshot).
     * @returns {KrnlRoute[]}
     */
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

    /**
     * Tears down a route by id.
     * @param {string} routeId
     */
    disconnectRoute(routeId, options = {}) {
        const { requester = null, force = false } = options;
        const route = this.routes.get(routeId);
        if (!route) throw new Error(`[CommComponent] Route not found: ${routeId}`);
        if (!force && route.externallyMutable === false) {
            const manager = route.managedBy || this.ownerEntity.entityName;
            if (requester && requester !== manager) {
                throw new Error(
                    `[CommComponent:${this.ownerEntity.entityName}] Route ${routeId} is immutable for requester ${requester}. Managed by ${manager}.`
                );
            }
        }
        if (route.disconnect) route.disconnect();
        this.routes.delete(routeId);
        console.log(`[CommComponent:${this.ownerEntity.entityName}] Route ${routeId} disconnected.`);
    }

    /**
     * Tears down all routes and closes any WS connections.
     */
    dispose() {
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
            pending.reject(new Error('CommComponent disposed before RPC response'));
        }
        this._wsPendingRpc.clear();
        this._wsRpcHandlers.clear();
        console.log(`[CommComponent:${this.ownerEntity.entityName}] CommComponent disposed.`);
    }
}
