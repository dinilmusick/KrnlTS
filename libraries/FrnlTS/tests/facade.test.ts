import { describe, expect, it } from 'vitest';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import { createFrnlFacade, createFrnlStore, getFrnlVisualParameters } from '../src/runtime/index.js';

const testDefinition = defineFrnlComponent({
  name: 'Button',
    states: {
    Idle: {
      name: 'Idle',
      visualParameters: { opacity: 1 },
      events: { click: { functionId: 'Button.Idle.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    Active: {
      name: 'Active',
      visualParameters: { opacity: 0.8 },
      events: { click: { functionId: 'Button.Active.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl facade', () => {
  it('provides central access to registered libraries and component events', () => {
    const store = createFrnlStore();
    store.getState().registerLibrary('Button.functions', { run: () => 'ok' });
    const facade = createFrnlFacade(store);
    expect(facade.library<{ run: () => string }>('Button.functions').run()).toBe('ok');
  });

  it('applies a theme through the component handle and aggregates the same operation across components', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('btn-1', { state: 'Idle', properties: {} });
    store.getState().registerEntity('btn-2', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('btn-1', testDefinition);
    store.getState().registerComponentDefinition('btn-2', testDefinition);

    const facade = createFrnlFacade(store);
    facade.registerTheme('Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });

    facade.component('btn-1').applyTheme('Dark');
    expect(getFrnlVisualParameters(store, 'btn-1').opacity).toBe(0.4);

    facade.component('btn-2').setVisualParameter('opacity', 0.1);
    expect(getFrnlVisualParameters(store, 'btn-2').opacity).toBe(0.1);

    facade.applyThemeToAllComponents('Dark');
    expect(getFrnlVisualParameters(store, 'btn-1').opacity).toBe(0.4);
    expect(getFrnlVisualParameters(store, 'btn-2').opacity).toBe(0.4);
    expect(store.getState().componentThemes).toMatchObject({ 'btn-1': 'Dark', 'btn-2': 'Dark' });
  });

  it('rejects batch theme application if the theme is unregistered', () => {
    const store = createFrnlStore();
    const facade = createFrnlFacade(store);
    expect(() => facade.applyThemeToAllComponents('MissingTheme')).toThrow('Unknown Frnl theme: MissingTheme');
  });

  it('aggregates theme application across multiple different component types and clears overrides', () => {
    const store = createFrnlStore();
    const badgeDefinition = defineFrnlComponent({
      name: 'Badge',
    states: {
        Default: {
          name: 'Default',
          visualParameters: { background: 'white', size: 12 },
          events: {},
          phases: {
            attackPhase: { visualDefinition: { parameters: {} } },
            sustainPhase: { visualDefinition: { parameters: {} } },
            releasePhase: { visualDefinition: { parameters: {} } },
          },
        },
      },
    });

    store.getState().registerEntity('btn-1', { state: 'Idle', properties: {} });
    store.getState().registerEntity('badge-1', { state: 'Default', properties: {} });
    store.getState().registerEntity('card-1', { state: 'Idle', properties: {} });

    store.getState().registerComponentDefinition('btn-1', testDefinition);
    store.getState().registerComponentDefinition('badge-1', badgeDefinition);
    store.getState().registerComponentDefinition('card-1', testDefinition);

    const facade = createFrnlFacade(store);
    facade.registerTheme('Contrast', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.3 } } } },
      Badge: { states: { Default: { visualParameters: { background: 'black' } } } },
    });

    // Apply surgical override before batch
    facade.component('btn-1').setVisualParameter('opacity', 0.05);
    facade.component('badge-1').setVisualParameter('size', 20);
    expect(getFrnlVisualParameters(store, 'btn-1').opacity).toBe(0.05);
    expect(getFrnlVisualParameters(store, 'badge-1').size).toBe(20);

    facade.applyThemeToAllComponents('Contrast');

    // btn-1 has themed opacity, override cleared
    expect(getFrnlVisualParameters(store, 'btn-1')).toEqual({ opacity: 0.3 });
    // badge-1 has themed background, override on size cleared, size falls back to state default 12
    expect(getFrnlVisualParameters(store, 'badge-1')).toEqual({ background: 'black', size: 12 });
    // card-1 has testDefinition (Button) which gets themed opacity: 0.3
    expect(getFrnlVisualParameters(store, 'card-1')).toEqual({ opacity: 0.3 });
    expect(store.getState().componentThemes).toEqual({
      'btn-1': 'Contrast',
      'badge-1': 'Contrast',
      'card-1': 'Contrast',
    });
  });

  it('provides component handles, event triggers, and scoped visual parameter mutation', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('btn-1', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('btn-1', testDefinition);
    store.getState().registerEventHandlers('btn-1', {
      'Button.Idle.click': (_payload, context) => {
        context.setState('Active');
        return 'transitioned';
      },
      'Button.Active.click': () => 'already-active',
    });

    const facade = createFrnlFacade(store);

    // Test facade.component
    const handle = facade.component('btn-1');
    expect(handle.address.componentId).toBe('btn-1');

    // Test facade.event
    const trigger = facade.event('btn-1', 'click');
    const result = trigger();
    expect(result).toBe('transitioned');
    expect(store.getState().entities['btn-1'].state).toBe('Active');

    // Test facade.setVisualParameter
    facade.setVisualParameter('btn-1.scale', 1.05);
    expect(getFrnlVisualParameters(store, 'btn-1').scale).toBe(1.05);
  });
});
