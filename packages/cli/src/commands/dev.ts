import { runBuild } from './build.js';
import { runWatch } from './watch.js';

export function runDev(root: string = process.cwd()): number {
  const build = runBuild(root);
  if (build !== 0) return build;
  runWatch(root);
  return 0;
}
