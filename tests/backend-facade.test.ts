/**
 * @file backend-facade.test.ts
 * @description Comprehensive test suite for Skipo BackendFacade & Capability Bubbling.
 * Verifies:
 * 1. Service aggregation (ServiceFacade A & B -> BackendFacade)
 * 2. Backend bubbling (all capabilities exposed on BackendFacade)
 * 3. Cross-service library access without knowing owning service
 * 4. Cross-service functionality access & execution via KrnlQ
 * 5. Ownership transparency (caller does not need to know owner)
 * 6. Deterministic collision detection when multiple services expose identical capability names
 */

import { describe, it, expect } from 'vitest';
import { ServiceFacade, FunctionalityOrchestration } from '@ultrst-armada/krnl';
import { BackendFacade } from '../src/backend/BackendFacade.js';

describe('Skipo BackendFacade & Capability Bubbling Architecture', () => {
  it('aggregates multiple ServiceFacades into BackendFacade and preserves service namespaces', () => {
    const bf = new BackendFacade();

    const serviceA = new ServiceFacade({
      id: 'service.auth',
      name: 'AuthService',
      libraries: {
        tokenHelper: { sign: (id: string) => `token_${id}` },
      },
      functionalities: {
        validateToken: {
          execute: async (input: { token: string }) => ({ valid: input.token.startsWith('token_') }),
        },
      },
    });

    const serviceB = new ServiceFacade({
      id: 'service.billing',
      name: 'BillingService',
      libraries: {
        currencyFormatter: { format: (amount: number) => `$${amount.toFixed(2)}` },
      },
    });

    bf.registerService(serviceA);
    bf.registerService(serviceB);

    // Namespaces are preserved and accessible
    expect(bf.namespaces['AuthService']).toBeDefined();
    expect(bf.namespaces['BillingService']).toBeDefined();
    expect(bf.namespaces['service.auth']).toBeDefined();

    // Capabilities bubble into common BackendFacade surfaces
    expect(bf.libraries.tokenHelper).toBeDefined();
    expect(bf.libraries.currencyFormatter).toBeDefined();
    expect(bf.functionalities.validateToken).toBeDefined();
  });

  it('provides ownership transparency: consumer accesses capabilities without knowing the owning service', () => {
    const bf = new BackendFacade();

    const taxCalculatorLib = {
      computeTax: (amount: number) => amount * 0.15,
    };

    const taxService = new ServiceFacade({
      id: 'service.tax.engine',
      name: 'TaxEngineService',
      libraries: {
        taxCalculator: taxCalculatorLib,
      },
    });

    bf.registerService(taxService);

    // Consumer (e.g. Checkout Service) only interacts with BackendFacade
    const taxLib = bf.getLibrary<typeof taxCalculatorLib>('taxCalculator');
    expect(taxLib).toBeDefined();
    expect(taxLib.computeTax(200)).toBe(30);

    // Proxy access also works seamlessly
    expect(bf.libraries.taxCalculator.computeTax(100)).toBe(15);
  });

  it('detects collisions deterministically and requires namespaced qualification', () => {
    const bf = new BackendFacade();

    const serviceA = new ServiceFacade({
      id: 'service.alpha',
      name: 'ServiceAlpha',
      libraries: {
        config: { mode: 'cluster', shards: 4 },
      },
    });

    const serviceB = new ServiceFacade({
      id: 'service.beta',
      name: 'ServiceBeta',
      libraries: {
        config: { mode: 'standalone', debug: true },
      },
    });

    bf.registerService(serviceA);
    bf.registerService(serviceB);

    // Unqualified access throws a deterministic collision error
    expect(() => bf.getLibrary('config')).toThrow(
      /Collision detected: capability 'config' is registered by multiple services/
    );
    expect(() => bf.libraries.config).toThrow(/Collision detected/);

    // Qualified / namespaced access succeeds deterministically
    const configA = bf.getLibrary<{ mode: string; shards: number }>('config', 'ServiceAlpha');
    const configB = bf.getLibrary<{ mode: string; debug: boolean }>('config', 'ServiceBeta');

    expect(configA.mode).toBe('cluster');
    expect(configB.mode).toBe('standalone');

    // Direct namespace access also works
    expect(bf.namespaces.ServiceAlpha.libraries.config.shards).toBe(4);
    expect(bf.namespaces.ServiceBeta.libraries.config.debug).toBe(true);
  });

  it('executes cross-service functionality through BackendFacade -> ServiceFacade -> KrnlQ', async () => {
    const bf = new BackendFacade();

    const paymentService = new ServiceFacade({
      id: 'service.payment',
      name: 'PaymentService',
      functionalities: {
        chargeCard: {
          execute: async (input: { amount: number; cardLast4: string }) => ({
            success: true,
            authCode: `AUTH_${input.cardLast4}_${input.amount}`,
          }),
        },
      },
    });

    bf.registerService(paymentService);

    // Cross-service call: Consumer calls BackendFacade.executeCapability
    const result = await bf.executeCapability<{ amount: number; cardLast4: string }, { success: boolean; authCode: string }>(
      'chargeCard',
      'chargeCard',
      { amount: 50, cardLast4: '4242' },
      { correlationId: 'corr_test_charge' }
    );

    expect(result.success).toBe(true);
    expect(result.authCode).toBe('AUTH_4242_50');
  });

  it('bubbles FunctionalityOrchestrations into BackendFacade and executes them mediated through queue', async () => {
    const bf = new BackendFacade();

    const workflowService = new ServiceFacade({
      id: 'service.workflow',
      name: 'WorkflowService',
    });

    workflowService.registerFunctionality('stepOne', {
      execute: async (input: { val: number }) => ({ val: input.val + 10 }),
    });
    workflowService.registerFunctionality('stepTwo', {
      execute: async (results: any) => ({ val: results.input.val * 2 }),
    });

    const orch = new FunctionalityOrchestration({ id: 'MathPipeline' });
    orch.thenFunctionality('stepOne');

    workflowService.registerFunctionalityOrchestration('RunPipeline', orch);
    bf.registerService(workflowService);

    expect(bf.orchestrations.RunPipeline).toBeDefined();

    const res = await bf.executeCapability('RunPipeline', 'RunPipeline', { val: 5 });
    expect(res).toBeDefined();
  });
});
