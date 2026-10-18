/**
 * @file functionality-orchestration.test.ts
 * @description Comprehensive test suite for KrnlTS FunctionalityOrchestration,
 * canonical BullMQ execution engine, worker execution boundary, and service facade mediation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  FunctionalityOrchestration,
  BullMQExecutionEngine,
  WorkerExecutionBoundary,
  createServiceFacade,
  createServiceDefinition,
  validateOrchestrationDAG,
} from '../index.js';

describe('KrnlTS FunctionalityOrchestration & Canonical BullMQ Architecture', () => {
  // 1. Single functionality execution through BullMQ & Worker boundary
  it('executes a single functionality through BullMQ worker execution boundary', async () => {
    const engine = new BullMQExecutionEngine({ queueName: 'test_func_queue' });
    await engine.start();

    const command = {
      id: 'cmd_1',
      type: 'payment.process',
      payload: { amount: 150, currency: 'USD' },
      correlationId: 'corr_test_1',
      createdAt: Date.now(),
    };

    const handler = async (payload: { amount: number; currency: string }) => {
      return { success: true, transactionId: 'tx_999', charged: payload.amount };
    };

    const result = await engine.executeCommand(command, handler);
    expect(result.status).toBe('COMPLETED');
    expect(result.correlationId).toBe('corr_test_1');
    expect(result.data).toEqual({ success: true, transactionId: 'tx_999', charged: 150 });

    await engine.dispose();
  });

  // 2. Sequential execution & result propagation
  it('executes sequential functionalities with deterministic result propagation', async () => {
    const orch = new FunctionalityOrchestration({ id: 'OrderPipeline' });
    orch
      .thenFunctionality('ValidateCart')
      .thenFunctionality('ApplyDiscount')
      .thenFunctionality('FinalizeOrder');

    const steps = orch.getSteps();
    expect(steps).toHaveLength(3);
    expect(steps[1].dependsOn).toEqual([steps[0].id]);
    expect(steps[2].dependsOn).toEqual([steps[1].id]);

    const engine = new BullMQExecutionEngine({ queueName: 'test_seq_queue' });
    await engine.start();

    const boundSteps = [
      {
        ...steps[0],
        handler: async (input: any) => ({ valid: true, subtotal: input.input.subtotal }),
      },
      {
        ...steps[1],
        handler: async (results: any) => ({ discounted: results[steps[0].id].subtotal - 10 }),
      },
      {
        ...steps[2],
        handler: async (results: any) => ({
          orderId: 'ord_123',
          total: results[steps[1].id].discounted,
        }),
      },
    ];

    const result = await engine.executeOrchestration(
      { id: orch.id, name: orch.name },
      boundSteps,
      { subtotal: 100 }
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.output).toEqual({ orderId: 'ord_123', total: 90 });
    expect(result.stepResults[steps[0].id].status).toBe('COMPLETED');
    expect(result.stepResults[steps[1].id].status).toBe('COMPLETED');
    expect(result.stepResults[steps[2].id].status).toBe('COMPLETED');

    await engine.dispose();
  });

  // 3. Parallel execution & fan-in
  it('executes parallel branches concurrently and fans-in to a joined step', async () => {
    const orch = new FunctionalityOrchestration({ id: 'EnrichmentWorkflow' });
    orch.parallel('fetchData', ['FetchUserProfile', 'FetchUserPreferences']);

    const steps = orch.getSteps();
    expect(steps).toHaveLength(3); // 2 task nodes + 1 fanIn join node

    const engine = new BullMQExecutionEngine({ queueName: 'test_parallel_queue' });
    await engine.start();

    const executionLog: string[] = [];
    const boundSteps = [
      {
        ...steps[0],
        handler: async () => {
          executionLog.push('profile');
          return { name: 'Alice' };
        },
      },
      {
        ...steps[1],
        handler: async () => {
          executionLog.push('preferences');
          return { theme: 'dark' };
        },
      },
      {
        ...steps[2],
        handler: async (results: any) => {
          return {
            profile: results[steps[0].id],
            preferences: results[steps[1].id],
          };
        },
      },
    ];

    const result = await engine.executeOrchestration(
      { id: orch.id },
      boundSteps,
      {}
    );

    expect(result.status).toBe('COMPLETED');
    expect(executionLog).toContain('profile');
    expect(executionLog).toContain('preferences');
    expect(result.output).toEqual({
      profile: { name: 'Alice' },
      preferences: { theme: 'dark' },
    });

    await engine.dispose();
  });

  // 4. Branching / conditional execution
  it('evaluates branching condition and executes only the selected branch', async () => {
    const orch = new FunctionalityOrchestration({ id: 'RiskDecision' });
    orch.branch(
      'checkRisk',
      (ctx) => (ctx.results.input as any).score > 50,
      'ApproveApplication',
      'RejectApplication'
    );

    const steps = orch.getSteps();
    const engine = new BullMQExecutionEngine({ queueName: 'test_branch_queue' });
    await engine.start();

    const boundSteps = steps.map((s) => ({
      ...s,
      handler: async () => ({ decision: s.target }),
    }));

    // Test True branch
    const approvedRes = await engine.executeOrchestration(
      { id: orch.id },
      boundSteps,
      { score: 80 }
    );
    expect(approvedRes.status).toBe('COMPLETED');
    const approveStepId = steps.find((s) => s.target === 'ApproveApplication')!.id;
    const rejectStepId = steps.find((s) => s.target === 'RejectApplication')!.id;
    expect(approvedRes.stepResults[approveStepId].status).toBe('COMPLETED');
    expect(approvedRes.stepResults[rejectStepId].status).toBe('SKIPPED');

    // Test False branch
    const rejectedRes = await engine.executeOrchestration(
      { id: orch.id },
      boundSteps,
      { score: 30 }
    );
    expect(rejectedRes.status).toBe('COMPLETED');
    expect(rejectedRes.stepResults[approveStepId].status).toBe('SKIPPED');
    expect(rejectedRes.stepResults[rejectStepId].status).toBe('COMPLETED');

    await engine.dispose();
  });

  // 5. Fan-out execution
  it('fans-out processing across an array of items with concurrency control', async () => {
    const orch = new FunctionalityOrchestration({ id: 'BatchProcessor' });
    orch.fanOut('processItems', 'TransformItem', (ctx) => (ctx.results.input as any).items, {
      concurrency: 2,
    });

    const steps = orch.getSteps();
    const engine = new BullMQExecutionEngine({ queueName: 'test_fanout_queue' });
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
    const engine = new BullMQExecutionEngine({ queueName: 'test_retry_queue' });
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
    const engine = new BullMQExecutionEngine({ queueName: 'test_timeout_queue' });
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
    const engine = new BullMQExecutionEngine({ queueName: 'test_comp_queue' });
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
  it('supports explicit cancellation of running orchestrations', async () => {
    const engine = new BullMQExecutionEngine({ queueName: 'test_cancel_queue' });
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
    const cancelled = engine.cancelExecution((engine as any).activeExecutions.keys().next().value);
    expect(cancelled).toBe(true);

    const result = await execPromise;
    expect(result.status).toBe('CANCELLED');

    await engine.dispose();
  });

  // 10. Idempotency & Correlation IDs
  it('enforces idempotency and propagates correlation IDs across execution', async () => {
    const engine = new BullMQExecutionEngine({ queueName: 'test_idempotency_queue' });
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

  // 11. ServiceFacade -> BullMQ -> Worker -> Functionality
  it('routes ServiceFacade.call() through BullMQ worker boundary and executes functionality', async () => {
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

  // 12. ServiceFacade -> BullMQ -> Worker -> FunctionalityOrchestration
  it('routes ServiceFacade.orchestrate() through BullMQ worker boundary', async () => {
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
  it('supports single-service application execution without requiring external multi-service infrastructure', async () => {
    const singleServiceApp = createServiceFacade({
      id: 'single.app.service',
      name: 'SingleAppService',
      definition: createServiceDefinition({
        id: 'single.app.service',
        name: 'SingleAppService',
        version: '1.0.0',
        operations: {
          healthCheck: {
            id: 'healthCheck',
            name: 'healthCheck',
            handler: async () => ({ status: 'UP', service: 'single.app.service' }),
          },
        },
      }),
    });

    await singleServiceApp.start();
    const res = await singleServiceApp.call('healthCheck');
    expect(res).toEqual({ status: 'UP', service: 'single.app.service' });
    await singleServiceApp.stop();
    await singleServiceApp.dispose();
  });

  // 14. Nested FunctionalityOrchestration -> FunctionalityOrchestration
  it('supports nested FunctionalityOrchestration calling a child FunctionalityOrchestration within the same service', async () => {
    const childOrch = new FunctionalityOrchestration({ id: 'ChildTransform' });
    childOrch.thenFunctionality('format');

    const parentOrch = new FunctionalityOrchestration({ id: 'ParentFlow' });
    parentOrch
      .thenFunctionality('fetch')
      .thenFunctionalityOrchestration('ChildTransform');

    const facade = createServiceFacade({
      id: 'nested.service',
      functionalityOrchestrations: {
        ChildTransform: childOrch,
        ParentFlow: parentOrch,
      },
      functionalities: {
        fetch: {
          execute: async () => ({ raw: 'data_value' }),
        },
        format: {
          execute: async (results: any) => {
            return { formatted: results.input.step_fetch_1.raw.toUpperCase() };
          },
        },
      },
    });

    await facade.start();

    const res = await facade.orchestrate('ParentFlow', {});
    expect(res.status).toBe('COMPLETED');
    expect(res.output).toEqual({ formatted: 'DATA_VALUE' });

    await facade.stop();
    await facade.dispose();
  });

  // 15. Invariant: FunctionalityOrchestration strictly forbids orchestrating external services
  it('INVARIANT: FunctionalityOrchestration rejects external service composition', () => {
    const orch = new FunctionalityOrchestration({ id: 'IllegalOrch' });
    expect(() => {
      orch.thenFunctionality('ExternalServiceFacade');
    }).toThrow(/Plane Isolation Invariant Violation.*external Service/i);
  });
});
