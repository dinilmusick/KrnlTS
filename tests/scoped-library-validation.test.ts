import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

describe('Skipo Application Scoped Library Governance (Aspect 18)', () => {
  const validatorScript = path.resolve(__dirname, '../checklists/18_scoped_library_governance.py');

  it('passes on clean application-prefixed assets and detects promotable generic functions', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skipo-scoped-test-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'my-studio' }));
      const libDir = path.join(tmp, 'src', 'libraries', 'rendering_concepts');
      fs.mkdirSync(libDir, { recursive: true });

      const code = `
export interface MyStudioRenderOptions {
  width: number;
  height: number;
}

export function myStudioFormatCanvas(opts: MyStudioRenderOptions): string {
  return \`\${opts.width}x\${opts.height}\`;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
`;
      fs.writeFileSync(path.join(libDir, 'canvas.ts'), code);

      const out = execSync(`python3 ${validatorScript} ${tmp}`, { encoding: 'utf-8' });
      expect(out).toContain('Found 1 promotable asset(s)');
      expect(out).toContain('clampNumber');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('fails with violation when contextual library assets miss the application name', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skipo-scoped-invalid-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'my-studio' }));
      const libDir = path.join(tmp, 'src', 'libraries', 'rendering_concepts');
      fs.mkdirSync(libDir, { recursive: true });

      const code = `
export interface RenderOptions {
  width: number;
}

export function formatCanvas(opts: RenderOptions): string {
  return \`\${opts.width}\`;
}
`;
      fs.writeFileSync(path.join(libDir, 'canvas.ts'), code);

      let failed = false;
      try {
        execSync(`python3 ${validatorScript} ${tmp}`, { encoding: 'utf-8' });
      } catch (err: any) {
        failed = true;
        expect(err.stdout).toContain('app-library-asset-naming');
        expect(err.stdout).toContain("Application library interface 'RenderOptions'");
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
