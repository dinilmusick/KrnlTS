import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import { WebContainerRuntime } from './webContainerService.js';
import type {
  AgentHarnessProviderInfo,
  AgentHarnessRunInput,
  AgentHarnessResult,
} from './agentHarnessTypes.js';

const PROVIDERS: AgentHarnessProviderInfo[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek Harness',
    package: '@deepseek-ai/dsh',
    capabilities: ['headless', 'sdk', 'acp', 'web'],
    implemented: true,
  },
  {
    id: 'openai',
    name: 'OpenAI Agents SDK',
    package: '@openai/agents',
    capabilities: ['agents', 'tools', 'handoffs', 'guardrails', 'sessions', 'tracing'],
    implemented: false,
  },
  {
    id: 'google',
    name: 'Google ADK',
    package: '@google/adk',
    capabilities: ['agents', 'tools', 'multi-agent', 'evaluation', 'deployment'],
    implemented: false,
  },
];

export class AgentHarnessRuntime {
  constructor(private readonly runtime = new WebContainerRuntime()) {}

  providers() {
    return PROVIDERS.map(provider => ({ ...provider, capabilities: [...provider.capabilities] }));
  }

  async run(input: AgentHarnessRunInput): Promise<AgentHarnessResult> {
    if (input.provider !== 'deepseek') {
      throw new Error(
        `Agent harness provider "${input.provider}" is registered but not yet executable; install and register its adapter before running it.`,
      );
    }

    const started = Date.now();
    const profile = input.profile ?? 'headless';
    const command = 'pnpm';
    const args = ['exec', 'dsh', '--profile', profile, input.prompt];
    const result = await this.runtime.runCommand(command, args, input.cwd ?? '.', input.env);
    return {
      provider: input.provider,
      ok: result.exitCode === 0,
      exitCode: result.exitCode,
      output: result.output,
      durationMs: Date.now() - started,
      command: [command, ...args].join(' '),
    };
  }
}

const runtime = new AgentHarnessRuntime();

export const AgentHarnessServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.agentHarness',
  name: 'AgentHarnessService',
  version: '1.0.0',
  operations: {
    providers: {
      id: 'AgentHarnessService.providers',
      name: 'providers',
      handler: async () => runtime.providers(),
    },
    run: {
      id: 'AgentHarnessService.run',
      name: 'run',
      handler: async (input: AgentHarnessRunInput) => runtime.run(input),
    },
  },
});

export const AgentHarnessServiceFacade = {
  id: AgentHarnessServiceDefinition.id,
  name: AgentHarnessServiceDefinition.name,
  version: AgentHarnessServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: AgentHarnessServiceDefinition,
  createInstance: () => createService(AgentHarnessServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    const instance: IService = createService(AgentHarnessServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
