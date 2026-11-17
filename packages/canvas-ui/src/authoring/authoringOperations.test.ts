import { describe, expect, it } from 'vitest';
import {
  addAuthoringNode,
  bindAuthoringProperty,
  createAuthoringSession,
  removeAuthoringNode,
  setAuthoringOperations,
  updateAuthoringNode,
} from './authoringOperations.js';

describe('authoringOperations', () => {
  it('creates and mutates a session without React rendering', () => {
    let session = createAuthoringSession({
      sessionId: 'session-1',
      context: 'application',
    });

    session = addAuthoringNode(session, { id: 'page-1', kind: 'page', name: 'Home' });
    session = addAuthoringNode(session, { id: 'section-1', kind: 'section', parentId: 'page-1' });
    session = addAuthoringNode(session, {
      id: 'button-1',
      kind: 'component',
      componentId: 'floks.button',
      parentId: 'section-1',
      props: { disabled: false },
    });

    expect(session.nodes).toHaveLength(3);
    expect(session.nodes[2].parentId).toBe('section-1');

    session = updateAuthoringNode(session, 'button-1', {
      props: { disabled: true, label: 'Create' },
      events: { clicked: 'workspace.create' },
    });

    expect(session.nodes.find((node) => node.id === 'button-1')?.props).toEqual({
      disabled: true,
      label: 'Create',
    });

    session = bindAuthoringProperty(session, {
      componentId: 'button-1',
      property: 'disabled',
      target: { kind: 'api-input', apiId: 'workspace.create', field: 'enabled', fieldType: 'boolean' },
    });

    expect(session.bindings).toHaveLength(1);

    session = setAuthoringOperations(session, [{
      operationId: 'workspace.create',
      name: 'Create workspace',
      inputFields: [{ name: 'enabled', type: 'boolean' }],
      outputFields: [{ name: 'workspaceId', type: 'string' }],
    }]);

    expect(session.operations[0].operationId).toBe('workspace.create');
  });

  it('removes a subtree and dependent bindings', () => {
    let session = createAuthoringSession({ sessionId: 'session-2', context: 'service' });
    session = addAuthoringNode(session, { id: 'page', kind: 'page' });
    session = addAuthoringNode(session, { id: 'section', kind: 'section', parentId: 'page' });
    session = addAuthoringNode(session, { id: 'component', kind: 'component', parentId: 'section', componentId: 'floks.button' });
    session = bindAuthoringProperty(session, {
      componentId: 'component',
      property: 'value',
      target: { kind: 'api-input', apiId: 'op', field: 'value' },
    });

    session = removeAuthoringNode(session, 'section');

    expect(session.nodes.map((node) => node.id)).toEqual(['page']);
    expect(session.bindings).toEqual([]);
  });

  it('rejects invalid graph references', () => {
    let session = createAuthoringSession({ sessionId: 'session-3', context: 'general-component' });

    expect(() => addAuthoringNode(session, {
      id: 'child',
      kind: 'component',
      parentId: 'missing',
    })).toThrow("Authoring parent 'missing' does not exist.");

    session = addAuthoringNode(session, { id: 'page', kind: 'page' });
    expect(() => addAuthoringNode(session, { id: 'page', kind: 'page' })).toThrow("Authoring node 'page' already exists.");
  });
});
