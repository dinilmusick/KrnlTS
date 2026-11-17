import { describe, expect, it } from 'vitest';
import { captureDevelopmentProcess, parseDevelopmentDiagnostics } from './webContainerService.js';

describe('parseDevelopmentDiagnostics', () => {
  it('captures live dev-server output while preserving the consumer stream', async () => {
    const process = {
      output: new ReadableStream<string>({ start(controller) { controller.enqueue('src/main.ts(3,2): error TS1005: expected token'); controller.close(); } }),
      exit: Promise.resolve(1),
    };
    const captured = captureDevelopmentProcess(process);
    const result = await captured.logs;
    expect(result.exitCode).toBe(1);
    expect(result.diagnostics[0]?.code).toBe('TS1005');
    const reader = captured.output.getReader();
    expect((await reader.read()).value).toContain('TS1005');
    reader.releaseLock();
  });

  it('extracts TypeScript file, line, column and diagnostic code', () => {
    const result = parseDevelopmentDiagnostics('src/app.tsx(12,8): error TS2322: Type string is not assignable to number.', 2);
    expect(result).toEqual([{
      source: 'typescript', severity: 'error', file: 'src/app.tsx',
      line: 12, column: 8, code: 'TS2322',
      message: 'Type string is not assignable to number.',
    }]);
  });

  it('extracts ESLint and bundler errors and de-duplicates repeated lines', () => {
    const result = parseDevelopmentDiagnostics([
      'src/app.ts:4:2 error Unexpected any @typescript-eslint/no-explicit-any',
      '✘ [ERROR] Build failed with 1 error:',
      '✘ [ERROR] Build failed with 1 error:',
    ].join('\n'), 1);
    expect(result.map(item => item.source)).toEqual(['eslint', 'bundler']);
    expect(result.every(item => item.severity === 'error')).toBe(true);
  });

  it('provides a useful diagnostic for non-zero exits with unstructured output', () => {
    const result = parseDevelopmentDiagnostics('process terminated unexpectedly', 137);
    expect(result).toEqual([{
      source: 'unknown', severity: 'error',
      message: 'Command failed with exit code 137; inspect captured output for details.',
    }]);
  });

  it('preserves package-manager warnings without treating them as build failures', () => {
    const result = parseDevelopmentDiagnostics('WARN deprecated package detected', 0);
    expect(result[0]?.severity).toBe('warning');
    expect(result[0]?.source).toBe('package-manager');
  });
});
