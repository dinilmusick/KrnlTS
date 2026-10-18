import { describe, expect, it, vi } from 'vitest';
import {
  LifecycleManager,
  createService,
  createServiceDefinition,
  ServiceRegistry,
  ServiceRuntime,
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
    expect(onStop).toHaveBeenCalledTimes(1);
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
});
