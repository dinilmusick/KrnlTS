export interface KrnlRegistryApp {
    name: string;
    port: number;
    pid: number;
    registeredAt: string;
}
export declare class KrnlRegistryClient {
    registryPort: number;
    constructor(registryPort?: number);
    private getUrl;
    isRegistryAlive(): Promise<boolean>;
    register(name: string, port: number, pid: number): Promise<boolean>;
    deregister(name: string): Promise<boolean>;
    heartbeat(name: string): Promise<boolean>;
    lookup(name: string): Promise<KrnlRegistryApp | null>;
}
//# sourceMappingURL=K_LIB_Krnl_Registry_Client.d.ts.map