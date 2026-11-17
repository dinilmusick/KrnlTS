import { describe, expect, it, vi } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import { registerFrnlComponent, invokeFrnlEvent } from '../src/runtime/events.js';
import {
  defineFrnlOrchestration,
  mountFrnlOrchestration,
} from '../src/runtime/orchestration.js';

const definition = defineFrnlComponent({
  name: 'Button',
  states: {
    Idle: {
      name: 'Idle',
      events: { Click: { functionId: 'Button.Idle.Click' } },
      visualParameters: {},
      phases: {
        sustainPhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl orchestration runtime', () => {
  it('chains a component event into another component event', async () => {
    const store = createFrnlStore({
      entities: {
        buttonA: { state: 'Idle', properties: {} },
        buttonB: { state: 'Idle', properties: {} },
      },
    });
    registerFrnlComponent(store, 'buttonA', definition);
    registerFrnlComponent(store, 'buttonB', definition);

    const calls: string[] = [];
    store.getState().registerEventHandlers('buttonA', {
      'Button.Idle.Click': () => {
        calls.push('A');
        return 'from-A';
      },
    });
    store.getState().registerEventHandlers('buttonB', {
      'Button.Idle.Click': (payload) => {
        calls.push(String(payload));
        return payload;
      },
    });

    const orchestration = defineFrnlOrchestration({
      id: 'page.button-chain',
      name: 'ButtonChain',
      setup: ({ onEvent, event }) =>
        onEvent('buttonA', 'Click', async ({ result }) => {
          await event('buttonB', 'Click')(result);
        }),
    });

    const cleanup = mountFrnlOrchestration(store, orchestration);
    await invokeFrnlEvent(store, 'buttonA', 'Click', undefined);
    expect(calls).toEqual(['A', 'from-A']);
    cleanup();
  });

  it('removes subscriptions when orchestration is cleaned up', async () => {
    const store = createFrnlStore({
      entities: { buttonA: { state: 'Idle', properties: {} } },
    });
    registerFrnlComponent(store, 'buttonA', definition);
    const listener = vi.fn();
    store.getState().registerEventHandlers('buttonA', {
      'Button.Idle.Click': () => 1,
    });

    const orchestration = defineFrnlOrchestration({
      id: 'page.cleanup',
      name: 'Cleanup',
      setup: ({ onEvent }) => onEvent('buttonA', 'Click', listener),
    });

    const cleanup = mountFrnlOrchestration(store, orchestration);
    await invokeFrnlEvent(store, 'buttonA', 'Click', undefined);
    cleanup();
    await invokeFrnlEvent(store, 'buttonA', 'Click', undefined);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
