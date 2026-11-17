import { describe, expect, it } from 'vitest';
import {
  MonacoIdeServiceFacade,
  UIAuthoringServiceFacade,
} from '@ultrst-armada/kloks/services';
import type {
  MonacoCreateSessionInput,
  MonacoIdeSession,
  UIAuthoringCreateInput,
  UIAuthoringSession,
  UIAuthoringValidation,
} from '@ultrst-armada/kloks/contracts';
import { listComponentContracts } from '@ultrst-armada/floks/contracts';
import { MonacoEditor, UiAuthoringWorkspace } from '@ultrst-armada/floks/canvas-ui';

describe('shared authoring ecosystem contract', () => {
  it('exposes canonical Monaco, authoring, registry, and UI entry points', () => {
    expect(MonacoEditor).toBeTypeOf('function');
    expect(UiAuthoringWorkspace).toBeTypeOf('function');
    expect(listComponentContracts().length).toBeGreaterThan(0);
  });

  it('creates and validates sessions through the published KLOKS service facades', async () => {
    const editorInput: MonacoCreateSessionInput = {
      uri: 'inmemory://skipo/e2e.ts',
      language: 'typescript',
      value: 'export const answer: number = 42;',
    };
    const editor = await MonacoIdeServiceFacade.execute<MonacoCreateSessionInput, MonacoIdeSession>(
      'createSession', editorInput,
    );
    expect(editor.document.value).toBe(editorInput.value);
    expect(editor.document.language).toBe('typescript');

    const authoringInput: UIAuthoringCreateInput = {
      context: 'general-component',
      metadata: { origin: 'theta', purpose: 'general-purpose' },
    };
    const session = await UIAuthoringServiceFacade.execute<UIAuthoringCreateInput, UIAuthoringSession>(
      'createSession', authoringInput,
    );
    const assetRef = {
      packageId: '@ultrst-armada/floks',
      packageVersion: '^1.6.0',
      exportPath: 'ui',
      assetId: 'floks.button',
      assetVersion: '1.0.0',
    };
    await UIAuthoringServiceFacade.execute('addNode', { sessionId: session.sessionId, node: {
      id: 'e2e-page', kind: 'page', name: 'Page', props: {},
    }});
    await UIAuthoringServiceFacade.execute('addNode', { sessionId: session.sessionId, node: {
      id: 'e2e-section', kind: 'section', name: 'Section', parentId: 'e2e-page', props: {},
    }});
    await UIAuthoringServiceFacade.execute('addNode', { sessionId: session.sessionId, node: {
      id: 'e2e-button', kind: 'component', name: 'Button', componentId: 'floks.button',
      parentId: 'e2e-section', assetRef, props: {},
    }});
    const validation = await UIAuthoringServiceFacade.execute<{ sessionId: string }, UIAuthoringValidation>(
      'validate', { sessionId: session.sessionId },
    );
    expect(validation.valid).toBe(true);

    await MonacoIdeServiceFacade.execute('disposeSession', { sessionId: editor.sessionId });
  });
});
