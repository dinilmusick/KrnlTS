// src/state/ServiceStateStore.ts
var ServiceStateStore = class {
  state;
  listeners = /* @__PURE__ */ new Set();
  constructor(initialState) {
    this.state = { ...initialState };
  }
  getState() {
    return Object.freeze({ ...this.state });
  }
  setState(mutation) {
    this.state = { ...this.state, ...mutation };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot, mutation);
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  reset(newState) {
    this.state = { ...newState || {} };
  }
};

// src/events/ServiceEventBus.ts
var ServiceEventBus = class {
  handlers = /* @__PURE__ */ new Map();
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, /* @__PURE__ */ new Set());
    }
    const set = this.handlers.get(event);
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }
  emit(event, payload) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[ServiceEventBus] Handler error for '${event}':`, err);
      }
    }
  }
  clear() {
    this.handlers.clear();
  }
};

// src/lifecycle/LifecycleManager.ts
var TRANSITIONS = {
  uninitialized: ["initializing"],
  initializing: ["ready", "uninitialized"],
  ready: ["starting"],
  starting: ["running", "ready"],
  running: ["stopping"],
  stopping: ["stopped", "running"],
  stopped: ["starting"]
};
var LifecycleManager = class {
  status = "uninitialized";
  getStatus() {
    return this.status;
  }
  canTransitionTo(next) {
    return TRANSITIONS[this.status].includes(next);
  }
  transitionTo(next) {
    if (!this.canTransitionTo(next)) {
      throw new Error("[Lifecycle] Invalid transition '" + this.status + "' -> '" + next + "'.");
    }
    this.status = next;
  }
  setStatus(next) {
    this.transitionTo(next);
  }
  assertRunning(serviceName) {
    if (this.status !== "running") {
      throw new Error(
        "[Service:" + serviceName + "] Cannot invoke operation while status is '" + this.status + "' (expected 'running')."
      );
    }
  }
};

// src/services/ServiceInstance.ts
var ServiceInstance = class {
  constructor(definition) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.lifecycle = new LifecycleManager();
    this.eventBus = new ServiceEventBus();
    if (definition.state) {
      this.stateStore = new ServiceStateStore(definition.state.initial);
    }
  }
  definition;
  id;
  name;
  version;
  stateStore;
  eventBus;
  lifecycle;
  initialized = false;
  disposed = false;
  getDefinition() {
    return this.definition;
  }
  getStatus() {
    return this.lifecycle.getStatus();
  }
  async start() {
    if (this.disposed) throw new Error("[Service:" + this.name + "] Cannot start a disposed service.");
    const current = this.lifecycle.getStatus();
    if (current === "running") return;
    if (current === "initializing" || current === "starting" || current === "stopping") {
      throw new Error("[Service:" + this.name + "] Cannot start while status is '" + current + "'.");
    }
    if (!this.initialized) {
      this.lifecycle.transitionTo("initializing");
      try {
        await this.definition.lifecycle?.onInit?.();
        this.initialized = true;
        this.lifecycle.transitionTo("ready");
      } catch (error) {
        this.lifecycle.transitionTo("uninitialized");
        throw error;
      }
    }
    this.lifecycle.transitionTo("starting");
    try {
      await this.definition.lifecycle?.onStart?.();
      this.lifecycle.transitionTo("running");
    } catch (error) {
      this.lifecycle.transitionTo("ready");
      throw error;
    }
  }
  async stop() {
    const current = this.lifecycle.getStatus();
    if (current === "stopped") return;
    if (current !== "running") {
      throw new Error("[Service:" + this.name + "] Cannot stop while status is '" + current + "'.");
    }
    this.lifecycle.transitionTo("stopping");
    try {
      await this.definition.lifecycle?.onStop?.();
      this.lifecycle.transitionTo("stopped");
    } catch (error) {
      this.lifecycle.transitionTo("running");
      throw error;
    }
  }
  async dispose() {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === "running") await this.stop();
    await this.definition.lifecycle?.onDispose?.();
    this.disposed = true;
  }
  async call(op, input, ctx = {}) {
    this.lifecycle.assertRunning(this.name);
    const operation = this.definition.operations[op];
    if (!operation) {
      throw new Error("[Service:" + this.name + "] Operation '" + op + "' not found.");
    }
    return await operation.handler(input, ctx);
  }
  getState() {
    return this.stateStore?.getState() ?? Object.freeze({});
  }
  setState(mutation) {
    if (!this.stateStore) {
      this.stateStore = new ServiceStateStore({ ...mutation });
      return;
    }
    this.stateStore.setState(mutation);
  }
  on(event, handler) {
    return this.eventBus.on(event, handler);
  }
  emit(event, payload) {
    this.eventBus.emit(event, payload);
  }
};

// src/services/ServiceProxy.ts
var ServiceProxy = class {
  constructor(definition, adapter, endpoint) {
    this.definition = definition;
    this.adapter = adapter;
    this.endpoint = endpoint;
    if (!definition) {
      throw new Error("[ServiceProxy] Missing service definition.");
    }
    if (!adapter || typeof adapter.send !== "function") {
      throw new Error("[ServiceProxy:" + (definition.name || "unknown") + "] Missing or invalid protocol adapter.");
    }
    if (!endpoint || typeof endpoint.address !== "string" || endpoint.address.length === 0) {
      throw new Error("[ServiceProxy:" + (definition.name || "unknown") + "] Missing or invalid endpoint descriptor.");
    }
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.stateCache = { ...definition.state?.initial ?? {} };
  }
  definition;
  adapter;
  endpoint;
  id;
  name;
  version;
  stateCache;
  eventHandlers = /* @__PURE__ */ new Map();
  lifecycle = new LifecycleManager();
  disposed = false;
  getDefinition() {
    return this.definition;
  }
  getStatus() {
    return this.lifecycle.getStatus();
  }
  async start() {
    if (this.disposed) {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot start a disposed service proxy.");
    }
    const status = this.lifecycle.getStatus();
    if (status === "running") return;
    if (status === "stopping" || status === "starting" || status === "initializing") {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot start while status is '" + status + "'.");
    }
    if (status === "uninitialized") {
      this.lifecycle.transitionTo("initializing");
      this.lifecycle.transitionTo("ready");
    }
    this.lifecycle.transitionTo("starting");
    this.lifecycle.transitionTo("running");
  }
  async stop() {
    const status = this.lifecycle.getStatus();
    if (status === "stopped") return;
    if (status !== "running") {
      throw new Error("[ServiceProxy:" + this.name + "] Cannot stop while status is '" + status + "'.");
    }
    this.lifecycle.transitionTo("stopping");
    this.lifecycle.transitionTo("stopped");
  }
  async dispose() {
    if (this.disposed) return;
    if (this.lifecycle.getStatus() === "running") await this.stop();
    this.disposed = true;
  }
  async call(op, input, ctx = {}) {
    if (!this.definition.operations[op]) {
      throw new Error("[ServiceProxy:" + this.name + "] Operation '" + op + "' not found.");
    }
    if (this.lifecycle.getStatus() !== "running") {
      await this.start();
    }
    if (!this.adapter.send) {
      throw new Error("[ServiceProxy:" + this.name + "] Adapter does not support send().");
    }
    const envelope = {
      id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: "request",
      operation: op,
      payload: input,
      timestamp: Date.now()
    };
    const response = await this.adapter.send(this.endpoint, envelope);
    if (response.error) {
      throw new Error("[ServiceProxy:" + this.name + "] Remote error: " + response.error);
    }
    return response.payload;
  }
  getState() {
    return Object.freeze({ ...this.stateCache });
  }
  setState(mutation) {
    this.stateCache = { ...this.stateCache, ...mutation };
  }
  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, /* @__PURE__ */ new Set());
    const handlers = this.eventHandlers.get(event);
    handlers.add(handler);
    return () => handlers.delete(handler);
  }
  emit(event, payload) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of Array.from(handlers)) {
      try {
        handler(payload);
      } catch (error) {
        console.error("[ServiceProxy:" + this.name + "] Event handler error for '" + event + "':", error);
      }
    }
  }
};

// src/services/ServiceGenerators.ts
function assertRecord(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be an object.");
  }
}
function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("[KrnlTS] Invalid service definition: '" + field + "' must be a non-empty string.");
  }
}
function validateServiceDefinition(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("[KrnlTS] Invalid service definition: expected an object.");
  }
  assertNonEmptyString(definition.id, "id");
  assertNonEmptyString(definition.name, "name");
  assertNonEmptyString(definition.version, "version");
  if (!definition.operations || typeof definition.operations !== "object") {
    throw new Error("[Service:" + definition.name + "] Invalid operations: expected an object.");
  }
  for (const [key, operation] of Object.entries(definition.operations)) {
    if (!operation || typeof operation !== "object") {
      throw new Error("[Service:" + definition.name + "] Invalid operation '" + key + "'.");
    }
    assertNonEmptyString(operation.id, "operations." + key + ".id");
    assertNonEmptyString(operation.name, "operations." + key + ".name");
    if (operation.inputSchema !== void 0) assertRecord(operation.inputSchema, "operations." + key + ".inputSchema");
    if (operation.outputSchema !== void 0) assertRecord(operation.outputSchema, "operations." + key + ".outputSchema");
    if (typeof operation.handler !== "function") {
      throw new Error("[Service:" + definition.name + "] Operation '" + key + "' must define a handler.");
    }
  }
  for (const [key, event] of Object.entries(definition.events ?? {})) {
    if (!event || typeof event !== "object") {
      throw new Error("[Service:" + definition.name + "] Invalid event '" + key + "'.");
    }
    assertNonEmptyString(event.name, "events." + key + ".name");
  }
  for (const [key, schema] of Object.entries(definition.inputs ?? {})) assertRecord(schema, "inputs." + key);
  for (const [key, schema] of Object.entries(definition.outputs ?? {})) assertRecord(schema, "outputs." + key);
  if (definition.state?.schema !== void 0) assertRecord(definition.state.schema, "state.schema");
  for (const capability of definition.capabilities ?? []) {
    assertNonEmptyString(capability.id, "capability.id");
    assertNonEmptyString(capability.name, "capability.name");
    if (!Array.isArray(capability.protocols)) {
      throw new Error("[Service:" + definition.name + "] Capability '" + capability.name + "' protocols must be an array.");
    }
  }
  for (const dependency of definition.dependencies ?? []) {
    assertNonEmptyString(dependency.serviceId, "dependency.serviceId");
  }
  return definition;
}
function createServiceDefinition(definition) {
  return validateServiceDefinition(definition);
}
function createService(definition) {
  return new ServiceInstance(validateServiceDefinition(definition));
}
function createServiceProxy(definition, adapter, endpoint) {
  validateServiceDefinition(definition);
  if (!adapter || typeof adapter.send !== "function") {
    throw new Error("[ServiceProxy:" + definition.name + "] Adapter must implement send().");
  }
  if (!endpoint || typeof endpoint.address !== "string" || endpoint.address.length === 0) {
    throw new Error("[ServiceProxy:" + definition.name + "] Endpoint must have an address.");
  }
  return new ServiceProxy(definition, adapter, endpoint);
}

// src/orchestration/canonical/model.ts
function validateOrchestrationDAG(steps) {
  const errors = [];
  const stepMap = /* @__PURE__ */ new Map();
  for (const step of steps) {
    if (stepMap.has(step.id)) {
      errors.push(`Duplicate step ID detected: "${step.id}"`);
    }
    stepMap.set(step.id, step);
  }
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepMap.has(dep)) {
          errors.push(`Step "${step.id}" depends on unknown step "${dep}".`);
        }
      }
    }
  }
  if (errors.length > 0) {
    return { valid: false, order: [], errors };
  }
  const inDegree = /* @__PURE__ */ new Map();
  const graph = /* @__PURE__ */ new Map();
  for (const step of steps) {
    inDegree.set(step.id, 0);
    graph.set(step.id, []);
  }
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        graph.get(dep)?.push(step.id);
      }
    }
  }
  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }
  const order = [];
  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }
  if (order.length !== steps.length) {
    errors.push("Circular dependency cycle detected in orchestration DAG.");
    return { valid: false, order: [], errors };
  }
  return { valid: true, order, errors: [] };
}

// src/orchestration/canonical/WorkerExecutionBoundary.ts
var WorkerExecutionBoundary = class _WorkerExecutionBoundary {
  constructor(workerId, handler) {
    this.workerId = workerId;
    this.handler = handler;
  }
  workerId;
  handler;
  async processJob(command, metadata) {
    if (!this.handler) {
      return {
        correlationId: command.correlationId,
        status: "COMPLETED",
        data: command.payload,
        executionTimestamp: Date.now()
      };
    }
    const context = {
      isWorkerContext: true,
      workerId: this.workerId,
      timestamp: Date.now(),
      correlationId: command.correlationId,
      metadata
    };
    _WorkerExecutionBoundary.assertWorkerContext(context);
    return await this.handler(command, context);
  }
  static assertWorkerContext(context) {
    if (!context || !context.isWorkerContext) {
      throw new Error(
        "[WorkerExecutionBoundary] Violation: DIRECT_CALL -> SERVICE_BOUNDARY is strictly forbidden. All operations must execute inside BullMQ Worker context."
      );
    }
  }
};

// src/orchestration/canonical/BullMQExecutionEngine.ts
var BullMQExecutionEngine = class {
  queueName;
  concurrency;
  idempotencyStore = /* @__PURE__ */ new Map();
  activeExecutions = /* @__PURE__ */ new Map();
  inMemoryJobs = /* @__PURE__ */ new Map();
  isRunning = false;
  activeWorkerCount = 0;
  workerBoundary;
  constructor(options = {}) {
    this.queueName = options.queueName ?? "krnl_orchestration_default";
    this.concurrency = options.concurrency ?? 10;
    this.workerBoundary = new WorkerExecutionBoundary(`${this.queueName}_worker`, async (cmd, ctx) => {
      return this.dispatchInternalCommand(cmd, ctx);
    });
  }
  async start() {
    this.isRunning = true;
  }
  async stop() {
    this.isRunning = false;
  }
  async dispose() {
    await this.stop();
    for (const [id, active] of this.activeExecutions.entries()) {
      active.abortController.abort();
      active.context.isCancelled = true;
    }
    this.activeExecutions.clear();
    this.inMemoryJobs.clear();
    this.idempotencyStore.clear();
  }
  async close() {
    await this.dispose();
  }
  getWorkerBoundary() {
    return this.workerBoundary;
  }
  /**
   * Dispatches a single command through the BullMQ queue and worker execution boundary.
   */
  async executeCommand(command, handler) {
    if (command.idempotencyKey && this.idempotencyStore.has(command.idempotencyKey)) {
      return this.idempotencyStore.get(command.idempotencyKey);
    }
    const job = {
      id: command.id,
      name: command.type,
      payload: command.payload,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      attemptsMade: 0,
      maxAttempts: 1,
      status: "waiting",
      enqueuedAt: Date.now(),
      handler
    };
    this.inMemoryJobs.set(job.id, job);
    try {
      job.status = "active";
      const result = await this.workerBoundary.processJob(command);
      job.status = result.status === "COMPLETED" ? "completed" : "failed";
      job.result = result.data;
      job.error = result.error;
      if (command.idempotencyKey) {
        this.idempotencyStore.set(command.idempotencyKey, result);
      }
      return result;
    } catch (err) {
      job.status = "failed";
      job.error = err?.message || String(err);
      const failedResult = {
        correlationId: command.correlationId,
        status: "FAILED",
        error: job.error,
        executionTimestamp: Date.now()
      };
      return failedResult;
    }
  }
  async dispatchInternalCommand(command, context) {
    WorkerExecutionBoundary.assertWorkerContext(context);
    const job = this.inMemoryJobs.get(command.id);
    if (!job) {
      throw new Error(`[BullMQExecutionEngine] Job ${command.id} not found in queue.`);
    }
    try {
      const data = await job.handler(command.payload, context);
      return {
        correlationId: command.correlationId,
        status: "COMPLETED",
        data,
        executionTimestamp: Date.now()
      };
    } catch (err) {
      return {
        correlationId: command.correlationId,
        status: "FAILED",
        error: err?.message || String(err),
        executionTimestamp: Date.now()
      };
    }
  }
  /**
   * Executes a full Canonical Orchestration DAG through the BullMQ worker boundary.
   */
  async executeOrchestration(descriptor, steps, input, options = {}) {
    const startedAt = Date.now();
    const correlationId = options.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const executionId = `exec_${Math.random().toString(36).substring(2, 11)}`;
    if (options.idempotencyKey && this.idempotencyStore.has(options.idempotencyKey)) {
      const cached = this.idempotencyStore.get(options.idempotencyKey);
      return cached.data;
    }
    const validation = validateOrchestrationDAG(steps);
    if (!validation.valid) {
      return {
        orchestrationId: descriptor.id,
        correlationId,
        status: "FAILED",
        stepResults: {},
        error: `Invalid DAG: ${validation.errors.join("; ")}`,
        startedAt,
        completedAt: Date.now(),
        executionMetadata: { validationErrors: validation.errors }
      };
    }
    const abortController = new AbortController();
    if (options.abortSignal) {
      if (options.abortSignal.aborted) {
        abortController.abort();
      } else {
        options.abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
      }
    }
    const context = {
      correlationId,
      parentCorrelationId: options.parentCorrelationId,
      orchestrationId: descriptor.id,
      executionId,
      idempotencyKey: options.idempotencyKey,
      scope: descriptor.scope || "functionality",
      results: { input },
      metadata: { ...options.metadata },
      timestamp: startedAt,
      isCancelled: abortController.signal.aborted,
      abortSignal: abortController.signal
    };
    abortController.signal.addEventListener("abort", () => {
      context.isCancelled = true;
    });
    this.activeExecutions.set(executionId, { abortController, context });
    const timeoutMs = options.timeoutMs || descriptor.timeoutMs;
    let timeoutTimer;
    if (timeoutMs && timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        context.isCancelled = true;
        abortController.abort();
      }, timeoutMs);
    }
    const stepResults = {};
    const executedSteps = /* @__PURE__ */ new Set();
    const executedComps = [];
    const stepMap = /* @__PURE__ */ new Map();
    for (const step of steps) stepMap.set(step.id, step);
    let finalOutput = void 0;
    let orchestrationStatus = "COMPLETED";
    let errorMessage;
    try {
      while (executedSteps.size < steps.length) {
        if (context.isCancelled) {
          orchestrationStatus = "CANCELLED";
          errorMessage = "Orchestration execution cancelled.";
          break;
        }
        const readySteps = steps.filter((step) => {
          if (executedSteps.has(step.id)) return false;
          if (!step.dependsOn || step.dependsOn.length === 0) return true;
          return step.dependsOn.every((dep) => executedSteps.has(dep));
        });
        if (readySteps.length === 0) {
          break;
        }
        const batch = readySteps.slice(0, this.concurrency);
        const batchPromises = batch.map(async (step) => {
          const stepRes = await this.executeSingleStep(step, context, options.nestedRunner);
          stepResults[step.id] = stepRes;
          executedSteps.add(step.id);
          if (stepRes.status === "COMPLETED") {
            context.results[step.id] = stepRes.output;
            finalOutput = stepRes.output;
            if (step.compensation?.handler) {
              executedComps.push(() => step.compensation.handler(context));
            }
          } else if (stepRes.status === "SKIPPED") {
          } else if (stepRes.status === "CANCELLED") {
            const cancelErr = new Error("The operation was aborted");
            cancelErr.name = "AbortError";
            throw cancelErr;
          } else {
            throw new Error(stepRes.error || `Step "${step.id}" failed with status ${stepRes.status}`);
          }
        });
        await Promise.all(batchPromises);
      }
    } catch (err) {
      const wasCancelled = context.isCancelled || abortController.signal.aborted || err?.name === "AbortError";
      orchestrationStatus = wasCancelled ? "CANCELLED" : "FAILED";
      errorMessage = wasCancelled ? "The operation was aborted" : err?.message || String(err);
      if (executedComps.length > 0) {
        for (let i = executedComps.length - 1; i >= 0; i--) {
          try {
            await executedComps[i]();
          } catch (compErr) {
            console.error(`[BullMQExecutionEngine] Compensation failed:`, compErr);
          }
        }
      }
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.activeExecutions.delete(executionId);
    }
    const result = {
      orchestrationId: descriptor.id,
      correlationId,
      status: orchestrationStatus,
      output: finalOutput,
      stepResults,
      error: errorMessage,
      startedAt,
      completedAt: Date.now(),
      executionMetadata: {
        executionId,
        scope: descriptor.scope,
        stepsCount: steps.length,
        executedCount: executedSteps.size
      }
    };
    if (options.idempotencyKey) {
      this.idempotencyStore.set(options.idempotencyKey, {
        correlationId,
        status: orchestrationStatus === "COMPLETED" ? "COMPLETED" : "FAILED",
        data: result,
        executionTimestamp: Date.now()
      });
    }
    return result;
  }
  async executeSingleStep(step, context, nestedRunner) {
    const stepStart = Date.now();
    let attempts = 0;
    const maxAttempts = step.retryPolicy?.maxAttempts ?? 1;
    if (step.condition) {
      try {
        const conditionPass = await step.condition(context);
        if (!conditionPass) {
          return {
            stepId: step.id,
            status: "SKIPPED",
            attempts: 0,
            startedAt: stepStart,
            completedAt: Date.now()
          };
        }
      } catch (condErr) {
        return {
          stepId: step.id,
          status: "FAILED",
          attempts: 1,
          error: `Condition evaluation failed: ${condErr?.message || String(condErr)}`,
          startedAt: stepStart,
          completedAt: Date.now()
        };
      }
    }
    let lastError;
    while (attempts < maxAttempts) {
      if (context.isCancelled) {
        return {
          stepId: step.id,
          status: "CANCELLED",
          attempts,
          startedAt: stepStart,
          completedAt: Date.now()
        };
      }
      attempts++;
      try {
        let stepOutput;
        const stepTimeoutMs = step.timeoutPolicy?.timeoutMs;
        let stepTimer;
        let stepCancelled = false;
        const runPromise = (async () => {
          if (step.type === "nested" && step.nestedOrchestrationId && nestedRunner) {
            const childContext = {
              ...context,
              parentCorrelationId: context.correlationId,
              correlationId: `${context.correlationId}.${step.id}`
            };
            return await nestedRunner(step.nestedOrchestrationId, context.results, childContext);
          }
          if (step.type === "fanOut" && step.getItems) {
            const items = await step.getItems(context);
            if (!Array.isArray(items)) throw new Error(`[fanOut] getItems must return an array.`);
            const concurrency = step.concurrency || 5;
            const results = [];
            for (let i = 0; i < items.length; i += concurrency) {
              const slice = items.slice(i, i + concurrency);
              const sliceRes = await Promise.all(
                slice.map((item) => step.handler ? step.handler(item, context) : Promise.resolve(item))
              );
              results.push(...sliceRes);
            }
            return results;
          }
          if (step.handler) {
            return await step.handler(context.results, context);
          }
          return context.results;
        })();
        const abortPromise = new Promise((_, reject) => {
          if (context.isCancelled || context.abortSignal?.aborted) {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          }
          context.abortSignal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
        const promisesToRace = [runPromise, abortPromise];
        if (stepTimeoutMs && stepTimeoutMs > 0) {
          const timeoutPromise = new Promise((_, reject) => {
            stepTimer = setTimeout(() => {
              stepCancelled = true;
              reject(new Error(`Step "${step.id}" timed out after ${stepTimeoutMs}ms.`));
            }, stepTimeoutMs);
          });
          promisesToRace.push(timeoutPromise);
        }
        stepOutput = await Promise.race(promisesToRace);
        if (stepTimer) clearTimeout(stepTimer);
        return {
          stepId: step.id,
          status: "COMPLETED",
          attempts,
          output: stepOutput,
          startedAt: stepStart,
          completedAt: Date.now()
        };
      } catch (err) {
        if (context.isCancelled || context.abortSignal?.aborted || err?.name === "AbortError" || err?.message === "Operation cancelled" || err?.message === "The operation was aborted") {
          return {
            stepId: step.id,
            status: "CANCELLED",
            attempts,
            startedAt: stepStart,
            completedAt: Date.now()
          };
        }
        lastError = err;
        if (step.catchHandler && attempts >= maxAttempts) {
          try {
            const recovered = await step.catchHandler(err, context);
            return {
              stepId: step.id,
              status: "COMPLETED",
              attempts,
              output: recovered,
              startedAt: stepStart,
              completedAt: Date.now()
            };
          } catch (catchErr) {
            lastError = catchErr;
          }
        }
        if (attempts < maxAttempts && step.retryPolicy) {
          const backoffDelay = this.computeBackoff(step.retryPolicy, attempts);
          await new Promise((r) => setTimeout(r, backoffDelay));
        }
      }
    }
    return {
      stepId: step.id,
      status: "FAILED",
      attempts,
      error: lastError?.message || String(lastError),
      startedAt: stepStart,
      completedAt: Date.now()
    };
  }
  computeBackoff(policy, attempt) {
    const base = policy.backoffMs || 100;
    let delay;
    if (policy.backoff === "exponential") {
      delay = base * Math.pow(2, attempt - 1);
    } else {
      delay = base * attempt;
    }
    if (policy.maxBackoffMs && delay > policy.maxBackoffMs) {
      delay = policy.maxBackoffMs;
    }
    if (policy.jitter) {
      delay += Math.floor(Math.random() * (base * 0.5));
    }
    return delay;
  }
  cancelExecution(executionId) {
    const active = this.activeExecutions.get(executionId);
    if (active) {
      active.context.isCancelled = true;
      active.abortController.abort();
      return true;
    }
    return false;
  }
};

// src/services/ServiceFacade.ts
var ServiceFacade = class {
  id;
  name;
  version;
  description;
  functionalities;
  functionalityOrchestrations;
  dependencies;
  capabilities;
  instance;
  executionEngine;
  constructor(config) {
    if (!config || !config.id || typeof config.id !== "string") {
      throw new Error("[ServiceFacade] ServiceFacade requires a valid id.");
    }
    this.id = config.id;
    this.name = config.name || config.id;
    this.version = config.version || "1.0.0";
    this.description = config.description || "";
    this.functionalities = config.functionalities ? { ...config.functionalities } : {};
    this.functionalityOrchestrations = config.functionalityOrchestrations ? { ...config.functionalityOrchestrations } : config.orchestrations ? { ...config.orchestrations } : {};
    this.dependencies = Object.freeze(config.dependencies ? [...config.dependencies] : []);
    this.capabilities = Object.freeze(config.capabilities ? [...config.capabilities] : []);
    if (config.instance) {
      this.instance = config.instance;
    } else if (config.definition) {
      this.instance = new ServiceInstance(config.definition);
    } else {
      this.instance = new ServiceInstance({
        id: this.id,
        name: this.name,
        version: this.version,
        operations: {}
      });
    }
    this.executionEngine = new BullMQExecutionEngine({
      queueName: `krnl_queue_${this.id}`,
      connection: config.queueConnection,
      concurrency: config.concurrency ?? 10
    });
  }
  get orchestrations() {
    return this.functionalityOrchestrations;
  }
  getInstance() {
    return this.instance;
  }
  getExecutionEngine() {
    return this.executionEngine;
  }
  getWorkerBoundary() {
    return this.executionEngine.getWorkerBoundary();
  }
  getStatus() {
    return this.instance.getStatus();
  }
  async start() {
    await this.instance.start();
    await this.executionEngine.start();
  }
  async stop() {
    await this.executionEngine.stop();
    await this.instance.stop();
  }
  async dispose() {
    await this.executionEngine.dispose();
    await this.instance.dispose();
  }
  /**
   * External caller callable boundary for single functionality / operation execution.
   * Path: External Caller -> Service Facade -> BullMQ Command -> Worker -> Functionality -> Result.
   * Strictly avoids synchronous unmediated execution outside the queue.
   */
  async call(op, input, ctx) {
    const correlationId = ctx?.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const commandId = `cmd_${this.id}_${op}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const command = {
      id: commandId,
      type: `${this.id}.${op}`,
      payload: input ?? {},
      correlationId,
      idempotencyKey: ctx?.idempotencyKey,
      createdAt: Date.now()
    };
    const result = await this.executionEngine.executeCommand(command, async (payload, workerCtx) => {
      WorkerExecutionBoundary.assertWorkerContext(workerCtx);
      if (this.functionalities[op] && typeof this.functionalities[op].execute === "function") {
        return await this.functionalities[op].execute(payload, {
          correlationId: workerCtx.correlationId,
          state: this.instance.getState()
        });
      }
      return await this.instance.call(op, payload, {
        correlationId: workerCtx.correlationId,
        idempotencyKey: command.idempotencyKey
      });
    });
    if (result.status === "FAILED") {
      throw new Error(result.error || `[ServiceFacade:${this.id}] Operation '${op}' execution failed.`);
    }
    return result.data;
  }
  /**
   * External caller callable boundary for functionality orchestration execution.
   * Path: External Caller -> Service Facade -> BullMQ Command -> Worker -> FunctionalityOrchestration -> Result.
   */
  async orchestrate(orchestrationName, input, options = {}) {
    const orch = this.functionalityOrchestrations[orchestrationName];
    if (!orch) {
      throw new Error(
        `[ServiceFacade:${this.id}] FunctionalityOrchestration "${orchestrationName}" not found.`
      );
    }
    const correlationId = options.correlationId || `corr_${Math.random().toString(36).substring(2, 11)}`;
    const commandId = `cmd_orch_${this.id}_${orchestrationName}_${Date.now()}`;
    const command = {
      id: commandId,
      type: `${this.id}.orchestrations.${orchestrationName}`,
      payload: input ?? {},
      correlationId,
      idempotencyKey: options.idempotencyKey,
      createdAt: Date.now()
    };
    const cmdResult = await this.executionEngine.executeCommand(
      command,
      async (payload, workerCtx) => {
        WorkerExecutionBoundary.assertWorkerContext(workerCtx);
        const rawSteps = orch.getSteps();
        const boundSteps = rawSteps.map((s) => {
          if (s.type === "task" && s.target) {
            return {
              ...s,
              handler: async (stepInput, stepCtx) => {
                return await this.call(s.target, stepInput, {
                  correlationId: stepCtx.correlationId
                });
              }
            };
          }
          return s;
        });
        const nestedRunner = async (childOrchId, childInput, childCtx) => {
          const childOrch = this.functionalityOrchestrations[childOrchId];
          if (!childOrch) {
            throw new Error(
              `[ServiceFacade:${this.id}] Nested FunctionalityOrchestration "${childOrchId}" not found in service.`
            );
          }
          const nestedResult = await this.orchestrate(childOrchId, childInput, {
            correlationId: childCtx.correlationId,
            timeoutMs: childOrch.timeoutMs
          });
          if (nestedResult.status !== "COMPLETED") {
            throw new Error(nestedResult.error || `Nested orchestration "${childOrchId}" failed.`);
          }
          return nestedResult.output;
        };
        return await this.executionEngine.executeOrchestration(
          { id: orch.id, name: orch.name, version: orch.version, timeoutMs: orch.timeoutMs, scope: "functionality" },
          boundSteps,
          payload,
          {
            correlationId: workerCtx.correlationId,
            idempotencyKey: command.idempotencyKey,
            timeoutMs: options.timeoutMs || orch.timeoutMs,
            metadata: options.metadata,
            nestedRunner
          }
        );
      }
    );
    if (cmdResult.status === "FAILED") {
      throw new Error(cmdResult.error || `[ServiceFacade:${this.id}] Orchestration failed.`);
    }
    return cmdResult.data;
  }
  getState() {
    return this.instance.getState();
  }
  setState(mutation) {
    this.instance.setState(mutation);
  }
  on(event, handler) {
    return this.instance.on(event, handler);
  }
  emit(event, payload) {
    this.instance.emit(event, payload);
  }
  registerFunctionality(name, functionality) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] Functionality name must be a non-empty string.");
    }
    this.functionalities[name] = functionality;
    return this;
  }
  registerFunctionalityOrchestration(name, orchestration) {
    if (!name || typeof name !== "string") {
      throw new Error("[ServiceFacade] FunctionalityOrchestration name must be a non-empty string.");
    }
    if (!orchestration) {
      throw new Error("[ServiceFacade] FunctionalityOrchestration instance is required.");
    }
    this.functionalityOrchestrations[name] = orchestration;
    return this;
  }
  /** @deprecated Use registerFunctionalityOrchestration */
  registerOrchestration(name, orchestration) {
    return this.registerFunctionalityOrchestration(name, orchestration);
  }
};
function createServiceFacade(config) {
  return new ServiceFacade(config);
}

// src/protocols/HttpProtocolAdapter.ts
import http from "http";
var HttpProtocolAdapter = class {
  protocol = "http";
  capabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: false,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false
  };
  server;
  listeningPort;
  async listen(port, host = "127.0.0.1") {
    this.server = http.createServer();
    await new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        const addr = this.server.address();
        this.listeningPort = addr.port;
        resolve();
      });
      this.server.on("error", reject);
    });
    return {
      protocol: "http",
      address: host,
      port: this.listeningPort,
      capabilities: ["requestResponse", "streaming"]
    };
  }
  async expose(service, port = 0) {
    this.server = http.createServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      if (url.pathname === "/manifest") {
        res.writeHead(200);
        res.end(JSON.stringify(service.getDefinition()));
        return;
      }
      if (url.pathname === "/health") {
        res.writeHead(200);
        res.end(JSON.stringify({ status: "ok", service: service.name }));
        return;
      }
      if (url.pathname.startsWith("/call/")) {
        const op = url.pathname.slice("/call/".length);
        let body = "";
        req.on("data", (c) => body += c);
        req.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await service.call(op, parsed);
            res.writeHead(200);
            res.end(JSON.stringify({ status: "success", payload: result }));
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ status: "error", error: err.message || String(err) }));
          }
        });
        return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Route not found" }));
    });
    await new Promise((resolve, reject) => {
      this.server.listen(port, "127.0.0.1", () => {
        const addr = this.server.address();
        this.listeningPort = addr.port;
        resolve();
      });
      this.server.on("error", reject);
    });
    return {
      protocol: "http",
      address: "127.0.0.1",
      port: this.listeningPort,
      capabilities: ["requestResponse", "streaming"]
    };
  }
  async send(endpoint, envelope) {
    const url = `http://${endpoint.address}:${endpoint.port}/call/${envelope.operation}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope.payload || {})
    });
    const json = await res.json();
    return {
      id: `res-${Date.now()}`,
      type: "response",
      correlationId: envelope.id,
      payload: json.payload,
      error: json.error,
      timestamp: Date.now()
    };
  }
  async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(() => resolve()));
      this.server = void 0;
    }
  }
};

// src/protocols/WebSocketProtocolAdapter.ts
var WebSocketProtocolAdapter = class {
  protocol = "ws";
  capabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: true,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false
  };
  server;
  wss;
  port;
  async expose(service, port = 0) {
    const httpMod = await import("http");
    const http2 = httpMod.default || httpMod;
    const wsMod = await import("ws").catch(() => null);
    if (!wsMod) {
      throw new Error('WebSocketProtocolAdapter.expose requires "ws" package in Node.js environment.');
    }
    const WebSocketServer = wsMod.WebSocketServer || wsMod.default?.WebSocketServer || wsMod.Server;
    this.server = http2.createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.wss.on("connection", (ws) => {
      ws.on("message", async (raw) => {
        try {
          const envelope = JSON.parse(raw.toString());
          if (envelope.type === "request" && envelope.operation) {
            try {
              const res = await service.call(envelope.operation, envelope.payload);
              ws.send(JSON.stringify({
                id: `res-${Date.now()}`,
                type: "response",
                correlationId: envelope.id,
                payload: res,
                timestamp: Date.now()
              }));
            } catch (err) {
              ws.send(JSON.stringify({
                id: `res-${Date.now()}`,
                type: "response",
                correlationId: envelope.id,
                error: err.message || String(err),
                timestamp: Date.now()
              }));
            }
          }
        } catch (_) {
        }
      });
    });
    await new Promise((resolve, reject) => {
      this.server.listen(port, "127.0.0.1", () => {
        const addr = this.server.address();
        this.port = addr.port;
        resolve();
      });
      this.server.on("error", reject);
    });
    return {
      protocol: "ws",
      address: "127.0.0.1",
      port: this.port,
      capabilities: ["requestResponse", "pubSub", "streaming"]
    };
  }
  async send(endpoint, envelope) {
    let WS = globalThis.WebSocket;
    if (!WS) {
      const wsMod = await import("ws").catch(() => null);
      WS = wsMod?.WebSocket || wsMod?.default?.WebSocket || wsMod;
    }
    if (!WS) {
      throw new Error("No WebSocket client implementation available in this environment.");
    }
    return new Promise((resolve, reject) => {
      const ws = new WS(`ws://${endpoint.address}:${endpoint.port}`);
      ws.on("open", () => {
        ws.send(JSON.stringify(envelope));
      });
      ws.on("message", (data) => {
        try {
          const res = JSON.parse(data.toString());
          ws.close();
          resolve(res);
        } catch (e) {
          ws.close();
          reject(e);
        }
      });
      ws.on("error", (err) => {
        reject(err);
      });
    });
  }
  async stop() {
    if (this.wss) {
      await new Promise((r) => this.wss.close(() => r()));
      this.wss = void 0;
    }
    if (this.server) {
      await new Promise((r) => this.server.close(() => r()));
      this.server = void 0;
    }
  }
};

// src/protocols/UdpProtocolAdapter.ts
import dgram from "dgram";
var UdpProtocolAdapter = class {
  protocol = "udp";
  capabilities = {
    requestResponse: true,
    streaming: false,
    pubSub: false,
    datagram: true,
    peerToPeer: false,
    signaling: false,
    discovery: true
  };
  socket;
  port;
  async expose(service, port = 0) {
    this.socket = dgram.createSocket("udp4");
    this.socket.on("message", async (msg, rinfo) => {
      try {
        const envelope = JSON.parse(msg.toString());
        if (envelope.type === "request" && envelope.operation) {
          try {
            const res = await service.call(envelope.operation, envelope.payload);
            const resp = JSON.stringify({
              id: `res-${Date.now()}`,
              type: "response",
              correlationId: envelope.id,
              payload: res,
              timestamp: Date.now()
            });
            this.socket.send(resp, rinfo.port, rinfo.address);
          } catch (err) {
            const resp = JSON.stringify({
              id: `res-${Date.now()}`,
              type: "response",
              correlationId: envelope.id,
              error: err.message || String(err),
              timestamp: Date.now()
            });
            this.socket.send(resp, rinfo.port, rinfo.address);
          }
        }
      } catch (_) {
      }
    });
    await new Promise((resolve) => {
      this.socket.bind(port, "127.0.0.1", () => {
        this.port = this.socket.address().port;
        resolve();
      });
    });
    return {
      protocol: "udp",
      address: "127.0.0.1",
      port: this.port,
      capabilities: ["datagram", "requestResponse"]
    };
  }
  async send(endpoint, envelope) {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket("udp4");
      const payload = Buffer.from(JSON.stringify(envelope));
      client.on("message", (msg) => {
        try {
          const res = JSON.parse(msg.toString());
          client.close();
          resolve(res);
        } catch (e) {
          client.close();
          reject(e);
        }
      });
      client.on("error", (err) => {
        client.close();
        reject(err);
      });
      client.send(payload, endpoint.port, endpoint.address);
    });
  }
  async stop() {
    if (this.socket) {
      await new Promise((r) => this.socket.close(() => r()));
      this.socket = void 0;
    }
  }
};

// src/protocols/P2PProtocolAdapter.ts
var P2PProtocolAdapter = class _P2PProtocolAdapter {
  protocol = "p2p";
  capabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: true,
    datagram: false,
    peerToPeer: true,
    signaling: true,
    discovery: true
  };
  static peerHub = /* @__PURE__ */ new Map();
  async expose(service) {
    _P2PProtocolAdapter.peerHub.set(service.id, service);
    return {
      protocol: "p2p",
      address: `p2p://${service.id}`,
      capabilities: ["peerToPeer", "requestResponse", "pubSub"]
    };
  }
  async send(endpoint, envelope) {
    const peerId = endpoint.address.replace("p2p://", "");
    const service = _P2PProtocolAdapter.peerHub.get(peerId);
    if (!service) {
      return {
        id: `res-${Date.now()}`,
        type: "response",
        correlationId: envelope.id,
        error: `Peer '${peerId}' not discovered or offline.`,
        timestamp: Date.now()
      };
    }
    try {
      const res = await service.call(envelope.operation || "", envelope.payload);
      return {
        id: `res-${Date.now()}`,
        type: "response",
        correlationId: envelope.id,
        payload: res,
        timestamp: Date.now()
      };
    } catch (err) {
      return {
        id: `res-${Date.now()}`,
        type: "response",
        correlationId: envelope.id,
        error: err.message || String(err),
        timestamp: Date.now()
      };
    }
  }
  async stop() {
    _P2PProtocolAdapter.peerHub.clear();
  }
};

// src/transports/MemoryTransport.ts
var MemoryTransport = class {
  handlers = /* @__PURE__ */ new Set();
  onMessage(handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
  async send(envelope) {
    for (const handler of this.handlers) {
      const res = await handler(envelope);
      if (res) return res;
    }
    return {
      id: `res-${Date.now()}`,
      type: "response",
      correlationId: envelope.id,
      payload: null,
      timestamp: Date.now()
    };
  }
};

// src/registry/ServiceRegistry.ts
var PROTOCOLS = ["http", "https", "ws", "wss", "udp", "p2p", "signaling", "memory"];
function validateEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== "object") throw new Error("[ServiceRegistry] Invalid endpoint.");
  if (!PROTOCOLS.includes(endpoint.protocol)) throw new Error("[ServiceRegistry] Unsupported endpoint protocol.");
  if (typeof endpoint.address !== "string" || endpoint.address.trim() === "") throw new Error("[ServiceRegistry] Endpoint address must be non-empty.");
  if (endpoint.port !== void 0 && (!Number.isInteger(endpoint.port) || endpoint.port < 0 || endpoint.port > 65535)) throw new Error("[ServiceRegistry] Endpoint port is invalid.");
  if (!Array.isArray(endpoint.capabilities)) throw new Error("[ServiceRegistry] Endpoint capabilities must be an array.");
}
var ServiceRegistry = class {
  services = /* @__PURE__ */ new Map();
  /**
   * Registers a service definition and its endpoints into the registry.
   *
   * @param definition Validated service definition.
   * @param endpoints Optional list of active endpoint descriptors.
   * @throws Error if definition or endpoints fail validation.
   * @throws Error if service is already registered under the same ID with a different version.
   */
  register(definition, endpoints = []) {
    validateServiceDefinition(definition);
    for (const endpoint of endpoints) validateEndpoint(endpoint);
    const existing = this.services.get(definition.id);
    if (existing && existing.definition.version !== definition.version) {
      throw new Error(
        "[ServiceRegistry] Service '" + definition.id + "' is already registered at version '" + existing.definition.version + "'; refusing replacement with '" + definition.version + "'."
      );
    }
    this.services.set(definition.id, {
      definition,
      endpoints: endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: existing?.registeredAt ?? Date.now()
    });
  }
  unregister(serviceId) {
    return this.services.delete(serviceId);
  }
  get(serviceId) {
    const record = this.services.get(serviceId);
    if (!record) return void 0;
    return {
      definition: record.definition,
      endpoints: record.endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: record.registeredAt
    };
  }
  list() {
    return Array.from(this.services.values()).map((record) => ({
      definition: record.definition,
      endpoints: record.endpoints.map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] })),
      registeredAt: record.registeredAt
    }));
  }
  findByCapability(capabilityName) {
    return this.list().filter(
      (record) => record.definition.capabilities?.some((cap) => cap.name === capabilityName)
    );
  }
};

// src/runtime/ServiceRuntime.ts
var ServiceRuntime = class {
  instances = /* @__PURE__ */ new Map();
  registry;
  constructor(registry) {
    this.registry = registry ?? new ServiceRegistry();
  }
  register(service) {
    const existing = this.instances.get(service.id);
    if (existing && existing !== service) {
      throw new Error("[ServiceRuntime] Service '" + service.id + "' is already registered.");
    }
    this.registry.register(service.getDefinition());
    this.instances.set(service.id, service);
    return this;
  }
  unregister(serviceId) {
    const removed = this.instances.delete(serviceId);
    this.registry.unregister(serviceId);
    return removed;
  }
  get(serviceId) {
    return this.instances.get(serviceId);
  }
  list() {
    return Array.from(this.instances.values());
  }
  async execute(target, operation, input, ctx) {
    const service = this.instances.get(target);
    if (!service) {
      throw new Error("[ServiceRuntime] Target service '" + target + "' not found.");
    }
    return service.call(operation, input, ctx);
  }
  async startAll() {
    const started = [];
    try {
      for (const service of this.instances.values()) {
        await service.start();
        started.push(service);
      }
    } catch (error) {
      for (const service of started.reverse()) {
        try {
          await service.stop();
        } catch {
        }
      }
      throw error;
    }
  }
  async disposeAll() {
    let firstError;
    const services = Array.from(this.instances.values()).reverse();
    for (const service of services) {
      try {
        await service.dispose();
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) throw firstError;
  }
  async stopAll() {
    let firstError;
    const services = Array.from(this.instances.values()).reverse();
    for (const service of services) {
      try {
        await service.stop();
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) throw firstError;
  }
};

// src/discovery/ServiceDiscovery.ts
var ServiceDiscovery = class {
  peers = /* @__PURE__ */ new Map();
  registerPeer(id, name, endpoints) {
    this.peers.set(id, {
      id,
      name,
      endpoints,
      lastSeen: Date.now()
    });
  }
  getPeers() {
    return Array.from(this.peers.values());
  }
  findPeer(id) {
    return this.peers.get(id);
  }
};

// src/discovery/KrnlPackageReconciler.ts
import * as fs from "fs";
import * as path from "path";
var KrnlPackageReconciler = class {
  /**
   * Scans all manifest.json files across backend and frontend and reconciles root package.json.
   */
  static reconcile(projectRoot = process.cwd(), writeChanges = true) {
    const manifests = this.findManifests(projectRoot);
    const aggregatedDeps = {};
    const aggregatedDevDeps = {};
    for (const mPath of manifests) {
      try {
        const raw = fs.readFileSync(mPath, "utf8");
        const json = JSON.parse(raw);
        if (json.dependencies && typeof json.dependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.dependencies)) {
            if (!aggregatedDeps[pkg]) aggregatedDeps[pkg] = [];
            if (!aggregatedDeps[pkg].includes(String(ver))) {
              aggregatedDeps[pkg].push(String(ver));
            }
          }
        }
        if (json.devDependencies && typeof json.devDependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.devDependencies)) {
            if (!aggregatedDevDeps[pkg]) aggregatedDevDeps[pkg] = [];
            if (!aggregatedDevDeps[pkg].includes(String(ver))) {
              aggregatedDevDeps[pkg].push(String(ver));
            }
          }
        }
      } catch (err) {
        console.warn(`[KrnlPackageReconciler] Warning: Could not parse ${mPath}:`, err);
      }
    }
    const conflicts = [];
    const resolvedDeps = {};
    const resolvedDevDeps = {};
    for (const [pkg, versions] of Object.entries(aggregatedDeps)) {
      if (versions.length > 1) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDeps[pkg] = versions[versions.length - 1];
    }
    for (const [pkg, versions] of Object.entries(aggregatedDevDeps)) {
      if (versions.length > 1 && !conflicts.some((c) => c.package === pkg)) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDevDeps[pkg] = versions[versions.length - 1];
    }
    const pkgJsonPath = path.join(projectRoot, "package.json");
    let updated = false;
    if (fs.existsSync(pkgJsonPath)) {
      const pkgContent = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      pkgContent.dependencies = pkgContent.dependencies || {};
      pkgContent.devDependencies = pkgContent.devDependencies || {};
      let hasChanges = false;
      for (const [pkg, ver] of Object.entries(resolvedDeps)) {
        if (pkgContent.dependencies[pkg] !== ver) {
          pkgContent.dependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      for (const [pkg, ver] of Object.entries(resolvedDevDeps)) {
        if (!pkgContent.dependencies[pkg] && pkgContent.devDependencies[pkg] !== ver) {
          pkgContent.devDependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      if (hasChanges && writeChanges) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + "\n");
        updated = true;
        console.log(`[KrnlPackageReconciler] Reconciled package.json from ${manifests.length} manifest(s).`);
      }
    }
    return {
      updated,
      totalManifests: manifests.length,
      addedDependencies: resolvedDeps,
      addedDevDependencies: resolvedDevDeps,
      conflicts
    };
  }
  /**
   * Discovers all manifest.json files in krnl/ (or src/)
   */
  static findManifests(projectRoot) {
    const searchDirs = [
      path.join(projectRoot, "krnl", "backend", "libraries"),
      path.join(projectRoot, "krnl", "backend", "functionalities"),
      path.join(projectRoot, "krnl", "frontend", "libraries"),
      path.join(projectRoot, "krnl", "frontend", "functionalities"),
      path.join(projectRoot, "src", "functionalities"),
      path.join(projectRoot, "src", "libraries")
    ];
    const found = [];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.scanRecursive(dir, found);
      }
    }
    return found;
  }
  static scanRecursive(dir, found) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.scanRecursive(full, found);
        } else if (entry.isFile() && entry.name === "manifest.json") {
          found.push(full);
        }
      }
    } catch {
    }
  }
};

// src/connectivity/ProtocolResolver.ts
var ProtocolResolver = class {
  static selectProtocol(requiredCapabilities, availableEndpoints) {
    return availableEndpoints.find(
      (ep) => requiredCapabilities.every((req) => ep.capabilities.includes(req))
    );
  }
  static getSupportedProtocols(definition) {
    return definition.protocols || ["http"];
  }
};

// src/orchestration/FunctionalityOrchestration.ts
var FunctionalityOrchestration = class {
  id;
  name;
  version;
  description;
  timeoutMs;
  scope = "functionality";
  steps = [];
  flows = /* @__PURE__ */ new Map();
  constructor(descriptor) {
    if (!descriptor || typeof descriptor !== "object" || !descriptor.id) {
      throw new Error("[FunctionalityOrchestration] Valid descriptor with non-empty id is required.");
    }
    this.id = descriptor.id;
    this.name = descriptor.name || descriptor.id;
    this.version = descriptor.version || "1.0.0";
    this.description = descriptor.description || "";
    this.timeoutMs = descriptor.timeoutMs;
  }
  /**
   * Adds a sequential functionality step to the DAG.
   */
  thenFunctionality(funcName, options = {}) {
    if (!funcName || typeof funcName !== "string") {
      throw new Error("[FunctionalityOrchestration] Functionality name must be a non-empty string.");
    }
    this.assertServiceBoundary(funcName);
    const stepId = options.id || `step_${funcName}_${this.steps.length + 1}`;
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    const step = {
      id: stepId,
      name: funcName,
      type: "task",
      target: funcName,
      dependsOn,
      retryPolicy: options.retry,
      timeoutPolicy: options.timeoutMs ? { timeoutMs: options.timeoutMs } : void 0,
      compensation: options.compensation ? { name: options.compensation, target: options.compensation } : void 0,
      catchHandler: options.catchHandler
    };
    this.steps.push(step);
    return this;
  }
  /**
   * Adds parallel functionality steps to the DAG.
   */
  parallel(name, functionalityNames, options = {}) {
    if (!name || typeof name !== "string") {
      throw new Error("[FunctionalityOrchestration] Parallel group name must be a non-empty string.");
    }
    if (!functionalityNames || functionalityNames.length === 0) {
      throw new Error("[FunctionalityOrchestration] Parallel step requires at least one functionality.");
    }
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const baseDependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    const parallelStepIds = [];
    for (const funcName of functionalityNames) {
      this.assertServiceBoundary(funcName);
      const stepId = `${name}_${funcName}`;
      parallelStepIds.push(stepId);
      this.steps.push({
        id: stepId,
        name: funcName,
        type: "task",
        target: funcName,
        dependsOn: baseDependsOn
      });
    }
    const joinId = `${name}_join`;
    this.steps.push({
      id: joinId,
      name: `${name} Join`,
      type: "fanIn",
      dependsOn: parallelStepIds
    });
    return this;
  }
  /**
   * Adds conditional branching to the DAG.
   */
  branch(name, condition, thenFunc, elseFunc, options = {}) {
    this.assertServiceBoundary(thenFunc);
    if (elseFunc) this.assertServiceBoundary(elseFunc);
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const baseDependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    const thenStepId = `${name}_then_${thenFunc}`;
    this.steps.push({
      id: thenStepId,
      name: thenFunc,
      type: "task",
      target: thenFunc,
      condition,
      dependsOn: baseDependsOn
    });
    let joinDeps = [thenStepId];
    if (elseFunc) {
      const elseStepId = `${name}_else_${elseFunc}`;
      this.steps.push({
        id: elseStepId,
        name: elseFunc,
        type: "task",
        target: elseFunc,
        condition: async (ctx) => !await condition(ctx),
        dependsOn: baseDependsOn
      });
      joinDeps.push(elseStepId);
    }
    const joinId = `${name}_join`;
    this.steps.push({
      id: joinId,
      name: `${name} Join`,
      type: "fanIn",
      dependsOn: joinDeps
    });
    return this;
  }
  /**
   * Adds fan-out step processing items through a functionality.
   */
  fanOut(name, funcName, getItems, options = {}) {
    this.assertServiceBoundary(funcName);
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    this.steps.push({
      id: name,
      name,
      type: "fanOut",
      target: funcName,
      getItems,
      concurrency: options.concurrency ?? 5,
      dependsOn
    });
    return this;
  }
  /**
   * Nested orchestration: Invokes a child FunctionalityOrchestration within the same service boundary.
   */
  thenFunctionalityOrchestration(childOrchId, options = {}) {
    if (!childOrchId || typeof childOrchId !== "string") {
      throw new Error("[FunctionalityOrchestration] Child orchestration id must be a non-empty string.");
    }
    const stepId = options.id || `nested_${childOrchId}_${this.steps.length + 1}`;
    const previousStep = this.steps.length > 0 ? this.steps[this.steps.length - 1].id : void 0;
    const dependsOn = options.dependsOn || (previousStep ? [previousStep] : []);
    this.steps.push({
      id: stepId,
      name: childOrchId,
      type: "nested",
      nestedOrchestrationId: childOrchId,
      dependsOn,
      retryPolicy: options.retry,
      timeoutPolicy: options.timeoutMs ? { timeoutMs: options.timeoutMs } : void 0
    });
    return this;
  }
  getSteps() {
    return Object.freeze([...this.steps]);
  }
  /**
   * Named flow builder interface.
   */
  flow(name) {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("[FunctionalityOrchestration] Flow name must be a non-empty string.");
    }
    const steps = [];
    const self = this;
    const flowInstance = {
      name,
      steps,
      visibility: "internal",
      thenFunctionality(funcName, options) {
        if (!funcName || typeof funcName !== "string") {
          throw new Error("[FunctionalityFlow] Functionality name must be a non-empty string.");
        }
        self.assertServiceBoundary(funcName);
        const stepId = `${name}_${funcName}_${steps.length + 1}`;
        steps.push({
          id: stepId,
          type: "functionality",
          target: funcName,
          dependsOn: options?.dependsOn,
          retryPolicy: options?.retry,
          timeoutPolicy: options?.timeoutMs ? { timeoutMs: options?.timeoutMs } : void 0
        });
        self.thenFunctionality(funcName, {
          id: stepId,
          retry: options?.retry,
          timeoutMs: options?.timeoutMs,
          dependsOn: options?.dependsOn
        });
        return flowInstance;
      },
      thenFunctionalityOrchestration(childName, flowName) {
        if (!childName || typeof childName !== "string") {
          throw new Error("[FunctionalityFlow] Orchestration name must be a non-empty string.");
        }
        const stepId = `${name}_orch_${childName}_${steps.length + 1}`;
        steps.push({
          id: stepId,
          type: "functionalityOrchestration",
          target: childName,
          flow: flowName
        });
        self.thenFunctionalityOrchestration(childName, { id: stepId });
        return flowInstance;
      },
      register(options) {
        if (options?.visibility) flowInstance.visibility = options.visibility;
        return flowInstance;
      }
    };
    this.flows.set(name, flowInstance);
    return flowInstance;
  }
  getFlow(name) {
    return this.flows.get(name);
  }
  listFlows() {
    return Array.from(this.flows.values());
  }
  clearFlows() {
    this.flows.clear();
    this.steps.length = 0;
  }
  assertServiceBoundary(target) {
    if (target.includes("Service") && !target.includes("Functionality") && !target.includes("Atom")) {
      if (target.endsWith("ServiceFacade") || target.startsWith("service.") || target.includes("Service.")) {
        throw new Error(
          `[FunctionalityOrchestration] Plane Isolation Invariant Violation: Target "${target}" appears to be an external Service. FunctionalityOrchestration strictly composes functionalities inside ONE service.`
        );
      }
    }
  }
};
export {
  BullMQExecutionEngine,
  FunctionalityOrchestration,
  HttpProtocolAdapter,
  KrnlPackageReconciler,
  LifecycleManager,
  MemoryTransport,
  P2PProtocolAdapter,
  ProtocolResolver,
  ServiceDiscovery,
  ServiceEventBus,
  ServiceFacade,
  ServiceInstance,
  ServiceProxy,
  ServiceRegistry,
  ServiceRuntime,
  ServiceStateStore,
  UdpProtocolAdapter,
  WebSocketProtocolAdapter,
  WorkerExecutionBoundary,
  createService,
  createServiceDefinition,
  createServiceFacade,
  createServiceProxy,
  validateOrchestrationDAG,
  validateServiceDefinition
};
