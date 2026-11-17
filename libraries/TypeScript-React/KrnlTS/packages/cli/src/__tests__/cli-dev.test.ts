import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { runDev } from '../commands/dev.js';

const CLI_BIN = path.resolve(__dirname, '../../dist/bin/krnl.js');

function runCli(args: string[], cwd?: string): { stdout: string; status: number } {
  try {
    const stdout = execSync(`node "${CLI_BIN}" ${args.join(' ')}`, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, status: 0 };
  } catch (err: any) {
    return { stdout: (err.stdout || '') + (err.stderr || ''), status: err.status ?? 1 };
  }
}

describe('Krnl CLI dev command integration', () => {
  it('boots dev server with --dry-run exiting cleanly (exit 0)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-dev-dry-'));
    try {
      const dev = await runDev(tmpDir, { port: 8999, dryRun: true });
      expect(dev.port).toBe(8999);
      expect(runCli(['dev', '--dry-run', '--port', '8999', tmpDir]).status).toBe(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
