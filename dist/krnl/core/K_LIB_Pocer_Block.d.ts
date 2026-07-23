import http from "node:http";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
export interface PocerBlockConfig {
    image: string;
    containerName: string;
    hostPort: number;
    containerPort: number;
    protocol: "http" | "https";
    environment?: Record<string, string>;
    stopOnDispose?: boolean;
}
export declare class PocerBlock extends krnlSystemEntityBase {
    readonly blockConfig: PocerBlockConfig;
    private _containerReady;
    private _startedByUs;
    private _dockerProvider;
    constructor(name: string, blockConfig: PocerBlockConfig);
    startApp(): Promise<void>;
    proxyRequest(req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void>;
    getManifest(): any;
    dispose(): void;
    private ensureDockerEngine;
    private loadLocalImageArchive;
    private _locateBinary;
    private _isContainerRunning;
    private _containerExists;
    private _waitForPort;
}
//# sourceMappingURL=K_LIB_Pocer_Block.d.ts.map