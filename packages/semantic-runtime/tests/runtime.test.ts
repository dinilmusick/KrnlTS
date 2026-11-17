import {describe,expect,it} from 'vitest';
import {
  CapabilityRegistry,
  RequirementResolver,
  TaskRuntime,
  TaskGraphRuntime,
  CapabilityExecutionRuntime,
  ContextResolver,
  AgentRegistry,
  createSemanticRequest,
  type CapabilityDescriptor,
  type Requirement,
  type Task,
  type TaskStore,
  type TaskEventSink,
  type AuthorizationPolicy,
  type CapabilityExecutor,
} from '../src/index.js';

describe('semantic runtime', () => {
  it('registers and discovers capabilities', () => {
    const r = new CapabilityRegistry();
    const cap: CapabilityDescriptor = {
      id: 'orders.get',
      name: 'Get order',
      description: 'Reads an order',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { orderId: { type: 'string' } } },
      requirements: [{ id: 'req.orderId', semanticType: 'OrderIdentifier', description: 'Order ID', required: true }],
    };
    r.register(cap);
    expect(r.get('orders.get')?.kind).toBe('endpoint');
    expect(r.list()).toHaveLength(1);
    expect(r.findBySemanticType('OrderIdentifier')).toHaveLength(1);
    expect(() => r.register(cap)).toThrow(/already registered/);
  });

  it('resolves requirements and returns explicit unresolved state', async () => {
    const r = new CapabilityRegistry();
    const resolver = new RequirementResolver(r, [
      {
        name: 'session-store',
        canResolve: async (req) => req.semanticType === 'SessionToken',
        resolve: async () => 'token-1234',
      },
    ]);

    const context = {
      runtime: { applicationId: 'app-1', sessionId: 'sess-1' },
      task: { taskId: 't-1', request: 'fetch', requirements: [], artifacts: [] },
      capabilities: r.list(),
    };

    // Resolves when source can resolve
    const resolvedResult = await resolver.resolve(
      { id: 'r0', semanticType: 'SessionToken', description: 'Session', required: true, sourceCapability: 'auth' },
      context
    );
    expect(resolvedResult.resolved).toBe(true);
    expect(resolvedResult.value).toBe('token-1234');
    expect(resolvedResult.source).toBe('session-store');

    // Returns explicit NO_INTERNAL_RESOLUTION when no source and no matching capability
    const unresolvable = await resolver.resolve(
      { id: 'r1', semanticType: 'OrderIdentifier', description: 'Order ID', required: true, sourceCapability: 'orders.get', sourceField: 'missingField' },
      context
    );
    expect(unresolvable.resolved).toBe(false);
    expect(unresolvable.reason).toBe('NO_INTERNAL_RESOLUTION');

    // Returns CAPABILITY_REQUIRES_EXECUTION when a candidate capability matches sourceField
    r.register({
      id: 'orders.lookup',
      name: 'Lookup',
      description: 'Finds an order',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { orderId: { type: 'string' } } },
    });
    const requiresExec = await resolver.resolve(
      { id: 'r2', semanticType: 'OrderIdentifier', description: 'Order ID', required: true, sourceCapability: 'orders.get', sourceField: 'orderId' },
      context
    );
    expect(requiresExec.resolved).toBe(false);
    expect(requiresExec.reason).toBe('CAPABILITY_REQUIRES_EXECUTION');
    expect(requiresExec.source).toBe('orders.lookup');
  });

  it('handles task creation and lifecycle transitions', () => {
    const runtime = new TaskRuntime();
    const task = runtime.create('process payment');
    expect(task.id).toBeDefined();
    expect(task.status).toBe('submitted');

    runtime.transition(task.id, 'working');
    expect(runtime.get(task.id)?.status).toBe('working');

    runtime.transition(task.id, 'completed');
    expect(runtime.get(task.id)?.status).toBe('completed');
  });

  it('supports input-required state and requirement addition', () => {
    const runtime = new TaskRuntime();
    const task = runtime.create('create invoice');

    const req: Requirement = {
      id: 'req-tax-id',
      semanticType: 'TaxIdentifier',
      description: 'Tax ID required for business invoice',
      required: true,
      sourceCapability: 'invoices.create',
    };

    runtime.addRequirement(task.id, req);
    const updated = runtime.get(task.id);
    expect(updated?.status).toBe('input-required');
    expect(updated?.context.requirements).toContainEqual(req);
  });

  it('creates task graphs and evaluates dependency readiness', () => {
    const graphRuntime = new TaskGraphRuntime();
    const graph = graphRuntime.create('req-1', [
      { id: 'fetch-user', capabilityId: 'users.get', dependsOn: [] },
      { id: 'fetch-orders', capabilityId: 'orders.list', dependsOn: ['fetch-user'] },
      { id: 'send-summary', capabilityId: 'email.send', dependsOn: ['fetch-orders'] },
    ]);

    expect(graph.nodes).toHaveLength(3);

    // Initial ready nodes: only fetch-user
    let readyNodes = graphRuntime.ready(graph.id);
    expect(readyNodes.map((n) => n.id)).toEqual(['fetch-user']);

    // Complete fetch-user -> fetch-orders becomes ready
    graphRuntime.transition(graph.id, 'fetch-user', 'completed');
    readyNodes = graphRuntime.ready(graph.id);
    expect(readyNodes.map((n) => n.id)).toEqual(['fetch-orders']);

    // Complete fetch-orders -> send-summary becomes ready
    graphRuntime.transition(graph.id, 'fetch-orders', 'completed');
    readyNodes = graphRuntime.ready(graph.id);
    expect(readyNodes.map((n) => n.id)).toEqual(['send-summary']);
  });

  it('handles artifacts and provenance', () => {
    const runtime = new TaskRuntime();
    const task = runtime.create('generate report');

    runtime.addArtifact(task.id, {
      id: 'art-1',
      type: 'application/pdf',
      value: 'binary-data-placeholder',
      producer: 'reports.generate',
      taskId: task.id,
      provenance: { source: 'financial-ledger', timestamp: '2026-10-31' },
    });

    const retrieved = runtime.get(task.id);
    expect(retrieved?.context.artifacts).toHaveLength(1);
    expect(retrieved?.context.artifacts[0].provenance?.source).toBe('financial-ledger');
  });

  it('enforces authorization policy and executes capabilities via execution hook', async () => {
    let authChecked = false;
    const policy: AuthorizationPolicy = {
      authorize: async (cap) => {
        authChecked = true;
        if (cap.id === 'forbidden.action') {
          return { allowed: false, reason: 'POLICY_DENIED' };
        }
        return { allowed: true };
      },
    };

    const execRuntime = new CapabilityExecutionRuntime(policy);
    const executor: CapabilityExecutor = {
      execute: async (_cap, input) => {
        return { echoed: input, success: true };
      },
    };

    const allowedCap: CapabilityDescriptor = {
      id: 'allowed.action',
      name: 'Allowed',
      description: 'Allowed action',
      kind: 'endpoint',
      outputSchema: { type: 'application/json' },
    };

    const deniedCap: CapabilityDescriptor = {
      id: 'forbidden.action',
      name: 'Forbidden',
      description: 'Forbidden action',
      kind: 'endpoint',
    };

    const agentContext = {
      runtime: { applicationId: 'app', sessionId: 'sess' },
      task: { taskId: 'task-100', request: 'run', requirements: [], artifacts: [] },
      capabilities: [allowedCap, deniedCap],
    };

    // Denied capability throws error
    await expect(execRuntime.execute(deniedCap, {}, agentContext, executor)).rejects.toThrow('POLICY_DENIED');
    expect(authChecked).toBe(true);

    // Allowed capability returns artifact with provenance
    const result = await execRuntime.execute(allowedCap, { foo: 'bar' }, agentContext, executor);
    expect(result.artifact.producer).toBe('allowed.action');
    expect(result.artifact.taskId).toBe('task-100');
    expect(result.artifact.value).toEqual({ echoed: { foo: 'bar' }, success: true });
    expect(result.artifact.provenance?.capabilityId).toBe('allowed.action');
  });

  it('supports custom persistence TaskStore and event sink injection', () => {
    const memory = new Map<string, Task>();
    const emittedEvents: Array<{ type: string; task: Task }> = [];

    const customStore: TaskStore = {
      get: (id) => memory.get(id),
      set: (task) => { memory.set(task.id, task); },
      list: () => [...memory.values()],
    };

    const eventSink: TaskEventSink = {
      emit: (event) => { emittedEvents.push(event); },
    };

    const runtime = new TaskRuntime(customStore, eventSink);
    const task = runtime.create('custom persistence task');

    expect(memory.has(task.id)).toBe(true);
    expect(emittedEvents.some((e) => e.type === 'task.created')).toBe(true);

    runtime.transition(task.id, 'working');
    expect(emittedEvents.some((e) => e.type === 'task.status')).toBe(true);
  });

  it('creates semantic requests and resolves context with agents', async () => {
    const req = createSemanticRequest('summarize portfolio', 'portfolio_summary');
    expect(req.input).toBe('summarize portfolio');
    expect(req.intent).toBe('portfolio_summary');

    const agentRegistry = new AgentRegistry();
    agentRegistry.register({
      id: 'agent.analyst',
      name: 'Financial Analyst',
      description: 'Analyzes portfolio',
      role: 'application',
      capabilities: ['portfolio.get'],
    });
    expect(agentRegistry.get('agent.analyst')?.role).toBe('application');

    const capRegistry = new CapabilityRegistry();
    capRegistry.register({
      id: 'portfolio.get',
      name: 'Get Portfolio',
      description: 'Reads portfolio',
      kind: 'endpoint',
    });

    const contextResolver = new ContextResolver(capRegistry);
    const agentCtx = await contextResolver.resolve(
      { applicationId: 'app', sessionId: 'sess' },
      { taskId: 't-1', request: req.input, requirements: [], artifacts: [] }
    );

    expect(agentCtx.capabilities).toHaveLength(1);
    expect(agentRegistry.forCapability(agentCtx.capabilities[0])).toHaveLength(1);
  });
});
