import React from 'react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import type { UIAuthoringSession } from './types.js';
import { UiAuthoringPreview } from './UiAuthoringPreview.js';
import { UiAuthoringValidationPanel } from './UiAuthoringValidationPanel.js';

const session: UIAuthoringSession = {
  sessionId: 'preview-session',
  context: 'general-component',
  metadata: {},
  operations: [],
  bindings: [],
  nodes: [
    { id: 'page', kind: 'page', name: 'Page', props: {} },
    { id: 'section', kind: 'section', name: 'Section', parentId: 'page', props: {} },
    { id: 'root', kind: 'component', name: 'Panel', componentId: 'floks.panel', parentId: 'section', props: {}, slots: { content: ['child'] } },
    { id: 'child', kind: 'component', name: 'Save', componentId: 'floks.button', parentId: 'root', props: {} },
  ],
};

describe('reusable authoring UI primitives', () => {
  it('renders component slot contents through the supplied component renderer', () => {
    render(
      <UiAuthoringPreview
        session={session}
        renderComponent={(node, slots) => (
          <div data-testid={node.id}>
            {node.name}
            {Object.values(slots).flat()}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId('root')).toHaveTextContent('Panel');
    expect(screen.getByTestId('root')).toContainElement(screen.getByTestId('child'));
  });

  it('shows validation errors and disables generation until valid', () => {
    render(
      <UiAuthoringValidationPanel
        status="Needs correction"
        validation={{ valid: false, errors: ['Missing component asset'], warnings: ['No operations configured'] }}
        onGenerate={() => undefined}
      />,
    );
    expect(screen.getByText('Missing component asset')).toBeInTheDocument();
    expect(screen.getByText('No operations configured')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });
});


it('ignores stale slot references instead of crashing the preview', () => {
  const malformedSession: UIAuthoringSession = {
    ...session,
    nodes: session.nodes.map((node) => node.id === 'root'
      ? { ...node, slots: { content: ['missing-child'] } }
      : node),
  };
  render(
    <UiAuthoringPreview
      session={malformedSession}
      renderComponent={(node, slots) => <div data-testid={node.id}>{node.name}{Object.values(slots).flat()}</div>}
    />,
  );
  expect(screen.getByTestId('root')).toHaveTextContent('Panel');
  expect(screen.queryByTestId('missing-child')).not.toBeInTheDocument();
});
