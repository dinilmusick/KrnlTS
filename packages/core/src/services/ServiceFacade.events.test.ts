import { describe, expect, it, vi } from 'vitest';
import { ServiceFacade } from './ServiceFacade.js';

describe('ServiceFacade functionality event bubbling', () => {
  it('exposes bubbled functionality events through the service namespace', async () => {
    const service = new ServiceFacade({
      id: 'users',
      functionalities: {
        createUser: {
          events: { userCreated: { name: 'userCreated' } },
          execute: async (input: { id: string }, context: any) => {
            context.emit('userCreated', { userId: input.id });
            return { id: input.id };
          },
        },
      },
    });

    await service.start();

    const custom = vi.fn();
    const completed = vi.fn();
    service.namespace.functionalities.createUser.events.userCreated.subscribe(custom);
    service.namespace.functionalities.createUser.events.completed.subscribe(completed);

    const result = await service.call('createUser', { id: 'u1' }, { correlationId: 'c1' });

    expect(result).toEqual({ id: 'u1' });
    expect(custom).toHaveBeenCalledWith({ userId: 'u1' });
    expect(completed).toHaveBeenCalledTimes(1);

    await service.dispose();
  });

  it('suppresses a functionality from the bubbled event namespace', () => {
    const service = new ServiceFacade({
      id: 'users',
      functionalities: {
        privateOperation: {
          bubbleEvents: false,
          execute: () => undefined,
        },
      },
    });

    expect(service.namespace.functionalities.privateOperation).toBeUndefined();
    expect(() => service.getFunctionality('privateOperation')).not.toThrow();
  });
});
