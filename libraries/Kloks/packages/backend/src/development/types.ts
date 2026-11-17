import type { ServiceDefinition } from '@ultrst-armada/krnl';

export type DevelopmentProvider = 'webcontainer' | 'github-actions';

export type DevelopmentTask =
  | 'install'
  | 'lint'
  | 'test'
  | 'build'
  | 'validate'
  | 'check';

export interface DevelopmentRequest {
  provider: DevelopmentProvider;
  task: DevelopmentTask;
  repository?: string;
  ref?: string;
  workflowId?: string | number;
  workflowInputs?: Record<string, string>;
  cwd?: string;
  env?: Record<string, string>;
  sourceSha?: string;
}

export interface DevelopmentDiagnostic {
  severity: 'error' | 'warning' | 'info';
  source: 'typescript' | 'eslint' | 'bundler' | 'package-manager' | 'runtime' | 'unknown';
  code?: string;
  file?: string;
  line?: number;
  column?: number;
  message: string;
}

export interface DevelopmentResult {
  provider: DevelopmentProvider;
  task: DevelopmentTask;
  ok: boolean;
  exitCode?: number;
  output?: string;
  command?: string;
  durationMs?: number;
  diagnostics?: DevelopmentDiagnostic[];
  sourceSha?: string;
  runId?: number;
  url?: string;
}

export interface WebContainerCommand {
  command: string;
  args: string[];
}

export interface DevelopmentServiceContract {
  definition: ServiceDefinition;
}
