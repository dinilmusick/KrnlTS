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
  it('executes a single functionality through KrnlQ worker execution boundary', async () => {
    const engine = new KrnlQueue({ queueName: 'test_func_queue' });
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

    const engine = new KrnlQueue({ queueName: 'test_seq_queue' });
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

    const engine = new KrnlQueue({ queueName: 'test_parallel_queue' });
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
    const engine = new KrnlQueue({ queueName: 'test_branch_queue' });
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
});
