import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
async function fixture(t) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'aiko-artifact-contract-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-b', 'main');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  git(cwd, 'config', 'user.name', 'Contract Test');
  await mkdir(path.join(cwd, 'api'), { recursive: true });
  await writeFile(path.join(cwd, 'api/index.js'), 'export default "committed";\n');
  git(cwd, 'add', 'api/index.js');
  git(cwd, 'commit', '-m', 'baseline');
  return cwd;
}

test('artifact freshness verifier passes when committed Worker artifact matches HEAD', async t => {
  const cwd = await fixture(t);
  const { verifyBuildArtifactsFreshness } = await import('./verify-build-artifacts-freshness.mjs');
  const result = await verifyBuildArtifactsFreshness({ cwd, artifactPaths: ['api/index.js'] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.changedPaths, []);
  assert.deepEqual(result.missingPaths, []);
});

test('artifact freshness verifier fails when a rebuild changes a committed Worker artifact', async t => {
  const cwd = await fixture(t);
  await writeFile(path.join(cwd, 'api/index.js'), 'export default "rebuilt";\n');
  const { verifyBuildArtifactsFreshness } = await import('./verify-build-artifacts-freshness.mjs');
  const result = await verifyBuildArtifactsFreshness({ cwd, artifactPaths: ['api/index.js'] });
  assert.equal(result.ok, false);
  assert.ok(result.changedPaths.includes('api/index.js'));
});

test('artifact freshness verifier fails when a required generated artifact is missing', async t => {
  const cwd = await fixture(t);
  await rm(path.join(cwd, 'api/index.js'));
  const { verifyBuildArtifactsFreshness } = await import('./verify-build-artifacts-freshness.mjs');
  const result = await verifyBuildArtifactsFreshness({ cwd, artifactPaths: ['api/index.js'] });
  assert.equal(result.ok, false);
  assert.ok(result.missingPaths.includes('api/index.js'));
});

test('artifact freshness verifier reports newly generated untracked Worker artifacts', async t => {
  const cwd = await fixture(t);
  git(cwd, 'rm', 'api/index.js');
  git(cwd, 'commit', '-m', 'remove generated artifact');
  await mkdir(path.join(cwd, 'api'), { recursive: true });
  await writeFile(path.join(cwd, 'api/index.js'), 'export default "new";\n');
  const { verifyBuildArtifactsFreshness } = await import('./verify-build-artifacts-freshness.mjs');
  const result = await verifyBuildArtifactsFreshness({ cwd, artifactPaths: ['api/index.js'] });
  assert.equal(result.ok, false);
  assert.ok(result.changedPaths.includes('api/index.js'));
});
