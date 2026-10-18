import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
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

  it('runs build and aborts on validation failure (exit 1)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-bld-fail-'));
    try {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      const longContent = Array(210).fill(0).map((_, i) => `export const val_${i} = ${i};`).join('\n') + '\n';
      fs.writeFileSync(path.join(srcDir, 'bad.ts'), longContent);

      const res = await runBuild(tmpDir);
      expect(res.success).toBe(false);
      expect(runCli(['build', tmpDir]).status).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('generates watch ambient declarations', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-watch-test-'));
    try {
      generateMagneticDeclarations(tmpDir);
      const dts = path.join(tmpDir, 'krnl-magnetic.d.ts');
      expect(fs.existsSync(dts)).toBe(true);
      expect(fs.readFileSync(dts, 'utf8')).toContain('@ultrst-armada/krnl-core');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds functionality orchestration correctly via generate command', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-gen-orch-'));
    try {
      await runGenerate('functionality-orchestration', 'UserAccount', undefined, tmpDir);
      const orchFile = path.join(tmpDir, 'src', 'orchestrations', 'UserAccount', 'UserAccountFunctionalityOrchestration.ts');
      expect(fs.existsSync(orchFile)).toBe(true);
      const content = fs.readFileSync(orchFile, 'utf8');
      expect(content).toContain('class UserAccountFunctionalityOrchestration extends FunctionalityOrchestration');
      expect(content).not.toContain('extends Entity');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds service correctly via generate command', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-gen-svc-'));
    try {
      await runGenerate('service', 'Billing', undefined, tmpDir);
      const svcDir = path.join(tmpDir, 'src', 'services', 'Billing');
      expect(fs.existsSync(path.join(svcDir, 'BillingServiceFacade.ts'))).toBe(true);
      expect(fs.existsSync(path.join(svcDir, 'libraries', 'BillingConcepts', 'index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(svcDir, 'libraries', 'BillingConcepts', 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(svcDir, 'tests', 'BillingServiceFacade.test.ts'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds functionality quad-unit without forced state by default', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-gen-func-'));
    try {
      await runGenerate('functionality', 'ProcessPayment', undefined, tmpDir);
      const funcDir = path.join(tmpDir, 'src', 'functionalities', 'ProcessPayment');
      expect(fs.existsSync(path.join(funcDir, 'main_function', 'logic.ts'))).toBe(true);
      expect(fs.existsSync(path.join(funcDir, 'state_data', 'state.ts'))).toBe(false);
      expect(fs.existsSync(path.join(funcDir, 'helper_functions', 'helper.ts'))).toBe(true);
      expect(fs.existsSync(path.join(funcDir, 'events', 'events.ts'))).toBe(true);
      expect(fs.existsSync(path.join(funcDir, 'manifest.json'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds service-owned library into service directory and not global backend libraries', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-gen-lib-'));
    try {
      await runGenerate('library', 'TaxCalculator', 'Billing', tmpDir);
      const libDir = path.join(tmpDir, 'src', 'services', 'Billing', 'libraries', 'TaxCalculatorConcepts');
      expect(fs.existsSync(path.join(libDir, 'definitions.ts'))).toBe(true);
      expect(fs.existsSync(path.join(libDir, 'functions.ts'))).toBe(true);
      expect(fs.existsSync(path.join(libDir, 'index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(libDir, 'manifest.json'))).toBe(true);

      // Invariant: no backend libraries created under src/backend/libraries/
      expect(fs.existsSync(path.join(tmpDir, 'src', 'backend', 'libraries', 'TaxCalculatorConcepts'))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

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
