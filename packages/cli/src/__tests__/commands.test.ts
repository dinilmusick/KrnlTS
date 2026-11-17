import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runValidate } from '../commands/validate.js';
import { generateMagneticDeclarations } from '../commands/watch.js';
import { runGenerate } from '../commands/generate.js';

describe('Krnl CLI commands', () => {
  it('returns true for a valid project', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-val-cmd-'));
    try {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'index.ts'), `export const status = 'ready';\n`);
      expect(await runValidate(tmpDir)).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('generates magnetic declarations referencing @ultrst-armada/krnl-core', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-cli-test-'));
    try {
      generateMagneticDeclarations(tmpDir);
      const dtsPath = path.join(tmpDir, 'krnl-magnetic.d.ts');
      expect(fs.existsSync(dtsPath)).toBe(true);
      const content = fs.readFileSync(dtsPath, 'utf8');
      expect(content).toContain("@ultrst-armada/krnl-core");
      expect(content).not.toContain("@dinilmusick");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds functionality orchestrations with @ultrst-armada/krnl-core imports', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-cli-gen-'));
    try {
      await runGenerate('functionality-orchestration', 'TestUser', undefined, tmpDir);
      const orchFile = path.join(tmpDir, 'src', 'orchestrations', 'TestUser', 'TestUserFunctionalityOrchestration.ts');
      expect(fs.existsSync(orchFile)).toBe(true);
      const content = fs.readFileSync(orchFile, 'utf8');
      expect(content).toContain("import { FunctionalityOrchestration } from '@ultrst-armada/krnl-core';");
      expect(content).not.toContain('@dinilmusick');
      expect(content).not.toContain('extends Entity');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
