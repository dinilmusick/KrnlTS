import {
  krnlEntityBase
} from "./chunk-GQT5UY2I.js";

// src/krnl/core/K_LIB_Krnl_Flow.ts
var KrnlFlowBuilder = class _KrnlFlowBuilder {
  entity;
  id;
  steps = [];
  constructor(entity, id) {
    this.entity = entity;
    this.id = id;
  }
  /** Sequential: output of previous step is passed as input to fid */
  then(fid) {
    this.steps.push({ type: "seq", fid });
    return this;
  }
  /** Branch: predicate on current output routes to trueFid or falseFid */
  branch(pred, trueFid, falseFid) {
    this.steps.push({ type: "branch", pred, trueFid, falseFid });
    return this;
  }
  /** Parallel: run all fids concurrently with current input, collect results as array */
  parallel(...fids) {
    this.steps.push({ type: "parallel", fids });
    return this;
  }
  /**
   * Register this flow as a krnlLocalFunctionality on the host entity.
   * The Flow becomes a first-class capability on the entity.
   */
  register(opts) {
    const steps = [...this.steps];
    const entity = this.entity;
    const flowId = this.id;
    return entity.addLocal({
      id: flowId,
      visibility: opts?.visibility ?? "public",
      description: opts?.description || `Flow [${flowId}] composing [${steps.map((s) => s.fid || (s.fids ? s.fids.join(",") : "branch")).join(" \u2192 ")}]`,
      uiSpec: opts?.uiSpec,
      intelligenceSpec: opts?.intelligenceSpec,
      manifest: opts?.manifest,
      api: async (input) => _KrnlFlowBuilder._execute(entity, steps, input)
    });
  }
  /** Execute the flow directly without registering as a functionality */
  async run(input) {
    return _KrnlFlowBuilder._execute(this.entity, this.steps, input);
  }
  /**
   * Internal step executor walking the entity's functionalities via `entity.call(fid, input)`.
   */
  static async _execute(entity, steps, input) {
    let current = input;
    for (const step of steps) {
      if (step.type === "seq") {
        current = await entity.call(step.fid, current);
      } else if (step.type === "branch") {
        const matches = step.pred ? step.pred(current) : Boolean(current);
        const targetFid = matches ? step.trueFid : step.falseFid;
        if (targetFid) {
          current = await entity.call(targetFid, current);
        }
      } else if (step.type === "parallel") {
        const fids = step.fids || [];
        current = await Promise.all(fids.map((fid) => entity.call(fid, current)));
      }
    }
    return current;
  }
};

// src/krnl/core/K_ENT_Entity.ts
var Entity = class _Entity extends krnlEntityBase {
  /** True while this entity occupies root position and actively self-hosts protocol adapters */
  _selfHosting = false;
  /** Protocol adapters attached to this entity. Operational only in root position. */
  _protocolAdapters = /* @__PURE__ */ new Map();
  constructor(name, owner = null, options = {}) {
    super(name, owner, options);
    this.systemType = "Entity";
  }
  // ── Protocol Adapter Management ──────────────────────────────────────────
  /**
   * Attach a protocol adapter to this entity (declarative step during discovery/construction).
   * Does NOT start the server. Servers are started only during `finalize()` if this entity is root.
   */
  attachAdapter(adapter) {
    if (!adapter || !adapter.name) {
      throw new Error(`[Entity:${this.id}] Invalid protocol adapter provided.`);
    }
    this._protocolAdapters.set(adapter.name, adapter);
  }
  /**
   * Return all attached protocol adapters.
   */
  getAdapters() {
    return Array.from(this._protocolAdapters.values());
  }
  // ── Activation / Finalize Lifecycle ──────────────────────────────────────
  /**
   * Finalizes construction and activates the entity if it occupies root position.
   * Called after tree construction and Shell materialization.
   */
  async finalize(options = {}) {
    const hasParent = Boolean(this.hierarchyManager.getOwnerEntity());
    if (!hasParent && this._protocolAdapters.size > 0 && !this._selfHosting) {
      await this._startHosting(options);
    }
  }
  /**
   * Starts all attached protocol adapters.
   */
  async _startHosting(options = {}) {
    if (this._selfHosting) return;
    for (const adapter of this._protocolAdapters.values()) {
      try {
        await adapter.start(this, options);
      } catch (err) {
        console.error(`[Entity:${this.id}] Error starting adapter '${adapter.name}':`, err.message || err);
        throw err;
      }
    }
    this._selfHosting = true;
  }
  /**
   * Stops all self-hosted protocol adapters gracefully.
   */
  async stopHosting() {
    if (!this._selfHosting) return;
    for (const adapter of this._protocolAdapters.values()) {
      try {
        await adapter.stop();
      } catch (err) {
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
  async _onAdoptedByParent() {
    if (this._selfHosting) {
      await this.stopHosting();
    }
  }
  /**
   * Lifecycle hook: called when this entity is detached or promoted to root position.
   * Action: If no parent and adapters exist, activate self-hosting.
   */
  async _onPromotedToRoot(options = {}) {
    const hasParent = Boolean(this.hierarchyManager.getOwnerEntity());
    if (!hasParent && this._protocolAdapters.size > 0 && !this._selfHosting) {
      await this._startHosting(options);
    }
  }
  // ── Capability Surface & Bubbling Integration ────────────────────────────
  /**
   * Overrides component functionality addition to notify active protocol adapters.
   */
  _onComponentFunctionalityAdded(component, functionality) {
    super._onComponentFunctionalityAdded(component, functionality);
    if (this._selfHosting) {
      this._notifyAdaptersOfSurfaceChange();
    }
  }
  /**
   * Notifies all attached protocol adapters that the exposed capability surface has changed.
   * Idempotent: adapters diff and reconcile their route mappings.
   */
  _notifyAdaptersOfSurfaceChange() {
    for (const adapter of this._protocolAdapters.values()) {
      try {
        adapter.onCapabilitySurfaceChanged(this);
      } catch (err) {
        console.warn(`[Entity:${this.id}] Adapter '${adapter.name}' surface change notification error:`, err.message || err);
      }
    }
  }
  // ── Qualified Capability Projections & Resolution ────────────────────────
  /**
   * Computes the hierarchical qualified ID for a local functionality ID.
   * e.g. "Root.OrderService.settings"
   */
  getQualifiedId(fid) {
    const parent = this.hierarchyManager.getOwnerEntity();
    if (parent && typeof parent.getQualifiedId === "function") {
      return `${parent.getQualifiedId(this.id)}.${fid}`;
    }
    return `${this.id}.${fid}`;
  }
  /**
   * Resolves an external qualified capability ID to the owning Entity instance and local fid.
   * The caller/adapter invokes:
   *   const res = root.resolveCapability("Root.OrderService.settings");
   *   return await res.owner.call(res.fid, input);
   */
  resolveCapability(qualifiedId) {
    return this._resolveCapabilityRecursive(qualifiedId);
  }
  _resolveCapabilityRecursive(qualifiedId) {
    for (const [fid, func] of this.localFunctionalities) {
      if (func.visibility === "public" || func.visibility === "protected" || !func.visibility) {
        if (this.getQualifiedId(fid) === qualifiedId || fid === qualifiedId) {
          return { owner: this, fid };
        }
      }
    }
    for (const child of this.hierarchyManager.getAllOwnedComponentEntities()) {
      if (typeof child._resolveCapabilityRecursive === "function") {
        const res = child._resolveCapabilityRecursive(qualifiedId);
        if (res) return res;
      }
    }
    return void 0;
  }
  // ── Manifest Aggregation (Kernel Declares → Shell Materializes) ──────────
  /**
   * Aggregates dependency manifests from all local functionalities and descendant entities.
   * Returns a consolidated workspace requirements document.
   */
  getWorkspaceRequirements() {
    const reqs = {
      dependencies: {},
      devDependencies: {},
      buildRequirements: [],
      resources: [],
      conflicts: []
    };
    this._aggregateManifestInto(reqs);
    return reqs;
  }
  _aggregateManifestInto(reqs) {
    this.localFunctionalities.forEach((func) => {
      if (func.manifest) {
        _Entity._mergeManifestRequirements(reqs, func.manifest, `${this.id}:${func.id}`);
      }
    });
    this.hierarchyManager.getAllOwnedComponentEntities().forEach((child) => {
      if (typeof child._aggregateManifestInto === "function") {
        child._aggregateManifestInto(reqs);
      }
    });
  }
  static _mergeManifestRequirements(target, manifest, sourceId) {
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
  aggregateUI() {
    const list = [];
    this.localFunctionalities.forEach((func, fid) => {
      if (func.uiSpec) {
        list.push({
          qualifiedId: this.getQualifiedId(fid),
          uiSpec: func.uiSpec,
          source: this
        });
      }
    });
    this.hierarchyManager.getAllOwnedComponentEntities().forEach((child) => {
      if (typeof child.aggregateUI === "function") {
        list.push(...child.aggregateUI());
      }
    });
    return list;
  }
  // ── Flow Factory ─────────────────────────────────────────────────────────
  /**
   * Create a FlowBuilder instance bound to this entity.
   */
  flow(id) {
    return new KrnlFlowBuilder(this, id);
  }
  /**
   * Clean disposal of all entity resources, child components, and adapters.
   */
  dispose() {
    if (this._selfHosting) {
      this.stopHosting().catch(() => {
      });
    }
    for (const adapter of this._protocolAdapters.values()) {
      if (typeof adapter.dispose === "function") {
        adapter.dispose();
      }
    }
    this._protocolAdapters.clear();
    super.dispose();
  }
};

export {
  KrnlFlowBuilder,
  Entity
};
