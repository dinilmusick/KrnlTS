import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import {
  resolveWebContainerCommand,
  WebContainerRuntime,
  type WebContainerRunCommandInput,
} from './webContainerRuntime.js';
import type { DevelopmentTask } from './types.js';

export { captureDevelopmentProcess, parseDevelopmentDiagnostics, resolveWebContainerCommand, WebContainerRuntime } from './webContainerRuntime.js';
export type { WebContainerRunCommandInput } from './webContainerRuntime.js';

const runtime = new WebContainerRuntime();

export const WebContainerServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.webContainer',
  name: 'WebContainerService',
  version: '1.3.0',
  operations: {
    boot: { id: 'WebContainerService.boot', name: 'boot', handler: async () => { await runtime.boot(); return { ready: true }; } },
    mount: { id: 'WebContainerService.mount', name: 'mount', handler: async (input: { files: Record<string, unknown>; mountPoint?: string; sourceSha?: string }) => runtime.mount(input.files, input.mountPoint, input.sourceSha) },
    run: { id: 'WebContainerService.run', name: 'run', handler: async (input: { task: DevelopmentTask; cwd?: string; env?: Record<string, string>; sourceSha?: string }) => runtime.run(input.task, input.cwd, input.env, input.sourceSha) },
    runCommand: { id: 'WebContainerService.runCommand', name: 'runCommand', handler: async (input: WebContainerRunCommandInput) => runtime.runCommand(input.command, input.args, input.cwd, input.env, input.sourceSha) },
    spawnCommand: { id: 'WebContainerService.spawnCommand', name: 'spawnCommand', handler: async (input: WebContainerRunCommandInput) => runtime.spawnCommand(input.command, input.args, input.cwd, input.env, input.sourceSha) },
    teardown: { id: 'WebContainerService.teardown', name: 'teardown', handler: async (input?: { mountPoint?: string }) => runtime.teardown(input?.mountPoint) },
    command: { id: 'WebContainerService.command', name: 'command', handler: async (input: { task: DevelopmentTask }) => ({ task: input.task, command: resolveWebContainerCommand(input.task) }) },
  },
});

export const WebContainerServiceFacade = {
  id: WebContainerServiceDefinition.id,
  name: WebContainerServiceDefinition.name,
  version: WebContainerServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: WebContainerServiceDefinition,
  createInstance: () => createService(WebContainerServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    const instance: IService = createService(WebContainerServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
