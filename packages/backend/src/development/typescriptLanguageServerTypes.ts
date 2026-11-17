export interface TypeScriptLanguageServerStartInput {
  cwd?: string;
  install?: boolean;
  version?: string;
}

export interface TypeScriptLanguageServerRequestInput {
  id: number | string;
  method: string;
  params?: unknown;
}

export interface TypeScriptLanguageServerNotificationInput {
  method: string;
  params?: unknown;
}

export interface TypeScriptLanguageServerResponse {
  jsonrpc: '2.0';
  id?: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface TypeScriptLanguageServerStatus {
  running: boolean;
  cwd?: string;
  package: string;
  version: string;
}
