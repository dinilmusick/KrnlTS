import { spawnSync } from 'node:child_process';
import { runValidate } from './validate.js';

export function runBuild(root: string = process.cwd()): number {
  const validation = runValidate(root);
  if (validation !== 0) return validation;
  const result = spawnSync('pnpm', ['exec', 'tsc', '--noEmit'], { cwd: root, stdio: 'inherit' });
  return result.status ?? 1;
}
