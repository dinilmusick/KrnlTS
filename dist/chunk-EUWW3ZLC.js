import {
  Logger
} from "./chunk-43SQEXFM.js";

// src/krnl/core/K_LIB_Krnl_SubApp_Engine.ts
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
var DefaultServiceContainer = class {
  services = /* @__PURE__ */ new Map();
  constructor(initialServices = {}) {
    for (const [k, v] of Object.entries(initialServices)) {
      this.services.set(k, v);
    }
  }
  get(serviceName) {
    return this.services.get(serviceName);
  }
  has(serviceName) {
    return this.services.has(serviceName);
  }
  register(serviceName, serviceInstance) {
    this.services.set(serviceName, serviceInstance);
  }
  list() {
    return Array.from(this.services.keys());
  }
};
var DefaultOperationRegistrar = class {
  ops = /* @__PURE__ */ new Map();
  register(op) {
    if (!op || !op.name) {
      throw new Error(`[OperationRegistrar] Cannot register operation without a valid name.`);
    }
    this.ops.set(op.name, op);
  }
  registerBatch(ops) {
    if (!Array.isArray(ops)) return;
    for (const op of ops) {
      this.register(op);
    }
  }
  get(opName) {
    return this.ops.get(opName);
  }
  list() {
    return Array.from(this.ops.values());
  }
};
var DefaultEventRegistrar = class {
  hostEntity;
  constructor(hostEntity) {
    this.hostEntity = hostEntity;
  }
  emit(eventName, data) {
    if (this.hostEntity && this.hostEntity.interface) {
      const emitter = this.hostEntity.interface.getEmitter(eventName);
      if (emitter && typeof emitter.pushDataStreamToEmitter === "function") {
        emitter.pushDataStreamToEmitter(data);
        return;
      }
    }
  }
  on(eventName, listener) {
    if (this.hostEntity && this.hostEntity.interface) {
      const emitter = this.hostEntity.interface.getEmitter(eventName);
      if (emitter && typeof emitter.subscribe === "function") {
        return emitter.subscribe((msg) => listener(msg.data || msg));
      }
    }
    return () => {
    };
  }
};
var KrnlSubAppDiscovery = class {
  /**
   * Deterministically scans searchDir for sub-apps and builds typed SubAppDescriptor instances.
   */
  static async discoverSubApps(searchDir) {
    const descriptors = [];
    if (!fs.existsSync(searchDir)) {
      return descriptors;
    }
    const entries = await fs.promises.readdir(searchDir, { withFileTypes: true });
    for (const dirent of entries) {
      if (dirent.isDirectory()) {
        const subAppDir = path.join(searchDir, dirent.name);
        const desc = await this.locateDescriptor(subAppDir, dirent.name);
        if (desc) {
          descriptors.push(desc);
        }
      }
    }
    return descriptors;
  }
  /**
   * Inspects a specific directory to see if it represents a valid sub-app.
   */
  static async locateDescriptor(subAppDir, fallbackId) {
    if (!fs.existsSync(subAppDir)) return null;
    let id = fallbackId || path.basename(subAppDir);
    let manifestPath;
    let manifest;
    const subappJsonPath = path.join(subAppDir, "subapp.json");
    if (fs.existsSync(subappJsonPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(subappJsonPath, "utf-8"));
        manifestPath = subappJsonPath;
        if (manifest?.name) id = manifest.name;
      } catch (e) {
        console.warn(`[SubAppDiscovery] Failed to parse subapp.json in ${subAppDir}:`, e.message);
      }
    }
    if (!manifest) {
      const manifestJsonPath = path.join(subAppDir, "manifest.json");
      if (fs.existsSync(manifestJsonPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));
          manifestPath = manifestJsonPath;
          if (manifest?.name) id = manifest.name;
        } catch (_) {
        }
      }
    }
    if (!manifest) {
      const packageJsonPath = path.join(subAppDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
          id = pkg.name || id;
          manifest = {
            name: pkg.name || id,
            version: pkg.version || "1.0.0",
            description: pkg.description,
            dependencies: pkg.dependencies,
            devDependencies: pkg.devDependencies
          };
          manifestPath = packageJsonPath;
        } catch (_) {
        }
      }
    }
    const candidateEntries = [
      manifest?.registrationEntry,
      "register.ts",
      "register.js",
      "src/register.ts",
      "src/register.js",
      "subapp.ts",
      "subapp.js",
      "src/subapp.ts",
      "src/subapp.js",
      "index.ts",
      "index.js",
      "src/index.ts",
      "src/index.js"
    ].filter(Boolean);
    let registrationPath = null;
    for (const cand of candidateEntries) {
      const candPath = path.resolve(subAppDir, cand);
      if (fs.existsSync(candPath)) {
        registrationPath = candPath;
        break;
      }
    }
    if (!registrationPath) {
      return null;
    }
    return {
      id,
      path: subAppDir,
      manifestPath,
      registrationPath,
      manifest: manifest || { name: id, version: "1.0.0" }
    };
  }
};
var KrnlSubAppValidator = class {
  /**
   * Validates a sub-app manifest.
   */
  static validateManifest(manifest) {
    const errors = [];
    if (!manifest || typeof manifest !== "object") {
      errors.push({ code: "INVALID_MANIFEST", message: "Manifest must be an object" });
      return { valid: false, errors };
    }
    if (!manifest.name || typeof manifest.name !== "string" || manifest.name.trim().length === 0) {
      errors.push({ code: "INVALID_NAME", message: "Manifest requires a non-empty name string", field: "name" });
    }
    if (manifest.version && typeof manifest.version !== "string") {
      errors.push({ code: "INVALID_VERSION", message: "Manifest version must be a string", field: "version" });
    }
    if (manifest.dependencies && typeof manifest.dependencies !== "object") {
      errors.push({ code: "INVALID_DEPENDENCIES", message: "dependencies must be a key-value record", field: "dependencies" });
    }
    return { valid: errors.length === 0, errors };
  }
  /**
   * Validates operation definitions and checks for collisions.
   */
  static validateRegistration(registration, existingOperations, subAppId) {
    const errors = [];
    if (!registration || typeof registration !== "object") {
      errors.push({ code: "INVALID_REGISTRATION", message: "Registration must return an object with operations", subAppId });
      return { valid: false, errors };
    }
    if (!Array.isArray(registration.operations)) {
      errors.push({ code: "INVALID_OPERATIONS_ARRAY", message: "Registration operations must be an array", subAppId });
      return { valid: false, errors };
    }
    const seenInBatch = /* @__PURE__ */ new Set();
    for (const op of registration.operations) {
      if (!op || typeof op !== "object") {
        errors.push({ code: "INVALID_OPERATION", message: "Operation definition must be an object", subAppId });
        continue;
      }
      if (!op.name || typeof op.name !== "string" || op.name.trim().length === 0) {
        errors.push({ code: "INVALID_OP_NAME", message: "Operation requires a non-empty name", subAppId });
        continue;
      }
      if (typeof op.handler !== "function") {
        errors.push({
          code: "INVALID_OP_HANDLER",
          message: `Operation '${op.name}' must have a callable handler function`,
          subAppId,
          operationName: op.name
        });
      }
      if (seenInBatch.has(op.name)) {
        errors.push({
          code: "DUPLICATE_OP_NAME",
          message: `Duplicate operation name '${op.name}' inside sub-app registration`,
          subAppId,
          operationName: op.name
        });
      }
      seenInBatch.add(op.name);
      const qualifiedName = `${subAppId}.${op.name}`;
      if (existingOperations.has(op.name) || existingOperations.has(qualifiedName)) {
        errors.push({
          code: "OPERATION_COLLISION",
          message: `Operation '${op.name}' collides with an existing capability on the host Entity`,
          subAppId,
          operationName: op.name
        });
      }
    }
    return { valid: errors.length === 0, errors };
  }
};
var KrnlSubAppLifecycle = class {
  /**
   * Loads, validates, registers, and initializes a sub-app onto an Entity.
   */
  static async loadAndRegister(entity, descriptor, config = {}) {
    const subAppId = descriptor.id;
    const instance = {
      id: subAppId,
      state: "DISCOVERED",
      manifest: descriptor.manifest || { name: subAppId, version: "1.0.0" },
      descriptor,
      operations: /* @__PURE__ */ new Map(),
      error: null,
      errorDetails: [],
      loadedAt: Date.now()
    };
    try {
      instance.state = "VALIDATING";
      const manifestCheck = KrnlSubAppValidator.validateManifest(instance.manifest);
      if (!manifestCheck.valid) {
        instance.state = "ERROR";
        instance.errorDetails = manifestCheck.errors;
        instance.error = new Error(`[SubApp:${subAppId}] Manifest validation failed: ${manifestCheck.errors.map((e) => e.message).join(", ")}`);
        return instance;
      }
      instance.state = "LOADING";
      const fileUrl = pathToFileURL(descriptor.registrationPath).href;
      const mod = await import(fileUrl);
      const registerFn = typeof mod.register === "function" ? mod.register : typeof mod.default === "function" ? mod.default : typeof mod.default?.register === "function" ? mod.default.register : null;
      if (!registerFn) {
        instance.state = "ERROR";
        const err = { code: "NO_REGISTER_FUNCTION", message: `No callable register() function exported by ${descriptor.registrationPath}`, subAppId };
        instance.errorDetails = [err];
        instance.error = new Error(`[SubApp:${subAppId}] ${err.message}`);
        return instance;
      }
      const serviceContainer = new DefaultServiceContainer({
        runtimeStore: entity._runtimeStore || null,
        aiOrchestrator: entity._aiOrchestrator || null
      });
      const operationRegistrar = new DefaultOperationRegistrar();
      const eventRegistrar = new DefaultEventRegistrar(entity);
      const regContext = {
        entity,
        services: serviceContainer,
        operations: operationRegistrar,
        events: eventRegistrar,
        config,
        logger: Logger
      };
      const registrationResult = await registerFn(regContext);
      const allOps = [
        ...registrationResult?.operations || [],
        ...operationRegistrar.list()
      ];
      const uniqueOpsMap = /* @__PURE__ */ new Map();
      for (const op of allOps) {
        uniqueOpsMap.set(op.name, op);
      }
      const uniqueOps = Array.from(uniqueOpsMap.values());
      const finalRegistration = {
        ...registrationResult,
        operations: uniqueOps
      };
      const existingCaps = /* @__PURE__ */ new Set();
      if (entity.localFunctionalities) {
        for (const k of entity.localFunctionalities.keys()) existingCaps.add(k);
      }
      if (entity.remoteFunctionalities) {
        for (const k of entity.remoteFunctionalities.keys()) existingCaps.add(k);
      }
      const opCheck = KrnlSubAppValidator.validateRegistration(finalRegistration, existingCaps, subAppId);
      if (!opCheck.valid) {
        instance.state = "ERROR";
        instance.errorDetails = opCheck.errors;
        instance.error = new Error(`[SubApp:${subAppId}] Operations validation failed: ${opCheck.errors.map((e) => e.message).join(", ")}`);
        return instance;
      }
      instance.state = "REGISTERED";
      instance.registration = finalRegistration;
      for (const op of finalRegistration.operations) {
        instance.operations.set(op.name, op);
      }
      instance.state = "INITIALIZING";
      if (typeof finalRegistration.onInitialize === "function") {
        await finalRegistration.onInitialize(regContext);
      }
      instance.state = "READY";
      instance.readyAt = Date.now();
      return instance;
    } catch (err) {
      instance.state = "ERROR";
      instance.error = err;
      instance.errorDetails = [{
        code: "LIFECYCLE_ERROR",
        message: err.message || String(err),
        subAppId
      }];
      return instance;
    }
  }
  /**
   * Gracefully unregisters and disposes of a sub-app instance.
   */
  static async dispose(instance) {
    if (instance.state === "DISPOSED") return;
    instance.state = "UNREGISTERING";
    try {
      if (instance.registration && typeof instance.registration.onDispose === "function") {
        await instance.registration.onDispose();
      }
    } catch (e) {
      console.warn(`[SubApp:${instance.id}] Warning during onDispose():`, e.message);
    } finally {
      instance.operations.clear();
      instance.state = "DISPOSED";
    }
  }
};
function createHttpsAppAdapter(options) {
  const operations = options.endpoints.map((ep) => {
    const cleanName = ep.path.replace(/^\//, "").replace(/^api\//, "").replace(/\//g, "_").replace(/:/g, "") || "root";
    return {
      name: cleanName,
      description: ep.description || `Mapped HTTPS endpoint: ${ep.method || "POST"} ${ep.path}`,
      method: ep.method || "POST",
      input: ep.inputSchema,
      output: ep.outputSchema,
      metadata: { originalPath: ep.path, originalMethod: ep.method || "POST" },
      handler: async (input, ctx) => {
        return await ep.handler(input, ctx);
      }
    };
  });
  return {
    name: options.name,
    operations
  };
}

export {
  DefaultServiceContainer,
  DefaultOperationRegistrar,
  DefaultEventRegistrar,
  KrnlSubAppDiscovery,
  KrnlSubAppValidator,
  KrnlSubAppLifecycle,
  createHttpsAppAdapter
};
