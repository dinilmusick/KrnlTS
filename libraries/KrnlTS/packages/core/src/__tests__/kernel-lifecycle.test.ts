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
});
