import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import { WebContainerRuntime } from './webContainerService.js';
import type {
  TypeScriptLanguageServerNotificationInput,
  TypeScriptLanguageServerRequestInput,
  TypeScriptLanguageServerResponse,
  TypeScriptLanguageServerStartInput,
  TypeScriptLanguageServerStatus,
} from './typescriptLanguageServerTypes.js';

export const TYPESCRIPT_LANGUAGE_SERVER_PACKAGE = 'typescript-language-server';
export const TYPESCRIPT_LANGUAGE_SERVER_VERSION = '6.0.2';
const PACKAGE = TYPESCRIPT_LANGUAGE_SERVER_PACKAGE;
const DEFAULT_VERSION = TYPESCRIPT_LANGUAGE_SERVER_VERSION;

type Pending = {
  resolve: (value: TypeScriptLanguageServerResponse) => void;
  reject: (error: Error) => void;
};

class TypeScriptLanguageServerRuntime {
  private process: any = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private pending = new Map<number | string, Pending>();
  private buffer = '';
  private cwd = '.';
  private version = DEFAULT_VERSION;

  constructor(private readonly runtime = new WebContainerRuntime()) {}

  async start(input: TypeScriptLanguageServerStartInput = {}) {
    if (this.process) return this.status();
    this.cwd = input.cwd ?? '.';
    this.version = input.version ?? DEFAULT_VERSION;
    if (input.install !== false) {
      await this.runtime.runCommand('pnpm', ['add', '-D', 'typescript@7.0.2', PACKAGE + '@' + this.version], this.cwd);
    }
    this.process = await this.runtime.spawnCommand('pnpm', ['exec', PACKAGE, '--stdio'], this.cwd);
    this.writer = this.process.input.getWriter();
    void this.readOutput(this.process.output);
    return this.status();
  }

  async request(input: TypeScriptLanguageServerRequestInput) {
    await this.ensureRunning();
    const promise = new Promise<TypeScriptLanguageServerResponse>((resolve, reject) => {
      this.pending.set(input.id, { resolve, reject });
    });
    await this.write(input);
    return promise;
  }

  async notify(input: TypeScriptLanguageServerNotificationInput) {
    await this.ensureRunning();
    await this.write(input);
    return { sent: true };
  }

  async stop() {
    const process = this.process;
    this.process = null;
    this.writer?.releaseLock();
    this.writer = null;
    for (const pending of this.pending.values()) pending.reject(new Error('Language server stopped'));
    this.pending.clear();
    if (process) await process.kill();
    return { stopped: true };
  }

  status(): TypeScriptLanguageServerStatus {
    return { running: Boolean(this.process), cwd: this.cwd, package: PACKAGE, version: this.version };
  }

  private async ensureRunning() {
    if (!this.process) await this.start({ cwd: this.cwd, install: false, version: this.version });
  }

  private async write(message: object) {
    if (!this.writer) throw new Error('Language server input is unavailable');
    const body = JSON.stringify({ jsonrpc: '2.0', ...message });
    const frame = 'Content-Length: ' + new TextEncoder().encode(body).byteLength + '\r\n\r\n' + body;
    await this.writer.write(frame);
  }

  private async readOutput(output: ReadableStream<string>) {
    const reader = output.getReader();
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        this.buffer += next.value;
        this.consumeFrames();
      }
    } catch (error) {
      for (const pending of this.pending.values()) pending.reject(error instanceof Error ? error : new Error(String(error)));
      this.pending.clear();
    } finally {
      reader.releaseLock();
      this.process = null;
      this.writer?.releaseLock();
      this.writer = null;
    }
  }

  private consumeFrames() {
    while (true) {
      const separator = this.buffer.indexOf('\r\n\r\n');
      if (separator < 0) return;
      const header = this.buffer.slice(0, separator);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = this.buffer.slice(separator + 4);
        continue;
      }
      const length = Number(match[1]);
      const start = separator + 4;
      if (this.buffer.length - start < length) return;
      const body = this.buffer.slice(start, start + length);
      this.buffer = this.buffer.slice(start + length);
      const response = JSON.parse(body) as TypeScriptLanguageServerResponse;
      if (response.id !== undefined && response.id !== null) {
        this.pending.get(response.id)?.resolve(response);
        this.pending.delete(response.id);
      }
    }
  }
}

const runtime = new TypeScriptLanguageServerRuntime();

export const TypeScriptLanguageServerServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.typescriptLanguageServer',
  name: 'TypeScriptLanguageServerService',
  version: '1.0.0',
  operations: {
    start: { id: 'TypeScriptLanguageServerService.start', name: 'start', handler: async (input: TypeScriptLanguageServerStartInput) => runtime.start(input) },
    request: { id: 'TypeScriptLanguageServerService.request', name: 'request', handler: async (input: TypeScriptLanguageServerRequestInput) => runtime.request(input) },
    notify: { id: 'TypeScriptLanguageServerService.notify', name: 'notify', handler: async (input: TypeScriptLanguageServerNotificationInput) => runtime.notify(input) },
    stop: { id: 'TypeScriptLanguageServerService.stop', name: 'stop', handler: async () => runtime.stop() },
    status: { id: 'TypeScriptLanguageServerService.status', name: 'status', handler: async () => runtime.status() },
  },
});

export const TypeScriptLanguageServerServiceFacade = {
  id: TypeScriptLanguageServerServiceDefinition.id,
  name: TypeScriptLanguageServerServiceDefinition.name,
  version: TypeScriptLanguageServerServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: TypeScriptLanguageServerServiceDefinition,
  createInstance: () => createService(TypeScriptLanguageServerServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    const instance: IService = createService(TypeScriptLanguageServerServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
