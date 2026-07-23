import http from 'http';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
import { KrnlCustomFrontendOptions } from './types.js';
export declare class KrnlFrontendAdapter extends krnlSystemEntityBase {
    childProcess: any;
    appPort: number;
    socketPath: string | null;
    appPath: string;
    options: KrnlCustomFrontendOptions;
    originalConfigName: string | null;
    patchedConfigName: string | null;
    registeredRoutes: Set<string>;
    routeWatcher: any;
    constructor(name: string, appPath: string, options?: KrnlCustomFrontendOptions);
    loadBridgesFromFolder(folderPath: string): Promise<void>;
    scanAndRegisterApiRoutes(): Promise<void>;
    _findPagesRoutes(dir: string, baseDir: string, routes: string[]): void;
    _findAppRoutes(dir: string, baseDir: string, routes: string[]): void;
    setupApiRouteWatcher(): void;
    startApp(): Promise<void>;
    _patchNextConfig(basePath: string, isEsm: boolean): Promise<void>;
    _restoreNextConfig(): void;
    proxyRequest(req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=K_LIB_Krnl_System_Frontend_Adapter.d.ts.map