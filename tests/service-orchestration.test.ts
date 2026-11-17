/**
 * @file service-orchestration.test.ts
 * @description Comprehensive Verification Suite for Canonical Skipo ServiceOrchestration Architecture:
 *
 * 1. Sequential cross-service orchestration
 * 2. Parallel cross-service orchestration
 * 3. Diamond DAG cross-service orchestration
 * 4. Branching / conditional execution
 * 5. Fan-out / fan-in cross-service execution
 * 6. Retries with backoff
 * 7. Timeout handling
 * 8. Saga compensation in reverse execution order
 * 9. Cancellation via AbortSignal
 * 10. Idempotency key deduplication
 * 11. Correlation ID propagation & execution trace
 * 12. Nested service orchestration
 * 13. Single-service mediated BullMQ execution (executeService)
 * 14. Negative Invariant: Direct functionality orchestration is strictly forbidden
 */

import { describe, it, expect } from 'vitest';
import { ServiceOrchestration } from '../src/backend/orchestration/ServiceOrchestration.js';
import {
  SkipoBackend,
  executeService,
  executeOrchestration,
} from '../src/backend/SkipoBackend.js';
import {
  ServiceAFacade,
  ServiceBFacade,
  ServiceCFacade,
  ServiceDFacade,
} from '@ultrst-armada/kloks/services';

describe('Skipo Canonical ServiceOrchestration Architecture Suite', () => {
  // 1. Sequential cross-service orchestration
  it('executes sequential cross-service orchestration across Service A, B, and C', async () => {
    const orch = new ServiceOrchestration<{ a: number; b: number }, { count: number; reading: any }>(
      'SequentialMathCounterTelemetry'
    );

    orch
      .thenService<{ a: number; b: number }, { result: number }>(ServiceAFacade, 'add', {
        id: 'step_math',
      })
      .thenService<{ result: number }, { count: number }>(ServiceBFacade, 'increment', {
        id: 'step_counter',
        name: 'IncrementCounterWithSum',
      })
      .thenService<{ count: number }, { count: number; reading: any }>(
        ServiceCFacade,
        'publishReading',
        {
          id: 'step_telemetry',
        }
      );

    const res = await orch.execute({ a: 15, b: 25 }, { correlationId: 'corr_seq_1' });

    expect(res.success).toBe(true);
    expect(res.correlationId).toBe('corr_seq_1');
    expect(res.trace).toHaveLength(3);
    expect(res.trace[0].stepId).toBe('step_math');
    expect(res.trace[1].stepId).toBe('step_counter');
    expect(res.trace[2].stepId).toBe('step_telemetry');
  });

  // 2. Parallel cross-service orchestration
  it('executes parallel cross-service orchestration concurrently', async () => {
    const orch = new ServiceOrchestration<{ a: number; b: number }, any[]>('ParallelMathAndStrings');

    orch.parallel([
      { service: ServiceAFacade, operation: 'multiply' },
      { service: ServiceDFacade, operation: 'uppercase' },
    ]);

    const res = await orch.execute({ a: 6, b: 7, text: 'skipo' });

    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toEqual({ result: 42 });
    expect(res.data[1]).toEqual({ result: 'SKIPO' });
  });

  // 3. Diamond DAG cross-service orchestration
  it('executes diamond DAG cross-service orchestration (fan-out and join)', async () => {
    const orch = new ServiceOrchestration<{ a: number; b: number }, any>('DiamondDagServices');

    // Step 1: Root math
    orch.step<{ a: number; b: number }, { result: number }>(
      'root_add',
      ServiceAFacade,
      'add',
      []
    );

    // Step 2 & 3: Two branches depending on root
    orch.step<{ result: number }, any>(
      'branch_left',
      ServiceBFacade,
      'increment',
      ['root_add']
    );

    orch.step<{ result: number }, any>(
      'branch_right',
      ServiceCFacade,
      'publishReading',
      ['root_add']
    );

    // Step 4: Join
    orch.step<any, { completed: boolean; left: any; right: any }>(
      'join_step',
      {
        id: 'join.service',
        name: 'JoinService',
        execute: async (op, input: any) => ({
          completed: true,
          combined: true,
          input,
        }),
      },
      'combine',
      ['branch_left', 'branch_right']
    );

    const res = await orch.execute({ a: 10, b: 10 });
    expect(res.success).toBe(true);
    expect(res.trace.map((t) => t.stepId)).toEqual([
      'root_add',
      'branch_left',
      'branch_right',
      'join_step',
    ]);
  });

  // 4. Branching / conditional execution
  it('branches conditionally based on runtime context predicate', async () => {
    const orch = new ServiceOrchestration<{ value: number }, any>('BranchingServiceOrch');

    const highValueOrch = new ServiceOrchestration('HighValuePipeline').thenService(
      ServiceDFacade,
      'uppercase',
      { id: 'high_op' }
    );

    const lowValueOrch = new ServiceOrchestration('LowValuePipeline').thenService(
      ServiceAFacade,
      'add',
      { id: 'low_op' }
    );

    orch.branch(
      (ctx) => (ctx.stepOutputs['initial']?.value ?? 0) > 50,
      highValueOrch,
      lowValueOrch
    );

    // Test high branch
    const resHigh = await orch.execute({ value: 100, text: 'vip' });
    expect(resHigh.success).toBe(true);
    expect(resHigh.data).toEqual({ result: 'VIP' });

    // Test low branch
    const resLow = await orch.execute({ value: 20, a: 2, b: 3 });
    expect(resLow.success).toBe(true);
    expect(resLow.data).toEqual({ result: 5 });
  });

  // 5. Fan-out / fan-in cross-service execution
  it('fans out across an array of inputs and joins outputs', async () => {
    const orch = new ServiceOrchestration<number[], any[]>('FanOutServices');

    orch.fanOut<number, { result: number }>(
      (input) => input,
      (num) => ({
        service: ServiceAFacade,
        operation: 'add',
      })
    );

    const res = await orch.execute([1, 2, 3, 4]);
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(4);
  });

  // 6. Retries with backoff
  it('retries failing service operations up to maxAttempts with exponential backoff', async () => {
    let attempts = 0;
    const flakeyService = {
      id: 'flakey.service',
      name: 'FlakeyService',
      execute: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient service failure');
        }
        return { recovered: true, attempts };
      },
    };

    const orch = new ServiceOrchestration('RetryTestOrch');
    orch.thenService(flakeyService, 'poll', {
      retries: 4,
      retryDelayMs: 20,
      retryBackoffMultiplier: 1.5,
    });

    const res = await orch.execute({});
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ recovered: true, attempts: 3 });
    expect(res.trace[0].retryCount).toBe(2);
  });

  // 7. Timeout handling
  it('fails with timeout error when service step execution exceeds timeoutMs', async () => {
    const slowService = {
      id: 'slow.service',
      name: 'SlowService',
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { done: true };
      },
    };

    const orch = new ServiceOrchestration('TimeoutTestOrch');
    orch.thenService(slowService, 'longRunning', {
      timeoutMs: 50,
    });

    const res = await orch.execute({});
    expect(res.success).toBe(false);
    expect(res.error?.message).toMatch(/timed out after 50ms/i);
  });

  // 8. Saga compensation in reverse execution order
  it('triggers saga compensation in reverse execution order upon downstream failure', async () => {
    const compensationLog: string[] = [];

    const service1 = {
      id: 's1',
      name: 'Service1',
      execute: async () => ({ token: 's1_ok' }),
    };
    const service2 = {
      id: 's2',
      name: 'Service2',
      execute: async () => ({ token: 's2_ok' }),
    };
    const service3 = {
      id: 's3',
      name: 'Service3',
      execute: async () => {
        throw new Error('Service 3 exploded');
      },
    };

    const orch = new ServiceOrchestration('SagaCompensationOrch');
    orch
      .thenService(service1, 'op1', {
        id: 'step_1',
        compensate: async () => {
          compensationLog.push('compensate_step_1');
        },
      })
      .thenService(service2, 'op2', {
        id: 'step_2',
        compensate: async () => {
          compensationLog.push('compensate_step_2');
        },
      })
      .thenService(service3, 'op3', {
        id: 'step_3',
      });

    const res = await orch.execute({});
    expect(res.success).toBe(false);
    expect(res.error?.message).toBe('Service 3 exploded');
    // Reverse order: step 2 compensated first, then step 1
    expect(compensationLog).toEqual(['compensate_step_2', 'compensate_step_1']);
  });

  // 9. Cancellation via AbortSignal
  it('cancels service orchestration immediately when AbortSignal triggers', async () => {
    const abortController = new AbortController();

    const slowService = {
      id: 'cancellable.service',
      name: 'CancellableService',
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { ok: true };
      },
    };

    const orch = new ServiceOrchestration('CancellationOrch');
    orch.thenService(slowService, 'runSlow');

    setTimeout(() => {
      abortController.abort();
    }, 40);

    const res = await orch.execute({}, { abortSignal: abortController.signal });
    expect(res.success).toBe(false);
    expect(res.error?.name).toBe('AbortError');
  });

  // 10. Idempotency key deduplication
  it('returns cached results for identical idempotency keys', async () => {
    let callCount = 0;
    const countingService = {
      id: 'counting.service',
      name: 'CountingService',
      execute: async () => {
        callCount++;
        return { callCount, timestamp: Date.now() };
      },
    };

    const orch = new ServiceOrchestration('IdempotencyOrch');
    orch.thenService(countingService, 'count');

    const res1 = await orch.execute({}, { idempotencyKey: 'idem_key_unique_1' });
    const res2 = await orch.execute({}, { idempotencyKey: 'idem_key_unique_1' });

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(callCount).toBe(1);
    expect(res1.data).toEqual(res2.data);
  });

  // 11. Correlation ID propagation & execution trace
  it('propagates correlation ID and records timestamps in execution trace', async () => {
    const orch = new ServiceOrchestration('CorrelationTraceOrch');
    orch.thenService(ServiceAFacade, 'add').thenService(ServiceDFacade, 'uppercase');

    const res = await orch.execute({ a: 1, b: 2, text: 'trace' }, { correlationId: 'corr_meta_999' });

    expect(res.success).toBe(true);
    expect(res.correlationId).toBe('corr_meta_999');
    for (const record of res.trace) {
      expect(record.status).toBe('COMPLETED');
      expect(record.startedAt).toBeGreaterThan(0);
      expect(record.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  // 12. Nested service orchestration
  it('composes nested service orchestrations cleanly', async () => {
    const innerOrch = new ServiceOrchestration<{ a: number; b: number }, { result: number }>('InnerOrch');
    innerOrch.thenService(ServiceAFacade, 'add');

    const outerOrch = new ServiceOrchestration<{ a: number; b: number; text: string }, any>('OuterOrch');
    outerOrch
      .thenServiceOrchestration(innerOrch)
      .thenService(ServiceDFacade, 'uppercase', { id: 'outer_step' });

    const res = await outerOrch.execute({ a: 10, b: 20, text: 'nested' });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ result: 'NESTED' });
  });

  // 13. Single-service mediated KrnlQ execution (executeService)
  it('enforces external caller -> ServiceFacade -> KrnlQ -> Worker pipeline for single-service execution', async () => {
    const sum = await executeService<{ a: number; b: number }, { result: number }>(
      'serviceA',
      'add',
      { a: 50, b: 50 }
    );
    expect(sum.result).toBe(100);

    const upper = await executeService<{ text: string }, { result: string }>(
      'serviceD',
      'uppercase',
      { text: 'krnlq_mediated' }
    );
    expect(upper.result).toBe('KRNLQ_MEDIATED');
  });

  // 14. Negative Invariant: Direct functionality orchestration is strictly forbidden
  it('NEGATIVE INVARIANT: rejects direct functionality quad-units without a service facade', () => {
    const orch = new ServiceOrchestration('ForbiddenFunctionalityOrch');

    const rawFunctionality = {
      _isFunctionality: true,
      name: 'ProcessPaymentFunctionality',
      execute: async () => ({ paid: true }),
    };

    expect(() => {
      orch.thenService(rawFunctionality as any, 'execute');
    }).toThrow(/Invariant Violation: ServiceOrchestration composes independent services, NOT internal functionalities/i);
  });

  // 15. Instantiates and executes from pure OrchestrationDefinition
  it('instantiates and executes ServiceOrchestration from pure serializable OrchestrationDefinition', async () => {
    const def = {
      id: 'custom_cross_service_def',
      name: 'CustomCrossService',
      version: '1.0.0',
      scope: 'service' as const,
      dependencies: ['serviceA', 'serviceD'],
      steps: [
        {
          id: 'step_math',
          name: 'Math',
          type: 'task' as const,
          target: 'serviceA',
          operation: 'add',
        },
        {
          id: 'step_text',
          name: 'Text',
          type: 'task' as const,
          target: 'serviceD',
          operation: 'uppercase',
          dependsOn: ['step_math'],
        },
      ],
    };

    const serviceMap: Record<string, any> = {
      serviceA: ServiceAFacade,
      serviceD: ServiceDFacade,
    };

    const orch = ServiceOrchestration.fromDefinition(def, (id) => serviceMap[id]);
    const res = await orch.execute({ a: 10, b: 5, text: 'hello' });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ result: 'HELLO' });
  });
});
