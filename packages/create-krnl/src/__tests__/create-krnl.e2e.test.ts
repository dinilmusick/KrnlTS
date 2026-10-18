import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const CREATE_KRNL_BIN = path.resolve(__dirname, '../../dist/index.js');
const CLI_BIN = path.resolve(__dirname, '../../../cli/dist/bin/krnl.js');
const MONOREPO_ROOT = path.resolve(__dirname, '../../../../');

describe('create-krnl End-to-End Scaffolding & Verification', () => {
  it('scaffolds project and validates namespace, typecheck, validation, and build with zero manual fixes', () => {
    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-e2e-'));
    const appName = 'e2e-krnl-app';
    const appDir = path.join(sandboxDir, appName);

    try {
      // 1. Run create-krnl to scaffold project
      execSync(`node "${CREATE_KRNL_BIN}" "${appName}"`, {
        cwd: sandboxDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      expect(fs.existsSync(appDir)).toBe(true);

      // 2. Verify package.json namespace and absence of stale brands
      const pkgPath = path.join(appDir, 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);
      const pkgContent = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgContent);

      expect(pkg.name).toBe(appName);
      expect(pkg.dependencies['@ultrst-armada/krnl-core']).toBeDefined();
      expect(pkgContent).not.toContain('@dinilmusick');
      expect(pkgContent).not.toContain('.skipo');

      // Verify directory structure
      expect(fs.existsSync(path.join(appDir, 'krnl', 'backend', 'orchestrations', 'App', 'AppFunctionalityOrchestration.ts'))).toBe(true);
      expect(fs.existsSync(path.join(appDir, 'krnl', 'backend', 'services', 'App', 'AppServiceFacade.ts'))).toBe(true);
      expect(fs.existsSync(path.join(appDir, 'krnl', 'frontend', 'orchestrations', 'App', 'App0.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(appDir, `${appName}.ts`))).toBe(true);
      expect(fs.existsSync(path.join(appDir, '.krnl'))).toBe(true);
      expect(fs.existsSync(path.join(appDir, '.skipo'))).toBe(false);

      // 3. Setup workspace resolution to simulate local clean install
      const appNodeModules = path.join(appDir, 'node_modules');
      fs.mkdirSync(appNodeModules, { recursive: true });

      // Link root node_modules contents for dev dependencies (typescript, vitest, react, etc.)
      const rootNodeModules = path.join(MONOREPO_ROOT, 'node_modules');
      const pnpmStore = path.join(rootNodeModules, '.pnpm');
      if (fs.existsSync(pnpmStore)) {
        try { fs.symlinkSync(pnpmStore, path.join(appNodeModules, '.pnpm')); } catch {}
      }

      if (fs.existsSync(rootNodeModules)) {
        for (const item of fs.readdirSync(rootNodeModules)) {
          if (item === '.pnpm' || item.startsWith('@')) continue;
          const link = path.join(appNodeModules, item);
          if (!fs.existsSync(link)) {
            try {
              const target = fs.realpathSync(path.join(rootNodeModules, item));
              fs.symlinkSync(target, link);
            } catch {}
          }
        }
      }

      // Link @ultrst-armada workspace packages
      const armadaDir = path.join(appNodeModules, '@ultrst-armada');
      fs.mkdirSync(armadaDir, { recursive: true });
      fs.symlinkSync(path.join(MONOREPO_ROOT, 'packages', 'core'), path.join(armadaDir, 'krnl-core'));
      fs.symlinkSync(path.join(MONOREPO_ROOT, 'packages', 'validate'), path.join(armadaDir, 'krnl-validate'));
      fs.symlinkSync(path.join(MONOREPO_ROOT, 'packages', 'cli'), path.join(armadaDir, 'krnl-cli'));
      fs.symlinkSync(MONOREPO_ROOT, path.join(armadaDir, 'krnl'));

      // Link @types
      const typesDir = path.join(rootNodeModules, '@types');
      if (fs.existsSync(typesDir)) {
        const appTypesDir = path.join(appNodeModules, '@types');
        fs.mkdirSync(appTypesDir, { recursive: true });
        for (const t of fs.readdirSync(typesDir)) {
          const link = path.join(appTypesDir, t);
          if (!fs.existsSync(link)) {
            try {
              const target = fs.realpathSync(path.join(typesDir, t));
              fs.symlinkSync(target, link);
            } catch {}
          }
        }
      }

      // Generate ambient declarations first
      execSync(`node "${CLI_BIN}" watch`, {
        cwd: appDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(fs.existsSync(path.join(appDir, 'krnl-magnetic.d.ts'))).toBe(true);

      // 4. Run typecheck via tsc --noEmit
      const tscBin = path.join(rootNodeModules, '.bin', 'tsc');
      const tscCmd = fs.existsSync(tscBin) ? tscBin : 'tsc';
      let tscOut: string = '';
      try {
        tscOut = execSync(`${tscCmd} --noEmit`, {
          cwd: appDir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (err: any) {
        console.error('TSC OUTPUT:', err.stdout, err.stderr);
        throw new Error('TSC FAILED:\n' + err.stdout + '\n' + err.stderr);
      }
      expect(tscOut).toBeDefined();

      // 5. Run krnl validate
      const valOut = execSync(`node "${CLI_BIN}" validate`, {
        cwd: appDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(valOut).toContain('VALIDATION PASSED');

      // 6. Run krnl build
      const buildOut = execSync(`node "${CLI_BIN}" build`, {
        cwd: appDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(buildOut).toContain('completed successfully');

      // Ensure build succeeded with zero manual interventions
      expect(fs.existsSync(path.join(appDir, 'dist'))).toBe(true);
    } finally {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  }, 45000);
});
