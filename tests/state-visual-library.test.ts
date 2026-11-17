import { describe, expect, it } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import { getFrnlEvent, getFrnlVisualParameters, registerFrnlLibrary, setFrnlVisualParameter } from '../src/runtime/index.js';

const definition = defineFrnlComponent({
  name: 'Button',
    states: {
    Idle: {
      name: 'Idle',
      visualParameters: { opacity: 1, scale: 1 },
      events: { click: { functionId: 'Button.Idle.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    Loading: {
      name: 'Loading',
      visualParameters: { opacity: 0.5, scale: 0.98 },
      events: { click: { functionId: 'Button.Loading.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl state-owned visuals and libraries', () => {
  it('clears surgical visual overrides whenever state changes', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    setFrnlVisualParameter(store, 'button.opacity', 0.25);
    expect(getFrnlVisualParameters(store, 'button')).toMatchObject({ opacity: 0.25, scale: 1 });
    store.getState().setEntityState('button', 'Loading');
    expect(getFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.5, scale: 0.98 });
  });

  it('exposes component libraries centrally', () => {
    const store = createFrnlStore();
    registerFrnlLibrary(store, 'Button.functions', { run: () => 'ok' });
    expect(store.getState().libraries['Button.functions']).toBeDefined();
  });

  it('gives event functions controlled access to state transitions', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    store.getState().registerEventHandlers('button', {
      'Button.Idle.click': (_payload, context) => context.setState('Loading'),
      'Button.Loading.click': () => undefined,
    });
    getFrnlEvent(store, 'button', 'click')({});
    expect(store.getState().entities.button.state).toBe('Loading');
  });

  it('allows event functions to set visual parameters and access libraries through context', () => {
    const store = createFrnlStore();
    registerFrnlLibrary(store, 'Button.functions', {
      computeOpacity: () => 0.42,
    });
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    store.getState().registerEventHandlers('button', {
      'Button.Idle.click': (_payload, context) => {
        const lib = context.getLibrary<{ computeOpacity: () => number }>('Button.functions');
        context.setVisualParameter('opacity', lib.computeOpacity());
      },
    });

    getFrnlEvent(store, 'button', 'click')({});
    expect(getFrnlVisualParameters(store, 'button').opacity).toBe(0.42);
  });
});
