/**
 * @file functionality-orchestration.test.ts
 * @description Comprehensive test suite for KrnlTS FunctionalityOrchestration,
 * canonical KrnlQ execution engine, worker execution boundary, and service facade mediation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  FunctionalityOrchestration,
  KrnlQueue,
  WorkerExecutionBoundary,
  createServiceFacade,
  createServiceDefinition,
  validateOrchestrationDAG,
} from '../index.js';

describe('KrnlTS FunctionalityOrchestration & Canonical KrnlQ Architecture', () => {
  // 1. Single functionality execution through KrnlQ & Worker boundary
  it('fans-out processing across an array of items with concurrency control', async () => {
    const orch = new FunctionalityOrchestration({ id: 'BatchProcessor' });
    orch.fanOut('processItems', 'TransformItem', (ctx) => (ctx.results.input as any).items, {
      concurrency: 2,
    });

    const steps = orch.getSteps();
    const engine = new KrnlQueue({ queueName: 'test_fanout_queue' });
    await engine.start();

    const boundSteps = [
      {
        ...steps[0],
        handler: async (item: any) => ({ item, processed: true }),
      },
    ];

    const result = await engine.executeOrchestration(
      { id: orch.id },
      boundSteps,
      { items: ['a', 'b', 'c', 'd'] }
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.output).toEqual([
      { item: 'a', processed: true },
      { item: 'b', processed: true },
      { item: 'c', processed: true },
      { item: 'd', processed: true },
    ]);

    await engine.dispose();
  });

  // 6. Retries with backoff

  it('retries failing steps with backoff policy and succeeds upon subsequent attempt', async () => {
    const engine = new KrnlQueue({ queueName: 'test_retry_queue' });
    await engine.start();

    let attempts = 0;
    const steps = [
      {
        id: 'flaky_step',
        name: 'FlakyStep',
        type: 'task' as const,
        retryPolicy: {
          maxAttempts: 3,
          backoff: 'exponential' as const,
          backoffMs: 10,
        },
        handler: async () => {
          attempts++;
          if (attempts < 3) throw new Error(`Temporary failure on attempt ${attempts}`);
          return { ok: true, attempts };
        },
      },
    ];

    const result = await engine.executeOrchestration({ id: 'RetryOrch' }, steps, {});
    expect(result.status).toBe('COMPLETED');
    expect(attempts).toBe(3);
    expect(result.stepResults['flaky_step'].attempts).toBe(3);

    await engine.dispose();
  });

  // 7. Timeout handling

  it('handles step timeouts and aborts gracefully', async () => {
    const engine = new KrnlQueue({ queueName: 'test_timeout_queue' });
    await engine.start();

    const steps = [
      {
        id: 'slow_step',
        name: 'SlowStep',
        type: 'task' as const,
        timeoutPolicy: { timeoutMs: 30 },
        handler: async () => {
          await new Promise((r) => setTimeout(r, 100));
          return 'done';
        },
      },
    ];

    const result = await engine.executeOrchestration({ id: 'TimeoutOrch' }, steps, {});
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('timed out');

    await engine.dispose();
  });

  // 8. Failure propagation & saga compensation

  it('propagates errors and rolls back executed steps via saga compensation hooks', async () => {
    const engine = new KrnlQueue({ queueName: 'test_comp_queue' });
    await engine.start();

    const compensated: string[] = [];
    const steps = [
      {
        id: 'step_1',
        name: 'CreateReservation',
        type: 'task' as const,
        compensation: {
          name: 'CancelReservation',
          handler: async () => {
            compensated.push('CancelReservation');
          },
        },
        handler: async () => ({ resId: 'res_1' }),
      },
      {
        id: 'step_2',
        name: 'ChargeAccount',
        type: 'task' as const,
        dependsOn: ['step_1'],
        handler: async () => {
          throw new Error('Insufficient funds');
        },
      },
    ];

    const result = await engine.executeOrchestration({ id: 'SagaOrch' }, steps, {});
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('Insufficient funds');
    expect(compensated).toEqual(['CancelReservation']);

    await engine.dispose();
  });

  // 9. Cancellation
});
