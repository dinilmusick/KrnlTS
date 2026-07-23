//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_Functionality_Types.ts
 * @description defines Logic Atoms with Visibility control for Recursive Bubbling.
 */
import { krnlEmitter } from "./K_LIB_Krnl_Messaging_Concepts.js";
import { telemetry } from "./K_LIB_Krnl_Telemetry.js";
import { ObjectKit } from "../tools/ObjectKit.js";
/**
 * Helper to ensure state isolation.
 */
function cloneState(source) {
    return ObjectKit.deepClone(source);
}
/**
 * TRANSPORT ADAPTER INTERFACE
 */
export class krnlTransportAdapter {
}
/**
 * MEMORY TRANSPORT ADAPTER
 * Default adapter for in-memory entity communication.
 */
export class MemoryTransportAdapter extends krnlTransportAdapter {
    targetEntity;
    constructor(targetEntity) {
        super();
        this.targetEntity = targetEntity;
    }
    async call(targetFunction, input, opts) {
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
    id;
    visibility;
    initialState;
    api;
    isLocal = true;
    sourcePath;
    helpers;
    emitters;
    schema;
    description;
    method;
    tests;
    examples;
    intelligenceSpec;
    /** Port-based access control policy. Absent = unrestricted. */
    accessPolicy;
    /** Shared secret for allow_with_key / ask_key_unlisted gates. */
    accessKey;
    lifecycle;
    state;
    hostEntity;
    intention;
    ai;
    constructor(config = {}) {
        const { id, visibility = 'public', // Default: public (bubbles up)
        initialState = {}, api = (input) => input, helpers = {}, emitters = {}, events = {}, schema = null, onMount = null, onTeardown = null, sourcePath = null, accessPolicy = null, accessKey = null, tests = [], } = config;
        if (!id)
            throw new Error("LocalFunctionality requires an ID.");
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
        this.tests = tests;
        this.examples = config.examples || null;
        this.intention = config.intention || null;
        this.intelligenceSpec = config.intelligenceSpec || null;
        if (accessPolicy)
            this.accessPolicy = accessPolicy;
        if (accessKey)
            this.accessKey = accessKey;
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
    _createObservedState(initialState) {
        const self = this;
        const proxyCache = new WeakMap();
        const handler = {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'object' && value !== null) {
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
                    self._notifyStateChanged(prop, undefined);
                }
                return result;
            }
        };
        return new Proxy(initialState, handler);
    }
    _notifyStateChanged(prop, value) {
        const stateEmitter = this.emitters.get('state:changed');
        if (stateEmitter) {
            stateEmitter.pushDataStreamToEmitter({
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
    setVisibility(v) {
        const oldVisibility = this.visibility;
        this.visibility = v;
        if (!this.hostEntity)
            return;
        if (oldVisibility === 'private' && v === 'public') {
            // Transition to Public: Register in interface
            this._registerInInterface();
            // Notify owner to bubble it up
            const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
            if (owner)
                owner._onComponentFunctionalityAdded(this.hostEntity, this);
        }
        else if (oldVisibility === 'public' && v === 'private') {
            this._unregisterFromInterface();
            const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
            if (owner && owner._onComponentFunctionalityRemoved) {
                owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
            }
        }
    }
    _unregisterFromInterface() {
        const entity = this.hostEntity;
        if (!entity)
            return;
        entity.interface.removeCollector(this.id);
        this.emitters.forEach((_, eid) => {
            entity.interface.removeEmitter(`${this.id}:${eid}`);
        });
    }
    _registerInInterface() {
        const entity = this.hostEntity;
        // Register API as input
        const mainCollector = entity.interface.createCollector(this.id);
        mainCollector._directHandler = async (msg) => {
            const caller = msg.metadata?.caller || 'anonymous';
            return await this.execute(msg.data, { caller });
        };
        // Register Emitters as outputs
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
        // If no policy is defined, access is unrestricted (free).
        if (!p)
            return { allowed: true };
        if (p.forbid.includes(callerPort))
            return { allowed: false, reason: `Port ${callerPort} is explicitly forbidden from accessing this endpoint.` };
        if (p.allow.includes(callerPort))
            return { allowed: true };
        if (p.allow_with_key.includes(callerPort)) {
            if (key && key === this.accessKey)
                return { allowed: true };
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
                if (key && key === this.accessKey)
                    return { allowed: true };
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
    bindToEntity(entity) {
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
    teardown() {
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
    async execute(input, opts = {}) {
        const caller = opts.caller || 'default';
        const activeState = this.state;
        const activeTelemetry = this.hostEntity?.telemetry || telemetry;
        const trace = (activeTelemetry.enabled)
            ? activeTelemetry.startTrace(this.id)
            : null;
        // ── ACCESS CONTROL GATE ──────────────────────────────────────────
        // Enforced only when callerPort is provided (HTTP / WS transports).
        // In-memory local calls bypass the gate (trusted internal path).
        if (this.accessPolicy && opts.callerPort !== undefined) {
            const access = this.checkAccess(opts.callerPort, opts.accessKey);
            if (!access.allowed) {
                if (trace)
                    activeTelemetry.endTrace(this.id, trace, false);
                return { status: 'error', message: `[AccessDenied] ${access.reason}`, payload: null };
            }
        }
        // --- INPUT VALIDATION ---
        if (this.schema && this.schema.input) {
            try {
                if (typeof this.schema.input.verify === 'function') {
                    const verifyError = this.schema.input.verify(input);
                    if (verifyError) {
                        throw new Error(`Protobuf verification failed: ${verifyError}`);
                    }
                }
                else if (typeof this.schema.input.parse === 'function') {
                    // Zod-like
                    input = this.schema.input.parse(input);
                }
                else if (typeof this.schema.input === 'function') {
                    // Custom validator function
                    if (!this.schema.input(input)) {
                        throw new Error(`Input validation failed.`);
                    }
                }
            }
            catch (err) {
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
                    if (typeof this.schema.output.verify === 'function') {
                        const verifyError = this.schema.output.verify(result);
                        if (verifyError) {
                            console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": Protobuf verification failed: ${verifyError}`);
                        }
                    }
                    else if (typeof this.schema.output.parse === 'function') {
                        this.schema.output.parse(result);
                    }
                    else if (typeof this.schema.output === 'function') {
                        if (!this.schema.output(result)) {
                            console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}".`);
                        }
                    }
                }
                catch (err) {
                    const msg = err.errors ? JSON.stringify(err.errors) : err.message;
                    console.warn(`[KrnlSchemaWarning] Output validation failed for "${this.id}": ${msg}`);
                }
            }
            // --- TELEMETRY END (SUCCESS) ---
            if (trace)
                activeTelemetry.endTrace(this.id, trace, true);
            // --- RECORD & BROADCAST INTERACTION ---
            const interactionEvent = {
                type: 'frontend:interaction',
                fid: this.id,
                timestamp: Date.now(),
                input,
                output: result
            };
            const stateEmitter = this.emitters.get('state:changed');
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
            return {
                status: 'success',
                payload: result
            };
        }
        catch (err) {
            // --- TELEMETRY END (ERROR) ---
            if (trace)
                activeTelemetry.endTrace(this.id, trace, false);
            // --- RECORD & BROADCAST ERROR INTERACTION ---
            const interactionEvent = {
                type: 'frontend:interaction',
                fid: this.id,
                timestamp: Date.now(),
                input,
                output: { status: 'error', message: err.message, payload: null }
            };
            const stateEmitter = this.emitters.get('state:changed');
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
    id;
    targetFunction;
    targetEntity;
    visibility;
    isLocal = false;
    transport;
    hostEntity;
    constructor(config = {}) {
        const { id, targetEntity, targetFunction, transport, visibility = 'public' } = config;
        this.id = id;
        this.targetFunction = targetFunction || id;
        this.targetEntity = targetEntity;
        this.visibility = visibility;
        if (transport) {
            this.transport = transport;
        }
        else if (targetEntity) {
            this.transport = new MemoryTransportAdapter(targetEntity);
        }
        else {
            throw new Error("RemoteFunctionality requires either a transport or a targetEntity.");
        }
    }
    setVisibility(v) {
        const oldVisibility = this.visibility;
        this.visibility = v;
        if (this.hostEntity && oldVisibility === 'private' && v === 'public') {
            this._registerInInterface();
            const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
            if (owner)
                owner._onComponentFunctionalityAdded(this.hostEntity, this);
        }
        else if (this.hostEntity && oldVisibility === 'public' && v === 'private') {
            this._unregisterFromInterface();
            const owner = this.hostEntity.hierarchyManager.getOwnerEntity();
            if (owner && owner._onComponentFunctionalityRemoved) {
                owner._onComponentFunctionalityRemoved(this.hostEntity, this.id);
            }
        }
    }
    _unregisterFromInterface() {
        if (!this.hostEntity)
            return;
        this.hostEntity.interface.removeCollector(this.id);
    }
    _registerInInterface() {
        const mainCollector = this.hostEntity.interface.createCollector(this.id);
        mainCollector._directHandler = async (msg) => {
            const caller = msg.metadata?.caller || 'anonymous';
            return await this.execute(msg.data, { caller });
        };
    }
    bindToEntity(entity) {
        this.hostEntity = entity;
        if (this.visibility === 'public') {
            this._registerInInterface();
        }
    }
    async execute(input, opts = {}) {
        return await this.transport.call(this.targetFunction, input, { ...opts, caller: this.hostEntity.entityName });
    }
}
//# sourceMappingURL=K_LIB_Krnl_Functionality_Types.js.map