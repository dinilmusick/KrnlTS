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
