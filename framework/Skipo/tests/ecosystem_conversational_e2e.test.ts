import {describe,expect,it,vi} from 'vitest';
import {createSkipoSemanticRuntime,type Requirement} from '../src/backend/semantic/SkipoSemanticRuntime.js';
import {WorkspaceSemanticTaskStore,WorkspaceSemanticConversationStore} from '../src/backend/semantic/SkipoSemanticPersistence.js';

describe('Ecosystem Conversational Architecture E2E Matrix', () => {

  it('E2E-01 Simple endpoint execution via natural language', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-1' });
    runtime.registerCapability({
      id: 'greeting.echo',
      name: 'Echo Greeting',
      description: 'Echoes back a greeting message',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { message: { type: 'string' } } },
      metadata: { public: true }
    });
    runtime.setPlanner(async (request) => ({
      intent: 'greeting.echo',
      nodes: [{ id: 'n1', capabilityId: 'greeting.echo', dependsOn: [], input: { message: 'hello world' } }]
    }));
    runtime.setExecutor({
      async execute(cap, input: any) {
        return `Echoed: ${input.message}`;
      }
    });

    const result = await runtime.handle('Say hello world', {
      applicationId: 'e2e-app-1',
      sessionId: 'session-e2e-01'
    });

    expect(result.status).toBe('completed');
    expect(result.task.result).toBe('Echoed: hello world');
  });

  it('E2E-02 Real GutTS API capability execution', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-2' });
    runtime.registerGutTS();

    const cap = runtime.capabilities.get('gutts.strings.capitalize');
    expect(cap).toBeDefined();
    expect(cap?.kind).toBe('gutts');

    runtime.setPlanner(async () => ({
      intent: 'capitalize',
      nodes: [{ id: 'cap-1', capabilityId: 'gutts.strings.capitalize', dependsOn: [], input: { value: 'krusbl ecosystem' } }]
    }));

    const result = await runtime.handle('Capitalize krusbl ecosystem', {
      applicationId: 'e2e-app-2',
      sessionId: 'session-e2e-02'
    });

    expect(result.status).toBe('completed');
    expect(result.task.result).toBe('Krusbl ecosystem');
  });

  it('E2E-04 Provider chain: Capability A requires B, B requires C (C -> B -> A)', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-4' });
    const executionOrder: string[] = [];

    runtime.registerCapability({
      id: 'auth.login',
      name: 'Auth Login',
      description: 'Generates authentication token',
      kind: 'endpoint',
      metadata: { provides: ['AuthToken'] }
    });
    runtime.registerCapability({
      id: 'users.profile',
      name: 'Get User Profile',
      description: 'Retrieves user profile using auth token',
      kind: 'endpoint',
      metadata: { provides: ['UserProfile'] }
    });
    runtime.registerCapability({
      id: 'reports.generate',
      name: 'Generate User Report',
      description: 'Generates report using user profile',
      kind: 'endpoint',
      metadata: { provides: ['ReportSummary'] }
    });

    runtime.setPlanner(async () => ({
      intent: 'generate-report-chain',
      nodes: [
        { id: 'step-c', capabilityId: 'auth.login', dependsOn: [], input: {} },
        { id: 'step-b', capabilityId: 'users.profile', dependsOn: ['step-c'], input: {} },
        { id: 'step-a', capabilityId: 'reports.generate', dependsOn: ['step-b'], input: {} }
      ]
    }));

    runtime.setExecutor({
      async execute(cap) {
        executionOrder.push(cap.id);
        if (cap.id === 'auth.login') return { token: 'jwt-123' };
        if (cap.id === 'users.profile') return { user: 'Alice', role: 'admin' };
        if (cap.id === 'reports.generate') return { report: 'Report for Alice' };
        return {};
      }
    });

    const result = await runtime.handle('Generate my user report', {
      applicationId: 'e2e-app-4',
      sessionId: 'session-e2e-04'
    });

    expect(result.status).toBe('completed');
    expect(executionOrder).toEqual(['auth.login', 'users.profile', 'reports.generate']);
  });

  it('E2E-05 Missing input enters input-required, user provides answer, same task resumes and completes', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-5' });
    runtime.registerCapability({
      id: 'account.create',
      name: 'Create Account',
      description: 'Creates a new user account',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { username: { type: 'string' } } }
    });

    runtime.setPlanner(async () => ({
      intent: 'account.create',
      nodes: [{ id: 'n-create', capabilityId: 'account.create', dependsOn: [], input: { username: '$requirement:username' } }],
      requirements: [{
        id: 'username',
        semanticType: 'Username',
        description: 'Please provide a username',
        required: true,
        sourceCapability: 'account.create',
        sourceField: 'username',
        constraints: { schema: { type: 'string' } }
      }]
    }));

    runtime.setExecutor({
      async execute(cap, input: any) {
        return { accountCreated: true, username: input.username };
      }
    });

    const first = await runtime.handle('Create account', {
      applicationId: 'e2e-app-5',
      sessionId: 'session-e2e-05'
    });

    expect(first.status).toBe('input-required');
    expect(first.requirements?.[0].id).toBe('username');

    // Second turn provides the missing value and resumes the same task
    const second = await runtime.continueTask('coolguy42', first.task.id, {
      applicationId: 'e2e-app-5',
      sessionId: 'session-e2e-05'
    });

    expect(second.status).toBe('completed');
    expect(second.task.id).toBe(first.task.id);
    expect(second.task.result).toEqual({ accountCreated: true, username: 'coolguy42' });
  }, 15000);

  it('E2E-06 Process restart / state recovery persistence across turns', async () => {
    const fakeFs = new Map<string, string>();
    const mockWorkspace = {
      async listFiles(_wsId: string, _dir: string) {
        return [...fakeFs.keys()].map(path => ({ path, name: path.split('/').pop()!, isFolder: false }));
      },
      async readFile(_wsId: string, path: string) {
        return fakeFs.get(path) ?? '{}';
      },
      async writeFile(_wsId: string, path: string, content: string) {
        fakeFs.set(path, content);
      }
    };

    const taskStore1 = new WorkspaceSemanticTaskStore('ws-test', mockWorkspace as any);
    const convStore1 = new WorkspaceSemanticConversationStore('ws-test', mockWorkspace as any);

    const runtime1 = createSkipoSemanticRuntime({
      applicationId: 'e2e-app-6',
      taskStore: taskStore1,
      conversationStore: convStore1
    });

    runtime1.registerCapability({
      id: 'service.action',
      name: 'Action',
      description: 'Perform action with code',
      kind: 'endpoint'
    });
    const planner = async () => ({
      intent: 'action',
      nodes: [{ id: 'act-1', capabilityId: 'service.action', dependsOn: [], input: { code: '$requirement:code' } }],
      requirements: [{
        id: 'code',
        semanticType: 'Code',
        description: 'Provide verification code',
        required: true,
        sourceCapability: 'service.action',
        sourceField: 'code'
      }]
    });
    runtime1.setPlanner(planner);

    const first = await runtime1.handle('Execute action', {
      applicationId: 'e2e-app-6',
      sessionId: 'session-e2e-06'
    });
    expect(first.status).toBe('input-required');

    // Process restart: new runtime instance with re-hydrated stores from the same persistent workspace
    const taskStore2 = new WorkspaceSemanticTaskStore('ws-test', mockWorkspace as any);
    await taskStore2.hydrate();
    const convStore2 = new WorkspaceSemanticConversationStore('ws-test', mockWorkspace as any);

    const runtime2 = createSkipoSemanticRuntime({
      applicationId: 'e2e-app-6',
      taskStore: taskStore2,
      conversationStore: convStore2
    });
    runtime2.setPlanner(planner);
    runtime2.registerCapability({
      id: 'service.action',
      name: 'Action',
      description: 'Perform action with code',
      kind: 'endpoint'
    });
    runtime2.setExecutor({
      async execute(_cap, input: any) {
        return { success: true, verifiedCode: input.code };
      }
    });

    // Check recovered task exists in storage
    const recovered = taskStore2.get(first.task.id);
    expect(recovered).toBeDefined();
    expect(recovered?.status).toBe('input-required');

    // Resume on new runtime instance
    const second = await runtime2.continueTask('998877', first.task.id, {
      applicationId: 'e2e-app-6',
      sessionId: 'session-e2e-06'
    });

    expect(second.status).toBe('completed');
    expect(second.task.result).toEqual({ success: true, verifiedCode: '998877' });
    const history = await convStore2.list('session-e2e-06');
    expect(history.length).toBeGreaterThanOrEqual(2);
  }, 15000);


  it('E2E-06b Workspace persistence serializes concurrent conversation appends', async () => {
    const fakeFs = new Map<string, string>();
    const mockWorkspace = {
      async listFiles() { return []; },
      async readFile(_wsId: string, path: string) { return fakeFs.get(path) ?? '[]'; },
      async writeFile(_wsId: string, path: string, content: string) {
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 2)));
        fakeFs.set(path, content);
      }
    };
    const store = new WorkspaceSemanticConversationStore('ws-concurrency', mockWorkspace as any);
    await Promise.all(Array.from({ length: 20 }, (_, index) =>
      store.append('session-concurrency', {
        id: String(index),
        role: 'user',
        content: String(index),
        createdAt: new Date().toISOString()
      })
    ));
    const history = await store.list('session-concurrency');
    expect(history).toHaveLength(20);
    expect(new Set(history.map(message => message.id)).size).toBe(20);
  });

  it('E2E-07 Unauthorized attempt rejected; verify executor is NEVER invoked', async () => {
    const executorSpy = vi.fn(async () => 'danger');
    const runtime = createSkipoSemanticRuntime({
      applicationId: 'e2e-app-7',
      authorizationPolicy: {
        async canExecute() {
          return false; // Deny all
        }
      }
    });

    runtime.registerCapability({
      id: 'admin.nuke',
      name: 'Admin Nuke',
      description: 'Dangerous operation',
      kind: 'endpoint'
    });
    runtime.setPlanner(async () => ({
      intent: 'nuke',
      nodes: [{ id: 'nuke-1', capabilityId: 'admin.nuke', dependsOn: [], input: {} }]
    }));
    runtime.setExecutor({ execute: executorSpy });

    const result = await runtime.handle('Run nuke command', {
      applicationId: 'e2e-app-7',
      sessionId: 'session-e2e-07'
    });

    expect(result.status).toBe('failed');
    expect(executorSpy).not.toHaveBeenCalled();
  });

  it('E2E-08 Authorized execution succeeds with valid roles/user', async () => {
    const executorSpy = vi.fn(async (_cap, input: any) => ({ authorized: true, input }));
    const runtime = createSkipoSemanticRuntime({
      applicationId: 'e2e-app-8',
      authorizationPolicy: {
        async canExecute(_cap, context) {
          return context.runtime.userId === 'admin-user';
        }
      }
    });

    runtime.registerCapability({
      id: 'admin.config',
      name: 'Admin Config',
      description: 'Configure system',
      kind: 'endpoint'
    });
    runtime.setPlanner(async () => ({
      intent: 'config',
      nodes: [{ id: 'cfg-1', capabilityId: 'admin.config', dependsOn: [], input: { key: 'value' } }]
    }));
    runtime.setExecutor({ execute: executorSpy });

    const result = await runtime.handle('Update config', {
      applicationId: 'e2e-app-8',
      sessionId: 'session-e2e-08',
      userId: 'admin-user'
    });

    expect(result.status).toBe('completed');
    expect(executorSpy).toHaveBeenCalled();
  });

  it('E2E-09 Parallel plan ("Get X and Y") executes independent branches', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-9' });
    const timestamps: Record<string, number> = {};

    runtime.registerCapability({ id: 'data.getX', name: 'Get X', description: 'Fetch X', kind: 'endpoint' });
    runtime.registerCapability({ id: 'data.getY', name: 'Get Y', description: 'Fetch Y', kind: 'endpoint' });

    runtime.setPlanner(async () => ({
      intent: 'fetch-x-and-y',
      nodes: [
        { id: 'node-x', capabilityId: 'data.getX', dependsOn: [], input: {} },
        { id: 'node-y', capabilityId: 'data.getY', dependsOn: [], input: {} }
      ]
    }));

    runtime.setExecutor({
      async execute(cap) {
        timestamps[cap.id] = Date.now();
        await new Promise(r => setTimeout(r, 20));
        return { [cap.id]: true };
      }
    });

    const result = await runtime.handle('Get X and Y', {
      applicationId: 'e2e-app-9',
      sessionId: 'session-e2e-09'
    });

    expect(result.status).toBe('completed');
    expect(timestamps['data.getX']).toBeDefined();
    expect(timestamps['data.getY']).toBeDefined();
    // Both were started in the same wave (parallel ready nodes)
    expect(Math.abs(timestamps['data.getX'] - timestamps['data.getY'])).toBeLessThan(15);
  });

  it('E2E-10 Sequential plan ("Find X and then update Y") enforces A -> B order', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-10' });
    const order: string[] = [];

    runtime.registerCapability({ id: 'items.find', name: 'Find Item', description: 'Finds item', kind: 'endpoint' });
    runtime.registerCapability({ id: 'items.update', name: 'Update Item', description: 'Updates item', kind: 'endpoint' });

    runtime.setPlanner(async () => ({
      intent: 'find-then-update',
      nodes: [
        { id: 'find-1', capabilityId: 'items.find', dependsOn: [], input: {} },
        { id: 'update-1', capabilityId: 'items.update', dependsOn: ['find-1'], input: {} }
      ]
    }));

    runtime.setExecutor({
      async execute(cap) {
        order.push(cap.id);
        return { done: cap.id };
      }
    });

    const result = await runtime.handle('Find X and then update Y', {
      applicationId: 'e2e-app-10',
      sessionId: 'session-e2e-10'
    });

    expect(result.status).toBe('completed');
    expect(order).toEqual(['items.find', 'items.update']);
  });

  it('E2E-11 Mixed plan ("Get X and Y and then create Z") enforces A, B -> C', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'e2e-app-11' });
    const order: string[] = [];

    runtime.registerCapability({ id: 'cap.x', name: 'Get X', description: 'Fetch X', kind: 'endpoint' });
    runtime.registerCapability({ id: 'cap.y', name: 'Get Y', description: 'Fetch Y', kind: 'endpoint' });
    runtime.registerCapability({ id: 'cap.z', name: 'Create Z', description: 'Create Z', kind: 'endpoint' });

    runtime.setPlanner(async () => ({
      intent: 'mixed-plan',
      nodes: [
        { id: 'node-x', capabilityId: 'cap.x', dependsOn: [], input: {} },
        { id: 'node-y', capabilityId: 'cap.y', dependsOn: [], input: {} },
        { id: 'node-z', capabilityId: 'cap.z', dependsOn: ['node-x', 'node-y'], input: {} }
      ]
    }));

    runtime.setExecutor({
      async execute(cap) {
        order.push(cap.id);
        return { done: cap.id };
      }
    });

    const result = await runtime.handle('Get X and Y and then create Z', {
      applicationId: 'e2e-app-11',
      sessionId: 'session-e2e-11'
    });

    expect(result.status).toBe('completed');
    expect(order.indexOf('cap.x')).toBeLessThan(order.indexOf('cap.z'));
    expect(order.indexOf('cap.y')).toBeLessThan(order.indexOf('cap.z'));
  });

});
