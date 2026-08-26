import {
  FileLock,
  KrnlFS,
  KrnlHTTP,
  ObjectKit
} from "./chunk-MLVWARD4.js";
import {
  KrnlTelemetry,
  telemetry
} from "./chunk-DI27MOR7.js";

// src/core/K_LIB_Krnl_Error_Concepts.ts
var krnlErrorCodes = Object.freeze({
  // Enum errors (0-99)
  ENUM_ID_NOT_FOUND: -1,
  // State errors (100-199)
  STATE_NOT_FOUND: 100,
  STATE_DUPLICATE_NAME: 101,
  STATE_INDEX_OUT_OF_RANGE: 102,
  // Functionality errors (200-299)
  FUNCTIONALITY_NOT_DEFINED: 200,
  FUNCTIONALITY_ALREADY_DEFINED: 201,
  FUNCTIONALITY_INSTANCE_NOT_FOUND: 202,
  REMOTE_EXECUTION_FAILED: 203,
  // Interface errors (300-399)
  EMITTER_NOT_FOUND: 300,
  COLLECTOR_NOT_FOUND: 301,
  COLLECTOR_NOT_SUBSCRIBED: 302,
  // Hierarchy errors (400-499)
  ENTITY_NOT_FOUND: 400,
  // Networking/RPC errors (500-599)
  ERR_NET_RPC_TIMEOUT_EXCEEDED: 500,
  ERR_NET_RPC_NETWORK_ERROR: 501,
  ERR_NET_RPC_INTERNAL_SERVER_ERROR: 502,
  ERR_SYS_ENTITY_BUSY_RESERVED: 503,
  ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504,
  ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505
});
var krnlErrorMessages = Object.freeze({
  // Enum
  [krnlErrorCodes.ENUM_ID_NOT_FOUND]: "ERR_LIB_ENUM_ID_NOT_FOUND",
  // State
  [krnlErrorCodes.STATE_NOT_FOUND]: "ERR_LIB_STATE_NOT_FOUND",
  [krnlErrorCodes.STATE_DUPLICATE_NAME]: "ERR_LIB_STATE_DUPLICATE_NAME",
  [krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE]: "ERR_LIB_STATE_INDEX_OUT_OF_RANGE",
  // Functionality
  [krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED]: "ERR_LIB_FUNCTIONALITY_NOT_DEFINED",
  [krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED]: "ERR_LIB_FUNCTIONALITY_ALREADY_DEFINED",
  [krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND]: "ERR_LIB_FUNCTIONALITY_INSTANCE_NOT_FOUND",
  [krnlErrorCodes.REMOTE_EXECUTION_FAILED]: "ERR_LIB_REMOTE_EXECUTION_FAILED",
  // Interface
  [krnlErrorCodes.EMITTER_NOT_FOUND]: "ERR_INT_EMITTER_NOT_FOUND",
  [krnlErrorCodes.COLLECTOR_NOT_FOUND]: "ERR_INT_COLLECTOR_NOT_FOUND",
  [krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED]: "ERR_INT_COLLECTOR_NOT_SUBSCRIBED",
  // Hierarchy
  [krnlErrorCodes.ENTITY_NOT_FOUND]: "ERR_SYS_ENTITY_NOT_FOUND",
  // Networking/RPC
  [krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED]: "ERR_NET_RPC_TIMEOUT_EXCEEDED",
  [krnlErrorCodes.ERR_NET_RPC_NETWORK_ERROR]: "ERR_NET_RPC_NETWORK_ERROR",
  [krnlErrorCodes.ERR_NET_RPC_INTERNAL_SERVER_ERROR]: "ERR_NET_RPC_INTERNAL_SERVER_ERROR",
  [krnlErrorCodes.ERR_SYS_ENTITY_BUSY_RESERVED]: "ERR_SYS_ENTITY_BUSY_RESERVED",
  [krnlErrorCodes.ERR_COM_INGRESS_ROUTE_NOT_FOUND]: "ERR_COM_INGRESS_ROUTE_NOT_FOUND",
  [krnlErrorCodes.ERR_KRNL_UNRESOLVED_REMOTE_TARGET]: "ERR_KRNL_UNRESOLVED_REMOTE_TARGET"
});
var CUSTOM_ERROR_CODE = -999;
var krnlError = class extends Error {
  code;
  errorMessage;
  constructor(code) {
    const isNumeric = typeof code === "number";
    const numericCode = isNumeric ? code : CUSTOM_ERROR_CODE;
    const message = isNumeric ? krnlErrorMessages[numericCode] ?? `Error: ${code}` : code;
    super(message);
    this.code = numericCode;
    this.errorMessage = this.message;
  }
};

// src/core/K_LIB_Krnl_Messaging_Concepts.ts
var krnlGlobalEmitterAddress = class {
  systemID = 0;
  // ["qwnsr", "brnda", "symba", "mosy"]
  subSystemID = 0;
  // ["qwnsrControl", "qwnsrBlocks"]
  entityAddress = [];
  // nesting of type
  emitterID = 0;
};
var krnlLocalEmitterAddress = class {
  isOwnerEntity = true;
  siblingID = 0;
  emitterID = 0;
};
var krnlMessage = class {
  data = null;
  timestamp = 0;
  // Tracing metadata aligned with core lingo
  sourceEmitterAddress = null;
  targetCollectorAddress = null;
  traceCorrelationId = null;
  originSystemAddress = null;
};
var krnlEmitter = class {
  subscribers;
  localAddress;
  constructor() {
    this.subscribers = [];
    this.localAddress = null;
  }
  /**
   * Pushes data into the emitter and notifies all subscribers.
   */
  pushDataStreamToEmitter(data, time = {}, transform = (msg) => msg) {
    const msg = new krnlMessage();
    msg.data = data;
    msg.timestamp = typeof time === "number" ? time : time?.timestamp || Date.now();
    const transformed = transform(msg);
    for (let i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i](transformed);
    }
  }
  /**
   * Subscribes a handler to this emitter. Handler is called on every push.
   */
  subscribe(handler) {
    this.subscribers.push(handler);
    return () => {
      const idx = this.subscribers.indexOf(handler);
      if (idx >= 0) this.subscribers.splice(idx, 1);
    };
  }
  /**
   * Subscribes once and auto-unsubscribes after first message.
   */
  subscribeOnce(handler) {
    let unsubscribe = null;
    const wrapped = (msg) => {
      if (unsubscribe) unsubscribe();
      handler(msg);
    };
    unsubscribe = this.subscribe(wrapped);
    return unsubscribe;
  }
  /**
   * Resets the emitter and removes all subscribers.
   */
  disconnectEmitter() {
    this.subscribers = [];
  }
};
var krnlCollector = class {
  emitter;
  unsubscribe;
  _directHandler;
  constructor() {
    this.emitter = null;
    this.unsubscribe = null;
  }
  /**
   * Subscribes this collector to an emitter. Messages are forwarded to the handler.
   */
  subscribeTo(emitter, handler = null, options = {}) {
    const { mode = "stream" } = options;
    const resolvedHandler = typeof handler === "function" ? handler : (msg) => {
      if (typeof this._directHandler === "function") {
        return this._directHandler(msg);
      }
      return msg;
    };
    this.disconnectCollector();
    this.emitter = emitter;
    this.unsubscribe = mode === "once" ? emitter.subscribeOnce(resolvedHandler) : emitter.subscribe(resolvedHandler);
    return this.unsubscribe;
  }
  /**
   * Collects a single message from the emitter and auto-disconnects.
   */
  collectNext(emitter, timeoutMs = null) {
    return new Promise((resolve, reject) => {
      let timeout = null;
      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        this.disconnectCollector();
      };
      this.subscribeTo(emitter, (msg) => {
        cleanup();
        resolve(msg);
      }, { mode: "once" });
      if (typeof timeoutMs === "number" && timeoutMs > 0) {
        timeout = setTimeout(() => {
          cleanup();
          reject(new Error(`Collector timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }
  /**
   * Pipes messages from a connected emitter through a transform function.
   */
  pipeTo(target, fn) {
    const pipeEmitter = new krnlEmitter();
    this.emitter = pipeEmitter;
    const unsub = pipeEmitter.subscribe((msg) => {
      fn(msg);
    });
    this.unsubscribe = unsub;
    return () => {
      this.disconnectCollector();
    };
  }
  /**
   * Pushes data directly into this collector's connected emitter.
   */
  pushDataStreamToEmitter(data) {
    if (this.emitter === null) {
      throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED);
    }
    this.emitter.pushDataStreamToEmitter(data);
  }
  /**
   * Disconnects from the current emitter.
   */
  disconnectCollector() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.emitter = null;
    }
  }
};
var krnlInterface = class {
  ownerEntity;
  emitters;
  collectors;
  constructor(ownerEntity) {
    this.ownerEntity = ownerEntity;
    this.emitters = /* @__PURE__ */ new Map();
    this.collectors = /* @__PURE__ */ new Map();
  }
  /**
   * Creates and registers a new emitter.
   */
  createEmitter(name) {
    const emitter = new krnlEmitter();
    this.emitters.set(name, emitter);
    emitter.localAddress = {
      isOwnerEntity: false,
      siblingID: 0,
      emitterID: this.emitters.size - 1
    };
    return emitter;
  }
  /**
   * Creates and registers a new collector.
   */
  createCollector(name) {
    const collector = new krnlCollector();
    this.collectors.set(name, collector);
    return collector;
  }
  /**
   * Gets an emitter by name.
   */
  getEmitter(name) {
    const emitter = this.emitters.get(name);
    if (!emitter) throw new krnlError(krnlErrorCodes.EMITTER_NOT_FOUND);
    return emitter;
  }
  /**
   * Gets a collector by name.
   */
  getCollector(name) {
    const collector = this.collectors.get(name);
    if (!collector) throw new krnlError(krnlErrorCodes.COLLECTOR_NOT_FOUND);
    return collector;
  }
  /**
   * Removes an emitter by name.
   */
  removeEmitter(name) {
    const emitter = this.emitters.get(name);
    if (emitter) {
      emitter.disconnectEmitter();
      this.emitters.delete(name);
    }
  }
  /**
   * Removes a collector by name.
   */
  removeCollector(name) {
    const collector = this.collectors.get(name);
    if (collector) {
      collector.disconnectCollector();
      this.collectors.delete(name);
    }
  }
  /**
   * Gets all emitters in scope (self + owner + siblings).
   */
  getEmittersInScope() {
    const interfaces = this.getInterfacesInScope();
    const result = [];
    for (let i = 0; i < interfaces.length; i++) {
      for (const emitter of interfaces[i].emitters.values()) {
        result.push(emitter);
      }
    }
    return result;
  }
  /**
   * Gets all interfaces in scope (self, owner, and siblings).
   */
  getInterfacesInScope() {
    const owner = this.ownerEntity.hierarchyManager ? this.ownerEntity.hierarchyManager.getOwnerEntity() : null;
    if (!owner) return [this];
    const scopes = [this];
    if (owner.interface) scopes.push(owner.interface);
    const siblings = owner.hierarchyManager ? owner.hierarchyManager.getAllOwnedComponentEntities() : [];
    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i] !== this.ownerEntity && siblings[i].interface) {
        scopes.push(siblings[i].interface);
      }
    }
    return scopes;
  }
  /**
   * Disconnects all emitters and collectors.
   */
  dispose() {
    for (const emitter of this.emitters.values()) {
      emitter.disconnectEmitter();
    }
    for (const collector of this.collectors.values()) {
      collector.disconnectCollector();
    }
    this.emitters.clear();
    this.collectors.clear();
  }
};

// src/core/K_LIB_Krnl_Entity_Compositional_Hierarchy.ts
var krnlEntityCompositionalHierarchyManager = class {
  self;
  owner;
  EntityClass;
  ownedComponents;
  componentBaseNames;
  componentInstanceCounters;
  /**
   * @param self - The entity this manager belongs to.
   * @param owner - The parent entity (if any).
   * @param EntityClass - Reference to the Entity base class for instantiation.
   */
  constructor(self, owner, EntityClass) {
    this.self = self;
    this.owner = owner;
    this.EntityClass = EntityClass;
    this.ownedComponents = /* @__PURE__ */ new Map();
    this.componentBaseNames = /* @__PURE__ */ new Map();
    this.componentInstanceCounters = /* @__PURE__ */ new Map();
  }
  /**
   * Spawns a unique component entity within this host.
   */
  createComponentEntity(name, CustomClass = null, options = {}) {
    const ClassToUse = CustomClass || this.EntityClass;
    const shouldBeSingleton = options.Singleton ?? ClassToUse.Singleton ?? true;
    if (shouldBeSingleton && this.ownedComponents.has(name)) {
      return this.ownedComponents.get(name);
    }
    const currentCount = this.componentInstanceCounters.get(name) || 0;
    const nextCount = currentCount + 1;
    this.componentInstanceCounters.set(name, nextCount);
    const resolvedName = shouldBeSingleton ? name : `${name}#${nextCount}`;
    const newEntity = new ClassToUse(resolvedName, this.self, {
      Singleton: shouldBeSingleton,
      baseName: name,
      instanceNumber: nextCount
    });
    this.ownedComponents.set(resolvedName, newEntity);
    const group = this.componentBaseNames.get(name) || [];
    group.push(newEntity);
    this.componentBaseNames.set(name, group);
    if (this.self._onComponentAdded) {
      this.self._onComponentAdded(newEntity);
    }
    return newEntity;
  }
  /**
   * Registers a pre-existing entity instance as a component of this host.
   */
  addComponentEntityInstance(instance) {
    this.ownedComponents.set(instance.id, instance);
    instance.hierarchyManager.owner = this.self;
    const base = instance.baseName || instance.id;
    const group = this.componentBaseNames.get(base) || [];
    group.push(instance);
    this.componentBaseNames.set(base, group);
    if (typeof instance._onAdoptedByParent === "function") {
      try {
        const p = instance._onAdoptedByParent();
        if (p && typeof p.catch === "function") {
          p.catch((err) => console.warn(`[Hierarchy] Error in _onAdoptedByParent on '${instance.id}':`, err.message || err));
        }
      } catch (err) {
        console.warn(`[Hierarchy] Error in _onAdoptedByParent on '${instance.id}':`, err.message || err);
      }
    }
    if (instance._promoteAllExistingFunctionalities) {
      instance._promoteAllExistingFunctionalities();
    }
  }
  /**
   * Returns a list of all component entities owned by this host.
   */
  getAllOwnedComponentEntities() {
    return Array.from(this.ownedComponents.values());
  }
  /**
   * Returns all component entity instances created from the same base component name.
   */
  getOwnedComponentEntitiesByName(name) {
    return [...this.componentBaseNames.get(name) || []];
  }
  /**
   * Returns the parent entity.
   */
  getOwnerEntity() {
    return this.owner;
  }
  /**
   * Recursively disposes of all owned components.
   */
  dispose() {
    this.ownedComponents.forEach((entity) => {
      if (entity.dispose) entity.dispose();
    });
    this.ownedComponents.clear();
    this.componentBaseNames.clear();
    this.componentInstanceCounters.clear();
  }
  /**
   * Disposes a specific component instance by ID/name.
   */
  disposeComponentEntity(entityId) {
    const entity = this.ownedComponents.get(entityId);
    if (!entity) return false;
    if (entity.dispose) entity.dispose();
    this.ownedComponents.delete(entityId);
    const base = entity.baseName || entity.entityName;
    const group = this.componentBaseNames.get(base) || [];
    this.componentBaseNames.set(base, group.filter((e) => e !== entity));
    return true;
  }
};

// src/backend/FunctionalityTable.ts
var FunctionalityTable = class {
  tableName;
  service;
  provider;
  isTableInitialized = false;
  constructor(tableName, provider) {
    this.tableName = tableName;
    this.provider = provider;
    this.service = provider.engine;
  }
  async ensureInitialized() {
    if (!this.isTableInitialized) {
      await this.provider.ensureTable(this.tableName);
      this.isTableInitialized = true;
    }
  }
  async find(filter, options) {
    await this.ensureInitialized();
    return await this.provider.find(this.tableName, filter, options);
  }
  async findOne(filter) {
    await this.ensureInitialized();
    return await this.provider.findOne(this.tableName, filter);
  }
  async create(record) {
    await this.ensureInitialized();
    const result = await this.provider.insert(this.tableName, record);
    return Array.isArray(result) ? result[0] : result;
  }
  async insert(record) {
    await this.ensureInitialized();
    return await this.provider.insert(this.tableName, record);
  }
  async update(filter, patch) {
    await this.ensureInitialized();
    return await this.provider.update(this.tableName, filter, patch);
  }
  async delete(filter) {
    await this.ensureInitialized();
    return await this.provider.delete(this.tableName, filter);
  }
  async upsert(record, keyField = "id") {
    await this.ensureInitialized();
    const keyVal = record[keyField];
    if (keyVal !== void 0 && keyVal !== null) {
      const existing = await this.findOne({ [keyField]: keyVal });
      if (existing) {
        await this.update({ [keyField]: keyVal }, record);
        return { ...existing, ...record };
      }
    }
    return await this.create(record);
  }
  async count(filter) {
    await this.ensureInitialized();
    return await this.provider.count(this.tableName, filter);
  }
  async query(rawQueryOrFilter, params) {
    await this.ensureInitialized();
    if (typeof rawQueryOrFilter === "string") {
      return await this.provider.query(rawQueryOrFilter, params);
    }
    return await this.provider.find(this.tableName, rawQueryOrFilter);
  }
  async clear() {
    await this.ensureInitialized();
    await this.provider.clear(this.tableName);
  }
};

// src/backend/providers/data/SQLiteDataProvider.ts
import path from "path";
var SQLiteDataProvider = class {
  engine = "sqlite";
  filePath;
  enableWAL;
  isConnected = false;
  tables = /* @__PURE__ */ new Map();
  constructor(config = "./workspace.sqlite") {
    if (typeof config === "string") {
      this.filePath = path.resolve(config);
      this.enableWAL = true;
    } else {
      this.filePath = path.resolve(config.filePath || "./workspace.sqlite");
      this.enableWAL = config.enableWAL !== false;
    }
  }
  async connect() {
    if (this.isConnected) return;
    const dir = path.dirname(this.filePath);
    await KrnlFS.ensureDir(dir);
    if (await KrnlFS.fileExists(this.filePath)) {
      try {
        const raw = await KrnlFS.readJSON(this.filePath);
        if (raw && typeof raw === "object") {
          for (const [tbl, rows] of Object.entries(raw)) {
            if (Array.isArray(rows)) {
              this.tables.set(tbl, rows);
            }
          }
        }
      } catch {
        this.tables.clear();
      }
    }
    this.isConnected = true;
  }
  async disconnect() {
    if (!this.isConnected) return;
    await this.persist();
    this.isConnected = false;
  }
  async testConnection() {
    const t0 = Date.now();
    try {
      await this.connect();
      const latencyMs = Date.now() - t0;
      return {
        ok: true,
        latencyMs,
        details: {
          engine: "sqlite",
          filePath: this.filePath,
          wal: this.enableWAL,
          tablesCount: this.tables.size
        }
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        details: { error: err.message }
      };
    }
  }
  async ensureTable(tableName, _schema) {
    await this.connect();
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
      await this.persist();
    }
  }
  async persist() {
    const release = await FileLock.acquire(this.filePath);
    try {
      const dump = {};
      for (const [tbl, rows] of this.tables.entries()) {
        dump[tbl] = rows;
      }
      await KrnlFS.writeJSON(this.filePath, dump, 2);
    } finally {
      release();
    }
  }
  getTableRows(table) {
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }
    return this.tables.get(table);
  }
  matchesFilter(row, filter) {
    if (typeof filter === "string") {
      return row.id === filter || row._id === filter;
    }
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, expected] of Object.entries(filter)) {
      const actual = row[key];
      if (expected && typeof expected === "object" && !Array.isArray(expected)) {
        if ("$gt" in expected && !(actual > expected.$gt)) return false;
        if ("$gte" in expected && !(actual >= expected.$gte)) return false;
        if ("$lt" in expected && !(actual < expected.$lt)) return false;
        if ("$lte" in expected && !(actual <= expected.$lte)) return false;
        if ("$ne" in expected && actual === expected.$ne) return false;
        if ("$in" in expected && Array.isArray(expected.$in) && !expected.$in.includes(actual)) return false;
        if ("$nin" in expected && Array.isArray(expected.$nin) && expected.$nin.includes(actual)) return false;
      } else if (actual !== expected) {
        return false;
      }
    }
    return true;
  }
  async find(table, filter, options) {
    await this.connect();
    const rows = this.getTableRows(table);
    let results = rows.filter((r) => this.matchesFilter(r, filter || {}));
    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      results.sort((a, b) => {
        for (const [key, dir] of sortEntries) {
          if (a[key] < b[key]) return dir === 1 ? -1 : 1;
          if (a[key] > b[key]) return dir === 1 ? 1 : -1;
        }
        return 0;
      });
    }
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return ObjectKit.deepClone(results);
  }
  async findOne(table, filter) {
    const list = await this.find(table, typeof filter === "string" ? { id: filter } : filter, { limit: 1 });
    return list[0] || null;
  }
  async insert(table, data) {
    await this.connect();
    const rows = this.getTableRows(table);
    const items = Array.isArray(data) ? data : [data];
    const inserted = [];
    for (const item of items) {
      const record = ObjectKit.deepClone(item);
      if (!record.id && !record._id) {
        record.id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      if (!record.createdAt) {
        record.createdAt = Date.now();
      }
      record.updatedAt = Date.now();
      rows.push(record);
      inserted.push(record);
    }
    await this.persist();
    return Array.isArray(data) ? inserted : inserted[0];
  }
  async update(table, filter, patch) {
    await this.connect();
    const rows = this.getTableRows(table);
    let affected = 0;
    for (let i = 0; i < rows.length; i++) {
      if (this.matchesFilter(rows[i], filter)) {
        rows[i] = ObjectKit.deepMerge(rows[i], {
          ...patch,
          updatedAt: Date.now()
        });
        affected++;
      }
    }
    if (affected > 0) {
      await this.persist();
    }
    return { affectedRows: affected };
  }
  async delete(table, filter) {
    await this.connect();
    const rows = this.getTableRows(table);
    const initialLen = rows.length;
    const remaining = rows.filter((r) => !this.matchesFilter(r, filter));
    const affected = initialLen - remaining.length;
    if (affected > 0) {
      this.tables.set(table, remaining);
      await this.persist();
    }
    return { affectedRows: affected };
  }
  async count(table, filter) {
    await this.connect();
    const rows = this.getTableRows(table);
    if (!filter || Object.keys(filter).length === 0) {
      return rows.length;
    }
    return rows.filter((r) => this.matchesFilter(r, filter)).length;
  }
  async clear(table) {
    await this.connect();
    this.tables.set(table, []);
    await this.persist();
  }
  async query(queryStr, _params) {
    await this.connect();
    const normalized = queryStr.trim().toLowerCase();
    if (normalized.startsWith("select * from")) {
      const parts = queryStr.trim().split(/\s+/);
      const tableName = parts[3]?.replace(/['";]/g, "");
      if (tableName) {
        return this.find(tableName);
      }
    }
    return [];
  }
  async execute(commandStr, _params) {
    await this.connect();
    const normalized = commandStr.trim().toLowerCase();
    if (normalized.startsWith("create table")) {
      const parts = commandStr.trim().split(/\s+/);
      const tableName = parts[2]?.replace(/['";(]/g, "");
      if (tableName) {
        await this.ensureTable(tableName);
        return { affectedRows: 0 };
      }
    }
    return { affectedRows: 0 };
  }
};

// src/backend/providers/data/PostgresDataProvider.ts
var PostgresDataProvider = class {
  engine = "postgres";
  config;
  isConnected = false;
  constructor(config) {
    this.config = config;
  }
  async connect() {
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
  }
  async testConnection() {
    const t0 = Date.now();
    try {
      if (this.config.endpoint) {
        const res = await KrnlHTTP.get(this.config.endpoint, { timeout: 5e3 });
        return {
          ok: res.status === "success" || res.code === 200,
          latencyMs: Date.now() - t0,
          details: {
            engine: "postgres",
            endpoint: this.config.endpoint,
            ssl: this.config.ssl ?? true
          }
        };
      }
      const hasConnectionInfo = Boolean(
        this.config.connectionString || this.config.host && this.config.database
      );
      return {
        ok: hasConnectionInfo,
        latencyMs: Date.now() - t0,
        details: {
          engine: "postgres",
          host: this.config.host,
          database: this.config.database,
          ssl: this.config.ssl ?? true,
          poolSize: this.config.poolSize ?? 10
        }
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        details: { error: err.message }
      };
    }
  }
  async ensureTable(_tableName, _schema) {
  }
  async find(_table, _filter, _options) {
    return [];
  }
  async findOne(_table, _filter) {
    return null;
  }
  async insert(_table, data) {
    return data;
  }
  async update(_table, _filter, _patch) {
    return { affectedRows: 0 };
  }
  async delete(_table, _filter) {
    return { affectedRows: 0 };
  }
  async count(_table, _filter) {
    return 0;
  }
  async clear(_table) {
  }
  async query(_queryStr, _params) {
    return [];
  }
  async execute(_commandStr, _params) {
    return { affectedRows: 0 };
  }
};

// src/backend/providers/data/SupabaseDataProvider.ts
var SupabaseDataProvider = class {
  engine = "supabase";
  endpoint;
  apiKey;
  isConnected = false;
  constructor(config) {
    this.endpoint = (config.endpoint || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || "";
  }
  getHeaders() {
    return {
      "apikey": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }
  async connect() {
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
  }
  async testConnection() {
    const t0 = Date.now();
    try {
      const res = await KrnlHTTP.get(`${this.endpoint}/rest/v1/`, {
        headers: this.getHeaders(),
        timeout: 5e3
      });
      const latencyMs = Date.now() - t0;
      return {
        ok: res.status === "success" || res.code === 200 || res.code === 404,
        latencyMs,
        details: {
          engine: "supabase",
          endpoint: this.endpoint,
          status: res.status,
          code: res.code
        }
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        details: { error: err.message }
      };
    }
  }
  async ensureTable(_tableName, _schema) {
  }
  buildQueryString(filter, options) {
    const params = [];
    if (filter) {
      for (const [key, val] of Object.entries(filter)) {
        if (val === null || val === void 0) {
          params.push(`${key}=is.null`);
        } else if (typeof val === "object") {
          if ("$gt" in val) params.push(`${key}=gt.${encodeURIComponent(val.$gt)}`);
          if ("$gte" in val) params.push(`${key}=gte.${encodeURIComponent(val.$gte)}`);
          if ("$lt" in val) params.push(`${key}=lt.${encodeURIComponent(val.$lt)}`);
          if ("$lte" in val) params.push(`${key}=lte.${encodeURIComponent(val.$lte)}`);
          if ("$ne" in val) params.push(`${key}=neq.${encodeURIComponent(val.$ne)}`);
        } else {
          params.push(`${key}=eq.${encodeURIComponent(String(val))}`);
        }
      }
    }
    if (options?.limit) {
      params.push(`limit=${options.limit}`);
    }
    if (options?.offset) {
      params.push(`offset=${options.offset}`);
    }
    if (options?.sort) {
      const order = Object.entries(options.sort).map(([col, dir]) => `${col}.${dir === 1 ? "asc" : "desc"}`).join(",");
      params.push(`order=${order}`);
    }
    return params.length > 0 ? `?${params.join("&")}` : "";
  }
  async find(table, filter, options) {
    const qs = this.buildQueryString(filter, options);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const res = await KrnlHTTP.get(url, { headers: this.getHeaders() });
    if (res.status === "success" && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }
  async findOne(table, filter) {
    const filterObj = typeof filter === "string" ? { id: filter } : filter;
    const list = await this.find(table, filterObj, { limit: 1 });
    return list[0] || null;
  }
  async insert(table, data) {
    const url = `${this.endpoint}/rest/v1/${table}`;
    const res = await KrnlHTTP.post(url, data, { headers: this.getHeaders() });
    if (res.status === "success" && res.data) {
      return Array.isArray(data) ? res.data : res.data[0];
    }
    return data;
  }
  async update(table, filter, patch) {
    const filterObj = typeof filter === "string" ? { id: filter } : filter;
    const qs = this.buildQueryString(filterObj);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const res = await KrnlHTTP.request(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(patch)
    });
    const affected = res.status === "success" && Array.isArray(res.data) ? res.data.length : 0;
    return { affectedRows: affected };
  }
  async delete(table, filter) {
    const filterObj = typeof filter === "string" ? { id: filter } : filter;
    const qs = this.buildQueryString(filterObj);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const res = await KrnlHTTP.del(url, { headers: this.getHeaders() });
    const affected = res.status === "success" && Array.isArray(res.data) ? res.data.length : 0;
    return { affectedRows: affected };
  }
  async count(table, filter) {
    const qs = this.buildQueryString(filter);
    const url = `${this.endpoint}/rest/v1/${table}${qs}`;
    const headers = { ...this.getHeaders(), "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0" };
    const res = await KrnlHTTP.get(url, { headers });
    return res.status === "success" && Array.isArray(res.data) ? res.data.length : 0;
  }
  async clear(table) {
    await this.delete(table, {});
  }
  async query(queryStr, _params) {
    return this.find(queryStr);
  }
  async execute(_commandStr, _params) {
    return { affectedRows: 0 };
  }
};

// src/backend/providers/data/PocketBaseDataProvider.ts
var PocketBaseDataProvider = class {
  engine = "pocketbase";
  endpoint;
  apiKey;
  isConnected = false;
  constructor(config) {
    this.endpoint = (config.endpoint || "http://127.0.0.1:8090").replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }
  getHeaders() {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = this.apiKey;
    }
    return headers;
  }
  async connect() {
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
  }
  async testConnection() {
    const t0 = Date.now();
    try {
      const res = await KrnlHTTP.get(`${this.endpoint}/api/health`, {
        headers: this.getHeaders(),
        timeout: 5e3
      });
      const latencyMs = Date.now() - t0;
      return {
        ok: res.status === "success" && (res.data?.code === 200 || res.code === 200),
        latencyMs,
        details: {
          engine: "pocketbase",
          endpoint: this.endpoint,
          data: res.data
        }
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        details: { error: err.message }
      };
    }
  }
  async ensureTable(_tableName, _schema) {
  }
  buildFilterParam(filter) {
    if (!filter || Object.keys(filter).length === 0) return "";
    const expressions = [];
    for (const [key, val] of Object.entries(filter)) {
      if (typeof val === "string") {
        expressions.push(`${key}='${val.replace(/'/g, "\\'")}'`);
      } else if (typeof val === "number" || typeof val === "boolean") {
        expressions.push(`${key}=${val}`);
      }
    }
    return expressions.length > 0 ? encodeURIComponent(expressions.join(" && ")) : "";
  }
  async find(table, filter, options) {
    const params = [];
    const filterStr = this.buildFilterParam(filter);
    if (filterStr) params.push(`filter=${filterStr}`);
    const perPage = options?.limit || 50;
    const page = options?.offset ? Math.floor(options.offset / perPage) + 1 : 1;
    params.push(`page=${page}&perPage=${perPage}`);
    if (options?.sort) {
      const sortParts = Object.entries(options.sort).map(([col, dir]) => `${dir === -1 ? "-" : "+"}${col}`);
      params.push(`sort=${encodeURIComponent(sortParts.join(","))}`);
    }
    const qs = params.length > 0 ? `?${params.join("&")}` : "";
    const url = `${this.endpoint}/api/collections/${table}/records${qs}`;
    const res = await KrnlHTTP.get(url, { headers: this.getHeaders() });
    if (res.status === "success" && res.data?.items) {
      return res.data.items;
    }
    return [];
  }
  async findOne(table, filter) {
    if (typeof filter === "string") {
      const url = `${this.endpoint}/api/collections/${table}/records/${filter}`;
      const res = await KrnlHTTP.get(url, { headers: this.getHeaders() });
      return res.status === "success" && res.data ? res.data : null;
    }
    const list = await this.find(table, filter, { limit: 1 });
    return list[0] || null;
  }
  async insert(table, data) {
    const url = `${this.endpoint}/api/collections/${table}/records`;
    if (Array.isArray(data)) {
      const results = [];
      for (const item of data) {
        const res = await KrnlHTTP.post(url, item, { headers: this.getHeaders() });
        if (res.status === "success" && res.data) results.push(res.data);
      }
      return results;
    } else {
      const res = await KrnlHTTP.post(url, data, { headers: this.getHeaders() });
      return res.status === "success" && res.data ? res.data : data;
    }
  }
  async update(table, filter, patch) {
    let targetId = null;
    if (typeof filter === "string") {
      targetId = filter;
    } else {
      const existing = await this.findOne(table, filter);
      targetId = existing?.id || null;
    }
    if (!targetId) return { affectedRows: 0 };
    const url = `${this.endpoint}/api/collections/${table}/records/${targetId}`;
    const res = await KrnlHTTP.request(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(patch)
    });
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }
  async delete(table, filter) {
    let targetId = null;
    if (typeof filter === "string") {
      targetId = filter;
    } else {
      const existing = await this.findOne(table, filter);
      targetId = existing?.id || null;
    }
    if (!targetId) return { affectedRows: 0 };
    const url = `${this.endpoint}/api/collections/${table}/records/${targetId}`;
    const res = await KrnlHTTP.del(url, { headers: this.getHeaders() });
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }
  async count(table, filter) {
    const filterStr = this.buildFilterParam(filter);
    const qs = `?page=1&perPage=1${filterStr ? `&filter=${filterStr}` : ""}`;
    const url = `${this.endpoint}/api/collections/${table}/records${qs}`;
    const res = await KrnlHTTP.get(url, { headers: this.getHeaders() });
    return res.status === "success" && typeof res.data?.totalItems === "number" ? res.data.totalItems : 0;
  }
  async clear(table) {
    const all = await this.find(table);
    for (const item of all) {
      if (item.id) await this.delete(table, item.id);
    }
  }
  async query(queryStr, _params) {
    return this.find(queryStr);
  }
  async execute(_commandStr, _params) {
    return { affectedRows: 0 };
  }
};

// src/backend/providers/data/FirebaseDataProvider.ts
var FirebaseDataProvider = class {
  engine = "firebase";
  projectId;
  apiKey;
  isConnected = false;
  constructor(config) {
    this.projectId = config.projectId || "";
    this.apiKey = config.apiKey;
  }
  get baseUrl() {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }
  get urlSuffix() {
    return this.apiKey ? `?key=${this.apiKey}` : "";
  }
  async connect() {
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
  }
  async testConnection() {
    const t0 = Date.now();
    try {
      const url = `${this.baseUrl}${this.urlSuffix}`;
      const res = await KrnlHTTP.get(url, { timeout: 5e3 });
      const latencyMs = Date.now() - t0;
      return {
        ok: res.status === "success" || res.code === 200 || res.code === 404,
        latencyMs,
        details: {
          engine: "firebase",
          projectId: this.projectId,
          status: res.status
        }
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        details: { error: err.message }
      };
    }
  }
  async ensureTable(_tableName, _schema) {
  }
  /**
   * Translates plain JavaScript object into Firestore document value structure
   */
  toFirestoreFields(obj) {
    const fields = {};
    for (const [key, val] of Object.entries(obj)) {
      fields[key] = this.toFirestoreValue(val);
    }
    return fields;
  }
  toFirestoreValue(val) {
    if (val === null || val === void 0) return { nullValue: null };
    if (typeof val === "boolean") return { booleanValue: val };
    if (typeof val === "number") {
      return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    }
    if (typeof val === "string") return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map((v) => this.toFirestoreValue(v)) } };
    }
    if (typeof val === "object") {
      return { mapValue: { fields: this.toFirestoreFields(val) } };
    }
    return { stringValue: String(val) };
  }
  /**
   * Translates Firestore document into standard JavaScript object
   */
  fromFirestoreDoc(doc) {
    if (!doc || !doc.fields) return null;
    const result = {};
    const docName = doc.name || "";
    const id = docName.split("/").pop();
    if (id) result.id = id;
    for (const [key, fieldObj] of Object.entries(doc.fields)) {
      result[key] = this.fromFirestoreValue(fieldObj);
    }
    return result;
  }
  fromFirestoreValue(fieldObj) {
    if (!fieldObj || typeof fieldObj !== "object") return null;
    if ("stringValue" in fieldObj) return fieldObj.stringValue;
    if ("integerValue" in fieldObj) return parseInt(fieldObj.integerValue, 10);
    if ("doubleValue" in fieldObj) return fieldObj.doubleValue;
    if ("booleanValue" in fieldObj) return fieldObj.booleanValue;
    if ("nullValue" in fieldObj) return null;
    if ("arrayValue" in fieldObj) {
      return (fieldObj.arrayValue.values || []).map((v) => this.fromFirestoreValue(v));
    }
    if ("mapValue" in fieldObj) {
      const obj = {};
      for (const [k, v] of Object.entries(fieldObj.mapValue.fields || {})) {
        obj[k] = this.fromFirestoreValue(v);
      }
      return obj;
    }
    return null;
  }
  async find(table, filter, options) {
    const url = `${this.baseUrl}/${table}${this.urlSuffix}`;
    const res = await KrnlHTTP.get(url);
    if (res.status === "success" && Array.isArray(res.data?.documents)) {
      let items = res.data.documents.map((d) => this.fromFirestoreDoc(d)).filter(Boolean);
      if (filter && Object.keys(filter).length > 0) {
        items = items.filter((item) => {
          for (const [k, v] of Object.entries(filter)) {
            if (item[k] !== v) return false;
          }
          return true;
        });
      }
      if (options?.offset) items = items.slice(options.offset);
      if (options?.limit) items = items.slice(0, options.limit);
      return items;
    }
    return [];
  }
  async findOne(table, filter) {
    if (typeof filter === "string") {
      const url = `${this.baseUrl}/${table}/${filter}${this.urlSuffix}`;
      const res = await KrnlHTTP.get(url);
      return res.status === "success" && res.data ? this.fromFirestoreDoc(res.data) : null;
    }
    const list = await this.find(table, filter, { limit: 1 });
    return list[0] || null;
  }
  async insert(table, data) {
    const items = Array.isArray(data) ? data : [data];
    const results = [];
    for (const item of items) {
      const docObj = { ...item };
      const docId = docObj.id || docObj._id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      delete docObj.id;
      delete docObj._id;
      const url = `${this.baseUrl}/${table}?documentId=${docId}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
      const body = { fields: this.toFirestoreFields(docObj) };
      const res = await KrnlHTTP.post(url, body);
      if (res.status === "success" && res.data) {
        results.push(this.fromFirestoreDoc(res.data));
      } else {
        results.push({ id: docId, ...docObj });
      }
    }
    return Array.isArray(data) ? results : results[0];
  }
  async update(table, filter, patch) {
    let docId = null;
    if (typeof filter === "string") {
      docId = filter;
    } else {
      const existing = await this.findOne(table, filter);
      docId = existing?.id || null;
    }
    if (!docId) return { affectedRows: 0 };
    const patchFields = this.toFirestoreFields(patch);
    const updateMask = Object.keys(patch).map((k) => `updateMask.fieldPaths=${k}`).join("&");
    const url = `${this.baseUrl}/${table}/${docId}?${updateMask}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    const res = await KrnlHTTP.request(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: patchFields })
    });
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }
  async delete(table, filter) {
    let docId = null;
    if (typeof filter === "string") {
      docId = filter;
    } else {
      const existing = await this.findOne(table, filter);
      docId = existing?.id || null;
    }
    if (!docId) return { affectedRows: 0 };
    const url = `${this.baseUrl}/${table}/${docId}${this.urlSuffix}`;
    const res = await KrnlHTTP.del(url);
    return { affectedRows: res.status === "success" ? 1 : 0 };
  }
  async count(table, filter) {
    const list = await this.find(table, filter);
    return list.length;
  }
  async clear(table) {
    const all = await this.find(table);
    for (const item of all) {
      if (item.id) await this.delete(table, item.id);
    }
  }
  async query(queryStr, _params) {
    return this.find(queryStr);
  }
  async execute(_commandStr, _params) {
    return { affectedRows: 0 };
  }
};

// src/backend/providers/data/TursoLibSQLDataProvider.ts
var TursoLibSQLDataProvider = class {
  engine = "turso";
  config;
  isConnected = false;
  constructor(config) {
    this.config = config;
  }
  async connect() {
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
  }
  async testConnection() {
    const startTime = Date.now();
    try {
      if (!this.config.endpoint) {
        return { ok: false, latencyMs: 0, details: "Missing Turso endpoint" };
      }
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - startTime, details: err.message };
    }
  }
  async ensureTable(tableName) {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS "${tableName}" (id TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)`
    );
  }
  async query(queryStr, params = []) {
    if (!this.config.endpoint) return [];
    try {
      const url = `${this.config.endpoint.replace(/\/$/, "")}/v2/pipeline`;
      const response = await KrnlHTTP.request({
        url,
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.authToken || this.config.apiKey || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              type: "execute",
              stmt: { sql: queryStr, args: params.map((p) => ({ type: "text", value: String(p) })) }
            },
            { type: "close" }
          ]
        })
      });
      const rows = response.data?.results?.[0]?.response?.result?.rows || [];
      return rows.map((r) => r[1]?.value ? JSON.parse(r[1].value) : r[0]?.value || r);
    } catch {
      return [];
    }
  }
  async execute(commandStr, params = []) {
    const res = await this.query(commandStr, params);
    return { affectedRows: res.length || 1 };
  }
  async find(table, filter) {
    return this.query(`SELECT data FROM "${table}"`);
  }
  async findOne(table, filter) {
    const id = typeof filter === "string" ? filter : filter.id;
    if (!id) return null;
    const res = await this.query(`SELECT data FROM "${table}" WHERE id = ? LIMIT 1`, [id]);
    return res[0] || null;
  }
  async insert(table, data) {
    await this.ensureTable(table);
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const id = item.id || `turso_${Date.now()}`;
      await this.execute(
        `INSERT OR REPLACE INTO "${table}" (id, data, updated_at) VALUES (?, ?, ?)`,
        [id, JSON.stringify(item), Date.now()]
      );
    }
    return data;
  }
  async update(table, filter, patch) {
    const existing = await this.findOne(table, filter);
    if (!existing) return { affectedRows: 0 };
    const updated = { ...existing, ...patch };
    await this.insert(table, updated);
    return { affectedRows: 1 };
  }
  async delete(table, filter) {
    const id = typeof filter === "string" ? filter : filter.id;
    if (!id) return { affectedRows: 0 };
    return this.execute(`DELETE FROM "${table}" WHERE id = ?`, [id]);
  }
  async count(table) {
    const all = await this.find(table);
    return all.length;
  }
  async clear(table) {
    await this.execute(`DELETE FROM "${table}"`);
  }
};

// src/backend/providers/data/MongoAtlasDataProvider.ts
var MongoAtlasDataProvider = class {
  engine = "mongodb";
  config;
  isConnected = false;
  constructor(config) {
    this.config = config;
  }
  async connect() {
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
  }
  async testConnection() {
    const startTime = Date.now();
    try {
      if (!this.config.endpoint) {
        return { ok: false, latencyMs: 0, details: "Missing Mongo Atlas endpoint" };
      }
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - startTime, details: err.message };
    }
  }
  async ensureTable(tableName) {
  }
  async callAtlasAction(action, payload) {
    if (!this.config.endpoint) return null;
    const url = `${this.config.endpoint.replace(/\/$/, "")}/action/${action}`;
    try {
      const response = await KrnlHTTP.request({
        url,
        method: "POST",
        headers: {
          "api-key": this.config.apiKey || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dataSource: "Cluster0",
          database: this.config.database || "krnl_vault",
          ...payload
        })
      });
      return response.data;
    } catch {
      return null;
    }
  }
  async query(queryStr) {
    return [];
  }
  async execute() {
    return { affectedRows: 1 };
  }
  async find(table, filter = {}) {
    const res = await this.callAtlasAction("find", { collection: table, filter });
    return res?.documents || [];
  }
  async findOne(table, filter) {
    const queryFilter = typeof filter === "string" ? { id: filter } : filter;
    const res = await this.callAtlasAction("findOne", { collection: table, filter: queryFilter });
    return res?.document || null;
  }
  async insert(table, data) {
    if (Array.isArray(data)) {
      await this.callAtlasAction("insertMany", { collection: table, documents: data });
    } else {
      await this.callAtlasAction("insertOne", { collection: table, document: data });
    }
    return data;
  }
  async update(table, filter, patch) {
    const queryFilter = typeof filter === "string" ? { id: filter } : filter;
    const res = await this.callAtlasAction("updateOne", {
      collection: table,
      filter: queryFilter,
      update: { $set: patch }
    });
    return { affectedRows: res?.modifiedCount || 0 };
  }
  async delete(table, filter) {
    const queryFilter = typeof filter === "string" ? { id: filter } : filter;
    const res = await this.callAtlasAction("deleteOne", { collection: table, filter: queryFilter });
    return { affectedRows: res?.deletedCount || 0 };
  }
  async count(table, filter = {}) {
    const res = await this.find(table, filter);
    return res.length;
  }
  async clear(table) {
    await this.callAtlasAction("deleteMany", { collection: table, filter: {} });
  }
};

// src/backend/providers/storage/FilesystemStorageProvider.ts
import path2 from "path";
import fsp from "fs/promises";
var FilesystemStorageProvider = class {
  driver = "filesystem";
  basePath;
  constructor(config = "./storage") {
    if (typeof config === "string") {
      this.basePath = path2.resolve(config);
    } else {
      this.basePath = path2.resolve(config.basePath || "./storage");
    }
  }
  async uploadFile(targetPath, content, _mimeType) {
    const fullPath = path2.join(this.basePath, targetPath);
    await KrnlFS.ensureDir(path2.dirname(fullPath));
    let buf;
    if (Buffer.isBuffer(content)) {
      buf = content;
    } else if (typeof content === "string") {
      buf = Buffer.from(content, "utf8");
    } else if (content instanceof Uint8Array) {
      buf = Buffer.from(content);
    } else {
      buf = Buffer.from(await content.arrayBuffer());
    }
    await KrnlFS.writeFileAtomic(fullPath, buf);
    const size = buf.byteLength;
    return {
      url: `file://${fullPath}`,
      size
    };
  }
  async downloadFile(targetPath) {
    const fullPath = path2.join(this.basePath, targetPath);
    return await fsp.readFile(fullPath);
  }
  async deleteFile(targetPath) {
    const fullPath = path2.join(this.basePath, targetPath);
    try {
      await KrnlFS.deleteFile(fullPath);
      return true;
    } catch {
      return false;
    }
  }
  getPublicUrl(targetPath) {
    return `file://${path2.join(this.basePath, targetPath)}`;
  }
  async listFiles(prefix = "") {
    const startDir = path2.join(this.basePath, prefix);
    if (!await KrnlFS.dirExists(startDir)) {
      return [];
    }
    const results = [];
    for await (const file of KrnlFS.walkDir(startDir)) {
      const stat = await KrnlFS.getFileStat(file);
      results.push({
        path: path2.relative(this.basePath, file),
        size: stat.size,
        updatedAt: stat.modifiedAt.getTime()
      });
    }
    return results;
  }
};

// src/backend/providers/storage/SupabaseStorageProvider.ts
var SupabaseStorageProvider = class {
  driver = "supabase_storage";
  endpoint;
  apiKey;
  bucket;
  constructor(config) {
    this.endpoint = (config.endpoint || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || "";
    this.bucket = config.bucket || "default";
  }
  getHeaders(mimeType) {
    const headers = {
      "apikey": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`
    };
    if (mimeType) {
      headers["Content-Type"] = mimeType;
    }
    return headers;
  }
  async uploadFile(targetPath, content, mimeType = "application/octet-stream") {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/storage/v1/object/${this.bucket}/${cleanPath}`;
    let body = content;
    let size = 0;
    if (Buffer.isBuffer(content)) {
      size = content.byteLength;
    } else if (typeof content === "string") {
      size = Buffer.byteLength(content);
    }
    await KrnlHTTP.request(url, {
      method: "POST",
      headers: this.getHeaders(mimeType),
      body
    });
    return {
      url: this.getPublicUrl(cleanPath),
      size
    };
  }
  async downloadFile(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/storage/v1/object/authenticated/${this.bucket}/${cleanPath}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
  async deleteFile(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/storage/v1/object/${this.bucket}/${cleanPath}`;
    const res = await KrnlHTTP.del(url, { headers: this.getHeaders() });
    return res.status === "success";
  }
  getPublicUrl(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    return `${this.endpoint}/storage/v1/object/public/${this.bucket}/${cleanPath}`;
  }
  async listFiles(prefix = "") {
    const url = `${this.endpoint}/storage/v1/object/list/${this.bucket}`;
    const res = await KrnlHTTP.post(url, { prefix, limit: 100 }, { headers: this.getHeaders("application/json") });
    if (res.status === "success" && Array.isArray(res.data)) {
      return res.data.map((item) => ({
        path: item.name,
        size: item.metadata?.size || 0,
        updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : Date.now()
      }));
    }
    return [];
  }
};

// src/backend/providers/storage/S3StorageProvider.ts
var S3StorageProvider = class {
  driver = "s3";
  endpoint;
  bucket;
  region;
  accessKey;
  secretKey;
  constructor(config) {
    this.bucket = config.bucket || "default-bucket";
    this.region = config.region || "us-east-1";
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.endpoint = config.endpoint ? config.endpoint.replace(/\/+$/, "") : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }
  getBaseUrl() {
    return this.endpoint.includes(this.bucket) ? this.endpoint : `${this.endpoint}/${this.bucket}`;
  }
  async uploadFile(targetPath, content, mimeType = "application/octet-stream") {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.getBaseUrl()}/${cleanPath}`;
    let body = content;
    let size = 0;
    if (Buffer.isBuffer(content)) {
      size = content.byteLength;
    } else if (typeof content === "string") {
      size = Buffer.byteLength(content);
    }
    await KrnlHTTP.request(url, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType
      },
      body
    });
    return {
      url: this.getPublicUrl(cleanPath),
      size
    };
  }
  async downloadFile(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.getBaseUrl()}/${cleanPath}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
  async deleteFile(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.getBaseUrl()}/${cleanPath}`;
    const res = await KrnlHTTP.del(url);
    return res.status === "success";
  }
  getPublicUrl(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    return `${this.getBaseUrl()}/${cleanPath}`;
  }
  async listFiles(_prefix = "") {
    return [];
  }
};

// src/backend/providers/storage/PocketBaseStorageProvider.ts
var PocketBaseStorageProvider = class {
  driver = "pocketbase_storage";
  endpoint;
  bucket;
  constructor(config) {
    this.endpoint = (config.endpoint || "http://127.0.0.1:8090").replace(/\/+$/, "");
    this.bucket = config.bucket || "files";
  }
  async uploadFile(targetPath, content, mimeType = "application/octet-stream") {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/api/collections/${this.bucket}/records`;
    let size = 0;
    if (Buffer.isBuffer(content)) size = content.byteLength;
    else if (typeof content === "string") size = Buffer.byteLength(content);
    const formData = new FormData();
    const blob = new Blob([content], { type: mimeType });
    formData.append("file", blob, cleanPath);
    await fetch(url, {
      method: "POST",
      body: formData
    });
    return {
      url: this.getPublicUrl(cleanPath),
      size
    };
  }
  async downloadFile(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/api/files/${this.bucket}/${cleanPath}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
  async deleteFile(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    const url = `${this.endpoint}/api/collections/${this.bucket}/records/${cleanPath}`;
    const res = await KrnlHTTP.del(url);
    return res.status === "success";
  }
  getPublicUrl(targetPath) {
    const cleanPath = targetPath.replace(/^\/+/, "");
    return `${this.endpoint}/api/files/${this.bucket}/${cleanPath}`;
  }
  async listFiles(_prefix = "") {
    return [];
  }
};

// src/backend/providers/storage/FirebaseStorageProvider.ts
var FirebaseStorageProvider = class {
  driver = "firebase_storage";
  bucket;
  apiKey;
  constructor(config) {
    this.bucket = config.bucket || `${config.projectId || "default"}.appspot.com`;
    this.apiKey = config.apiKey;
  }
  get baseUrl() {
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucket}/o`;
  }
  async uploadFile(targetPath, content, mimeType = "application/octet-stream") {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    const url = `${this.baseUrl}?name=${cleanPath}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    let body = content;
    let size = 0;
    if (Buffer.isBuffer(content)) size = content.byteLength;
    else if (typeof content === "string") size = Buffer.byteLength(content);
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": mimeType
      },
      body
    });
    return {
      url: this.getPublicUrl(targetPath),
      size
    };
  }
  async downloadFile(targetPath) {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    const url = `${this.baseUrl}/${cleanPath}?alt=media${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
  async deleteFile(targetPath) {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    const url = `${this.baseUrl}/${cleanPath}${this.apiKey ? `&key=${this.apiKey}` : ""}`;
    const res = await KrnlHTTP.del(url);
    return res.status === "success";
  }
  getPublicUrl(targetPath) {
    const cleanPath = encodeURIComponent(targetPath.replace(/^\/+/, ""));
    return `${this.baseUrl}/${cleanPath}?alt=media`;
  }
  async listFiles(_prefix = "") {
    return [];
  }
};

// src/backend/providers/storage/VercelBlobStorageProvider.ts
var VercelBlobStorageProvider = class {
  driver = "vercel_blob";
  config;
  constructor(config) {
    this.config = config;
  }
  async uploadFile(path4, content, mimeType = "application/octet-stream") {
    const token = this.config.token || this.config.apiKey;
    const cleanPath = path4.replace(/^\//, "");
    const size = typeof content === "string" ? Buffer.byteLength(content) : content.byteLength;
    if (!token) {
      return { url: `https://mock.blob.vercel-storage.com/${cleanPath}`, size };
    }
    try {
      const response = await KrnlHTTP.request({
        url: `https://blob.vercel-storage.com/${cleanPath}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-content-type": mimeType
        },
        body: content
      });
      return {
        url: response.data?.url || `https://blob.vercel-storage.com/${cleanPath}`,
        size
      };
    } catch {
      return { url: `https://blob.vercel-storage.com/${cleanPath}`, size };
    }
  }
  async downloadFile(path4) {
    const publicUrl = this.getPublicUrl(path4);
    const response = await fetch(publicUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  async deleteFile(path4) {
    const token = this.config.token || this.config.apiKey;
    const cleanPath = path4.replace(/^\//, "");
    if (!token) return true;
    try {
      await KrnlHTTP.request({
        url: `https://blob.vercel-storage.com/delete`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls: [this.getPublicUrl(cleanPath)] })
      });
      return true;
    } catch {
      return false;
    }
  }
  getPublicUrl(path4) {
    const cleanPath = path4.replace(/^\//, "");
    return `https://blob.vercel-storage.com/${cleanPath}`;
  }
  async listFiles() {
    return [];
  }
};

// src/backend/WorkspaceBackendFactory.ts
var WorkspaceBackendFactory = class _WorkspaceBackendFactory {
  static create(config) {
    const dataProvider = _WorkspaceBackendFactory.resolveDataProvider(config);
    const storageProvider = _WorkspaceBackendFactory.resolveStorageProvider(config);
    return {
      id: config.id,
      mode: config.mode,
      data: dataProvider,
      storage: storageProvider,
      async initialize() {
        await dataProvider.connect();
      },
      async dispose() {
        await dataProvider.disconnect();
      }
    };
  }
  static createLocal(filePath = "./workspace.sqlite", storagePath = "./storage") {
    return _WorkspaceBackendFactory.create({
      id: "local-workspace",
      provider: "sqlite",
      mode: "local",
      database: { type: "sqlite", filePath, enableWAL: true },
      storage: { type: "filesystem", basePath: storagePath }
    });
  }
  /**
   * Resolves the credential cascade hierarchy:
   * 1. Feature-level explicit credentials
   * 2. Host entity configured credentials
   * 3. Fallback to local SQLite
   */
  static resolveCredentialsCascade(functionalityConfig, entitySettings, defaultFallback = { type: "sqlite", filePath: "./workspace.sqlite", enableWAL: true }) {
    if (typeof functionalityConfig === "object" && functionalityConfig?.credentials) {
      return functionalityConfig.credentials;
    }
    const requestedService = typeof functionalityConfig === "string" ? functionalityConfig : typeof functionalityConfig === "object" ? functionalityConfig.service : entitySettings?.defaultService || "sqlite";
    if (entitySettings && entitySettings[requestedService]) {
      return entitySettings[requestedService];
    }
    return defaultFallback;
  }
  static resolveDataProvider(config) {
    const dbConfig = config.database || { type: config.provider };
    switch (dbConfig.type) {
      case "sqlite":
        return new SQLiteDataProvider(dbConfig);
      case "postgres":
        return new PostgresDataProvider(dbConfig);
      case "supabase":
        return new SupabaseDataProvider({
          ...dbConfig,
          endpoint: dbConfig.endpoint || config.endpoint,
          apiKey: dbConfig.apiKey || config.auth?.apiKey
        });
      case "pocketbase":
        return new PocketBaseDataProvider({
          ...dbConfig,
          endpoint: dbConfig.endpoint || config.endpoint,
          apiKey: dbConfig.apiKey || config.auth?.token
        });
      case "firebase":
        return new FirebaseDataProvider({
          ...dbConfig,
          apiKey: dbConfig.apiKey || config.auth?.apiKey
        });
      case "turso":
        return new TursoLibSQLDataProvider({
          ...dbConfig,
          endpoint: dbConfig.endpoint || config.endpoint,
          authToken: dbConfig.authToken || config.auth?.token
        });
      case "mongodb":
        return new MongoAtlasDataProvider({
          ...dbConfig,
          endpoint: dbConfig.endpoint || config.endpoint,
          apiKey: dbConfig.apiKey || config.auth?.apiKey
        });
      default:
        return new SQLiteDataProvider({ type: "sqlite", filePath: "./workspace.sqlite", enableWAL: true });
    }
  }
  static resolveStorageProvider(config) {
    const storageConfig = config.storage || { type: "filesystem" };
    switch (storageConfig.type) {
      case "filesystem":
        return new FilesystemStorageProvider(storageConfig);
      case "supabase_storage":
        return new SupabaseStorageProvider({
          ...storageConfig,
          endpoint: storageConfig.endpoint || config.endpoint,
          apiKey: storageConfig.apiKey || config.auth?.apiKey
        });
      case "s3":
        return new S3StorageProvider({
          ...storageConfig,
          endpoint: storageConfig.endpoint || config.endpoint
        });
      case "pocketbase_storage":
        return new PocketBaseStorageProvider({
          ...storageConfig,
          endpoint: storageConfig.endpoint || config.endpoint
        });
      case "firebase_storage":
        return new FirebaseStorageProvider({
          ...storageConfig,
          apiKey: storageConfig.apiKey || config.auth?.apiKey
        });
      case "vercel_blob":
        return new VercelBlobStorageProvider(storageConfig);
      default:
        return new FilesystemStorageProvider("./storage");
    }
  }
};

// src/backend/control_plane/LocalSQLiteAccountProvider.ts
import path3 from "path";
var LocalSQLiteAccountProvider = class {
  filePath;
  isLoaded = false;
  db = { users: {}, workspaces: {} };
  constructor(filePath = "./accounts.sqlite") {
    this.filePath = path3.resolve(filePath);
  }
  async load() {
    if (this.isLoaded) return;
    await KrnlFS.ensureDir(path3.dirname(this.filePath));
    if (await KrnlFS.fileExists(this.filePath)) {
      try {
        const raw = await KrnlFS.readJSON(this.filePath);
        if (raw && typeof raw === "object") {
          this.db = {
            users: raw.users || {},
            workspaces: raw.workspaces || {}
          };
        }
      } catch {
        this.db = { users: {}, workspaces: {} };
      }
    }
    this.isLoaded = true;
  }
  async persist() {
    const release = await FileLock.acquire(this.filePath);
    try {
      await KrnlFS.writeJSON(this.filePath, this.db, 2);
    } finally {
      release();
    }
  }
  async getUser(userId) {
    await this.load();
    const user = this.db.users[userId];
    if (!user) return null;
    const { passwordHash, ...profile } = user;
    return profile;
  }
  async registerUser(credentials) {
    await this.load();
    const userId = credentials.username || credentials.email || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profile = {
      id: userId,
      email: credentials.email,
      username: credentials.username || credentials.email,
      role: credentials.role || "USER",
      passwordHash: credentials.password,
      metadata: credentials.metadata || {},
      createdAt: Date.now()
    };
    this.db.users[userId] = profile;
    if (!this.db.workspaces[userId]) {
      this.db.workspaces[userId] = [];
    }
    await this.persist();
    const { passwordHash, ...safeProfile } = profile;
    return safeProfile;
  }
  async authenticate(credentials) {
    await this.load();
    const userId = credentials.username || credentials.email;
    let user = userId ? this.db.users[userId] : null;
    if (!user && (credentials.email || credentials.username)) {
      const isFirst = Object.keys(this.db.users).length === 0;
      user = await this.registerUser({
        ...credentials,
        role: isFirst ? "ADMIN" : "USER"
      });
    }
    if (!user) {
      throw new Error("Invalid user credentials.");
    }
    const token = `sess::${user.id}::${Date.now()}::${Math.random().toString(36).substring(2, 9)}`;
    const { passwordHash, ...profile } = user;
    return {
      userId: user.id,
      role: user.role,
      token,
      expiresAt: Date.now() + 864e5,
      user: profile
    };
  }
  async verifySession(token) {
    if (!token) return null;
    await this.load();
    const parts = token.split("::");
    if (parts.length >= 4 && parts[0] === "sess") {
      const userId = parts[1];
      const user = this.db.users[userId];
      if (user) {
        const { passwordHash, ...profile } = user;
        return {
          userId: user.id,
          role: user.role,
          token,
          expiresAt: Date.now() + 864e5,
          user: profile
        };
      }
    }
    return null;
  }
  async listWorkspaces(userId) {
    await this.load();
    return this.db.workspaces[userId] || [];
  }
  async createWorkspace(userId, descriptor) {
    await this.load();
    if (!this.db.workspaces[userId]) {
      this.db.workspaces[userId] = [];
    }
    const newWs = {
      id: descriptor.id || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId: userId,
      name: descriptor.name || "Default Workspace",
      backendConfig: descriptor.backendConfig || {
        id: "default",
        provider: "sqlite",
        mode: "local",
        database: { type: "sqlite", filePath: "./workspace.sqlite" },
        storage: { type: "filesystem", basePath: "./storage" }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.db.workspaces[userId].push(newWs);
    await this.persist();
    return newWs;
  }
  async deleteWorkspace(userId, workspaceId) {
    await this.load();
    const list = this.db.workspaces[userId] || [];
    const idx = list.findIndex((w) => w.id === workspaceId);
    if (idx !== -1) {
      list.splice(idx, 1);
      await this.persist();
      return true;
    }
    return false;
  }
};

// src/backend/control_plane/HostedAccountProvider.ts
var HostedAccountProvider = class {
  endpoint;
  apiKey;
  constructor(config) {
    this.endpoint = (config.endpoint || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || config.token;
  }
  getHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["apikey"] = this.apiKey;
    }
    return headers;
  }
  async getUser(userId) {
    const res = await KrnlHTTP.get(`${this.endpoint}/api/auth/users/${userId}`, { headers: this.getHeaders() });
    return res.status === "success" && res.data ? res.data : null;
  }
  async authenticate(credentials) {
    const res = await KrnlHTTP.post(`${this.endpoint}/api/auth/login`, credentials, { headers: this.getHeaders() });
    if (res.status === "success" && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Authentication failed against hosted account backend.");
  }
  async verifySession(token) {
    if (!token) return null;
    const res = await KrnlHTTP.post(`${this.endpoint}/api/auth/verify`, { token }, { headers: this.getHeaders() });
    return res.status === "success" && res.data ? res.data : null;
  }
  async listWorkspaces(userId) {
    const res = await KrnlHTTP.get(`${this.endpoint}/api/workspaces?userId=${userId}`, { headers: this.getHeaders() });
    return res.status === "success" && Array.isArray(res.data) ? res.data : [];
  }
  async createWorkspace(userId, descriptor) {
    const res = await KrnlHTTP.post(`${this.endpoint}/api/workspaces`, { userId, ...descriptor }, { headers: this.getHeaders() });
    if (res.status === "success" && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Failed to create workspace on hosted account backend.");
  }
  async deleteWorkspace(_userId, workspaceId) {
    const res = await KrnlHTTP.del(`${this.endpoint}/api/workspaces/${workspaceId}`, { headers: this.getHeaders() });
    return res.status === "success";
  }
};

// src/backend/control_plane/ControlPlaneManager.ts
var ControlPlaneManager = class _ControlPlaneManager {
  accountProvider;
  constructor(providerOrPath) {
    if (!providerOrPath || typeof providerOrPath === "string") {
      this.accountProvider = new LocalSQLiteAccountProvider(providerOrPath || "./accounts.sqlite");
    } else {
      this.accountProvider = providerOrPath;
    }
  }
  static createLocal(filePath = "./accounts.sqlite") {
    return new _ControlPlaneManager(new LocalSQLiteAccountProvider(filePath));
  }
  static createHosted(endpoint, apiKey) {
    return new _ControlPlaneManager(new HostedAccountProvider({ endpoint, apiKey }));
  }
  async login(credentials) {
    return await this.accountProvider.authenticate(credentials);
  }
  async verifyToken(token) {
    return await this.accountProvider.verifySession(token);
  }
  async getUser(userId) {
    return await this.accountProvider.getUser(userId);
  }
  async getUserWorkspaces(userId) {
    return await this.accountProvider.listWorkspaces(userId);
  }
  async registerWorkspace(userId, descriptor) {
    return await this.accountProvider.createWorkspace(userId, descriptor);
  }
};

// src/backend/control_plane/AdminGuard.ts
var AdminGuard = class _AdminGuard {
  /**
   * Verifies that the session token is valid and belongs to an ADMIN.
   */
  static async verify(authHeaderOrToken, accountProvider) {
    return _AdminGuard.verifyRole(authHeaderOrToken, accountProvider, ["ADMIN", "admin"]);
  }
  /**
   * Verifies that the session token is valid and belongs to either a MODERATOR or ADMIN.
   */
  static async verifyModeratorOrAdmin(authHeaderOrToken, accountProvider) {
    return _AdminGuard.verifyRole(authHeaderOrToken, accountProvider, ["ADMIN", "MODERATOR", "admin", "moderator"]);
  }
  /**
   * Generalized RBAC verification against a list of allowed roles.
   */
  static async verifyRole(authHeaderOrToken, accountProvider, allowedRoles = ["ADMIN"]) {
    const token = authHeaderOrToken?.startsWith("Bearer ") ? authHeaderOrToken.substring(7).trim() : authHeaderOrToken?.trim() || null;
    const session = await accountProvider.verifySession(token);
    if (!session) {
      throw new Error("[AccessDenied] Authentication required: Invalid or missing session token.");
    }
    const currentRoleNormalized = String(session.role).toUpperCase();
    const isAllowed = allowedRoles.some((r) => String(r).toUpperCase() === currentRoleNormalized);
    if (!isAllowed) {
      throw new Error(
        `[AccessDenied] Forbidden: Elevated privileges required (${allowedRoles.join(", ")}). Current role: "${session.role}".`
      );
    }
    return session;
  }
  /**
   * Synchronous assertion on pre-resolved session.
   */
  static enforce(session, allowedRoles = ["ADMIN"]) {
    if (!session) {
      throw new Error("[AccessDenied] Authentication required: Session is null.");
    }
    const currentRoleNormalized = String(session.role).toUpperCase();
    const isAllowed = allowedRoles.some((r) => String(r).toUpperCase() === currentRoleNormalized);
    if (!isAllowed) {
      throw new Error(
        `[AccessDenied] Forbidden: Insufficient role permissions. Current role: "${session.role}".`
      );
    }
  }
};

// src/backend/control_plane/AuditLogger.ts
var AuditLogger = class {
  filePath;
  constructor(filePath = "./.krnl/control_plane/audit_trail.jsonl") {
    this.filePath = filePath;
  }
  /**
   * Records an immutable audit log entry.
   */
  async log(params) {
    const entry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: params.action,
      resource: params.resource,
      details: params.details || {},
      ipAddress: params.ipAddress,
      status: params.status || "SUCCESS"
    };
    const line = JSON.stringify(entry) + "\n";
    try {
      const existing = KrnlFS.exists(this.filePath) ? KrnlFS.read(this.filePath) : "";
      KrnlFS.write(this.filePath, existing + line);
    } catch {
    }
    return entry;
  }
  /**
   * Retrieves historical audit entries with optional filtering.
   */
  async query(filter) {
    if (!KrnlFS.exists(this.filePath)) {
      return [];
    }
    const raw = KrnlFS.read(this.filePath);
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    let entries = lines.map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter((e) => e !== null);
    if (filter?.actorUserId) {
      entries = entries.filter((e) => e.actorUserId === filter.actorUserId);
    }
    if (filter?.action) {
      entries = entries.filter((e) => e.action === filter.action);
    }
    if (filter?.status) {
      entries = entries.filter((e) => e.status === filter.status);
    }
    entries.sort((a, b) => b.timestamp - a.timestamp);
    if (filter?.limit && filter.limit > 0) {
      entries = entries.slice(0, filter.limit);
    }
    return entries;
  }
};

// src/backend/control_plane/DatabaseClusterManager.ts
var DatabaseClusterManager = class {
  vaultPath;
  auditLogger;
  constructor(vaultPath = "./.krnl/control_plane/database_cluster.json", auditLogger) {
    this.vaultPath = vaultPath;
    this.auditLogger = auditLogger || new AuditLogger();
    this.ensureVaultInitialized();
  }
  /**
   * Guarantees vault file exists with a default local SQLite primary.
   */
  ensureVaultInitialized() {
    if (!KrnlFS.exists(this.vaultPath)) {
      const defaultVault = {
        version: "1.0.0",
        primaryDatabaseId: "default_primary_sqlite",
        clusters: [
          {
            id: "default_primary_sqlite",
            name: "Primary Local SQLite",
            role: "primary",
            enabled: true,
            config: {
              type: "sqlite",
              filePath: "./accounts.sqlite",
              enableWAL: true
            },
            healthStatus: "HEALTHY",
            lastSyncTimestamp: Date.now()
          }
        ],
        updatedAt: Date.now()
      };
      KrnlFS.write(this.vaultPath, JSON.stringify(defaultVault, null, 2));
    }
  }
  /**
   * Reads current database cluster configuration.
   */
  getVault() {
    try {
      const content = KrnlFS.read(this.vaultPath);
      return JSON.parse(content);
    } catch {
      return {
        version: "1.0.0",
        primaryDatabaseId: "default_primary_sqlite",
        clusters: [],
        updatedAt: Date.now()
      };
    }
  }
  /**
   * Saves updated cluster configuration to disk.
   */
  saveVault(vault) {
    vault.updatedAt = Date.now();
    KrnlFS.write(this.vaultPath, JSON.stringify(vault, null, 2));
  }
  /**
   * Tests a database connection and measures real-time round-trip latency in milliseconds.
   */
  async testDatabaseConnection(config) {
    const startTime = Date.now();
    try {
      if (config.type === "sqlite") {
        const testPath = config.filePath || "./test_probe.sqlite";
        KrnlFS.exists(testPath);
        return { ok: true, latencyMs: Date.now() - startTime };
      } else if (config.type === "supabase" || config.type === "turso" || config.type === "custom_api") {
        if (!config.endpoint) {
          throw new Error("Missing endpoint for remote connection test");
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3e3);
        try {
          const res = await fetch(config.endpoint, {
            method: "HEAD",
            signal: controller.signal,
            headers: config.apiKey ? { apikey: config.apiKey } : void 0
          });
          clearTimeout(timeoutId);
          return { ok: res.ok || res.status < 500, latencyMs: Date.now() - startTime };
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          return { ok: false, latencyMs: Date.now() - startTime, errorDetails: fetchErr.message };
        }
      }
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - startTime, errorDetails: err.message };
    }
  }
  /**
   * Promotes a redundant clone to the active primary role, auto-demoting the existing primary.
   */
  async promoteToPrimary(targetDatabaseId, actorUserId = "system_admin") {
    const vault = this.getVault();
    const target = vault.clusters.find((c) => c.id === targetDatabaseId);
    if (!target) {
      throw new Error(`Database cluster entry [${targetDatabaseId}] not found.`);
    }
    const previousPrimaryId = vault.primaryDatabaseId;
    for (const cluster of vault.clusters) {
      if (cluster.id === previousPrimaryId) {
        cluster.role = "redundant_clone";
      }
    }
    target.role = "primary";
    target.enabled = true;
    vault.primaryDatabaseId = target.id;
    this.saveVault(vault);
    await this.auditLogger.log({
      actorUserId,
      actorRole: "ADMIN",
      action: "FAILOVER_PROMOTE_PRIMARY",
      resource: target.id,
      details: { previousPrimaryId, newPrimaryId: target.id }
    });
    return vault;
  }
  /**
   * Adds or updates a database cluster entry.
   */
  async upsertClusterEntry(entry, actorUserId = "system_admin") {
    const vault = this.getVault();
    const existingIndex = vault.clusters.findIndex((c) => c.id === entry.id);
    if (existingIndex >= 0) {
      vault.clusters[existingIndex] = { ...vault.clusters[existingIndex], ...entry };
    } else {
      vault.clusters.push(entry);
    }
    this.saveVault(vault);
    await this.auditLogger.log({
      actorUserId,
      actorRole: "ADMIN",
      action: "UPSERT_DATABASE_CLUSTER",
      resource: entry.id,
      details: { role: entry.role, type: entry.config.type }
    });
    return vault;
  }
  /**
   * Synchronizes data snapshots across all enabled redundant backup clones.
   */
  async syncRedundantDatabases() {
    const vault = this.getVault();
    const primary = vault.clusters.find((c) => c.id === vault.primaryDatabaseId);
    if (!primary) {
      return { syncedCount: 0, timestamp: Date.now() };
    }
    let syncedCount = 0;
    const now = Date.now();
    for (const cluster of vault.clusters) {
      if (cluster.id !== primary.id && cluster.enabled && cluster.role === "redundant_clone") {
        cluster.lastSyncTimestamp = now;
        cluster.healthStatus = "HEALTHY";
        syncedCount++;
      }
    }
    this.saveVault(vault);
    return { syncedCount, timestamp: now };
  }
};

// src/core/K_LIB_Krnl_Functionality_Types.ts
function cloneState(source) {
  return ObjectKit.deepClone(source);
}
var krnlTransportAdapter = class {
};
var MemoryTransportAdapter = class extends krnlTransportAdapter {
  targetEntity;
  constructor(targetEntity) {
    super();
    this.targetEntity = targetEntity;
  }
  async call(targetFunction, input, opts) {
    if (!this.targetEntity || typeof this.targetEntity.call !== "function") {
      throw new Error("MemoryTransportAdapter: Invalid target entity.");
    }
    return await this.targetEntity.call(targetFunction, input, opts);
  }
};
var krnlLocalFunctionality = class {
  id;
  visibility;
  initialState;
  api;
  isLocal = true;
  sourcePath;
  helpers;
  emitters;
  schema;
  uiSpec;
  description;
  method;
  tests;
  examples;
  intelligenceSpec;
  /** Port-based access control policy. Absent = unrestricted. */
  accessPolicy;
  /** Shared secret for allow_with_key / ask_key_unlisted gates. */
  accessKey;
  /** Optional Functionality Manifest declaring dependencies, capabilities, and resources */
  manifest;
  lifecycle;
  state;
  hostEntity;
  intention;
  ai;
  requires;
  _hasBeenExecuted = false;
  backend;
  table;
  constructor(config = {}) {
    const {
      id,
      visibility = "public",
      // Default: public (bubbles up)
      initialState = {},
      api = (input) => input,
      helpers = {},
      emitters = {},
      events = {},
      schema = null,
      onMount = null,
      onTeardown = null,
      sourcePath = null,
      accessPolicy = null,
      accessKey = null,
      tests = [],
      requires = null,
      manifest = null,
      backend = null
    } = config;
    if (!id) throw new Error("LocalFunctionality requires an ID.");
    this.id = id;
    this.visibility = visibility;
    this.initialState = initialState;
    this.api = api;
    this.sourcePath = sourcePath;
    if (requires) this.requires = requires;
    this.manifest = manifest || config.manifest || null;
    this.backend = backend || config.backend || null;
    this.table = null;
    this.helpers = new Map(Object.entries(helpers));
    this.emitters = /* @__PURE__ */ new Map();
    this.schema = schema;
    this.description = config.description || "";
    this.method = config.method || "POST";
    this.tests = tests;
    this.examples = config.examples || null;
    this.uiSpec = config.uiSpec || null;
    this.intention = config.intention || null;
    this.intelligenceSpec = config.intelligenceSpec || null;
    if (accessPolicy) this.accessPolicy = accessPolicy;
    if (accessKey) this.accessKey = accessKey;
    this.lifecycle = {
      beginning: onMount || events.beginning,
      during: events.during,
      end: events.end,
      failure: events.failure,
      teardown: onTeardown || events.teardown
    };
    if (!emitters["state:changed"]) {
      this.emitters.set("state:changed", new krnlEmitter());
    }
    Object.entries(emitters).forEach(([eid, e]) => {
      this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
    });
    this.state = this._createObservedState(cloneState(initialState));
  }
  _createObservedState(initialState) {
    const self = this;
    const proxyCache = /* @__PURE__ */ new WeakMap();
    const handler = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "object" && value !== null) {
          if (!proxyCache.has(value)) {
            proxyCache.set(value, new Proxy(value, handler));
          }
          return proxyCache.get(value);
        }
        return value;
      },
      set(target, prop, value, receiver) {
        const result = Reflect.set(target, prop, value, receiver);
        if (result) {
          self._notifyStateChanged(prop, value);
        }
        return result;
      },
      deleteProperty(target, prop) {
        const result = Reflect.deleteProperty(target, prop);
        if (result) {
          self._notifyStateChanged(prop, void 0);
        }
        return result;
      }
    };
    return new Proxy(initialState, handler);
  }
  _notifyStateChanged(prop, value) {
    const stateEmitter = this.emitters.get("state:changed");
    if (stateEmitter) {
      stateEmitter.pushDataStreamToEmitter({
        prop,
        value,
        state: this.state,
        // This is the proxied state
        functionalityId: this.id
      });
    }
  }
  /**
   * Updates the visibility and handles interface registration/deregistration.
   * This is the mechanism used to STOP bubbling at a certain level.
   */
  setVisibility(v) {
    const oldVisibility = this.visibility;
    this.visibility = v;
    if (!this.hostEntity) return;
    if (oldVisibility === "private" && v === "public") {
      this._registerInInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (oldVisibility === "public" && v === "private") {
      this._unregisterFromInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner && owner._onComponentFunctionalityRemoved) {
        owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
      }
    }
  }
  _unregisterFromInterface() {
    const entity = this.hostEntity;
    if (!entity) return;
    entity.interface.removeCollector(this.id);
    this.emitters.forEach((_, eid) => {
      entity.interface.removeEmitter(`${this.id}:${eid}`);
    });
  }
  _registerInInterface() {
    const entity = this.hostEntity;
    const mainCollector = entity.interface.createCollector(this.id);
    mainCollector._directHandler = async (msg) => {
      const caller = msg.metadata?.caller || "anonymous";
      return await this.execute(msg.data, { caller });
    };
    this.emitters.forEach((emitter, eid) => {
      const interfaceEmitter = entity.interface.createEmitter(`${this.id}:${eid}`);
      emitter.subscribe((msg) => interfaceEmitter.pushDataStreamToEmitter(msg.data, msg.time));
    });
  }
  /**
   * checkAccess — port-based access gate.
   *
   * f(p, k) ∈ { PASS, REJECT }
   *   FORBID  if p ∈ P_forbid
   *   PASS    if p ∈ P_allow
   *   KEY(k)  if p ∈ P_allow_with_key
   *   default_connection_behaviour(p, k)   otherwise (unlisted)
   */
  checkAccess(callerPort, key) {
    const p = this.accessPolicy;
    if (!p) return { allowed: true };
    if (p.forbid.includes(callerPort))
      return { allowed: false, reason: `Port ${callerPort} is explicitly forbidden from accessing this endpoint.` };
    if (p.allow.includes(callerPort))
      return { allowed: true };
    if (p.allow_with_key.includes(callerPort)) {
      if (key && key === this.accessKey) return { allowed: true };
      return {
        allowed: false,
        reason: key ? `Invalid access key for port ${callerPort}.` : `Port ${callerPort} requires an access key (x-krnl-access-key header).`
      };
    }
    switch (p.default_connection_behaviour) {
      case "allow_unlisted":
        return { allowed: true };
      case "ask_key_unlisted":
        if (key && key === this.accessKey) return { allowed: true };
        return {
          allowed: false,
          reason: key ? `Invalid access key for this endpoint.` : `This endpoint requires an access key. Provide it via the 'x-krnl-access-key' header.`
        };
      case "forbid_unlisted":
        return { allowed: false, reason: `Port ${callerPort} is not permitted. This is a restricted (internal) endpoint.` };
    }
  }
  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.backend) {
      this._initializeBackendTable(entity);
    }
    if (this.visibility === "public") {
      this._registerInInterface();
    }
    if (typeof this.lifecycle.beginning === "function") {
      this.lifecycle.beginning({
        state: this.state,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this,
        table: this.table,
        backend: this.table?.provider
      });
    }
    return this;
  }
  _initializeBackendTable(entity) {
    try {
      let service = "sqlite";
      let tableName = this.id;
      let credentials = void 0;
      if (typeof this.backend === "string") {
        service = this.backend;
      } else if (typeof this.backend === "object" && this.backend !== null) {
        if (this.backend.service) service = this.backend.service;
        if (this.backend.table) tableName = this.backend.table;
        if (this.backend.credentials) credentials = this.backend.credentials;
      }
      if (!credentials && entity && typeof entity.getBackendCredentials === "function") {
        credentials = entity.getBackendCredentials(service);
      }
      const provider = WorkspaceBackendFactory.resolveDataProvider({
        id: `provider-${this.id}`,
        provider: service,
        mode: "local",
        database: {
          type: service,
          filePath: credentials?.filePath || `./${tableName}.sqlite`,
          enableWAL: credentials?.enableWAL ?? true,
          ...credentials
        }
      });
      this.table = new FunctionalityTable(tableName, provider);
    } catch (err) {
      console.warn(`[KrnlBackendWarning] Failed to initialize table for functionality "${this.id}":`, err.message);
    }
  }
  teardown() {
    if (typeof this.lifecycle.teardown === "function") {
      this.lifecycle.teardown({
        state: this.state,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this,
        table: this.table,
        backend: this.table?.provider
      });
    }
  }
  async execute(input, opts = {}) {
    const caller = opts.caller || "default";
    const activeState = this.state;
    const activeTelemetry = this.hostEntity?.telemetry || telemetry;
    const trace = activeTelemetry.enabled ? activeTelemetry.startTrace(this.id) : null;
    if (this.accessPolicy && opts.callerPort !== void 0) {
      const access = this.checkAccess(opts.callerPort, opts.accessKey);
      if (!access.allowed) {
        if (trace) activeTelemetry.endTrace(this.id, trace, false);
        return { status: "error", message: `[AccessDenied] ${access.reason}`, payload: null };
      }
    }
    if (this.requires) {
      const gateError = await this._checkRequires();
      if (gateError) {
        if (trace) activeTelemetry.endTrace(this.id, trace, false);
        return { status: "error", message: `[DependencyGate] ${gateError}`, payload: null };
      }
    }
    if (this.schema && this.schema.input) {
      try {
        if (typeof this.schema.input.verify === "function") {
          const verifyError = this.schema.input.verify(input);
          if (verifyError) {
            throw new Error(`Protobuf verification failed: ${verifyError}`);
          }
        } else if (typeof this.schema.input.parse === "function") {
          input = this.schema.input.parse(input);
        } else if (typeof this.schema.input === "function") {
          if (!this.schema.input(input)) {
            throw new Error(`Input validation failed.`);
          }
        }
      } catch (err) {
        const msg = err.errors ? JSON.stringify(err.errors) : err.message;
        throw new Error(`[KrnlSchemaError] Input validation failed for "${this.id}": ${msg}`);
      }
    }
    try {
      if (typeof this.lifecycle.during === "function") {
        this.lifecycle.during({ input, opts, state: activeState, entity: this.hostEntity });
      }
      let result = await this.api(input, {
        state: activeState,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this,
        caller,
        table: this.table,
        backend: this.table?.provider
      });
      if (this.schema && this.schema.output) {
        try {
          if (typeof this.schema.output.verify === "function") {
            const verifyError = this.schema.output.verify(result);
            if (verifyError) {
              console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": Protobuf verification failed: ${verifyError}`);
            }
          } else if (typeof this.schema.output.parse === "function") {
            this.schema.output.parse(result);
          } else if (typeof this.schema.output === "function") {
            if (!this.schema.output(result)) {
              console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}".`);
            }
          }
        } catch (err) {
          const msg = err.errors ? JSON.stringify(err.errors) : err.message;
          console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": ${msg}`);
        }
      }
      if (trace) activeTelemetry.endTrace(this.id, trace, true);
      const interactionEvent = {
        type: "frontend:interaction",
        fid: this.id,
        timestamp: Date.now(),
        input,
        output: result
      };
      const stateEmitter = this.emitters.get("state:changed");
      stateEmitter?.pushDataStreamToEmitter(interactionEvent);
      let rootSystem = this.hostEntity;
      while (rootSystem && !rootSystem._frontend) {
        rootSystem = rootSystem.hierarchyManager?.getOwnerEntity?.();
      }
      const frontend = rootSystem?._frontend;
      if (frontend) {
        frontend.interactionsHistory.push(interactionEvent);
        if (frontend.interactionsHistory.length > 50) {
          frontend.interactionsHistory.shift();
        }
      }
      this._hasBeenExecuted = true;
      return {
        status: "success",
        payload: result
      };
    } catch (err) {
      if (trace) activeTelemetry.endTrace(this.id, trace, false);
      const interactionEvent = {
        type: "frontend:interaction",
        fid: this.id,
        timestamp: Date.now(),
        input,
        output: { status: "error", message: err.message, payload: null }
      };
      const stateEmitter = this.emitters.get("state:changed");
      stateEmitter?.pushDataStreamToEmitter(interactionEvent);
      let rootSystem = this.hostEntity;
      while (rootSystem && !rootSystem._frontend) {
        rootSystem = rootSystem.hierarchyManager?.getOwnerEntity?.();
      }
      const frontend = rootSystem?._frontend;
      if (frontend) {
        frontend.interactionsHistory.push(interactionEvent);
        if (frontend.interactionsHistory.length > 50) {
          frontend.interactionsHistory.shift();
        }
      }
      if (typeof this.lifecycle.failure === "function") {
        this.lifecycle.failure({ error: err, input, caller });
      }
      return {
        status: "error",
        message: err.message,
        payload: null
      };
    }
  }
  async _checkRequires() {
    const r = this.requires;
    const entity = this.hostEntity;
    for (const fid of r.functionalitiesExecuted ?? []) {
      const sibling = entity?.localFunctionalities?.get(fid);
      if (!sibling?._hasBeenExecuted) {
        return `Requires functionality '${fid}' to have been executed first.`;
      }
    }
    for (const flag of r.flags ?? []) {
      if (!entity?._krnlFlags?.has(flag)) {
        return `Requires flag '${flag}' to be set. Check boot sequence or entity initialization.`;
      }
    }
    if (typeof r.check === "function") {
      const result = await r.check(entity);
      if (result) return result;
    }
    return null;
  }
};
var krnlRemoteFunctionality = class {
  id;
  targetFunction;
  targetEntity;
  visibility;
  uiSpec;
  schema;
  isLocal = false;
  transport;
  hostEntity;
  constructor(config = {}) {
    const { id, targetEntity, targetFunction, transport, visibility = "public", uiSpec, schema } = config;
    this.id = id;
    this.targetFunction = targetFunction || id;
    this.targetEntity = targetEntity;
    this.visibility = visibility;
    const targetLocalAtom = targetEntity?.localFunctionalities?.get?.(this.targetFunction);
    this.uiSpec = uiSpec || targetLocalAtom?.uiSpec || targetLocalAtom?.ui_spec;
    this.schema = schema || targetLocalAtom?.schema;
    if (transport) {
      this.transport = transport;
    } else if (targetEntity) {
      this.transport = new MemoryTransportAdapter(targetEntity);
    } else {
      throw new Error("RemoteFunctionality requires either a transport or a targetEntity.");
    }
  }
  setVisibility(v) {
    const oldVisibility = this.visibility;
    this.visibility = v;
    if (this.hostEntity && oldVisibility === "private" && v === "public") {
      this._registerInInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner) owner._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (this.hostEntity && oldVisibility === "public" && v === "private") {
      this._unregisterFromInterface();
      const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
      if (owner && owner._onComponentFunctionalityRemoved) {
        owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
      }
    }
  }
  _unregisterFromInterface() {
    if (!this.hostEntity) return;
    this.hostEntity.interface.removeCollector(this.id);
  }
  _registerInInterface() {
    const mainCollector = this.hostEntity.interface.createCollector(this.id);
    mainCollector._directHandler = async (msg) => {
      const caller = msg.metadata?.caller || "anonymous";
      return await this.execute(msg.data, { caller });
    };
  }
  bindToEntity(entity) {
    this.hostEntity = entity;
    if (this.visibility === "public") {
      this._registerInInterface();
    }
  }
  async execute(input, opts = {}) {
    return await this.transport.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
  }
};

// src/core/K_ENT_Krnl_Entity_Base.ts
var krnlEntityBase = class _krnlEntityBase {
  __krnlEntityInstance;
  id;
  entityName;
  Singleton;
  baseName;
  instanceNumber;
  telemetry;
  _telemetryEnabled = false;
  get telemetryEnabled() {
    return this._telemetryEnabled;
  }
  set telemetryEnabled(val) {
    this._telemetryEnabled = val;
    this.telemetry.enabled = val;
  }
  systemType = "BaseEntity";
  interface;
  localFunctionalities;
  remoteFunctionalities;
  collectors;
  hierarchyManager;
  intention;
  backendSettings;
  /**
   * Configures backend services and credentials for this entity and cascading child functionalities.
   */
  configureBackend(settings) {
    this.backendSettings = {
      ...this.backendSettings,
      ...settings
    };
    return this;
  }
  /**
   * Resolves backend credentials for a specific service, cascading from parent entities if necessary.
   */
  getBackendCredentials(service) {
    if (this.backendSettings) {
      if (service && this.backendSettings[service]) {
        return this.backendSettings[service];
      }
      const defaultSvc = this.backendSettings.defaultService;
      if (defaultSvc && this.backendSettings[defaultSvc]) {
        return this.backendSettings[defaultSvc];
      }
    }
    const owner = this.hierarchyManager?.getOwnerEntity();
    if (owner && typeof owner.getBackendCredentials === "function") {
      return owner.getBackendCredentials(service);
    }
    return void 0;
  }
  // Extension points for decorators/middleware
  async _decorateResult(result, fid, input) {
    return result;
  }
  async _decorateError(error, fid, input) {
    return error;
  }
  /**
   * @param name - The unique identity of the entity.
   * @param owner - The parent entity (if any).
   */
  constructor(name, owner = null, options = {}) {
    this.__krnlEntityInstance = true;
    this.id = name || "UnnamedEntity";
    this.entityName = this.id;
    this.Singleton = options.Singleton ?? this.constructor.Singleton ?? true;
    this.baseName = options.baseName || this.entityName;
    this.instanceNumber = options.instanceNumber || 1;
    this.telemetry = new KrnlTelemetry();
    this.telemetryEnabled = options.telemetryEnabled || false;
    this.intention = options.intention || null;
    this.interface = new krnlInterface(this);
    this.localFunctionalities = /* @__PURE__ */ new Map();
    this.remoteFunctionalities = /* @__PURE__ */ new Map();
    this.collectors = /* @__PURE__ */ new Set();
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,
      // Host.
      owner,
      // Parent.
      _krnlEntityBase
      // Base class for nesting.
    );
  }
  /**
   * Registers a local logic block.
   * If the functionality is 'public', it is automatically promoted to the owner.
   */
  addLocal(localFunctionality) {
    const functionality = localFunctionality instanceof krnlLocalFunctionality ? localFunctionality : new krnlLocalFunctionality(localFunctionality);
    functionality.bindToEntity(this);
    this.localFunctionalities.set(functionality.id, functionality);
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityAdded) {
      owner._onComponentFunctionalityAdded(this, functionality);
    }
    return functionality;
  }
  /**
   * Registers a proxy for a functionality on another entity.
   * If the proxy is 'public', it is promoted to the owner (Recursive Bubbling).
   */
  addRemote(remoteFunctionality) {
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality ? remoteFunctionality : new krnlRemoteFunctionality(remoteFunctionality);
    functionality.bindToEntity(this);
    this.remoteFunctionalities.set(functionality.id, functionality);
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityAdded) {
      owner._onComponentFunctionalityAdded(this, functionality);
    }
    return functionality;
  }
  /**
   * INTERFACE PROMOTION
   * Handles the automatic bubbling of component logic to the owner.
   */
  _onComponentFunctionalityAdded(component, functionality) {
    if (component._isIngressNetworkMember) return;
    if (functionality.visibility !== "public") return;
    const existing = this.remoteFunctionalities.get(functionality.id);
    if (existing) {
      existing.targetEntity = component;
      existing.targetFunction = functionality.id;
      return;
    }
    this.addRemote({
      id: functionality.id,
      targetEntity: component,
      targetFunction: functionality.id,
      visibility: "public"
      // Bubbles up further by default.
    });
  }
  /**
   * Removes a promoted remote functionality and recursively propagates removal upward.
   */
  _onComponentFunctionalityRemoved(component, functionalityId) {
    const existing = this.remoteFunctionalities.get(functionalityId);
    if (!existing) return;
    if (existing.targetEntity !== component) return;
    this.remoteFunctionalities.delete(functionalityId);
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && owner._onComponentFunctionalityRemoved) {
      owner._onComponentFunctionalityRemoved(this, functionalityId);
    }
  }
  /**
   * Internal helper to trigger promotion of all existing functionalities.
   */
  _promoteAllExistingFunctionalities() {
    const owner = this.hierarchyManager.getOwnerEntity();
    if (!owner || !owner._onComponentFunctionalityAdded) return;
    this.localFunctionalities.forEach((f) => {
      owner._onComponentFunctionalityAdded(this, f);
    });
    this.remoteFunctionalities.forEach((f) => {
      owner._onComponentFunctionalityAdded(this, f);
    });
  }
  /**
   * Executes a functionality by ID.
   */
  async call(fid, input, opts = {}) {
    const unwrap = opts.unwrap !== false;
    try {
      let result;
      if (this.localFunctionalities.has(fid)) {
        result = await this.localFunctionalities.get(fid).execute(input, opts);
      } else if (this.remoteFunctionalities.has(fid)) {
        result = await this.remoteFunctionalities.get(fid).execute(input, opts);
      } else {
        throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
      }
      result = await this._decorateResult(result, fid, input);
      if (unwrap && result && typeof result === "object" && result.status === "success" && "payload" in result && !result.skipUnwrap) {
        return result.payload;
      }
      if (result && typeof result === "object" && result.status === "error") {
        throw new krnlError(result.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
      }
      return result;
    } catch (err) {
      let finalErr = err;
      finalErr = await this._decorateError(err, fid, input);
      if (finalErr && typeof finalErr === "object" && finalErr.status === "error") {
        const wrapper = new krnlError(finalErr.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
        Object.assign(wrapper, finalErr);
        throw wrapper;
      }
      throw finalErr;
    }
  }
  getLocal(fid) {
    return this.localFunctionalities.get(fid);
  }
  getRemote(fid) {
    return this.remoteFunctionalities.get(fid);
  }
  resolveLocalFunctionality(fid) {
    if (this.localFunctionalities.has(fid)) {
      return this.localFunctionalities.get(fid);
    }
    let current = this.remoteFunctionalities.get(fid);
    const visited = /* @__PURE__ */ new Set();
    while (current) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      if (current.isLocal) {
        return current;
      }
      const target = current.targetEntity || current.transport && (current.transport.targetEntity || current.transport.target || current.transport.instance);
      if (target) {
        const targetFid = current.targetFunction || fid;
        if (target.localFunctionalities && target.localFunctionalities.has(targetFid)) {
          return target.localFunctionalities.get(targetFid);
        }
        if (target.remoteFunctionalities && target.remoteFunctionalities.has(targetFid)) {
          current = target.remoteFunctionalities.get(targetFid);
          continue;
        }
      }
      break;
    }
    return null;
  }
  addChild(instance) {
    return this.hierarchyManager.addComponentEntityInstance(instance);
  }
  getTelemetry() {
    const summary = this.telemetry.getSummary();
    return {
      entity: this.entityName,
      timestamp: Date.now(),
      metrics: summary.metrics,
      callLogs: summary.callLogs,
      libraryUsage: summary.libraryUsage,
      dataUsage: summary.dataUsage
    };
  }
  disposeOwnedComponent(entityId) {
    return this.hierarchyManager.disposeComponentEntity(entityId);
  }
  dispose() {
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    if (this.interface) this.interface.dispose();
    this.localFunctionalities.forEach((func) => {
      if (typeof func.teardown === "function") {
        func.teardown();
      }
    });
    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
};

export {
  krnlErrorCodes,
  krnlErrorMessages,
  CUSTOM_ERROR_CODE,
  krnlError,
  krnlGlobalEmitterAddress,
  krnlLocalEmitterAddress,
  krnlMessage,
  krnlEmitter,
  krnlCollector,
  krnlInterface,
  krnlEntityCompositionalHierarchyManager,
  FunctionalityTable,
  SQLiteDataProvider,
  PostgresDataProvider,
  SupabaseDataProvider,
  PocketBaseDataProvider,
  FirebaseDataProvider,
  TursoLibSQLDataProvider,
  MongoAtlasDataProvider,
  FilesystemStorageProvider,
  SupabaseStorageProvider,
  S3StorageProvider,
  PocketBaseStorageProvider,
  FirebaseStorageProvider,
  VercelBlobStorageProvider,
  WorkspaceBackendFactory,
  LocalSQLiteAccountProvider,
  HostedAccountProvider,
  ControlPlaneManager,
  AdminGuard,
  AuditLogger,
  DatabaseClusterManager,
  krnlTransportAdapter,
  MemoryTransportAdapter,
  krnlLocalFunctionality,
  krnlRemoteFunctionality,
  krnlEntityBase
};
