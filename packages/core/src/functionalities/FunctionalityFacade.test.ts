import { describe, expect, it, vi } from 'vitest';
import { FunctionalityFacade } from './FunctionalityFacade.js';

describe('FunctionalityFacade events', () => {
  it('provides default lifecycle events and custom events', async () => {
    const functionality = new FunctionalityFacade<
      { id: string },
      { ok: true },
      Record<string, unknown>,
      { userCreated: { userId: string } }
    >('createUser', {
      events: {
        userCreated: { name: 'userCreated' },
      },
      execute: async (_input, context) => {
        context.emit('userCreated', { userId: 'u1' });
        return { ok: true };
      },
    });

    const triggered = vi.fn();
    const completed = vi.fn();
    const custom = vi.fn();

    functionality.events.triggered.subscribe(triggered);
    functionality.events.completed.subscribe(completed);
    functionality.events.userCreated.subscribe(custom);

    functionality.emit('triggered', {
      serviceId: 'users',
      functionalityId: 'createUser',
      functionalityName: 'createUser',
      timestamp: 1,
    });

    await functionality.execute(
      { id: 'u1' },
      {
        serviceId: 'users',
        functionalityId: 'createUser',
        correlationId: 'c1',
        state: {},
      }
    );

    functionality.emit('completed', {
      serviceId: 'users',
      functionalityId: 'createUser',
      functionalityName: 'createUser',
      correlationId: 'c1',
      timestamp: 2,
      output: { ok: true },
    });

    expect(triggered).toHaveBeenCalledTimes(1);
    expect(custom).toHaveBeenCalledWith({ userId: 'u1' });
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('defaults event bubbling on and permits explicit suppression', () => {
    const visible = new FunctionalityFacade('visible', { execute: () => undefined });
    const hidden = new FunctionalityFacade('hidden', { execute: () => undefined, bubbleEvents: false });

    expect(visible.bubbleEvents).toBe(true);
    expect(hidden.bubbleEvents).toBe(false);
  });

  it('rejects custom lifecycle event names', () => {
    expect(() =>
      new FunctionalityFacade('invalid', {
        events: { completed: { name: 'completed' } },
        execute: () => undefined,
      })
    ).toThrow(/reserved/);
  });
});
