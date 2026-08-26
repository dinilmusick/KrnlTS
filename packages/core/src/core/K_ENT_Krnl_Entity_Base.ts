//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_ENT_Krnl_Entity_Base.ts
 * @description The core Entity class, supporting recursive interface promotion and visibility control.
 */

import { krnlInterface } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { krnlEntityCompositionalHierarchyManager } from "./K_LIB_Krnl_Entity_Compositional_Hierarchy.js";
import { krnlLocalFunctionality, krnlRemoteFunctionality } from "./K_LIB_Krnl_Functionality_Types.js";
import { krnlError, krnlErrorCodes } from "./K_LIB_Krnl_Error_Concepts.js";
import { telemetry, KrnlTelemetry } from "./K_LIB_Krnl_Telemetry.js";
import type { KrnlIntentionEntity } from "./K_LIB_Krnl_Intention_Types.js";
import type { EntityBackendSettings, BackendServiceType, DatabaseProviderConfig } from "../backend/types.js";

/**
 * KRNL ENTITY BASE
 * The building block of the Krnl ecosystem.
 */
export class krnlEntityBase {
  __krnlEntityInstance: boolean;
  id: string;
  entityName: string;
  Singleton: boolean;
  baseName: string;
  instanceNumber: number;
  telemetry: KrnlTelemetry;
  _telemetryEnabled: boolean = false;
  get telemetryEnabled(): boolean { return this._telemetryEnabled; }
  set telemetryEnabled(val: boolean) {
    this._telemetryEnabled = val;
    this.telemetry.enabled = val; 
  }
  systemType: string = "BaseEntity";

  interface: krnlInterface;
  localFunctionalities: Map<string, krnlLocalFunctionality>;
  remoteFunctionalities: Map<string, krnlRemoteFunctionality>;
  collectors: Set<any>;
  hierarchyManager: krnlEntityCompositionalHierarchyManager;
  intention?: KrnlIntentionEntity;
  backendSettings?: EntityBackendSettings;

  /**
   * Configures backend services and credentials for this entity and cascading child functionalities.
   */
  configureBackend(settings: EntityBackendSettings): this {
    this.backendSettings = {
      ...this.backendSettings,
      ...settings
    };
    return this;
  }

  /**
   * Resolves backend credentials for a specific service, cascading from parent entities if necessary.
   */
  getBackendCredentials(service?: BackendServiceType): DatabaseProviderConfig | undefined {
    if (this.backendSettings) {
      if (service && (this.backendSettings as any)[service]) {
        return (this.backendSettings as any)[service];
      }
      const defaultSvc = this.backendSettings.defaultService;
      if (defaultSvc && (this.backendSettings as any)[defaultSvc]) {
        return (this.backendSettings as any)[defaultSvc];
      }
    }
    const owner = this.hierarchyManager?.getOwnerEntity();
    if (owner && typeof (owner as any).getBackendCredentials === "function") {
      return (owner as any).getBackendCredentials(service);
    }
    return undefined;
  }

  // Extension points for decorators/middleware
  async _decorateResult(result: any, fid: string, input: any): Promise<any> {
    return result;
  }
  async _decorateError(error: any, fid: string, input: any): Promise<any> {
    return error;
  }

  /**
   * @param name - The unique identity of the entity.
   * @param owner - The parent entity (if any).
   */
  constructor(name: string, owner: krnlEntityBase | null = null, options: any = {}) {
    // 1. Core Identification.
    this.__krnlEntityInstance = true; // Marker for type checking.
    this.id = name || "UnnamedEntity"; // Unique ID.
    this.entityName = this.id;         // Alias for the name.
    this.Singleton = options.Singleton ?? (this.constructor as any).Singleton ?? true;
    this.baseName = options.baseName || this.entityName;
    this.instanceNumber = options.instanceNumber || 1;
    this.telemetry = new KrnlTelemetry();
    this.telemetryEnabled = options.telemetryEnabled || false;
    this.intention = options.intention || null;

    // 2. Messaging Infrastructure (The IO Hub).
    this.interface = new krnlInterface(this);

    // 3. Logic Storage (The Brain).
    this.localFunctionalities = new Map();  // Logic that is MINE.
    this.remoteFunctionalities = new Map(); // Proxies for logic from components or external peers.
    this.collectors = new Set();            // Tracks listeners for cleanup.

    // 4. Hierarchy Management (The Skeleton).
    this.hierarchyManager = new krnlEntityCompositionalHierarchyManager(
      this,          // Host.
      owner,         // Parent.
      krnlEntityBase as any // Base class for nesting.
    );
  }

  /**
   * Registers a local logic block.
   * If the functionality is 'public', it is automatically promoted to the owner.
   */
  addLocal(localFunctionality: any): krnlLocalFunctionality {
    // 1. Ensure we have an instance of LocalFunctionality.
    const functionality = localFunctionality instanceof krnlLocalFunctionality
      ? localFunctionality
      : new krnlLocalFunctionality(localFunctionality);

    // 2. Bind it to THIS entity.
    functionality.bindToEntity(this);

    // 3. Save it to our local logic map.
    this.localFunctionalities.set(functionality.id, functionality);

    // 4. Notify our owner to promote this logic.
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && (owner as any)._onComponentFunctionalityAdded) {
      (owner as any)._onComponentFunctionalityAdded(this, functionality);
    }

    return functionality;
  }

  /**
   * Registers a proxy for a functionality on another entity.
   * If the proxy is 'public', it is promoted to the owner (Recursive Bubbling).
   */
  addRemote(remoteFunctionality: any): krnlRemoteFunctionality {
    // 1. Ensure we have an instance of RemoteFunctionality.
    const functionality = remoteFunctionality instanceof krnlRemoteFunctionality
      ? remoteFunctionality
      : new krnlRemoteFunctionality(remoteFunctionality);

    // 2. Bind it to THIS entity.
    functionality.bindToEntity(this);

    // 3. Store the proxy.
    this.remoteFunctionalities.set(functionality.id, functionality);

    // 4. BUBBLING: Notify our owner to promote this proxy if it is public.
    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && (owner as any)._onComponentFunctionalityAdded) {
      (owner as any)._onComponentFunctionalityAdded(this, functionality);
    }

    return functionality;
  }

  /**
   * INTERFACE PROMOTION
   * Handles the automatic bubbling of component logic to the owner.
   */
  _onComponentFunctionalityAdded(component: any, functionality: any): void {
    if (component._isIngressNetworkMember) return;
    // 1. Only promote 'public' functionalities from the component.
    if (functionality.visibility !== 'public') return;

    const existing = this.remoteFunctionalities.get(functionality.id);
    if (existing) {
      existing.targetEntity = component;
      existing.targetFunction = functionality.id;
      return;
    }

    // 2. Register the component's functionality as a REMOTE proxy on this owner.
    this.addRemote({
      id: functionality.id,
      targetEntity: component,
      targetFunction: functionality.id,
      visibility: 'public' // Bubbles up further by default.
    });
  }

  /**
   * Removes a promoted remote functionality and recursively propagates removal upward.
   */
  _onComponentFunctionalityRemoved(component: krnlEntityBase, functionalityId: string): void {
    const existing = this.remoteFunctionalities.get(functionalityId);
    if (!existing) return;
    if (existing.targetEntity !== component) return;

    this.remoteFunctionalities.delete(functionalityId);

    const owner = this.hierarchyManager.getOwnerEntity();
    if (owner && (owner as any)._onComponentFunctionalityRemoved) {
      (owner as any)._onComponentFunctionalityRemoved(this, functionalityId);
    }
  }

  /**
   * Internal helper to trigger promotion of all existing functionalities.
   */
  _promoteAllExistingFunctionalities(): void {
    const owner = this.hierarchyManager.getOwnerEntity();
    if (!owner || !(owner as any)._onComponentFunctionalityAdded) return;

    this.localFunctionalities.forEach(f => {
      (owner as any)._onComponentFunctionalityAdded(this, f);
    });
    this.remoteFunctionalities.forEach(f => {
      (owner as any)._onComponentFunctionalityAdded(this, f);
    });
  }

  /**
   * Executes a functionality by ID.
   */
  async call(fid: string, input: any, opts: any = {}): Promise<any> {
    const unwrap = opts.unwrap !== false; // Default to true
    try {
      let result: any;
      if (this.localFunctionalities.has(fid)) {
        result = await this.localFunctionalities.get(fid)!.execute(input, opts);
      } else if (this.remoteFunctionalities.has(fid)) {
        result = await this.remoteFunctionalities.get(fid)!.execute(input, opts);
      } else {
        throw new krnlError(krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED);
      }

      // Universal result decoration hook
      result = await this._decorateResult(result, fid, input);

      // Backward compatibility: If it's a standard Krnl success envelope, unwrap it.
      if (unwrap && result && typeof result === 'object' && result.status === 'success' && 'payload' in result && !result.skipUnwrap) {
        return result.payload;
      }

      // Backward compatibility: If it's a standard Krnl error envelope, throw it.
      if (result && typeof result === 'object' && result.status === 'error') {
        throw new krnlError(result.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
      }

      return result;
    } catch (err: any) {
      let finalErr = err;
      // Universal error decoration hook
      finalErr = await this._decorateError(err, fid, input);
      
      if (finalErr && typeof finalErr === 'object' && finalErr.status === 'error') {
        const wrapper = new krnlError(finalErr.message || krnlErrorCodes.REMOTE_EXECUTION_FAILED);
        Object.assign(wrapper, finalErr); // Preserve metadata/documentation
        throw wrapper;
      }

      throw finalErr;
    }
  }

  getLocal(fid: string) { return this.localFunctionalities.get(fid); }
  getRemote(fid: string) { return this.remoteFunctionalities.get(fid); }
  resolveLocalFunctionality(fid: string): any {
    if (this.localFunctionalities.has(fid)) {
      return this.localFunctionalities.get(fid);
    }
    let current: any = this.remoteFunctionalities.get(fid);
    const visited = new Set<any>();
    while (current) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);

      if (current.isLocal) {
        return current;
      }
      const target = current.targetEntity || (current.transport && (current.transport.targetEntity || current.transport.target || current.transport.instance));
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
  addChild(instance: krnlEntityBase) {
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

  disposeOwnedComponent(entityId: string) {
    return this.hierarchyManager.disposeComponentEntity(entityId);
  }

  dispose() {
    if (this.hierarchyManager) this.hierarchyManager.dispose();
    if (this.interface) this.interface.dispose();

    // 1. Teardown all local functionalities to release resources.
    this.localFunctionalities.forEach(func => {
      if (typeof (func as any).teardown === 'function') {
        (func as any).teardown();
      }
    });

    this.localFunctionalities.clear();
    this.remoteFunctionalities.clear();
  }
}
