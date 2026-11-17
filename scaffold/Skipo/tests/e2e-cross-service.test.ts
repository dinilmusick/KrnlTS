/**
 * @file e2e-cross-service.test.ts
 * @description End-to-End realistic test verifying the complete cross-service capability flow
 * across the KrnlTS and Skipo architectural boundary:
 *
 * Service A (UserManagement)
 *   └── owns library: UserValidationLib
 * Service B (Billing)
 *   └── owns functionality: ChargeCustomer
 * BackendFacade
 *   ├── registers Service A
 *   └── registers Service B
 * ServiceOrchestration
 *   ↓
 * SkipoQ
 *   ↓
 * BackendFacade
 *   ↓
 * Service A library (UserValidation)
 *   ↓
 * Service B functionality (ChargeCustomer)
 *   ↓
 * KrnlQ
 *
 * Invariant: Zero direct Service A -> Service B implementation or facade imports.
 */

import { describe, it, expect } from 'vitest';
import { ServiceFacade } from '@ultrst-armada/krnl';
import { BackendFacade } from '../src/backend/BackendFacade.js';
import { ServiceOrchestration } from '../src/backend/orchestration/ServiceOrchestration.js';

describe('End-to-End Cross-Service Capability Architecture', () => {
  it('executes cross-service workflow strictly through BackendFacade without inter-service coupling', async () => {
    const backendFacade = new BackendFacade();

    // 1. Service A (UserManagement) - owns validation library
    const userValidationLib = {
      isValidCustomer: (customer: { email: string; active: boolean }) =>
        customer.active && customer.email.includes('@'),
      sanitizeEmail: (email: string) => email.trim().toLowerCase(),
    };

    const userService = new ServiceFacade({
      id: 'service.user.mgmt',
      name: 'UserManagementService',
      libraries: {
        UserValidation: userValidationLib,
      },
    });

    // 2. Service B (Billing) - owns charging functionality
    const billingService = new ServiceFacade({
      id: 'service.billing.core',
      name: 'BillingCoreService',
      functionalities: {
        ChargeCustomer: {
          execute: async (input: { email: string; amount: number }) => {
            return {
              receiptId: `RCPT_${input.amount}_${Math.random().toString(36).slice(2, 7)}`,
              billedEmail: input.email,
              amount: input.amount,
              timestamp: Date.now(),
            };
          },
        },
      },
    });

    // 3. Register into BackendFacade
    backendFacade.registerService(userService);
    backendFacade.registerService(billingService);

    // Verify BackendFacade aggregation
    expect(backendFacade.libraries.UserValidation).toBeDefined();
    expect(backendFacade.functionalities.ChargeCustomer).toBeDefined();

    // 4. Construct ServiceOrchestration consuming capabilities through BackendFacade
    const orch = new ServiceOrchestration<{ customer: { email: string; active: boolean }; amount: number }, any>(
      'OnboardAndBillCustomerOrchestration'
    );

    // Step 1: Client/Service validation using the library bubbled onto BackendFacade
    orch.thenCapability<{ customer: { email: string; active: boolean }; amount: number }, any>(
      'BillingCoreService',
      'ChargeCustomer',
      {
        id: 'step_charge',
        mapInput: (results) => {
          const input = results.input;
          // Consumer accesses UserValidation via BackendFacade:
          const validation = backendFacade.libraries.UserValidation;
          const isValid = validation.isValidCustomer(input.customer);
          if (!isValid) {
            throw new Error(`Invalid customer credentials: ${input.customer.email}`);
          }
          const cleanEmail = validation.sanitizeEmail(input.customer.email);
          return { email: cleanEmail, amount: input.amount };
        },
      }
    );

    // 5. Execute orchestration through SkipoQ -> BackendFacade -> ServiceFacade -> KrnlQ
    const res = await orch.execute(
      {
        customer: { email: '  CLIENT@ACME.CORP  ', active: true },
        amount: 250,
      },
      {
        correlationId: 'corr_e2e_cross_service_101',
        metadata: { backendFacade },
      }
    );

    expect(res.success).toBe(true);
    expect(res.correlationId).toBe('corr_e2e_cross_service_101');
    expect(res.data.billedEmail).toBe('client@acme.corp');
    expect(res.data.amount).toBe(250);
    expect(res.data.receiptId).toMatch(/^RCPT_250_/);
  });
});
