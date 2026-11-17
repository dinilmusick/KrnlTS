import { WebContainerRuntime } from './webContainerService.js';
export interface CodeDiagnosticsInput { cwd?: string; file?: string; }
export interface CodeDiagnosticsResult { ok: boolean; output: string; command: string; }
export class CodeDiagnosticsService {
  constructor(private readonly runtime = new WebContainerRuntime()) {}
  async diagnostics(input: CodeDiagnosticsInput = {}): Promise<CodeDiagnosticsResult> {
    const args = ['exec', 'tsc', '--noEmit', '--pretty', 'false'];
    if (input.file) args.push(input.file);
    const result = await this.runtime.runCommand('pnpm', args, input.cwd);
    return { ok: result.exitCode === 0, output: result.output, command: ['pnpm', ...args].join(' ') };
  }
}
export const codeDiagnosticsService = new CodeDiagnosticsService();
