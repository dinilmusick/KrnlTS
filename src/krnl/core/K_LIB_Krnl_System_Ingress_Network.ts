import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
import { KrnlIngressNetworkMemberConfig } from "./types.js";
import http from 'http';

export interface IngressMemberEntry {
  entity: krnlSystemEntityBase;
  config: KrnlIngressNetworkMemberConfig;
  addedAt: number;
}

export class KrnlIngressNetwork {
  members: Map<string, IngressMemberEntry> = new Map();

  async addMember(admin: krnlSystemEntityBase, config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase> {
    const prefix = config.prefix.toLowerCase();
    if (this.members.has(prefix)) {
      throw new Error(`[IngressNetwork] Prefix '${config.prefix}' is already registered.`);
    }

    // 1. Instantiate the member entity
    let entity: krnlSystemEntityBase;
    if (config.isKrnl === false || !config.ServiceClass) {
      const { KrnlNonKrnlAppAdapter } = await import('./K_LIB_Krnl_System_App_Adapter.js');
      const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || '');
      await adapter.startApp();
      entity = adapter;
    } else {
      const ServiceClass = config.ServiceClass;
      const memberPort = config.port ?? -1;
      const args = config.constructorArgs ?? [];
      entity = new ServiceClass(memberPort, ...args);
      if ((entity as any)._magneticLoadPromise) {
        await (entity as any)._magneticLoadPromise;
      }
    }

    // 2. Set internal flags to mark it as ingress member before adding to hierarchy/registering port
    entity._isIngressNetworkMember = true;
    if (typeof (entity as any)._resolveReady === 'function') {
      (entity as any)._resolveReady();
    }

    // 3. Register in hierarchy for automated shutdown and cleanup
    admin.hierarchyManager.addComponentEntityInstance(entity);

    // 4. Register in port registry with sentinel -1 (in-network)
    await admin.registerPort(prefix, -1);

    // 5. Store in members map
    this.members.set(prefix, {
      entity,
      config,
      addedAt: Date.now()
    });

    return entity;
  }

  async removeMember(admin: krnlSystemEntityBase, prefix: string): Promise<boolean> {
    const key = prefix.toLowerCase();
    const entry = this.members.get(key);
    if (!entry) return false;

    // Remove from port registry
    await admin.unregisterPort(key);

    // Dispose and remove from hierarchy
    admin.hierarchyManager.disposeComponentEntity(entry.entity.id);

    // Remove from map
    this.members.delete(key);
    return true;
  }

  getGrossManifest(adminBaseUrl: string): any {
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

  getAggregatedMcpTools(): any[] {
    const allTools: any[] = [];
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

  async routeHttpRequest(prefix: string, req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void> {
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
    } finally {
      // Restore URL just in case
      req.url = originalUrl;
    }
  }
}
