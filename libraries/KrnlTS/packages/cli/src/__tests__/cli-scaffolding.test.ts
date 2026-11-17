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
      await runGenerate('service', 'Billing', undefined, tmpDir, {
        defaultFrontend: { component: 'BillingPage', package: '@ultrst-armada/floks/ui' },
      });
      const svcDir = path.join(tmpDir, 'src', 'services', 'Billing');
      expect(fs.existsSync(path.join(svcDir, 'BillingServiceFacade.ts'))).toBe(true);
      expect(fs.existsSync(path.join(svcDir, 'libraries', 'BillingConcepts', 'index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(svcDir, 'libraries', 'BillingConcepts', 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(svcDir, 'tests', 'BillingServiceFacade.test.ts'))).toBe(true);
      const facade = fs.readFileSync(path.join(svcDir, 'BillingServiceFacade.ts'), 'utf8');
      expect(facade).toContain('defaultFrontend:');
      expect(facade).toContain('"component": "BillingPage"');
      expect(facade).toContain('"package": "@ultrst-armada/floks/ui"');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
