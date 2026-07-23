/**
 * @file K_LIB_Krnl_System_Comm_Component.ts
 *
 * @description The uniform P2P communication bridge for all Krnl system orchestrators.
 */
import { krnlTransportAdapter } from "./K_LIB_Krnl_Functionality_Types.js";
import { KrnlPolicy } from "./K_LIB_Krnl_Base_Concepts.js";
/**
 * WEBSOCKET TRANSPORT ADAPTER
 * For remote inter-system communication.
 */
export declare class WebSocketTransportAdapter extends krnlTransportAdapter {
    commComponent: krnlSystemCommComponent;
    remoteAddress: string;
    /**
     * @param commComponent - The local system's comm component.
     * @param remoteAddress - "host:port" of the remote system.
     */
    constructor(commComponent: krnlSystemCommComponent, remoteAddress: string);
    call(targetFunction: string, input: any, opts?: any): Promise<any>;
}
export declare class krnlSystemCommComponent {
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
    constructor(ownerEntity: any, listenPort?: number, host?: string);
    /**
     * Binds a local emitter directly to another in-process system's collector.
     */
    wireDirectly(localEmitterName: string, remoteCommComponent: krnlSystemCommComponent, remoteCollectorName: string): any;
    /**
     * Starts a WebSocket server so that remote systems can push data into local collectors.
     */
    startWsServer(externalServer?: any): Promise<void>;
    /**
     * Connects to a remote system's CommComponent WS server.
     */
    wireViaWs(localEmitterName: string, remoteAddress: string, remoteCollectorName: string, remoteSystemName: string, options?: any): Promise<any>;
    /**
     * Registers a WS ingress handler.
     */
    registerWsIngress(routeId: string, localCollectorName: string): void;
    defineRpc(methodName: string, handler: Function): void;
    setIntrospectionProvider(providerFn: () => Promise<any>): void;
    _getWsRpcClient(remoteAddress: string): Promise<any>;
    callWsRpc(remoteAddress: string, method: string, params?: any, policy?: KrnlPolicy): Promise<any>;
    _handleRpcRequest(ws: any, msg: any, callerPort?: number): Promise<void>;
    _handleIntrospect(ws: any, msg: any): Promise<void>;
    _handleRpcResponse(msg: any): void;
    listRoutes(): any[];
    disconnectRoute(routeId: string, options?: any): void;
    dispose(): void;
}
//# sourceMappingURL=K_LIB_Krnl_System_Comm_Component.d.ts.map