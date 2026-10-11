//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_System_Ingress_Network.ts
 *
 * SIBLING NETWORK — for connecting INDEPENDENT, STANDALONE KrnlTS applications that each
 * run with their own networking stack (HTTP / WebSocket / WebSocket-RPC).
 *
 * ⚠ DO NOT USE FOR SUB-APPS.
 *
 * Sub-apps embedded inside a parent application are managed entirely by:
 *   - entity.loadSubApps()           → loads sub-apps into _subAppRegistry
 *   - entity.callInternal()          → dispatches calls without any networking
 *   - K_LIB_Krnl_SubApp_Registry.ts → KrnlSubAppLoader (local mode)
 *   - K_LIB_Krnl_SubApp_Worker_Host.ts → KrnlSubAppWorkerHost (worker mode)
 *
 * Sub-apps communicate via:
 *   - Local mode:  direct in-process method call (zero networking overhead)
 *   - Worker mode: worker_threads MessagePort IPC (no HTTP · no TCP · no WebSocket)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The SIBLING NETWORK is for a FUTURE use-case (not currently used by default):
 * multiple independent KrnlTS application instances that form a peer/gateway cluster,
 * each exposing its own HTTP/WS server. For example, a load balancer or API gateway
 * that routes requests across independently deployed KrnlTS services.
 *
 * When you need this, call:
 *   await entity.startSiblingNetwork(siblingConfigs);
 *   // or the deprecated alias:
 *   await entity.startIngressNetwork(siblingConfigs);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
import { KrnlIngressNetworkMemberConfig } from "./types.js";
import http from 'http';
import path from 'path';

/**
 * SiblingMemberEntry
 *
 * A single entry in the KrnlSiblingNetwork members map.
 * All members are standalone KrnlTS apps or frontend adapters — NOT embedded sub-apps.
 */
export interface SiblingMemberEntry {
  entity:      any;
  config:      KrnlIngressNetworkMemberConfig;
  addedAt:     number;
  memberType?: 'sibling';
}

/** @deprecated Use SiblingMemberEntry. Alias for backward compatibility. */
export type IngressMemberEntry = SiblingMemberEntry;

/**
 * KrnlSiblingNetwork
 *
 * Manages a set of independent standalone KrnlTS applications (siblings) behind a
 * shared HTTP/WS gateway. Each sibling has its own networking stack.
 *
 * ⚠ This class is NOT for embedding sub-apps inside a parent entity.
 *   Use entity.loadSubApps() + entity.callInternal() for that purpose.
 */
export class KrnlSiblingNetwork {
  members: Map<string, SiblingMemberEntry> = new Map();

  /**
   * addMember — adds a standalone sibling KrnlTS application to the peer network.
   *
   * The sibling is instantiated and its port is registered in the admin's port registry.
   * Unlike sub-apps, siblings start their own networking and are independently addressable.
   *
   * ⚠ Do not call this for sub-apps. Use entity.loadSubApps() instead.
   */
  async addMember(admin: krnlSystemEntityBase, config: KrnlIngressNetworkMemberConfig): Promise<krnlSystemEntityBase> {
    const prefix = config.prefix.toLowerCase();
    if (this.members.has(prefix)) {
      console.log(`[SiblingNetwork] Member prefix '${prefix}' already registered. Returning existing entity.`);
      return this.members.get(prefix)!.entity;
    }

    // 1. Instantiate the sibling entity
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
      const { subappLocalStorage } = await import('./K_LIB_Krnl_System_Magnetic_Loader.js');
      const appDir = config.entryPath ? path.dirname(config.entryPath) : '';
      entity = await subappLocalStorage.run({ appPath: appDir }, async () => {
        const ent = new ServiceClass(memberPort, ...args);
        if ((ent as any)._magneticLoadPromise) {
          await (ent as any)._magneticLoadPromise;
        }
        return ent;
      });
    }

    // 2. Mark as sibling network member (distinct from _isSubApp)
    entity._isIngressNetworkMember = true;
    if (typeof (entity as any)._resolveReady === 'function') {
      (entity as any)._resolveReady();
    }

    // 3. Register in hierarchy for lifecycle management (shutdown, etc.)
    admin.hierarchyManager.addComponentEntityInstance(entity);

    // 4. Register port (-1 sentinel = in-network, not directly addressable)
    await admin.registerPort(prefix, -1);

    // 5. Store in members map
    this.members.set(prefix, {
      entity,
      config,
      addedAt:    Date.now(),
      memberType: 'sibling'
    });

    return entity;
  }



  /**
   * removeMember — removes a sibling from the peer network.
   */
  async removeMember(admin: krnlSystemEntityBase, prefix: string): Promise<boolean> {
    const key = prefix.toLowerCase();
    const entry = this.members.get(key);
    if (!entry) return false;

    await admin.unregisterPort(key);
    admin.hierarchyManager.disposeComponentEntity(entry.entity.id);
    this.members.delete(key);
    return true;
  }

  /**
   * getGrossManifest — returns a listing of all siblings and their manifest endpoints.
   */
  getGrossManifest(adminBaseUrl: string): any {
    const list = Array.from(this.members.entries()).map(([prefix, entry]) => ({
      prefix,
      entityName:       entry.entity.entityName,
      manifestEndpoint: `${adminBaseUrl}/${prefix}/manifest`
    }));
    return {
      type:    'SiblingNetworkManifest',
      members: list
    };
  }

  /**
   * getAggregatedMcpTools — collects public MCP tool definitions from all siblings.
   */
  getAggregatedMcpTools(): any[] {
    const allTools: any[] = [];
    for (const [prefix, entry] of this.members.entries()) {
      const manifest = entry.entity.getManifest();
      const apis = manifest?.inputs?.api || {};
      for (const fid of Object.keys(apis)) {
        const api = apis[fid];
        if (api.visibility === 'public') {
          allTools.push({
            name:        `${prefix}.${fid}`,
            description: api.description || `MCP Tool for ${entry.entity.entityName} functionality: ${fid}`,
            inputSchema: api.schema?.input || { type: 'object' }
          });
        }
      }
    }
    return allTools;
  }

  /**
   * routeHttpRequest — routes an incoming HTTP request to the correct sibling's handler.
   * The sibling's own unifiedHttpAdapter handles the request in-process.
   */
  async routeHttpRequest(prefix: string, req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void> {
    const entry = this.members.get(prefix.toLowerCase());
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: `Sibling network member '${prefix}' not found.` }));
      return;
    }

    const originalUrl = req.url;
    req.url = subPath;
    try {
      await entry.entity.unifiedHttpAdapter._handleRequest(req, res);
    } finally {
      req.url = originalUrl;
    }
  }
}

/**
 * @deprecated Use KrnlSiblingNetwork. Alias for backward compatibility.
 */
export const KrnlIngressNetwork = KrnlSiblingNetwork;
export type  KrnlIngressNetwork = KrnlSiblingNetwork;
