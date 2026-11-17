import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import type {
  MonacoCreateSessionInput,
  MonacoDiagnostic,
  MonacoEditorOptions,
  MonacoIdeSession,
  MonacoUpdateDocumentInput,
  MonacoImportAnalysis,
  MonacoLanguageConfiguration,
  MonacoSerializedSession,
  MonacoSetCompletionsInput,
  MonacoSetImportAnalysisInput,
  MonacoSetValidationResultInput,
  MonacoSetWorkspaceContextInput,
} from '@kloks/contracts';

let activeMonacoService: IService<MonacoState>;

interface MonacoState extends Record<string, unknown> {
  sessions: Record<string, MonacoIdeSession>;
  workspaces: Record<string, import('@kloks/contracts').MonacoWorkspaceContext>;
  languageConfigurations: Record<string, MonacoLanguageConfiguration>;
}

function buildMonacoIdeServiceDefinition(getService: () => IService<MonacoState>): ServiceDefinition<MonacoState> {
  return createServiceDefinition<MonacoState>({
  id: 'kloks.service.monacoIde',
  name: 'MonacoIdeService',
  version: '1.0.0',
  state: { initial: { sessions: {}, workspaces: {}, languageConfigurations: {} } },
  operations: {
    createSession: {
      id: 'MonacoIdeService.createSession',
      name: 'createSession',
      handler: async (input: MonacoCreateSessionInput, ctx) => {
        const sessionId = input.sessionId || `monaco-${Date.now().toString(36)}`;
        const now = Date.now();
        const session: MonacoIdeSession = {
          sessionId,
          document: { uri: input.uri, language: input.language, value: input.value, version: 1, diagnostics: [] },
          options: input.options || {},
          createdAt: now,
          updatedAt: now,
        };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [sessionId]: session } });
        return session;
      },
    },
    updateDocument: {
      id: 'MonacoIdeService.updateDocument',
      name: 'updateDocument',
      handler: async (input: MonacoUpdateDocumentInput, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const document = {
          ...current.document,
          value: input.value,
          language: input.language || current.document.language,
          version: current.document.version + 1,
        };
        const session = { ...current, document, updatedAt: Date.now() };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [session.sessionId]: session } });
        return session;
      },
    },
    setDiagnostics: {
      id: 'MonacoIdeService.setDiagnostics',
      name: 'setDiagnostics',
      handler: async (input: { sessionId: string; diagnostics: MonacoDiagnostic[] }, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const session = {
          ...current,
          document: { ...current.document, diagnostics: input.diagnostics },
          updatedAt: Date.now(),
        };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [session.sessionId]: session } });
        return session;
      },
    },
    setOptions: {
      id: 'MonacoIdeService.setOptions',
      name: 'setOptions',
      handler: async (input: { sessionId: string; options: MonacoEditorOptions }, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const session = { ...current, options: { ...current.options, ...input.options }, updatedAt: Date.now() };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [session.sessionId]: session } });
        return session;
      },
    },
    getSession: {
      id: 'MonacoIdeService.getSession',
      name: 'getSession',
      handler: async (input: { sessionId: string }, ctx) => getService().getState().sessions[input.sessionId] || null,
    },
    disposeSession: {
      id: 'MonacoIdeService.disposeSession',
      name: 'disposeSession',
      handler: async (input: { sessionId: string }, ctx) => {
        const sessions = { ...getService().getState().sessions };
        delete sessions[input.sessionId];
        getService().setState({ ...getService().getState(), sessions });
        return { disposed: true, sessionId: input.sessionId };
      },
    },
    setWorkspaceContext: {
      id: 'MonacoIdeService.setWorkspaceContext',
      name: 'setWorkspaceContext',
      handler: async (input: MonacoSetWorkspaceContextInput, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const session = { ...current, workspaceContext: input.workspaceContext, updatedAt: Date.now() };
        const state = getService().getState();
        getService().setState({
          ...state,
          sessions: { ...state.sessions, [input.sessionId]: session },
          workspaces: { ...state.workspaces, [input.workspaceContext.workspaceId]: input.workspaceContext },
        });
        return session;
      },
    },
    setLanguageConfiguration: {
      id: 'MonacoIdeService.setLanguageConfiguration',
      name: 'setLanguageConfiguration',
      handler: async (input: { sessionId: string; configuration: MonacoLanguageConfiguration }, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const state = getService().getState();
        const session = { ...current, languageConfiguration: input.configuration, updatedAt: Date.now() };
        getService().setState({
          ...state,
          sessions: { ...state.sessions, [input.sessionId]: session },
          languageConfigurations: { ...state.languageConfigurations, [input.configuration.language]: input.configuration },
        });
        return session;
      },
    },
    setCompletions: {
      id: 'MonacoIdeService.setCompletions',
      name: 'setCompletions',
      handler: async (input: MonacoSetCompletionsInput, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const session = { ...current, completions: input.completions, updatedAt: Date.now() };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [input.sessionId]: session } });
        return session;
      },
    },
    setValidationResult: {
      id: 'MonacoIdeService.setValidationResult',
      name: 'setValidationResult',
      handler: async (input: MonacoSetValidationResultInput, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const session = {
          ...current,
          validation: input.validation,
          document: { ...current.document, diagnostics: input.validation.diagnostics },
          updatedAt: Date.now(),
        };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [input.sessionId]: session } });
        return session;
      },
    },
    setImportAnalysis: {
      id: 'MonacoIdeService.setImportAnalysis',
      name: 'setImportAnalysis',
      handler: async (input: MonacoSetImportAnalysisInput, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const session = { ...current, importAnalysis: input.imports, updatedAt: Date.now() };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [input.sessionId]: session } });
        return session;
      },
    },
    analyzeImports: {
      id: 'MonacoIdeService.analyzeImports',
      name: 'analyzeImports',
      handler: async (input: { sessionId: string }, ctx) => {
        const current = getService().getState().sessions[input.sessionId];
        if (!current) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        const workspace = current.workspaceContext;
        const source = current.document.value;
        const pattern = /\bimport\s+(?:[^'"]*?\s+from\s*)?['"]([^'"]+)['"]|\bexport\s+[^'"]*?\s+from\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        const imports: MonacoImportAnalysis[] = [];
        for (const match of source.matchAll(pattern)) {
          const specifier = match[1] || match[2] || match[3];
          if (!specifier) continue;
          const lineNumber = source.slice(0, match.index || 0).split('\n').length;
          const normalizedSpecifier = specifier.replace(/^\.\//, '');
          const resolvedUri = workspace?.files.find((file) =>
            file.uri === specifier || file.uri.endsWith('/' + normalizedSpecifier) || file.uri.endsWith(normalizedSpecifier),
          )?.uri;
          imports.push({
            specifier,
            importedSymbols: [],
            lineNumber,
            resolvedUri,
            resolved: Boolean(resolvedUri || workspace?.dependencies?.[specifier]),
          });
        }
        const session = { ...current, importAnalysis: imports, updatedAt: Date.now() };
        getService().setState({ ...getService().getState(), sessions: { ...getService().getState().sessions, [input.sessionId]: session } });
        return imports;
      },
    },
    serializeSession: {
      id: 'MonacoIdeService.serializeSession',
      name: 'serializeSession',
      handler: async (input: { sessionId: string }, ctx): Promise<MonacoSerializedSession> => {
        const session = getService().getState().sessions[input.sessionId];
        if (!session) throw new Error(`Unknown Monaco session: ${input.sessionId}`);
        return { schemaVersion: '1.0.0', serializedAt: Date.now(), session: structuredClone(session) };
      },
    },
    restoreSession: {
      id: 'MonacoIdeService.restoreSession',
      name: 'restoreSession',
      handler: async (input: { serialized: MonacoSerializedSession }, ctx) => {
        if (input.serialized.schemaVersion !== '1.0.0') throw new Error('Unsupported Monaco session schema version.');
        const session = input.serialized.session;
        if (!session?.sessionId || !session.document?.uri) throw new Error('Invalid serialized Monaco session.');
        const state = getService().getState();
        getService().setState({ ...state, sessions: { ...state.sessions, [session.sessionId]: session } });
        return session;
      },
    },
    getLanguageConfiguration: {
      id: 'MonacoIdeService.getLanguageConfiguration',
      name: 'getLanguageConfiguration',
      handler: async (input: { language: string }, ctx) => getService().getState().languageConfigurations[input.language] || null,
    },
  },
  });
}

export const MonacoIdeServiceDefinition = buildMonacoIdeServiceDefinition(() => activeMonacoService);
export function createMonacoIdeService(): IService<MonacoState> {
  let instance!: IService<MonacoState>;
  instance = createService(buildMonacoIdeServiceDefinition(() => instance));
  return instance;
}

const defaultMonacoIdeService = createService(MonacoIdeServiceDefinition);
activeMonacoService = defaultMonacoIdeService;
export const MonacoIdeServiceFacade = {
  id: MonacoIdeServiceDefinition.id,
  name: MonacoIdeServiceDefinition.name,
  version: MonacoIdeServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: MonacoIdeServiceDefinition,
  service: defaultMonacoIdeService,
  createInstance: createMonacoIdeService,
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn) => {
    await defaultMonacoIdeService.start();
    return defaultMonacoIdeService.call<TIn, TOut>(operation, input);
  },
};
