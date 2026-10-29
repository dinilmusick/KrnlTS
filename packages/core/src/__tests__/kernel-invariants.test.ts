import { describe, expect, it, vi } from 'vitest';
import {
  LifecycleManager,
  createService,
  createServiceDefinition,
  createServiceProxy,
  ServiceRegistry,
  ServiceRuntime,
  ServiceProxy,
} from '../index.js';

function definition(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test.service',
    name: 'Test Service',
    version: '1.0.0',
    operations: {
      ping: {
        id: 'ping',
        name: 'ping',
        handler: async () => 'pong',
      },
    },
    ...overrides,
  };
}

describe('KrnlTS kernel invariants', () => {
  it('enforces lifecycle transitions instead of allowing arbitrary status writes', () => {
    const lifecycle = new LifecycleManager();
    expect(() => lifecycle.transitionTo('running')).toThrow(/Invalid transition/);
    lifecycle.transitionTo('initializing');
    lifecycle.transitionTo('ready');
    lifecycle.transitionTo('starting');
    lifecycle.transitionTo('running');
    expect(lifecycle.getStatus()).toBe('running');
    expect(() => lifecycle.transitionTo('ready')).toThrow(/Invalid transition/);
  });

  it('runs initialization once and supports restart after a clean stop', async () => {
    const onInit = vi.fn();
    const onStart = vi.fn();
    const onStop = vi.fn();
    const onDispose = vi.fn();
    const service = createService(definition({
      lifecycle: { onInit, onStart, onStop, onDispose },
    }));

    await service.start();
    await service.start();
    await service.stop();
    await service.stop();
    await service.start();
    await service.dispose();

    expect(onInit).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onStop).toHaveBeenCalledTimes(2);
    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it('rolls lifecycle state back when start or stop hooks fail', async () => {
    const onStart = vi.fn().mockRejectedValue(new Error('start failed'));
    const service = createService(definition({ lifecycle: { onStart } }));

    await expect(service.start()).rejects.toThrow('start failed');
    expect(service.getStatus()).toBe('ready');

    const working = createService(definition({
      lifecycle: { onStop: vi.fn().mockRejectedValue(new Error('stop failed')) },
    }));
    await working.start();
    await expect(working.stop()).rejects.toThrow('stop failed');
    expect(working.getStatus()).toBe('running');
  });

  it('provides functionality-owned event delivery with handler isolation', async () => {
    const { ServiceFacade } = await import('../services/ServiceFacade.js');
    const service = new ServiceFacade({
      id: 'events.service',
      functionalities: {
        ping: {
          events: { observed: { name: 'observed' } },
          execute: () => 'pong',
        },
      },
    });
    const functionality = service.getFunctionality('ping');
    const calls: string[] = [];
    functionality.events.observed.subscribe(() => { calls.push('first'); throw new Error('handler failed'); });
    functionality.events.observed.subscribe(() => { calls.push('second'); });
    functionality.emit('observed', {});
    expect(calls).toEqual(['first', 'second']);
  });

  it('runtime-validates public service definitions', () => {
    expect(() => createServiceDefinition(definition({
      operations: { broken: { id: '', name: 'broken', handler: null } },
    } as any))).toThrow(/must be a non-empty string|must define a handler/);
  });

  it('rejects conflicting registry versions and protects endpoint collections', () => {
    const registry = new ServiceRegistry();
    registry.register(definition() as any);
    expect(() => registry.register(definition({ version: '2.0.0' }) as any)).toThrow(/already registered/);

    const endpoints = [{ protocol: 'http' as const, address: 'http://localhost', capabilities: ['rpc'] }];
    registry.unregister('test.service');
    registry.register(definition() as any, endpoints);
    endpoints[0].capabilities.push('mutated');
    expect(registry.get('test.service')?.endpoints[0].capabilities).toEqual(['rpc']);
  });

  it('rolls back services that were started before a later startup failure', async () => {
    const first = createService(definition({ id: 'first', name: 'First' }));
    const second = createService(definition({
      id: 'second',
      name: 'Second',
      lifecycle: { onStart: vi.fn().mockRejectedValue(new Error('boom')) },
    }));
    const runtime = new ServiceRuntime();
    runtime.register(first).register(second);

    await expect(runtime.startAll()).rejects.toThrow('boom');
    expect(first.getStatus()).toBe('stopped');
    expect(second.getStatus()).toBe('ready');
  });

  it('prevents restart on disposed ServiceInstance and allows normal stop restart', async () => {
    const service = createService(definition());
    await service.start();
    await service.stop();
    expect(service.getStatus()).toBe('stopped');
    await service.start();
    expect(service.getStatus()).toBe('running');
    await service.dispose();
    await expect(service.start()).rejects.toThrow(/Cannot start a disposed service/);
  });

  it('implements complete IService contract on ServiceProxy with lifecycle and disposal invariants', async () => {
    const mockAdapter = {
      protocol: 'http' as const,
      capabilities: {
        requestResponse: true,
        streaming: false,
        pubSub: false,
        datagram: false,
        peerToPeer: false,
        signaling: false,
        discovery: false,
      },
      send: vi.fn().mockResolvedValue({
        id: 'res-1',
        type: 'response' as const,
        payload: { result: 'ok' },
        timestamp: Date.now(),
      }),
    };
    const endpoint = { protocol: 'http' as const, address: 'http://localhost:8080/rpc', capabilities: ['rpc'] };
    const proxy = createServiceProxy(definition(), mockAdapter, endpoint);

    expect(proxy.id).toBe('test.service');
    expect(proxy.name).toBe('Test Service');
    expect(proxy.version).toBe('1.0.0');
    expect(proxy.getStatus()).toBe('uninitialized');
    expect(proxy.getDefinition().id).toBe('test.service');

    await proxy.start();
    expect(proxy.getStatus()).toBe('running');

    // Remote execution
    const res = await proxy.call('ping', { test: true });
    expect(res).toEqual({ result: 'ok' });
    expect(mockAdapter.send).toHaveBeenCalledTimes(1);

    // Unknown operation
    await expect(proxy.call('nonexistent')).rejects.toThrow(/Operation 'nonexistent' not found/);

    // Stop and restart
    await proxy.stop();
    expect(proxy.getStatus()).toBe('stopped');
    await proxy.start();
    expect(proxy.getStatus()).toBe('running');

    // Disposal and post-disposal restart prevention
    await proxy.dispose();
    await proxy.dispose(); // idempotent
    await expect(proxy.start()).rejects.toThrow(/Cannot start a disposed service proxy/);
  });

  it('rejects invalid adapter and endpoint on ServiceProxy construction', () => {
    const endpoint = { protocol: 'http' as const, address: 'http://localhost', capabilities: [] };
    expect(() => createServiceProxy(definition(), null as any, endpoint)).toThrow(/Adapter must implement send/);
    expect(() => createServiceProxy(definition(), { type: 'http' } as any, endpoint)).toThrow(/Adapter must implement send/);
    expect(() => createServiceProxy(definition(), { type: 'http', send: vi.fn() } as any, null as any)).toThrow(/Endpoint must have an address/);
    expect(() => new ServiceProxy(definition(), null as any, endpoint)).toThrow(/Missing or invalid protocol adapter/);
    expect(() => new ServiceProxy(definition(), { type: 'http', send: vi.fn() } as any, { address: '' } as any)).toThrow(/Missing or invalid endpoint descriptor/);
  });

  it('validates malformed service definitions deterministically', () => {
    expect(() => createServiceDefinition(null as any)).toThrow(/Invalid service definition: expected an object/);
    expect(() => createServiceDefinition(definition({ id: '' }))).toThrow(/'id' must be a non-empty string/);
    expect(() => createServiceDefinition(definition({ name: '' }))).toThrow(/'name' must be a non-empty string/);
    expect(() => createServiceDefinition(definition({ version: '' }))).toThrow(/'version' must be a non-empty string/);
    expect(() => createServiceDefinition(definition({ operations: 'invalid' as any }))).toThrow(/Invalid operations: expected an object/);
    expect(() => createServiceDefinition(definition({ operations: { op1: null as any } }))).toThrow(/Invalid operation 'op1'/);
    expect(() => createServiceDefinition(definition({ operations: { op1: { id: '', name: 'op1', handler: () => {} } } }))).toThrow(/operations.op1.id/);
    expect(() => createServiceDefinition(definition({ operations: { op1: { id: 'op1', name: '', handler: () => {} } } }))).toThrow(/operations.op1.name/);
    expect(() => createServiceDefinition(definition({ operations: { op1: { id: 'op1', name: 'op1', inputSchema: 'bad' as any, handler: () => {} } } }))).toThrow(/operations.op1.inputSchema/);
    expect(() => createServiceDefinition(definition({ operations: { op1: { id: 'op1', name: 'op1', outputSchema: 'bad' as any, handler: () => {} } } }))).toThrow(/operations.op1.outputSchema/);
    expect(() => createServiceDefinition(definition({ state: { schema: 'invalid' as any } }))).toThrow(/state.schema/);
    expect(() => createServiceDefinition(definition({ events: { badEvent: { name: '' } } }))).not.toThrow();
    expect(() => createServiceDefinition(definition({ capabilities: [{ id: '', name: 'c', protocols: [] }] }))).toThrow(/capability.id/);
    expect(() => createServiceDefinition(definition({ capabilities: [{ id: 'c', name: '', protocols: [] }] }))).toThrow(/capability.name/);
    expect(() => createServiceDefinition(definition({ capabilities: [{ id: 'c', name: 'c', protocols: 'bad' as any }] }))).toThrow(/protocols must be an array/);
    expect(() => createServiceDefinition(definition({ dependencies: [{ serviceId: '' }] }))).toThrow(/dependency.serviceId/);
  });

  describe('ServiceRegistry duplicate registration semantics', () => {
    it('refuses duplicate registration with same ID and same version on register()', () => {
      const registry = new ServiceRegistry();
      const def1 = definition({ version: '1.0.0', name: 'Initial Name' });
      registry.register(def1);

      const def1Duplicate = definition({ version: '1.0.0', name: 'Duplicate Name' });
      expect(() => registry.register(def1Duplicate)).toThrow(
        "[ServiceRegistry] Service 'test.service' is already registered at version '1.0.0'. Use replace() to explicitly replace an existing service."
      );
    });

    it('refuses re-registration with same ID and different version deterministically', () => {
      const registry = new ServiceRegistry();
      const def1 = definition({ version: '1.0.0' });
      registry.register(def1);

      const def2 = definition({ version: '2.0.0' });
      expect(() => registry.register(def2)).toThrow(
        "[ServiceRegistry] Service 'test.service' is already registered at version '1.0.0'. Use replace() to explicitly replace an existing service."
      );

      // Verify original remains intact
      expect(registry.get('test.service')!.definition.version).toBe('1.0.0');
    });

    it('allows explicit replacement via replace(), updating definition/endpoints and preserving registeredAt', async () => {
      const registry = new ServiceRegistry();
      const def1 = definition({ version: '1.0.0', name: 'Initial Name' });
      registry.register(def1, [{ protocol: 'http', address: '127.0.0.1', port: 3000, capabilities: ['query'] }]);

      const record1 = registry.get('test.service');
      expect(record1).toBeDefined();
      expect(record1!.definition.name).toBe('Initial Name');
      expect(record1!.endpoints).toHaveLength(1);
      const initialTimestamp = record1!.registeredAt;

      // Small delay to verify timestamp preservation
      await new Promise((r) => setTimeout(r, 10));

      const defUpdated = definition({ version: '2.0.0', name: 'Updated Name' });
      registry.replace(defUpdated, [
        { protocol: 'http', address: '127.0.0.1', port: 3000, capabilities: ['query'] },
        { protocol: 'ws', address: '127.0.0.1', port: 3001, capabilities: ['stream'] },
      ]);

      const record2 = registry.get('test.service');
      expect(record2!.definition.name).toBe('Updated Name');
      expect(record2!.definition.version).toBe('2.0.0');
      expect(record2!.endpoints).toHaveLength(2);
      expect(record2!.registeredAt).toBe(initialTimestamp); // Preserved!
    });

    it('allows new version registration after explicit unregister', () => {
      const registry = new ServiceRegistry();
      registry.register(definition({ version: '1.0.0' }));
      expect(registry.unregister('test.service')).toBe(true);
      expect(registry.get('test.service')).toBeUndefined();

      registry.register(definition({ version: '2.0.0' }));
      expect(registry.get('test.service')!.definition.version).toBe('2.0.0');
    });
  });

  describe('Canonical FunctionalityOrchestration and ServiceFacade Architecture', () => {
    it('instantiates and configures declarative FunctionalityOrchestration flows without application leakage', async () => {
      const { FunctionalityOrchestration } = await import('../orchestration/FunctionalityOrchestration.js');

      class TestOrchestration extends FunctionalityOrchestration {
        constructor() {
          super({ id: 'PaymentOrchestration', name: 'Payment', version: '1.2.0', description: 'Payment orchestration flow' });
        }
      }

      const orch = new TestOrchestration();
      expect(orch.id).toBe('PaymentOrchestration');
      expect(orch.name).toBe('Payment');
      expect(orch.version).toBe('1.2.0');

      const flow = orch
        .flow('checkoutFlow')
        .thenFunctionality('ValidateCart')
        .thenFunctionality('ChargeCard')
        .thenFunctionalityOrchestration('NotificationOrchestration', 'sendReceipt')
        .register({ visibility: 'public' });

      expect(flow.name).toBe('checkoutFlow');
      expect(flow.steps).toHaveLength(3);
      expect(flow.steps[0]).toEqual({ id: 'checkoutFlow_ValidateCart_1', type: 'functionality', target: 'ValidateCart' });
      expect(flow.steps[1]).toEqual({ id: 'checkoutFlow_ChargeCard_2', type: 'functionality', target: 'ChargeCard' });
      expect(flow.steps[2]).toEqual({ id: 'checkoutFlow_orch_NotificationOrchestration_3', type: 'functionalityOrchestration', target: 'NotificationOrchestration', flow: 'sendReceipt' });
      expect(flow.visibility).toBe('public');
      expect(orch.getFlow('checkoutFlow')).toBe(flow);
      expect(orch.listFlows()).toHaveLength(1);

      orch.clearFlows();
      expect(orch.listFlows()).toHaveLength(0);

      expect(() => orch.flow('')).toThrow(/Flow name must be a non-empty string/);
      expect(() => orch.flow('bad').thenFunctionality('')).toThrow(/Functionality name must be a non-empty string/);
      expect(() => orch.flow('bad').thenFunctionalityOrchestration('')).toThrow(/Orchestration name must be a non-empty string/);
      expect(() => new FunctionalityOrchestration(null as any)).toThrow(/Valid descriptor/);
    });

    it('instantiates ServiceFacade as the public semantic boundary and integrates with runtime and KrnlQ queue', async () => {
      const { ServiceFacade, createServiceFacade } = await import('../services/ServiceFacade.js');
      const { FunctionalityOrchestration } = await import('../orchestration/FunctionalityOrchestration.js');

      const orch = new FunctionalityOrchestration({ id: 'AuthOrch', name: 'AuthFlow' });
      orch.flow('loginFlow').thenFunctionality('VerifyPassword').register();

      const facade = createServiceFacade({
        id: 'auth.service',
        name: 'AuthService',
        version: '1.0.0',
        description: 'Authentication Service Facade',
        functionalities: {
          VerifyPassword: { execute: vi.fn() },
        },
        functionalityOrchestrations: {
          AuthOrch: orch,
        },
        definition: {
          id: 'auth.service',
          name: 'AuthService',
          version: '1.0.0',
          state: {
            initial: { sessionCount: 0 },
          },
          operations: {
            login: {
              id: 'login',
              name: 'Login',
              handler: async (_input, ctx) => {
                return { success: true, user: 'admin' };
              },
            },
          },
        },
      });

      expect(facade.id).toBe('auth.service');
      expect(facade.name).toBe('AuthService');
      expect(facade.functionalities.VerifyPassword).toBeDefined();
      expect(facade.functionalityOrchestrations.AuthOrch).toBe(orch);
      expect(facade.getStatus()).toBe('uninitialized');

      // Test runtime lifecycle through facade
      await facade.start();
      expect(facade.getStatus()).toBe('running');

      // State access through facade
      expect(facade.getState()).toEqual({ sessionCount: 0 });
      facade.setState({ sessionCount: 1 });
      expect(facade.getState()).toEqual({ sessionCount: 1 });

      // Functionality event pub/sub through the service namespace
      const eventSpy = vi.fn();
      facade.functionalities.VerifyPassword.events.completed.subscribe(eventSpy);
      await facade.call('VerifyPassword', {});
      expect(eventSpy).toHaveBeenCalledTimes(1);

      // Operation invocation through facade (strictly routes through KrnlQ / worker context)
      const res = await facade.call('login', {});
      expect(res).toEqual({ success: true, user: 'admin' });

      // Dynamic registration
      facade.registerFunctionality('RefreshToken', { execute: vi.fn() });
      expect(facade.functionalities.RefreshToken).toBeDefined();

      const secondOrch = new FunctionalityOrchestration({ id: 'SessionOrch' });
      facade.registerFunctionalityOrchestration('SessionOrch', secondOrch);
      expect(facade.functionalityOrchestrations.SessionOrch).toBe(secondOrch);

      await facade.stop();
      expect(facade.getStatus()).toBe('stopped');
      await facade.dispose();
    });

    it('proves old Entity and application concepts are no longer the canonical API', async () => {
      const coreExports = await import('../index.js');
      expect((coreExports as any).Entity).toBeUndefined();
      expect((coreExports as any).defineApp).toBeUndefined();
      expect((coreExports as any).Protocols).toBeUndefined();
      expect(coreExports.FunctionalityOrchestration).toBeDefined();
      expect(coreExports.KrnlQueue).toBeDefined();
      expect(coreExports.KrnlWorkerPool).toBeDefined();
      expect(coreExports.WorkerExecutionBoundary).toBeDefined();
      expect(coreExports.ServiceFacade).toBeDefined();
      expect(coreExports.createServiceFacade).toBeDefined();
    });
  });
});

