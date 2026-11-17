import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Negative Boundary Test Fixtures (Contract Enforcement)', () => {
  it('executes and verifies all 12 negative boundary fixtures (Fixtures 01-12) + positive controls', () => {
    const scriptPath = path.resolve(__dirname, 'boundary_fixtures.test.py');
    const output = execSync(`python3 "${scriptPath}" 2>&1`, {
      encoding: 'utf-8',
    });
    expect(output).toContain('Ran 14 tests');
    expect(output).toContain('OK');
  });
});
