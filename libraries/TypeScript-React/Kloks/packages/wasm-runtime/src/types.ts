export type SupportedLanguage = "rust" | "go";

export type RuntimeEnvironment =
  | "browser"
  | "node"
  | "vercel"
  | "cloudflare-worker";

export interface RuntimeInputs {
  [key: string]: unknown;
}

export interface RuntimeOptions {
  target?: "wasip1";
  optimization?: "debug" | "release";
  timeoutMs?: number;
  toolchainBaseUrl?: string;
  instructionBudget?: number;
  memoryLimitBytes?: number;
  outputLimitBytes?: number;
}

export interface BrowserWasmRuntimeOptions {
  toolchainBaseUrl?: string;
}

export interface RuntimeDiagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  source?: string;
  code?: string;
}

export interface RuntimeExecuteRequest {
  language?: SupportedLanguage;
  filename?: string;
  source: string;
  inputs?: RuntimeInputs;
  options?: RuntimeOptions;
}

export interface RuntimeMetrics {
  cost?: number | null;
  memoryBytes?: number | null;
  logicalTimeNs?: number | null;
  stdoutBytes?: number | null;
  stderrBytes?: number | null;
}

export interface RuntimeResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  language?: SupportedLanguage;
  termination?: string;
  diagnostics: RuntimeDiagnostic[];
  metrics?: RuntimeMetrics;
  executionTimeMs?: number;
}

export interface WasmRuntime {
  execute(request: RuntimeExecuteRequest): Promise<RuntimeResult>;
  dispose(): void;
}
