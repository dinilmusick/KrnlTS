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
});
