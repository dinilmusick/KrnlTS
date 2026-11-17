import { describe, expect, it, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import {
  frnlButton,
  frnlTextInput,
  frnlSelect,
  frnlToggle,
  frnlSlider,
  frnlBadge,
  frnlTabWindow,
  frnlTopBar,
  frnlBottomBar,
  frnlPage,
  floksFrnlStore,
  FrnlStoreProvider,
} from '../packages/ui/src/index.js';
import {
  createFrnlStore,
  defineFrnlComponent,
  registerFrnlComponent,
  invokeFrnlEvent,
  type FrnlOrchestrationContext,
} from '@ultrst-armada/frnlts';

afterEach(() => {
  cleanup();
});

it('8. frnlPage mounts supplied page orchestrations and cleans them up', async () => {
  const store = createFrnlStore({
    entities: {
      source: { state: 'idle', properties: {} },
      target: { state: 'idle', properties: {} },
    },
  });
  const definition = defineFrnlComponent({
    name: 'Source',
    states: {
      idle: {
        name: 'idle',
        events: { trigger: { functionId: 'Source.idle.trigger' } },
        visualParameters: {},
        phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
      },
    },
  });
  registerFrnlComponent(store, 'source', definition);
  registerFrnlComponent(store, 'target', definition);
  const calls: string[] = [];
  store.getState().registerEventHandlers('source', {
    'Source.idle.trigger': () => 'payload',
  });
  store.getState().registerEventHandlers('target', {
    'Source.idle.trigger': (payload) => {
      calls.push(String(payload));
    },
  });

  const orchestration = {
    id: 'home.SourceToTarget',
    name: 'SourceToTarget',
    setup: ({ onEvent, event }: FrnlOrchestrationContext) =>
      onEvent('source', 'trigger', ({ result }) => event('target', 'trigger')(result)),
  };

  render(
    React.createElement(
      FrnlStoreProvider,
      { store },
      React.createElement(frnlPage, { orchestrations: [orchestration] }, <div>Page</div>),
    ),
  );

  await act(async () => {
    await invokeFrnlEvent(store, 'source', 'trigger', undefined);
  });
  expect(calls).toEqual(['payload']);
});
 
describe('Floks Canonical frnl* Component Suite', () => {
  // ── 1. frnlButton ──
  it('1. frnlButton registers in Frnl store, reacts to click, and handles hover inspection', () => {
    let clicked = false;
    render(
      React.createElement(frnlButton, {
        id: 'canonical-btn',
        label: 'Submit Action',
        description: 'Submits user payload',
        onClick: () => {
          clicked = true;
        },
      })
    );

    const entity = floksFrnlStore.getState().entities['canonical-btn'];
    expect(entity).toBeDefined();
    expect(entity.state).toBe('idle');
    expect(entity.properties.label).toBe('Submit Action');

    const btn = screen.getByRole('button', { name: /submit action/i });
    expect(btn).toHaveAttribute('data-frnl-component', 'frnlButton');

    fireEvent.click(btn);
    expect(clicked).toBe(true);
  });

  // ── 2. frnlTextInput ──
  it('2. frnlTextInput renders with label, manages change events, and registers state', () => {
    let text = '';
    render(
      React.createElement(frnlTextInput, {
        id: 'test-input',
        label: 'Username',
        value: text,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          text = e.target.value;
        },
      })
    );

    const entity = floksFrnlStore.getState().entities['test-input'];
    expect(entity).toBeDefined();
    expect(entity.state).toBe('idle');

    const input = screen.getByLabelText(/username/i);
    expect(input).toHaveAttribute('data-frnl-component', 'frnlTextInput');
  });

  // ── 3. frnlSelect, frnlToggle, frnlSlider, frnlBadge ──
  it('3. frnlSelect, frnlToggle, frnlSlider, frnlBadge render correctly', () => {
    let toggled = false;
    render(
      React.createElement(
        'div',
        null,
        React.createElement(frnlToggle, {
          id: 'test-toggle',
          checked: false,
          label: 'Mute Audio',
          onChange: (val) => {
            toggled = val;
          },
        }),
        React.createElement(frnlSelect, {
          id: 'test-select',
          label: 'Mode',
          options: [
            { value: 'dev', label: 'Development' },
            { value: 'prod', label: 'Production' },
          ],
        }),
        React.createElement(frnlSlider, {
          id: 'test-slider',
          value: 50,
          label: 'Volume',
          onChange: () => {},
        }),
        React.createElement(frnlBadge, { variant: 'accent' }, 'Online')
      )
    );

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(toggled).toBe(true);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  // ── 4. frnlTabWindow ──
  it('4. frnlTabWindow switches active tabs properly', () => {
    let activeTab = 'tab-1';
    render(
      React.createElement(frnlTabWindow, {
        tabs: [
          { id: 'tab-1', label: 'Overview', content: <div>Overview Content</div> },
          { id: 'tab-2', label: 'Metrics', content: <div>Metrics Content</div> },
        ],
        activeTabId: activeTab,
        onTabChange: (id) => {
          activeTab = id;
        },
      })
    );

    expect(screen.getByText('Overview Content')).toBeInTheDocument();
    const tab2 = screen.getByRole('tab', { name: /metrics/i });
    fireEvent.click(tab2);
    expect(activeTab).toBe('tab-2');
  });

  // ── 5. frnlTopBar (Icons-Only Tabs & Profile) ──
  it('5. frnlTopBar renders breadcrumbs, icon-only tabs, and profile dropdown with logout', () => {
    let loggedOut = false;
    render(
      React.createElement(frnlTopBar, {
        appName: 'TestApp',
        breadcrumbs: [{ label: 'Workspaces' }, { label: 'Primary' }],
        tabs: [
          { id: 't1', label: 'Canvas', icon: <span>🎨</span> },
          { id: 't2', label: 'Settings', icon: <span>⚙️</span> },
        ],
        activeTabId: 't1',
        user: { name: 'Dinil', username: 'dinil', email: 'dinil@test.local', avatarGlyph: '👑' },
        onLogout: () => {
          loggedOut = true;
        },
      })
    );

    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();

    // Tabs in top bar must be icon-only buttons
    const tabBtn = screen.getByRole('tab', { name: /canvas/i });
    expect(tabBtn).toBeInTheDocument();

    // Open profile
    const profileBtn = screen.getByLabelText(/user profile/i);
    fireEvent.click(profileBtn);

    const signOutBtn = screen.getByText(/sign out/i);
    expect(signOutBtn).toBeInTheDocument();
    fireEvent.click(signOutBtn);
    expect(loggedOut).toBe(true);
  });

  // ── 6. frnlBottomBar ──
  it('6. frnlBottomBar renders auto-save toggle, manual save, and API toggle', () => {
    let saved = false;
    render(
      React.createElement(frnlBottomBar, {
        onManualSave: () => {
          saved = true;
        },
      })
    );

    const saveBtn = screen.getByRole('button', { name: /save now/i });
    fireEvent.click(saveBtn);
    expect(saved).toBe(true);

    const autoBtn = screen.getByRole('button', { name: /toggle auto save/i });
    expect(autoBtn).toBeInTheDocument();

    const apiBtn = screen.getByRole('button', { name: /api requests/i });
    expect(apiBtn).toBeInTheDocument();
  });

  // ── 7. frnlPage Canonical Base Page ──
  it('7. frnlPage integrates frnlTopBar and frnlBottomBar by default and supports disabling them', () => {
    const { rerender } = render(
      React.createElement(
        frnlPage,
        {
          appName: 'Skipo Canonical',
          showTopBar: true,
          showBottomBar: true,
        },
        <div data-testid="page-child">Application Main Body</div>
      )
    );

    expect(screen.getByTestId('page-child')).toBeInTheDocument();
    expect(screen.getByTestId('frnl-bottom-strip-center')).toBeInTheDocument();

    // Can disable top and bottom bars via props
    rerender(
      React.createElement(
        frnlPage,
        {
          appName: 'Skipo Canonical',
          showTopBar: false,
          showBottomBar: false,
        },
        <div data-testid="page-child">Application Main Body</div>
      )
    );

    expect(screen.queryByTestId('frnl-bottom-strip-center')).not.toBeInTheDocument();
  });
});
