import { krnlSystemEntityBase } from "../../../dist/index.js";

export class AccessControlSystem extends krnlSystemEntityBase {
    constructor(port = 10200) {
        super("AccessControlSystem", null, port);
        
        // 1. Registered internal services (Logical ports)
        this.registerPort('internal-svc-1', 3001);
        this.registerPort('internal-svc-2', 3002);
        
        // 2. Internal Endpoint (Only allowed for 3001, 3002)
        this.addInternalEndpoint({ id: 'internal', api: async () => 'internal-ok' });
        
        // 3. Free Endpoint (Allowed for all)
        this.addExternalEndpoint({ id: 'free', api: async () => 'free-ok' }, 'free');
        
        // 4. Keyed Endpoint (Need key, allowed for all)
        this.addExternalEndpoint({ id: 'keyed', api: async () => 'keyed-ok' }, 'keyed', 'my-secret-key');
        
        // 5. Manual Policies
        // Allowed: 8001, 8002
        // Keyed: 4001, 4002
        // Forbidden: 9991, 9992
        // Default: forbid_unlisted
        this.addLocal({
            id: 'mixed',
            accessPolicy: {
                allow: [8001, 8002],
                allow_with_key: [4001, 4002],
                forbid: [9991, 9992],
                default_connection_behaviour: 'forbid_unlisted',
            },
            accessKey: 'mixed-secret',
            api: async () => 'mixed-ok'
        });

        // 6. Unlisted (default allow_unlisted)
        this.addLocal({
            id: 'unlisted-allowed',
            accessPolicy: {
                allow: [], allow_with_key: [], forbid: [],
                default_connection_behaviour: 'allow_unlisted',
            },
            api: async () => 'unlisted-ok'
        });
    }
}
