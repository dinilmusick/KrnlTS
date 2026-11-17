'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  MonacoCompletionItem,
  MonacoCompletionProvider,
  MonacoDiagnostic,
  MonacoDocument,
} from '@floks/contracts';
import { useMonaco } from './useMonaco.js';
import type { EditorConfig } from './types.js';

export interface MonacoIdeServicePort {
  execute<TIn = unknown, TOut = unknown>(operation: string, input?: TIn): Promise<TOut>;
}

export interface MonacoEditorProps extends EditorConfig {
  sessionId?: string;
  uri?: string;
  ideService?: MonacoIdeServicePort;
  diagnostics?: MonacoDiagnostic[];
  completionProvider?: MonacoCompletionProvider;
  onValidate?: (document: MonacoDocument) => Promise<MonacoDiagnostic[]>;
  onServiceError?: (error: unknown) => void;
  onChange?: (value: string) => void;
  height?: string | number;
  width?: string | number;
}

export function MonacoEditor({
  value, language = 'javascript', readOnly = false, minimap = false, theme = 'skipo-dark',
  fontSize = 14, sessionId, uri, ideService, diagnostics = [], completionProvider, onValidate, onServiceError, onChange, height = '100%', width = '100%',
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const sessionRef = useRef<string | undefined>(sessionId);
  const sessionReadyRef = useRef<Promise<unknown>>(Promise.resolve());
  const monaco = useMonaco();
  const service = ideService;
  const [validationDiagnostics, setValidationDiagnostics] = useState<MonacoDiagnostic[]>([]);
  const validationRunRef = useRef(0);
  const completionProviderRef = useRef(completionProvider);
  const validateRef = useRef(onValidate);
  const errorRef = useRef(onServiceError);
  completionProviderRef.current = completionProvider;
  validateRef.current = onValidate;
  errorRef.current = onServiceError;
  const activeDiagnostics = useMemo(() => [...diagnostics, ...validationDiagnostics], [diagnostics, validationDiagnostics]);

  const executeForSession = (operation: string, input?: unknown) => {
    if (!service) return Promise.resolve();
    return sessionReadyRef.current
      .then(() => service.execute(operation, input))
      .catch((error) => { errorRef.current?.(error); });
  };

  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = sessionId || `editor-${Date.now().toString(36)}`;
    if (service) {
      sessionReadyRef.current = service.execute('createSession', {
        sessionId: sessionRef.current, uri: uri || `inmemory://${sessionRef.current}`, language, value,
        options: { readOnly, minimap, fontSize },
      });
      void sessionReadyRef.current.catch((error) => errorRef.current?.(error));
    } else {
      sessionReadyRef.current = Promise.resolve();
    }
    return () => {
      if (service && sessionRef.current) {
        void sessionReadyRef.current.then(() => service.execute('disposeSession', { sessionId: sessionRef.current }))
          .catch((error) => errorRef.current?.(error));
      }
    };
  }, []);

  useEffect(() => {
    if (!monaco || !containerRef.current) return;
    if (!editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value, language, theme, readOnly, fontSize, minimap: { enabled: minimap },
        automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 16, bottom: 16 },
      });
      editorRef.current.onDidChangeModelContent(() => {
        const nextValue = editorRef.current.getValue();
        const currentSessionId = sessionRef.current;
        void executeForSession('updateDocument', {
          sessionId: currentSessionId, value: nextValue, language,
        });
        const validate = validateRef.current;
        if (validate && currentSessionId) {
          const sequence = ++validationRunRef.current;
          const document: MonacoDocument = {
            uri: uri || `inmemory://${currentSessionId}`, language, value: nextValue, version: sequence, diagnostics: [],
          };
          void validate(document).then((nextDiagnostics) => {
            if (sequence !== validationRunRef.current) return;
            setValidationDiagnostics(nextDiagnostics);
            return executeForSession('setDiagnostics', { sessionId: currentSessionId, diagnostics: nextDiagnostics });
          }).catch((error) => errorRef.current?.(error));
        }
        onChange?.(nextValue);
      });
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [monaco]);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) editorRef.current.setValue(value);
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    monaco?.editor.setModelLanguage(editorRef.current.getModel(), language);
    editorRef.current.updateOptions({ readOnly, fontSize, minimap: { enabled: minimap } });
    if (theme) monaco?.editor.setTheme(theme);
    if (sessionRef.current) {
      void executeForSession('setOptions', {
        sessionId: sessionRef.current, options: { readOnly, minimap, fontSize },
      });
    }
  }, [language, readOnly, fontSize, minimap, theme, monaco]);

  useEffect(() => {
    if (!monaco || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const severity = monaco.MarkerSeverity || {};
    monaco.editor.setModelMarkers(model, 'floks', activeDiagnostics.map((diagnostic) => ({
      message: diagnostic.message,
      severity: severity[diagnostic.severity === 'error' ? 'Error'
        : diagnostic.severity === 'warning' ? 'Warning'
        : diagnostic.severity === 'info' ? 'Info' : 'Hint'] ?? severity.Error,
      startLineNumber: diagnostic.startLineNumber,
      startColumn: diagnostic.startColumn,
      endLineNumber: diagnostic.endLineNumber,
      endColumn: diagnostic.endColumn,
      code: diagnostic.code,
      source: 'floks',
    })));
    if (sessionRef.current) {
      void executeForSession('setDiagnostics', {
        sessionId: sessionRef.current,
        diagnostics: activeDiagnostics,
      });
    }
  }, [monaco, activeDiagnostics, service]);

  useEffect(() => {
    if (!monaco || !completionProviderRef.current || !monaco.languages?.registerCompletionItemProvider) return;
    const disposable = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.'],
      provideCompletionItems: async (model: any, position: any) => {
        const provider = completionProviderRef.current;
        if (!provider) return { suggestions: [] };
        const currentSessionId = sessionRef.current;
        if (!currentSessionId) return { suggestions: [] };
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const items: MonacoCompletionItem[] = await provider({
          sessionId: currentSessionId,
          uri: model.uri?.toString?.() || uri || `inmemory://${currentSessionId}`,
          language: model.getLanguageId(),
          value: model.getValue(),
          position: {
            lineNumber: position.lineNumber,
            column: position.column,
            offset: model.getOffsetAt(position),
          },
        });
        const kinds = monaco.languages.CompletionItemKind || {};
        return {
          suggestions: items.map((item) => ({
            ...item,
            kind: kinds[item.kind || 'Text'] ?? kinds.Text,
            insertText: item.insertText ?? item.label,
            range,
          })),
        };
      },
    });
    return () => disposable?.dispose?.();
  }, [monaco, language, uri]);

  return <div ref={containerRef} style={{ width, height, overflow: 'hidden', borderRadius: '8px' }} />;
}
