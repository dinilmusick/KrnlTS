import assert from 'node:assert/strict';

const requiredExports = [
  ['@dinilmusick/gutts', []],
  ['@dinilmusick/gutts/auth', ['createLuthAuthClient', 'LuthAuthClient']],
  ['@ultrst-armada/kloks', []],
  ['@ultrst-armada/kloks/auth', ['createLuthAuthClient', 'LuthAuthClient', 'DEFAULT_LUTH_URL']],
  ['@ultrst-armada/floks', []],
  ['@ultrst-armada/floks/auth', ['AuthPage', 'LuthAuthPage', 'LuthProtectedRoute', 'useLuthAuth']],
];

for (const [specifier, names] of requiredExports) {
  assert.ok(import.meta.resolve(specifier), `Unable to resolve package export: ${specifier}`);
  if (!names.length) continue;
  const namespace = await import(specifier);
  for (const name of names) assert.ok(name in namespace, `Missing ${name} from ${specifier}`);
  process.stdout.write(`resolved ${specifier}: ${names.join(', ')}\n`);
}
process.stdout.write('Published Luth package exports: PASS\n');
