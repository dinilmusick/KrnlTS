import * as fs from 'node:fs';
import * as path from 'node:path';
import { runValidate } from './validate.js';

function snapshot(root: string): string {
  const parts: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) parts.push(full + ':' + fs.statSync(full).mtimeMs);
    }
  };
  walk(root);
  return parts.sort().join('|');
}

export function runWatch(root: string = process.cwd()): void {
  runValidate(root);
  let previous = snapshot(root);
  setInterval(() => {
    const next = snapshot(root);
    if (next !== previous) {
      previous = next;
      runValidate(root);
    }
  }, 500);
}
