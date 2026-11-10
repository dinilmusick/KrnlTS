import { describe, expect, it, vi } from 'vitest';
import {
  LifecycleManager,
  createService,
  createServiceDefinition,
  createServiceProxy,
  ServiceRegistry,
  ServiceRuntime,
  ServiceProxy,
} from '../index.js';

function definition(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test.service',
    name: 'Test Service',
    version: '1.0.0',
    operations: {
      ping: {
        id: 'ping',
        name: 'ping',
        handler: async () => 'pong',
      },
    },
    ...overrides,
  };
}

describe('Canonical FunctionalityOrchestration and ServiceFacade Architecture', () => {
    it('instantiates and configures declarative FunctionalityOrchestration flows without application leakage', async () => {
      const { FunctionalityOrchestration } = await import('../orchestration/FunctionalityOrchestration.js');

      class TestOrchestration extends FunctionalityOrchestration {
        constructor() {
          super({ id: 'PaymentOrchestration', name: 'Payment', version: '1.2.0', description: 'Payment orchestration flow' });
        }
      }

      const orch = new TestOrchestration();
      expect(orch.id).toBe('PaymentOrchestration');
      expect(orch.name).toBe('Payment');
      expect(orch.version).toBe('1.2.0');

      const flow = orch
        .flow('checkoutFlow')
        .thenFunctionality('ValidateCart')
        .thenFunctionality('ChargeCard')
        .thenFunctionalityOrchestration('NotificationOrchestration', 'sendReceipt')
        .register({ visibility: 'public' });

      expect(flow.name).toBe('checkoutFlow');
      expect(flow.steps).toHaveLength(3);
      expect(flow.steps[0]).toEqual({ id: 'checkoutFlow_ValidateCart_1', type: 'functionality', target: 'ValidateCart' });
      expect(flow.steps[1]).toEqual({ id: 'checkoutFlow_ChargeCard_2', type: 'functionality', target: 'ChargeCard' });
      expect(flow.steps[2]).toEqual({ id: 'checkoutFlow_orch_NotificationOrchestration_3', type: 'functionalityOrchestration', target: 'NotificationOrchestration', flow: 'sendReceipt' });
      expect(flow.visibility).toBe('public');
      expect(orch.getFlow('checkoutFlow')).toBe(flow);
      expect(orch.listFlows()).toHaveLength(1);

      orch.clearFlows();
      expect(orch.listFlows()).toHaveLength(0);

      expect(() => orch.flow('')).toThrow(/Flow name must be a non-empty string/);
      expect(() => orch.flow('bad').thenFunctionality('')).toThrow(/Functionality name must be a non-empty string/);
      expect(() => orch.flow('bad').thenFunctionalityOrchestration('')).toThrow(/Orchestration name must be a non-empty string/);
      expect(() => new FunctionalityOrchestration(null as any)).toThrow(/Valid descriptor/);
    });

    it('instantiates ServiceFacade as the public semantic boundary and integrates with runtime and KrnlQ queue', async () => {
      const { ServiceFacade, createServiceFacade } = await import('../services/ServiceFacade.js');
      const { FunctionalityOrchestration } = await import('../orchestration/FunctionalityOrchestration.js');

      const orch = new FunctionalityOrchestration({ id: 'AuthOrch', name: 'AuthFlow' });
      orch.flow('loginFlow').thenFunctionality('VerifyPassword').register();

      const facade = createServiceFacade({
        id: 'auth.service',
        name: 'AuthService',
        version: '1.0.0',
        description: 'Authentication Service Facade',
        functionalities: {
          VerifyPassword: { execute: vi.fn() },
        },
        functionalityOrchestrations: {
          AuthOrch: orch,
        },
        definition: {
          id: 'auth.service',
          name: 'AuthService',
          version: '1.0.0',
          state: {
            initial: { sessionCount: 0 },
          },
          operations: {
            login: {
              id: 'login',
              name: 'Login',
              handler: async (_input, ctx) => {
                return { success: true, user: 'admin' };
              },
            },
          },
        },
      });

      expect(facade.id).toBe('auth.service');
      expect(facade.name).toBe('AuthService');
      expect(facade.functionalities.VerifyPassword).toBeDefined();
      expect(facade.functionalityOrchestrations.AuthOrch).toBe(orch);
      expect(facade.getStatus()).toBe('uninitialized');

      // Test runtime lifecycle through facade
      await facade.start();
      expect(facade.getStatus()).toBe('running');

      // State access through facade
      expect(facade.getState()).toEqual({ sessionCount: 0 });
      facade.setState({ sessionCount: 1 });
      expect(facade.getState()).toEqual({ sessionCount: 1 });

      // Functionality event pub/sub through the service namespace
      const eventSpy = vi.fn();
      facade.functionalities.VerifyPassword.events.completed.subscribe(eventSpy);
      await facade.call('VerifyPassword', {});
      expect(eventSpy).toHaveBeenCalledTimes(1);

      // Operation invocation through facade (strictly routes through KrnlQ / worker context)
      const res = await facade.call('login', {});
      expect(res).toEqual({ success: true, user: 'admin' });

      // Dynamic registration
      facade.registerFunctionality('RefreshToken', { execute: vi.fn() });
      expect(facade.functionalities.RefreshToken).toBeDefined();

      const secondOrch = new FunctionalityOrchestration({ id: 'SessionOrch' });
      facade.registerFunctionalityOrchestration('SessionOrch', secondOrch);
      expect(facade.functionalityOrchestrations.SessionOrch).toBe(secondOrch);

      await facade.stop();
      expect(facade.getStatus()).toBe('stopped');
      await facade.dispose();
    });

    it('proves old Entity and application concepts are no longer the canonical API', async () => {
      const coreExports = await import('../index.js');
      expect((coreExports as any).Entity).toBeUndefined();
      expect((coreExports as any).defineApp).toBeUndefined();
      expect((coreExports as any).Protocols).toBeUndefined();
      expect(coreExports.FunctionalityOrchestration).toBeDefined();
      expect(coreExports.KrnlQueue).toBeDefined();
      expect(coreExports.KrnlWorkerPool).toBeDefined();
      expect(coreExports.WorkerExecutionBoundary).toBeDefined();
      expect(coreExports.ServiceFacade).toBeDefined();
      expect(coreExports.createServiceFacade).toBeDefined();
    });
  });
