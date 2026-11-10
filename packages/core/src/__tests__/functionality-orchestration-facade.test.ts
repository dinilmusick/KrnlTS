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
  it('supports explicit cancellation of running orchestrations', async () => {
    const engine = new KrnlQueue({ queueName: 'test_cancel_queue' });
    await engine.start();

    let started = false;
    const steps = [
      {
        id: 'long_step',
        name: 'LongStep',
        type: 'task' as const,
        handler: async () => {
          started = true;
          await new Promise((r) => setTimeout(r, 200));
          return 'done';
        },
      },
    ];

    const execPromise = engine.executeOrchestration({ id: 'CancelOrch' }, steps, {});
    await new Promise((r) => setTimeout(r, 20));

    // Cancel by context
    const cancelled = engine.cancelExecution((engine as any).activeOrchestrations.keys().next().value);
    expect(cancelled).toBe(true);

    const result = await execPromise;
    expect(result.status).toBe('CANCELLED');

    await engine.dispose();
  });

  // 10. Idempotency & Correlation IDs

  it('enforces idempotency and propagates correlation IDs across execution', async () => {
    const engine = new KrnlQueue({ queueName: 'test_idempotency_queue' });
    await engine.start();

    let invocationCount = 0;
    const steps = [
      {
        id: 'idempotent_step',
        name: 'Step',
        type: 'task' as const,
        handler: async () => {
          invocationCount++;
          return { count: invocationCount };
        },
      },
    ];

    const res1 = await engine.executeOrchestration(
      { id: 'IdempotentOrch' },
      steps,
      {},
      { idempotencyKey: 'idem_key_42', correlationId: 'corr_custom_99' }
    );
    expect(res1.correlationId).toBe('corr_custom_99');
    expect(res1.output).toEqual({ count: 1 });

    // Second call with same idempotency key returns cached output without re-executing
    const res2 = await engine.executeOrchestration(
      { id: 'IdempotentOrch' },
      steps,
      {},
      { idempotencyKey: 'idem_key_42', correlationId: 'corr_custom_99' }
    );
    expect(res2.output).toEqual({ count: 1 });
    expect(invocationCount).toBe(1);

    await engine.dispose();
  });

  // 11. ServiceFacade -> KrnlQ -> Worker -> Functionality

  it('routes ServiceFacade.call() through KrnlQ worker boundary and executes functionality', async () => {
    const facade = createServiceFacade({
      id: 'calculator.service',
      name: 'CalculatorService',
      version: '1.0.0',
      definition: createServiceDefinition({
        id: 'calculator.service',
        name: 'CalculatorService',
        version: '1.0.0',
        operations: {
          add: {
            id: 'add',
            name: 'add',
            handler: async (input: { a: number; b: number }) => ({ sum: input.a + input.b }),
          },
        },
      }),
    });

    await facade.start();

    // Call routes through queue and worker
    const result = await facade.call<{ a: number; b: number }, { sum: number }>('add', {
      a: 15,
      b: 25,
    });
    expect(result.sum).toBe(40);

    await facade.stop();
    await facade.dispose();
  });

  // 12. ServiceFacade -> KrnlQ -> Worker -> FunctionalityOrchestration

  it('routes ServiceFacade.orchestrate() through KrnlQ worker boundary', async () => {
    const orch = new FunctionalityOrchestration({ id: 'ComputeAndLog' });
    orch
      .thenFunctionality('multiply')
      .thenFunctionality('record');

    const executionLog: string[] = [];

    const facade = createServiceFacade({
      id: 'math.service',
      name: 'MathService',
      functionalityOrchestrations: {
        ComputeAndLog: orch,
      },
      functionalities: {
        multiply: {
          execute: async (input: any) => {
            const product = input.input.a * input.input.b;
            executionLog.push(`mult:${product}`);
            return { product };
          },
        },
        record: {
          execute: async (results: any) => {
            executionLog.push(`record:${results.step_multiply_1.product}`);
            return { recorded: true, final: results.step_multiply_1.product };
          },
        },
      },
    });

    await facade.start();

    const orchResult = await facade.orchestrate('ComputeAndLog', { a: 6, b: 7 });
    expect(orchResult.status).toBe('COMPLETED');
    expect(orchResult.output).toEqual({ recorded: true, final: 42 });
    expect(executionLog).toEqual(['mult:42', 'record:42']);

    await facade.stop();
    await facade.dispose();
  });

  // 13. Single-service application execution
});
