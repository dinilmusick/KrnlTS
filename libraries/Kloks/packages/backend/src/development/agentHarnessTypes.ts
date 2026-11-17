export type AgentHarnessProvider = 'deepseek' | 'openai' | 'google';

export interface AgentHarnessRunInput {
  provider: AgentHarnessProvider;
  prompt: string;
  cwd?: string;
  profile?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface AgentHarnessResult {
  provider: AgentHarnessProvider;
  ok: boolean;
  exitCode: number;
  output: string;
  durationMs: number;
  command?: string;
}

export interface AgentHarnessProviderInfo {
  id: AgentHarnessProvider;
  name: string;
  package: string;
  capabilities: string[];
  implemented: boolean;
}

export interface AgentHarnessServiceContract {
  providers(): AgentHarnessProviderInfo[];
  run(input: AgentHarnessRunInput): Promise<AgentHarnessResult>;
}
