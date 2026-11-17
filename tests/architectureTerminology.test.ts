import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('FrnlTS architecture terminology', () => {
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

  it('describes the direct React component model', () => {
    expect(readme).toContain('**React components** are the concrete UI entities.');
    expect(readme).toContain('useFrnlComponent()');
  });

  it('describes page orchestration without implying a second slot hierarchy', () => {
    expect(readme).toContain('## Page orchestration');
    expect(readme).toContain('Pages are application scope, not a second component hierarchy.');
    expect(readme).not.toMatch(/^## Slots$/m);
    expect(readme).not.toContain('slot changes');
  });
});
