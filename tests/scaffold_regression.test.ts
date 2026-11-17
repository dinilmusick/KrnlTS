import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Scaffold Regression & Tightening Suites', () => {
  it('executes and verifies all scaffold regression checks', () => {
    const scriptPath = path.resolve(__dirname, 'scaffold_regression.py');
    const output = execSync(`python3 "${scriptPath}" 2>&1`, {
      encoding: 'utf-8',
    });
    // Keep the count flexible as scaffold coverage grows; the suite must still run.
    expect(output).toMatch(/Ran \d+ tests/);
    expect(output).toContain('OK');
  }, 30_000);
});
