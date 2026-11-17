import { describe, expect, it } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import {
  applyFrnlTheme,
  getFrnlComponentTheme,
  registerFrnlTheme,
  resolveFrnlVisualParameters,
} from '../src/runtime/themes.js';
import { getFrnlComponentHandle, getFrnlVisualParameters, setFrnlVisualParameter } from '../src/runtime/events.js';

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
    Pressed: {
      name: 'Pressed',
      visualParameters: { opacity: 0.8, scale: 0.98 },
      events: { click: { functionId: 'Button.Pressed.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl component themes', () => {
  it('applies component/state theme values over state fallbacks', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: {
          states: {
          Idle: { visualParameters: { opacity: 0.4 } },
        },
      },
    });

    applyFrnlTheme(store, 'button', 'Dark');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.4, scale: 1 });
    expect(getFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.4, scale: 1 });
    expect(getFrnlComponentTheme(store, 'button')).toBe('Dark');
  });

  it('falls back when a theme omits the component or current state', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Pressed', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });

    applyFrnlTheme(store, 'button', 'Dark');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.8, scale: 0.98 });
  });

  it('keeps the selected theme across state changes and clears surgical overrides', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: {
          states: {
          Idle: { visualParameters: { opacity: 0.4 } },
          Pressed: { visualParameters: { opacity: 0.2 } },
        },
      },
    });

    applyFrnlTheme(store, 'button', 'Dark');
    setFrnlVisualParameter(store, 'button.opacity', 0.1);
    store.getState().setEntityState('button', 'Pressed');

    expect(getFrnlComponentTheme(store, 'button')).toBe('Dark');
    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.2, scale: 0.98 });
  });

  it('clears surgical overrides when a component applies a new theme', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });
    registerFrnlTheme(store, 'Light', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.9 } } } },
    });

    applyFrnlTheme(store, 'button', 'Dark');
    setFrnlVisualParameter(store, 'button.opacity', 0.1);
    applyFrnlTheme(store, 'button', 'Light');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.9, scale: 1 });
  });

  it('falls back to state visuals when the theme omits the component entirely', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Minimal', {
      OtherComponent: { states: { Idle: { visualParameters: { opacity: 0.2 } } } },
    });

    applyFrnlTheme(store, 'button', 'Minimal');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 1, scale: 1 });
  });

  it('gives surgical instance overrides priority over theme values', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4, scale: 0.9 } } },
      },
    });

    applyFrnlTheme(store, 'button', 'Dark');
    setFrnlVisualParameter(store, 'button.opacity', 0.1);
    setFrnlVisualParameter(store, 'button.custom', 'instance');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({
      opacity: 0.1,
      scale: 0.9,
      custom: 'instance',
    });
  });

  it('rejects themes that reference unknown states for registered element definitions', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);

    expect(() => registerFrnlTheme(store, 'Invalid', {
      Button: { states: { Missing: { visualParameters: { opacity: 0.3 } } } },
    })).toThrow('references unknown state "Missing"');
    expect(store.getState().themes.Invalid).toBeUndefined();
  });

  it('rejects applying an unregistered theme', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);

    expect(() => applyFrnlTheme(store, 'button', 'Missing')).toThrow('Unknown Frnl theme');
  });

  it('rejects applying a theme to an unknown component', () => {
    const store = createFrnlStore();
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });

    expect(() => applyFrnlTheme(store, 'non-existent', 'Dark')).toThrow(
      'Unknown Frnl component: non-existent',
    );
  });

  it('rejects empty theme names and invalid theme data structures', () => {
    const store = createFrnlStore();
    expect(() => registerFrnlTheme(store, '', {})).toThrow();
    expect(() =>
      registerFrnlTheme(store, 'BadTheme', {
        Button: { invalidKey: 123 } as any,
      }),
    ).toThrow();
  });

  it('rejects element definitions registered after an incompatible theme', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });

    // Register theme referencing state "Ghost" before Button definition exists
    registerFrnlTheme(store, 'PreRegisteredInvalid', {
      Button: { states: { Ghost: { visualParameters: { opacity: 0.2 } } } },
    });

    // Attempting to register definition afterwards must validate and throw
    expect(() =>
      store.getState().registerComponentDefinition('button', definition),
    ).toThrow('references unknown state "Ghost"');
    expect(store.getState().componentDefinitions.button).toBeUndefined();
  });

  it('supports valid themes registered before element definitions', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });

    registerFrnlTheme(store, 'EarlyValid', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.35 } } } },
    });

    store.getState().registerComponentDefinition('button', definition);
    applyFrnlTheme(store, 'button', 'EarlyValid');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.35, scale: 1 });
  });

  it('allows applying themes directly through getFrnlComponentHandle', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.45 } } } },
    });

    const handle = getFrnlComponentHandle(store, 'button');
    handle.setVisualParameter('opacity', 0.99);
    expect(resolveFrnlVisualParameters(store, 'button').opacity).toBe(0.99);

    handle.applyTheme('Dark');
    expect(resolveFrnlVisualParameters(store, 'button').opacity).toBe(0.45);
    expect(getFrnlComponentTheme(store, 'button')).toBe('Dark');
  });

  it('falls back gracefully when theme omits individual parameters or visualParameters entirely', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { state: 'Idle', properties: {} });
    store.getState().registerComponentDefinition('button', definition);

    // Only overrides scale, opacity omitted
    registerFrnlTheme(store, 'ScaleOnly', {
      Button: { states: { Idle: { visualParameters: { scale: 1.4 } } } },
    });
    // States defined without visualParameters
    registerFrnlTheme(store, 'EmptyState', {
      Button: { states: { Idle: {} } },
    });

    applyFrnlTheme(store, 'button', 'ScaleOnly');
    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 1, scale: 1.4 });

    applyFrnlTheme(store, 'button', 'EmptyState');
    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 1, scale: 1 });
  });
});
