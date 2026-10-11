/**
 * @file K_LIB_Krnl_SubApp_Engine.ts
 * @description Sub-App Discovery, Validation, Lifecycle Execution, and HTTPS Adapter Engine for Krnl.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Logger } from './K_LIB_Krnl_Base_Concepts.js';
import type {
  SubAppManifest,
  SubAppDescriptor,
  OperationDefinition,
  SubAppRegistration,
  SubAppRegistrationContext,
  SubAppInstance,
  SubAppErrorDetail,
  ServiceContainer,
  OperationRegistrar,
  EventRegistrar
} from './K_LIB_Krnl_SubApp_Types.js';

/**
 * Default in-memory service container for dependency injection.
 */
export class DefaultServiceContainer implements ServiceContainer {
  private services = new Map<string, any>();

  constructor(initialServices: Record<string, any> = {}) {
    for (const [k, v] of Object.entries(initialServices)) {
      this.services.set(k, v);
    }
  }

  get<T = any>(serviceName: string): T | undefined {
    return this.services.get(serviceName);
  }

  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  register<T = any>(serviceName: string, serviceInstance: T): void {
    this.services.set(serviceName, serviceInstance);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Default Operation registrar collector used during sub-app registration.
 */
export class DefaultOperationRegistrar implements OperationRegistrar {
  private ops = new Map<string, OperationDefinition>();

  register(op: OperationDefinition): void {
    if (!op || !op.name) {
      throw new Error(`[OperationRegistrar] Cannot register operation without a valid name.`);
    }
    this.ops.set(op.name, op);
  }

  registerBatch(ops: OperationDefinition[]): void {
    if (!Array.isArray(ops)) return;
    for (const op of ops) {
      this.register(op);
    }
  }

  get(opName: string): OperationDefinition | undefined {
    return this.ops.get(opName);
  }

  list(): OperationDefinition[] {
    return Array.from(this.ops.values());
  }
}

/**
 * Default Event registrar for sub-apps.
 */
export class DefaultEventRegistrar implements EventRegistrar {
  private hostEntity: any;

  constructor(hostEntity: any) {
    this.hostEntity = hostEntity;
  }

  emit(eventName: string, data: any): void {
    if (this.hostEntity && this.hostEntity.interface) {
      const emitter = this.hostEntity.interface.getEmitter(eventName);
      if (emitter && typeof (emitter as any).pushDataStreamToEmitter === 'function') {
        (emitter as any).pushDataStreamToEmitter(data);
        return;
      }
    }
  }

  on(eventName: string, listener: (data: any) => void): () => void {
    if (this.hostEntity && this.hostEntity.interface) {
      const emitter = this.hostEntity.interface.getEmitter(eventName);
      if (emitter && typeof (emitter as any).subscribe === 'function') {
        return (emitter as any).subscribe((msg: any) => listener(msg.data || msg));
      }
    }
    return () => {};
  }
}

/**
 * Sub-App Discovery Engine
 */
export class KrnlSubAppDiscovery {
  /**
   * Deterministically scans searchDir for sub-apps and builds typed SubAppDescriptor instances.
   */
  static async discoverSubApps(searchDir: string): Promise<SubAppDescriptor[]> {
    const descriptors: SubAppDescriptor[] = [];
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
  static async locateDescriptor(subAppDir: string, fallbackId?: string): Promise<SubAppDescriptor | null> {
    if (!fs.existsSync(subAppDir)) return null;

    let id = fallbackId || path.basename(subAppDir);
    let manifestPath: string | undefined;
    let manifest: SubAppManifest | undefined;

    // 1. Check for subapp.json
    const subappJsonPath = path.join(subAppDir, 'subapp.json');
    if (fs.existsSync(subappJsonPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(subappJsonPath, 'utf-8'));
        manifestPath = subappJsonPath;
        if (manifest?.name) id = manifest.name;
      } catch (e: any) {
        console.warn(`[SubAppDiscovery] Failed to parse subapp.json in ${subAppDir}:`, e.message);
      }
    }

    // 2. Check for manifest.json fallback
    if (!manifest) {
      const manifestJsonPath = path.join(subAppDir, 'manifest.json');
      if (fs.existsSync(manifestJsonPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
          manifestPath = manifestJsonPath;
          if (manifest?.name) id = manifest.name;
        } catch (_) {}
      }
    }

    // 3. Check for package.json fallback
    if (!manifest) {
      const packageJsonPath = path.join(subAppDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          id = pkg.name || id;
          manifest = {
            name: pkg.name || id,
            version: pkg.version || '1.0.0',
            description: pkg.description,
            dependencies: pkg.dependencies,
            devDependencies: pkg.devDependencies,
          };
          manifestPath = packageJsonPath;
        } catch (_) {}
      }
    }

    // 4. Locate registration entry file
    const candidateEntries = [
      manifest?.registrationEntry,
      'register.ts',
      'register.js',
      'src/register.ts',
      'src/register.js',
      'subapp.ts',
      'subapp.js',
      'src/subapp.ts',
      'src/subapp.js',
      'index.ts',
      'index.js',
      'src/index.ts',
      'src/index.js'
    ].filter(Boolean) as string[];

    let registrationPath: string | null = null;
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
      manifest: manifest || { name: id, version: '1.0.0' }
    };
  }
}

/**
 * Sub-App Validator Engine
 */
export class KrnlSubAppValidator {
  /**
   * Validates a sub-app manifest.
   */
  static validateManifest(manifest: any): { valid: boolean; errors: SubAppErrorDetail[] } {
    const errors: SubAppErrorDetail[] = [];
    if (!manifest || typeof manifest !== 'object') {
      errors.push({ code: 'INVALID_MANIFEST', message: 'Manifest must be an object' });
      return { valid: false, errors };
    }

    if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
      errors.push({ code: 'INVALID_NAME', message: 'Manifest requires a non-empty name string', field: 'name' });
    }

    if (manifest.version && typeof manifest.version !== 'string') {
      errors.push({ code: 'INVALID_VERSION', message: 'Manifest version must be a string', field: 'version' });
    }

    if (manifest.dependencies && typeof manifest.dependencies !== 'object') {
      errors.push({ code: 'INVALID_DEPENDENCIES', message: 'dependencies must be a key-value record', field: 'dependencies' });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates operation definitions and checks for collisions.
   */
  static validateRegistration(
    registration: SubAppRegistration,
    existingOperations: Set<string>,
    subAppId: string
  ): { valid: boolean; errors: SubAppErrorDetail[] } {
    const errors: SubAppErrorDetail[] = [];

    if (!registration || typeof registration !== 'object') {
      errors.push({ code: 'INVALID_REGISTRATION', message: 'Registration must return an object with operations', subAppId });
      return { valid: false, errors };
    }

    if (!Array.isArray(registration.operations)) {
      errors.push({ code: 'INVALID_OPERATIONS_ARRAY', message: 'Registration operations must be an array', subAppId });
      return { valid: false, errors };
    }

    const seenInBatch = new Set<string>();

    for (const op of registration.operations) {
      if (!op || typeof op !== 'object') {
        errors.push({ code: 'INVALID_OPERATION', message: 'Operation definition must be an object', subAppId });
        continue;
      }

      if (!op.name || typeof op.name !== 'string' || op.name.trim().length === 0) {
        errors.push({ code: 'INVALID_OP_NAME', message: 'Operation requires a non-empty name', subAppId });
        continue;
      }

      if (typeof op.handler !== 'function') {
        errors.push({
          code: 'INVALID_OP_HANDLER',
          message: `Operation '${op.name}' must have a callable handler function`,
          subAppId,
          operationName: op.name
        });
      }

      // Check intra-batch duplicate
      if (seenInBatch.has(op.name)) {
        errors.push({
          code: 'DUPLICATE_OP_NAME',
          message: `Duplicate operation name '${op.name}' inside sub-app registration`,
          subAppId,
          operationName: op.name
        });
      }
      seenInBatch.add(op.name);

      // Check collision with existing host entity capabilities
      const qualifiedName = `${subAppId}.${op.name}`;
      if (existingOperations.has(op.name) || existingOperations.has(qualifiedName)) {
        errors.push({
          code: 'OPERATION_COLLISION',
          message: `Operation '${op.name}' collides with an existing capability on the host Entity`,
          subAppId,
          operationName: op.name
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * Sub-App Lifecycle Engine
 */
export class KrnlSubAppLifecycle {
  /**
   * Loads, validates, registers, and initializes a sub-app onto an Entity.
   */
  static async loadAndRegister(
    entity: any,
    descriptor: SubAppDescriptor,
    config: Record<string, unknown> = {}
  ): Promise<SubAppInstance> {
    const subAppId = descriptor.id;
    const instance: SubAppInstance = {
      id: subAppId,
      state: 'DISCOVERED',
      manifest: descriptor.manifest || { name: subAppId, version: '1.0.0' },
      descriptor,
      operations: new Map(),
      error: null,
      errorDetails: [],
      loadedAt: Date.now()
    };

    try {
      // 1. VALIDATING MANIFEST
      instance.state = 'VALIDATING';
      const manifestCheck = KrnlSubAppValidator.validateManifest(instance.manifest);
      if (!manifestCheck.valid) {
        instance.state = 'ERROR';
        instance.errorDetails = manifestCheck.errors;
        instance.error = new Error(`[SubApp:${subAppId}] Manifest validation failed: ${manifestCheck.errors.map(e => e.message).join(', ')}`);
        return instance;
      }

      // 2. LOADING MODULE
      instance.state = 'LOADING';
      const fileUrl = pathToFileURL(descriptor.registrationPath).href;
      const mod = await import(fileUrl);

      const registerFn =
        typeof mod.register === 'function'
          ? mod.register
          : typeof mod.default === 'function'
          ? mod.default
          : typeof mod.default?.register === 'function'
          ? mod.default.register
          : null;

      if (!registerFn) {
        instance.state = 'ERROR';
        const err = { code: 'NO_REGISTER_FUNCTION', message: `No callable register() function exported by ${descriptor.registrationPath}`, subAppId };
        instance.errorDetails = [err];
        instance.error = new Error(`[SubApp:${subAppId}] ${err.message}`);
        return instance;
      }

      // 3. BUILD REGISTRATION CONTEXT
      const serviceContainer = new DefaultServiceContainer({
        runtimeStore: (entity as any)._runtimeStore || null,
        aiOrchestrator: (entity as any)._aiOrchestrator || null,
      });

      const operationRegistrar = new DefaultOperationRegistrar();
      const eventRegistrar = new DefaultEventRegistrar(entity);

      const regContext: SubAppRegistrationContext = {
        entity,
        services: serviceContainer,
        operations: operationRegistrar,
        events: eventRegistrar,
        config,
        logger: Logger
      };

      // 4. INVOKE REGISTER
      const registrationResult: SubAppRegistration = await registerFn(regContext);

      // Merge operations registered via registrar and returned array
      const allOps: OperationDefinition[] = [
        ...(registrationResult?.operations || []),
        ...operationRegistrar.list()
      ];

      // Deduplicate by name if identical
      const uniqueOpsMap = new Map<string, OperationDefinition>();
      for (const op of allOps) {
        uniqueOpsMap.set(op.name, op);
      }
      const uniqueOps = Array.from(uniqueOpsMap.values());

      const finalRegistration: SubAppRegistration = {
        ...registrationResult,
        operations: uniqueOps
      };

      // 5. VALIDATE OPERATIONS & CHECK COLLISIONS
      const existingCaps = new Set<string>();
      if (entity.localFunctionalities) {
        for (const k of entity.localFunctionalities.keys()) existingCaps.add(k);
      }
      if (entity.remoteFunctionalities) {
        for (const k of entity.remoteFunctionalities.keys()) existingCaps.add(k);
      }

      const opCheck = KrnlSubAppValidator.validateRegistration(finalRegistration, existingCaps, subAppId);
      if (!opCheck.valid) {
        instance.state = 'ERROR';
        instance.errorDetails = opCheck.errors;
        instance.error = new Error(`[SubApp:${subAppId}] Operations validation failed: ${opCheck.errors.map(e => e.message).join(', ')}`);
        return instance;
      }

      // 6. REGISTER ATOMICALLY INTO HOST ENTITY
      instance.state = 'REGISTERED';
      instance.registration = finalRegistration;

      for (const op of finalRegistration.operations) {
        instance.operations.set(op.name, op);
      }

      // 7. INITIALIZE
      instance.state = 'INITIALIZING';
      if (typeof finalRegistration.onInitialize === 'function') {
        await finalRegistration.onInitialize(regContext);
      }

      instance.state = 'READY';
      instance.readyAt = Date.now();
      return instance;

    } catch (err: any) {
      instance.state = 'ERROR';
      instance.error = err;
      instance.errorDetails = [{
        code: 'LIFECYCLE_ERROR',
        message: err.message || String(err),
        subAppId
      }];
      return instance;
    }
  }

  /**
   * Gracefully unregisters and disposes of a sub-app instance.
   */
  static async dispose(instance: SubAppInstance): Promise<void> {
    if (instance.state === 'DISPOSED') return;
    instance.state = 'UNREGISTERING';

    try {
      if (instance.registration && typeof instance.registration.onDispose === 'function') {
        await instance.registration.onDispose();
      }
    } catch (e: any) {
      console.warn(`[SubApp:${instance.id}] Warning during onDispose():`, e.message);
    } finally {
      instance.operations.clear();
      instance.state = 'DISPOSED';
    }
  }
}

/**
 * HTTPS Compatibility Adapter: Helper for mapping existing full-stack React app endpoints into OperationDefinitions.
 */
export function createHttpsAppAdapter(options: {
  name: string;
  endpoints: Array<{
    path: string;
    method?: string;
    description?: string;
    inputSchema?: any;
    outputSchema?: any;
    handler: (reqBodyOrParams: any, context?: any) => Promise<any> | any;
  }>;
}): SubAppRegistration {
  const operations: OperationDefinition[] = options.endpoints.map(ep => {
    // Generate clean operation name from route path (e.g. '/api/users/profile' -> 'users_profile' or direct path)
    const cleanName = ep.path
      .replace(/^\//, '')
      .replace(/^api\//, '')
      .replace(/\//g, '_')
      .replace(/:/g, '') || 'root';

    return {
      name: cleanName,
      description: ep.description || `Mapped HTTPS endpoint: ${ep.method || 'POST'} ${ep.path}`,
      method: ep.method || 'POST',
      input: ep.inputSchema,
      output: ep.outputSchema,
      metadata: { originalPath: ep.path, originalMethod: ep.method || 'POST' },
      handler: async (input: any, ctx: any) => {
        return await ep.handler(input, ctx);
      }
    };
  });

  return {
    name: options.name,
    operations
  };
}
