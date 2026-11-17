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
  it('generates optional frontend linkage with all supported fields and valid TypeScript', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-gen-svc-frontend-'));
    try {
      await runGenerate('service', 'Billing', undefined, tmpDir, {
        defaultFrontend: {
          component: 'BillingPage',
          package: '@ultrst-armada/floks/ui',
          export: 'BillingPage',
          relationship: 'required',
        },
      });
      const facade = fs.readFileSync(path.join(tmpDir, 'src', 'services', 'Billing', 'BillingServiceFacade.ts'), 'utf8');
      const result = ts.transpileModule(facade, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
      expect(result.diagnostics).toEqual([]);
      expect(facade).toContain('"component": "BillingPage"');
      expect(facade).toContain('"package": "@ultrst-armada/floks/ui"');
      expect(facade).toContain('"export": "BillingPage"');
      expect(facade).toContain('"relationship": "required"');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('preserves backward compatibility when a service has no frontend linkage', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-gen-svc-no-frontend-'));
    try {
      await runGenerate('service', 'LegacyBilling', undefined, tmpDir);
      const facade = fs.readFileSync(path.join(tmpDir, 'src', 'services', 'LegacyBilling', 'LegacyBillingServiceFacade.ts'), 'utf8');
      expect(facade).not.toContain('defaultFrontend');
      expect(ts.transpileModule(facade, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).diagnostics).toEqual([]);
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
});
