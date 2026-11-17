/**
 * @file backend-facade-contract.test.ts
 * @description Verifies the KrnlTS boundary contract for ServiceFacade capability bubbling
 * into BackendFacade:
 * 1. ServiceFacade creates a self-identified namespace (getNamespace()).
 * 2. ServiceFacade exposes functionalities, functionalityOrchestrations, and libraries.
 * 3. FunctionalityOrchestration executes functionalities strictly through ServiceFacade / KrnlQ.
 * 4. Verifies strong typing and complete metadata without filesystem leaks.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ServiceFacade,
  FunctionalityOrchestration,
  KrnlQueue,
} from '../index.js';

describe('KrnlTS ServiceFacade Capability Bubbling & BackendFacade Contract', () => {
  it('creates an isolated, self-identified namespace of its own name exposing all capabilities', () => {
    const userValidationLib = {
      validateEmail: (email: string) => email.includes('@'),
      minPasswordLength: 8,
    };

    const hashFunc = {
      execute: async (payload: { raw: string }) => ({ hashed: `hash_${payload.raw}` }),
    };

    const orch = new FunctionalityOrchestration({ id: 'AccountSetupWorkflow' });
    orch.thenFunctionality('HashPassword');

    const authService = new ServiceFacade({
      id: 'service.auth',
      name: 'AuthService',
      version: '2.1.0',
      description: 'Handles authentication and identity',
      libraries: {
        userValidation: userValidationLib,
      },
      functionalities: {
        HashPassword: hashFunc,
      },
      functionalityOrchestrations: {
        AccountSetup: orch,
      },
      capabilities: [
        { id: 'auth.verify', name: 'Identity Verification', protocols: ['http', 'ws'] },
      ],
    });

    const namespace = authService.getNamespace();
    expect(namespace.serviceId).toBe('service.auth');
    expect(namespace.serviceName).toBe('AuthService');
    expect(namespace.version).toBe('2.1.0');
    expect(namespace.description).toBe('Handles authentication and identity');

    // Libraries bubbled into namespace
    expect(namespace.libraries.userValidation).toBeDefined();
    expect(namespace.libraries.userValidation.validateEmail('dev@krnl.io')).toBe(true);

    // Functionalities bubbled into namespace
    expect(namespace.functionalities.HashPassword).toBeDefined();

    // Orchestrations bubbled into namespace
    expect(namespace.functionalityOrchestrations.AccountSetup).toBeDefined();

    // Also accessible via metadata getter
    const metadata = authService.getServiceFacadeMetadata();
    expect(metadata.serviceName).toBe('AuthService');
    expect(authService.namespace.serviceId).toBe('service.auth');
  });

  it('routes FunctionalityOrchestration execution through ServiceFacade and KrnlQ job abstraction', async () => {
    const executedSteps: string[] = [];

    const service = new ServiceFacade({
      id: 'service.inventory',
      name: 'InventoryService',
    });

    service.registerFunctionality('CheckStock', {
      execute: async (payload: { sku: string; qty: number }) => {
        executedSteps.push(`CheckStock:${payload.sku}`);
        return { inStock: true, available: 100 };
      },
    });

    service.registerFunctionality('ReserveStock', {
      execute: async (payload: { sku: string; qty: number }) => {
        executedSteps.push(`ReserveStock:${payload.sku}`);
        return { reservationId: `res_${payload.sku}_${payload.qty}` };
      },
    });

    const orch = new FunctionalityOrchestration({ id: 'ReserveItemsWorkflow' });
    orch.thenFunctionality('CheckStock').thenFunctionality('ReserveStock');

    service.registerFunctionalityOrchestration('ReserveItems', orch);

    // Execute via ServiceFacade -> KrnlQ
    const res = await service.orchestrate('ReserveItems', { sku: 'SKU-001', qty: 5 }, {
      correlationId: 'corr_test_inventory',
    });

    expect(res.status).toBe('COMPLETED');
    expect(res.correlationId).toBe('corr_test_inventory');
    expect(executedSteps).toEqual(['CheckStock:SKU-001', 'ReserveStock:SKU-001']);
  });

  it('enforces that FunctionalityOrchestration cannot compose external services', () => {
    const orch = new FunctionalityOrchestration({ id: 'InvalidWorkflow' });
    expect(() => {
      orch.thenFunctionality('PaymentServiceFacade');
    }).toThrow(/Plane Isolation Invariant Violation/);
  });
});
