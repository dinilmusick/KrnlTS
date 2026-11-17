import { describe, expect, it } from 'vitest';
import { createServiceFacade } from '../services/ServiceFacade.js';
import { FunctionalityOrchestration } from '../orchestration/FunctionalityOrchestration.js';

describe('KrnlTS native telemetry', () => {
  it('is off by default and exposes a zero-overhead no-op boundary', async () => {
    const service = createServiceFacade({
      id: 'telemetry-off',
      functionalities: {
        ping: { name: 'ping', execute: () => 'pong' },
      },
    });

    await expect(service.call('ping')).resolves.toBe('pong');
    expect(service.telemetry.status().enabled).toBe(false);
    expect(service.telemetry.snapshot().totals.invocationCount).toBe(0);
  });

  it('exposes telemetry on services created through createService', async () => {
    const { createService, createServiceDefinition } = await import('../services/ServiceGenerators.js');
    const instance = createService(createServiceDefinition({
      id: 'telemetry-generated',
      name: 'GeneratedTelemetryService',
      version: '1.0.0',
      operations: {
        ping: {
          id: 'GeneratedTelemetryService.ping',
          name: 'ping',
          handler: async () => 'pong',
        },
      },
    }));

    instance.telemetry.enable();
    await instance.start();
    await expect(instance.call('ping')).resolves.toBe('pong');

    const snapshot = instance.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBe(1);
    expect(snapshot.targets[0]).toMatchObject({ target: 'ping', kind: 'service', count: 1 });
  });

  it('records standard service and functionality invocation metrics', async () => {
    const service = createServiceFacade({
      id: 'telemetry-standard',
      functionalities: {
        ping: { name: 'ping', execute: () => 'pong' },
      },
    });

    service.telemetry.enable();
    await expect(service.call('ping')).resolves.toBe('pong');

    const snapshot = service.telemetry.snapshot();
    expect(snapshot.totals.invocationCount).toBe(2);
    expect(snapshot.totals.successCount).toBe(2);
    expect(snapshot.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: 'ping', kind: 'service', count: 1 }),
        expect.objectContaining({ target: 'ping', kind: 'functionality', count: 1 }),
      ]),
    );
  });

  it('records failures and preserves correlation IDs', async () => {
    const service = createServiceFacade({
      id: 'telemetry-errors',
      functionalities: {
        explode: {
          execute: () => {
            throw new Error('boom');
          },
        },
      },
    });

    service.telemetry.enable();
    await expect(service.call('explode', undefined, { correlationId: 'corr-test' }))
      .rejects.toThrow('boom');

    const failed = service.telemetry.snapshot().recentInvocations.filter((item) => item.status === 'failed');
    expect(failed.length).toBeGreaterThanOrEqual(1);
    expect(failed.every((item) => item.correlationId === 'corr-test')).toBe(true);
    expect(failed[0]?.error?.message).toBe('boom');
  });

  it('records nested orchestration -> service -> functionality traces', async () => {
    const orchestration = new FunctionalityOrchestration({
      id: 'pipeline',
      name: 'pipeline',
      version: '1.0.0',
    });
    orchestration.thenFunctionality('first').thenFunctionality('second');

    const service = createServiceFacade({
      id: 'telemetry-orchestration',
      functionalities: {
        first: { execute: () => ({ value: 1 }) },
        second: { execute: (input: any) => ({ value: input.value + 1 }) },
      },
      functionalityOrchestrations: { pipeline: orchestration },
    });

    service.telemetry.enable('detailed');
    const result = await service.orchestrate('pipeline', { value: 0 }, { correlationId: 'corr-orch' });

    expect(result.status).toBe('COMPLETED');

    const recent = service.telemetry.snapshot().recentInvocations;
    const root = recent.find((item) => item.kind === 'orchestration');
    const children = recent.filter(
      (item) => item.kind === 'service' && ['first', 'second'].includes(item.target),
    );

    expect(root).toBeDefined();
    expect(children.length).toBe(2);
    expect(children.every((item) => item.parentSpanId === root?.spanId)).toBe(true);
    expect(new Set(recent.map((item) => item.traceId)).size).toBe(1);
    expect(recent.every((item) => item.resources)).toBe(true);
  });

  it('provides profiling mode with runtime resource attribution', async () => {
    const service = createServiceFacade({
      id: 'telemetry-profile',
      functionalities: {
        work: { execute: async () => new Promise((resolve) => setTimeout(() => resolve('done'), 2)) },
      },
    });

    service.telemetry.setMode('profile');
    await service.call('work');

    const invocation = service.telemetry.snapshot().recentInvocations
      .find((item) => item.kind === 'functionality');

    expect(invocation?.resources?.start).toBeDefined();
    expect(invocation?.resources?.end).toBeDefined();
    expect(invocation?.resources?.delta).toBeDefined();
  });

  it('supports mode changes, reset, bounded retention, and percentiles', async () => {
    const service = createServiceFacade({
      id: 'telemetry-controls',
      functionalities: {
        ping: { execute: () => 'pong' },
      },
    });

    service.telemetry.setMode('standard');
    await service.call('ping');
    service.telemetry.setMode('detailed');
    await service.call('ping');

    const snapshot = service.telemetry.snapshot();
    expect(snapshot.totals.durationMs.p50).toBeGreaterThanOrEqual(0);
    expect(snapshot.totals.durationMs.p95).toBeGreaterThanOrEqual(snapshot.totals.durationMs.p50);

    service.telemetry.reset();
    expect(service.telemetry.snapshot().totals.invocationCount).toBe(0);

    service.telemetry.disable();
    expect(service.telemetry.status().mode).toBe('off');
  });
});
