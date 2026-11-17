import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Skipo package isolation', () => {
  const builder = readFileSync(new URL('../scripts/skipo_builder.py', import.meta.url), 'utf8');
  const validator = readFileSync(new URL('../scripts/validate_frnl.py', import.meta.url), 'utf8');

  it('resolves installed packages instead of requiring sibling repository clones', () => {
    expect(builder).toContain('import.meta.resolve');
    expect(builder).toContain('SKIPO_KLOKS_ROOT');
    expect(builder).toContain('SKIPO_FLOKS_ROOT');
    expect(builder).not.toContain('JS_ROOT = SKIPO_ROOT.parent');
    expect(builder).not.toContain('JS_ROOT / "Kloks"');
    expect(builder).not.toContain('JS_ROOT / "Floks"');
  });

  it('runs the CLI provided by the installed FrnlTS dependency', () => {
    expect(validator).toContain('["pnpm", "exec", "frnl", "validate"]');
    expect(validator).not.toContain('../FrnlTS');
    expect(validator).not.toContain('@ultrst-armada/frnlts-cli');
  });
});
