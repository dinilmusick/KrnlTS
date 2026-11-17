import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';
import { getFrnlEvent } from '../src/runtime/events.js';
import { createFrnlStore } from '../src/runtime/store.js';
import { useFrnlComponent } from '../src/react/useFrnlComponent.js';

afterEach(cleanup);

const phases = { sustainPhase: { visualDefinition: { parameters: {} } } };
const buttonDefinition = defineFrnlComponent({
  name: 'button',
  states: {
    idle: { name: 'idle', events: { click: { functionId: 'button.idle.click' } }, visualParameters: { opacity: 1 }, phases },
    loading: { name: 'loading', events: { click: { functionId: 'button.loading.click' } }, visualParameters: { opacity: 0.5 }, phases },
  },
});

let latestFrnl: ReturnType<typeof useFrnlComponent> | undefined;

function TestButton({ store }: { store: ReturnType<typeof createFrnlStore> }) {
  const frnl = useFrnlComponent({
    id: 'button-1',
    definition: buttonDefinition,
    store,
    state: 'idle',
    handlers: {
      'button.idle.click': () => {
        store.getState().setEntityState('button-1', 'loading');
        return 'idle-clicked';
      },
      'button.loading.click': () => 'loading-clicked',
    },
  });

  latestFrnl = frnl;

  return (
    <button data-testid="button" data-state={frnl.state} data-opacity={String(frnl.visualParameters.opacity)} onClick={() => frnl.events.click(undefined)}>
      Click
    </button>
  );
}

describe('direct Frnl React components', () => {
  it('attaches Frnl state and addressable events directly to the React component', () => {
    const store = createFrnlStore();
    render(<TestButton store={store} />);

    expect(screen.getByTestId('button')).toHaveAttribute('data-state', 'idle');

    act(() => {
      screen.getByTestId('button').click();
    });

    expect(store.getState().entities['button-1']?.state).toBe('loading');
  });

  it('resolves the same component event against the current Frnl state', () => {
    const store = createFrnlStore();
    render(<TestButton store={store} />);

    act(() => {
      getFrnlEvent(store, 'button-1', 'click')(undefined);
    });
    expect(store.getState().entities['button-1']?.state).toBe('loading');

    let result: unknown;
    act(() => {
      result = getFrnlEvent(store, 'button-1', 'click')(undefined);
    });
    expect(result).toBe('loading-clicked');
  });

  it('allows another UI element or application code to trigger the same Frnl event without knowing its implementation', () => {
    const store = createFrnlStore();
    render(<TestButton store={store} />);

    const click = getFrnlEvent(store, 'button-1', 'click');

    expect(typeof click).toBe('function');
    act(() => {
      click(undefined);
    });

    expect(store.getState().entities['button-1']?.state).toBe('loading');
  });

  it('rerenders when a component theme is applied and resolves themed visual parameters', () => {
    const store = createFrnlStore();
    render(<TestButton store={store} />);

    act(() => {
      store.getState().registerTheme('Dark', {
        button: { states: { idle: { visualParameters: { opacity: 0.25 } } } },
      });
      store.getState().registerTheme('Light', {
        button: { states: { idle: { visualParameters: { opacity: 0.75 } } } },
      });
      latestFrnl?.applyTheme('Dark');
    });

    expect(screen.getByTestId('button')).toHaveAttribute('data-state', 'idle');
    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.25');
    expect(store.getState().componentThemes['button-1']).toBe('Dark');

    act(() => {
      latestFrnl?.applyTheme('Light');
    });

    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.75');
    expect(store.getState().componentThemes['button-1']).toBe('Light');
  });

  it('cleans up runtime entity, definition, handlers, visual overrides, and theme selection on unmount', () => {
    const store = createFrnlStore();
    const { unmount } = render(<TestButton store={store} />);

    expect(store.getState().entities['button-1']).toBeDefined();
    expect(store.getState().componentDefinitions['button-1']).toBeDefined();
    expect(store.getState().eventHandlers['button-1']).toBeDefined();

    act(() => {
      store.getState().registerTheme('Dark', {
        button: { states: { idle: { visualParameters: { opacity: 0.25 } } } },
      });
      latestFrnl?.applyTheme('Dark');
      store.getState().setVisualOverride('button-1', 'opacity', 0.2);
    });

    expect(store.getState().componentThemes['button-1']).toBe('Dark');
    expect(store.getState().visualOverrides['button-1']?.opacity).toBe(0.2);

    act(() => {
      unmount();
    });

    expect(store.getState().entities['button-1']).toBeUndefined();
    expect(store.getState().componentDefinitions['button-1']).toBeUndefined();
    expect(store.getState().eventHandlers['button-1']).toBeUndefined();
    expect(store.getState().visualOverrides['button-1']).toBeUndefined();
    expect(store.getState().componentParents['button-1']).toBeUndefined();
    expect(store.getState().componentThemes['button-1']).toBeUndefined();
  });

  it('clears surgical overrides and rerenders when switching themes and states', () => {
    const store = createFrnlStore();
    render(<TestButton store={store} />);

    act(() => {
      store.getState().registerTheme('Dark', {
        button: {
          states: {
            idle: { visualParameters: { opacity: 0.25 } },
            loading: { visualParameters: { opacity: 0.1 } },
          },
        },
      });
      store.getState().registerTheme('Light', {
        button: {
          states: {
            idle: { visualParameters: { opacity: 0.75 } },
            loading: { visualParameters: { opacity: 0.5 } },
          },
        },
      });
      latestFrnl?.applyTheme('Dark');
    });

    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.25');

    // Surgical override takes precedence over theme
    act(() => {
      store.getState().setVisualOverride('button-1', 'opacity', 0.99);
    });
    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.99');

    // Switching theme clears surgical override and rerenders with new theme value
    act(() => {
      latestFrnl?.applyTheme('Light');
    });
    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.75');

    // Transitioning state preserves selected theme and clears any new surgical override
    act(() => {
      store.getState().setVisualOverride('button-1', 'opacity', 0.88);
    });
    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.88');

    act(() => {
      screen.getByTestId('button').click();
    });
    expect(screen.getByTestId('button')).toHaveAttribute('data-state', 'loading');
    expect(screen.getByTestId('button')).toHaveAttribute('data-opacity', '0.5');
    expect(store.getState().componentThemes['button-1']).toBe('Light');
  });
});
