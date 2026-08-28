import {
  krnlEntityBase,
  krnlLocalFunctionality
} from "./chunk-XSCKNRCZ.js";
import {
  ObjectKit
} from "./chunk-MLVWARD4.js";
import {
  KrnlSubAppDiscovery,
  KrnlSubAppLifecycle,
  KrnlSubAppValidator
} from "./chunk-OEINUDSE.js";

// src/core/K_LIB_Krnl_Flow.ts
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

// src/core/K_ENT_Entity.ts
var Entity = class _Entity extends krnlEntityBase {
  /** Strongly-typed reactive entity state */
  state;
  /** True while this entity occupies root position and actively self-hosts protocol adapters */
  _selfHosting = false;
  /** Protocol adapters attached to this entity. Operational only in root position. */
  _protocolAdapters = /* @__PURE__ */ new Map();
  /** Sub-Apps registered directly under this entity */
  _subApps = /* @__PURE__ */ new Map();
  /** Reservation state for access control and mutual exclusion */
  reservation = {
    busy: false,
    reservedBy: null,
    reservedAt: null
  };
  /** Discoverability state for network beacons / registries */
  discoverable = true;
  constructor(name, owner = null, options = {}) {
    super(name, owner, options);
    this.systemType = "Entity";
    this.state = options.initialState ?? {};
  }
  /**
   * Get an immutable, read-only snapshot of current entity state.
   */
  getState() {
    return Object.freeze(ObjectKit.deepClone(this.state));
  }
  /**
   * Mutates the entity state via deep-merge and emits a reactive state:changed event.
   */
  setState(mutation) {
    this.state = ObjectKit.deepMerge(this.state, mutation);
    this.emit("state:changed", {
      entity: this.entityName,
      delta: mutation,
      state: this.getState()
    });
  }
  /**
   * Resets entity state to a new or initial baseline.
   */
  resetState(newState) {
    this.state = newState ?? {};
    this.emit("state:reset", {
      entity: this.entityName,
      state: this.getState()
    });
  }
  /** Private cache mapping event names to krnlEmitters */
  _eventEmitterMap = /* @__PURE__ */ new Map();
  /**
   * Subscribes a listener to a domain event on this entity.
   */
  on(event, handler) {
    let emitter = this._eventEmitterMap.get(event);
    if (!emitter) {
      emitter = this.interface.createEmitter(event);
      this._eventEmitterMap.set(event, emitter);
    }
    return emitter.subscribe((msg) => handler(msg.data));
  }
  /**
   * Emits an event with a data payload to all subscribers.
   */
  emit(event, payload) {
    let emitter = this._eventEmitterMap.get(event);
    if (!emitter) {
      emitter = this.interface.createEmitter(event);
      this._eventEmitterMap.set(event, emitter);
    }
    emitter.pushDataStreamToEmitter(payload);
  }
  /**
   * Dispatches a strongly-typed domain event.
   */
  emitEvent(event, payload) {
    this.emit(String(event), payload);
  }
  /**
   * System flags representing discoverability and reservation status.
   */
  getSystemFlags() {
    return {
      discoverable: this.discoverable,
      busy: this.reservation.busy,
      reservedBy: this.reservation.reservedBy,
      reservedAt: this.reservation.reservedAt
    };
  }
  /**
   * Set discoverability status.
   */
  setDiscoverable(value) {
    this.discoverable = Boolean(value);
    return this.getSystemFlags();
  }
  /**
   * Reserve this entity for exclusive access by serviceName.
   */
  reserveFor(serviceName = "unknown") {
    this.reservation = {
      busy: true,
      reservedBy: serviceName,
      reservedAt: Date.now()
    };
    return this.getSystemFlags();
  }
  /**
   * Release reservation held by serviceName.
   */
  releaseReservation(serviceName = null) {
    if (serviceName && this.reservation.reservedBy && this.reservation.reservedBy !== serviceName) {
      throw new Error(
        `[${this.entityName}] Reservation owned by ${this.reservation.reservedBy}; cannot release as ${serviceName}.`
      );
    }
    this.reservation = {
      busy: false,
      reservedBy: null,
      reservedAt: null
    };
    return this.getSystemFlags();
  }
  /**
   * Guard checking if entity is available for remote caller.
   */
  _assertAvailableForRemoteAccess(requester = null) {
    if (!this.reservation.busy) return;
    if (requester && requester === this.reservation.reservedBy) return;
    const by = this.reservation.reservedBy || "another service";
    throw new Error(`[${this.entityName}] Entity is busy/reserved by ${by}.`);
  }
  /**
   * Get dynamic manifest of all capabilities, flags, and endpoints.
   */
  getManifest() {
    const apiNames = [];
    const eventsNames = [];
    const api = {};
    for (const [id, f] of this.localFunctionalities) {
      apiNames.push(id);
      api[id] = {
        id,
        type: "local",
        visibility: f.visibility || "public",
        manifest: f.manifest || null,
        schema: f.schema || null
      };
    }
    for (const [id, f] of this.remoteFunctionalities) {
      apiNames.push(id);
      api[id] = {
        id,
        type: "remote",
        visibility: f.visibility || "public",
        schema: f.schema || null
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
        api
      }
    };
  }
  /**
   * Generates a structured 404 response payload for unmatched routes.
   */
  getNotFoundResponse(reqPath) {
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
  /**
   * Get a specific protocol adapter by name (e.g. 'https', 'wss').
   */
  getAdapter(name) {
    return this._protocolAdapters.get(name);
  }
  /**
   * Access the WebSocket commComponent adapter if attached.
   */
  get commComponent() {
    return this._protocolAdapters.get("wss");
  }
  /**
   * Access the Unified HTTP adapter if attached.
   */
  get unifiedHttpAdapter() {
    return this._protocolAdapters.get("https");
  }
  /**
   * Port of active listening adapter.
   */
  get commPort() {
    const http = this._protocolAdapters.get("https");
    if (http && typeof http.port === "number") return http.port;
    const wss = this._protocolAdapters.get("wss");
    if (wss && typeof wss.listenPort === "number") return wss.listenPort;
    return 10099;
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
      this._selfHosting = false;
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
  // ── Sub-App Integration & Lifecycle ───────────────────────────────────────
  /**
   * Discovers sub-apps in the specified directory (or default 'subapps/').
   */
  async discoverSubApps(searchPath) {
    const targetDir = searchPath || "subapps";
    return await KrnlSubAppDiscovery.discoverSubApps(targetDir);
  }
  /**
   * Loads, validates, registers, and initializes a sub-app onto this entity.
   */
  async loadSubApp(descriptorOrPath, config = {}) {
    let descriptor = null;
    if (typeof descriptorOrPath === "string") {
      descriptor = await KrnlSubAppDiscovery.locateDescriptor(descriptorOrPath);
      if (!descriptor) {
        throw new Error(`[Entity:${this.id}] Could not locate a valid sub-app descriptor at '${descriptorOrPath}'.`);
      }
    } else {
      descriptor = descriptorOrPath;
    }
    const instance = await KrnlSubAppLifecycle.loadAndRegister(this, descriptor, config);
    if (instance.state === "READY") {
      this._registerSubAppInstance(instance);
    } else if (instance.state === "ERROR") {
      console.warn(`[Entity:${this.id}] Sub-app '${instance.id}' failed registration:`, instance.error?.message);
    }
    this._subApps.set(instance.id, instance);
    return instance;
  }
  /**
   * Programmatically registers a sub-app registration object.
   */
  async registerSubApp(registration, descriptor) {
    const subAppId = registration.name || descriptor?.id || `subapp_${Date.now()}`;
    const desc = descriptor || {
      id: subAppId,
      path: "",
      registrationPath: "",
      manifest: { name: subAppId, version: "1.0.0" }
    };
    const instance = {
      id: subAppId,
      state: "VALIDATING",
      manifest: desc.manifest || { name: subAppId, version: "1.0.0" },
      descriptor: desc,
      operations: /* @__PURE__ */ new Map(),
      error: null,
      errorDetails: [],
      loadedAt: Date.now()
    };
    const existingCaps = /* @__PURE__ */ new Set();
    for (const k of this.localFunctionalities.keys()) existingCaps.add(k);
    for (const k of this.remoteFunctionalities.keys()) existingCaps.add(k);
    const check = KrnlSubAppValidator.validateRegistration(registration, existingCaps, subAppId);
    if (!check.valid) {
      instance.state = "ERROR";
      instance.errorDetails = check.errors;
      instance.error = new Error(`[SubApp:${subAppId}] Registration validation failed: ${check.errors.map((e) => e.message).join(", ")}`);
      this._subApps.set(subAppId, instance);
      return instance;
    }
    instance.state = "REGISTERED";
    instance.registration = registration;
    for (const op of registration.operations) {
      instance.operations.set(op.name, op);
    }
    this._registerSubAppInstance(instance);
    if (typeof registration.onInitialize === "function") {
      instance.state = "INITIALIZING";
      const regContext = {
        entity: this,
        services: this._serviceContainer || { get: () => void 0, has: () => false, register: () => {
        }, list: () => [] },
        operations: {
          register: (op) => this.registerSubAppOperations(subAppId, [op]),
          registerBatch: (ops) => this.registerSubAppOperations(subAppId, ops),
          get: (name) => instance.operations.get(name),
          list: () => Array.from(instance.operations.values())
        },
        events: {
          emit: (event, data) => this.interface?.getEmitter(event)?.pushDataStreamToEmitter(data),
          on: (event, listener) => this.interface?.getEmitter(event)?.subscribe((m) => listener(m.data || m)) || (() => {
          })
        },
        config: {},
        logger: this.logger || console
      };
      await registration.onInitialize(regContext);
    }
    instance.state = "READY";
    instance.readyAt = Date.now();
    this._subApps.set(subAppId, instance);
    return instance;
  }
  /**
   * Internal helper: wraps sub-app operations into first-class Entity functionalities.
   */
  _registerSubAppInstance(instance) {
    if (!instance.operations) return;
    for (const op of instance.operations.values()) {
      this._wrapAndAddSubAppOperation(instance.id, op);
    }
    if (this._selfHosting) {
      this._notifyAdaptersOfSurfaceChange();
    }
  }
  /**
   * Wraps a single operation definition into a krnlLocalFunctionality and binds to this Entity.
   */
  _wrapAndAddSubAppOperation(subAppId, op) {
    const qualifiedFid = `${subAppId}.${op.name}`;
    const atomConfig = {
      id: qualifiedFid,
      visibility: op.visibility || "public",
      description: op.description || "",
      method: op.method || "POST",
      schema: {
        input: op.input || null,
        output: op.output || null
      },
      metadata: op.metadata || {},
      api: async (input, ctx) => {
        return await op.handler(input, {
          caller: ctx?.caller,
          callerPort: ctx?.callerPort,
          accessKey: ctx?.accessKey,
          entity: this,
          metadata: op.metadata
        });
      }
    };
    const localAtom = new krnlLocalFunctionality(atomConfig);
    this.addLocal(localAtom);
    if (!this.localFunctionalities.has(op.name) && !this.remoteFunctionalities.has(op.name)) {
      const aliasAtom = new krnlLocalFunctionality({
        ...atomConfig,
        id: op.name
      });
      this.addLocal(aliasAtom);
    }
  }
  /**
   * Registers additional operations under an existing sub-app.
   */
  registerSubAppOperations(subAppId, operations) {
    const instance = this._subApps.get(subAppId);
    for (const op of operations) {
      if (instance) {
        instance.operations.set(op.name, op);
      }
      this._wrapAndAddSubAppOperation(subAppId, op);
    }
    if (this._selfHosting) {
      this._notifyAdaptersOfSurfaceChange();
    }
  }
  /**
   * Unregisters and disposes a sub-app from this entity.
   */
  async unregisterSubApp(subAppId) {
    const instance = this._subApps.get(subAppId);
    if (!instance) return;
    for (const opName of instance.operations.keys()) {
      const qualifiedFid = `${subAppId}.${opName}`;
      if (this.localFunctionalities.has(qualifiedFid)) {
        const func = this.localFunctionalities.get(qualifiedFid);
        if (func && typeof func._unregisterFromInterface === "function") {
          func._unregisterFromInterface();
        }
        this.localFunctionalities.delete(qualifiedFid);
      }
      if (this.localFunctionalities.has(opName)) {
        const func = this.localFunctionalities.get(opName);
        if (func && typeof func._unregisterFromInterface === "function") {
          func._unregisterFromInterface();
        }
        this.localFunctionalities.delete(opName);
      }
    }
    await KrnlSubAppLifecycle.dispose(instance);
    this._subApps.delete(subAppId);
    if (this._selfHosting) {
      this._notifyAdaptersOfSurfaceChange();
    }
  }
  /**
   * Retrieve a registered sub-app instance by ID.
   */
  getSubApp(subAppId) {
    return this._subApps.get(subAppId);
  }
  /**
   * Returns all sub-app instances registered under this entity.
   */
  getSubApps() {
    return Array.from(this._subApps.values());
  }
  // ── Manifest Aggregation (Kernel Declares → Shell Materializes) ──────────
  /**
   * Aggregates dependency manifests from all local functionalities, sub-apps, and descendant entities.
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
    this._subApps.forEach((subApp) => {
      if (subApp.manifest) {
        _Entity._mergeManifestRequirements(reqs, subApp.manifest, `${this.id}:${subApp.id}`);
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
   * Aggregates UI specifications from all functionalities and sub-apps across the entity tree.
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
    this._subApps.forEach((subApp) => {
      const uiConfig = subApp.registration?.ui || subApp.manifest?.ui;
      if (uiConfig) {
        list.push({
          qualifiedId: this.getQualifiedId(subApp.id),
          uiSpec: typeof uiConfig === "string" ? { entry: uiConfig } : uiConfig,
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
   * Clean disposal of all entity resources, sub-apps, child components, and adapters.
   */
  dispose() {
    if (this._selfHosting) {
      this.stopHosting().catch(() => {
      });
    }
    for (const subApp of this._subApps.values()) {
      KrnlSubAppLifecycle.dispose(subApp).catch(() => {
      });
    }
    this._subApps.clear();
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
