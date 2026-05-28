//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.ts
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
 */

import { krnlEmitter } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { telemetry } from "./K_LIB_Krnl_Telemetry.js";
import type { KrnlEndpointAccessPolicy } from "./types.js";

/**
 * Helper to ensure state isolation.
 */
function cloneState(source: any): any {
  return JSON.parse(JSON.stringify(source));
}

/**
 * TRANSPORT ADAPTER INTERFACE
 */
export abstract class krnlTransportAdapter {
  abstract call(targetFunction: string, input: any, opts: any): Promise<any>;
}

/**
 * MEMORY TRANSPORT ADAPTER
 * Default adapter for in-memory entity communication.
 */
export class MemoryTransportAdapter extends krnlTransportAdapter {
  targetEntity: any;

  constructor(targetEntity: any) {
    super();
    this.targetEntity = targetEntity;
  }

  async call(targetFunction: string, input: any, opts: any): Promise<any> {
    if (!this.targetEntity || typeof this.targetEntity.call !== 'function') {
      throw new Error("MemoryTransportAdapter: Invalid target entity.");
    }
    return await this.targetEntity.call(targetFunction, input, opts);
  }
}

/**
 * KRNL LOCAL FUNCTIONALITY
 * The fundamental unit of logic.
 */
export class krnlLocalFunctionality {
  id: string;
  visibility: string;
  initialState: any;
  api: Function;
  isLocal: boolean = true;
  sourcePath: string | null;
  helpers: Map<string, any>;
  emitters: Map<string, krnlEmitter>;
  schema: any;
  description?: string;
  method?: string;
  /** Port-based access control policy. Absent = unrestricted. */
  accessPolicy?: KrnlEndpointAccessPolicy;
  /** Shared secret for allow_with_key / ask_key_unlisted gates. */
  accessKey?: string;
  lifecycle: {
    beginning?: Function;
    during?: Function;
    end?: Function;
    failure?: Function;
    teardown?: Function;
  };
  state: any;
  hostEntity: any;

  constructor(config: any = {}) {
    const {
      id,
      visibility = 'public', // Default: public (bubbles up)
      initialState = {},
      api = (input: any) => input,
      helpers = {},
      emitters = {},
      events = {},
      schema = null,
      onMount = null,
      onTeardown = null,
      sourcePath = null,
      accessPolicy = null,
      accessKey = null,
    } = config;

    if (!id) throw new Error("LocalFunctionality requires an ID.");

    this.id = id;
    this.visibility = visibility;
    this.initialState = initialState;
    this.api = api;
    this.sourcePath = sourcePath;
    this.helpers = new Map(Object.entries(helpers));
    this.emitters = new Map();
    this.schema = schema;
    this.description = config.description || '';
    this.method = config.method || 'POST';
    if (accessPolicy) this.accessPolicy = accessPolicy;
    if (accessKey)    this.accessKey    = accessKey;

    this.lifecycle = {
      beginning: onMount || events.beginning,
      during: events.during,
      end: events.end,
      failure: events.failure,
      teardown: onTeardown || events.teardown
    };

    // Ensure state:changed emitter exists if not provided
    if (!emitters['state:changed']) {
      this.emitters.set('state:changed', new krnlEmitter());
    }

    Object.entries(emitters).forEach(([eid, e]) => {
      this.emitters.set(eid, e instanceof krnlEmitter ? e : new krnlEmitter());
    });

    this.state = this._createObservedState(cloneState(initialState));
  }

  _createObservedState(initialState: any): any {
    const self = this;
    const handler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'object' && value !== null) {
          return new Proxy(value, handler);
        }
        return value;
      },
      set(target, prop, value, receiver) {
        const result = Reflect.set(target, prop, value, receiver);
        if (result) {
          self._notifyStateChanged(prop as string, value);
        }
        return result;
      },
      deleteProperty(target, prop) {
        const result = Reflect.deleteProperty(target, prop);
        if (result) {
          self._notifyStateChanged(prop as string, undefined);
        }
        return result;
      }
    };
    return new Proxy(initialState, handler);
  }

  _notifyStateChanged(prop: string, value: any): void {
    const stateEmitter = this.emitters.get('state:changed');
    if (stateEmitter) {
      (stateEmitter as any).pushDataStreamToEmitter({
        prop,
        value,
        state: this.state, // This is the proxied state
        functionalityId: this.id
      });
    }
  }

  /**
   * Updates the visibility and handles interface registration/deregistration.
   * This is the mechanism used to STOP bubbling at a certain level.
   */
  setVisibility(v: string): void {
    const oldVisibility = this.visibility;
    this.visibility = v;

    if (!this.hostEntity) return;

    if (oldVisibility === 'private' && v === 'public') {
      // Transition to Public: Register in interface
      this._registerInInterface();
      // Notify owner to bubble it up
      const owner = (this.hostEntity as any).hierarchyManager.getOwnerEntity();
      if (owner) (owner as any)._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (oldVisibility === 'public' && v === 'private') {
      this._unregisterFromInterface();
      const owner = (this.hostEntity as any).hierarchyManager.getOwnerEntity();
      if (owner && (owner as any)._onComponentFunctionalityRemoved) {
        (owner as any)._onComponentFunctionalityRemoved(this.hostEntity, this.id);
      }
    }
  }

  _unregisterFromInterface(): void {
    const entity = this.hostEntity;
    if (!entity) return;
    (entity as any).interface.removeCollector(this.id);
    this.emitters.forEach((_, eid) => {
      (entity as any).interface.removeEmitter(`${this.id}:${eid}`);
    });
  }

  _registerInInterface(): void {
    const entity = this.hostEntity;
    // Register API as input
    const mainCollector = (entity as any).interface.createCollector(this.id);
    mainCollector._directHandler = async (msg: any) => {
      const caller = msg.metadata?.caller || 'anonymous';
      return await this.execute(msg.data, { caller });
    };

    // Register Emitters as outputs
    this.emitters.forEach((emitter, eid) => {
      const interfaceEmitter = (entity as any).interface.createEmitter(`${this.id}:${eid}`);
      emitter.subscribe((msg: any) => (interfaceEmitter as any).pushDataStreamToEmitter(msg.data, msg.time));
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
  checkAccess(callerPort: number, key?: string): { allowed: boolean; reason?: string } {
    const p = this.accessPolicy;
    // If no policy is defined, access is unrestricted (free).
    if (!p) return { allowed: true };

    if (p.forbid.includes(callerPort))
      return { allowed: false, reason: `Port ${callerPort} is explicitly forbidden from accessing this endpoint.` };

    if (p.allow.includes(callerPort))
      return { allowed: true };

    if (p.allow_with_key.includes(callerPort)) {
      if (key && key === this.accessKey) return { allowed: true };
      return {
        allowed: false,
        reason: key
          ? `Invalid access key for port ${callerPort}.`
          : `Port ${callerPort} requires an access key (x-krnl-access-key header).`
      };
    }

    // Unlisted port — apply default behaviour
    switch (p.default_connection_behaviour) {
      case 'allow_unlisted':
        return { allowed: true };
      case 'ask_key_unlisted':
        if (key && key === this.accessKey) return { allowed: true };
        return {
          allowed: false,
          reason: key
            ? `Invalid access key for this endpoint.`
            : `This endpoint requires an access key. Provide it via the 'x-krnl-access-key' header.`
        };
      case 'forbid_unlisted':
        return { allowed: false, reason: `Port ${callerPort} is not permitted. This is a restricted (internal) endpoint.` };
    }
  }

  bindToEntity(entity: any): this {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      this._registerInInterface();
    }
    if (typeof this.lifecycle.beginning === "function") {
      this.lifecycle.beginning({
        state: this.state,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this
      });
    }
    return this;
  }

  teardown(): void {
    if (typeof this.lifecycle.teardown === "function") {
      this.lifecycle.teardown({
        state: this.state,
        emitters: this.emitters,
        helpers: this.helpers,
        entity: this.hostEntity,
        functionality: this
      });
    }
  }

  async execute(input: any, opts: any = {}): Promise<any> {
    const caller = opts.caller || 'default';
    const activeState = this.state;
    const trace = (telemetry.enabled) 
      ? telemetry.startTrace(this.id) 
      : null;

    // ── ACCESS CONTROL GATE ──────────────────────────────────────────
    // Enforced only when callerPort is provided (HTTP / WS transports).
    // In-memory local calls bypass the gate (trusted internal path).
    if (this.accessPolicy && opts.callerPort !== undefined) {
      const access = this.checkAccess(opts.callerPort as number, opts.accessKey as string | undefined);
      if (!access.allowed) {
        if (trace) telemetry.endTrace(this.id, trace, false);
        return { status: 'error', message: `[AccessDenied] ${access.reason}`, payload: null };
      }
    }

    // --- INPUT VALIDATION ---
    if (this.schema && this.schema.input) {
      try {
        if (typeof this.schema.input.parse === 'function') {
          // Zod-like
          input = this.schema.input.parse(input);
        } else if (typeof this.schema.input === 'function') {
          // Custom validator function
          if (!this.schema.input(input)) {
            throw new Error(`Input validation failed.`);
          }
        }
      } catch (err: any) {
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
        caller: caller
      });

      // --- OUTPUT VALIDATION ---
      if (this.schema && this.schema.output) {
        try {
          if (typeof this.schema.output.parse === 'function') {
            this.schema.output.parse(result);
          } else if (typeof this.schema.output === 'function') {
            if (!this.schema.output(result)) {
              console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}".`);
            }
          }
        } catch (err: any) {
          const msg = err.errors ? JSON.stringify(err.errors) : err.message;
          console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": ${msg}`);
        }
      }

      // --- TELEMETRY END (SUCCESS) ---
      if (trace) telemetry.endTrace(this.id, trace, true);

      return {
        status: 'success',
        payload: result
      };
    } catch (err: any) {
      // --- TELEMETRY END (ERROR) ---
      if (trace) telemetry.endTrace(this.id, trace, false);

      if (typeof this.lifecycle.failure === "function") {
        this.lifecycle.failure({ error: err, input, caller });
      }

      return {
        status: 'error',
        message: err.message,
        payload: null
      };
    }
  }
}

/**
 * KRNL REMOTE FUNCTIONALITY
 * Proxy for recursive bubbling.
 */
export class krnlRemoteFunctionality {
  id: string;
  targetFunction: string;
  targetEntity: any;
  visibility: string;
  isLocal: boolean = false;
  transport: krnlTransportAdapter;
  hostEntity: any;

  constructor(config: any = {}) {
    const { id, targetEntity, targetFunction, transport, visibility = 'public' } = config;
    this.id = id;
    this.targetFunction = targetFunction || id;
    this.targetEntity = targetEntity; 
    this.visibility = visibility;

    if (transport) {
      this.transport = transport;
    } else if (targetEntity) {
      this.transport = new MemoryTransportAdapter(targetEntity);
    } else {
      throw new Error("RemoteFunctionality requires either a transport or a targetEntity.");
    }
  }

  setVisibility(v: string): void {
    const oldVisibility = this.visibility;
    this.visibility = v;
    if (this.hostEntity && oldVisibility === 'private' && v === 'public') {
      this._registerInInterface();
      const owner = (this.hostEntity as any).hierarchyManager.getOwnerEntity();
      if (owner) (owner as any)._onComponentFunctionalityAdded(this.hostEntity, this);
    } else if (this.hostEntity && oldVisibility === 'public' && v === 'private') {
      this._unregisterFromInterface();
      const owner = (this.hostEntity as any).hierarchyManager.getOwnerEntity();
      if (owner && (owner as any)._onComponentFunctionalityRemoved) {
        (owner as any)._onComponentFunctionalityRemoved(this.hostEntity, this.id);
      }
    }
  }

  _unregisterFromInterface(): void {
    if (!this.hostEntity) return;
    (this.hostEntity as any).interface.removeCollector(this.id);
  }

  _registerInInterface(): void {
    const mainCollector = (this.hostEntity as any).interface.createCollector(this.id);
    mainCollector._directHandler = async (msg: any) => {
      const caller = msg.metadata?.caller || 'anonymous';
      return await this.execute(msg.data, { caller });
    };
  }

  bindToEntity(entity: any): void {
    this.hostEntity = entity;
    if (this.visibility === 'public') {
      this._registerInInterface();
    }
  }

  async execute(input: any, opts: any = {}): Promise<any> {
    return await this.transport.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
  }
}
