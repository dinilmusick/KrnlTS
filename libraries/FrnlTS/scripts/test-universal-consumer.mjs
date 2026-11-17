import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnlts-universal-consumer-'));
const packDir = path.join(temp, 'pack');
const consumerDir = path.join(temp, 'consumer');
fs.mkdirSync(packDir);
fs.mkdirSync(consumerDir);

try {
  execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', packDir], {
    cwd: root,
    stdio: 'inherit',
  });
  const tarball = fs.readdirSync(packDir).find((name) => name.endsWith('.tgz'));
  assert.ok(tarball, 'npm pack must produce a tarball');

  execFileSync('npm', [
    'install',
    '--prefix', consumerDir,
    '--omit=peer',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    path.join(packDir, tarball),
  ], { stdio: 'inherit' });

  const probe = [
    "import assert from 'node:assert/strict';",
    "import { createRequire } from 'node:module';",
    "const require = createRequire(import.meta.url);",
    "assert.throws(() => require.resolve('react'), { code: 'MODULE_NOT_FOUND' });",
    "const runtime = await import('@ultrst-armada/frnlts/runtime');",
    "assert.equal(typeof runtime.createLifecycle, 'function');",
    "assert.equal(typeof runtime.createFrnlFrontendApi, 'function');",
    "assert.equal(typeof runtime.createDefaultFrnlInputContract, 'function');",
    "console.log('Packed headless runtime imported without React.');",
  ].join("\n");
  execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
    cwd: consumerDir,
    stdio: 'inherit',
  });
  console.log(JSON.stringify({
    package: manifest.name,
    version: manifest.version,
    consumer: 'packed npm tarball',
    peerDependenciesOmitted: true,
    entryPoint: '@ultrst-armada/frnlts/runtime',
    result: 'passed',
  }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
