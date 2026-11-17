import { describe, expect, it } from 'vitest';
import { CodeValidationRuntime } from './codeValidationService.js';

describe('CodeValidationRuntime', () => {
  it('uses frozen lockfile installation and runs validation layers in order', async () => {
    const calls: string[] = [];
    const fake = {
      runCommand: async (command: string, args: string[]) => {
        calls.push([command, ...args].join(' '));
        return { exitCode: 0, output: '' };
      },
    };
    const result = await new CodeValidationRuntime(fake as any).validate({ layers: ['lockfile-check', 'syntax', 'krnl', 'frnl', 'build'] });
    expect(result.ok).toBe(true);
    expect(result.failedLayers).toEqual([]);
    expect(calls).toEqual([
      'pnpm install --frozen-lockfile --ignore-scripts',
      'pnpm exec tsc --noEmit',
      'pnpm exec krnl validate',
      'pnpm exec frnl validate',
      'pnpm run build --if-present',
    ]);
  });

  it('fails before framework validation when installation is not reproducible', async () => {
    const calls: string[] = [];
    const fake = {
      runCommand: async (command: string, args: string[]) => {
        calls.push([command, ...args].join(' '));
        return { exitCode: 1, output: 'ERR_PNPM_OUTDATED_LOCKFILE' };
      },
    };
    const result = await new CodeValidationRuntime(fake as any).validate({ install: true });
    expect(result.ok).toBe(false);
    expect(result.failedLayers).toEqual(['lockfile-check']);
    expect(calls).toEqual(['pnpm install --frozen-lockfile --ignore-scripts']);
  });
});
