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

  it('isolates event handler failures and continues delivery', async () => {
    const service = createService(definition({ events: { ping: { name: 'ping' } } }));
    const calls: string[] = [];
    service.on('ping', () => { calls.push('first'); throw new Error('handler failed'); });
    service.on('ping', () => { calls.push('second'); });
    service.emit('ping', {});
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
    expect(() => createServiceDefinition(definition({ events: { badEvent: { name: '' } } }))).toThrow(/events.badEvent.name/);
    expect(() => createServiceDefinition(definition({ capabilities: [{ id: '', name: 'c', protocols: [] }] }))).toThrow(/capability.id/);
    expect(() => createServiceDefinition(definition({ capabilities: [{ id: 'c', name: '', protocols: [] }] }))).toThrow(/capability.name/);
    expect(() => createServiceDefinition(definition({ capabilities: [{ id: 'c', name: 'c', protocols: 'bad' as any }] }))).toThrow(/protocols must be an array/);
    expect(() => createServiceDefinition(definition({ dependencies: [{ serviceId: '' }] }))).toThrow(/dependency.serviceId/);
  });
});
