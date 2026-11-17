import { describe, it, expect, vi } from 'vitest';
import {
  createServiceFacade,
  FunctionalityOrchestration,
} from '../index.js';

describe('Standalone Single-Service Execution Contract (KrnlTS)', () => {
  it('executes single functionalities and functionality orchestrations through KrnlQ without Skipo', async () => {
    // 1. Define internal functionalities
    const calculateTax = {
      execute: vi.fn(async (payload: { amount: number }) => {
        return { amount: payload.amount, tax: payload.amount * 0.1 };
      }),
    };

    const applyDiscount = {
      execute: vi.fn(async (payload: { amount: number; tax: number; code?: string }) => {
        const discount = payload.code === 'SAVE10' ? 10 : 0;
        return {
          ...payload,
          discount,
          total: payload.amount + payload.tax - discount,
        };
      }),
    };

    const formatReceipt = {
      execute: vi.fn(async (payload: { total: number }) => {
        return { receiptId: 'REC-123', totalDue: payload.total };
      }),
    };

    // 2. Define FunctionalityOrchestration within the single service boundary
    const checkoutOrch = new FunctionalityOrchestration({
      id: 'checkout_flow',
      name: 'Checkout Flow',
      version: '1.0.0',
    });

    checkoutOrch
      .thenFunctionality('calculateTax')
      .thenFunctionality('applyDiscount')
      .thenFunctionality('formatReceipt');

    // 3. Assemble ServiceFacade
    const facade = createServiceFacade({
      id: 'billing_service',
      name: 'Billing Service',
      version: '1.0.0',
      functionalities: {
        calculateTax,
        applyDiscount,
        formatReceipt,
      },
      functionalityOrchestrations: {
        checkout_flow: checkoutOrch,
      },
    });

    await facade.start();

    // 4. Test callable operation execution via KrnlQ queue
    const taxResult = await facade.call<{ amount: number }, { amount: number; tax: number }>(
      'calculateTax',
      { amount: 100 }
    );
    expect(taxResult.amount).toBe(100);
    expect(taxResult.tax).toBe(10);
    expect(calculateTax.execute).toHaveBeenCalledTimes(1);

    // 5. Test FunctionalityOrchestration execution via KrnlQ queue
    const orchResult = await facade.execute('checkout_flow', { amount: 200 });
    expect(orchResult.status).toBe('COMPLETED');
    expect(orchResult.output).toEqual({ receiptId: 'REC-123', totalDue: 220 });
    expect(orchResult.stepResults['step_calculateTax_1'].status).toBe('COMPLETED');
    expect(orchResult.stepResults['step_applyDiscount_2'].status).toBe('COMPLETED');
    expect(orchResult.stepResults['step_formatReceipt_3'].status).toBe('COMPLETED');

    await facade.dispose();
  });

  it('enforces runtime plane isolation: rejects orchestrating foreign services inside FunctionalityOrchestration', () => {
    const orch = new FunctionalityOrchestration({ id: 'invalid_orch' });

    // 1. Rejects foreign ServiceFacade object
    const foreignFacade = createServiceFacade({ id: 'inventory_service' });
    expect(() => orch.thenFunctionality(foreignFacade as any)).toThrow(
      /Invariant Violation: FunctionalityOrchestration only composes functionalities within the service, not independent services/
    );

    // 2. Rejects foreign service name pattern
    expect(() => orch.thenFunctionality('inventoryServiceFacade')).toThrow(
      /Invariant Violation: FunctionalityOrchestration only composes functionalities within the service/
    );
    expect(() => orch.thenFunctionality('service.inventory.check')).toThrow(
      /Invariant Violation: FunctionalityOrchestration only composes functionalities within the service/
    );
    expect(() => orch.thenFunctionality('InventoryService')).toThrow(
      /Invariant Violation: FunctionalityOrchestration only composes functionalities within the service/
    );
  });

  it('executes saga compensation in reverse order on downstream step failure', async () => {
    const compensationOrder: string[] = [];

    const step1Comp = vi.fn(async () => {
      compensationOrder.push('step1_compensated');
    });

    const step2Comp = vi.fn(async () => {
      compensationOrder.push('step2_compensated');
    });

    const step1 = {
      execute: vi.fn(async () => ({ ok: true })),
    };

    const step2 = {
      execute: vi.fn(async () => ({ ok: true })),
    };

    const step3 = {
      execute: vi.fn(async () => {
        throw new Error('Fatal database corruption during step 3');
      }),
    };

    const orch = new FunctionalityOrchestration({ id: 'saga_orch' });
    orch
      .thenFunctionality('step1', {
        compensation: 'step1_undo',
      })
      .thenFunctionality('step2', {
        compensation: 'step2_undo',
      })
      .thenFunctionality('step3');

    // Attach step-level compensation handlers
    (orch as any).steps[0].compensation = { handler: step1Comp };
    (orch as any).steps[1].compensation = { handler: step2Comp };

    const facade = createServiceFacade({
      id: 'saga_service',
      functionalities: { step1, step2, step3 },
      functionalityOrchestrations: { saga_orch: orch },
    });

    await facade.start();

    await expect(facade.execute('saga_orch', {})).rejects.toThrow(
      'Fatal database corruption during step 3'
    );

    // Verify reverse compensation order
    expect(compensationOrder).toEqual(['step2_compensated', 'step1_compensated']);

    await facade.dispose();
  });

  it('differentiates TIMED_OUT and CANCELLED states deterministically', async () => {
    // Timeout test
    const slowFunc = {
      execute: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 100));
        return { done: true };
      }),
    };

    const timeoutOrch = new FunctionalityOrchestration({
      id: 'timeout_orch',
      timeoutMs: 20,
    });
    timeoutOrch.thenFunctionality('slowFunc');

    const facade = createServiceFacade({
      id: 'timeout_service',
      functionalities: { slowFunc },
      functionalityOrchestrations: { timeout_orch: timeoutOrch },
    });

    await facade.start();

    const timeoutResult = await facade.orchestrate('timeout_orch', {});
    expect(timeoutResult.status).toBe('TIMED_OUT');
    expect(timeoutResult.error).toContain('timed out');

    // Cancellation test
    const abortController = new AbortController();
    const cancelPromise = facade.orchestrate('timeout_orch', {}, {
      abortSignal: abortController.signal,
      timeoutMs: 5000,
    });
    abortController.abort();
    const cancelResult = await cancelPromise;
    expect(cancelResult.status).toBe('CANCELLED');

    await facade.dispose();
  });
});
