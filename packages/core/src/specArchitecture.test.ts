import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('KrnlTS canonical implementation specification', () => {
  const spec = readFileSync(resolve(process.cwd(), '../../IMPLEMENTATION-SPEC.md'), 'utf8');

  it('names the implemented queue runtime and control plane', () => {
    expect(spec).toContain('KrnlQ');
    expect(spec).toContain('p-queue');
    expect(spec).not.toContain('BullMQ');
    expect(spec).toContain('KRUSBL := ecosystem promotion/control plane');
    expect(spec).not.toContain('CRUCIBLE');
  });

  it('does not duplicate or contradict dependency ownership', () => {
    expect(spec).toContain('KLOKS | FLOKS | SKIPO | KRUSBL');
    expect(spec).not.toContain('KRUSBL | KRUSBL');
  });
});
