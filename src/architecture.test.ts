import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx|js|cjs)$/.test(entry.name) ? [path] : [];
  });
}

describe('Kone architecture boundaries', () => {
  it('keeps source files within the 200-line limit', () => {
    const root = join(process.cwd(), 'src');
    const oversized = sourceFiles(root)
      .map(path => ({ path, lines: readFileSync(path, 'utf8').split('\n').length }))
      .filter(file => file.lines > 200)
      .map(file => `${relative(root, file.path)} (${file.lines})`);
    expect(oversized).toEqual([]);
  });

  it('keeps frontend controls and transport behind canonical boundaries', () => {
    const root = join(process.cwd(), 'src/frontend');
    const violations: string[] = [];
    for (const path of sourceFiles(root)) {
      const content = readFileSync(path, 'utf8');
      if (['<button', '<input', '<textarea', '<select'].some(token => content.includes(token))) {
        violations.push(`${relative(root, path)}: raw form control`);
      }
      if (content.includes('fetch(')) {
        violations.push(`${relative(root, path)}: direct fetch`);
      }
    }
    expect(violations).toEqual([]);
  });
});
