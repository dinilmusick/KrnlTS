import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import * as ts from 'typescript';
import { runValidate } from '../commands/validate.js';
import { runBuild } from '../commands/build.js';
import { runDev } from '../commands/dev.js';
import { generateMagneticDeclarations } from '../commands/watch.js';
import { runGenerate } from '../commands/generate.js';

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

describe('Krnl CLI Real Integration Suite', () => {
  it('executes --help cleanly with zero misleading contracts', () => {
    const { stdout, status } = runCli(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('Krnl Backend Service Framework CLI');
    expect(stdout).toContain('dev');
    expect(stdout).toContain('build');
    expect(stdout).toContain('validate');
    expect(stdout).toContain('sync');
    expect(stdout).toContain('generate');
  });

  it('runs validate successfully on a clean project structure (exit 0)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-val-pass-'));
    try {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'index.ts'), `export const serviceInfo = { name: 'valid-svc' };\n`);

      const isValid = await runValidate(tmpDir);
      expect(isValid).toBe(true);
      expect(runCli(['validate', tmpDir]).status).toBe(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('runs validate and catches violations with exit code 1', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-val-fail-'));
    try {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      const longContent = Array(205).fill(0).map((_, i) => `export const val_${i} = ${i};`).join('\n') + '\n';
      fs.writeFileSync(path.join(srcDir, 'monolith.ts'), longContent);

      expect(await runValidate(tmpDir)).toBe(false);
      expect(runCli(['validate', tmpDir]).status).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('runs build successfully on valid project (exit 0)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-bld-pass-'));
    try {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'index.ts'), `export const status = 'ready';\n`);

      const res = await runBuild(tmpDir);
      expect(res.success).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'krnl-magnetic.d.ts'))).toBe(true);
      expect(runCli(['build', tmpDir]).status).toBe(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
