import { createService, createServiceDefinition, type IService, type ServiceDefinition } from '@ultrst-armada/krnl';
import { WebContainerRuntime } from './webContainerService.js';
import type { CodeValidationInput, CodeValidationResult, ValidationDiagnostic, ValidationLayer } from './codeValidationTypes.js';

const COMMANDS: Record<Exclude<ValidationLayer, 'law-l9'>, { command: string; args: string[] }> = {
  syntax: { command: 'pnpm', args: ['exec', 'tsc', '--noEmit'] },
  lint: { command: 'pnpm', args: ['run', 'lint', '--if-present'] },
  test: { command: 'pnpm', args: ['run', 'test', '--if-present'] },
  build: { command: 'pnpm', args: ['run', 'build', '--if-present'] },
  krnl: { command: 'pnpm', args: ['exec', 'krnl', 'validate'] },
  frnl: { command: 'pnpm', args: ['exec', 'frnl', 'validate'] },
  'lockfile-check': { command: 'pnpm', args: ['install', '--frozen-lockfile', '--ignore-scripts'] },
};
const DEFAULT_LAYERS: ValidationLayer[] = ['lockfile-check', 'syntax', 'lint', 'krnl', 'frnl'];
const commandText = (command: string, args: string[]) => [command, ...args].join(' ');

export class CodeValidationRuntime {
  constructor(private readonly runtime = new WebContainerRuntime()) {}
  async validate(input: CodeValidationInput = {}): Promise<CodeValidationResult> {
    if (input.files) await this.runtime.mount(input.files);
    const diagnostics: ValidationDiagnostic[] = [];
    if (input.install) {
      const installed = await this.runtime.runCommand('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], input.cwd, input.env);
      diagnostics.push({ layer: 'lockfile-check', ok: installed.exitCode === 0, exitCode: installed.exitCode, output: installed.output, command: 'pnpm install --frozen-lockfile --ignore-scripts' });
      if (installed.exitCode !== 0) return { ok: false, diagnostics, failedLayers: ['lockfile-check'] };
    }
    const layers = input.layers?.length ? input.layers : DEFAULT_LAYERS;
    for (const layer of layers) {
      if (layer === 'law-l9') {
        diagnostics.push(await this.validateLawL9(input.cwd, input.maxLines ?? 200));
        continue;
      }
      const spec = COMMANDS[layer];
      const result = await this.runtime.runCommand(spec.command, spec.args, input.cwd, input.env);
      diagnostics.push({ layer, ok: result.exitCode === 0, exitCode: result.exitCode, output: result.output, command: commandText(spec.command, spec.args) });
      if (result.exitCode !== 0) break;
    }
    return { ok: diagnostics.every((item) => item.ok), diagnostics, failedLayers: diagnostics.filter((item) => !item.ok).map((item) => item.layer) };
  }
  private async validateLawL9(cwd = '.', maxLines = 200): Promise<ValidationDiagnostic> {
    const script = `python3 -c 'import os,sys; bad=[]; root="src"; [bad.append(os.path.join(r,f)+": "+str(len(open(os.path.join(r,f),encoding="utf-8",errors="ignore").readlines()))+" lines") for r,_,fs in os.walk(root) for f in fs if f.endswith((".ts",".tsx",".js",".jsx")) and not f.endswith(".d.ts") and len(open(os.path.join(r,f),encoding="utf-8",errors="ignore").readlines())>200]; print("\\n".join(bad)); sys.exit(1 if bad else 0)'`;
    const result = await this.runtime.runCommand('sh', ['-lc', script], cwd);
    return { layer: 'law-l9', ok: result.exitCode === 0, exitCode: result.exitCode, output: result.output, command: script };
  }
}
const runtime = new CodeValidationRuntime();
export const CodeValidationServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.codeValidation', name: 'CodeValidationService', version: '1.1.0',
  operations: { validate: { id: 'CodeValidationService.validate', name: 'validate', handler: async (input: CodeValidationInput) => runtime.validate(input) } },
});
export const CodeValidationServiceFacade = {
  id: CodeValidationServiceDefinition.id, name: CodeValidationServiceDefinition.name, version: CodeValidationServiceDefinition.version,
  runtime: 'client' as const, deployment: 'local' as const, definition: CodeValidationServiceDefinition,
  createInstance: () => createService(CodeValidationServiceDefinition),
  execute: async <TIn = CodeValidationInput, TOut = CodeValidationResult>(op: string, input?: TIn) => {
    const instance: IService = createService(CodeValidationServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
