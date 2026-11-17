import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus.js';

describe('EventBus', () => {
  it('supports subscription, delivery, and unsubscribe', () => {
    const bus = new EventBus<{ completed: { value: number } }>();
    const handler = vi.fn();

    const subscription = bus.subscribe('completed', handler);
    bus.emit('completed', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });

    subscription.unsubscribe();
    bus.emit('completed', { value: 7 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('isolates handler failures from other subscribers', () => {
    const bus = new EventBus<{ completed: number }>();
    const second = vi.fn();

    bus.subscribe('completed', () => {
      throw new Error('subscriber failure');
    });
    bus.subscribe('completed', second);

    bus.emit('completed', 1);

    expect(second).toHaveBeenCalledWith(1);
  });
});
