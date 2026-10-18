import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runValidate } from '../commands/validate.js';
import { generateMagneticDeclarations } from '../commands/watch.js';
import { runGenerate } from '../commands/generate.js';

describe('Krnl CLI commands', () => {
  it('returns true for a valid project', async () => {
    expect(await runValidate(process.cwd())).toBe(true);
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

  it('scaffolds entities with @ultrst-armada/krnl-core imports', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krnl-cli-gen-'));
    try {
      await runGenerate('entity', 'TestUser', undefined, tmpDir);
      const entityFile = path.join(tmpDir, 'src', 'entities', 'TestUser', 'TestUser.ts');
      expect(fs.existsSync(entityFile)).toBe(true);
      const content = fs.readFileSync(entityFile, 'utf8');
      expect(content).toContain('import { Entity, KrnlMagneticLoader } from "@ultrst-armada/krnl-core";');
      expect(content).not.toContain('@dinilmusick');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
