import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
import { KrnlIngressNetworkMemberConfig, KrnlFrontendMemberConfig } from "./types.js";
import http from 'http';
export interface IngressMemberEntry {
    entity: krnlSystemEntityBase;
    config: KrnlIngressNetworkMemberConfig | KrnlFrontendMemberConfig;
    addedAt: number;
    memberType?: 'subapp' | 'frontend';
}
export declare class KrnlIngressNetwork {
    members: Map<string, IngressMemberEntry>;
    addMember(admin: krnlSystemEntityBase, config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase>;
    addFrontendMember(admin: krnlSystemEntityBase, config: KrnlFrontendMemberConfig): Promise<krnlSystemEntityBase>;
    removeMember(admin: krnlSystemEntityBase, prefix: string): Promise<boolean>;
    getGrossManifest(adminBaseUrl: string): any;
    getAggregatedMcpTools(): any[];
    routeHttpRequest(prefix: string, req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void>;
}
//# sourceMappingURL=K_LIB_Krnl_System_Ingress_Network.d.ts.map