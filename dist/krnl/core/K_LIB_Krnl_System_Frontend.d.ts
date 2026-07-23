import http from 'http';
import { KrnlFrontendOptions } from './types.js';
export declare class KrnlFrontend {
    system: any;
    options: KrnlFrontendOptions;
    interactionsHistory: any[];
    constructor(system: any, options?: KrnlFrontendOptions);
    handleRequest(req: http.IncomingMessage, res: http.ServerResponse, subpath: string): Promise<void>;
    _readJsonBody(req: http.IncomingMessage): Promise<any>;
    _generatePageHtml(): string;
}
//# sourceMappingURL=K_LIB_Krnl_System_Frontend.d.ts.map