import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const sourceManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageName = sourceManifest.name;
const version = sourceManifest.version;
assert.ok(packageName && version, 'package name and version are required');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gutts-packed-consumer-'));
const packDir = path.join(temp, 'pack');
const portableConsumerDir = path.join(temp, 'portable-consumer');
const s3ConsumerDir = path.join(temp, 's3-consumer');
const aggregateConsumerDir = path.join(temp, 'aggregate-consumer');
const unpackedDir = path.join(temp, 'unpacked');
for (const dir of [packDir, portableConsumerDir, s3ConsumerDir, aggregateConsumerDir, unpackedDir]) fs.mkdirSync(dir);

const install = (prefix, ...packages) => execFileSync('npm', ['install', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', ...packages], { stdio: 'inherit' });
const run = (cwd, code) => execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd, stdio: 'inherit' });
try {
  execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', packDir], { cwd: root, encoding: 'utf8' });
  const filename = fs.readdirSync(packDir).find(name => name.endsWith('.tgz'));
  assert.ok(filename, 'npm pack must produce a local tarball');
  const tarball = path.join(packDir, filename);
  execFileSync('tar', ['-xzf', tarball, '-C', unpackedDir, '--strip-components=1']);
  const manifest = JSON.parse(fs.readFileSync(path.join(unpackedDir, 'package.json'), 'utf8'));
  assert.equal(manifest.name, packageName);
  assert.equal(manifest.version, version);
  assert.equal(manifest.main, manifest.module, 'main and module must agree');

  for (const [key, value] of Object.entries(manifest.exports)) {
    const targets = [];
    const walk = item => {
      if (typeof item === 'string') targets.push(item);
      else if (item && typeof item === 'object') Object.values(item).forEach(walk);
    };
    walk(value);
    for (const target of targets) assert.ok(fs.existsSync(path.join(unpackedDir, target)), `Packed export target missing: ${key} -> ${target}`);
  }
  const s3Export = manifest.exports['./storage/s3'];
  assert.ok(s3Export, 'packed package must expose ./storage/s3');
  assert.equal(s3Export.import, './dist/storage/s3.js');
  assert.equal(s3Export.types, './dist/storage/s3.d.ts');
  assert.ok(fs.existsSync(path.join(unpackedDir, s3Export.import)), 'packed S3 JavaScript entrypoint must exist');
  assert.ok(fs.existsSync(path.join(unpackedDir, s3Export.types)), 'packed S3 declaration must exist');

  // General portable entrypoints must work without any optional provider peers.
  install(portableConsumerDir, tarball);
  const portableSpecs = [
    '@dinilmusick/gutts',
    '@dinilmusick/gutts/browser',
    '@dinilmusick/gutts/worker',
    '@dinilmusick/gutts/server',
    '@dinilmusick/gutts/server/auth',
    '@dinilmusick/gutts/server/models',
    '@dinilmusick/gutts/storage/google-drive',
  ];
  for (const specifier of portableSpecs) run(portableConsumerDir, `await import(${JSON.stringify(specifier)})`);

  // S3 must import with its AWS peer installed and Google SDK deliberately absent.
  install(s3ConsumerDir, tarball, '@aws-sdk/client-s3@^3.1164.0', '@types/node@^22');
  run(s3ConsumerDir, `
    import assert from 'node:assert/strict';
    const s3 = await import('@dinilmusick/gutts/storage/s3');
    assert.equal(typeof s3.S3Client, 'function');
    assert.equal(typeof s3.PutObjectCommand, 'function');
    try { import.meta.resolve('googleapis'); assert.fail('googleapis must not be installed in the S3-only consumer'); }
    catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
    console.log('S3 subpath imported without googleapis');
  `);

  // The storage aggregate exports S3 commands cleanly without bundling googleapis.
  install(aggregateConsumerDir, tarball, '@aws-sdk/client-s3@^3.1164.0');
  run(aggregateConsumerDir, `
    import assert from 'node:assert/strict';
    const storage = await import('@dinilmusick/gutts/storage');
    assert.equal(typeof storage.S3Client, 'function');
    assert.equal(typeof storage.PutObjectCommand, 'function');
    assert.equal(storage.google, undefined);
    console.log('Storage exports verified cleanly without googleapis');
  `);

  const typeFixture = `import { S3Client, PutObjectCommand } from "@dinilmusick/gutts/storage/s3";
const client: S3Client = new S3Client({});
const command = new PutObjectCommand({ Bucket: "fixture", Key: "fixture", Body: "ok" });
void client; void command;
`;
  fs.writeFileSync(path.join(s3ConsumerDir, 'consumer.ts'), typeFixture);
  execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['--noEmit', '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.ts'], { cwd: s3ConsumerDir, stdio: 'inherit' });

  console.log(JSON.stringify({
    package: packageName,
    version,
    tarball: filename,
    s3Consumer: 'AWS SDK installed; googleapis absent; import and declarations verified',
    aggregateConsumer: 'S3Client and PutObjectCommand exports verified without googleapis',
    portableConsumerImportsWithoutOptionalPeers: portableSpecs,
  }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
