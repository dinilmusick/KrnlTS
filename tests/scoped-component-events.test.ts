import { describe, expect, it } from 'vitest';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import {
  getFrnlComponentHandle,
  getFrnlEventAtPath,
} from '../src/runtime/events.js';
import { createFrnlStore } from '../src/runtime/store.js';

const definition = defineFrnlComponent({
  name: 'button',
    states: {
    idle: {
      name: 'idle',
      events: { click: { functionId: 'button.idle.click' } },
      visualParameters: { opacity: 1 },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl component scope', () => {
  it('builds a typed component handle from the registered parent hierarchy', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('page-1', {
            state: 'idle',
      properties: {},
    });
    store.getState().registerEntity('layout-1', {
            state: 'idle',
      properties: {},
    });
    store.getState().registerEntity('button-1', {
            state: 'idle',
      properties: {},
    });

    store.getState().registerComponentParent('layout-1', 'page-1');
    store.getState().registerComponentParent('button-1', 'layout-1');
    store.getState().registerComponentDefinition('button-1', definition);
    store.getState().registerEventHandlers('button-1', {
      'button.idle.click': () => 'clicked',
    });

    const handle = getFrnlComponentHandle<typeof definition>(store, 'button-1');

    expect(handle.address.path).toEqual(['page-1', 'layout-1', 'button-1']);
    expect(handle.event('click')(undefined)).toBe('clicked');
  });

  it('rejects a path that does not match the registered hierarchy', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('page-1', {
            state: 'idle',
      properties: {},
    });
    store.getState().registerEntity('button-1', {
            state: 'idle',
      properties: {},
    });
    store.getState().registerComponentParent('button-1', 'page-1');
    store.getState().registerComponentDefinition('button-1', definition);
    store.getState().registerEventHandlers('button-1', {
      'button.idle.click': () => 'clicked',
    });

    expect(() =>
      getFrnlEventAtPath(store, ['other-page', 'button-1'], 'click'),
    ).toThrow(/does not match registered scope/);
  });
});
