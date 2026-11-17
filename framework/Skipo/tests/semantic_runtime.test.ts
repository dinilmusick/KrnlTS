import {describe,expect,it} from 'vitest';
import {createSkipoSemanticRuntime, SkipoSemanticRuntime} from '../src/backend/semantic/SkipoSemanticRuntime.js';
import {SkipoBackend, semanticRuntime} from '../src/backend/SkipoBackend.js';
import type {Requirement} from '@ultrst-armada/kloks/semantic-runtime';

describe('Skipo semantic runtime', () => {
  it('constructs SkipoSemanticRuntime and creates automatic application agent', () => {
    const runtime = createSkipoSemanticRuntime({
      applicationId: 'portfolio-app',
      applicationName: 'Portfolio Manager',
      applicationVersion: '2.1.0',
    });

    expect(runtime).toBeInstanceOf(SkipoSemanticRuntime);
    const manifest = runtime.manifest();
    expect(manifest.id).toBe('portfolio-app');
    expect(manifest.name).toBe('Portfolio Manager');
    expect(manifest.version).toBe('2.1.0');
    expect(manifest.agents).toHaveLength(1);
    expect(manifest.agents[0]).toEqual({
      id: 'application',
      name: 'Portfolio Manager',
      role: 'application',
      capabilityIds: [],
    });
  });

  it('derives endpoint capabilities from service contracts with schemas and descriptions', () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'test-app' });
    runtime.registerService('orders', {
      definition: {
        operations: {
          get: {
            name: 'Get order',
            description: 'Retrieves order by order ID',
            inputSchema: { type: 'object', properties: { orderId: { type: 'string' } } },
            outputSchema: { type: 'object', properties: { status: { type: 'string' } } },
          },
        },
      },
    });

    const cap = runtime.capabilities.get('orders.get');
    expect(cap).toBeDefined();
    expect(cap?.name).toBe('Get order');
    expect(cap?.description).toBe('Retrieves order by order ID');
    expect(cap?.kind).toBe('endpoint');
    expect(cap?.inputSchema?.properties?.orderId).toBeDefined();
    expect(cap?.outputSchema?.properties?.status).toBeDefined();

    // Verify capability was added to application agent
    const manifest = runtime.manifest();
    expect(manifest.agents[0].capabilityIds).toContain('orders.get');
  });

  it('creates semantic tasks and manages input-required lifecycle', () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'test-app' });
    const task = runtime.createTask('create an invoice');
    expect(task.id).toBeDefined();
    expect(task.status).toBe('submitted');

    runtime.tasks.transition(task.id, 'working');
    expect(runtime.tasks.get(task.id)?.status).toBe('working');

    runtime.tasks.transition(task.id, 'input-required');
    expect(runtime.tasks.get(task.id)?.status).toBe('input-required');

    const req: Requirement = {
      id: 'req-vat',
      semanticType: 'TaxRate',
      description: 'Tax rate required for invoice calculation',
      required: true,
      sourceCapability: 'invoices.create',
    };
    runtime.tasks.addRequirement(task.id, req);
    expect(runtime.tasks.get(task.id)?.status).toBe('input-required');
    expect(runtime.tasks.get(task.id)?.context.requirements).toContainEqual(req);

    // Resumable: transition to working then completed
    runtime.tasks.transition(task.id, 'working');
    runtime.tasks.transition(task.id, 'completed');
    expect(runtime.tasks.get(task.id)?.status).toBe('completed');
  });

  it('constructs agent context and resolves requirements', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'crm-app' });
    runtime.registerCapability({
      id: 'contacts.search',
      name: 'Search Contacts',
      description: 'Find contact by email',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { email: { type: 'string' } } },
    });

    const task = runtime.createTask('find customer support ticket');
    const agentContext = await runtime.buildContext(
      { applicationId: 'crm-app', sessionId: 'sess-abc' },
      task.id
    );

    expect(agentContext.runtime.applicationId).toBe('crm-app');
    expect(agentContext.task.taskId).toBe(task.id);
    expect(agentContext.capabilities.some((c) => c.id === 'contacts.search')).toBe(true);

    // Explicit unresolved state when source cannot be resolved internally
    const unresolvableReq: Requirement = {
      id: 'req-1',
      semanticType: 'UnknownField',
      description: 'Not in system',
      required: true,
      sourceCapability: 'contacts.search',
      sourceField: 'nonexistent',
    };
    const resolution = await runtime.resolveRequirement(unresolvableReq, agentContext);
    expect(resolution.resolved).toBe(false);
    expect(resolution.reason).toBe('NO_INTERNAL_RESOLUTION');

    // Identifies capability requiring execution when sourceField matches
    const matchingReq: Requirement = {
      id: 'req-2',
      semanticType: 'EmailAddress',
      description: 'Customer email',
      required: true,
      sourceCapability: 'tickets.create',
      sourceField: 'email',
    };
    const capRequiresExec = await runtime.resolveRequirement(matchingReq, agentContext);
    expect(capRequiresExec.resolved).toBe(false);
    expect(capRequiresExec.reason).toBe('CAPABILITY_REQUIRES_EXECUTION');
    expect(capRequiresExec.source).toBe('contacts.search');
  });

  it('registers GutTS APIs as reusable capabilities', () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'gutts-app' });
    runtime.registerGutTS();
    expect(runtime.capabilities.get('gutts.strings.capitalize')).toBeDefined();
    expect(runtime.capabilities.get('gutts.strings.capitalize')?.kind).toBe('gutts');
  });

  it('plans and executes a conversational request through the application runtime', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'conversation-app' });
    runtime.registerCapability({
      id: 'math.add',
      name: 'Add numbers',
      description: 'Adds two numbers',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] },
      outputSchema: { type: 'number' },
    });
    runtime.setPlanner({
      async plan() {
        return {
          intent: 'math.add',
          nodes: [{ id: 'add-1', capabilityId: 'math.add', dependsOn: [], input: { a: 2, b: 3 } }],
        };
      },
    });
    runtime.setExecutor({
      async execute(capability, input) {
        expect(capability.id).toBe('math.add');
        const values = input as { a: number; b: number };
        return values.a + values.b;
      },
    });

    const result = await runtime.handle('add two and three', {
      applicationId: 'conversation-app',
      sessionId: 'conversation-1',
    });
    expect(result.status).toBe('completed');
    expect(result.task.result).toBe(5);
  });

  it('resumes an input-required task through the same context', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'resume-app' });
    runtime.registerCapability({
      id: 'profile.update',
      name: 'Update profile',
      description: 'Updates a profile',
      kind: 'endpoint',
      inputSchema: { type: 'object', properties: { displayName: { type: 'string' } }, required: ['displayName'] },
    });
    runtime.setPlanner({
      async plan() {
        return {
          intent: 'profile.update',
          nodes: [{ id: 'update-1', capabilityId: 'profile.update', dependsOn: [], input: { displayName: '$requirement:name' } }],
          requirements: [{
            id: 'name',
            semanticType: 'displayName',
            description: 'Display name',
            required: true,
            sourceCapability: 'profile.update',
            sourceField: 'displayName',
            constraints: { schema: { type: 'string' } },
          }],
        };
      },
    });
    runtime.setExecutor({ async execute(_capability, input) { return input; } });

    const first = await runtime.handle('update my profile', {
      applicationId: 'resume-app',
      sessionId: 'conversation-42',
    });
    expect(first.status).toBe('input-required');

    const second = await runtime.continueTask('Monke', first.task.id, {
      applicationId: 'resume-app',
      sessionId: first.task.context.contextId!,
    });
    expect(second.status).toBe('completed');
    expect(second.task.result).toEqual({ displayName: 'Monke' });
  }, 15000);

  it('verifies SkipoBackend semanticRuntime exposure and existing services', () => {
    expect(SkipoBackend.semanticRuntime).toBeDefined();
    expect(SkipoBackend.semanticRuntime).toBe(semanticRuntime);
    expect(semanticRuntime).toBeInstanceOf(SkipoSemanticRuntime);

    // Existing services still registered in SkipoBackend
    expect(SkipoBackend.services.serviceA).toBeDefined();
    expect(SkipoBackend.services.serviceB).toBeDefined();

    // Verify existing service operations registered into semanticRuntime capabilities
    const capabilities = semanticRuntime.capabilities.list();
    expect(capabilities.length).toBeGreaterThan(0);
    expect(capabilities.some((c) => c.id.startsWith('serviceA.') || c.id.startsWith('serviceB.'))).toBe(true);

    // Existing backend methods remain functional
    expect(typeof SkipoBackend.executeService).toBe('function');
    expect(typeof SkipoBackend.converse).toBe('function');
    expect(typeof SkipoBackend.executeOrchestration).toBe('function');
    expect(SkipoBackend.worker).toBeDefined();
  });
});
