import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import { GitHubActionsClient } from './githubActionsService.js';
import { resolveWebContainerCommand, WebContainerRuntime } from './webContainerService.js';
import type { DevelopmentRequest, DevelopmentResult } from './types.js';

export function resolveDevelopmentCommand(task: DevelopmentRequest['task']) {
  const { command, args } = resolveWebContainerCommand(task);
  return [command, args] as [string, string[]];
}

export const DevelopmentServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.development',
  name: 'DevelopmentService',
  version: '1.1.0',
  operations: {
    plan: {
      id: 'DevelopmentService.plan',
      name: 'plan',
      handler: async (input: { task: DevelopmentRequest['task'] }) => {
        const [command, args] = resolveDevelopmentCommand(input.task);
        return { task: input.task, command, args };
      },
    },
    describeProviders: {
      id: 'DevelopmentService.describeProviders',
      name: 'describeProviders',
      handler: async () => ({
        providers: [
          { id: 'webcontainer', capabilities: ['install', 'lint', 'test', 'build', 'validate', 'check', 'process-host'] },
          { id: 'typescript-language-server', capabilities: ['lsp', 'diagnostics', 'completion', 'hover', 'definition', 'references', 'rename', 'symbols'] },
          { id: 'agent-harness', capabilities: ['deepseek', 'openai', 'google', 'headless', 'sdk', 'acp'] },
          { id: 'github-actions', capabilities: ['dispatch', 'observe', 'rerun', 'cancel'] },
        ],
      }),
    },
  },
});

export class DevelopmentRuntime {
  constructor(
    private readonly webContainer = new WebContainerRuntime(),
    private readonly githubActions?: GitHubActionsClient,
  ) {}

  async run(request: DevelopmentRequest): Promise<DevelopmentResult> {
    if (request.provider === 'webcontainer') {
      const result = await this.webContainer.run(request.task, request.cwd, request.env);
      return { provider: request.provider, task: request.task, ok: result.exitCode === 0, exitCode: result.exitCode, output: result.output, command: result.command, durationMs: result.durationMs, diagnostics: result.diagnostics };
    }
    if (!this.githubActions || !request.repository || !request.workflowId || !request.ref) {
      throw new Error('GitHub Actions execution requires repository, workflowId, ref, and an authenticated client');
    }
    await this.githubActions.dispatchWorkflow(request.repository, request.workflowId, request.ref, {
      task: request.task,
      ...(request.workflowInputs ?? {}),
    });
    return { provider: request.provider, task: request.task, ok: true, output: 'Workflow dispatched; observe its run for final status.' };
  }
}

export const DevelopmentServiceFacade = {
  id: DevelopmentServiceDefinition.id,
  name: DevelopmentServiceDefinition.name,
  version: DevelopmentServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: DevelopmentServiceDefinition,
  createInstance: () => createService(DevelopmentServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    const instance: IService = createService(DevelopmentServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
