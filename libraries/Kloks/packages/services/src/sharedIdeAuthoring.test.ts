import { describe, expect, it } from 'vitest';
import { MonacoIdeServiceDefinition, createMonacoIdeService } from './client-services/monacoIdeService.js';
import { UIAuthoringServiceDefinition, createUIAuthoringService } from './client-services/uiAuthoringService.js';

describe('shared IDE and UI authoring services', () => {
  it('exposes the Monaco session lifecycle', () => {
    expect(Object.keys(MonacoIdeServiceDefinition.operations)).toEqual([
      'createSession', 'updateDocument', 'setDiagnostics', 'setOptions', 'getSession', 'disposeSession',
      'setWorkspaceContext', 'setLanguageConfiguration', 'setCompletions', 'setValidationResult',
      'setImportAnalysis', 'analyzeImports', 'serializeSession', 'restoreSession', 'getLanguageConfiguration',
    ]);
  });

  it('exposes context-neutral UI authoring operations', () => {
    expect(Object.keys(UIAuthoringServiceDefinition.operations)).toEqual([
      'createSession', 'replaceSession', 'addNode', 'updateNode', 'removeNode', 'setBinding',
      'setOperations', 'validate', 'serialize', 'generateArtifact', 'generateServiceUI', 'suggestComponent', 'getSession',
    ]);
  });


  it('builds a context-aware artifact and rejects broken hierarchy', async () => {
    const service = createUIAuthoringService();
    await service.start();
    const session = await service.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
      context: 'general-component',
      metadata: { origin: 'theta', name: 'ExampleButton' },
    });
    const valid = await service.call<unknown, import('@kloks/contracts').UIAuthoringValidation>('validate', { sessionId: session.sessionId });
    expect(valid.valid).toBe(false);
    await service.call('addNode', { sessionId: session.sessionId, node: {
      id: 'page', kind: 'page', name: 'Page', props: {},
    }});
    await service.call('addNode', { sessionId: session.sessionId, node: {
      id: 'section', kind: 'section', name: 'Section', parentId: 'page', props: {},
    }});
    const validAfterHierarchy = await service.call<unknown, import('@kloks/contracts').UIAuthoringValidation>('validate', { sessionId: session.sessionId });
    expect(validAfterHierarchy.valid).toBe(true);
    const artifact = await service.call<unknown, import('@kloks/contracts').UIComponentArtifact>('generateArtifact', { sessionId: session.sessionId });
    expect(artifact.purpose).toBe('general-purpose');
    expect(artifact.promotion).toBe('always');
  });


it('validates typed operation bindings and resolves nested component roots', async () => {
  const service = createUIAuthoringService();
  await service.start();
  const session = await service.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
    context: 'general-component',
    operations: [{
      operationId: 'submit',
      name: 'submit',
      inputFields: [{ name: 'email', type: 'email' }],
      outputFields: [{ name: 'message', type: 'string' }],
    }],
    metadata: { origin: 'theta', name: 'EmailForm', rootComponentId: 'form' },
  });
  const assetRef = {
    packageId: '@ultrst-armada/floks',
    packageVersion: '^1.5.0',
    exportPath: 'ui',
    assetId: 'floks.input.text',
    assetVersion: '1.0.0',
  };
  await service.call('addNode', { sessionId: session.sessionId, node: {
    id: 'page', kind: 'page', name: 'Page', props: {},
  }});
  await service.call('addNode', { sessionId: session.sessionId, node: {
    id: 'section', kind: 'section', name: 'Section', parentId: 'page', props: {},
  }});
  await service.call('addNode', { sessionId: session.sessionId, node: {
    id: 'form', kind: 'component', name: 'EmailInput', parentId: 'section', props: {}, assetRef,
    slots: { content: [] },
    states: { idle: { background: 'black' } },
    events: { onSubmit: 'submit' },
  }});
  await service.call('setBinding', { sessionId: session.sessionId, binding: {
    componentId: 'form',
    property: 'value',
    target: { kind: 'api-input', apiId: 'submit', field: 'email', fieldType: 'email' },
  }});
  const validation = await service.call<unknown, import('@kloks/contracts').UIAuthoringValidation>('validate', { sessionId: session.sessionId });
  expect(validation.valid).toBe(true);
  const artifact = await service.call<unknown, import('@kloks/contracts').UIComponentArtifact>('generateArtifact', { sessionId: session.sessionId });
  expect(artifact.rootAsset).toEqual(assetRef);
});

it('rejects bindings to structural nodes and unknown operation fields', async () => {
  const service = createUIAuthoringService();
  await service.start();
  const session = await service.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
    context: 'general-component',
    operations: [{ operationId: 'submit', name: 'submit', inputFields: [{ name: 'email', type: 'email' }] }],
  });
  await service.call('addNode', { sessionId: session.sessionId, node: {
    id: 'page', kind: 'page', name: 'Page', props: {},
    slots: { content: ['missing-child'] },
    events: { onClick: 'missing-operation' },
  }});
  await service.call('setBinding', { sessionId: session.sessionId, binding: {
    componentId: 'page',
    property: 'value',
    target: { kind: 'api-input', apiId: 'submit', field: 'missing', fieldType: 'email' },
  }});
  const validation = await service.call<unknown, import('@kloks/contracts').UIAuthoringValidation>('validate', { sessionId: session.sessionId });
  expect(validation.valid).toBe(false);
  expect(validation.errors).toContain('Binding target must be a component node: page');
  expect(validation.errors).toContain('Binding references missing input field: submit.missing');
  expect(validation.errors).toContain('Slot content references missing child: missing-child');
  expect(validation.errors).toContain('Event onClick references missing operation: missing-operation');
});
});

describe('shared service instance isolation', () => {
  it('keeps Monaco sessions isolated between service instances', async () => {
    const { createMonacoIdeService } = await import('./client-services/monacoIdeService.js');
    const first = createMonacoIdeService();
    const second = createMonacoIdeService();
    await first.start();
    await second.start();
    const firstSession = await first.call<unknown, import('@kloks/contracts').MonacoIdeSession>('createSession', {
      sessionId: 'first-session', uri: 'inmemory://first.ts', language: 'typescript', value: 'first',
    });
    const secondSession = await second.call<unknown, import('@kloks/contracts').MonacoIdeSession>('createSession', {
      sessionId: 'second-session', uri: 'inmemory://second.ts', language: 'typescript', value: 'second',
    });
    expect(firstSession.document.value).toBe('first');
    expect(secondSession.document.value).toBe('second');
    expect(await first.call('getSession', { sessionId: 'second-session' })).toBeNull();
    expect(await second.call('getSession', { sessionId: 'first-session' })).toBeNull();
  });

  it('keeps UI authoring sessions isolated between service instances', async () => {
    const first = createUIAuthoringService();
    const second = createUIAuthoringService();
    await first.start();
    await second.start();
    const firstSession = await first.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
      sessionId: 'first-authoring', context: 'general-component',
    });
    const secondSession = await second.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
      sessionId: 'second-authoring', context: 'application',
    });
    expect(firstSession.context).toBe('general-component');
    expect(secondSession.context).toBe('application');
    expect(await first.call('getSession', { sessionId: 'second-authoring' })).toBeNull();
    expect(await second.call('getSession', { sessionId: 'first-authoring' })).toBeNull();
  });
});

describe('extended authoring and Monaco operations', () => {
  it('generates ServiceUISchema without inventing assets for structural sections', async () => {
  const service = createUIAuthoringService();
  await service.start();
  const session = await service.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
    context: 'service',
    metadata: { serviceId: 'service.example' },
    operations: [{ operationId: 'submit', name: 'submit', inputFields: [{ name: 'email', type: 'email' }] }],
  });
  const assetRef = {
    packageId: '@ultrst-armada/floks',
    packageVersion: '^1.5.0',
    exportPath: 'ui',
    assetId: 'floks.input.text',
    assetVersion: '1.0.0',
  };
  await service.call('addNode', { sessionId: session.sessionId, node: { id: 'page', kind: 'page', name: 'Page', props: {} } });
  await service.call('addNode', { sessionId: session.sessionId, node: { id: 'section', kind: 'section', name: 'Form', parentId: 'page', props: {} } });
  await service.call('addNode', { sessionId: session.sessionId, node: { id: 'email', kind: 'component', name: 'Email', parentId: 'section', assetRef, props: {} } });
  const schema = await service.call<unknown, import('@kloks/contracts').ServiceUISchema>('generateServiceUI', { sessionId: session.sessionId });
  expect(schema.serviceId).toBe('service.example');
  expect(schema.pages[0].sections[0].assetRef).toBeUndefined();
  expect(schema.pages[0].sections[0].components[0].assetRef).toEqual(assetRef);
  expect(schema.assetRefs).toEqual([assetRef]);
});


it('removes complete subtrees and cleans dependent bindings and slot references', async () => {
  const service = createUIAuthoringService();
  await service.start();
  const session = await service.call<unknown, import('@kloks/contracts').UIAuthoringSession>('createSession', {
    context: 'general-component',
    operations: [{ operationId: 'submit', name: 'submit' }],
  });
  const assetRef = { packageId: '@ultrst-armada/floks', packageVersion: '^1.5.0', exportPath: 'ui', assetId: 'floks.button', assetVersion: '1.0.0' };
  await service.call('addNode', { sessionId: session.sessionId, node: { id: 'page', kind: 'page', name: 'Page', props: {}, slots: { sections: ['section'] } } });
  await service.call('addNode', { sessionId: session.sessionId, node: { id: 'section', kind: 'section', name: 'Section', parentId: 'page', props: {}, slots: { children: ['button'] } } });
  await service.call('addNode', { sessionId: session.sessionId, node: { id: 'button', kind: 'component', name: 'Button', parentId: 'section', props: {}, assetRef } });
  await service.call('setBinding', { sessionId: session.sessionId, binding: { componentId: 'button', property: 'onClick', target: { kind: 'api-input', apiId: 'submit', field: 'unused', fieldType: 'string' } } });
  await service.call('removeNode', { sessionId: session.sessionId, nodeId: 'page' });
  const after = await service.call<unknown, import('@kloks/contracts').UIAuthoringSession>('getSession', { sessionId: session.sessionId });
  expect(after.nodes).toEqual([]);
  expect(after.bindings).toEqual([]);
});


it('supports Monaco workspace context, language intelligence, import analysis, and session round-tripping', async () => {
  const service = createMonacoIdeService();
  await service.start();
  const session = await service.call<unknown, import('@kloks/contracts').MonacoIdeSession>('createSession', {
    sessionId: 'intelligence-session',
    uri: 'inmemory://workspace/main.ts',
    language: 'typescript',
    value: "import local from './local.ts';\nimport remote from 'remote-pkg';",
  });
  await service.call('setWorkspaceContext', {
    sessionId: session.sessionId,
    workspaceContext: {
      workspaceId: 'workspace',
      rootUri: 'inmemory://workspace/',
      files: [{ uri: 'inmemory://workspace/local.ts', language: 'typescript' }],
      dependencies: { 'remote-pkg': '^1.0.0' },
    },
  });
  const imports = await service.call<unknown, import('@kloks/contracts').MonacoImportAnalysis[]>('analyzeImports', {
    sessionId: session.sessionId,
  });
  expect(imports).toEqual(expect.arrayContaining([
    expect.objectContaining({ specifier: './local.ts', resolved: true, resolvedUri: 'inmemory://workspace/local.ts' }),
    expect.objectContaining({ specifier: 'remote-pkg', resolved: true }),
  ]));

  const completions = [{ label: 'workspaceItem', insertText: 'workspaceItem', kind: 'Variable' }];
  await service.call('setCompletions', { sessionId: session.sessionId, completions });
  const validation = { valid: true, diagnostics: [], checkedAt: 123 };
  await service.call('setValidationResult', { sessionId: session.sessionId, validation });
  const languageConfiguration = {
    language: 'typescript', extensions: ['.ts', '.tsx'], configuration: { comments: { lineComment: '//' } },
  };
  await service.call('setLanguageConfiguration', { sessionId: session.sessionId, configuration: languageConfiguration });
  expect(await service.call('getLanguageConfiguration', { language: 'typescript' })).toEqual(languageConfiguration);

  const serialized = await service.call<unknown, import('@kloks/contracts').MonacoSerializedSession>('serializeSession', {
    sessionId: session.sessionId,
  });
  expect(serialized.schemaVersion).toBe('1.0.0');
  await service.call('disposeSession', { sessionId: session.sessionId });
  expect(await service.call('getSession', { sessionId: session.sessionId })).toBeNull();
  const restored = await service.call<unknown, import('@kloks/contracts').MonacoIdeSession>('restoreSession', { serialized });
  expect(restored.completions).toEqual(completions);
  expect(restored.validation).toEqual(validation);
  expect(restored.importAnalysis).toEqual(imports);
});
});

