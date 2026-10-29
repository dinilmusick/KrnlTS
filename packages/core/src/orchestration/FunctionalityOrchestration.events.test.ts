import { describe, expect, it, vi } from 'vitest';
import { FunctionalityOrchestration } from './FunctionalityOrchestration.js';
import { ServiceFacade } from '../services/ServiceFacade.js';

describe('FunctionalityOrchestration lifecycle events', () => {
  it('emits triggered and completed and exposes them through the service namespace', async () => {
    const orchestration = new FunctionalityOrchestration({
      id: 'signup',
      name: 'signup',
    });
    orchestration.thenFunctionality('createUser');

    const service = new ServiceFacade({
      id: 'auth',
      functionalities: {
        createUser: {
          execute: async () => ({ id: 'u1' }),
        },
      },
      functionalityOrchestrations: {
        signup: orchestration,
      },
    });

    await service.start();

    const triggered = vi.fn();
    const completed = vi.fn();
    service.namespace.functionalityOrchestrations.signup.events.triggered.subscribe(triggered);
    service.namespace.functionalityOrchestrations.signup.events.completed.subscribe(completed);

    const result = await service.orchestrate('signup', {});

    expect(result.status).toBe('COMPLETED');
    expect(triggered).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);

    await service.dispose();
  });

  it('supports orchestration event bubbling suppression', () => {
    const orchestration = new FunctionalityOrchestration({
      id: 'privateFlow',
      bubbleEvents: false,
    });

    const service = new ServiceFacade({
      id: 'auth',
      functionalityOrchestrations: { privateFlow: orchestration },
    });

    expect(service.namespace.functionalityOrchestrations.privateFlow).toBeUndefined();
  });
});
