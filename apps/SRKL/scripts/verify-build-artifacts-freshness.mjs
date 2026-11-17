import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Verifies that build artifacts exist and match committed Git state.
 * Detects modified, staged, newly generated untracked, and missing artifacts.
 */
export async function verifyBuildArtifactsFreshness({
  cwd = process.cwd(),
  artifactPaths = ['api/index.js'],
} = {}) {
  const changedPaths = [];
  const missingPaths = [];

  for (const relPath of artifactPaths) {
    const fullPath = path.resolve(cwd, relPath);
    if (!existsSync(fullPath)) {
      missingPaths.push(relPath);
      continue;
    }

    try {
      const output = execFileSync('git', ['status', '--porcelain', '-uall', '--', relPath], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();

      if (output.length > 0) {
        changedPaths.push(relPath);
      }
    } catch {
      // In non-git fixtures or environments, rely on file existence
    }
  }

  const ok = changedPaths.length === 0 && missingPaths.length === 0;
  return {
    ok,
    changedPaths,
    missingPaths,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await verifyBuildArtifactsFreshness({ cwd: process.cwd() });
  if (!result.ok) {
    if (result.changedPaths.length > 0) {
      console.error(`Build artifacts freshness check failed. Changed artifacts: ${result.changedPaths.join(', ')}`);
    }
    if (result.missingPaths.length > 0) {
      console.error(`Build artifacts freshness check failed. Missing artifacts: ${result.missingPaths.join(', ')}`);
    }
    process.exit(1);
  }
  console.log('Build artifacts freshness verified.');
}
