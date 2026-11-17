import { describe, expect, it, vi } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { createFrnlFrontendApi, installFrnlFrontendApi } from '../src/runtime/frontend-api.js';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import { createFrnlDomMeasurementAdapter } from '../src/runtime/measurement.js';

const buttonDefinition = defineFrnlComponent({
  name: 'Button',
  states: {
    idle: {
      name: 'idle',
      events: { click: { functionId: 'click' }, hover: { functionId: 'hover' } },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
      visualParameters: {},
    },
    active: {
      name: 'active',
      events: { click: { functionId: 'click' } },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
      visualParameters: {},
    },
  },
});

describe('Frnl frontend API', () => {
  it('exposes rendered components, properties, state and generated controls', () => {
    const store = createFrnlStore();
    const click = vi.fn();
    store.getState().registerEntity('create', {
      state: 'idle',
      properties: { label: 'Create Service', disabled: false },
    });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    store.getState().registerEventHandlers('create', { click });

    const api = createFrnlFrontendApi(store, { applicationId: 'demo', route: '/workspace' });
    const snapshot = api.inspect();

    expect(snapshot.componentCount).toBe(1);
    expect(snapshot.application).toEqual({ id: 'demo', route: '/workspace' });
    expect(snapshot.components[0].rendered).toBe(true);
    expect(snapshot.components[0].lifecycle.mounted).toBe(true);
    expect(snapshot.components[0].lifecycle.rendered).toBe(true);
    expect(snapshot.components[0].properties.label).toBe('Create Service');
    expect(snapshot.components[0].controls.click.available).toBe(true);
    expect(snapshot.components[0].controls.hover.available).toBe(false); // No handler registered
    expect(snapshot.components[0].realized.mounted).toBe(true);
    expect(snapshot.components[0].realized.visible).toBe(true);
  });

  it('correctly distinguishes non-existent, unmounted, and mounted components', () => {
    const store = createFrnlStore();
    const api = createFrnlFrontendApi(store);

    // 1. Non-existent component
    expect(() => api.inspectComponent('nonexistent')).toThrow(/Unknown Frnl component/);

    // 2. Component definition registered but unmounted
    store.getState().registerComponentDefinition('unmounted-btn', buttonDefinition);
    const unmountedSnap = api.inspectComponent('unmounted-btn');
    expect(unmountedSnap.id).toBe('unmounted-btn');
    expect(unmountedSnap.rendered).toBe(false);
    expect(unmountedSnap.lifecycle.mounted).toBe(false);
    expect(unmountedSnap.lifecycle.rendered).toBe(false);
    expect(unmountedSnap.controls.click.available).toBe(false);
    expect(() => unmountedSnap.controls.click.invoke()).toThrow(/unavailable/);

    // 3. Component registered in state without definition (e.g. from Floks store)
    store.getState().registerEntity('entity-only', {
      state: 'idle',
      properties: { label: 'Entity Only', type: 'CustomTile' },
    });
    const entitySnap = api.inspectComponent('entity-only');
    expect(entitySnap.id).toBe('entity-only');
    expect(entitySnap.type).toBe('CustomTile');
    expect(entitySnap.rendered).toBe(true);
    expect(entitySnap.lifecycle.mounted).toBe(true);
    expect(entitySnap.controls.setState.available).toBe(true);

    // Appears in inspect()
    const all = api.inspect();
    expect(all.components.some((c) => c.id === 'entity-only')).toBe(true);
    expect(all.components.some((c) => c.id === 'unmounted-btn')).toBe(true);
  });

  it('invokes component controls without application-authored API glue', () => {
    const store = createFrnlStore();
    const click = vi.fn();
    store.getState().registerEntity('create', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    store.getState().registerEventHandlers('create', { click });

    const api = createFrnlFrontendApi(store);

    // Direct invocation
    api.invoke('create', 'click', { timestamp: 123 });
    expect(click).toHaveBeenCalledTimes(1);

    // Component-scoped invocation
    api.component('create').invoke('click', { timestamp: 456 });
    expect(click).toHaveBeenCalledTimes(2);

    // Generic setState control
    api.component('create').invoke('setState', 'active');
    expect(store.getState().entities['create'].state).toBe('active');

    // Generic setVisualParameter control
    api.invoke('create', 'setVisualParameter', { parameter: 'opacity', value: 0.8 });
    expect(store.getState().visualOverrides['create']?.opacity).toBe(0.8);
  });

  it('returns hierarchical component paths and children', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('page', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('page', buttonDefinition);
    store.getState().registerEntity('create', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    store.getState().registerComponentParent('create', 'page');

    const api = createFrnlFrontendApi(store);
    const page = api.inspectComponent('page');
    const child = api.inspectComponent('create');

    expect(page.children).toEqual(['create']);
    expect(child.path).toEqual(['page', 'create']);
    expect(api.inspect().tree.map((item) => item.id)).toEqual(['page']);
  });

  it('supports reactive subscriptions and an optional DOM realization adapter', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('create', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    const api = createFrnlFrontendApi(store, {
      measurementAdapter: createFrnlDomMeasurementAdapter(),
    });
    const states: string[] = [];
    const unsubscribe = api.subscribe((snapshot) => states.push(snapshot.components[0]?.state ?? 'missing'));
    store.getState().setEntityState('create', 'active');
    expect(states).toContain('active');
    unsubscribe();
    api.dispose();
  });

  it('supports a custom realization adapter without making it semantic authority', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('create', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    const api = createFrnlFrontendApi(store, {
      measurementAdapter: {
        measure: () => ({ mounted: true, visible: false, geometry: { x: 10, y: 20, width: 100, height: 40 } }),
      },
    });
    const snapshot = api.inspectComponent('create');
    expect(snapshot.state).toBe('idle');
    expect(snapshot.realized.visible).toBe(false);
    expect(snapshot.realized.geometry).toEqual({ x: 10, y: 20, width: 100, height: 40 });
    api.dispose();
  });

  it('installs global API and handles disposal', () => {
    const store = createFrnlStore();
    const api = createFrnlFrontendApi(store);
    installFrnlFrontendApi(api, '__FRNL_TEST_API__');

    expect((globalThis as any).__FRNL_TEST_API__).toBe(api);

    // Dispose unregisters listener
    expect(() => api.dispose()).not.toThrow();
  });
});
