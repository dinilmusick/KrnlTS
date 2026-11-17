export type ValidationLayer = 'syntax' | 'lint' | 'test' | 'build' | 'krnl' | 'frnl' | 'lockfile-check' | 'law-l9';
export interface CodeValidationInput {
  layers?: ValidationLayer[];
  cwd?: string;
  env?: Record<string, string>;
  maxLines?: number;
  files?: Record<string, unknown>;
  install?: boolean;
}
export interface ValidationDiagnostic { layer: ValidationLayer; ok: boolean; exitCode: number; output: string; command: string; }
export interface CodeValidationResult { ok: boolean; diagnostics: ValidationDiagnostic[]; failedLayers: ValidationLayer[]; }
