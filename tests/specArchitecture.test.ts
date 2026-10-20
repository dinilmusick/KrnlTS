import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('KrnlTS canonical specification', () => {
  const spec = readFileSync(new URL('../IMPLEMENTATION-SPEC.md', import.meta.url), 'utf8');

  it('describes the implemented KrnlQ runtime rather than BullMQ', () => {
    expect(spec).toContain('KrnlQ');
    expect(spec).toContain('p-queue');
    expect(spec).not.toContain('BullMQ execution engine');
  });

  it('uses KRUSBL as the ecosystem control-plane name', () => {
    expect(spec).toContain('KRUSBL');
    expect(spec).not.toContain('CRUCIBLE');
  });
});
