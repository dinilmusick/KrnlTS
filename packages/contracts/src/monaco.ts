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

export type MonacoCompletionProvider = (
  request: MonacoCompletionRequest,
) => Promise<MonacoCompletionItem[]>;
