import type { DevelopmentDiagnostic, DevelopmentTask, WebContainerCommand } from './types.js';
const COMMANDS: Record<DevelopmentTask, WebContainerCommand> = {
  install: { command: 'pnpm', args: ['install', '--frozen-lockfile'] },
  lint: { command: 'pnpm', args: ['lint'] },
  test: { command: 'pnpm', args: ['test'] },
  build: { command: 'pnpm', args: ['build'] },
  validate: { command: 'pnpm', args: ['validate'] },
  check: { command: 'pnpm', args: ['lint'] },
};

export function resolveWebContainerCommand(task: DevelopmentTask): WebContainerCommand {
  const command = COMMANDS[task];
  return { command: command.command, args: [...command.args] };
}

export function parseDevelopmentDiagnostics(output: string, exitCode = 0): DevelopmentDiagnostic[] {
  const diagnostics: DevelopmentDiagnostic[] = [];
  const seen = new Set<string>();
  const add = (diagnostic: DevelopmentDiagnostic) => {
    const key = [diagnostic.source, diagnostic.code, diagnostic.file, diagnostic.line, diagnostic.message].join('|');
    if (!seen.has(key)) { seen.add(key); diagnostics.push(diagnostic); }
  };
  for (const line of output.split(/\r?\n/)) {
    const typescript = line.match(/^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/);
    if (typescript) {
      add({ source: 'typescript', severity: typescript[4] as 'error' | 'warning', file: typescript[1], line: Number(typescript[2]), column: Number(typescript[3]), code: typescript[5], message: typescript[6] });
      continue;
    }
    const eslint = line.match(/^(.+?):(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+([^\s]+)$/);
    if (eslint) {
      add({ source: 'eslint', severity: eslint[4] as 'error' | 'warning', file: eslint[1], line: Number(eslint[2]), column: Number(eslint[3]), code: eslint[6], message: eslint[5] });
      continue;
    }
    const bundler = line.match(/(?:✘|×|ERROR|error:|Error:)\s*(.+)$/);
    if (bundler) add({ source: 'bundler', severity: 'error', message: bundler[1].trim() });
    if (/\bWARN(?:ING)?\b/i.test(line)) add({ source: 'package-manager', severity: 'warning', message: line.trim() });
  }
  if (exitCode !== 0 && diagnostics.every(item => item.severity !== 'error')) {
    add({ source: 'unknown', severity: 'error', message: 'Command failed with exit code ' + exitCode + '; inspect captured output for details.' });
  }
  return diagnostics;
}

export function captureDevelopmentProcess<T extends { output: ReadableStream<string>; exit: Promise<number> }>(process: T) {
  const [consumerOutput, diagnosticOutput] = process.output.tee();
  const logs = (async () => {
    const reader = diagnosticOutput.getReader();
    let output = '';
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        output += next.value;
      }
    } finally { reader.releaseLock(); }
    const exitCode = await process.exit;
    return { output, exitCode, diagnostics: parseDevelopmentDiagnostics(output, exitCode) };
  })();
  return { ...process, output: consumerOutput, logs };
}

export interface WebContainerRunCommandInput {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string | number | boolean>;
  sourceSha?: string;
}

let runQueue: Promise<void> = Promise.resolve();
let sharedContainer: any = null;
let sharedContainerPromise: Promise<any> | null = null;

export class WebContainerRuntime {
  async boot() {
    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      throw new Error('WebContainer requires a cross-origin-isolated page. Ensure COOP=same-origin and COEP=require-corp are served.');
    }
    if (sharedContainer) return sharedContainer;
    if (!sharedContainerPromise) {
      sharedContainerPromise = import('@webcontainer/api').then(async module => {
        const container = await module.WebContainer.boot({ coep: 'require-corp', workdirName: 'kloks-development' });
        sharedContainer = container;
        return container;
      }).catch(error => {
        sharedContainerPromise = null;
        throw error;
      });
    }
    return sharedContainerPromise;
  }

  async mount(files: Record<string, unknown>, mountPoint = '/', sourceSha?: string) {
    const container = await this.boot();
    await container.mount(files, mountPoint === '/' ? undefined : { mountPoint });
    return { mounted: true, mountPoint, sourceSha };
  }

  private async runProcess(command: string, args: string[], cwd?: string, env?: Record<string, string | number | boolean>, sourceSha?: string) {
    const container = await this.boot();
    const process = await container.spawn(command, args, { cwd, env });
    const started = Date.now();
    let output = '';
    const reader = process.output.getReader();
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        output += next.value;
      }
    } finally { reader.releaseLock(); }
    const exitCode = await process.exit;
    return {
      exitCode,
      output,
      command: [command, ...args].join(' '),
      durationMs: Date.now() - started,
      diagnostics: parseDevelopmentDiagnostics(output, exitCode),
      sourceSha,
    };
  }

  async run(task: DevelopmentTask, cwd?: string, env?: Record<string, string>, sourceSha?: string) {
    const spec = resolveWebContainerCommand(task);
    return this.runCommand(spec.command, spec.args, cwd, env, sourceSha);
  }

  async runCommand(command: string, args: string[] = [], cwd?: string, env?: Record<string, string | number | boolean>, sourceSha?: string) {
    const previous = runQueue;
    let release!: () => void;
    runQueue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try {
      return await this.runProcess(command, args, cwd, env, sourceSha);
    } finally {
      release();
    }
  }

  async spawnCommand(command: string, args: string[] = [], cwd?: string, env?: Record<string, string | number | boolean>, sourceSha?: string) {
    const container = await this.boot();
    const process = await container.spawn(command, args, { cwd, env });
    return { processId: globalThis.crypto.randomUUID(), sourceSha, command: [command, ...args].join(' '), startedAt: new Date().toISOString(), process: captureDevelopmentProcess(process) };
  }

  async teardown(mountPoint?: string) {
    const container = sharedContainer;
    if (!container) return { tornDown: true, mountPoint };
    if (mountPoint && mountPoint !== '/') {
      await container.fs.rm(mountPoint, { recursive: true, force: true });
      return { tornDown: true, mountPoint };
    }
    sharedContainer = null;
    sharedContainerPromise = null;
    await container.teardown();
    return { tornDown: true, mountPoint: '/' };
  }
}
