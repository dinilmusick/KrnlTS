import { describe, expect, it, vi } from 'vitest';
import { DevelopmentRuntime } from './developmentService.js';

describe('DevelopmentRuntime diagnostics', () => {
  it('returns command, duration and structured build diagnostics to callers', async () => {
    const webContainer = {
      run: vi.fn().mockResolvedValue({
        exitCode: 2,
        output: 'src/main.ts(8,4): error TS2322: Type string is not assignable to number.',
        command: 'pnpm build',
        durationMs: 431,
        diagnostics: [{
          source: 'typescript', severity: 'error', file: 'src/main.ts',
          line: 8, column: 4, code: 'TS2322',
          message: 'Type string is not assignable to number.',
        }],
      }),
    };
    const result = await new DevelopmentRuntime(webContainer as any).run({ provider: 'webcontainer', task: 'build' });
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(2);
    expect(result.command).toBe('pnpm build');
    expect(result.durationMs).toBe(431);
    expect(result.diagnostics?.[0]?.code).toBe('TS2322');
  });
});
