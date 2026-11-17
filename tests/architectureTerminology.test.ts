import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Kloks repository architecture terminology', () => {
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

  it('describes reusable service assets without retired entity wording', () => {
    expect(readme).toContain('service definitions');
    expect(readme).toContain('functionality orchestrations');
    expect(readme).not.toContain('entities, functionalities and concept libraries');
  });
});
