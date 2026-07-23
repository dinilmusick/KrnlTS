import path from 'path';
export class KrnlIngressNetwork {
    members = new Map();
    async addMember(admin, config) {
        const prefix = config.prefix.toLowerCase();
        if (this.members.has(prefix)) {
            throw new Error(`[IngressNetwork] Prefix '${config.prefix}' is already registered.`);
        }
        // 1. Instantiate the member entity
        let entity;
        if (config.isKrnl === false || !config.ServiceClass) {
            const { KrnlNonKrnlAppAdapter } = await import('./K_LIB_Krnl_System_App_Adapter.js');
            const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || '');
            await adapter.startApp();
            entity = adapter;
        }
        else {
            const ServiceClass = config.ServiceClass;
            const memberPort = config.port ?? -1;
            const args = config.constructorArgs ?? [];
            const { subappLocalStorage } = await import('./K_LIB_Krnl_System_Magnetic_Loader.js');
            const appDir = config.entryPath ? path.dirname(config.entryPath) : '';
            entity = await subappLocalStorage.run({ appPath: appDir }, async () => {
                const ent = new ServiceClass(memberPort, ...args);
                if (ent._magneticLoadPromise) {
                    await ent._magneticLoadPromise;
                }
                return ent;
            });
        }
        // 2. Set internal flags to mark it as ingress member before adding to hierarchy/registering port
        entity._isIngressNetworkMember = true;
        if (typeof entity._resolveReady === 'function') {
            entity._resolveReady();
        }
        // 3. Register in hierarchy for automated shutdown and cleanup
        admin.hierarchyManager.addComponentEntityInstance(entity);
        // 4. Register in port registry with sentinel -1 (in-network)
        await admin.registerPort(prefix, -1);
        // 5. Store in members map
        this.members.set(prefix, {
            entity,
            config,
            addedAt: Date.now(),
            memberType: 'subapp'
        });
        return entity;
    }
    async addFrontendMember(admin, config) {
        const prefix = config.options?.frontendPrefix || 'frontend';
        const key = `${prefix}/${config.name.toLowerCase()}`;
        if (this.members.has(key)) {
            throw new Error(`[IngressNetwork] Frontend member '${config.name}' is already registered.`);
        }
        const options = { ...config.options };
        if (!options.backendPort) {
            options.backendPort = admin.commPort;
        }
        if (!options.backendHost) {
            // Resolve bind-any addresses to 'localhost' — using '::' or '0.0.0.0' directly
            // in a WebSocket URL (e.g. ws://:::10099/ws) produces a malformed URL.
            const rawHost = admin.host;
            options.backendHost = (rawHost === '::' || rawHost === '0.0.0.0' || rawHost === '') ? 'localhost' : rawHost;
        }
        const { KrnlFrontendAdapter } = await import('./K_LIB_Krnl_System_Frontend_Adapter.js');
        const adapter = new KrnlFrontendAdapter(config.name, config.appPath, options);
        await adapter.startApp();
        adapter._isIngressNetworkMember = true;
        if (typeof adapter._resolveReady === 'function') {
            adapter._resolveReady();
        }
        admin.hierarchyManager.addComponentEntityInstance(adapter);
        await admin.registerPort(key, -1);
        this.members.set(key, {
            entity: adapter,
            config,
            addedAt: Date.now(),
            memberType: 'frontend'
        });
        return adapter;
    }
    async removeMember(admin, prefix) {
        const key = prefix.toLowerCase();
        const entry = this.members.get(key);
        if (!entry)
            return false;
        // Remove from port registry
        await admin.unregisterPort(key);
        // Dispose and remove from hierarchy
        admin.hierarchyManager.disposeComponentEntity(entry.entity.id);
        // Remove from map
        this.members.delete(key);
        return true;
    }
    getGrossManifest(adminBaseUrl) {
        const list = Array.from(this.members.entries()).map(([prefix, entry]) => {
            return {
                prefix,
                entityName: entry.entity.entityName,
                manifestEndpoint: `${adminBaseUrl}/${prefix}/manifest`
            };
        });
        return {
            type: "IngressNetworkManifest",
            members: list
        };
    }
    getAggregatedMcpTools() {
        const allTools = [];
        for (const [prefix, entry] of this.members.entries()) {
            const manifest = entry.entity.getManifest();
            const apis = manifest?.inputs?.api || {};
            for (const fid of Object.keys(apis)) {
                const api = apis[fid];
                // Only public functionalities should be exposed as MCP tools
                if (api.visibility === 'public') {
                    // Namespace name as <prefix>.<toolName>
                    const namespacedName = `${prefix}.${fid}`;
                    // Construct the namespaced tool schema
                    allTools.push({
                        name: namespacedName,
                        description: api.description || `MCP Tool for ${entry.entity.entityName} functionality: ${fid}`,
                        inputSchema: api.schema?.input || { type: "object" }
                    });
                }
            }
        }
        return allTools;
    }
    async routeHttpRequest(prefix, req, res, subPath) {
        const entry = this.members.get(prefix.toLowerCase());
        if (!entry) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: "error", message: `Ingress member prefix '${prefix}' not found.` }));
            return;
        }
        // Rewrite request URL to strip the prefix
        const originalUrl = req.url;
        req.url = subPath;
        try {
            // Delegate to the member entity's HTTP adapter
            await entry.entity.unifiedHttpAdapter._handleRequest(req, res);
        }
        finally {
            // Restore URL just in case
            req.url = originalUrl;
        }
    }
}
//# sourceMappingURL=K_LIB_Krnl_System_Ingress_Network.js.map