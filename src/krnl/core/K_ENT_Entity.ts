/**
 * @file K_ENT_Entity.ts
 * @description The unified Entity class representing the core composition & orchestration primitive.
 *
 * Governing Principles:
 * 1. The entity tree IS the kernel. UI aggregation, capability exposure, manifests, protocols, and flows are projections or behaviors of that tree.
 * 2. Filesystem is composition: functionalities/, entities/, protocol_adapters/.
 * 3. Functionality is the atomic unit owning logic, state, helpers, events, UI spec, AI spec, and manifest.
 * 4. Entity is composition + orchestration.
 * 5. Root is a runtime position, not a class distinction:
 *    - No parent + attached protocol adapters → ROOT position (adapters active, self-hosts).
 *    - Has parent → CHILD position (adapters dormant, capabilities bubble up).
 */

import { krnlEntityBase } from "./K_ENT_Krnl_Entity_Base.js";
import type { KrnlProtocolAdapter, KrnlCapabilityResolution } from "./K_LIB_Krnl_Protocol_Adapter.js";
import type { KrnlFunctionalityManifest, KrnlWorkspaceRequirements } from "./K_LIB_Krnl_Functionality_Types.js";
import { KrnlFlowBuilder } from "./K_LIB_Krnl_Flow.js";

export class Entity extends krnlEntityBase {
  /** True while this entity occupies root position and actively self-hosts protocol adapters */
  _selfHosting: boolean = false;

  /** Protocol adapters attached to this entity. Operational only in root position. */
  _protocolAdapters: Map<string, KrnlProtocolAdapter> = new Map();

  /** Reservation state for access control and mutual exclusion */
  reservation: {
    busy: boolean;
    reservedBy: string | null;
    reservedAt: number | null;
  } = {
    busy: false,
    reservedBy: null,
    reservedAt: null,
  };

  /** Discoverability state for network beacons / registries */
  discoverable: boolean = true;

  constructor(name: string, owner: krnlEntityBase | null = null, options: any = {}) {
    super(name, owner, options);
    this.systemType = "Entity";
  }

  /**
   * System flags representing discoverability and reservation status.
   */
  getSystemFlags() {
    return {
      discoverable: this.discoverable,
      busy: this.reservation.busy,
      reservedBy: this.reservation.reservedBy,
      reservedAt: this.reservation.reservedAt,
    };
  }

  /**
   * Set discoverability status.
   */
  setDiscoverable(value: boolean) {
    this.discoverable = Boolean(value);
    return this.getSystemFlags();
  }

  /**
   * Reserve this entity for exclusive access by serviceName.
   */
  reserveFor(serviceName: string = 'unknown') {
    this.reservation = {
      busy: true,
      reservedBy: serviceName,
      reservedAt: Date.now(),
    };
    return this.getSystemFlags();
  }

  /**
   * Release reservation held by serviceName.
   */
  releaseReservation(serviceName: string | null = null) {
    if (serviceName && this.reservation.reservedBy && this.reservation.reservedBy !== serviceName) {
      throw new Error(
        `[${this.entityName}] Reservation owned by ${this.reservation.reservedBy}; cannot release as ${serviceName}.`
      );
    }
    this.reservation = {
      busy: false,
      reservedBy: null,
      reservedAt: null,
    };
    return this.getSystemFlags();
  }

  /**
   * Guard checking if entity is available for remote caller.
   */
  _assertAvailableForRemoteAccess(requester: string | null = null) {
    if (!this.reservation.busy) return;
    if (requester && requester === this.reservation.reservedBy) return;
    const by = this.reservation.reservedBy || 'another service';
    throw new Error(`[${this.entityName}] Entity is busy/reserved by ${by}.`);
  }

  /**
   * Get dynamic manifest of all capabilities, flags, and endpoints.
   */
  getManifest(): any {
    const apiNames: string[] = [];
    const eventsNames: string[] = [];
    const api: any = {};

    for (const [id, f] of this.localFunctionalities) {
      apiNames.push(id);
      api[id] = {
        id,
        type: 'local',
        visibility: f.visibility || 'public',
        manifest: f.manifest || null,
        schema: (f as any).schema || null,
      };
    }

    for (const [id, f] of this.remoteFunctionalities) {
      apiNames.push(id);
      api[id] = {
        id,
        type: 'remote',
        visibility: f.visibility || 'public',
        schema: (f as any).schema || null,
      };
    }

    return {
      entity: this.entityName,
      entityName: this.entityName,
      type: this.systemType,
      flags: this.getSystemFlags(),
      apiNames,
      eventsNames,
      api,
      inputs: {
        api,
      },
    };
  }

  /**
   * Generates a structured 404 response payload for unmatched routes.
   */
  getNotFoundResponse(reqPath: string) {
    return {
      status: "error",
      message: `Route not found: ${reqPath}`,
      entity: this.entityName,
      availableRoutes: [
        "/call/:fid",
        "/mcp",
        "/acp",
        "/manifest",
        "/health",
        "/events/:fid"
      ]
    };
  }

  // ── Protocol Adapter Management ──────────────────────────────────────────

  /**
   * Attach a protocol adapter to this entity (declarative step during discovery/construction).
   * Does NOT start the server. Servers are started only during `finalize()` if this entity is root.
   */
  attachAdapter(adapter: KrnlProtocolAdapter): void {
    if (!adapter || !adapter.name) {
      throw new Error(`[Entity:${this.id}] Invalid protocol adapter provided.`);
    }
    this._protocolAdapters.set(adapter.name, adapter);
  }

  /**
   * Return all attached protocol adapters.
   */
  getAdapters(): KrnlProtocolAdapter[] {
    return Array.from(this._protocolAdapters.values());
  }

  /**
   * Get a specific protocol adapter by name (e.g. 'https', 'wss').
   */
  getAdapter<T = KrnlProtocolAdapter>(name: string): T | undefined {
    return this._protocolAdapters.get(name) as T | undefined;
  }

  /**
   * Access the WebSocket commComponent adapter if attached.
   */
  get commComponent(): any | undefined {
    return this._protocolAdapters.get('wss');
  }

  /**
   * Access the Unified HTTP adapter if attached.
   */
  get unifiedHttpAdapter(): any | undefined {
    return this._protocolAdapters.get('https');
  }

  /**
   * Port of active listening adapter.
   */
  get commPort(): number {
    const http = this._protocolAdapters.get('https') as any;
    if (http && typeof http.port === 'number') return http.port;
    const wss = this._protocolAdapters.get('wss') as any;
    if (wss && typeof wss.listenPort === 'number') return wss.listenPort;
    return 10099;
  }

  // ── Activation / Finalize Lifecycle ──────────────────────────────────────

  /**
   * Finalizes construction and activates the entity if it occupies root position.
   * Called after tree construction and Shell materialization.
   */
  async finalize(options: any = {}): Promise<void> {
    const hasParent = Boolean(this.hierarchyManager.getOwnerEntity());
    if (!hasParent && this._protocolAdapters.size > 0 && !this._selfHosting) {
      await this._startHosting(options);
    }
  }

  /**
   * Starts all attached protocol adapters.
   */
  async _startHosting(options: any = {}): Promise<void> {
    if (this._selfHosting) return;
    for (const adapter of this._protocolAdapters.values()) {
      try {
        await adapter.start(this, options);
      } catch (err: any) {
        console.error(`[Entity:${this.id}] Error starting adapter '${adapter.name}':`, err.message || err);
        throw err;
      }
    }
    this._selfHosting = true;
  }

  /**
   * Stops all self-hosted protocol adapters gracefully.
   */
  async stopHosting(): Promise<void> {
    if (!this._selfHosting) return;
    for (const adapter of this._protocolAdapters.values()) {
      try {
        await adapter.stop();
      } catch (err: any) {
        console.warn(`[Entity:${this.id}] Warning stopping adapter '${adapter.name}':`, err.message || err);
      }
    }
    this._selfHosting = false;
  }

  // ── Root / Child Bidirectional State Machine ─────────────────────────────

  /**
   * Lifecycle hook: called when this entity is adopted as a child component by a parent entity.
   * Action: Relinquish root position duties by stopping any self-hosted servers.
   * Note: Capability bubbling is handled automatically by the hierarchy manager.
   */
  async _onAdoptedByParent(): Promise<void> {
    if (this._selfHosting) {
      this._selfHosting = false;
      await this.stopHosting();
    }
  }

  /**
   * Lifecycle hook: called when this entity is detached or promoted to root position.
   * Action: If no parent and adapters exist, activate self-hosting.
   */
  async _onPromotedToRoot(options: any = {}): Promise<void> {
    const hasParent = Boolean(this.hierarchyManager.getOwnerEntity());
    if (!hasParent && this._protocolAdapters.size > 0 && !this._selfHosting) {
      await this._startHosting(options);
    }
  }

  // ── Capability Surface & Bubbling Integration ────────────────────────────

  /**
   * Overrides component functionality addition to notify active protocol adapters.
   */
  _onComponentFunctionalityAdded(component: any, functionality: any): void {
    super._onComponentFunctionalityAdded(component, functionality);
    if (this._selfHosting) {
      this._notifyAdaptersOfSurfaceChange();
    }
  }

  /**
   * Notifies all attached protocol adapters that the exposed capability surface has changed.
   * Idempotent: adapters diff and reconcile their route mappings.
   */
  _notifyAdaptersOfSurfaceChange(): void {
    for (const adapter of this._protocolAdapters.values()) {
      try {
        adapter.onCapabilitySurfaceChanged(this);
      } catch (err: any) {
        console.warn(`[Entity:${this.id}] Adapter '${adapter.name}' surface change notification error:`, err.message || err);
      }
    }
  }

  // ── Qualified Capability Projections & Resolution ────────────────────────

  /**
   * Computes the hierarchical qualified ID for a local functionality ID.
   * e.g. "Root.OrderService.settings"
   */
  getQualifiedId(fid: string): string {
    const parent = this.hierarchyManager.getOwnerEntity();
    if (parent && typeof (parent as any).getQualifiedId === 'function') {
      return `${(parent as any).getQualifiedId(this.id)}.${fid}`;
    }
    return `${this.id}.${fid}`;
  }

  /**
   * Resolves an external qualified capability ID to the owning Entity instance and local fid.
   * The caller/adapter invokes:
   *   const res = root.resolveCapability("Root.OrderService.settings");
   *   return await res.owner.call(res.fid, input);
   */
  resolveCapability(qualifiedId: string): KrnlCapabilityResolution | undefined {
    return this._resolveCapabilityRecursive(qualifiedId);
  }

  private _resolveCapabilityRecursive(qualifiedId: string): KrnlCapabilityResolution | undefined {
    // 1. Check local functionalities on this entity
    for (const [fid, func] of this.localFunctionalities) {
      if (func.visibility === 'public' || func.visibility === 'protected' || !func.visibility) {
        if (this.getQualifiedId(fid) === qualifiedId || fid === qualifiedId) {
          return { owner: this, fid };
        }
      }
    }

    // 2. Check child entities recursively
    for (const child of this.hierarchyManager.getAllOwnedComponentEntities()) {
      if (typeof (child as any)._resolveCapabilityRecursive === 'function') {
        const res = (child as any)._resolveCapabilityRecursive(qualifiedId);
        if (res) return res;
      }
    }

    return undefined;
  }

  // ── Manifest Aggregation (Kernel Declares → Shell Materializes) ──────────

  /**
   * Aggregates dependency manifests from all local functionalities and descendant entities.
   * Returns a consolidated workspace requirements document.
   */
  getWorkspaceRequirements(): KrnlWorkspaceRequirements {
    const reqs: KrnlWorkspaceRequirements = {
      dependencies: {},
      devDependencies: {},
      buildRequirements: [],
      resources: [],
      conflicts: []
    };
    this._aggregateManifestInto(reqs);
    return reqs;
  }

  private _aggregateManifestInto(reqs: KrnlWorkspaceRequirements): void {
    // 1. Own local functionalities
    this.localFunctionalities.forEach((func: any) => {
      if (func.manifest) {
        Entity._mergeManifestRequirements(reqs, func.manifest, `${this.id}:${func.id}`);
      }
    });

    // 2. Child entities (recursive)
    this.hierarchyManager.getAllOwnedComponentEntities().forEach((child: any) => {
      if (typeof child._aggregateManifestInto === 'function') {
        child._aggregateManifestInto(reqs);
      }
    });
  }

  private static _mergeManifestRequirements(
    target: KrnlWorkspaceRequirements,
    manifest: KrnlFunctionalityManifest,
    sourceId: string
  ): void {
    if (manifest.dependencies) {
      for (const [pkg, ver] of Object.entries(manifest.dependencies)) {
        if (target.dependencies[pkg] && target.dependencies[pkg] !== ver) {
          target.conflicts = target.conflicts || [];
          target.conflicts.push({
            package: pkg,
            versionA: target.dependencies[pkg],
            versionB: ver,
            sources: [sourceId]
          });
        } else {
          target.dependencies[pkg] = ver;
        }
      }
    }

    if (manifest.devDependencies) {
      for (const [pkg, ver] of Object.entries(manifest.devDependencies)) {
        target.devDependencies[pkg] = ver;
      }
    }

    if (manifest.buildRequirements) {
      for (const req of manifest.buildRequirements) {
        if (!target.buildRequirements.includes(req)) {
          target.buildRequirements.push(req);
        }
      }
    }

    if (manifest.resources) {
      for (const res of manifest.resources) {
        target.resources.push(res);
      }
    }
  }

  // ── UI Spec Recursive Aggregation ────────────────────────────────────────

  /**
   * Aggregates UI specifications from all functionalities across the entity tree.
   * Qualified IDs ensure namespace stability and avoid collisions.
   */
  aggregateUI(): Array<{ qualifiedId: string; uiSpec: any; source: Entity }> {
    const list: Array<{ qualifiedId: string; uiSpec: any; source: Entity }> = [];

    this.localFunctionalities.forEach((func: any, fid: string) => {
      if (func.uiSpec) {
        list.push({
          qualifiedId: this.getQualifiedId(fid),
          uiSpec: func.uiSpec,
          source: this
        });
      }
    });

    this.hierarchyManager.getAllOwnedComponentEntities().forEach((child: any) => {
      if (typeof (child as any).aggregateUI === 'function') {
        list.push(...(child as any).aggregateUI());
      }
    });

    return list;
  }

  // ── Flow Factory ─────────────────────────────────────────────────────────

  /**
   * Create a FlowBuilder instance bound to this entity.
   */
  flow(id: string): KrnlFlowBuilder {
    return new KrnlFlowBuilder(this, id);
  }

  /**
   * Clean disposal of all entity resources, child components, and adapters.
   */
  dispose(): void {
    if (this._selfHosting) {
      this.stopHosting().catch(() => {});
    }
    for (const adapter of this._protocolAdapters.values()) {
      if (typeof adapter.dispose === 'function') {
        adapter.dispose();
      }
    }
    this._protocolAdapters.clear();
    super.dispose();
  }
}
