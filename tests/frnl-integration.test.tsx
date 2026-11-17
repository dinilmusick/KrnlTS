import { describe, expect, it, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import {
  frnlButton,
  floksFrnlStore,
  FrnlStoreProvider,
} from '../packages/ui/src/index.js';
import { createFrnlStore } from '@ultrst-armada/frnlts';

afterEach(() => cleanup());

describe('Floks FrnlTS Semantic Integration Suite', () => {
  it('registers a canonical Frnl button in the shared store', () => {
    render(React.createElement(frnlButton, { id: 'test-btn-1', label: 'Launch' }, 'Launch'));

    const entity = floksFrnlStore.getState().entities['test-btn-1'];
    expect(entity).toBeDefined();
    expect(entity.state).toBe('idle');
    expect(entity.properties.label).toBe('Launch');

    const button = screen.getByRole('button', { name: /launch/i });
    expect(button).toHaveAttribute('data-frnl-component', 'frnlButton');
    expect(button).toHaveAttribute('data-frnl-state', 'idle');
  });

  it('represents disabled, active, and loading behavior through Frnl state', () => {
    const { rerender } = render(
      React.createElement(frnlButton, {
        id: 'stateful-btn',
        label: 'Stateful',
        disabled: false,
        isActive: false,
      }, 'Stateful'),
    );

    expect(floksFrnlStore.getState().entities['stateful-btn'].state).toBe('idle');

    rerender(React.createElement(frnlButton, {
      id: 'stateful-btn',
      label: 'Stateful',
      isActive: true,
    }, 'Stateful'));
    expect(floksFrnlStore.getState().entities['stateful-btn'].state).toBe('active');

    rerender(React.createElement(frnlButton, {
      id: 'stateful-btn',
      label: 'Stateful',
      disabled: true,
    }, 'Stateful'));
    expect(floksFrnlStore.getState().entities['stateful-btn'].state).toBe('disabled');

    rerender(React.createElement(frnlButton, {
      id: 'stateful-btn',
      label: 'Stateful',
      loading: true,
    }, 'Stateful'));
    expect(floksFrnlStore.getState().entities['stateful-btn'].state).toBe('loading');
  });

  it('stores declarative button properties in the Frnl entity', () => {
    render(React.createElement(frnlButton, {
      id: 'props-btn',
      label: 'Propped',
      variant: 'accent',
      size: 'lg',
      isActive: true,
    }, 'Propped'));

    const entity = floksFrnlStore.getState().entities['props-btn'];
    expect(entity.properties.variant).toBe('accent');
    expect(entity.properties.size).toBe('lg');
    expect(entity.properties.label).toBe('Propped');
    expect(entity.properties.isActive).toBe(true);
  });

  it('routes interaction through the Frnl event boundary', () => {
    let clicked = false;
    render(React.createElement(frnlButton, {
      id: 'click-btn',
      label: 'Clickable',
      onClick: () => { clicked = true; },
    }, 'Clickable'));

    fireEvent.click(screen.getByRole('button', { name: /clickable/i }));
    expect(clicked).toBe(true);

    let disabledClicked = false;
    render(React.createElement(frnlButton, {
      id: 'disabled-click-btn',
      label: 'Disabled',
      disabled: true,
      onClick: () => { disabledClicked = true; },
    }, 'Disabled'));
    fireEvent.click(screen.getByRole('button', { name: /disabled/i }));
    expect(disabledClicked).toBe(false);
  });

  it('preserves declarative properties and runtime state across registered entities', () => {
    render(
      React.createElement('div', null,
        React.createElement(frnlButton, { id: 'one', label: 'One' }, 'One'),
        React.createElement(frnlButton, { id: 'two', label: 'Two', isActive: true }, 'Two'),
      ),
    );

    const entities = Object.values(floksFrnlStore.getState().entities);
    expect(entities.some((entity) => entity.properties.label === 'One')).toBe(true);
    expect(entities.some((entity) => entity.properties.label === 'Two' && entity.state === 'active')).toBe(true);

    for (const entity of entities) {
      expect(typeof entity.state).toBe('string');
      expect(typeof entity.properties).toBe('object');
    }
  });

  it('supports an injectable Frnl store without falling back to the global store', () => {
    const customStore = createFrnlStore();

    render(
      React.createElement(
        FrnlStoreProvider,
        { store: customStore },
        React.createElement(frnlButton, { id: 'isolated-btn', label: 'Isolated' }, 'Isolated'),
      ),
    );

    expect(customStore.getState().entities['isolated-btn']?.state).toBe('idle');
    expect(floksFrnlStore.getState().entities['isolated-btn']).toBeUndefined();
  });

  it('assigns collision-free IDs to anonymous canonical buttons', () => {
    render(
      React.createElement('div', null,
        React.createElement(frnlButton, null, 'Save'),
        React.createElement(frnlButton, null, 'Save'),
        React.createElement(frnlButton, null, 'Submit'),
      ),
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);

    const ids = buttons.map((button) => button.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);

    for (const id of ids) {
      expect(floksFrnlStore.getState().entities[id]).toBeDefined();
    }
  });
});
