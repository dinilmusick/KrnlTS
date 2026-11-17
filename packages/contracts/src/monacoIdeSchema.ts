export type MonacoDiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface MonacoDiagnostic {
  message: string;
  severity: MonacoDiagnosticSeverity;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  code?: string;
}

export interface MonacoDocument {
  uri: string;
  language: string;
  value: string;
  version: number;
  diagnostics: MonacoDiagnostic[];
}

export interface MonacoEditorOptions {
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
}

export interface MonacoIdeSession {
  sessionId: string;
  document: MonacoDocument;
  options: MonacoEditorOptions;
  workspaceContext?: MonacoWorkspaceContext;
  languageConfiguration?: MonacoLanguageConfiguration;
  completions?: MonacoCompletionItem[];
  validation?: MonacoValidationResult;
  importAnalysis?: MonacoImportAnalysis[];
  createdAt: number;
  updatedAt: number;
}

export interface MonacoCreateSessionInput {
  sessionId?: string;
  uri: string;
  language: string;
  value: string;
  options?: MonacoEditorOptions;
}

export interface MonacoUpdateDocumentInput {
  sessionId: string;
  value: string;
  language?: string;
}


export interface MonacoCompletionItem {
  label: string;
  insertText?: string;
  detail?: string;
  documentation?: string;
  kind?: string;
  sortText?: string;
}

export interface MonacoCompletionRequest {
  sessionId: string;
  uri: string;
  language: string;
  value: string;
  position: { lineNumber: number; column: number; offset: number };
}

export interface MonacoWorkspaceContext {
  workspaceId: string;
  rootUri: string;
  files: Array<{ uri: string; language?: string }>;
  dependencies?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface MonacoImportAnalysis {
  specifier: string;
  importedSymbols: string[];
  lineNumber: number;
  resolvedUri?: string;
  resolved: boolean;
}

export interface MonacoValidationResult {
  valid: boolean;
  diagnostics: MonacoDiagnostic[];
  checkedAt: number;
}

export type MonacoCompletionProvider = (request: MonacoCompletionRequest) => Promise<MonacoCompletionItem[]>;


export interface MonacoLanguageConfiguration {
  language: string;
  extensions?: string[];
  aliases?: string[];
  configuration: Record<string, unknown>;
}

export interface MonacoSerializedSession {
  schemaVersion: '1.0.0';
  serializedAt: number;
  session: MonacoIdeSession;
}

export interface MonacoSetWorkspaceContextInput {
  sessionId: string;
  workspaceContext: MonacoWorkspaceContext;
}

export interface MonacoSetCompletionsInput {
  sessionId: string;
  completions: MonacoCompletionItem[];
}

export interface MonacoSetValidationResultInput {
  sessionId: string;
  validation: MonacoValidationResult;
}

export interface MonacoSetImportAnalysisInput {
  sessionId: string;
  imports: MonacoImportAnalysis[];
}
