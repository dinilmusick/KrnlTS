import http from 'http';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
export declare class KrnlNonKrnlAppAdapter extends krnlSystemEntityBase {
    childProcess: any;
    appPort: number;
    appPath: string;
    constructor(name: string, appPath: string);
    startApp(): Promise<void>;
    proxyRequest(req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=K_LIB_Krnl_System_App_Adapter.d.ts.map