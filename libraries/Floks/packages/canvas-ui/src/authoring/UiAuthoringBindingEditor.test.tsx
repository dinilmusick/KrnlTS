import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { UIAuthoringSession } from './types.js';
import { UiAuthoringBindingEditor } from './UiAuthoringBindingEditor.js';

const session: UIAuthoringSession = {
  sessionId: 'binding-test',
  context: 'service',
  nodes: [{ id: 'input', kind: 'component', name: 'Email', props: {}, assetRef: {
    packageId: '@ultrst-armada/floks', packageVersion: '^1.5.0', exportPath: 'ui', assetId: 'floks.input.text', assetVersion: '1.0.0',
  }}],
  bindings: [],
  operations: [{ operationId: 'submit', name: 'Submit', inputFields: [
    { name: 'email', type: 'email' }, { name: 'displayName', type: 'string' },
  ], outputFields: [{ name: 'message', type: 'string' }] }],
  metadata: { serviceId: 'account' },
};

describe('UiAuthoringBindingEditor', () => {
  it('creates a typed binding for the selected operation field', () => {
    const onChange = vi.fn();
    render(<UiAuthoringBindingEditor session={session} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'input' } });
    fireEvent.change(selects[1], { target: { value: 'submit' } });
    fireEvent.change(selects[3], { target: { value: 'displayName' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add / replace' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].bindings).toEqual([{
      componentId: 'input',
      property: 'value',
      target: { kind: 'api-input', apiId: 'submit', field: 'displayName', fieldType: 'string' },
    }]);
  });
});
